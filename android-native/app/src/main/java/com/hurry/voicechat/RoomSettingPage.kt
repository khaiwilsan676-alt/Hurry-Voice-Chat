package com.hurry.voicechat

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items as gridItems
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.net.HttpURLConnection
import java.net.URL

data class RoomSettingsDataNative(
    val roomName: String = "Room",
    val announcement: String = "",
    val micMode: Int = 10,
    val theme: String = "forest-night",
    val isLocked: Boolean = false,
    val roomPassword: String = "",
    val roomDp: String = "",
    val admin: List<String> = emptyList()
)
private data class RoomThemeChoice(val id: String, val name: String, val image: String)
private data class NativeSettingMember(val accountId: String, val name: String, val image: String)
private const val SETTINGS_API = "https://hurry-voice-chat-lz75.onrender.com"
private const val RAW_SETTINGS = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"
private val roomThemeChoices = listOf(
    RoomThemeChoice("forest-night", "Forest Night", RAW_SETTINGS + "1784875884052~2.jpg"),
    RoomThemeChoice("mood-light", "Moon Light", RAW_SETTINGS + "1784533036732~2.jpg")
)
private val settingsBlue = Color(0xFF4388F5)
private val settingsInk = Color(0xFF262626)
private val settingsMuted = Color(0xFF999999)

private suspend fun cropImageToDataUrl(context: Context, uri: android.net.Uri): String = withContext(Dispatchers.IO) {
    val bytes = context.contentResolver.openInputStream(uri)?.use { input ->
        val out = ByteArrayOutputStream()
        val buffer = ByteArray(8192)
        var total = 0
        while (true) {
            val n = input.read(buffer)
            if (n <= 0) break
            total += n
            require(total <= 10 * 1024 * 1024) { "Image must be smaller than 10MB" }
            out.write(buffer, 0, n)
        }
        out.toByteArray()
    } ?: error("Cannot read selected image")
    val original = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: error("Invalid image")
    val side = minOf(original.width, original.height)
    val x = (original.width - side) / 2
    val y = (original.height - side) / 2
    val square = Bitmap.createBitmap(original, x, y, side, side)
    val scaled = Bitmap.createScaledBitmap(square, 640, 640, true)
    val output = ByteArrayOutputStream()
    scaled.compress(Bitmap.CompressFormat.JPEG, 90, output)
    if (scaled !== square) scaled.recycle()
    if (square !== original) square.recycle()
    original.recycle()
    "data:image/jpeg;base64," + Base64.encodeToString(output.toByteArray(), Base64.NO_WRAP)
}

private suspend fun saveRoomSettingsRemote(roomId: String, userId: String, data: RoomSettingsDataNative) = withContext(Dispatchers.IO) {
    if (roomId.isBlank()) return@withContext
    val payload = JSONObject()
        .put("accountId", roomId).put("roomId", roomId).put("id", roomId)
        .put("roomName", data.roomName).put("name", data.roomName).put("Room Name", data.roomName)
        .put("roomDp", data.roomDp).put("image", data.roomDp).put("Room dp", data.roomDp)
        .put("announcement", data.announcement).put("message", data.announcement)
        .put("theme", data.theme).put("admin", JSONArray(data.admin))
        .put("isLocked", data.isLocked).put("roomPassword", data.roomPassword)
        .put("micMode", data.micMode)
    val connection = (URL("$SETTINGS_API/api/rooms").openConnection() as HttpURLConnection).apply {
        requestMethod = "PUT"
        connectTimeout = 20000
        readTimeout = 25000
        doOutput = true
        setRequestProperty("Content-Type", "application/json; charset=utf-8")
    }
    try {
        connection.outputStream.use { it.write(payload.toString().toByteArray(Charsets.UTF_8)) }
        val code = connection.responseCode
        if (code !in 200..299) {
            val error = connection.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
            error("Save failed: HTTP $code ${error.take(180)}")
        }
    } finally { connection.disconnect() }

    runCatching {
        val socket = IO.socket(SETTINGS_API)
        socket.connect()
        val event = JSONObject()
            .put("roomId", roomId).put("userId", userId).put("roomOwnerId", roomId)
            .put("roomName", data.roomName).put("roomDp", data.roomDp)
            .put("announcement", data.announcement).put("micMode", data.micMode)
            .put("theme", data.theme).put("isLocked", data.isLocked)
            .put("roomPassword", data.roomPassword).put("updatedAt", System.currentTimeMillis())
        socket.emit("room_settings_update", event)
        kotlinx.coroutines.delay(350)
        socket.disconnect()
        socket.close()
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomSettingPage(
    initial: RoomSettingsDataNative = RoomSettingsDataNative(),
    roomOwnerId: String = "",
    currentUserId: String = "",
    onBack: () -> Unit = {},
    onSave: (RoomSettingsDataNative) -> Unit = {}
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var state by remember(initial) { mutableStateOf(initial) }
    var sheet by remember { mutableStateOf("") }
    var draft by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var tempMicMode by remember { mutableIntStateOf(initial.micMode) }
    var adminSearch by remember { mutableStateOf("") }
    var admins by remember(initial.admin) { mutableStateOf(initial.admin) }
    var customTheme by remember { mutableStateOf("") }
    var pendingPicker by remember { mutableStateOf("photo") }
    var saving by remember { mutableStateOf(false) }
    var saveError by remember { mutableStateOf("") }
    val members = remember { mutableStateListOf<NativeSettingMember>() }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri != null) scope.launch {
            runCatching { cropImageToDataUrl(context, uri) }
                .onSuccess { dataUrl ->
                    if (pendingPicker == "photo") state = state.copy(roomDp = dataUrl)
                    else {
                        customTheme = dataUrl
                        state = state.copy(theme = "custom")
                        sheet = "theme"
                    }
                }
                .onFailure { saveError = it.message ?: "Could not load image" }
        }
    }
    val themeItems = remember(customTheme) {
        if (customTheme.isNotBlank()) listOf(RoomThemeChoice("custom", "Custom", customTheme)) + roomThemeChoices
        else roomThemeChoices
    }

    DisposableEffect(roomOwnerId) {
        if (roomOwnerId.isBlank()) return@DisposableEffect onDispose { }
        val socket = runCatching { IO.socket(SETTINGS_API) }.getOrNull()
        if (socket == null) return@DisposableEffect onDispose { }
        val listener = Emitter.Listener { args ->
            val payload = args.firstOrNull() as? JSONObject ?: return@Listener
            if (payload.optString("roomId") != roomOwnerId) return@Listener
            val users = payload.optJSONArray("users") ?: JSONArray()
            val parsed = (0 until users.length()).mapNotNull { i ->
                val item = users.optJSONObject(i) ?: return@mapNotNull null
                val id = item.optString("accountId", item.optString("userId", item.optString("appLongId", "")))
                if (id.isBlank()) null else NativeSettingMember(
                    id,
                    item.optString("name", item.optString("userName", "User")),
                    item.optString("image", item.optString("dp", item.optString("avatar", "")))
                )
            }
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                members.clear()
                members.addAll(parsed)
            }
        }
        socket.on("room_members_list", listener)
        socket.connect()
        socket.emit("get_room_members", JSONObject().put("roomId", roomOwnerId))
        onDispose {
            socket.off("room_members_list", listener)
            socket.disconnect()
            socket.close()
        }
    }

    Column(Modifier.fillMaxSize().background(Color.White)) {
        Row(
            Modifier.fillMaxWidth().background(Color.White).statusBarsPadding().height(56.dp).padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack, modifier = Modifier.size(40.dp)) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = settingsInk)
            }
            Text("Room Setting", Modifier.weight(1f), fontSize = 18.sp, fontWeight = FontWeight.Bold, color = settingsInk, textAlign = TextAlign.Center)
            TextButton(enabled = !saving, onClick = {
                scope.launch {
                    saving = true
                    saveError = ""
                    val ready = state.copy(roomName = state.roomName.trim().ifBlank { "Room" }, admin = admins)
                    runCatching {
                        saveRoomSettingsRemote(roomOwnerId, currentUserId, ready)
                        context.getSharedPreferences("room_settings", Context.MODE_PRIVATE).edit()
                            .putInt("micMode_$roomOwnerId", ready.micMode)
                            .putString("theme_$roomOwnerId", ready.theme)
                            .apply()
                    }.onSuccess {
                        state = ready
                        onSave(ready)
                    }.onFailure { saveError = it.message ?: "Network error. Try again." }
                    saving = false
                }
            }, contentPadding = PaddingValues(horizontal = 8.dp)) {
                Text(if (saving) "Saving..." else "Save", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = settingsBlue)
            }
        }
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Box(Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 24.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(Modifier.size(96.dp).clip(RoundedCornerShape(16.dp)).border(1.dp, Color(0xFFE2E5E9), RoundedCornerShape(16.dp)).background(Color(0xFFF1F3F5)), contentAlignment = Alignment.Center) {
                        if (state.roomDp.isNotBlank()) AsyncImage(model = state.roomDp, contentDescription = "Room photo", modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                        else Text("Room", color = settingsMuted, fontSize = 12.sp)
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(
                        Modifier.clip(CircleShape).border(1.dp, Color(0xFFD7DADF), CircleShape).background(Color.White)
                            .clickable { pendingPicker = "photo"; picker.launch("image/*") }.padding(horizontal = 14.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = null, tint = Color(0xFF666666), modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(5.dp))
                        Text("Edit Room photo", color = Color(0xFF555555), fontSize = 12.sp)
                    }
                }
            }
            SettingRow("Room Name", state.roomName) { draft = state.roomName; sheet = "name" }
            SettingRow("Room Announcement", state.announcement) { draft = state.announcement; sheet = "announcement" }
            SettingRow("Theme", themeItems.firstOrNull { it.id == state.theme }?.name ?: "Choose theme") { sheet = "theme" }
            SettingRow("Admin", "${admins.size} Selected") { adminSearch = ""; sheet = "admin" }
            SettingRow("Room where I'm an admin", "(1/20)") { sheet = "admin-rooms" }
            SettingRow("Lock Room", if (state.isLocked) "Locked" else "") { password = if (state.isLocked) state.roomPassword else ""; sheet = "password" }
            SettingRow("Mic Mode", "Mic ${state.micMode}") { tempMicMode = state.micMode; sheet = "mic" }
            if (saveError.isNotBlank()) Text(saveError, color = Color(0xFFD94343), fontSize = 12.sp, modifier = Modifier.padding(vertical = 8.dp))
            Spacer(Modifier.height(20.dp))
        }
    }

    if (sheet.isNotEmpty()) {
        ModalBottomSheet(
            onDismissRequest = { sheet = "" },
            containerColor = if (sheet == "admin" || sheet == "admin-rooms" || sheet == "admin-help") Color(0xFF101010) else Color.White,
            contentColor = if (sheet == "admin" || sheet == "admin-rooms" || sheet == "admin-help") Color.White else settingsInk,
            dragHandle = { BottomSheetDefaults.DragHandle(color = if (sheet.startsWith("admin")) Color.DarkGray else Color.LightGray) }
        ) {
            when (sheet) {
                "name" -> {
                    SheetHeader("Room name") { sheet = "" }
                    OutlinedTextField(draft, { draft = it.take(30) }, Modifier.fillMaxWidth().padding(horizontal = 16.dp), singleLine = true, placeholder = { Text("Please enter room name") }, supportingText = { Text("${draft.length}/30", Modifier.fillMaxWidth(), textAlign = TextAlign.End) })
                    SheetAction("Save") { state = state.copy(roomName = draft.trim().ifBlank { "Room" }); sheet = "" }
                }
                "announcement" -> {
                    SheetHeader("Room Announcement") { sheet = "" }
                    OutlinedTextField(draft, { draft = it.take(200) }, Modifier.fillMaxWidth().heightIn(min = 150.dp).padding(horizontal = 16.dp), placeholder = { Text("Please enter room announcement") }, supportingText = { Text("${draft.length}/200", Modifier.fillMaxWidth(), textAlign = TextAlign.End) })
                    SheetAction("Save") { state = state.copy(announcement = draft); sheet = "" }
                }
                "theme" -> {
                    SheetHeader("Room Theme") { sheet = "" }
                    LazyVerticalGrid(columns = GridCells.Fixed(3), modifier = Modifier.fillMaxWidth().heightIn(max = 460.dp).padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        item {
                            Column(Modifier.fillMaxWidth().clickable { pendingPicker = "theme"; picker.launch("image/*") }, horizontalAlignment = Alignment.CenterHorizontally) {
                                Box(Modifier.fillMaxWidth().aspectRatio(0.75f).clip(RoundedCornerShape(8.dp)).background(Color(0xFFF1F3F5)), contentAlignment = Alignment.Center) { Text("+", fontSize = 34.sp, color = settingsMuted) }
                                Text("Custom", fontSize = 11.sp, color = settingsInk, modifier = Modifier.padding(top = 5.dp))
                            }
                        }
                        gridItems(themeItems) { theme ->
                            Column(Modifier.fillMaxWidth().clickable { state = state.copy(theme = theme.id); sheet = "" }, horizontalAlignment = Alignment.CenterHorizontally) {
                                Box {
                                    AsyncImage(model = theme.image, contentDescription = theme.name, modifier = Modifier.fillMaxWidth().aspectRatio(0.75f).clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop)
                                    if (state.theme == theme.id) Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.align(Alignment.TopEnd).padding(5.dp).size(20.dp).clip(CircleShape).background(settingsBlue).padding(3.dp))
                                }
                                Text(theme.name, fontSize = 11.sp, color = settingsInk, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 5.dp))
                            }
                        }
                    }
                    Spacer(Modifier.height(20.dp))
                }
                "mic" -> {
                    SheetHeader("Select Mic Mode") { sheet = "" }
                    Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        listOf(5, 10, 15).forEach { mode ->
                            Column(Modifier.weight(1f).clip(RoundedCornerShape(10.dp)).border(if (tempMicMode == mode) 2.dp else 1.dp, if (tempMicMode == mode) settingsBlue else Color(0xFFE5E7EB), RoundedCornerShape(10.dp)).background(if (tempMicMode == mode) Color(0xFFEAF2FF) else Color.White).clickable { tempMicMode = mode }.padding(5.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                val asset = when (mode) {
                                    5 -> RAW_SETTINGS + "IMG_20261009_172932~2.jpg"
                                    10 -> RAW_SETTINGS + "IMG_20261009_173133~2.jpg"
                                    else -> RAW_SETTINGS + "IMG_20261009_172551.jpg"
                                }
                                AsyncImage(model = asset, contentDescription = "Mic mode $mode", modifier = Modifier.fillMaxWidth().aspectRatio(0.72f).clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Fit)
                                Text("Mic $mode", fontSize = 13.sp, color = if (tempMicMode == mode) settingsBlue else settingsInk, fontWeight = if (tempMicMode == mode) FontWeight.Bold else FontWeight.Medium, modifier = Modifier.padding(vertical = 8.dp))
                            }
                        }
                    }
                    SheetAction("Confirm") { state = state.copy(micMode = tempMicMode); sheet = "" }
                }
                "password" -> {
                    SheetHeader(if (state.isLocked) "Room Password" else "Lock Room") { sheet = "" }
                    Row(Modifier.fillMaxWidth().padding(horizontal = 24.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        (0..3).forEach { index -> Box(Modifier.weight(1f).height(54.dp).border(1.dp, Color(0xFFD1D5DB), RoundedCornerShape(8.dp)).background(Color(0xFFF5F6F8), RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) { Text(password.getOrNull(index)?.toString() ?: "", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = settingsInk) } }
                    }
                    OutlinedTextField(password, { password = it.filter(Char::isDigit).take(4) }, Modifier.fillMaxWidth().padding(horizontal = 24.dp), singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword), label = { Text("4-digit password") })
                    if (state.isLocked) TextButton(onClick = { state = state.copy(isLocked = false, roomPassword = ""); password = ""; sheet = "" }, modifier = Modifier.fillMaxWidth()) { Text("Unlock Room", color = Color(0xFFE15B64)) }
                    SheetAction(if (state.isLocked) "Update Password" else "Set Password") {
                        if (password.length == 4) { state = state.copy(isLocked = true, roomPassword = password); sheet = "" }
                        else saveError = "Please enter all 4 digits"
                    }
                }
                "admin" -> {
                    SheetHeader("Admin Center", dark = true) { sheet = "" }
                    OutlinedTextField(adminSearch, { adminSearch = it }, Modifier.fillMaxWidth().padding(horizontal = 16.dp), placeholder = { Text("Search a ID for Admin", color = Color.Gray) }, singleLine = true, colors = OutlinedTextFieldDefaults.colors(unfocusedTextColor = Color.White, focusedTextColor = Color.White, unfocusedContainerColor = Color(0xFF202020), focusedContainerColor = Color(0xFF202020)))
                    Text("Room members", color = Color.LightGray, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp))
                    val filtered = members.filter { it.accountId.contains(adminSearch, true) || it.name.contains(adminSearch, true) }
                    LazyColumn(Modifier.fillMaxWidth().heightIn(max = 360.dp).padding(horizontal = 12.dp)) {
                        items(filtered, key = { it.accountId }) { member ->
                            val selected = admins.contains(member.accountId)
                            Row(Modifier.fillMaxWidth().padding(vertical = 5.dp).clip(RoundedCornerShape(10.dp)).background(Color(0xFF202020)).padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                AsyncImage(model = member.image.ifBlank { RAW_SETTINGS + "default-avatar.png" }, contentDescription = member.name, modifier = Modifier.size(38.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                                Column(Modifier.weight(1f).padding(start = 10.dp)) {
                                    Text(member.name, color = Color.White, fontSize = 12.sp, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                    Text("ID: ${member.accountId}", color = Color.Gray, fontSize = 10.sp)
                                }
                                TextButton(onClick = { admins = if (selected) admins.filterNot { it == member.accountId } else if (admins.size < 20) admins + member.accountId else admins }) { Text(if (selected) "×1 Admin" else "Admin", color = Color.White) }
                            }
                        }
                    }
                    if (members.isEmpty()) Text("Waiting for live room members…", color = Color.Gray, fontSize = 12.sp, modifier = Modifier.padding(16.dp))
                    SheetAction("Done") { state = state.copy(admin = admins); sheet = "" }
                    TextButton(onClick = { sheet = "admin-help" }, modifier = Modifier.fillMaxWidth()) { Text("Admin rules", color = Color.LightGray) }
                }
                "admin-help" -> {
                    SheetHeader("Admin Rules", dark = true) { sheet = "admin" }
                    Text("1. You can select up to 20 admins.\n2. Additional admin slots unlock at Level 25, Level 30 and Level 35 (+5 admins each).", color = Color.White, fontSize = 13.sp, lineHeight = 20.sp, modifier = Modifier.padding(18.dp))
                    SheetAction("Close", dark = true) { sheet = "admin" }
                }
                "admin-rooms" -> {
                    SheetHeader("Admin Center", dark = true) { sheet = "" }
                    Text("Rooms where I'm an admin (1/20)", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp))
                    Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp).clip(RoundedCornerShape(10.dp)).background(Color(0xFF202020)).padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        AsyncImage(model = RAW_SETTINGS + "default-avatar.png", contentDescription = null, modifier = Modifier.size(42.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                        Column(Modifier.weight(1f).padding(start = 10.dp)) { Text("👍Mastigroup🦗", color = Color.White, fontSize = 13.sp); Text("ID: 385201", color = Color.Gray, fontSize = 11.sp) }
                        TextButton(onClick = { sheet = "admin-room-help" }) { Text("?", color = Color.White) }
                    }
                    TextButton(onClick = { sheet = "" }, modifier = Modifier.fillMaxWidth()) { Text("Close", color = Color.White) }
                }
                "admin-room-help" -> {
                    SheetHeader("Admin Rules", dark = true) { sheet = "admin-rooms" }
                    Text("Room admin capacity can increase with account level. Please follow the room management rules.", color = Color.White, fontSize = 13.sp, modifier = Modifier.padding(18.dp))
                    SheetAction("Close", dark = true) { sheet = "admin-rooms" }
                }
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}

@Composable
private fun SettingRow(title: String, value: String, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 1.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(title, Modifier.weight(1f), fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color(0xFF555555))
        if (value.isNotBlank()) Text(value, fontSize = 12.sp, color = if (title == "Lock Room" && value == "Locked") Color(0xFFE15B64) else Color(0xFF999999), maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.widthIn(max = 150.dp))
        Icon(Icons.Default.ChevronRight, null, tint = Color(0xFF999999), modifier = Modifier.padding(start = 4.dp).size(18.dp))
    }
    HorizontalDivider(color = Color(0xFFF2F2F2), thickness = 0.6.dp)
}
@Composable
private fun SheetHeader(title: String, dark: Boolean = false, onBack: () -> Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null, tint = if (dark) Color.White else settingsInk) }
        Text(title, Modifier.weight(1f), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = if (dark) Color.White else settingsInk, textAlign = TextAlign.Center)
        Spacer(Modifier.width(48.dp))
    }
}
@Composable
private fun SheetAction(label: String, dark: Boolean = false, onClick: () -> Unit) {
    Button(onClick = onClick, modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 16.dp).height(46.dp), shape = RoundedCornerShape(10.dp), colors = ButtonDefaults.buttonColors(containerColor = if (dark) Color(0xFF2878E8) else settingsBlue)) {
        Text(label, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
    }
}
