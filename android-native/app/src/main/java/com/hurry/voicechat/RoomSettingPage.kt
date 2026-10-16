package com.hurry.voicechat

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage

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
private val roomThemeChoices = listOf(
    RoomThemeChoice("forest-night", "Forest Night", "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/1784875884052~2.jpg"),
    RoomThemeChoice("moon-light", "Moon Light", "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/1784533036732~2.jpg")
)
private val blue = Color(0xFF4388F5)
private val ink = Color(0xFF262626)
private val muted = Color(0xFF999999)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomSettingPage(
    initial: RoomSettingsDataNative = RoomSettingsDataNative(),
    onBack: () -> Unit = {},
    onSave: (RoomSettingsDataNative) -> Unit = {}
) {
    var state by remember { mutableStateOf(initial) }
    var sheet by remember { mutableStateOf("") }
    var draft by remember { mutableStateOf("") }
    var tempMicMode by remember { mutableIntStateOf(initial.micMode) }
    var adminSearch by remember { mutableStateOf("") }
    var admins by remember { mutableStateOf(initial.admin) }
    var customTheme by remember { mutableStateOf("") }
    val picker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            if (sheet == "photo") state = state.copy(roomDp = it.toString())
            else { customTheme = it.toString(); state = state.copy(theme = "custom") }
            sheet = if (sheet == "photo") "" else "theme"
        }
    }
    val themeItems = remember(customTheme) {
        if (customTheme.isNotBlank()) listOf(RoomThemeChoice("custom", "Custom", customTheme)) + roomThemeChoices
        else roomThemeChoices
    }

    Column(Modifier.fillMaxSize().background(Color.White)) {
        Row(
            Modifier.fillMaxWidth().background(Color.White).statusBarsPadding().height(56.dp).padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack, modifier = Modifier.size(40.dp)) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = ink)
            }
            Text("Room Setting", Modifier.weight(1f), fontSize = 18.sp, fontWeight = FontWeight.Bold, color = ink, textAlign = TextAlign.Center)
            TextButton(onClick = { onSave(state.copy(admin = admins)) }, contentPadding = PaddingValues(horizontal = 8.dp)) {
                Text("Save", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = blue)
            }
        }
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 16.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Box(Modifier.fillMaxWidth().padding(top = 8.dp, bottom = 24.dp), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(Modifier.size(96.dp).clip(RoundedCornerShape(16.dp)).background(Color(0xFFF1F3F5)), contentAlignment = Alignment.Center) {
                        if (state.roomDp.isNotBlank()) AsyncImage(state.roomDp, "Room photo", Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                        else Text("Room", color = muted, fontSize = 12.sp)
                    }
                    Spacer(Modifier.height(12.dp))
                    Row(
                        Modifier.clip(CircleShape).background(Color.White).clickable { sheet = "photo"; picker.launch("image/*") }
                            .padding(horizontal = 14.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Edit, null, tint = Color(0xFF666666), modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(5.dp))
                        Text("Edit Room photo", color = Color(0xFF555555), fontSize = 12.sp)
                    }
                }
            }
            SettingRow("Room Name", state.roomName.ifBlank { " " }) { draft = state.roomName; sheet = "name" }
            SettingRow("Room Announcement", state.announcement.ifBlank { " " }) { draft = state.announcement; sheet = "announcement" }
            SettingRow("Theme", "") { sheet = "theme" }
            SettingRow("Admin", "${admins.size} Selected") { adminSearch = ""; sheet = "admin" }
            SettingRow("Room where I'm an admin", "(1/20)") { sheet = "admin-rooms" }
            SettingRow("Lock Room", if (state.isLocked) "Locked" else "") { draft = ""; sheet = "password" }
            SettingRow("Mic Mode", "Mic ${state.micMode}") { tempMicMode = state.micMode; sheet = "mic" }
            Spacer(Modifier.height(20.dp))
        }
    }

    if (sheet.isNotEmpty()) {
        ModalBottomSheet(
            onDismissRequest = { sheet = "" },
            containerColor = if (sheet == "admin" || sheet == "admin-rooms") Color(0xFF101010) else Color.White,
            contentColor = if (sheet == "admin" || sheet == "admin-rooms") Color.White else ink,
            dragHandle = { BottomSheetDefaults.DragHandle(color = if (sheet == "admin" || sheet == "admin-rooms") Color.DarkGray else Color.LightGray) }
        ) {
            when (sheet) {
                "name" -> {
                    SheetHeader("Room name") { sheet = "" }
                    OutlinedTextField(
                        value = draft, onValueChange = { draft = it.take(30) },
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        singleLine = true, placeholder = { Text("Please enter room name") },
                        supportingText = { Text("${draft.length}/30", Modifier.fillMaxWidth(), textAlign = TextAlign.End) }
                    )
                    SheetAction("Save") { state = state.copy(roomName = draft.trim()); sheet = "" }
                }
                "announcement" -> {
                    SheetHeader("Room Announcement") { sheet = "" }
                    OutlinedTextField(
                        value = draft, onValueChange = { draft = it.take(200) },
                        modifier = Modifier.fillMaxWidth().heightIn(min = 150.dp).padding(horizontal = 16.dp),
                        placeholder = { Text("Please enter room announcement") },
                        supportingText = { Text("${draft.length}/200", Modifier.fillMaxWidth(), textAlign = TextAlign.End) }
                    )
                    SheetAction("Save") { state = state.copy(announcement = draft); sheet = "" }
                }
                "theme" -> {
                    SheetHeader("Room Theme") { sheet = "" }
                    LazyVerticalGrid(
                        columns = GridCells.Fixed(3),
                        modifier = Modifier.fillMaxWidth().heightIn(max = 460.dp).padding(horizontal = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        item {
                            Column(Modifier.fillMaxWidth().clickable { picker.launch("image/*") }, horizontalAlignment = Alignment.CenterHorizontally) {
                                Box(Modifier.fillMaxWidth().aspectRatio(0.75f).clip(RoundedCornerShape(8.dp)).background(Color(0xFFF1F3F5)), contentAlignment = Alignment.Center) {
                                    Text("+", fontSize = 34.sp, color = muted)
                                }
                                Text("Custom", fontSize = 11.sp, color = ink, modifier = Modifier.padding(top = 5.dp))
                            }
                        }
                        items(themeItems) { theme ->
                            Column(Modifier.fillMaxWidth().clickable { state = state.copy(theme = theme.id); sheet = "" }, horizontalAlignment = Alignment.CenterHorizontally) {
                                Box {
                                    AsyncImage(theme.image, theme.name, Modifier.fillMaxWidth().aspectRatio(0.75f).clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop)
                                    if (state.theme == theme.id) Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.align(Alignment.TopEnd).padding(5.dp).size(20.dp).clip(CircleShape).background(blue).padding(3.dp))
                                }
                                Text(theme.name, fontSize = 11.sp, color = ink, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 5.dp))
                            }
                        }
                    }
                    Spacer(Modifier.height(20.dp))
                }
                "mic" -> {
                    SheetHeader("Select Mic Mode") { sheet = "" }
                    Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        listOf(5, 10, 15).forEach { mode ->
                            Column(
                                Modifier.weight(1f).clip(RoundedCornerShape(10.dp))
                                    .background(if (tempMicMode == mode) Color(0xFFEAF2FF) else Color.White)
                                    .clickable { tempMicMode = mode }.padding(5.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                val asset = when (mode) {
                                    5 -> "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/IMG_20261009_172932~2.jpg"
                                    10 -> "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/IMG_20261009_173133~2.jpg"
                                    else -> "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/IMG_20261009_172551.jpg"
                                }
                                AsyncImage(asset, "Mic $mode", Modifier.fillMaxWidth().aspectRatio(0.72f).clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop)
                                Text("Mic $mode", fontSize = 13.sp, color = if (tempMicMode == mode) blue else ink, fontWeight = if (tempMicMode == mode) FontWeight.Bold else FontWeight.Medium, modifier = Modifier.padding(vertical = 8.dp))
                            }
                        }
                    }
                    SheetAction("Confirm") { state = state.copy(micMode = tempMicMode); sheet = "" }
                }
                "password" -> {
                    SheetHeader("Set Room Password") { sheet = "" }
                    var password by remember { mutableStateOf(if (state.isLocked) state.roomPassword else "") }
                    Row(Modifier.fillMaxWidth().padding(horizontal = 24.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        (0..3).forEach { index ->
                            Box(Modifier.weight(1f).height(54.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFFF5F6F8)), contentAlignment = Alignment.Center) {
                                Text(password.getOrNull(index)?.toString() ?: "", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = ink)
                            }
                        }
                    }
                    OutlinedTextField(password, { password = it.filter(Char::isDigit).take(4) }, Modifier.fillMaxWidth().padding(horizontal = 24.dp), singleLine = true, label = { Text("4-digit password") })
                    SheetAction(if (state.isLocked && password == state.roomPassword) "Unlock Room" else if (state.isLocked) "Update Password" else "Set Password") {
                        if (state.isLocked && password == state.roomPassword) state = state.copy(isLocked = false, roomPassword = "")
                        else if (password.length == 4) state = state.copy(isLocked = true, roomPassword = password)
                        sheet = ""
                    }
                }
                "admin" -> {
                    SheetHeader("Admin Center", dark = true) { sheet = "" }
                    OutlinedTextField(
                        adminSearch, { adminSearch = it },
                        Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                        placeholder = { Text("Search a ID for Admin", color = Color.Gray) },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(unfocusedTextColor = Color.White, focusedTextColor = Color.White, unfocusedContainerColor = Color(0xFF202020), focusedContainerColor = Color(0xFF202020))
                    )
                    Text("Selected admins: ${admins.size}", color = Color.LightGray, fontSize = 12.sp, modifier = Modifier.padding(16.dp))
                    Text("Select members from the live room member list to manage admins.", color = Color.Gray, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 16.dp))
                    SheetAction("Done", dark = true) { state = state.copy(admin = admins); sheet = "" }
                }
                "admin-rooms" -> {
                    SheetHeader("Admin Center", dark = true) { sheet = "" }
                    Text("Rooms where I'm an admin(0/15)", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp))
                    Text("No rooms found", color = Color.Gray, fontSize = 13.sp, modifier = Modifier.fillMaxWidth().padding(vertical = 28.dp), textAlign = TextAlign.Center)
                    Spacer(Modifier.height(16.dp))
                }
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}

@Composable
private fun SettingRow(title: String, value: String, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth().clickable(onClick = onClick).padding(horizontal = 1.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, Modifier.weight(1f), fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color(0xFF555555))
        if (value.isNotBlank()) Text(value, fontSize = 12.sp, color = if (title == "Lock Room" && value == "Locked") Color(0xFFE15B64) else Color(0xFF999999), maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.widthIn(max = 150.dp))
        Icon(Icons.Default.ChevronRight, null, tint = Color(0xFF999999), modifier = Modifier.padding(start = 4.dp).size(18.dp))
    }
    HorizontalDivider(color = Color(0xFFF2F2F2), thickness = 0.6.dp)
}

@Composable
private fun SheetHeader(title: String, dark: Boolean = false, onBack: () -> Unit) {
    Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, null, tint = if (dark) Color.White else ink) }
        Text(title, Modifier.weight(1f), fontSize = 16.sp, fontWeight = FontWeight.Bold, color = if (dark) Color.White else ink, textAlign = TextAlign.Center)
        Spacer(Modifier.width(48.dp))
    }
}

@Composable
private fun SheetAction(label: String, dark: Boolean = false, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 16.dp).height(46.dp),
        shape = RoundedCornerShape(10.dp),
        colors = ButtonDefaults.buttonColors(containerColor = if (dark) Color(0xFF2878E8) else blue)
    ) { Text(label, fontSize = 14.sp, fontWeight = FontWeight.SemiBold) }
}
