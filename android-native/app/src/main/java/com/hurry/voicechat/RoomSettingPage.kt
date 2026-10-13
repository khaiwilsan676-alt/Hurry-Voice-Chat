package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
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
    val roomDp: String = ""
)

private data class RoomThemeChoice(val id: String, val name: String, val image: String)
private val roomThemeChoices = listOf(
    RoomThemeChoice("forest-night", "Forest Night", "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/1784875884052~2.jpg"),
    RoomThemeChoice("mood-light", "Moon Light", "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/1784533036732~2.jpg")
)

@Composable
fun RoomSettingPage(
    initial: RoomSettingsDataNative = RoomSettingsDataNative(),
    onBack: () -> Unit = {},
    onSave: (RoomSettingsDataNative) -> Unit = {}
) {
    var state by remember { mutableStateOf(initial) }
    var dialog by remember { mutableStateOf("") }
    var draft by remember { mutableStateOf("") }
    val ink = Color(0xFF252525)
    val muted = Color(0xFF858585)
    val selectedTheme = roomThemeChoices.firstOrNull { it.id == state.theme }

    Column(Modifier.fillMaxSize().background(Color(0xFFF7F7F7))) {
        Row(Modifier.fillMaxWidth().background(Color.White).statusBarsPadding().height(54.dp).padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack, modifier = Modifier.size(36.dp)) { Icon(Icons.Default.ArrowBack, null, tint = ink) }
            Text("Room Settings", Modifier.weight(1f), fontSize = 18.sp, fontWeight = FontWeight.SemiBold, color = ink, textAlign = androidx.compose.ui.text.style.TextAlign.Center)
            Spacer(Modifier.size(36.dp))
        }
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color.White).padding(14.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("Basic information", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = ink)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(64.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFFF0F0F0)), contentAlignment = Alignment.Center) {
                        if (state.roomDp.isNotBlank()) AsyncImage(model = state.roomDp, contentDescription = "Room profile", modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                        else Text("Room", color = muted, fontSize = 11.sp)
                    }
                    Column(Modifier.weight(1f).padding(start = 12.dp)) {
                        Text(state.roomName.ifBlank { "Room" }, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = ink)
                        Text("Room profile and name", fontSize = 12.sp, color = muted)
                    }
                }
                SettingsEntry("Room name", state.roomName.ifBlank { "Set room name" }) { draft = state.roomName; dialog = "name" }
                HorizontalDivider(color = Color(0xFFF0F0F0))
                SettingsEntry("Room announcement", state.announcement.ifBlank { "Add an announcement" }) { draft = state.announcement; dialog = "announcement" }
            }
            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color.White).padding(14.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("Room appearance", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = ink)
                Row(Modifier.fillMaxWidth().clickable { dialog = "theme" }, verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Palette, null, tint = Color(0xFF6D7FE8))
                    Column(Modifier.weight(1f).padding(start = 10.dp)) {
                        Text("Room Theme", fontSize = 14.sp, color = ink)
                        Text(selectedTheme?.name ?: if (state.theme == "custom") "Custom" else "Choose a theme", fontSize = 12.sp, color = muted)
                    }
                    Icon(Icons.Default.ChevronRight, null, tint = muted)
                }
                if (selectedTheme != null) AsyncImage(model = selectedTheme.image, contentDescription = selectedTheme.name, modifier = Modifier.fillMaxWidth().height(130.dp).clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop)
            }
            Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color.White).padding(14.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("Room management", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = ink)
                Row(Modifier.fillMaxWidth().clickable { draft = state.roomPassword; dialog = "password" }, verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Lock, null, tint = if (state.isLocked) Color(0xFFE15B64) else muted)
                    Column(Modifier.weight(1f).padding(start = 10.dp)) {
                        Text("Lock Room", fontSize = 14.sp, color = ink)
                        Text(if (state.isLocked) "Room is locked" else "Set a 4-digit room password", fontSize = 12.sp, color = muted)
                    }
                    Icon(Icons.Default.ChevronRight, null, tint = muted)
                }
                HorizontalDivider(color = Color(0xFFF0F0F0))
                Row(Modifier.fillMaxWidth().clickable { dialog = "mic" }, verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Mic, null, tint = Color(0xFF6D7FE8))
                    Column(Modifier.weight(1f).padding(start = 10.dp)) {
                        Text("Mic Mode", fontSize = 14.sp, color = ink)
                        Text("Mic ${state.micMode}", fontSize = 12.sp, color = muted)
                    }
                    Icon(Icons.Default.ChevronRight, null, tint = muted)
                }
            }
            Button(onClick = { onSave(state) }, modifier = Modifier.fillMaxWidth().height(48.dp), shape = RoundedCornerShape(10.dp), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4388F5))) { Text("Save", fontSize = 15.sp, fontWeight = FontWeight.SemiBold) }
        }
    }

    if (dialog == "name") AlertDialog(
        onDismissRequest = { dialog = "" },
        title = { Text("Room Name") },
        text = { Column { OutlinedTextField(draft, { draft = it.take(30) }, singleLine = true, label = { Text("${draft.length}/30") }) } },
        confirmButton = { TextButton(onClick = { state = state.copy(roomName = draft); dialog = "" }) { Text("Save") } },
        dismissButton = { TextButton(onClick = { dialog = "" }) { Text("Cancel") } }
    )
    if (dialog == "announcement") AlertDialog(
        onDismissRequest = { dialog = "" },
        title = { Text("Announcement") },
        text = { OutlinedTextField(draft, { draft = it.take(200) }, minLines = 3, maxLines = 6, label = { Text("${draft.length}/200") }) },
        confirmButton = { TextButton(onClick = { state = state.copy(announcement = draft); dialog = "" }) { Text("Save") } },
        dismissButton = { TextButton(onClick = { dialog = "" }) { Text("Cancel") } }
    )
    if (dialog == "password") AlertDialog(
        onDismissRequest = { dialog = "" },
        title = { Text(if (state.isLocked) "Update Room Password" else "Set Room Password") },
        text = { OutlinedTextField(draft, { draft = it.filter { c -> c.isDigit() }.take(4) }, singleLine = true, label = { Text("4-digit password") }) },
        confirmButton = { TextButton(enabled = draft.length == 4, onClick = { state = state.copy(isLocked = true, roomPassword = draft); dialog = "" }) { Text("Set Password") } },
        dismissButton = { TextButton(onClick = { if (state.isLocked) state = state.copy(isLocked = false, roomPassword = ""); dialog = "" }) { Text(if (state.isLocked) "Unlock Room" else "Cancel") } }
    )
    if (dialog == "mic") AlertDialog(
        onDismissRequest = { dialog = "" },
        title = { Text("Select Mic Mode") },
        text = { Column(verticalArrangement = Arrangement.spacedBy(6.dp)) { listOf(5, 10, 15).forEach { mode -> Row(Modifier.fillMaxWidth().clickable { state = state.copy(micMode = mode) }.padding(8.dp), verticalAlignment = Alignment.CenterVertically) { RadioButton(selected = state.micMode == mode, onClick = { state = state.copy(micMode = mode) }); Text("Mic $mode") } } } },
        confirmButton = { TextButton(onClick = { dialog = "" }) { Text("Confirm") } }
    )
    if (dialog == "theme") AlertDialog(
        onDismissRequest = { dialog = "" },
        title = { Text("Room Theme") },
        text = { Column(verticalArrangement = Arrangement.spacedBy(10.dp)) { roomThemeChoices.forEach { theme -> Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(if (state.theme == theme.id) Color(0xFFEAF1FF) else Color.White).clickable { state = state.copy(theme = theme.id); dialog = "" }.padding(8.dp), verticalAlignment = Alignment.CenterVertically) { AsyncImage(model = theme.image, contentDescription = theme.name, modifier = Modifier.size(54.dp, 68.dp).clip(RoundedCornerShape(6.dp)), contentScale = ContentScale.Crop); Column(Modifier.weight(1f).padding(start = 10.dp)) { Text(theme.name, color = ink, fontSize = 14.sp); if (state.theme == theme.id) Text("Selected", color = Color(0xFF4388F5), fontSize = 11.sp) } } }; TextButton(onClick = { state = state.copy(theme = "custom"); dialog = "" }) { Text("Custom theme") } } },
        confirmButton = { TextButton(onClick = { dialog = "" }) { Text("Done") } }
    )
}

@Composable
private fun SettingsEntry(title: String, subtitle: String, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().clickable(onClick = onClick).padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(title, fontSize = 14.sp, color = Color(0xFF252525))
            Text(subtitle, fontSize = 12.sp, color = Color(0xFF858585))
        }
        Icon(Icons.Default.ChevronRight, null, tint = Color(0xFF858585))
    }
}
