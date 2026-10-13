package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.layout.ContentScale
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

    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.BottomCenter) {
        Box(Modifier.fillMaxSize().clickable { onClose() })
        Column(
            Modifier.fillMaxWidth()
                .clip(RoundedCornerShape(topStart = 14.dp, topEnd = 14.dp))
                .background(Color.White)
                .padding(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 24.dp)
                .heightIn(max = LocalConfiguration.current.screenHeightDp.dp * 0.70f)
        ) {
            Row(Modifier.fillMaxWidth().padding(bottom = 16.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("Tools", modifier = Modifier.weight(1f), fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF1F2937))
            }

            Row(Modifier.fillMaxWidth().padding(bottom = 16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                ToolCell(Modifier.weight(1f), "Clear-Chat", base + "IMG_20260814_110525.png", onClick = onClearChat)
                ToolCell(Modifier.weight(1f), "Public msg", base + "IMG_20260814_110608.png", toggle = !publicMsgOff, onClick = onTogglePublicMsg)
                ToolCell(Modifier.weight(1f), "Entry Effect", base + "IMG_20260814_110709.png", toggle = entryEffect, onClick = {
                    entryEffect = !entryEffect
                    prefs.edit().putBoolean("entry_effect", entryEffect).apply()
                })
                ToolCell(Modifier.weight(1f), "Gift Effect", base + "IMG_20260814_110727.png", toggle = giftEffect, onClick = {
                    giftEffect = !giftEffect
                    prefs.edit().putBoolean("gift_effect", giftEffect).apply()
                })
            }

            Row(Modifier.fillMaxWidth().padding(bottom = 16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                ToolCell(Modifier.weight(1f), "Music", base + "IMG_20260814_144255.png", onClick = { showMusic = true })
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    AsyncImage(model = base + "IMG_20260814_110628.png", contentDescription = "Speaker", modifier = Modifier.size(48.dp), contentScale = ContentScale.Fit)
                    Row(Modifier.padding(top = 4.dp).clickable { onToggleSpeaker() }, verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Speaker", fontSize = 10.sp, color = Color(0xFF374151), maxLines = 1, softWrap = false)
                        ToolToggle(speaker)
                    }
                }
                ToolCell(Modifier.weight(1f), "Store", base + "IMG_20260814_110501.png", onClick = { onOpenStore?.invoke("store") })
                ToolCell(Modifier.weight(1f), "My-Iteam", base + "IMG_20260814_110545.png", onClick = { onOpenStore?.invoke("bag") })
            }

            Text("Play Tools", modifier = Modifier.padding(top = 8.dp, bottom = 8.dp), fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF1F2937))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                ToolCell(Modifier.weight(1f), "Lucky bag", base + "1790602570756~2.jpg", onClick = { showLuckyBag = true })
                ToolCell(Modifier.weight(1f), "Pk Battle", base + "IMG_20260814_110802.png", onClick = {})
                Spacer(Modifier.weight(1f))
                Spacer(Modifier.weight(1f))
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

@Composable
private fun ToolCell(
    modifier: Modifier,
    title: String,
    imageUrl: String,
    toggle: Boolean? = null,
    onClick: () -> Unit
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = modifier) {
        Box(Modifier.size(48.dp), contentAlignment = Alignment.Center) {
            AsyncImage(model = imageUrl, contentDescription = title, modifier = Modifier.fillMaxSize().clickable(onClick = onClick), contentScale = ContentScale.Fit)
            if (toggle != null) Box(Modifier.align(Alignment.BottomEnd).clickable(onClick = onClick)) { ToolToggle(toggle) }
        }
        Text(title, modifier = Modifier.padding(top = 4.dp), fontSize = 10.sp, color = Color(0xFF374151), maxLines = 1, softWrap = false)
    }
}
