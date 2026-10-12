package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage

data class NativeMusicTrack(val id: String, val name: String, val url: String)

@Composable
fun Fourgride(
    onClose: () -> Unit,
    onClearChat: () -> Unit,
    publicMsgOff: Boolean,
    onTogglePublicMsg: () -> Unit,
    speaker: Boolean,
    onToggleSpeaker: () -> Unit,
    onMusicPlay: ((NativeMusicTrack) -> Unit)? = null,
    onOpenStore: ((String) -> Unit)? = null
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val prefs = remember { context.getSharedPreferences("hurry_room_tools", android.content.Context.MODE_PRIVATE) }
    var entryEffect by remember { mutableStateOf(prefs.getBoolean("entry_effect", false)) }
    var giftEffect by remember { mutableStateOf(prefs.getBoolean("gift_effect", false)) }
    var showMusic by remember { mutableStateOf(false) }
    var showLuckyBag by remember { mutableStateOf(false) }

    val base = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"
    val tools = listOf(
        ToolItem("Clear-Chat", "IMG_20260814_110525.png") { onClearChat() },
        ToolItem("Public msg", "IMG_20260814_110608.png") { onTogglePublicMsg() },
        ToolItem("Entry Effect", "IMG_20260814_110709.png") {
            entryEffect = !entryEffect
            prefs.edit().putBoolean("entry_effect", entryEffect).apply()
        },
        ToolItem("Gift Effect", "IMG_20260814_110727.png") {
            giftEffect = !giftEffect
            prefs.edit().putBoolean("gift_effect", giftEffect).apply()
        },
        ToolItem("Music", "IMG_20260814_144255.png") { showMusic = true },
        ToolItem("Speaker", "IMG_20260814_110628.png") { onToggleSpeaker() },
        ToolItem("Store", "IMG_20260814_110501.png") { onOpenStore?.invoke("store") },
        ToolItem("My-Iteam", "IMG_20260814_110545.png") { onOpenStore?.invoke("bag") }
    )
    val playTools = listOf(
        ToolItem("Lucky bag", "1790602570756~2.jpg") { showLuckyBag = true },
        ToolItem("Pk Battle", "IMG_20260814_110802.png") { }
    )

    Box(Modifier.fillMaxSize().background(Color(0x66000000)).clickable { onClose() }, contentAlignment = Alignment.BottomCenter) {
        Column(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(topStart = 14.dp, topEnd = 14.dp))
                .background(Color.White).clickable(enabled = false) {}.padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 24.dp)
                .heightIn(max = 560.dp)
        ) {
            Row(Modifier.fillMaxWidth().padding(bottom = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("Tools", modifier = Modifier.weight(1f), fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1F2937))
                Text("×", Modifier.clip(RoundedCornerShape(20.dp)).clickable { onClose() }.padding(horizontal = 8.dp, vertical = 2.dp), fontSize = 28.sp, color = Color(0xFF6B7280))
            }
            androidx.compose.foundation.lazy.grid.LazyVerticalGrid(
                columns = androidx.compose.foundation.lazy.grid.GridCells.Fixed(4),
                modifier = Modifier.fillMaxWidth().heightIn(max = 210.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                userScrollEnabled = false
            ) {
                items(tools.size) { index ->
                    val item = tools[index]
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        Box(Modifier.size(48.dp).clickable { item.action() }, contentAlignment = Alignment.Center) {
                            AsyncImage(model = base + item.image, contentDescription = item.title, modifier = Modifier.fillMaxSize())
                            when (item.title) {
                                "Public msg" -> ToolToggle(!publicMsgOff)
                                "Entry Effect" -> ToolToggle(entryEffect)
                                "Gift Effect" -> ToolToggle(giftEffect)
                                "Speaker" -> ToolToggle(speaker)
                            }
                        }
                        Text(item.title, modifier = Modifier.padding(top = 4.dp), fontSize = 10.sp, color = Color(0xFF374151), maxLines = 1, softWrap = false)
                    }
                }
            }
            Text("Play Tools", modifier = Modifier.padding(top = 18.dp, bottom = 10.dp), fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF1F2937))
            androidx.compose.foundation.lazy.grid.LazyVerticalGrid(
                columns = androidx.compose.foundation.lazy.grid.GridCells.Fixed(4),
                modifier = Modifier.fillMaxWidth().heightIn(max = 100.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                userScrollEnabled = false
            ) {
                items(playTools.size) { index ->
                    val item = playTools[index]
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        Box(Modifier.size(48.dp).clickable { item.action() }, contentAlignment = Alignment.Center) {
                            AsyncImage(model = base + item.image, contentDescription = item.title, modifier = Modifier.fillMaxSize())
                        }
                        Text(item.title, modifier = Modifier.padding(top = 4.dp), fontSize = 10.sp, color = Color(0xFF374151), maxLines = 1, softWrap = false)
                    }
                }
            }
        }
    }

    if (showMusic) {
        AlertDialog(
            onDismissRequest = { showMusic = false },
            title = { Text("Music") },
            text = { Text("No music added yet. Add music from your phone in the Music panel.") },
            confirmButton = { TextButton(onClick = { showMusic = false; onClose() }) { Text("Back") } }
        )
    }
    if (showLuckyBag) {
        AlertDialog(
            onDismissRequest = { showLuckyBag = false },
            title = { Text("Lucky bag") },
            text = { Text("Lucky bag") },
            confirmButton = { TextButton(onClick = { showLuckyBag = false }) { Text("Close") } }
        )
    }
}

private data class ToolItem(val title: String, val image: String, val action: () -> Unit)

@Composable
private fun ToolToggle(enabled: Boolean) {
    Box(
        Modifier.padding(1.dp).size(width = 23.dp, height = 14.dp)
            .clip(RoundedCornerShape(50)).background(if (enabled) Color(0xFF3B82F6) else Color(0xFFD1D5DB))
            .padding(2.dp),
        contentAlignment = if (enabled) Alignment.CenterEnd else Alignment.CenterStart
    ) {
        Box(Modifier.size(10.dp).clip(RoundedCornerShape(50)).background(Color.White))
    }
}
