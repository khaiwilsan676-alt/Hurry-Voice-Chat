package com.hurry.voicechat

import android.content.Context
import android.content.ClipData
import android.content.ClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.border
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.material3.Icon
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.graphics.vector.addPath
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import coil3.compose.AsyncImage
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import org.json.JSONObject
import org.json.JSONArray

private const val RAW_ROOM = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"
private val RoomBg = Color(0xFF090B12)
private val Blue = Color(0xFF008CFF)

@Composable
fun RoomScreen(room: HurryRoom, onBack: () -> Unit) {
    var micOn by remember { mutableStateOf(true) }
    var showMessage by remember { mutableStateOf(false) }
    var showGift by remember { mutableStateOf(false) }
    var showChatInput by remember { mutableStateOf(false) }
    var chatText by remember { mutableStateOf("") }
    var showRoomInfo by remember { mutableStateOf(false) }
    var showActiveUsers by remember { mutableStateOf(false) }
    var roomInfoTab by remember { mutableStateOf("profile") }
    var copied by remember { mutableStateOf(false) }
    var activeUsers by remember { mutableStateOf(listOf<RoomPresenceUser>()) }
    var roomMessages by remember { mutableStateOf(listOf<RoomChatMessage>()) }
    val context = LocalContext.current
    val userPrefs = remember { context.getSharedPreferences("hurry_user", Context.MODE_PRIVATE) }
    val currentUid = userPrefs.getString("uid", "")?.takeIf { it.isNotBlank() } ?: "guest"
    val currentName = userPrefs.getString("name", "")?.takeIf { it.isNotBlank() } ?: "Hurry User"
    val currentPhoto = userPrefs.getString("photo", "")?.takeIf { it.isNotBlank() } ?: RAW_ROOM + "default-avatar.png"
    val roomOwnerId = room.accountId.ifBlank { room.id }
    var roomSocket by remember { mutableStateOf<Socket?>(null) }

    DisposableEffect(room.id, currentUid) {
        if (currentUid == "guest") return@DisposableEffect onDispose { }
        val socket = runCatching { IO.socket("https://hurry-voice-chat-lz75.onrender.com", IO.Options.builder().setTransports(arrayOf("websocket")).setReconnection(true).build()) }.getOrNull() ?: return@DisposableEffect onDispose { }
        roomSocket = socket
        val onConnect = Emitter.Listener {
            socket.emit("room_join", JSONObject().put("roomId", room.id).put("userId", currentUid).put("accountId", currentUid).put("roomOwnerId", roomOwnerId).put("name", currentName).put("dp", currentPhoto).put("email", ""))
            socket.emit("room_presence_request", JSONObject().put("roomId", room.id))
            socket.emit("room_seats_request", JSONObject().put("roomId", room.id))
        }
        val onPresence = Emitter.Listener { args ->
            val data = args.firstOrNull() as? JSONObject ?: return@Listener
            if (data.optString("roomId") != room.id) return@Listener
            val users = data.optJSONArray("users") ?: JSONArray()
            activeUsers = (0 until users.length()).mapNotNull { index ->
                val u = users.optJSONObject(index) ?: return@mapNotNull null
                val id = u.optString("accountId", u.optString("userId", u.optString("id")))
                if (id.isBlank()) null else RoomPresenceUser(id, u.optString("name", "User"), u.optString("image", u.optString("dp", "")))
            }
        }
        val onOnline = Emitter.Listener { args ->
            val data = args.firstOrNull() as? JSONObject ?: return@Listener
            if (data.optString("roomId") == room.id) { val id = data.optString("userId"); val u = data.optJSONObject("user") ?: JSONObject(); if (id.isNotBlank()) activeUsers = activeUsers.filterNot { it.accountId == id } + RoomPresenceUser(id, u.optString("name", "User"), u.optString("image", "/default-avatar.png")) }
        }
        val onOffline = Emitter.Listener { args -> val data = args.firstOrNull() as? JSONObject ?: return@Listener; if (data.optString("roomId") == room.id) activeUsers = activeUsers.filterNot { it.accountId == data.optString("userId") } }
        val onMessage = Emitter.Listener { args -> val data = args.firstOrNull() as? JSONObject ?: return@Listener; if (data.optString("roomId") == room.id) { val body = data.optString("text", ""); if (body.isNotBlank()) roomMessages = (roomMessages + RoomChatMessage(data.optString("senderName", "User"), body, data.optString("senderAvatar", ""))).takeLast(40) } }
        socket.on(Socket.EVENT_CONNECT, onConnect); socket.on("room_presence", onPresence); socket.on("room_user_online", onOnline); socket.on("room_user_offline", onOffline); socket.on("room_message", onMessage); socket.connect()
        onDispose { socket.off(Socket.EVENT_CONNECT, onConnect); socket.off("room_presence", onPresence); socket.off("room_user_online", onOnline); socket.off("room_user_offline", onOffline); socket.off("room_message", onMessage); socket.emit("room_leave", JSONObject().put("roomId", room.id).put("userId", currentUid).put("accountId", currentUid)); socket.disconnect(); socket.close(); roomSocket = null }
    }
    Box(Modifier.fillMaxSize().background(RoomBg)) {
        AsyncImage(model = RAW_ROOM + "1784533036732~2.jpg", contentDescription = null,
            modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop, alpha = 0.42f)

        Column(Modifier.fillMaxSize()) {
            RoomHeader(room, onBack, { roomInfoTab = "profile"; showRoomInfo = true }, { showActiveUsers = true }, activeUsers.size.coerceAtLeast(1))

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
                verticalArrangement = Arrangement.spacedBy(10.dp)) {
                SeatRow(listOf(1,2,3,4,5), room)
                SeatRow(listOf(6,7,8,9,10), room)
                SeatRow(listOf(11,12,13,14,15), room)
            }

            Row(
                Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 8.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                RoomBottomIcon(roomChatIcon(), "Say Hi Chat") { showChatInput = true }
                RoomBottomIcon(if (micOn) roomMicIcon(false) else roomMicIcon(true), "Microphone") { micOn = !micOn }
                RoomBottomIcon(roomEmojiIcon(), "Emoji") { }
                AsyncImage(
                    model = RAW_ROOM + "file_0000000019c4821180028eebae10dbfc.png",
                    contentDescription = "Gift",
                    modifier = Modifier.size(56.dp).clickable { showGift = true },
                    contentScale = ContentScale.Fit
                )
                RoomBottomIcon(roomMailIcon(), "Message box") { showMessage = !showMessage }
                RoomBottomIcon(roomAppsIcon(), "Apps menu") { }
            }
        }

        if (roomMessages.isNotEmpty() && !showRoomInfo && !showActiveUsers) {
            Column(Modifier.align(Alignment.BottomStart).padding(start = 10.dp, bottom = 76.dp).widthIn(max = 250.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                roomMessages.takeLast(3).forEach { message ->
                    Row(Modifier.clip(RoundedCornerShape(10.dp)).background(Color.Black.copy(alpha = .42f)).padding(horizontal = 8.dp, vertical = 5.dp)) {
                        Text(message.sender + ": ", color = Color(0xFF9EDCFF), fontSize = 11.sp)
                        Text(message.text, color = Color.White, fontSize = 11.sp, maxLines = 2)
                    }
                }
            }
        }

        if (showChatInput) {
            Row(
                Modifier.fillMaxWidth().align(Alignment.BottomCenter)
                    .background(Color.White).navigationBarsPadding()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                BasicTextField(
                    value = chatText, onValueChange = { chatText = it },
                    modifier = Modifier.weight(1f).padding(horizontal = 8.dp, vertical = 7.dp),
                    singleLine = true,
                    textStyle = TextStyle(color = Color(0xFF222222), fontSize = 14.sp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text, imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(onSend = {
                        val body = chatText.trim()
                        if (body.isNotEmpty() && currentUid != "guest") {
                            val payload = JSONObject().put("id", "$currentUid-${System.currentTimeMillis()}")
                                .put("roomId", room.id).put("senderId", currentUid).put("senderAccountId", currentUid)
                                .put("senderName", currentName).put("senderAvatar", currentPhoto).put("text", body)
                                .put("type", "message").put("createdAt", System.currentTimeMillis())
                            roomSocket?.emit("room_message", payload)
                            chatText = ""; showChatInput = false
                        }
                    }),
                    decorationBox = { inner ->
                        if (chatText.isEmpty()) Text("Type a message...", color = Color(0xFF9CA3AF), fontSize = 14.sp)
                        inner()
                    }
                )
                Box(Modifier.size(34.dp).clip(CircleShape).clickable {
                    val body = chatText.trim()
                    if (body.isNotEmpty() && currentUid != "guest") {
                        val payload = JSONObject().put("id", "$currentUid-${System.currentTimeMillis()}")
                            .put("roomId", room.id).put("senderId", currentUid).put("senderAccountId", currentUid)
                            .put("senderName", currentName).put("senderAvatar", currentPhoto).put("text", body)
                            .put("type", "message").put("createdAt", System.currentTimeMillis())
                        roomSocket?.emit("room_message", payload)
                        chatText = ""; showChatInput = false
                    }
                }, contentAlignment = Alignment.Center) {
                    androidx.compose.material3.Icon(imageVector = roomSendIcon(), contentDescription = "Send message",
                        tint = Color(0xFF008CFF), modifier = Modifier.size(23.dp))
                }
            }
        }

        if (showActiveUsers) {
            RoomBottomSheet(onDismiss = { showActiveUsers = false }, heightFraction = 0.40f) {
                Text("Active Users", modifier = Modifier.fillMaxWidth().padding(top = 16.dp, bottom = 10.dp), color = Color(0xFF222222), fontSize = 16.sp, textAlign = androidx.compose.ui.text.style.TextAlign.Center, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
                androidx.compose.material3.HorizontalDivider(color = Color(0xFFE5E7EB))
                Column(Modifier.fillMaxWidth().weight(1f).padding(horizontal = 12.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    RoomPersonRow(currentName, currentPhoto, "", true)
                    activeUsers.filterNot { it.accountId == roomOwnerId || it.accountId == currentUid }.forEach { person -> RoomPersonRow(person.name, person.image, person.accountId, false) }
                }
            }
        }
        if (showRoomInfo) {
            RoomBottomSheet(onDismiss = { showRoomInfo = false }, heightFraction = 0.50f) {
                Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                    listOf("profile" to "Room info", "members" to "Members").forEach { (key, label) ->
                        Column(Modifier.weight(1f).clickable { roomInfoTab = key }.padding(vertical = 2.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(label, color = if (roomInfoTab == key) Color.Black else Color(0xFF9CA3AF), fontSize = 14.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
                            Spacer(Modifier.height(2.dp))
                            if (roomInfoTab == key) androidx.compose.foundation.Canvas(Modifier.size(width = 20.dp, height = 6.dp)) { val p = androidx.compose.ui.graphics.Path().apply { moveTo(1.dp.toPx(), 1.dp.toPx()); quadraticTo(size.width / 2, size.height, size.width - 1.dp.toPx(), 1.dp.toPx()) }; drawPath(p, Color.Black, style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1.5.dp.toPx(), cap = androidx.compose.ui.graphics.StrokeCap.Round)) } else Spacer(Modifier.height(6.dp))
                        }
                    }
                }
                Column(Modifier.fillMaxWidth().weight(1f).padding(horizontal = 16.dp, vertical = 12.dp)) {
                    if (roomInfoTab == "profile") {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            AsyncImage(model = if (room.image.startsWith("http")) room.image else RAW_ROOM + room.image.trimStart('/'), contentDescription = "Room", modifier = Modifier.size(80.dp).clip(RoundedCornerShape(6.dp)), contentScale = ContentScale.Crop)
                            Column(Modifier.weight(1f)) {
                                Text(room.name.ifBlank { "Room" }, color = Color(0xFF1F2937), fontSize = 14.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold, maxLines = 1)
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text("ID: $roomOwnerId", color = Color(0xFF9CA3AF), fontSize = 10.sp, maxLines = 1)
                                    Spacer(Modifier.width(4.dp))
                                    androidx.compose.material3.Icon(imageVector = roomCopyIcon(), contentDescription = "Copy ID", tint = Color(0xFF6B7280), modifier = Modifier.size(14.dp).clickable { val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager; clipboard.setPrimaryClip(ClipData.newPlainText("Room ID", roomOwnerId)); copied = true })
                                    if (copied) Text("Copied!", color = Color(0xFF22C55E), fontSize = 10.sp)
                                }
                            }
                        }
                        Spacer(Modifier.height(12.dp))
                        Text("Host", color = Color(0xFF9CA3AF), fontSize = 10.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.Medium)
                        Text(currentName, color = Color(0xFF1F2937), fontSize = 12.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.Medium, modifier = Modifier.padding(top = 2.dp))
                        Spacer(Modifier.height(12.dp))
                        Text("Announcement:", color = Color(0xFF9CA3AF), fontSize = 10.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.Medium)
                        Text(room.announcement.ifBlank { "—" }, color = Color(0xFF374151), fontSize = 12.sp, modifier = Modifier.padding(top = 2.dp))
                    } else { RoomPersonRow(currentName, currentPhoto, "", true) }
                }
            }
        }
        if (showGift) {
            NativeGiftPicker(
                walletBalance = userPrefs.getLong("walletBalance", userPrefs.getLong("coins", 0L)),
                users = activeUsers,
                currentUid = currentUid,
                onClose = { showGift = false },
                onSend = { gift, multiplier, recipients ->
                    val amount = gift.coins.toLong() * multiplier
                    val payload = JSONObject()
                        .put("roomId", room.id)
                        .put("senderId", currentUid)
                        .put("recipientIds", JSONArray(recipients.map { it.accountId }))
                        .put("amount", amount)
                        .put("giftName", gift.name)
                        .put("giftImage", gift.image)
                        .put("giftType", gift.tab)
                        .put("senderName", currentName)
                        .put("senderImage", currentPhoto)
                        .put("recipientName", recipients.firstOrNull()?.name ?: "User")
                        .put("recipientImage", recipients.firstOrNull()?.image ?: "/default-avatar.png")
                        .put("multiplier", multiplier)
                        .put("luckyGift", gift.tab == "Lucky")
                        .put("luckyImage", gift.image)
                        .put("winTimes", 0)
                        .put("transferId", "tx-$currentUid-${System.currentTimeMillis()}")
                        .put("timestamp", System.currentTimeMillis())
                        .put("recipientMode", "selected")
                    roomSocket?.emit("coin_transfer", payload)
                    showGift = false
                }
            )
        }
    }
}

@Composable
private fun RoomHeader(room: HurryRoom, onBack: () -> Unit, onRoomInfo: () -> Unit, onActiveUsers: () -> Unit, activeCount: Int) {
    Row(
        Modifier.fillMaxWidth().statusBarsPadding().padding(top = 4.dp, start = 8.dp, end = 10.dp, bottom = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            Modifier.weight(1f).clip(RoundedCornerShape(topStart = 8.dp, bottomStart = 8.dp, topEnd = 28.dp, bottomEnd = 28.dp))
                .background(Color.Black.copy(alpha = .30f)).padding(start = 4.dp, end = 10.dp, top = 3.dp, bottom = 3.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = if (room.image.startsWith("http")) room.image else RAW_ROOM + room.image.trimStart('/'),
                contentDescription = room.name,
                modifier = Modifier.size(44.dp).clip(RoundedCornerShape(4.dp)).clickable(onClick = onRoomInfo),
                contentScale = ContentScale.Crop
            )
            Spacer(Modifier.width(8.dp))
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(room.name, fontSize = 16.sp, color = Color.White, maxLines = 1)
                    Spacer(Modifier.width(4.dp))
                    Box(
                        Modifier.size(22.dp).clip(CircleShape).background(Blue).clickable { },
                        contentAlignment = Alignment.Center
                    ) {
                        androidx.compose.material3.Icon(
                            imageVector = roomHeartIcon(),
                            contentDescription = "Follow room",
                            tint = Color.White,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
                Text("ID:" + room.id, fontSize = 11.sp, color = Color(0xFFD1D5DB), maxLines = 1)
            }
        }
        Spacer(Modifier.width(4.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(2.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                Modifier.height(38.dp).clip(CircleShape).background(Color.Black.copy(alpha = .30f))
                    .clickable(onClick = onActiveUsers),
                contentAlignment = Alignment.Center
            ) {
                Row(Modifier.padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                    androidx.compose.material3.Icon(
                        imageVector = roomPeopleIcon(),
                        contentDescription = "Room users",
                        tint = Color.White,
                        modifier = Modifier.size(26.dp)
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(activeCount.toString(), color = Color.White, fontSize = 11.sp)
                }
            }
            Box(
                Modifier.size(38.dp).clip(CircleShape).background(Color.Black.copy(alpha = .30f))
                    .clickable(onClick = onBack),
                contentAlignment = Alignment.Center
            ) {
                androidx.compose.material3.Icon(
                    imageVector = roomPowerIcon(),
                    contentDescription = "Exit room",
                    tint = Color.White,
                    modifier = Modifier.size(26.dp)
                )
            }
        }
    }
}

private fun roomStrokeVector(name: String, paths: List<String>, strokeWidth: Float = 2.4f): ImageVector {
    return ImageVector.Builder(name, 24.dp, 24.dp, 24f, 24f).apply {
        paths.forEach { data ->
            addPath(
                pathData = PathParser().parsePathString(data).toNodes(),
                fill = null,
                stroke = SolidColor(Color.White),
                strokeLineWidth = strokeWidth,
                strokeLineCap = androidx.compose.ui.graphics.StrokeCap.Round,
                strokeLineJoin = androidx.compose.ui.graphics.StrokeJoin.Round
            )
        }
    }.build()
}

private fun roomHeartIcon() = roomVector("RoomHeaderHeart", listOf(
    "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
))
private fun roomPeopleIcon() = roomVector("RoomHeaderPeople", listOf(
    "M9 11.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4z",
    "M2 20.5C2 15.5 5.2 13 9 13s7 2.5 7 7.5z",
    "M17.5 7.5h4.5v1.8h-4.5z",
    "M17.5 11.1h4.5v1.8h-4.5z",
    "M17.5 14.7H21v1.8h-3.5z"
))
private fun roomPowerIcon() = roomStrokeVector("RoomHeaderPower", listOf(
    "M12 4v8",
    "M18.36 6.64a9 9 0 1 1-12.72 0"
), 2.5f)


private fun roomVector(name: String, paths: List<String>, viewBox: String = "24,24"): ImageVector {
    val parts = viewBox.split(",").map { it.toFloat() }
    val builder = ImageVector.Builder(
        name = name,
        defaultWidth = parts[0].dp,
        defaultHeight = parts[1].dp,
        viewportWidth = parts[0],
        viewportHeight = parts[1]
    )
    paths.forEach { data ->
        builder.addPath(
            pathData = PathParser().parsePathString(data).toNodes(),
            fill = SolidColor(Color.White)
        )
    }
    return builder.build()
}

private fun roomChatIcon() = roomVector("RoomChat", listOf(
    "M12 2C6.48 2 2 5.92 2 10.75c0 2.8 1.5 5.29 3.82 6.84l-1.4 3.7c-.12.33.22.64.53.5l4-1.63c1 .3 2 .46 3.05.46 5.52 0 10-3.92 10-8.75S17.52 2 12 2zm-4 11.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
))
private fun roomEmojiIcon() = roomVector("RoomEmoji", listOf(
    "M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM8.5 7.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM7 14h10c0 3-2.5 5-5 5s-5-2-5-5z"
))
private fun roomMicIcon(muted: Boolean): ImageVector {
    val paths = mutableListOf(
        "M7.5 5.5a4.5 4.5 0 0 1 9 0v9a4.5 4.5 0 0 1-9 0z",
        "M4 11a8 8 0 0 0 16 0h-3a5 5 0 0 1-10 0z",
        "M10.5 18h3v5h-3z"
    )
    if (muted) paths.add("M1 1L23 23")
    val icon = roomVector(if (muted) "RoomMicMuted" else "RoomMic", paths)
    return icon
}
private fun roomMailIcon() = roomVector("RoomMail", listOf(
    "M2 8a3.5 3.5 0 0 1 3.5-3.5h13A3.5 3.5 0 0 1 22 8v8a3.5 3.5 0 0 1-3.5 3.5h-13A3.5 3.5 0 0 1 2 16z",
    "M3.5 7.5L12 13.5L20.5 7.5"
))
private fun roomAppsIcon() = roomVector("RoomApps", listOf(
    "M3 3h8v8H3z M13 3h8v8h-8z M3 13h8v8H3z M13.5 13.5h7v1.6h-7z M13.5 16.2h7v1.6h-7z M13.5 18.9h7v1.6h-7z"
))

@Composable
private fun RoomBottomIcon(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    description: String,
    onClick: () -> Unit
) {
    Box(Modifier.size(47.dp).clip(CircleShape).background(Color.Black.copy(alpha = .30f)).clickable(onClick = onClick),
        contentAlignment = Alignment.Center) {
        Icon(imageVector = icon, contentDescription = description, tint = Color.White, modifier = Modifier.size(30.dp))
    }
}

@Composable
private fun SeatRow(nums: List<Int>, room: HurryRoom) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.Top) {
        nums.forEach { number -> NativeSeat(number, room) }
    }
}

@Composable
private fun NativeSeat(number: Int, room: HurryRoom) {
    val occupied = number == 1
    val avatar = if (occupied) {
        if (room.image.startsWith("http")) room.image else RAW_ROOM + room.image.trimStart('/')
    } else RAW_ROOM + "file_000000003e7482309b7f6e7f2a922160.png"

    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(73.dp).clickable { }) {
        Box(Modifier.size(73.dp), contentAlignment = Alignment.Center) {
            Box(Modifier.fillMaxSize().clip(CircleShape).background(
                Brush.linearGradient(listOf(Color(0xFFD9F7FF), Color(0xFF91E1FF), Color(0xFF4DBFEF), Color(0xFF299DD6), Color(0xFF167DB9)))
            ))
            Box(Modifier.size(66.dp).clip(CircleShape).background(Color(0xFF090B12)), contentAlignment = Alignment.Center) {
                AsyncImage(model = avatar, contentDescription = if (occupied) room.name else "Empty seat $number",
                    modifier = Modifier.fillMaxSize().clip(CircleShape), contentScale = ContentScale.Crop)
            }
        }
        Spacer(Modifier.height(1.dp))
        Text(if (occupied) room.name else number.toString(), color = Color.White.copy(alpha = .9f),
            fontSize = 11.sp, maxLines = 1, modifier = Modifier.width(73.dp))
    }
}

private fun roomSendIcon() = roomStrokeVector("RoomSend", listOf(
    "M22 2L11 13",
    "M22 2L15 22L11 13L2 9L22 2"
), 2f)

private data class RoomPresenceUser(val accountId: String, val name: String, val image: String)
private data class RoomChatMessage(val sender: String, val text: String, val image: String)

@Composable
private fun RoomBottomSheet(onDismiss: () -> Unit, heightFraction: Float, content: @Composable ColumnScope.() -> Unit) {
    Box(Modifier.fillMaxSize()) {
        Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = .30f)).clickable(onClick = onDismiss))
        Column(Modifier.fillMaxWidth().fillMaxHeight(heightFraction).align(Alignment.BottomCenter).clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)).background(Color.White).navigationBarsPadding(), content = content)
    }
}

@Composable
private fun RoomPersonRow(name: String, image: String, accountId: String, isOwner: Boolean) {
    Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(Color(0xFFF9FAFB)).padding(horizontal = 8.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        AsyncImage(model = image.takeIf { it.isNotBlank() } ?: RAW_ROOM + "default-avatar.png", contentDescription = name, modifier = Modifier.size(36.dp).clip(CircleShape), contentScale = ContentScale.Crop)
        Spacer(Modifier.width(8.dp))
        Column(Modifier.weight(1f)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(name.ifBlank { if (isOwner) "Owner" else "User" }, color = Color(0xFF1F2937), fontSize = 12.sp, fontWeight = if (isOwner) androidx.compose.ui.text.font.FontWeight.SemiBold else androidx.compose.ui.text.font.FontWeight.Medium, maxLines = 1)
                if (isOwner) { Spacer(Modifier.width(5.dp)); androidx.compose.material3.Icon(imageVector = roomHouseIcon(), contentDescription = "Host", tint = Color(0xFF64748B), modifier = Modifier.size(14.dp)) }
            }
            if (!isOwner && accountId.isNotBlank()) Text("ID: $accountId", color = Color(0xFF9CA3AF), fontSize = 10.sp)
        }
    }
}

private fun roomCopyIcon() = roomStrokeVector("RoomCopy", listOf("M9 9h11v11H9z", "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"), 2f)
private fun roomHouseIcon() = roomVector("RoomHouse", listOf("M3 10.5L12 3l9 7.5v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"))


private data class NativeGift(val id: Int, val name: String, val coins: Int, val image: String, val tab: String, val noMask: Boolean = true)

private val nativeGiftTabs = listOf("Hot", "Lucky", "Luxury", "Event")
private val nativeGiftMultipliers = listOf(1, 10, 299, 599, 999)
private val nativeHotGifts = listOf(
    NativeGift(1, "Teddy", 70000, "IMG_20260922_142150.jpg", "Hot", false),
    NativeGift(2, "Autumn's Embrace", 54900, "IMG_20260922_182259.png", "Hot", false),
    NativeGift(3, "Arab King", 500000, "image_d9df9625~2.jpg", "Hot", false)
)
private val nativeLuckyGifts = listOf(
    NativeGift(101, "Tiara", 3000, "IMG_20260927_213855.png", "Lucky"),
    NativeGift(102, "Lucky Clover", 1499, "IMG_20260927_213917.png", "Lucky"),
    NativeGift(103, "Hi", 999, "IMG_20260927_213946.png", "Lucky"),
    NativeGift(104, "Rose", 3999, "IMG_20260927_214121.png", "Lucky"),
    NativeGift(105, "Kiss", 1600, "IMG_20260927_214139.png", "Lucky"),
    NativeGift(106, "Balloon", 4000, "IMG_20260927_214220.png", "Lucky"),
    NativeGift(107, "Dragon", 7000, "IMG_20260927_221521.png", "Lucky"),
    NativeGift(108, "Nine Hands", 10999, "IMG_20260927_221544.png", "Lucky"),
    NativeGift(109, "Coffin", 8999, "IMG_20260927_221559.png", "Lucky"),
    NativeGift(110, "Sword", 9999, "IMG_20260927_221615.png", "Lucky"),
    NativeGift(111, "Love lock", 5000, "IMG_20260927_221637.png", "Lucky"),
    NativeGift(112, "Lantern", 6999, "IMG_20260927_221654.png", "Lucky"),
    NativeGift(113, "Ring", 5999, "IMG_20260927_221707.png", "Lucky"),
    NativeGift(114, "Dancing Girl", 12000, "IMG_20260927_221722.png", "Lucky"),
    NativeGift(115, "Whale", 7899, "IMG_20260927_221742.png", "Lucky"),
    NativeGift(116, "Star", 9800, "file_0000000066f482118f772ed6fab4ad1f.png", "Lucky"),
    NativeGift(117, "Fire Bird", 13000, "file_00000000fe088211b7be0110e2d3f878.png", "Lucky")
)

@Composable
private fun NativeGiftPicker(
    walletBalance: Long,
    users: List<RoomPresenceUser>,
    currentUid: String,
    onClose: () -> Unit,
    onSend: (NativeGift, Int, List<RoomPresenceUser>) -> Unit
) {
    var activeTab by remember { mutableStateOf("Hot") }
    var selectedGiftId by remember { mutableIntStateOf(0) }
    var selectedMultiplier by remember { mutableIntStateOf(1) }
    var multiplierMenu by remember { mutableStateOf(false) }
    var selectedRecipients by remember { mutableStateOf(setOf<String>()) }
    var showRecipientPicker by remember { mutableStateOf(false) }
    var notice by remember { mutableStateOf("") }
    val gifts = when (activeTab) {
        "Hot" -> nativeHotGifts
        "Lucky" -> nativeLuckyGifts
        else -> emptyList()
    }
    val selectedGift = gifts.firstOrNull { it.id == selectedGiftId }
    val recipients = users.filter { selectedRecipients.contains(it.accountId) && it.accountId != currentUid }
    val cost = (selectedGift?.coins?.toLong() ?: 0L) * selectedMultiplier
    Box(Modifier.fillMaxSize()) {
        Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = .42f)).clickable(onClick = onClose))
        Column(
            Modifier.fillMaxWidth().fillMaxHeight(.70f).align(Alignment.BottomCenter)
                .clip(RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp))
                .background(Color(0xFF0C1418)).navigationBarsPadding().padding(horizontal = 12.dp, vertical = 10.dp)
        ) {
            Box(Modifier.align(Alignment.CenterHorizontally).width(34.dp).height(4.dp).clip(CircleShape).background(Color(0xFF58636A)))
            Spacer(Modifier.height(10.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Gift", color = Color.White, fontSize = 16.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
                Spacer(Modifier.weight(1f))
                Text("To: ${if (recipients.isEmpty()) "Select recipient" else recipients.size.toString() + " selected"}",
                    color = if (recipients.isEmpty()) Color(0xFF9CA3AF) else Color(0xFF60A5FA), fontSize = 11.sp,
                    modifier = Modifier.clip(RoundedCornerShape(12.dp)).clickable { showRecipientPicker = !showRecipientPicker }.padding(horizontal = 8.dp, vertical = 5.dp))
                Text("×", color = Color(0xFF9CA3AF), fontSize = 22.sp, modifier = Modifier.clickable(onClick = onClose).padding(start = 8.dp))
            }
            if (showRecipientPicker) {
                Row(Modifier.fillMaxWidth().heightIn(max = 54.dp).padding(vertical = 5.dp), horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                    if (users.isEmpty()) Text("No active room users", color = Color(0xFF9CA3AF), fontSize = 11.sp)
                    users.filterNot { it.accountId == currentUid }.forEach { person ->
                        Column(Modifier.clip(RoundedCornerShape(8.dp)).background(if (selectedRecipients.contains(person.accountId)) Color(0xFF173A62) else Color(0xFF172126))
                            .clickable { selectedRecipients = if (selectedRecipients.contains(person.accountId)) selectedRecipients - person.accountId else selectedRecipients + person.accountId }
                            .padding(5.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            AsyncImage(model = if (person.image.startsWith("http")) person.image else RAW_ROOM + person.image.trimStart('/'),
                                contentDescription = person.name, modifier = Modifier.size(25.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                            Text(person.name, color = Color.White, fontSize = 9.sp, maxLines = 1)
                        }
                    }
                }
            }
            androidx.compose.material3.HorizontalDivider(color = Color.White.copy(alpha = .10f))
            Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(22.dp)) {
                nativeGiftTabs.forEach { tab ->
                    val active = activeTab == tab
                    Column(Modifier.clickable { activeTab = tab; selectedGiftId = 0 }.padding(vertical = 2.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(tab, color = if (active) Color.White else Color(0xFF929CA2), fontSize = 13.sp,
                            fontWeight = if (active) androidx.compose.ui.text.font.FontWeight.Bold else androidx.compose.ui.text.font.FontWeight.Medium)
                        Spacer(Modifier.height(4.dp))
                        if (active) Box(Modifier.width(18.dp).height(2.dp).clip(CircleShape).background(Color(0xFF3B82F6)))
                    }
                }
            }
            Column(Modifier.weight(1f).fillMaxWidth().verticalScroll(androidx.compose.foundation.rememberScrollState())) {
                gifts.chunked(4).forEach { rowGifts ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                        rowGifts.forEach { gift ->
                            val selected = selectedGiftId == gift.id
                            Column(Modifier.weight(1f).clip(RoundedCornerShape(8.dp))
                                .background(if (selected) Color(0xFF17334A) else Color.Transparent)
                                .then(if (selected) Modifier.border(1.dp, Color(0xFF3B82F6), RoundedCornerShape(8.dp)) else Modifier)
                                .clickable { selectedGiftId = gift.id }
                                .padding(vertical = 5.dp, horizontal = 2.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                if (gift.tab == "Lucky" || (gift.tab == "Hot" && gift.id == 3)) {
                                    AsyncImage(model = RAW_ROOM + if (gift.tab == "Lucky") "IMG_20260928_172454.png" else "IMG_20260928_172516.png",
                                        contentDescription = null, modifier = Modifier.size(14.dp).align(Alignment.Start), contentScale = ContentScale.Fit)
                                }
                                AsyncImage(model = RAW_ROOM + gift.image, contentDescription = gift.name,
                                    modifier = Modifier.size(if (gift.noMask) 56.dp else 60.dp).clip(RoundedCornerShape(if (gift.noMask) 0.dp else 10.dp)),
                                    contentScale = if (gift.noMask) ContentScale.Fit else ContentScale.Crop)
                                Text(gift.name, color = Color.White, fontSize = 9.sp, maxLines = 1, modifier = Modifier.fillMaxWidth(), textAlign = androidx.compose.ui.text.style.TextAlign.Center)
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center) {
                                    AsyncImage(model = RAW_ROOM + "file_00000000e56882119c217d508b6733dc.png", contentDescription = "Coins",
                                        modifier = Modifier.size(10.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                                    Text("%,d".format(gift.coins), color = Color(0xFF9CA3AF), fontSize = 8.sp)
                                }
                            }
                        }
                        repeat(4 - rowGifts.size) { Spacer(Modifier.weight(1f)) }
                    }
                }
                if (gifts.isEmpty()) Box(Modifier.fillMaxWidth().padding(top = 45.dp), contentAlignment = Alignment.Center) {
                    Text("No gifts", color = Color(0xFF7B8790), fontSize = 12.sp)
                }
            }
            androidx.compose.material3.HorizontalDivider(color = Color.White.copy(alpha = .10f))
            Spacer(Modifier.height(7.dp))
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Row(Modifier.weight(1f).clickable { notice = "Wallet balance: %,d".format(walletBalance) }, verticalAlignment = Alignment.CenterVertically) {
                    AsyncImage(model = RAW_ROOM + "file_00000000e56882119c217d508b6733dc.png", contentDescription = "Coins",
                        modifier = Modifier.size(19.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                    Spacer(Modifier.width(5.dp))
                    Text("%,d".format(walletBalance), color = Color.White, fontSize = 11.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold)
                    Text("  ›", color = Color.White, fontSize = 16.sp)
                }
                Box {
                    Row(Modifier.clip(CircleShape).border(1.dp, Color(0xFF3B82F6), CircleShape), verticalAlignment = Alignment.CenterVertically) {
                        Text("${selectedMultiplier}×  ⌃", color = Color.White, fontSize = 11.sp,
                            modifier = Modifier.clickable { multiplierMenu = !multiplierMenu }.padding(horizontal = 10.dp, vertical = 8.dp))
                        Box(Modifier.width(1.dp).height(30.dp).background(Color(0xFF3B82F6)))
                        Text("Send", color = Color.White, fontSize = 11.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.Bold,
                            modifier = Modifier.clip(RoundedCornerShape(topEnd = 50.dp, bottomEnd = 50.dp))
                                .background(if (selectedGift != null && !multiplierMenu) Color(0xFF2563EB) else Color(0xFF53606A))
                                .clickable {
                                    when {
                                        selectedGift == null -> notice = "Select a gift"
                                        recipients.isEmpty() -> { showRecipientPicker = true; notice = "Select recipient" }
                                        cost > walletBalance -> notice = "Insufficient Balance"
                                        else -> onSend(selectedGift, selectedMultiplier, recipients)
                                    }
                                }.padding(horizontal = 18.dp, vertical = 8.dp))
                    }
                    if (multiplierMenu) Column(Modifier.align(Alignment.BottomEnd).padding(bottom = 42.dp)
                        .clip(RoundedCornerShape(8.dp)).background(Color(0xFF172126)).border(1.dp, Color.White.copy(alpha = .10f), RoundedCornerShape(8.dp))) {
                        nativeGiftMultipliers.forEach { value ->
                            Text("${value}×", color = if (value == selectedMultiplier) Color.White else Color(0xFFCBD5E1), fontSize = 11.sp,
                                modifier = Modifier.fillMaxWidth().clickable { selectedMultiplier = value; multiplierMenu = false }.padding(horizontal = 16.dp, vertical = 7.dp))
                        }
                    }
                }
            }
            if (notice.isNotBlank()) Text(notice, color = Color(0xFFFBBF24), fontSize = 10.sp, modifier = Modifier.padding(top = 4.dp))
        }
    }
}
