package com.hurry.voicechat

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import io.socket.client.Socket
import kotlinx.coroutines.delay
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.roundToInt

// --- TSX Interfaces & Data Models ---
data class RoomOwner(val id: String = "", val uid: String = "", val accountId: String = "", val name: String, val image: String)
data class CurrentUser(val id: String = "", val uid: String = "", val accountId: String, val name: String, val image: String)
data class Seat(val number: Int, var isOccupied: Boolean = false, var isLocked: Boolean = false, var user: RoomUser? = null, var isMuted: Boolean = false, var isSpeaking: Boolean = false, var gif: SeatGif? = null)
data class SeatGif(val src: String, val timestamp: Long)
data class Message(val id: String, val text: String, val sender: String, val senderImage: String, val senderAccountId: String = "", val timestamp: Long, val type: String = "message", val imageUrl: String? = null, val equippedBubble: String? = null, val equippedVehicle: String? = null)
data class RoomUser(val accountId: String, val name: String, val image: String)
data class MusicTrack(val id: String, val name: String, val url: String)

private val THEME_BACKGROUNDS = mapOf("forest-night" to "/1784875884052~2.jpg", "mood-light" to "/1784533036732~2.jpg")

@Composable
fun RoomPage(
    roomOwner: RoomOwner,
    currentUser: CurrentUser,
    onClose: () -> Unit = {},
    onBack: () -> Unit = {},
    onKeepRoom: (JSONObject) -> Unit = {},
    onFollowToggle: (String, Boolean) -> Unit = { _, _ -> }
) {
    val compactHeader = LocalConfiguration.current.screenWidthDp <= 400
    val footerButtonSize = if (compactHeader) 42.dp else 47.dp
    val footerIconSize = if (compactHeader) 26.dp else 30.dp
    val headerAvatarSize = if (compactHeader) 38.dp else 44.dp
    val headerButtonSize = if (compactHeader) 38.dp else 42.dp
    val headerIconSize = if (compactHeader) 22.dp else 26.dp
    val roomId = roomOwner.id.ifBlank { roomOwner.accountId }.ifBlank { "default-room" }
    val userAccountId = currentUser.accountId.ifBlank { currentUser.uid }.ifBlank { currentUser.id }.ifBlank { "guest" }

    // Socket instance (Assuming you have a singleton or pass it, matching TSX socket.on)
    val socket = SocketManager.getSocket() 

    // TSX UI States
    var showExitMenu by remember { mutableStateOf(false) }
    var showEmojiPicker by remember { mutableStateOf(false) }
    var showGiftPicker by remember { mutableStateOf(false) }
    var isSpeakerOn by remember { mutableStateOf(true) }
    var showMessageSheet by remember { mutableStateOf(false) }
    var showSettingPage by remember { mutableStateOf(false) }
    var showRoomInfo by remember { mutableStateOf(false) }
    var showActiveUsers by remember { mutableStateOf(false) }
    var showFourGride by remember { mutableStateOf(false) }
    var isFollowed by remember { mutableStateOf(false) }
    var copied by remember { mutableStateOf(false) }
    var localUser by remember { mutableStateOf(RoomUser(userAccountId, currentUser.name, currentUser.image)) }

    var showGameSheet by remember { mutableStateOf(false) }
    var showWildParty by remember { mutableStateOf("false") } // false, true, or minimized
    var showFruitParty by remember { mutableStateOf("false") } // false, true, or minimized
    var showRoomTask by remember { mutableStateOf(false) }
    var showStore by remember { mutableStateOf(false) }
    var storeInitialView by remember { mutableStateOf("store") }
    var showCupIcon by remember { mutableStateOf(false) }
    var cupCount by remember { mutableIntStateOf(0) }

    // Music Player States
    var musicControllerState by remember { mutableStateOf("hidden") } // hidden, full, minimized
    var currentTrack by remember { mutableStateOf<MusicTrack?>(null) }
    var isMusicPlaying by remember { mutableStateOf(false) }
    var musicVolume by remember { mutableFloatStateOf(1f) }
    var musicCurrentTime by remember { mutableFloatStateOf(0f) }
    var musicDuration by remember { mutableFloatStateOf(0f) }
    var miniPos by remember { mutableStateOf(IntOffset(20, 150)) }

    // Room specific states
    var publicMsgOff by remember { mutableStateOf(false) }
    var showPublicMsgModal by remember { mutableStateOf(false) }
    var roomAdmins by remember { mutableStateOf(listOf<String>()) }
    var showUserProfile by remember { mutableStateOf(false) }
    var profileUser by remember { mutableStateOf<RoomUser?>(null) }
    var messageText by remember { mutableStateOf("") }
    var messages by remember { mutableStateOf(listOf<Message>()) }
    var fullImageModal by remember { mutableStateOf<String?>(null) }

    var roomName by remember { mutableStateOf(roomOwner.name.ifBlank { "Room" }) }
    var roomAnnouncement by remember { mutableStateOf("") }
    var isLocked by remember { mutableStateOf(false) }
    var roomPassword by remember { mutableStateOf("") }
    var roomDp by remember { mutableStateOf(roomOwner.image.ifBlank { "/default-avatar.png" }) }
    var micMode by remember { mutableIntStateOf(15) }
    var roomInfoTab by remember { mutableStateOf("profile") }
    var backgroundImage by remember { mutableStateOf("/1784533036732~2.jpg") }

    var showChatInput by remember { mutableStateOf(false) }
    var roomUsers by remember { mutableStateOf(listOf<RoomUser>()) }
    var seats by remember { mutableStateOf(List(15) { Seat(it + 1) }) }
    var selectedSeat by remember { mutableStateOf<Int?>(null) }
    var showSeatSheet by remember { mutableStateOf(false) }

    val roomOwnerId = roomOwner.accountId.ifBlank { roomOwner.uid }.ifBlank { roomOwner.id }
    val isRoomOwner = userAccountId == roomOwnerId
    val isRoomAdmin = roomAdmins.contains(userAccountId)
    val canSendWhenPublicMsgOff = isRoomOwner || isRoomAdmin

    val hasSeat = seats.any { it.isOccupied && it.user?.accountId == userAccountId }
    val currentUserSeat = seats.find { it.isOccupied && it.user?.accountId == userAccountId }
    val liveUserCount = roomUsers.size

    val formatCupCount = { n: Int ->
        when {
            n >= 1000000 -> String.format("%.1fM", n / 1000000.0).replace(".0", "")
            n >= 1000 -> String.format("%.1fK", n / 1000.0).replace(".0", "")
            else -> n.toString()
        }
    }

    // Main UI Output
    if (showStore) {
        StorePage(onBack = { showStore = false }, initialView = storeInitialView)
        return
    }

    if (showSettingPage) {
        RoomSettingPage(
            onBack = { showSettingPage = false },
            roomOwnerId = roomOwnerId,
            roomData = JSONObject().put("roomName", roomName).put("roomDp", roomDp).put("micMode", micMode).put("announcement", roomAnnouncement).put("isLocked", isLocked),
            onSave = { /* Update Settings Logic mapped from TSX */ }
        )
        return
    }

    Box(Modifier.fillMaxSize().background(Color.Black)) {
        // Background Image
        AsyncImage(model = backgroundImage, contentDescription = "Bg", modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop, alpha = 0.60f)

        Column(Modifier.fillMaxSize().padding(top = 30.dp, bottom = 8.dp)) {
            
            // --- TOP HEADER ---
            Row(Modifier.fillMaxWidth().padding(horizontal = 8.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Row(Modifier.clip(RoundedCornerShape(topEnd = 24.dp, bottomEnd = 24.dp, topStart = 8.dp, bottomStart = 8.dp)).background(Color.Black.copy(alpha = 0.3f)).padding(end = 12.dp, top = 2.dp, bottom = 2.dp, start = 2.dp), verticalAlignment = Alignment.CenterVertically) {
                    AsyncImage(model = roomDp, contentDescription = "Room Dp", modifier = Modifier.size(headerAvatarSize).clip(RoundedCornerShape(8.dp)).clickable { roomInfoTab = "profile"; showRoomInfo = true }, contentScale = ContentScale.Crop)
                    Spacer(Modifier.width(8.dp))
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(if (roomName.length > 6) roomName.take(6) + "..." else roomName, color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.width(4.dp))
                            if (!isRoomOwner) {
                                Box(Modifier.size(if (compactHeader) 20.dp else 22.dp).clip(CircleShape).background(Color(0xFF008CFF)).clickable { isFollowed = !isFollowed; onFollowToggle(roomId, isFollowed) }, contentAlignment = Alignment.Center) {
                                    Icon(imageVector = TsxIcons.Follow, contentDescription = "Follow", tint = Color.White, modifier = Modifier.size(if (compactHeader) 13.dp else 14.dp))
                                }
                            }
                        }
                        Text("ID: ${roomOwner.accountId}", color = Color.White.copy(alpha = 0.9f), fontSize = 11.sp)
                    }
                }
                
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                    // Active Users Count Button
                    Row(Modifier.height(headerButtonSize).clip(CircleShape).background(Color.Black.copy(alpha = 0.3f)).clickable { showActiveUsers = true }.padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(imageVector = TsxIcons.People, contentDescription = "Users", tint = Color.White, modifier = Modifier.size(headerIconSize))
                        Spacer(Modifier.width(4.dp))
                        Text(liveUserCount.toString(), color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    if (isRoomOwner) {
                        Box(Modifier.size(headerButtonSize).clip(CircleShape).background(Color.Black.copy(alpha = 0.3f)).clickable { showSettingPage = true }, contentAlignment = Alignment.Center) {
                            Icon(imageVector = TsxIcons.Settings, contentDescription = "Settings", tint = Color.White, modifier = Modifier.size(headerIconSize))
                        }
                    }
                    Box(Modifier.size(headerButtonSize).clip(CircleShape).background(Color.Black.copy(alpha = 0.3f)).clickable { showExitMenu = true }, contentAlignment = Alignment.Center) {
                        Icon(imageVector = TsxIcons.Power, contentDescription = "Power", tint = Color.White, modifier = Modifier.size(headerIconSize))
                    }
                }
            }

            // --- TROPHY CARD ---
            Box(Modifier.fillMaxWidth().height(0.dp).padding(top = 8.dp)) { // Absolute positioning logic in Compose
                Row(Modifier.padding(start = 4.dp).clip(RoundedCornerShape(topEnd = 16.dp, bottomEnd = 16.dp)).background(Brush.horizontalGradient(listOf(Color(0xFF242B35).copy(alpha=0.9f), Color.Transparent))).clickable { showCupIcon = true }.padding(horizontal = 12.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    GreenColorRemovalShader(imageSrc = "/1788258883971~2.jpg", modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(formatCupCount(cupCount), color = Color(0xFFEEF3A3), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }

            // --- MIDDLE CONTENT ---
            Column(Modifier.fillMaxWidth().weight(1f).padding(top = 40.dp)) {
                
                // --- RENDER SEATS ---
                Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    if (micMode == 5) {
                        SeatRow(listOf(1), seats, userAccountId) { selectedSeat = it; showSeatSheet = true }
                        SeatRow(listOf(2, 3, 4, 5), seats, userAccountId) { selectedSeat = it; showSeatSheet = true }
                    } else if (micMode == 10) {
                        SeatRow(listOf(1, 2, 3, 4, 5), seats, userAccountId) { selectedSeat = it; showSeatSheet = true }
                        SeatRow(listOf(6, 7, 8, 9, 10), seats, userAccountId) { selectedSeat = it; showSeatSheet = true }
                    } else {
                        SeatRow(listOf(1, 2, 3, 4, 5), seats, userAccountId) { selectedSeat = it; showSeatSheet = true }
                        SeatRow(listOf(6, 7, 8, 9, 10), seats, userAccountId) { selectedSeat = it; showSeatSheet = true }
                        SeatRow(listOf(11, 12, 13, 14, 15), seats, userAccountId) { selectedSeat = it; showSeatSheet = true }
                    }
                }

                // --- CHAT MESSAGES ---
                val listState = rememberLazyListState()
                LazyColumn(state = listState, modifier = Modifier.weight(1f).padding(horizontal = 4.dp, vertical = 16.dp)) {
                    item {
                        Column(Modifier.fillMaxWidth(0.75f).clip(RoundedCornerShape(8.dp)).background(Color.Black.copy(alpha = 0.3f)).padding(12.dp)) {
                            Text("Official announcement: Welcome to Hurry Any Content Realted to porn,Froud,Fake Official will Ban!", color = Color(0xFFE2C67D), fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            if (roomAnnouncement.isNotBlank()) {
                                HorizontalDivider(Modifier.padding(vertical = 8.dp), color = Color.White.copy(alpha = 0.1f))
                                Text("ANNOUNCEMENT: $roomAnnouncement", color = Color(0xFFE2C67D), fontSize = 13.sp, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                    items(messages) { msg ->
                        MessageBubble(msg) { user -> profileUser = user; showUserProfile = true }
                    }
                }
            }

            // --- FOOTER CONTROLS ---
            if (!showChatInput) {
                Row(Modifier.fillMaxWidth().height(footerButtonSize).padding(horizontal = 8.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        FooterButton(TsxIcons.Chat) { if (publicMsgOff && !isRoomOwner) showPublicMsgModal = true else showChatInput = true }
                        if (hasSeat) {
                            FooterButton(if (currentUserSeat?.isMuted == true) TsxIcons.MicMute else TsxIcons.Mic, iconSize = 32.dp) { 
                                val nm = !(currentUserSeat?.isMuted ?: false)
                                // socket emit logic here
                            }
                            FooterButton(TsxIcons.Emoji, iconSize = footerIconSize) { showEmojiPicker = true }
                        }
                    }
                    
                    // Gift Center
                    AsyncImage(model = "/file_0000000019c4821180028eebae10dbfc.png", contentDescription = "Gift", modifier = Modifier.size(footerButtonSize + 9.dp).clickable { showGiftPicker = true }, contentScale = ContentScale.Fit)

                    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        FooterButton(TsxIcons.Mail, iconSize = footerIconSize + 2.dp) { showMessageSheet = true }
                        FooterButton(TsxIcons.Apps, iconSize = footerIconSize) { showFourGride = true }
                    }
                }
            }
        }

        // --- CHAT INPUT BAR ---
        if (showChatInput) {
            Box(Modifier.fillMaxSize().clickable { showChatInput = false }) // Dismiss area
            Row(Modifier.align(Alignment.BottomCenter).fillMaxWidth().background(Color.White).padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(imageVector = TsxIcons.ImageUpload, contentDescription = "Img", tint = Color.Gray, modifier = Modifier.size(30.dp).clickable { /* Upload Logic */ })
                BasicTextField(
                    value = messageText, onValueChange = { messageText = it },
                    modifier = Modifier.weight(1f).padding(horizontal = 8.dp), singleLine = true,
                    textStyle = TextStyle(color = Color(0xFF222222), fontSize = 14.sp),
                    decorationBox = { inner -> if (messageText.isEmpty()) Text("Type a message...", color = Color.Gray); inner() }
                )
                Icon(imageVector = TsxIcons.Send, contentDescription = "Send", tint = Color(0xFF008CFF), modifier = Modifier.size(30.dp).clickable { /* Send Logic */ messageText = ""; showChatInput = false })
            }
        }

        // --- FLOATING ACTION BANNER & GAMES ---
        if (!showChatInput) {
            Column(Modifier.align(Alignment.BottomEnd).padding(bottom = 80.dp, end = 10.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                RoomSideBanner()
                GreenColorRemovalShader("/IMG-20260902-WA0066.jpg", Modifier.size(63.dp).clickable { showRoomTask = true })
                WhiteColorRemovalShader("/IMG_20260814_111008.png", Modifier.size(56.dp).clickable { showGameSheet = true })
            }
        }

        // --- MINIMIZED GAMES ---
        if (!showChatInput) {
            Column(Modifier.align(Alignment.BottomEnd).padding(bottom = 80.dp, end = 10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                if (showWildParty == "minimized") {
                    AsyncImage(model = "/file_000000009d808211b8ffb7c2183b4ef5.png", contentDescription = "Wild", modifier = Modifier.size(60.dp).clickable { showWildParty = "true" })
                }
                if (showFruitParty == "minimized") {
                    AsyncImage(model = "/fruit-party-logo.jpg", contentDescription = "Fruit", modifier = Modifier.size(40.dp).clip(RoundedCornerShape(8.dp)).clickable { showFruitParty = "true" })
                }
            }
        }

        // --- MINIMIZED MUSIC CONTROLLER ---
        if (musicControllerState == "minimized" && currentTrack != null) {
            Box(Modifier.offset { miniPos }.size(36.dp).clip(CircleShape).background(Color(0xFF2563EB)).pointerInput(Unit) {
                detectDragGestures { change, dragAmount -> change.consume(); miniPos += IntOffset(dragAmount.x.roundToInt(), dragAmount.y.roundToInt()) }
            }.clickable { musicControllerState = "full" }, contentAlignment = Alignment.Center) {
                Icon(imageVector = TsxIcons.MusicMini, contentDescription = "Music", tint = Color.White, modifier = Modifier.size(24.dp))
            }
        }

        // ==========================================
        // ALL SHEETS AND MODALS (1-to-1 mapped)
        // ==========================================

        if (showExitMenu) {
            Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Black, Color.Black.copy(alpha=0.5f), Color.Transparent))).clickable { showExitMenu = false }) {
                Row(Modifier.align(Alignment.Center).padding(bottom = 100.dp), horizontalArrangement = Arrangement.spacedBy(64.dp)) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { onKeepRoom(JSONObject()); showExitMenu = false; onBack() }) {
                        AsyncImage(model = "/IMG_20261002_113229.png", contentDescription = "Keep", modifier = Modifier.size(67.dp))
                        Text("Keep", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { showExitMenu = false; onBack() }) {
                        AsyncImage(model = "/IMG_20261002_113213.png", contentDescription = "Exit", modifier = Modifier.size(67.dp))
                        Text("Exit", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }

        if (showActiveUsers) {
            TsxBottomSheet(onDismiss = { showActiveUsers = false }, fraction = 0.4f) {
                Text("Active Users", fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.fillMaxWidth().padding(16.dp), textAlign = TextAlign.Center)
                HorizontalDivider()
                LazyColumn(Modifier.padding(12.dp)) {
                    item { RoomPersonRow(localUser.name, localUser.image, localUser.accountId, true) }
                    items(roomUsers.filter { it.accountId != roomOwnerId }) { u ->
                        RoomPersonRow(u.name, u.image, u.accountId, false)
                    }
                }
            }
        }

        if (showRoomInfo) {
            TsxBottomSheet(onDismiss = { showRoomInfo = false }, fraction = 0.5f) {
                Row(Modifier.fillMaxWidth().padding(16.dp)) {
                    Text("Room info", modifier = Modifier.weight(1f).clickable { roomInfoTab = "profile" }.padding(8.dp), textAlign = TextAlign.Center, fontWeight = FontWeight.Bold, color = if (roomInfoTab == "profile") Color.Black else Color.Gray)
                    Text("Members", modifier = Modifier.weight(1f).clickable { roomInfoTab = "members" }.padding(8.dp), textAlign = TextAlign.Center, fontWeight = FontWeight.Bold, color = if (roomInfoTab == "members") Color.Black else Color.Gray)
                }
                if (roomInfoTab == "profile") {
                    Column(Modifier.padding(16.dp)) {
                        Row {
                            AsyncImage(model = roomDp, contentDescription = null, modifier = Modifier.size(80.dp).clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop)
                            Column(Modifier.padding(start = 8.dp)) {
                                Text(roomName, fontWeight = FontWeight.Bold)
                                Text("ID: $roomOwnerId", color = Color.Gray, fontSize = 12.sp)
                            }
                        }
                        Text("Host", color = Color.Gray, fontSize = 10.sp, modifier = Modifier.padding(top = 16.dp))
                        Text(localUser.name, fontSize = 12.sp)
                        Text("Announcement:", color = Color.Gray, fontSize = 10.sp, modifier = Modifier.padding(top = 16.dp))
                        Text(roomAnnouncement.ifBlank { "—" }, fontSize = 12.sp)
                    }
                } else {
                    RoomPersonRow(localUser.name, localUser.image, localUser.accountId, true)
                }
            }
        }

        if (showSeatSheet && selectedSeat != null) {
            val sData = seats[selectedSeat!! - 1]
            TsxBottomSheet(onDismiss = { showSeatSheet = false; selectedSeat = null }, fraction = 0.3f) {
                Column(Modifier.padding(16.dp)) {
                    if (!sData.isOccupied) {
                        Text("Take Mic", modifier = Modifier.fillMaxWidth().clickable { /* take seat */ showSeatSheet = false }.padding(12.dp), textAlign = TextAlign.Center)
                    } else if (sData.user?.accountId == userAccountId) {
                        Text("Leave Seat", modifier = Modifier.fillMaxWidth().clickable { /* leave seat */ showSeatSheet = false }.padding(12.dp), textAlign = TextAlign.Center)
                    }
                    Text(if (sData.isMuted) "Unmute Seat" else "Mute Seat", modifier = Modifier.fillMaxWidth().clickable { /* mute */ showSeatSheet = false }.padding(12.dp), textAlign = TextAlign.Center)
                    Text(if (sData.isLocked) "Unlock Mic" else "Lock Mic", modifier = Modifier.fillMaxWidth().clickable { /* lock */ showSeatSheet = false }.padding(12.dp), textAlign = TextAlign.Center)
                }
            }
        }

        if (showGameSheet) {
            TsxBottomSheet(onDismiss = { showGameSheet = false }, fraction = 0.2f) {
                Row(Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Games", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("×", fontSize = 24.sp, modifier = Modifier.clickable { showGameSheet = false })
                }
                Row(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { showGameSheet = false; showWildParty = "true" }) {
                        AsyncImage("/file_000000009d808211b8ffb7c2183b4ef5.png", null, Modifier.size(56.dp))
                        Text("Wild party", fontSize = 10.sp)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { showGameSheet = false; showFruitParty = "true" }) {
                        AsyncImage("/fruit-party-logo.jpg", null, Modifier.size(48.dp).clip(RoundedCornerShape(8.dp)))
                        Text("Fruit party", fontSize = 10.sp)
                    }
                }
            }
        }

        if (showPublicMsgModal) {
            Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha=0.5f)).clickable { showPublicMsgModal = false }, contentAlignment = Alignment.Center) {
                Column(Modifier.clip(RoundedCornerShape(16.dp)).background(Color.White).padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Public msg are off", fontWeight = FontWeight.Bold)
                    Text("Only the room owner can send messages right now.", fontSize = 12.sp, color = Color.Gray, modifier = Modifier.padding(top=8.dp, bottom=16.dp))
                    Button(onClick = { showPublicMsgModal = false }, colors = ButtonDefaults.buttonColors(containerColor = Color.Blue)) { Text("OK") }
                }
            }
        }

        // FULL Screen External Components (mapped to stubs below)
        if (showWildParty == "true") Wildparty(onClose = { showWildParty = "false" }, onMinimize = { showWildParty = "minimized" })
        if (showFruitParty == "true") Fruitparty(onClose = { showFruitParty = "false" }, onMinimize = { showFruitParty = "minimized" })
        if (showRoomTask) Roomtask(onBack = { showRoomTask = false })
        if (showCupIcon) CupIcon(onBack = { showCupIcon = false }, count = cupCount)
        if (showMessageSheet) MessagePage(roomId, roomName, roomDp) { showMessageSheet = false }
        if (showFourGride) Fourgride(onClose = { showFourGride = false })
        if (showEmojiPicker) EmojiPicker(onClose = { showEmojiPicker = false }, onSelect = { /* emit seat emoji */ })
        if (showGiftPicker) GiftPicker(onClose = { showGiftPicker = false }, onSend = { count -> cupCount += count })
        if (showUserProfile && profileUser != null) RoomProfile(profileUser!!) { showUserProfile = false }

        LuckyGiftAnimation(roomId)
    }
}

// ==========================================
// TSX EXTRACTED UI COMPONENTS
// ==========================================

@Composable
fun SeatRow(nums: List<Int>, seats: List<Seat>, currentUid: String, onClick: (Int) -> Unit) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
        nums.forEach { num ->
            val seat = seats[num - 1]
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(73.dp).clickable { onClick(num) }) {
                Box(Modifier.size(73.dp), contentAlignment = Alignment.Center) {
                    val bgColors = if (seat.isLocked) listOf(Color(0xFFF3F4F6), Color(0xFF6B7280)) else listOf(Color(0xFFD9F7FF), Color(0xFF167DB9))
                    Box(Modifier.size(66.dp).clip(CircleShape).background(Brush.linearGradient(bgColors)))
                    
                    Box(Modifier.size(60.dp).clip(CircleShape).background(Color(0xFF090B12)), contentAlignment = Alignment.Center) {
                        if (seat.isLocked) {
                            AsyncImage("/file_0000000015a48211b000ee447a786f7c.png", null, Modifier.size(40.dp))
                        } else if (seat.isOccupied && seat.user != null) {
                            AsyncImage(seat.user!!.image, null, Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                        } else {
                            AsyncImage("/file_000000003e7482309b7f6e7f2a922160.png", null, Modifier.size(45.dp))
                        }
                    }

                    if (seat.isMuted) {
                        Box(Modifier.align(Alignment.BottomEnd).offset((-4).dp, (-4).dp).size(18.dp).clip(CircleShape).background(Color.Red), contentAlignment = Alignment.Center) {
                            Icon(TsxIcons.MicMute, null, tint = Color.White, modifier = Modifier.size(10.dp))
                        }
                    }
                }
                Text(if (seat.isLocked) "$num" else if (seat.isOccupied) seat.user!!.name else "$num", color = Color.White, fontSize = 11.sp, maxLines = 1)
            }
        }
    }
}

@Composable
fun MessageBubble(msg: Message, onProfileClick: (RoomUser) -> Unit) {
    if (msg.type == "join") {
        Row(Modifier.padding(vertical = 4.dp).clip(RoundedCornerShape(8.dp)).background(Color.Black.copy(0.2f)).padding(8.dp)) {
            AsyncImage(msg.senderImage, null, Modifier.size(26.dp).clip(CircleShape).clickable { onProfileClick(RoomUser(msg.senderAccountId, msg.sender, msg.senderImage)) }, contentScale = ContentScale.Crop)
            Column(Modifier.padding(start = 6.dp)) {
                Text(msg.sender, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Text("Enter the Room", color = Color.White.copy(0.8f), fontSize = 11.sp)
            }
        }
    } else {
        Row(Modifier.padding(vertical = 4.dp).fillMaxWidth(0.75f)) {
            AsyncImage(msg.senderImage, null, Modifier.size(26.dp).clip(CircleShape).clickable { onProfileClick(RoomUser(msg.senderAccountId, msg.sender, msg.senderImage)) }, contentScale = ContentScale.Crop)
            Column(Modifier.padding(start = 6.dp)) {
                Text(msg.sender, color = Color.White.copy(0.9f), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                if (msg.equippedBubble != null) {
                    Box(Modifier.padding(top = 2.dp).defaultMinSize(minHeight = 40.dp)) {
                        AsyncImage(msg.equippedBubble, null, Modifier.matchParentSize(), contentScale = ContentScale.FillBounds)
                        Text(msg.text, color = Color.White, fontSize = 13.sp, modifier = Modifier.padding(12.dp))
                    }
                } else {
                    Box(Modifier.padding(top = 2.dp).clip(RoundedCornerShape(topEnd = 12.dp, bottomEnd = 12.dp, bottomStart = 12.dp)).background(Color.Black.copy(0.3f)).padding(horizontal = 8.dp, vertical = 6.dp)) {
                        Text(msg.text, color = Color.White, fontSize = 13.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun FooterButton(icon: ImageVector, iconSize: androidx.compose.ui.unit.Dp = 30.dp, onClick: () -> Unit) {
    val compact = LocalConfiguration.current.screenWidthDp <= 400
    val buttonSize = if (compact) 42.dp else 47.dp
    Box(Modifier.size(buttonSize).clip(CircleShape).background(Color.Black.copy(alpha = 0.3f)).clickable(onClick = onClick), contentAlignment = Alignment.Center) {
        Icon(icon, null, tint = Color.White, modifier = Modifier.size(iconSize))
    }
}

@Composable
fun RoomPersonRow(name: String, image: String, accountId: String, isOwner: Boolean) {
    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFFF9FAFB)).padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
        AsyncImage(image, null, Modifier.size(36.dp).clip(CircleShape), contentScale = ContentScale.Crop)
        Column(Modifier.padding(start = 8.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(name, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                if (isOwner) Icon(TsxIcons.House, null, modifier = Modifier.padding(start=4.dp).size(14.dp), tint = Color.Gray)
            }
            if (!isOwner) Text("ID: $accountId", color = Color.Gray, fontSize = 10.sp)
        }
    }
}

@Composable
fun RoomSideBanner() {
    val images = listOf("/1788339540059~2.jpg", "/1788339681679~2.jpg")
    var index by remember { mutableIntStateOf(0) }
    LaunchedEffect(Unit) { while(true) { delay(3000); index = (index + 1) % images.size } }
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        AsyncImage(images[index], null, Modifier.size(60.dp, 84.dp).clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop)
        Row(Modifier.padding(top = 2.dp), horizontalArrangement = Arrangement.spacedBy(2.dp)) {
            images.indices.forEach { i -> Box(Modifier.size(if(i==index) 6.dp else 4.dp).clip(CircleShape).background(if(i==index) Color.White else Color.White.copy(0.4f))) }
        }
    }
}

@Composable
fun TsxBottomSheet(onDismiss: () -> Unit, fraction: Float, content: @Composable ColumnScope.() -> Unit) {
    Box(Modifier.fillMaxSize()) {
        Box(Modifier.fillMaxSize().background(Color.Black.copy(0.3f)).clickable(onClick = onDismiss))
        Column(Modifier.fillMaxWidth().fillMaxHeight(fraction).align(Alignment.BottomCenter).clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)).background(Color.White), content = content)
    }
}

// Shader Placeholders since pure WebGL GLSL cannot map natively without heavy OpenGL boilerplate
@Composable fun GreenColorRemovalShader(imageSrc: String, modifier: Modifier) = AsyncImage(imageSrc, null, modifier)
@Composable fun WhiteColorRemovalShader(imageSrc: String, modifier: Modifier) = AsyncImage(imageSrc, null, modifier)

// ==========================================
// TSX EXTERNAL IMPORTS STUBS
// ==========================================
@Composable fun StorePage(onBack: () -> Unit, initialView: String) {}
@Composable fun RoomSettingPage(onBack: () -> Unit, roomOwnerId: String, roomData: JSONObject, onSave: (JSONObject) -> Unit) {}
@Composable fun MessagePage(roomId: String, roomName: String, roomDp: String, onClose: () -> Unit) {}
@Composable fun RoomProfile(user: RoomUser, onClose: () -> Unit) {}
@Composable fun Fourgride(onClose: () -> Unit) {}
@Composable fun Fruitparty(onClose: () -> Unit, onMinimize: () -> Unit) {}
@Composable fun EmojiPicker(onClose: () -> Unit, onSelect: (String) -> Unit) {}
@Composable fun GiftPicker(onClose: () -> Unit, onSend: (Int) -> Unit) {}
@Composable fun LuckyGiftAnimation(roomId: String) {}

// Socket Stub Object
object SocketManager { fun getSocket(): Socket? = null }

// TSX SVGs exactly mapped
object TsxIcons {
    private fun build(path: String) = ImageVector.Builder("Icon", 24.dp, 24.dp, 24f, 24f).apply { addPath(PathParser().parsePathString(path).toNodes(), fill = SolidColor(Color.White)) }.build()
    private fun buildStroke(path: String) = ImageVector.Builder("Icon", 24.dp, 24.dp, 24f, 24f).apply { addPath(PathParser().parsePathString(path).toNodes(), fill = null, stroke = SolidColor(Color.White), strokeLineWidth = 2.5f) }.build()
    val People = build("M9 11.2a4.2 4.2 0 1 0 0-8.4 4.2 4.2 0 0 0 0 8.4z M2 20.5C2 15.5 5.2 13 9 13s7 2.5 7 7.5z M17.5 7.5h4.5v1.8h-4.5z M17.5 11.1h4.5v1.8h-4.5z M17.5 14.7H21v1.8h-3.5z")
    val Settings = buildStroke("M12 2.5 L20.2 7.25 L20.2 16.75 L12 21.5 L3.8 16.75 L3.8 7.25 M12 9A3 3 0 1 0 12 15A3 3 0 1 0 12 9Z")
    val Power = buildStroke("M12 4v8 M18.36 6.64a9 9 0 1 1-12.72 0")
    val Follow = build("M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z")
    val Chat = build("M12 2C6.48 2 2 5.92 2 10.75c0 2.8 1.5 5.29 3.82 6.84l-1.4 3.7c-.12.33.22.64.53.5l4-1.63c1 .3 2 .46 3.05.46 5.52 0 10-3.92 10-8.75S17.52 2 12 2zm-4 11.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z")
    val Mic = build("M7.5 5.5a4.5 4.5 0 0 1 9 0v9a4.5 4.5 0 0 1-9 0z M4 11a8 8 0 0 0 16 0h-3a5 5 0 0 1-10 0z M10.5 18h3v5h-3z")
    val MicMute = build("M7.5 5.5a4.5 4.5 0 0 1 9 0v9a4.5 4.5 0 0 1-9 0z M4 11a8 8 0 0 0 16 0h-3a5 5 0 0 1-10 0z M10.5 18h3v5h-3z M1 1L23 23")
    val Emoji = build("M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM8.5 7.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm7 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM7 14h10c0 3-2.5 5-5 5s-5-2-5-5z")
    val Mail = build("M2 8a3.5 3.5 0 0 1 3.5-3.5h13A3.5 3.5 0 0 1 22 8v8a3.5 3.5 0 0 1-3.5 3.5h-13A3.5 3.5 0 0 1 2 16z M3.5 7.5L12 13.5L20.5 7.5")
    val Apps = build("M3 3h8v8H3z M13 3h8v8h-8z M3 13h8v8H3z M13.5 13.5h7v1.6h-7z M13.5 16.2h7v1.6h-7z M13.5 18.9h7v1.6h-7z")
    val ImageUpload = buildStroke("M3 3h18v18H3z M8.5 8.5m-1.5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0 M21 15l-5-5-11 11")
    val Send = buildStroke("M22 2L11 13 M22 2L15 22L11 13L2 9L22 2")
    val House = build("M3 10.5L12 3l9 7.5v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z")
    val MusicMini = build("M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z")
}
