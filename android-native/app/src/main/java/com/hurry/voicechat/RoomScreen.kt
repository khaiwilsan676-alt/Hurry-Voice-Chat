package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage

private const val RAW_ROOM = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"
private val RoomBg = Color(0xFF090B12)
private val Blue = Color(0xFF008CFF)

@Composable
fun RoomScreen(room: HurryRoom, onBack: () -> Unit) {
    var micOn by remember { mutableStateOf(true) }
    var showMessage by remember { mutableStateOf(false) }
    var showGift by remember { mutableStateOf(false) }
    var showMore by remember { mutableStateOf(false) }
    var selectedSeat by remember { mutableStateOf<Int?>(null) }

    Box(Modifier.fillMaxSize().background(RoomBg)) {
        AsyncImage(model = RAW_ROOM + "1784533036732~2.jpg", contentDescription = null,
            modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop, alpha = 0.42f)

        Column(Modifier.fillMaxSize()) {
            RoomHeader(room, onBack)

            if (room.announcement.isNotBlank()) {
                Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 7.dp)
                    .clip(RoundedCornerShape(18.dp)).background(Color.Black.copy(alpha = .42f))
                    .padding(horizontal = 12.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("📢", fontSize = 13.sp)
                    Spacer(Modifier.width(6.dp))
                    Text(room.announcement, color = Color.White.copy(alpha = .9f), fontSize = 12.sp, maxLines = 1)
                }
            }

            Spacer(Modifier.height(8.dp))
            Column(Modifier.fillMaxWidth().weight(1f).padding(horizontal = 7.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp)) {
                SeatRow(listOf(1,2,3,4), room) { selectedSeat = it }
                SeatRow(listOf(5,6,7,8), room) { selectedSeat = it }
                SeatRow(listOf(5,6,7,8), room) { selectedSeat = it }
            }

            if (showMessage) {
                Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp)
                    .clip(RoundedCornerShape(20.dp)).background(Color.Black.copy(alpha = .7f)).padding(10.dp)) {
                    Text("Public message", color = Color.White, fontSize = 13.sp)
                }
            }

            Row(Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.CenterVertically) {
                RoomIconAction(Icons.Default.ChatBubbleOutline, "Message") { showMessage = !showMessage }
                RoomIconAction(Icons.Default.CardGiftcard, "Gift") { showGift = !showGift }
                RoomIconAction(if (micOn) Icons.Default.Mic else Icons.Default.MicOff, if (micOn) "Mic" else "Muted") { micOn = !micOn }
                RoomIconAction(Icons.Default.MoreHoriz, "More") { showMore = true }
            }
        }

        if (selectedSeat != null) {
            RoomProfileCard(room, selectedSeat!!, onClose = { selectedSeat = null })
        }

        if (showGift) {
            Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = .35f)).clickable { showGift = false },
                contentAlignment = Alignment.BottomCenter) {
                Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(22.dp, 22.dp, 0.dp, 0.dp))
                    .background(Color.White).padding(18.dp)) {
                    Text("Gift", color = Color.Black, fontSize = 20.sp)
                    Spacer(Modifier.height(12.dp))
                    Text("Hot    Lucky    Luxury    Event", color = Color.DarkGray, fontSize = 14.sp)
                    Spacer(Modifier.height(18.dp))
                    Text("Gift picker", color = Color.Gray, fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
private fun RoomHeader(room: HurryRoom, onBack: () -> Unit) {
    Row(Modifier.fillMaxWidth().statusBarsPadding().padding(top = 4.dp, start = 8.dp, end = 10.dp, bottom = 8.dp),
        verticalAlignment = Alignment.CenterVertically) {
        Text("‹", fontSize = 38.sp, color = Color.White,
            modifier = Modifier.clickable(onClick = onBack).padding(horizontal = 7.dp))
        AsyncImage(model = if (room.image.startsWith("http")) room.image else RAW_ROOM + room.image.trimStart('/'),
            contentDescription = room.name, modifier = Modifier.size(44.dp).clip(CircleShape), contentScale = ContentScale.Crop)
        Spacer(Modifier.width(9.dp))
        Column(Modifier.weight(1f)) {
            Text(room.name, fontSize = 16.sp, color = Color.White, maxLines = 1)
            Text("ID: " + room.id, fontSize = 10.sp, color = Color.White.copy(alpha = .65f), maxLines = 1)
        }
        Text("♡", color = Color.White, fontSize = 27.sp, modifier = Modifier.padding(6.dp))
        Box(Modifier.size(38.dp).clip(CircleShape).background(Blue), contentAlignment = Alignment.Center) {
            Text("⌂", color = Color.White, fontSize = 24.sp)
        }
    }
}

@Composable
private fun RoomIconAction(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.width(58.dp).clickable(onClick = onClick)) {
        Icon(icon, contentDescription = label, tint = Color.White, modifier = Modifier.size(27.dp))
        Spacer(Modifier.height(3.dp))
        Text(label, color = Color.White, fontSize = 10.sp)
    }
}

@Composable
private fun SeatRow(nums: List<Int>, room: HurryRoom, onSeat: (Int) -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.Top) {
        nums.forEach { n -> NativeSeat(n, room, onSeat) }
    }
}

@Composable
private fun NativeSeat(number: Int, room: HurryRoom, onSeat: (Int) -> Unit) {
    val occupied = number == 1
    val avatar = if (occupied) {
        if (room.image.startsWith("http")) room.image else RAW_ROOM + room.image.trimStart('/')
    } else RAW_ROOM + "file_000000003e7482309b7f6e7f2a922160.png"

    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(62.dp).clickable { onSeat(number) }) {
        Box(Modifier.size(62.dp), contentAlignment = Alignment.Center) {
            Box(Modifier.size(62.dp).clip(CircleShape)
                .background(if (occupied) Color(0xFF35B7F0) else Color(0xFF53606A)))
            AsyncImage(model = avatar, contentDescription = null,
                modifier = Modifier.size(55.dp).clip(CircleShape), contentScale = ContentScale.Crop)
        }
        Spacer(Modifier.height(2.dp))
        Text(if (occupied) room.name else number.toString(), color = Color.White.copy(alpha = .92f),
            fontSize = 10.sp, maxLines = 1)
    }
}


@Composable
private fun RoomProfileCard(room: HurryRoom, seat: Int, onClose: () -> Unit) {
    Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = .42f)).clickable { onClose() }, contentAlignment = Alignment.BottomCenter) {
        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(22.dp,22.dp,0.dp,0.dp)).background(Color.White).padding(20.dp).navigationBarsPadding()) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(model = if (room.image.startsWith("http")) room.image else RAW_ROOM + room.image.trimStart('/'), contentDescription = room.name, modifier = Modifier.size(72.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    Text(room.name, color = Color(0xFF111827), fontSize = 20.sp)
                    Text("Seat " + seat, color = Color(0xFF6B7280), fontSize = 12.sp)
                    Text("ID: " + room.accountId, color = Color(0xFF6B7280), fontSize = 12.sp)
                }
            }
            Spacer(Modifier.height(14.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(onClick = {}, Modifier.weight(1f)) { Text("Follow") }
                OutlinedButton(onClick = onClose, Modifier.weight(1f)) { Text("Message") }
            }
            TextButton(onClick = onClose, modifier = Modifier.fillMaxWidth()) { Text("Close") }
        }
    }
}
