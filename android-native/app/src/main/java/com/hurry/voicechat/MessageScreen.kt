package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage

private const val RAW_MSG = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"

private data class MessagePreview(val name: String, val image: String, val message: String)

@Composable
fun MessageScreen() {
    val chats = remember {
        listOf(
            MessagePreview("Hurry Team", RAW_MSG + "logo.png", "Welcome to Hurry"),
            MessagePreview("Hurry System", RAW_MSG + "file_00000000a66881f8aa9e15d2fe2b9a0c.png", "System notification")
        )
    }
    Column(Modifier.fillMaxSize().background(Color.White).padding(top = 16.dp)) {
        Text("Message", Modifier.padding(horizontal = 16.dp), fontSize = 25.sp, color = HurryText)
        Spacer(Modifier.height(10.dp))
        LazyColumn(Modifier.fillMaxSize()) {
            items(chats) { chat ->
                Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    AsyncImage(chat.image, null, Modifier.size(56.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                    Spacer(Modifier.width(12.dp))
                    Column(Modifier.weight(1f)) {
                        Text(chat.name, fontSize = 16.sp, color = HurryText)
                        Spacer(Modifier.height(4.dp))
                        Text(chat.message, fontSize = 13.sp, color = HurryMuted, maxLines = 1)
                    }
                }
            }
        }
    }
}