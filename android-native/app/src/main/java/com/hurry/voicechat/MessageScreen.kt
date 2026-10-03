package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage

private const val RAW_MSG = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"

private data class MessagePreview(val uid: String, val name: String, val image: String, val message: String, val time: String = "")

@Composable
fun MessageScreen(onChat: (String, String, String) -> Unit) {
    val chats = remember {
        listOf(
            MessagePreview("hurry_team_official", "Hurry Team", RAW_MSG + "logo.png", ""),
            MessagePreview("hurry_system_official", "Hurry System", RAW_MSG + "file_00000000a66881f8aa9e15d2fe2b9a0c.png", "")
        )
    }

    Column(Modifier.fillMaxSize().background(Color.White)) {
        Box(
            Modifier.fillMaxWidth().background(
                Brush.verticalGradient(listOf(Color(0xFF3B82F6), Color(0xFFDBEAFE), Color.White))
            ).padding(top = 11.dp)
        ) {
            Text(
                "Message",
                Modifier.padding(start = 16.dp, top = 16.dp, bottom = 13.dp),
                color = Color.Black, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold
            )
        }

        LazyColumn(Modifier.fillMaxSize().padding(bottom = 8.dp)) {
            items(chats) { chat ->
                MessageRow(chat) { onChat(chat.uid, chat.name, chat.image) }
            }
        }
    }
}

@Composable
private fun MessageRow(chat: MessagePreview, onClick: () -> Unit) {
    Row(
        Modifier.fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AsyncImage(
            model = chat.image, contentDescription = chat.name,
            modifier = Modifier.size(56.dp).clip(CircleShape),
            contentScale = ContentScale.Crop
        )
        Spacer(Modifier.width(8.dp))
        Column(Modifier.weight(1f)) {
            Text(chat.name, color = Color(0xFF333333), fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
            if (chat.message.isNotEmpty()) {
                Spacer(Modifier.height(3.dp))
                Text(chat.message, color = HurryMuted, fontSize = 14.sp, maxLines = 1)
            }
        }
        if (chat.time.isNotEmpty()) Text(chat.time, color = Color(0xFF999999), fontSize = 12.sp)
    }
}

@Composable
fun NativeChatScreen(
    name: String,
    image: String,
    onBack: () -> Unit
) {
    var text by remember { mutableStateOf("") }
    val isOfficial = name == "Hurry Team" || name == "Hurry System"
    val messages = remember { mutableStateListOf<String>() }

    Box(Modifier.fillMaxSize().background(Color(0xFFF0F2F5))) {
        if (isOfficial) {
            AsyncImage(
                model = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/file_00000000777481f588df50d28908ce63.png",
                contentDescription = null,
                modifier = Modifier.fillMaxSize().alpha(0.05f),
                contentScale = ContentScale.Crop
            )
        }

        Column(Modifier.fillMaxSize()) {
            Row(
                Modifier.fillMaxWidth().background(
                    Brush.verticalGradient(listOf(Color(0xFF3B82F6), Color(0xFFF0F2F5)))
                ).padding(top = 12.dp, start = 8.dp, end = 10.dp, bottom = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("‹", fontSize = 38.sp, color = Color(0xFF222222),
                    modifier = Modifier.clickable(onClick = onBack).padding(horizontal = 7.dp))
                AsyncImage(model = image, contentDescription = name,
                    modifier = Modifier.size(42.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f)) {
                    Text(name, fontSize = 17.sp, fontWeight = FontWeight.Bold,
                        color = Color(0xFF222222), maxLines = 1)
                    if (!isOfficial) Text("Online", fontSize = 11.sp, color = Color(0xFF16A34A))
                }
                if (!isOfficial) Text("⋮", fontSize = 27.sp, color = Color.Black)
            }
            HorizontalDivider(color = Color(0xFFE3E3E3))

            LazyColumn(
                Modifier.weight(1f).fillMaxWidth().padding(horizontal = 12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(vertical = 12.dp)
            ) {
                if (isOfficial && messages.isEmpty()) {
                    item {
                        Box(Modifier.fillMaxWidth().padding(top = 10.dp), contentAlignment = Alignment.Center) {
                            Text("Messages from $name", color = Color(0xFF8A8A8A), fontSize = 12.sp,
                                modifier = Modifier.clip(RoundedCornerShape(10.dp))
                                    .background(Color(0xFFE0E0E0).copy(alpha = .7f))
                                    .padding(horizontal = 10.dp, vertical = 5.dp))
                        }
                    }
                }
                items(messages) { message ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        Surface(color = Color(0xFF374151),
                            shape = RoundedCornerShape(18.dp, 18.dp, 4.dp, 18.dp)) {
                            Text(message, color = Color.White, fontSize = 14.sp,
                                modifier = Modifier.padding(horizontal = 13.dp, vertical = 9.dp))
                        }
                    }
                }
            }

            if (!isOfficial) {
                Row(Modifier.fillMaxWidth().background(Color.White).navigationBarsPadding()
                    .padding(horizontal = 10.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically) {
                    Text("＋", fontSize = 28.sp, color = Color(0xFF777777))
                    Spacer(Modifier.width(6.dp))
                    OutlinedTextField(value = text, onValueChange = { text = it },
                        modifier = Modifier.weight(1f), singleLine = true,
                        placeholder = { Text("Type a message...", color = Color(0xFF888888)) },
                        shape = RoundedCornerShape(22.dp))
                    Spacer(Modifier.width(6.dp))
                    Button(onClick = { if (text.isNotBlank()) { messages.add(text.trim()); text = "" } },
                        enabled = text.isNotBlank(), shape = CircleShape, contentPadding = PaddingValues(0.dp),
                        modifier = Modifier.size(46.dp)) { Text("➤", fontSize = 19.sp) }
                }
            }
        }
    }
}
