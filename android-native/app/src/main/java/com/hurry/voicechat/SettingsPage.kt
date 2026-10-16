package com.hurry.voicechat

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items as gridItems
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import io.socket.client.IO
import io.socket.emitter.Emitter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.math.min
import kotlin.math.roundToInt

private const val SETTINGS_API = "https://hurry-voice-chat-lz75.onrender.com"
private const val RAW = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"

data class RoomSettingsData(
    val roomDp: String = "",
    val roomName: String = "Room",
    val announcement: String = "",
    val isLocked: Boolean = false,
    val roomPassword: String = "",
    val micMode: Int = 10,
    val theme: String = "forest-night",
    val admin: List<String> = emptyList()
)

private data class RoomUser(val accountId: String, val name: String, val image: String)
private data class ThemeChoice(val id: String, val name: String, val image: String)

private val defaultThemes = listOf(
    ThemeChoice("forest-night", "Forest Night", RAW + "1784875884052~2.jpg"),
    ThemeChoice("mood-light", "Moon Light", RAW + "1784533036732~2.jpg")
)

private fun micModeImage(c: Int) = when (c) {
    5 -> RAW + "IMG_20261009_172932~2.jpg"
    10 -> RAW + "IMG_20261009_173133~2.jpg"
    else -> RAW + "IMG_20261009_172551.jpg"
}

private fun decodeDataUrl(url: String): Bitmap? = runCatching {
    val i = url.indexOf(','); if (i < 0) return null
    val bytes = Base64.decode(url.substring(i + 1), Base64.DEFAULT)
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
}.getOrNull()

private fun encodeDataUrl(bm: Bitmap): String {
    val o = ByteArrayOutputStream()
    bm.compress(Bitmap.CompressFormat.JPEG, 92, o)
    return "data:image/jpeg;base64," + Base64.encodeToString(o.toByteArray(), Base64.NO_WRAP)
}

private suspend fun readUri(context: Context, uri: android.net.Uri): String = withContext(Dispatchers.IO) {
    val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() } ?: error("no")
    require(bytes.size <= 10 * 1024 * 1024)
    val mime = context.contentResolver.getType(uri) ?: "image/jpeg"
    "data:$mime;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
}

private suspend fun saveRemote(roomId: String, userId: String, d: RoomSettingsData) = withContext(Dispatchers.IO) {
    if (roomId.isBlank()) return@withContext
    val p = JSONObject()
        .put("accountId", roomId).put("roomId", roomId).put("id", roomId)
        .put("roomName", d.roomName).put("name", d.roomName).put("Room Name", d.roomName)
        .put("roomDp", d.roomDp).put("image", d.roomDp).put("Room dp", d.roomDp)
        .put("announcement", d.announcement).put("message", d.announcement)
        .put("theme", d.theme).put("admin", JSONArray(d.admin))
        .put("isLocked", d.isLocked).put("roomPassword", d.roomPassword).put("micMode", d.micMode)
    val c = (URL("$SETTINGS_API/api/rooms").openConnection() as HttpURLConnection).apply {
        requestMethod = "PUT"; doOutput = true
        setRequestProperty("Content-Type", "application/json; charset=utf-8")
    }
    try {
        c.outputStream.use { it.write(p.toString().toByteArray()) }
        if (c.responseCode !in 200..299) error("Save failed: ${c.responseCode}")
    } finally { c.disconnect() }
    runCatching {
        val s = IO.socket(SETTINGS_API); s.connect()
        s.emit("room_settings_update", JSONObject()
            .put("roomId", roomId).put("userId", userId).put("roomOwnerId", roomId)
            .put("roomName", d.roomName).put("roomDp", d.roomDp)
            .put("announcement", d.announcement).put("micMode", d.micMode)
            .put("theme", d.theme).put("isLocked", d.isLocked).put("roomPassword", d.roomPassword))
        kotlinx.coroutines.delay(350); s.disconnect(); s.close()
    }
}

// ============================================================
// MAIN PAGE
// ============================================================
@Composable
fun RoomSettingPage(
    onBack: () -> Unit = {},
    roomOwnerId: String = "",
    roomData: RoomSettingsData? = null,
    onSave: (RoomSettingsData) -> Unit = {}
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var roomDp by remember { mutableStateOf(roomData?.roomDp ?: "") }
    var roomName by remember { mutableStateOf(roomData?.roomName ?: "Room") }
    var announcement by remember { mutableStateOf(roomData?.announcement ?: "") }
    var isLocked by remember { mutableStateOf(roomData?.isLocked ?: false) }
    var roomPassword by remember { mutableStateOf(roomData?.roomPassword ?: "") }
    var selectedMicMode by remember { mutableIntStateOf(roomData?.micMode ?: 10) }
    var selectedTheme by remember { mutableStateOf(roomData?.theme ?: "forest-night") }
    var admins by remember { mutableStateOf(roomData?.admin ?: emptyList()) }

    var showMicSheet by remember { mutableStateOf(false) }
    var showThemePage by remember { mutableStateOf(false) }
    var showLockCard by remember { mutableStateOf(false) }
    var showAnnSheet by remember { mutableStateOf(false) }
    var showNameSheet by remember { mutableStateOf(false) }
    var showAdminSheet by remember { mutableStateOf(false) }
    var showAdminHelp by remember { mutableStateOf(false) }

    var tempMic by remember { mutableIntStateOf(selectedMicMode) }
    var tempName by remember { mutableStateOf("") }
    var tempAnn by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var customTheme by remember { mutableStateOf<String?>(null) }

    var adminSearch by remember { mutableStateOf("") }
    var members by remember { mutableStateOf<List<RoomUser>>(emptyList()) }
    var saving by remember { mutableStateOf(false) }
    var cropSrc by remember { mutableStateOf<String?>(null) }

    val dpPick = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) scope.launch {
            runCatching { readUri(context, uri) }.onSuccess { cropSrc = it }
        }
    }
    val themePick = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) scope.launch {
            runCatching { readUri(context, uri) }
                .onSuccess { customTheme = it; selectedTheme = "custom"; showThemePage = false }
        }
    }

    DisposableEffect(roomOwnerId) {
        if (roomOwnerId.isBlank()) return@DisposableEffect onDispose { }
        val s = runCatching { IO.socket(SETTINGS_API) }.getOrNull()
            ?: return@DisposableEffect onDispose { }
        val l = Emitter.Listener { args ->
            val p = args.firstOrNull() as? JSONObject ?: return@Listener
            if (p.optString("roomId") != roomOwnerId) return@Listener
            val arr = p.optJSONArray("users") ?: JSONArray()
            val list = (0 until arr.length()).mapNotNull { i ->
                val o = arr.optJSONObject(i) ?: return@mapNotNull null
                val id = o.optString("accountId", o.optString("userId", o.optString("appLongId", "")))
                if (id.isBlank()) null else RoomUser(id,
                    o.optString("name", o.optString("userName", "User")),
                    o.optString("image", o.optString("dp", RAW + "default-avatar.png")))
            }
            android.os.Handler(android.os.Looper.getMainLooper()).post { members = list }
        }
        s.on("room_members_list", l); s.connect()
        s.emit("get_room_members", JSONObject().put("roomId", roomOwnerId))
        onDispose { s.off("room_members_list", l); s.disconnect(); s.close() }
    }

    fun doSave() {
        if (saving) return
        scope.launch {
            saving = true
            val d = RoomSettingsData(roomDp, roomName.trim().ifBlank { "Room" }, announcement,
                isLocked, roomPassword, selectedMicMode, selectedTheme, admins)
            runCatching { saveRemote(roomOwnerId, "", d) }
                .onSuccess { onSave(d); onBack() }
            saving = false
        }
    }

    Box(Modifier.fillMaxSize().background(Color.White)) {
        Column(Modifier.fillMaxSize()) {
            // ===== TOP BAR =====
            Row(
                Modifier.fillMaxWidth().background(Color.White).statusBarsPadding()
                    .padding(horizontal = 8.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, null, tint = Color(0xFF1F2937), modifier = Modifier.size(24.dp))
                }
                Text("Room Setting", Modifier.weight(1f), fontSize = 18.sp,
                    fontWeight = FontWeight.Bold, color = Color(0xFF1F2937), textAlign = TextAlign.Center)
                TextButton(enabled = !saving, onClick = { doSave() }) {
                    Text(if (saving) "Saving..." else "Save", fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = if (saving) Color(0xFF9CA3AF) else Color(0xFF3B82F6))
                }
            }

            // ===== SCROLL BODY =====
            Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp)) {
                Spacer(Modifier.height(24.dp))
                // DP
                Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(Modifier.size(96.dp).clip(RoundedCornerShape(16.dp))
                        .border(2.dp, Color(0xFFE5E7EB), RoundedCornerShape(16.dp))
                        .background(Color(0xFFF3F4F6))) {
                        AsyncImage(
                            model = roomDp.ifBlank { RAW + "default-avatar.png" },
                            contentDescription = null,
                            modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop
                        )
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(
                        Modifier.clip(CircleShape)
                            .border(1.dp, Color(0xFFD1D5DB), CircleShape)
                            .background(Color.White)
                            .clickable { dpPick.launch("image/*") }
                            .padding(horizontal = 16.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Edit, null, tint = Color(0xFF374151), modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Edit Room photo", color = Color(0xFF374151), fontSize = 12.sp, fontWeight = FontWeight.Medium)
                    }
                }

                Spacer(Modifier.height(24.dp))
                RowItem("Room Name", roomName) { tempName = roomName; showNameSheet = true }
                RowItem("Room Announcement", announcement) { tempAnn = announcement; showAnnSheet = true }
                RowItem("Theme", "") { showThemePage = true }
                RowItem("Admin", "${admins.size} Selected") { adminSearch = ""; showAdminSheet = true }
                RowItem("Lock Room", if (isLocked) "Locked" else "", valueColor = Color(0xFFEF4444)) {
                    password = if (isLocked) roomPassword else ""; showLockCard = true
                }
                // Mic row
                Row(
                    Modifier.fillMaxWidth().padding(vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Mic Mode", Modifier.weight(1f), fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color(0xFF6B7280))
                    Row(
                        Modifier.clickable { tempMic = selectedMicMode; showMicSheet = true }
                            .padding(horizontal = 6.dp, vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Mic $selectedMicMode", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF111827))
                        Icon(Icons.Default.ChevronRight, null, tint = Color(0xFF9CA3AF), modifier = Modifier.size(16.dp))
                    }
                }
                HorizontalDivider(color = Color(0xFFF3F4F6), thickness = 0.6.dp)
                Spacer(Modifier.height(40.dp))
            }
        }

        // ===== ROOM NAME MODAL =====
        if (showNameSheet) {
            ModalWrap({ showNameSheet = false }) {
                DialogHeader("Room name") { showNameSheet = false }
                Box(Modifier.padding(horizontal = 12.dp, vertical = 12.dp)) {
                    Box(Modifier.fillMaxWidth().clip(CircleShape).background(Color(0xFFF3F4F6))
                        .padding(horizontal = 20.dp, vertical = 4.dp)) {
                        BasicTextField(
                            value = tempName, onValueChange = { tempName = it.take(30) },
                            singleLine = true,
                            textStyle = TextStyle(color = Color(0xFF111827), fontSize = 16.sp),
                            modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp)
                        )
                        Text("${tempName.length}/30", Modifier.align(Alignment.CenterEnd),
                            fontSize = 12.sp, color = Color(0xFF6B7280))
                    }
                }
                BlueButton("Save") { roomName = tempName; showNameSheet = false }
                Spacer(Modifier.height(16.dp))
            }
        }

        // ===== ANNOUNCEMENT MODAL =====
        if (showAnnSheet) {
            ModalWrap({ showAnnSheet = false }) {
                DialogHeader("Room announcement") { showAnnSheet = false }
                Box(Modifier.padding(horizontal = 12.dp, vertical = 12.dp)) {
                    Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFFF3F4F6)).padding(12.dp)) {
                        BasicTextField(
                            value = tempAnn, onValueChange = { tempAnn = it.take(200) },
                            textStyle = TextStyle(color = Color(0xFF111827), fontSize = 14.sp),
                            modifier = Modifier.fillMaxWidth().heightIn(min = 180.dp)
                        )
                        Text("${tempAnn.length}/200", Modifier.align(Alignment.BottomEnd),
                            fontSize = 12.sp, color = Color(0xFF6B7280))
                    }
                }
                BlueButton("Save") { announcement = tempAnn; showAnnSheet = false }
                Spacer(Modifier.height(16.dp))
            }
        }

        // ===== THEME PAGE =====
        if (showThemePage) {
            ThemeScreen(
                customImage = customTheme,
                selected = selectedTheme,
                onPickCustom = { themePick.launch("image/*") },
                onSelect = { selectedTheme = it; showThemePage = false },
                onBack = { showThemePage = false }
            )
        }

        // ===== LOCK CARD =====
        if (showLockCard) {
            Box(Modifier.fillMaxSize().background(Color(0x4D000000))
                .clickable { showLockCard = false; password = "" },
                contentAlignment = Alignment.Center) {
                Surface(
                    modifier = Modifier.width(320.dp),
                    shape = RoundedCornerShape(16.dp), color = Color.White,
                    shadowElevation = 12.dp, onClick = {}
                ) {
                    Column(Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Set Room Password", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF111827))
                        Spacer(Modifier.height(24.dp))
                        PasswordBoxes(password) { password = it }
                        Spacer(Modifier.height(20.dp))
                        if (isLocked && password == roomPassword) {
                            Button(onClick = { isLocked = false; roomPassword = ""; password = ""; showLockCard = false },
                                modifier = Modifier.fillMaxWidth().height(48.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444))
                            ) { Text("Unlock Room", fontWeight = FontWeight.SemiBold) }
                        } else {
                            Button(
                                onClick = { if (password.length == 4) { isLocked = true; roomPassword = password; showLockCard = false; password = "" } },
                                enabled = password.length == 4,
                                modifier = Modifier.fillMaxWidth().height(48.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFF3B82F6),
                                    disabledContainerColor = Color(0xFFD1D5DB))
                            ) { Text(if (isLocked) "Update Password" else "Set Password", fontWeight = FontWeight.SemiBold) }
                        }
                        Spacer(Modifier.height(8.dp))
                        TextButton(onClick = { showLockCard = false; password = "" }, modifier = Modifier.fillMaxWidth()) {
                            Text("Cancel", color = Color(0xFF6B7280), fontWeight = FontWeight.Medium)
                        }
                    }
                }
            }
        }

        // ===== MIC MODE SHEET =====
        if (showMicSheet) {
            Box(Modifier.fillMaxSize().background(Color(0x4D000000)).clickable { showMicSheet = false },
                contentAlignment = Alignment.BottomCenter) {
                Surface(
                    modifier = Modifier.fillMaxWidth().fillMaxHeight(0.85f),
                    shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
                    color = Color.White, onClick = {}
                ) {
                    Column(Modifier.fillMaxSize()) {
                        DialogHeader("Select Mic Mode") { showMicSheet = false }
                        Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 16.dp)) {
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                listOf(5, 10, 15).forEach { mode ->
                                    val sel = tempMic == mode
                                    Column(
                                        Modifier.weight(1f).clip(RoundedCornerShape(12.dp))
                                            .border(if (sel) 2.dp else 1.dp,
                                                if (sel) Color(0xFF3B82F6) else Color.Transparent,
                                                RoundedCornerShape(12.dp))
                                            .background(if (sel) Color(0xFFEFF6FF) else Color.Transparent)
                                            .clickable { tempMic = mode }
                                            .padding(6.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        AsyncImage(model = micModeImage(mode), contentDescription = null,
                                            modifier = Modifier.fillMaxWidth().aspectRatio(0.75f)
                                                .clip(RoundedCornerShape(8.dp)),
                                            contentScale = ContentScale.Fit)
                                        Text("Mic $mode", fontSize = 13.sp, modifier = Modifier.padding(vertical = 8.dp),
                                            color = if (sel) Color(0xFF3B82F6) else Color(0xFF374151),
                                            fontWeight = if (sel) FontWeight.Bold else FontWeight.Medium)
                                    }
                                }
                            }
                            Spacer(Modifier.height(80.dp))
                        }
                        Box(Modifier.fillMaxWidth().padding(16.dp)) {
                            BlueButton("Confirm", fillWidth = true) {
                                selectedMicMode = tempMic; showMicSheet = false
                            }
                        }
                    }
                }
            }
        }

        // ===== ADMIN SHEET =====
        if (showAdminSheet) {
            AdminSheet(
                search = adminSearch, onSearch = { adminSearch = it },
                members = members, admins = admins,
                onToggle = { id -> admins = if (admins.contains(id)) admins - id else admins + id },
                onClose = { showAdminSheet = false },
                onHelp = { showAdminHelp = true }
            )
        }

        if (showAdminHelp) {
            AdminHelpCard(onClose = { showAdminHelp = false }, showRemoveNote = false)
        }
    }

    // ===== CROP MODAL =====
    val src = cropSrc
    if (src != null) {
        CropScreen(
            src = src,
            onCancel = { cropSrc = null },
            onDone = { cropped -> roomDp = cropped; cropSrc = null }
        )
    }
}

// ============================================================
// REUSABLE COMPONENTS
// ============================================================
@Composable
private fun RowItem(title: String, value: String, valueColor: Color = Color(0xFF9CA3AF), onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().clickable(onClick = onClick).padding(vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, Modifier.weight(1f), fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color(0xFF6B7280))
        if (value.isNotBlank())
            Text(value, fontSize = 12.sp, color = valueColor, maxLines = 1,
                overflow = TextOverflow.Ellipsis, modifier = Modifier.widthIn(max = 140.dp))
        Icon(Icons.Default.ChevronRight, null, tint = Color(0xFF9CA3AF), modifier = Modifier.size(16.dp))
    }
    HorizontalDivider(color = Color(0xFFF3F4F6), thickness = 0.6.dp)
}

@Composable
private fun ModalWrap(onBackdrop: () -> Unit, content: @Composable ColumnScope.() -> Unit) {
    Box(Modifier.fillMaxSize().background(Color(0x80000000)).clickable { onBackdrop() },
        contentAlignment = Alignment.Center) {
        Surface(
            modifier = Modifier.fillMaxWidth(0.9f).wrapContentHeight(),
            shape = RoundedCornerShape(16.dp), color = Color.White,
            shadowElevation = 12.dp, onClick = {}
        ) { Column { content() } }
    }
}

@Composable
private fun DialogHeader(title: String, dark: Boolean = false, onBack: () -> Unit) {
    Row(Modifier.fillMaxWidth().padding(start = 8.dp, end = 8.dp, top = 12.dp),
        verticalAlignment = Alignment.CenterVertically) {
        IconButton(onClick = onBack) {
            Icon(Icons.Default.ArrowBack, null, tint = if (dark) Color.White else Color(0xFF111827))
        }
        Text(title, Modifier.weight(1f), fontSize = 16.sp, fontWeight = FontWeight.Bold,
            color = if (dark) Color.White else Color(0xFF111827), textAlign = TextAlign.Center)
        Spacer(Modifier.width(48.dp))
    }
}

@Composable
private fun BlueButton(label: String, fillWidth: Boolean = true, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = (if (fillWidth) Modifier.fillMaxWidth() else Modifier)
            .padding(horizontal = 12.dp, vertical = 4.dp).height(52.dp),
        shape = CircleShape,
        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6))
    ) { Text(label, fontSize = 16.sp, fontWeight = FontWeight.SemiBold) }
}

@Composable
private fun PasswordBoxes(value: String, onChange: (String) -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        for (i in 0 until 4) {
            Box(
                Modifier.weight(1f).aspectRatio(1f)
                    .border(2.dp, Color(0xFFD1D5DB), RoundedCornerShape(10.dp))
                    .clip(RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center
            ) {
                BasicTextField(
                    value = value.getOrNull(i)?.toString() ?: "",
                    onValueChange = { input ->
                        val digit = input.filter { it.isDigit() }.takeLast(1)
                        val list = value.padEnd(4, ' ').toMutableList()
                        if (digit.isNotEmpty()) list[i] = digit[0]
                        onChange(list.joinToString("").trimEnd().take(4))
                    },
                    singleLine = true,
                    textStyle = TextStyle(color = Color.Black, fontSize = 24.sp,
                        fontWeight = FontWeight.Bold, textAlign = TextAlign.Center),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
    }
}

// ============================================================
// THEME PAGE
// ============================================================
@Composable
private fun ThemeScreen(
    customImage: String?,
    selected: String,
    onPickCustom: () -> Unit,
    onSelect: (String) -> Unit,
    onBack: () -> Unit
) {
    val themes = remember(customImage) {
        if (!customImage.isNullOrBlank())
            listOf(ThemeChoice("custom", "Custom", customImage)) + defaultThemes
        else defaultThemes
    }
    Box(Modifier.fillMaxSize().background(Color.White)) {
        Column(Modifier.fillMaxSize()) {
            Row(Modifier.fillMaxWidth().statusBarsPadding().padding(8.dp),
                verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Default.ArrowBack, null, tint = Color(0xFF1F2937))
                }
                Text("Room Theme", Modifier.weight(1f), fontSize = 18.sp, fontWeight = FontWeight.Bold,
                    color = Color(0xFF1F2937), textAlign = TextAlign.Center)
                Spacer(Modifier.width(48.dp))
            }
            LazyVerticalGrid(
                columns = GridCells.Fixed(3),
                modifier = Modifier.fillMaxSize().padding(horizontal = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (customImage == null) {
                    item {
                        Column(
                            Modifier.fillMaxWidth().clickable { onPickCustom() }
                                .clip(RoundedCornerShape(8.dp))
                                .border(1.dp, Color(0xFFD1D5DB), RoundedCornerShape(8.dp))
                                .background(Color(0xFFF9FAFB))
                                .aspectRatio(3f / 4f),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Text("+", fontSize = 30.sp, color = Color(0xFF9CA3AF))
                            Text("Custom", fontSize = 10.sp, color = Color(0xFF6B7280))
                        }
                    }
                }
                gridItems(themes) { theme ->
                    Column(
                        Modifier.fillMaxWidth().clickable { onSelect(theme.id) },
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(Modifier.fillMaxWidth().aspectRatio(3f / 4f)
                            .clip(RoundedCornerShape(8.dp))
                            .border(if (selected == theme.id) 2.dp else 0.dp,
                                if (selected == theme.id) Color(0xFF60A5FA) else Color.Transparent,
                                RoundedCornerShape(8.dp))) {
                            AsyncImage(model = theme.image, contentDescription = theme.name,
                                modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                            if (theme.id == "custom")
                                Box(Modifier.align(Alignment.TopStart).padding(4.dp)
                                    .background(Color(0x99000000), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                                ) { Text("Custom", color = Color.White, fontSize = 8.sp) }
                        }
                        Text(theme.name, fontSize = 10.sp, color = Color(0xFF374151),
                            fontWeight = FontWeight.Medium, modifier = Modifier.padding(top = 4.dp))
                    }
                }
            }
        }
    }
}

// ============================================================
// ADMIN SHEET
// ============================================================
@Composable
private fun AdminSheet(
    search: String, onSearch: (String) -> Unit,
    members: List<RoomUser>, admins: List<String>,
    onToggle: (String) -> Unit,
    onClose: () -> Unit, onHelp: () -> Unit
) {
    Box(Modifier.fillMaxSize().background(Color(0x80000000)).clickable { onClose() },
        contentAlignment = Alignment.BottomCenter) {
        Surface(
            modifier = Modifier.fillMaxWidth().fillMaxHeight(0.4f),
            shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp),
            color = Color.Black, onClick = {}
        ) {
            Column(Modifier.fillMaxSize().navigationBarsPadding()) {
                Row(Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onClose) {
                        Icon(Icons.Default.ArrowBack, null, tint = Color.White)
                    }
                    Text("Admin Center", Modifier.weight(1f), fontSize = 16.sp, fontWeight = FontWeight.Bold,
                        color = Color.White, textAlign = TextAlign.Center)
                    IconButton(onClick = onHelp) {
                        Icon(Icons.Default.HelpOutline, null, tint = Color.White)
                    }
                }
                Box(Modifier.padding(horizontal = 16.dp)) {
                    Box(Modifier.fillMaxWidth().clip(RoundedCornerShape(6.dp))
                        .background(Color(0x1AFFFFFF)).padding(horizontal = 12.dp, vertical = 10.dp)) {
                        BasicTextField(
                            value = search, onValueChange = onSearch, singleLine = true,
                            textStyle = TextStyle(color = Color.White, fontSize = 12.sp),
                            modifier = Modifier.fillMaxWidth()
                        )
                        if (search.isBlank())
                            Text("Search a ID for Admin", color = Color(0xFF9CA3AF), fontSize = 12.sp)
                    }
                }
                Spacer(Modifier.height(8.dp))
                val filtered = members.filter {
                    it.name.contains(search, true) || it.accountId.contains(search, true)
                }
                LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
                    items(filtered, key = { it.accountId }) { m ->
                        val sel = admins.contains(m.accountId)
                        Row(
                            Modifier.fillMaxWidth().padding(vertical = 4.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color(0x0DFFFFFF))
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            AsyncImage(model = m.image.ifBlank { RAW + "default-avatar.png" },
                                contentDescription = null,
                                modifier = Modifier.size(36.dp).clip(CircleShape)
                                    .border(1.dp, Color(0x1AFFFFFF), CircleShape),
                                contentScale = ContentScale.Crop)
                            Column(Modifier.weight(1f).padding(start = 10.dp)) {
                                Text(m.name, color = Color.White, fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text("ID: ${m.accountId}", color = Color(0xFF9CA3AF), fontSize = 10.sp)
                            }
                            TextButton(onClick = { onToggle(m.accountId) }) {
                                Text(if (sel) "×1 Admin" else "Admin", color = Color.White,
                                    fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                    if (filtered.isEmpty()) item {
                        Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                            Text("No members found", color = Color(0xFF6B7280), fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

// ============================================================
// ADMIN HELP CARD
// ============================================================
@Composable
private fun AdminHelpCard(onClose: () -> Unit, showRemoveNote: Boolean) {
    Box(Modifier.fillMaxSize().background(Color(0x99000000)).clickable { onClose() },
        contentAlignment = Alignment.Center) {
        Surface(
            modifier = Modifier.fillMaxWidth(0.85f).fillMaxHeight(0.6f),
            shape = RoundedCornerShape(16.dp),
            color = Color(0xFFFDF3D0),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFFDE68A)),
            onClick = {}
        ) {
            Column(Modifier.fillMaxSize()) {
                Box(Modifier.fillMaxWidth().padding(12.dp), contentAlignment = Alignment.Center) {
                    Text("Room Admin", color = Color(0xFF8A6A1F), fontWeight = FontWeight.Bold, fontSize = 16.sp)
                }
                Column(Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 16.dp)) {
                    Text("Admin permissions include:", color = Color(0xFF8A6A1F), fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Spacer(Modifier.height(8.dp))
                    if (showRemoveNote) {
                        Text("You can become an admin in only 20 rooms; if you wish to remove your admin status from a room, you can do so by clicking the 'remove' button.",
                            color = Color.Black, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, lineHeight = 18.sp)
                        Spacer(Modifier.height(8.dp))
                    }
                    Text("locking the mic, muting the mic, kicking someone out, inviting someone, removing someone from a seat, and playing music.",
                        color = Color(0xFF7A5F1C), fontSize = 12.sp, lineHeight = 18.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("Each room has 5 admins. You can increase the admin limit in the following ways:",
                        color = Color(0xFF7A5F1C), fontSize = 12.sp, lineHeight = 18.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("1. By leveling up your ID, you can add 5 more admins; you can increase the total number of admins up to 20.",
                        color = Color(0xFF7A5F1C), fontSize = 12.sp, lineHeight = 18.sp)
                    Spacer(Modifier.height(8.dp))
                    Text("2. If you wish to appoint more admins, follow the rules below to add admins for free.",
                        color = Color(0xFF7A5F1C), fontSize = 12.sp, lineHeight = 18.sp)
                    Spacer(Modifier.height(12.dp))
                    Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp))
                        .border(1.dp, Color(0xFFFDE68A), RoundedCornerShape(8.dp))) {
                        listOf("Level 25" to "+5 admins", "Level 30" to "+5 admins", "Level 35" to "+5 admins")
                            .forEachIndexed { i, (lvl, adm) ->
                                Row(Modifier.fillMaxWidth()
                                    .background(if (i % 2 == 0) Color(0xFFFAEEC2) else Color(0xFFFDF3D0))) {
                                    Box(Modifier.weight(1f).padding(6.dp)) {
                                        Text(lvl, color = Color(0xFF7A5F1C), fontSize = 11.sp)
                                    }
                                    Box(Modifier.weight(1f).padding(6.dp), contentAlignment = Alignment.Center) {
                                        Text(adm, color = Color(0xFF7A5F1C), fontSize = 11.sp)
                                    }
                                }
                            }
                    }
                    Spacer(Modifier.height(12.dp))
                }
                Box(Modifier.padding(16.dp)) {
                    Button(onClick = onClose,
                        modifier = Modifier.fillMaxWidth().height(44.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF0C24B))
                    ) { Text("Close", color = Color(0xFF7A5F1C), fontWeight = FontWeight.SemiBold) }
                }
            }
        }
    }
}

// ============================================================
// CROP SCREEN
// ============================================================
@Composable
private fun CropScreen(src: String, onCancel: () -> Unit, onDone: (String) -> Unit) {
    var bm by remember { mutableStateOf<Bitmap?>(null) }
    LaunchedEffect(src) { bm = withContext(Dispatchers.IO) { decodeDataUrl(src) } }

    var container by remember { mutableStateOf(IntSize.Zero) }
    var scale by remember { mutableFloatStateOf(1f) }
    var offX by remember { mutableFloatStateOf(0f) }
    var offY by remember { mutableFloatStateOf(0f) }
    var boxL by remember { mutableFloatStateOf(0f) }
    var boxT by remember { mutableFloatStateOf(0f) }
    var boxS by remember { mutableFloatStateOf(200f) }
    var ready by remember { mutableStateOf(false) }

    LaunchedEffect(bm, container) {
        val b = bm ?: return@LaunchedEffect
        if (container == IntSize.Zero || ready) return@LaunchedEffect
        val cw = container.width.toFloat(); val ch = container.height.toFloat()
        val s = min(cw / b.width, ch / b.height)
        scale = s; offX = 0f; offY = 0f
        val dw = b.width * s; val dh = b.height * s
        val il = cw / 2 - dw / 2; val it2 = ch / 2 - dh / 2
        val m = min(dw, dh); val sz = m * 0.8f
        boxS = sz; boxL = il + (dw - sz) / 2; boxT = it2 + (dh - sz) / 2
        ready = true
    }

    Box(Modifier.fillMaxSize().background(Color.Black)
        .onSizeChanged { container = it }
        .pointerInput(Unit) {
            detectTransformGestures { _, pan, zoom, _ ->
                scale = (scale * zoom).coerceIn(0.3f, 6f)
                offX += pan.x; offY += pan.y
            }
        }
    ) {
        bm?.let {
            Image(bitmap = it.asImageBitmap(), contentDescription = null,
                modifier = Modifier.align(Alignment.Center)
                    .graphicsLayer(scaleX = scale, scaleY = scale, translationX = offX, translationY = offY),
                contentScale = ContentScale.Fit)
        }

        // dark overlay
        Canvas(Modifier.fillMaxSize()) {
            val c = Color(0x99000000)
            drawRect(c, Offset(0f, 0f), Size(size.width, boxT))
            drawRect(c, Offset(0f, boxT + boxS), Size(size.width, size.height - boxT - boxS))
            drawRect(c, Offset(0f, boxT), Size(boxL, boxS))
            drawRect(c, Offset(boxL + boxS, boxT), Size(size.width - boxL - boxS, boxS))
        }

        // crop box
        Box(Modifier.offset { IntOffset(boxL.roundToInt(), boxT.roundToInt()) }
            .size(boxS.dp)
            .border(2.dp, Color.White)) {
            // grid
            Box(Modifier.fillMaxHeight().width(1.dp).offset(x = (boxS / 3).dp).background(Color(0x66FFFFFF)))
            Box(Modifier.fillMaxHeight().width(1.dp).offset(x = (2 * boxS / 3).dp).background(Color(0x66FFFFFF)))
            Box(Modifier.fillMaxWidth().height(1.dp).offset(y = (boxS / 3).dp).background(Color(0x66FFFFFF)))
            Box(Modifier.fillMaxWidth().height(1.dp).offset(y = (2 * boxS / 3).dp).background(Color(0x66FFFFFF)))
            // drag
            Box(Modifier.fillMaxSize().pointerInput(Unit) {
                detectDragGestures { change, drag ->
                    change.consume()
                    boxL += drag.x; boxT += drag.y
                }
            })
            // handles
            CropHandle(Alignment.TopStart) { dx, dy -> boxL += dx; boxT += dy; boxS -= (dx + dy) / 2 }
            CropHandle(Alignment.TopEnd) { dx, dy -> boxT += dy; boxS += (dx - dy) / 2 }
            CropHandle(Alignment.BottomStart) { dx, dy -> boxL += dx; boxS += (-dx + dy) / 2 }
            CropHandle(Alignment.BottomEnd) { dx, dy -> boxS += (dx + dy) / 2 }
        }

        // top bar
        Row(Modifier.fillMaxWidth().statusBarsPadding().padding(horizontal = 8.dp, vertical = 8.dp)
            .align(Alignment.TopCenter), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onCancel) {
                Icon(Icons.Default.ArrowBack, "Back", tint = Color.White)
            }
            Text("Crop Image", Modifier.weight(1f), color = Color.White,
                fontWeight = FontWeight.Bold, fontSize = 18.sp, textAlign = TextAlign.Center)
            IconButton(onClick = {
                val b = bm ?: return@IconButton
                val cropped = performCrop(b, container, scale, offX, offY, boxL, boxT, boxS)
                if (cropped != null) onDone(encodeDataUrl(cropped))
            }) {
                Icon(Icons.Default.Check, "Confirm", tint = Color(0xFF4ADE80))
            }
        }
    }
}

@Composable
private fun BoxScope.CropHandle(alignment: Alignment, onDrag: (Float, Float) -> Unit) {
    Box(Modifier.align(alignment).size(28.dp)
        .pointerInput(Unit) {
            detectDragGestures { change, drag ->
                change.consume(); onDrag(drag.x, drag.y)
            }
        })
}

private fun performCrop(
    src: Bitmap, container: IntSize, scale: Float, offX: Float, offY: Float,
    boxL: Float, boxT: Float, boxS: Float
): Bitmap? {
    if (container == IntSize.Zero) return null
    val cw = container.width.toFloat(); val ch = container.height.toFloat()
    val dw = src.width * scale; val dh = src.height * scale
    val il = cw / 2 + offX - dw / 2; val it2 = ch / 2 + offY - dh / 2
    val srcX = (boxL - il) / scale; val srcY = (boxT - it2) / scale
    val srcSz = boxS / scale
    var fx = srcX; var fy = srcY; var fs = srcSz
    if (fx < 0) { fs += fx; fx = 0f }
    if (fy < 0) { fs += fy; fy = 0f }
    if (fx + fs > src.width) fs = src.width - fx
    if (fy + fs > src.height) fs = src.height - fy
    if (fs <= 0) return null
    val side = min(fs, min(src.width - fx, src.height - fy))
    if (side <= 0) return null
    val out = Bitmap.createBitmap(640, 640, Bitmap.Config.ARGB_8888)
    val canvas = android.graphics.Canvas(out)
    canvas.drawColor(android.graphics.Color.WHITE)
    canvas.drawBitmap(src,
        android.graphics.Rect(fx.roundToInt(), fy.roundToInt(),
            (fx + side).roundToInt(), (fy + side).roundToInt()),
        android.graphics.Rect(0, 0, 640, 640),
        android.graphics.Paint(android.graphics.Paint.FILTER_BITMAP_FLAG))
    return out
}
