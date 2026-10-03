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
                color = Color.Black, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold
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
    val messages = remember { mutableStateListOf<String>() }

    Column(Modifier.fillMaxSize().background(Color.White)) {
        Row(
            Modifier.fillMaxWidth().background(Color.White).padding(top = 12.dp, start = 8.dp, end = 12.dp, bottom = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("‹", fontSize = 38.sp, color = Color.Black,
                modifier = Modifier.clickable(onClick = onBack).padding(horizontal = 8.dp))
            AsyncImage(
                model = image, contentDescription = name,
                modifier = Modifier.size(42.dp).clip(CircleShape), contentScale = ContentScale.Crop
            )
            Spacer(Modifier.width(10.dp))
            Text(name, fontSize = 17.sp, fontWeight = FontWeight.Bold, color = Color(0xFF222222))
        }

        HorizontalDivider(color = Color(0xFFEDEDED))

        LazyColumn(
            Modifier.weight(1f).fillMaxWidth().padding(horizontal = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(vertical = 12.dp)
        ) {
            items(messages) { message ->
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    Surface(
                        color = Color(0xFF008CFF),
                        shape = RoundedCornerShape(18.dp, 18.dp, 4.dp, 18.dp)
                    ) {
                        Text(message, color = Color.White, fontSize = 15.sp,
                            modifier = Modifier.padding(horizontal = 13.dp, vertical = 9.dp))
                    }
                }
            }
        }

        Row(
            Modifier.fillMaxWidth().navigationBarsPadding().padding(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = text, onValueChange = { text = it },
                modifier = Modifier.weight(1f), singleLine = true,
                placeholder = { Text("Message") },
                shape = RoundedCornerShape(22.dp)
            )
            Spacer(Modifier.width(6.dp))
            Button(
                onClick = { if (text.isNotBlank()) { messages.add(text.trim()); text = "" } },
                enabled = text.isNotBlank(), shape = CircleShape,
                contentPadding = PaddingValues(0.dp), modifier = Modifier.size(48.dp)
            ) { Text("➤", fontSize = 20.sp) }
        }
    }
}
