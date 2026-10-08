package com.hurry.voicechat

import android.content.Context
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalConfiguration
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

    Column(Modifier.fillMaxSize().background(Color(0xFFF3F6FA))) {
        Box(
            Modifier.fillMaxWidth().background(
                Brush.verticalGradient(
                    0.0f to Color(0xFF3B82F6),
                    0.60f to Color(0xFFEFF6FF),
                    1.0f to Color(0xFFF3F6FA)
                )
            )  .padding(top = 14.dp)
        ) {
            Text(
                "Message",
                Modifier.padding(start = 16.dp, top = 16.dp, bottom = 13.dp),
                color = Color.Black, fontSize = 26.sp, fontWeight = FontWeight.Normal
            )
        }

        LazyColumn(Modifier.fillMaxSize().background(Color(0xFFF3F6FA)).padding(bottom = 8.dp)) {
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
            Text(chat.name, color = Color(0xFF333333), fontSize = 16.sp, fontWeight = FontWeight.Normal)
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
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("hurry_user", Context.MODE_PRIVATE) }
    val currentPhoto = prefs.getString("photo", "") ?: ""
    val currentName = prefs.getString("name", "")?.takeIf { it.isNotBlank() } ?: "Hurry User"
    val isOfficial = name == "Hurry Team" || name == "Hurry System"

    var text by remember { mutableStateOf("") }
    var showOptions by remember { mutableStateOf(false) }
    var showEmojiPicker by remember { mutableStateOf(false) }
    var replyText by remember { mutableStateOf<String?>(null) }
    val messages = remember { mutableStateListOf<Pair<Boolean, String>>() }

    Box(Modifier.fillMaxSize().background(Color(0xFFF0F2F5))) {
        if (isOfficial) {
            AsyncImage(
                model = RAW_MSG + "file_00000000777481f588df50d28908ce63.png",
                contentDescription = null,
                modifier = Modifier
                    .fillMaxWidth()
                    .wrapContentHeight()
                    .align(Alignment.BottomCenter)
                    .alpha(0.05f),
                contentScale = ContentScale.FillWidth
            )
        }

        Column(Modifier.fillMaxSize()) {
            // Same structure as the real Hurry chat header:
            // blue-to-chat-background gradient, 12dp safe-area top, back + avatar + title.
            Row(
                Modifier.fillMaxWidth()
                    .background(Brush.verticalGradient(listOf(Color(0xFF3B82F6), Color(0xFFF0F2F5))))
                    .padding(top = (4f * LocalConfiguration.current.screenHeightDp / 100f).dp, start = 8.dp, end = 8.dp, bottom = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "‹",
                    fontSize = 38.sp,
                    color = Color(0xFF222222),
                    modifier = Modifier
                        .clickable(onClick = onBack)
                        .padding(horizontal = 7.dp)
                )
                AsyncImage(
                    model = image,
                    contentDescription = name,
                    modifier = Modifier.size(40.dp).clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.Center) {
                    Text(
                        name,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Normal,
                        color = Color(0xFF1F2937),
                        maxLines = 1
                    )
                    if (!isOfficial) {
                        Text("Online", fontSize = 11.sp, color = Color(0xFF16A34A), fontWeight = FontWeight.Medium)
                    }
                }
                if (!isOfficial) {
                    Text(
                        "⋮",
                        fontSize = 28.sp,
                        color = Color.Black,
                        modifier = Modifier
                            .clickable { showOptions = true }
                            .padding(horizontal = 8.dp)
                    )
                }
            }

            HorizontalDivider(color = Color(0xFFE1E5E9), thickness = 1.dp)

            // Real-chat style message surface: no card around the whole list.
            LazyColumn(
                Modifier.weight(1f).fillMaxWidth().padding(horizontal = 12.dp),
                reverseLayout = false,
                verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(top = 14.dp, bottom = 12.dp)
            ) {
                if (isOfficial && messages.isEmpty()) {
                    item {
                        Box(
                            Modifier.fillMaxWidth().padding(top = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "Messages from $name",
                                color = Color(0xFF6B7280),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Medium,
                                modifier = Modifier
                                    .clip(RoundedCornerShape(9.dp))
                                    .background(Color(0xFFD8DADD).copy(alpha = .72f))
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            )
                        }
                    }
                }

                items(messages) { item ->
                    val mine = item.first
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = if (mine) Arrangement.End else Arrangement.Start,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        if (!mine) {
                            AsyncImage(
                                model = image,
                                contentDescription = name,
                                modifier = Modifier.size(28.dp).clip(CircleShape),
                                contentScale = ContentScale.Crop
                            )
                            Spacer(Modifier.width(8.dp))
                        }

                        Column(horizontalAlignment = if (mine) Alignment.End else Alignment.Start) {
                            Surface(
                                color = if (mine) Color(0xFF374151) else Color.White,
                                shape = if (mine)
                                    RoundedCornerShape(18.dp, 18.dp, 4.dp, 18.dp)
                                else
                                    RoundedCornerShape(18.dp, 18.dp, 18.dp, 4.dp),
                                shadowElevation = if (mine) 0.dp else 1.dp
                            ) {
                                Column(Modifier.widthIn(max = 290.dp).padding(horizontal = 13.dp, vertical = 9.dp)) {
                                    if (replyText != null && mine) {
                                        Text(
                                            replyText!!,
                                            color = Color(0xFFCBD5E1),
                                            fontSize = 10.sp,
                                            maxLines = 1
                                        )
                                        Spacer(Modifier.height(3.dp))
                                    }
                                    Text(
                                        item.second,
                                        color = if (mine) Color.White else Color(0xFF1F2937),
                                        fontSize = 14.sp
                                    )
                                }
                            }
                        }

                        if (mine) {
                            Spacer(Modifier.width(8.dp))
                            if (currentPhoto.isNotBlank()) {
                                AsyncImage(
                                    model = currentPhoto,
                                    contentDescription = currentName,
                                    modifier = Modifier.size(28.dp).clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            } else {
                                Box(
                                    Modifier.size(28.dp).clip(CircleShape).background(Color(0xFF9CA3AF)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(currentName.take(1).uppercase(), color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Normal)
                                }
                            }
                        }
                    }
                }
            }

            // Real app input bar: image + emoji + rounded input + send icon.
            if (!isOfficial) {
                Column(
                    Modifier.fillMaxWidth()
                        .background(Color.White)
                        .navigationBarsPadding()
                ) {
                    if (replyText != null) {
                        Row(
                            Modifier.fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 6.dp)
                                .clip(RoundedCornerShape(7.dp))
                                .background(Color(0xFFF3F4F6))
                                .padding(horizontal = 10.dp, vertical = 7.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(Modifier.width(3.dp).height(28.dp).background(Color(0xFF3B82F6)))
                            Spacer(Modifier.width(8.dp))
                            Text(replyText!!, Modifier.weight(1f), fontSize = 11.sp, color = Color(0xFF6B7280), maxLines = 1)
                            Text("×", fontSize = 20.sp, color = Color(0xFF6B7280), modifier = Modifier.clickable { replyText = null })
                        }
                    }

                    Row(
                        Modifier.fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 9.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("▧", fontSize = 25.sp, color = Color(0xFF6B7280), modifier = Modifier.padding(horizontal = 2.dp))
                        Spacer(Modifier.width(7.dp))
                        Text(
                            "☺",
                            fontSize = 25.sp,
                            color = if (showEmojiPicker) Color(0xFF3B82F6) else Color(0xFF6B7280),
                            modifier = Modifier.clickable { showEmojiPicker = !showEmojiPicker }
                        )
                        Spacer(Modifier.width(8.dp))

                        Box(Modifier.weight(1f)) {
                            Row(
                                Modifier.fillMaxWidth()
                                    .clip(CircleShape)
                                    .background(Color(0xFFF1F3F5))
                                    .padding(start = 15.dp, end = 9.dp, top = 2.dp, bottom = 2.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                androidx.compose.foundation.text.BasicTextField(
                                    value = text,
                                    onValueChange = { text = it },
                                    singleLine = true,
                                    textStyle = androidx.compose.ui.text.TextStyle(
                                        color = Color.Black,
                                        fontSize = 14.sp
                                    ),
                                    modifier = Modifier.weight(1f).padding(vertical = 9.dp),
                                    decorationBox = { inner ->
                                        if (text.isEmpty()) Text("Type a message...", color = Color(0xFF8A8F98), fontSize = 14.sp)
                                        inner()
                                    }
                                )
                                Text(
                                    "➤",
                                    fontSize = 21.sp,
                                    color = if (text.isBlank()) Color(0xFFD1D5DB) else Color(0xFF3B82F6),
                                    modifier = Modifier
                                        .clickable(enabled = text.isNotBlank()) {
                                            messages.add(true to text.trim())
                                            text = ""
                                            showEmojiPicker = false
                                            replyText = null
                                        }
                                        .padding(horizontal = 5.dp)
                                )
                            }
                        }
                    }

                    if (showEmojiPicker) {
                        val emojis = listOf("😀","😂","🤣","🥺","😍","🥰","😘","😊","😉","😎","🤩","🥳","😒","😞","😢","😭","😡","🤬","😱","😴","🤔","🤭","❤️","🔥","✨","💯","👍","👏","🙌","💪")
                        Column(
                            Modifier.fillMaxWidth()
                                .height(230.dp)
                                .background(Color(0xFFF1F3F5))
                                .padding(8.dp)
                        ) {
                            emojis.chunked(8).forEach { row ->
                                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                                    row.forEach { emoji ->
                                        Text(emoji, fontSize = 25.sp, modifier = Modifier.clickable { text += emoji }.padding(5.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if (showOptions) {
            Box(
                Modifier.fillMaxSize().background(Color.Black.copy(alpha = .45f)).clickable { showOptions = false },
                contentAlignment = Alignment.BottomCenter
            ) {
                Column(
                    Modifier.fillMaxWidth()
                        .height(280.dp)
                        .clip(RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp))
                        .background(Color.Black)
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                        .clickable(enabled = false) {},
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Report", color = Color.White, fontSize = 16.sp, modifier = Modifier.padding(vertical = 12.dp).clickable { showOptions = false })
                    Text("Clear Chat", color = Color.White, fontSize = 16.sp, modifier = Modifier.padding(vertical = 12.dp).clickable {
                        messages.clear(); showOptions = false
                    })
                    Text("Delete Messages", color = Color.White, fontSize = 16.sp, modifier = Modifier.padding(vertical = 12.dp).clickable { showOptions = false })
                    Text("Block", color = Color.White, fontSize = 16.sp, modifier = Modifier.padding(vertical = 12.dp).clickable { showOptions = false })
                    Spacer(Modifier.weight(1f))
                    Box(
                        Modifier.fillMaxWidth().height(48.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFF3B82F6)).clickable { showOptions = false },
                        contentAlignment = Alignment.Center
                    ) { Text("Cancel", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Normal) }
                }
            }
        }
    }
}
