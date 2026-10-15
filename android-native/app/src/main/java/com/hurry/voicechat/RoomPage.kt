package com.example.voiceroom

import android.os.Bundle
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsDraggedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.core.view.WindowCompat
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// ============================================================================
// UNIFORM CONSTANTS (Top Icons & Bottom Icons exact same gap)
// ============================================================================
private val UniformIconGap = 8.dp
private val SeatCardExactSize = 60.dp
private val SeatWhiteMicIconSize = 32.dp
private val TopUserPillHeight = 24.dp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // KEYBOARD FIX: Isse Compose ka .imePadding() 100% accurate kaam karta hai
        // aur chat input hamesha keyboard ke bilkul upar rehta hai
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)

        setContent {
            MaterialTheme {
                VoiceRoomCompleteScreen()
            }
        }
    }
}

// ============================================================================
// DATA MODELS
// ============================================================================
data class MicSeatModel(
    val seatNumber: Int,
    val userName: String? = null,
    val avatarColor: Color = Color(0xFF6C5CE7),
    val isLocked: Boolean = false,
    val isMuted: Boolean = false,
    val isSpeaking: Boolean = false
)

data class RoomChatMessageModel(
    val id: Long,
    val senderName: String,
    val senderLevel: Int,
    val message: String,
    val badgeColor: Color = Color(0xFF00B0FF)
)

data class DirectMessageModel(
    val id: Int,
    val userName: String,
    val lastMessage: String,
    val timeText: String,
    val unreadCount: Int,
    val avatarBg: Color,
    val isOnline: Boolean
)

data class BannerItemModel(
    val id: Int,
    val title: String,
    val subtitle: String,
    val primaryColor: Color,
    val secondaryColor: Color,
    val icon: ImageVector
)

data class GiftItemModel(
    val id: Int,
    val name: String,
    val price: Int,
    val color: Color,
    val icon: ImageVector
)

// ============================================================================
// MAIN VOICE ROOM SCREEN
// ============================================================================
@OptIn(ExperimentalMaterial3Api::class, ExperimentalFoundationApi::class)
@Composable
fun VoiceRoomCompleteScreen() {
    val coroutineScope = rememberCoroutineScope()

    // UI Sheet & Overlay States
    var showPureWhiteMessageSheet by remember { mutableStateOf(false) }
    var showSettingsSheet by remember { mutableStateOf(false) }
    var showGiftSheet by remember { mutableStateOf(false) }
    var showOnlineUsersSheet by remember { mutableStateOf(false) }
    var showExitDialog by remember { mutableStateOf(false) }
    var showKeyboardChatInput by remember { mutableStateOf(false) }
    var selectedSeatForAction by remember { mutableStateOf<MicSeatModel?>(null) }

    // Room Local States
    var isSelfMicMuted by remember { mutableStateOf(false) }
    var isRoomSpeakerOn by remember { mutableStateOf(true) }
    var isFollowingHost by remember { mutableStateOf(false) }
    var onlineUserCount by remember { mutableIntStateOf(148) }

    // Blue & Black Entry States
    var showBlueEntryBanner by remember { mutableStateOf(false) }
    var currentBlueEntryUser by remember { mutableStateOf("Aarav_VIP") }
    var currentBlackEntryUser by remember { mutableStateOf("Rohan_07") }

    // Trigger Blue Banner Slide-In from Right Side
    LaunchedEffect(Unit) {
        delay(350)
        showBlueEntryBanner = true
    }

    // 8 Seats State (60.dp Card + Big White Mic Icon)
    val seatsList = remember {
        mutableStateListOf(
            MicSeatModel(seatNumber = 1),
            MicSeatModel(seatNumber = 2),
            MicSeatModel(seatNumber = 3),
            MicSeatModel(seatNumber = 4),
            MicSeatModel(seatNumber = 5),
            MicSeatModel(seatNumber = 6),
            MicSeatModel(seatNumber = 7),
            MicSeatModel(seatNumber = 8)
        )
    }

    // Public Room Chat Messages
    val publicChatMessages = remember {
        mutableStateListOf(
            RoomChatMessageModel(1, "Karan_King", 24, "Hello everyone! Welcome to the room 🔥", Color(0xFFFF9100)),
            RoomChatMessageModel(2, "Ananya_Queen", 18, "Mic khali hai aao sab baat karte hain!", Color(0xFFE040FB)),
            RoomChatMessageModel(3, "Vikram_VIP", 35, "Nice music playing in the room 🎵", Color(0xFF00E5FF))
        )
    }

    // Private Messages List for Pure White Sheet
    val directMessages = remember {
        mutableStateListOf(
            DirectMessageModel(1, "Simran Kaur", "Room mein aao jaldi game start ho raha hai!", "11:20 PM", 2, Color(0xFFE91E63), true),
            DirectMessageModel(2, "Kabir_Official", "Kal ka VIP event dekha aapne?", "10:45 PM", 1, Color(0xFF6C5CE7), true),
            DirectMessageModel(3, "Neha Sharma", "Thank you for the Rose gift 🌹", "Yesterday", 0, Color(0xFF00BFA5), false),
            DirectMessageModel(4, "Rahul Verma", "Bhai mic seat 1 pe aao", "Yesterday", 0, Color(0xFFFF6D00), true),
            DirectMessageModel(5, "Zoya Khan", "Good night! Kal milte hain room mein", "Tue", 0, Color(0xFF2979FF), false)
        )
    }

    val chatListState = rememberLazyListState()

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF1D1135),
                        Color(0xFF110921),
                        Color(0xFF080410)
                    )
                )
            )
            .statusBarsPadding()
            .navigationBarsPadding()
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // ================================================================
            // 1. TOP HEADER BAR (User Pill Height Kam + UniformIconGap)
            // ================================================================
            TopRoomHeaderSection(
                onlineCount = onlineUserCount,
                isFollowing = isFollowingHost,
                onToggleFollow = { isFollowingHost = !isFollowingHost },
                onClickUserPill = { showOnlineUsersSheet = true },
                onClickSettings = { showSettingsSheet = true },
                onClickPower = { showExitDialog = true }
            )

            Spacer(modifier = Modifier.height(10.dp))

            // ================================================================
            // 2. 8 MIC SEATS GRID (60.dp Seat + 32.dp White Mic)
            // ================================================================
            SeatsGridSection(
                seats = seatsList,
                onSeatClick = { clickedSeat ->
                    selectedSeatForAction = clickedSeat
                }
            )

            Spacer(modifier = Modifier.height(10.dp))

            // ================================================================
            // 3. MIDDLE & LOWER CONTENT AREA (Left Notices/Chat + Right Banner)
            // ================================================================
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp)
            ) {
                // LEFT SIDE COLUMN:
                // - Card 1: Official Notice Card (ALAG CARD)
                // - Card 2: Announced Card (ALAG CARD)
                // - Public Chat List
                // - Blue Entry Banner (Right se slide hokar aayega)
                // - Compact Black Entry Card (Chhota size, wrapContent)
                Column(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(0.75f),
                    verticalArrangement = Arrangement.Bottom
                ) {
                    // --------------------------------------------------------
                    // CARD 1: OFFICIAL NOTICE CARD (Alag Separate Card)
                    // --------------------------------------------------------
                    OfficialSystemCard(
                        noticeText = "Welcome to Hawa Voice Room! Please respect all members. Abuse or spam is strictly prohibited."
                    )

                    // Dono Cards ke beech clear gap
                    Spacer(modifier = Modifier.height(6.dp))

                    // --------------------------------------------------------
                    // CARD 2: ANNOUNCED CARD (Alag Separate Card)
                    // --------------------------------------------------------
                    RoomAnnouncedCard(
                        announcementTitle = "Announced",
                        announcementBody = "Daily Mic Party & Singing Contest starts at 9:00 PM! Grab a 60dp seat now 🎤✨"
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    // --------------------------------------------------------
                    // LIVE PUBLIC CHAT MESSAGES
                    // --------------------------------------------------------
                    LazyColumn(
                        state = chatListState,
                        modifier = Modifier
                            .weight(1f, fill = false)
                            .fillMaxWidth(),
                        verticalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        items(publicChatMessages, key = { it.id }) { msg ->
                            PublicChatBubble(message = msg)
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    // --------------------------------------------------------
                    // BLUE ENTRY BANNER: Right Side Se Slide Hokar Aayega
                    // --------------------------------------------------------
                    AnimatedVisibility(
                        visible = showBlueEntryBanner,
                        enter = slideInHorizontally(
                            initialOffsetX = { fullWidth -> fullWidth * 2 }, // Right side se slide-in
                            animationSpec = tween(durationMillis = 550, easing = FastOutSlowInEasing)
                        ) + fadeIn(animationSpec = tween(300)),
                        exit = slideOutHorizontally(
                            targetOffsetX = { -it },
                            animationSpec = tween(350)
                        ) + fadeOut()
                    ) {
                        BlueSlideEntryBanner(
                            userName = currentBlueEntryUser,
                            vipLevel = "VIP 8",
                            onReplaySlide = {
                                coroutineScope.launch {
                                    showBlueEntryBanner = false
                                    delay(250)
                                    currentBlueEntryUser = if (currentBlueEntryUser == "Aarav_VIP") "Prince_Royal" else "Aarav_VIP"
                                    showBlueEntryBanner = true
                                }
                            }
                        )
                    }

                    Spacer(modifier = Modifier.height(5.dp))

                    // --------------------------------------------------------
                    // BLACK ENTER THE ROOM CARD: Ekdam Compact (No Extra Width)
                    // --------------------------------------------------------
                    CompactBlackEntryCard(
                        userName = currentBlackEntryUser,
                        onClick = {
                            currentBlackEntryUser = if (currentBlackEntryUser == "Rohan_07") "Aditya_x9" else "Rohan_07"
                        }
                    )

                    Spacer(modifier = Modifier.height(6.dp))
                }

                // ============================================================
                // RIGHT SIDE: AUTO-SCROLL IMAGE BANNER (No Stuck Bug)
                // ============================================================
                RightSideAutoImageBanner(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(bottom = 8.dp)
                )
            }

            // ================================================================
            // 4. BOTTOM ACTION BAR (Exact Same UniformIconGap = 8.dp)
            // ================================================================
            BottomRoomActionBar(
                isMicMuted = isSelfMicMuted,
                isSpeakerOn = isRoomSpeakerOn,
                unreadMessages = directMessages.sumOf { it.unreadCount },
                onClickSaySomething = { showKeyboardChatInput = true },
                onToggleMic = { isSelfMicMuted = !isSelfMicMuted },
                onToggleSpeaker = { isRoomSpeakerOn = !isRoomSpeakerOn },
                onOpenMessageSheet = { showPureWhiteMessageSheet = true },
                onOpenGiftSheet = { showGiftSheet = true }
            )
        }

        // ====================================================================
        // 5. KEYBOARD-DOCKED CHAT INPUT BAR (100% Keyboard Ke Upar Rehta Hai!)
        // ====================================================================
        if (showKeyboardChatInput) {
            KeyboardAboveChatInputBar(
                onSendMessage = { text ->
                    if (text.isNotBlank()) {
                        publicChatMessages.add(
                            RoomChatMessageModel(
                                id = System.currentTimeMillis(),
                                senderName = "You",
                                senderLevel = 30,
                                message = text,
                                badgeColor = Color(0xFF00E676)
                            )
                        )
                        coroutineScope.launch {
                            chatListState.animateScrollToItem(publicChatMessages.size - 1)
                        }
                    }
                    showKeyboardChatInput = false
                },
                onDismiss = { showKeyboardChatInput = false }
            )
        }

        // ====================================================================
        // 6. 100% PURE WHITE MESSAGE BOTTOM SHEET (Zero Grey Tint + Keyboard Fix)
        // ====================================================================
        if (showPureWhiteMessageSheet) {
            PureWhiteMessageBottomSheet(
                messagesList = directMessages,
                onSendNewMessage = { targetId, newText ->
                    val idx = directMessages.indexOfFirst { it.id == targetId }
                    if (idx != -1) {
                        directMessages[idx] = directMessages[idx].copy(
                            lastMessage = newText,
                            timeText = "Just now",
                            unreadCount = 0
                        )
                    }
                },
                onDismiss = { showPureWhiteMessageSheet = false }
            )
        }

        // ====================================================================
        // 7. SEAT CLICK ACTION SHEET (Take Mic / Mute / Lock Seat)
        // ====================================================================
        selectedSeatForAction?.let { seat ->
            SeatControlBottomSheet(
                seat = seat,
                onTakeOrLeaveSeat = {
                    val idx = seatsList.indexOfFirst { it.seatNumber == seat.seatNumber }
                    if (idx != -1 && !seatsList[idx].isLocked) {
                        val current = seatsList[idx]
                        seatsList[idx] = if (current.userName == null) {
                            current.copy(userName = "User_${seat.seatNumber}", isSpeaking = true)
                        } else {
                            current.copy(userName = null, isSpeaking = false, isMuted = false)
                        }
                    }
                    selectedSeatForAction = null
                },
                onToggleMuteSeat = {
                    val idx = seatsList.indexOfFirst { it.seatNumber == seat.seatNumber }
                    if (idx != -1) {
                        seatsList[idx] = seatsList[idx].copy(isMuted = !seatsList[idx].isMuted)
                    }
                    selectedSeatForAction = null
                },
                onToggleLockSeat = {
                    val idx = seatsList.indexOfFirst { it.seatNumber == seat.seatNumber }
                    if (idx != -1) {
                        seatsList[idx] = seatsList[idx].copy(
                            isLocked = !seatsList[idx].isLocked,
                            userName = null
                        )
                    }
                    selectedSeatForAction = null
                },
                onDismiss = { selectedSeatForAction = null }
            )
        }

        // ====================================================================
        // 8. GIFT BOTTOM SHEET
        // ====================================================================
        if (showGiftSheet) {
            GiftSendBottomSheet(
                onSendGift = { gift ->
                    publicChatMessages.add(
                        RoomChatMessageModel(
                            id = System.currentTimeMillis(),
                            senderName = "You",
                            senderLevel = 30,
                            message = "Sent ${gift.name} (${gift.price} Coins) 🎁",
                            badgeColor = Color(0xFFFF4081)
                        )
                    )
                    coroutineScope.launch {
                        chatListState.animateScrollToItem(publicChatMessages.size - 1)
                    }
                    showGiftSheet = false
                },
                onDismiss = { showGiftSheet = false }
            )
        }

        // ====================================================================
        // 9. ROOM SETTINGS BOTTOM SHEET
        // ====================================================================
        if (showSettingsSheet) {
            RoomSettingsBottomSheet(
                onTriggerBlueBanner = {
                    coroutineScope.launch {
                        showBlueEntryBanner = false
                        delay(200)
                        showBlueEntryBanner = true
                    }
                    showSettingsSheet = false
                },
                onDismiss = { showSettingsSheet = false }
            )
        }

        // ====================================================================
        // 10. ONLINE USERS BOTTOM SHEET
        // ====================================================================
        if (showOnlineUsersSheet) {
            OnlineUsersBottomSheet(
                onlineCount = onlineUserCount,
                onDismiss = { showOnlineUsersSheet = false }
            )
        }

        // ====================================================================
        // 11. EXIT / POWER ROOM DIALOG
        // ====================================================================
        if (showExitDialog) {
            RoomPowerExitDialog(
                onDismiss = { showExitDialog = false }
            )
        }
    }
}

// ============================================================================
// KEYBOARD-ABOVE CHAT INPUT BAR (100% Fixed: Keyboard ke bilkul upar rahega!)
// ============================================================================
@Composable
fun KeyboardAboveChatInputBar(
    onSendMessage: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var inputText by remember { mutableStateOf("") }
    val focusRequester = remember { FocusRequester() }
    val keyboardController = LocalSoftwareKeyboardController.current
    val focusManager = LocalFocusManager.current

    // Back press karne par chat input band ho jaye
    BackHandler(enabled = true) {
        keyboardController?.hide()
        onDismiss()
    }

    // Open hote hi turant keyboard kholega aur input focus karega
    LaunchedEffect(Unit) {
        delay(50)
        focusRequester.requestFocus()
        keyboardController?.show()
    }

    Box(
        modifier = Modifier.fillMaxSize()
    ) {
        // Upar ka transparent area click karne par keyboard aur input close ho jayega
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.25f))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null
                ) {
                    focusManager.clearFocus()
                    keyboardController?.hide()
                    onDismiss()
                }
        )

        // YE BAR HAMESHA KEYBOARD KE BILKUL UPAR CHIPAK KAR AAYEGA (.imePadding())
        Surface(
            color = Color.White,
            tonalElevation = 0.dp,
            shadowElevation = 8.dp,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .imePadding() // <--- Keyboard ke bilkul upar rakhta hai!
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Emoji icon
                Icon(
                    imageVector = Icons.Outlined.EmojiEmotions,
                    contentDescription = "Emoji",
                    tint = Color(0xFF666666),
                    modifier = Modifier
                        .size(26.dp)
                        .clickable { }
                )

                Spacer(modifier = Modifier.width(8.dp))

                // Input Box
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(40.dp)
                        .clip(RoundedCornerShape(50))
                        .background(Color(0xFFF5F5F5))
                        .border(1.dp, Color(0xFFE0E0E0), RoundedCornerShape(50))
                        .padding(horizontal = 14.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    if (inputText.isEmpty()) {
                        Text(
                            text = "Say something...",
                            color = Color(0xFF888888),
                            fontSize = 13.5.sp
                        )
                    }
                    BasicTextField(
                        value = inputText,
                        onValueChange = { inputText = it },
                        textStyle = TextStyle(
                            color = Color.Black,
                            fontSize = 14.sp
                        ),
                        cursorBrush = SolidColor(Color(0xFF0072FF)),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                        keyboardActions = KeyboardActions(
                            onSend = {
                                if (inputText.isNotBlank()) {
                                    onSendMessage(inputText.trim())
                                    inputText = ""
                                }
                            }
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .focusRequester(focusRequester)
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                // Send Button
                Box(
                    modifier = Modifier
                        .height(40.dp)
                        .clip(RoundedCornerShape(50))
                        .background(
                            if (inputText.isNotBlank()) Color(0xFF0072FF)
                            else Color(0xFFB0BEC5)
                        )
                        .clickable {
                            if (inputText.isNotBlank()) {
                                onSendMessage(inputText.trim())
                                inputText = ""
                            }
                        }
                        .padding(horizontal = 16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Send",
                        color = Color.White,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

// ============================================================================
// COMPONENT 1: TOP HEADER BAR
// - Top User Pill height reduced to 24.dp
// - Middle gap between User Pill, Setting, Power Icon = UniformIconGap (8.dp)
// ============================================================================
@Composable
fun TopRoomHeaderSection(
    onlineCount: Int,
    isFollowing: Boolean,
    onToggleFollow: () -> Unit,
    onClickUserPill: () -> Unit,
    onClickSettings: () -> Unit,
    onClickPower: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        // Left Side: Room Profile Pill
        Row(
            modifier = Modifier
                .clip(RoundedCornerShape(50))
                .background(Color.White.copy(alpha = 0.12f))
                .border(0.8.dp, Color.White.copy(alpha = 0.18f), RoundedCornerShape(50))
                .padding(start = 5.dp, end = 8.dp, top = 4.dp, bottom = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(
                            colors = listOf(Color(0xFF8E2DE2), Color(0xFF4A00E0))
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.GraphicEq,
                    contentDescription = "Room Icon",
                    tint = Color.White,
                    modifier = Modifier.size(18.dp)
                )
            }

            Spacer(modifier = Modifier.width(6.dp))

            Column {
                Text(
                    text = "Hawa VIP Party",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1
                )
                Text(
                    text = "ID: 908421",
                    color = Color.White.copy(alpha = 0.72f),
                    fontSize = 9.5.sp
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Follow Host Pill Button
            Box(
                modifier = Modifier
                    .height(22.dp)
                    .clip(RoundedCornerShape(50))
                    .background(
                        if (isFollowing) Color.White.copy(alpha = 0.2f)
                        else Color(0xFFFF4081)
                    )
                    .clickable { onToggleFollow() }
                    .padding(horizontal = 8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (isFollowing) "Followed" else "+ Follow",
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        // Right Side: User Pill + Setting Icon + Power Icon
        // Exact same UniformIconGap (8.dp) as Bottom Bar icons
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(UniformIconGap)
        ) {
            // TOP USER PILL (Height kam karke 24.dp kar di hai)
            Row(
                modifier = Modifier
                    .height(TopUserPillHeight) // Strictly 24.dp slim height
                    .clip(RoundedCornerShape(50))
                    .background(Color.White.copy(alpha = 0.15f))
                    .border(0.8.dp, Color.White.copy(alpha = 0.22f), RoundedCornerShape(50))
                    .clickable { onClickUserPill() }
                    .padding(horizontal = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(3.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = "Online Users",
                    tint = Color.White,
                    modifier = Modifier.size(12.dp)
                )
                Text(
                    text = "$onlineCount",
                    color = Color.White,
                    fontSize = 10.5.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            // SETTING ICON
            TopActionCircleButton(
                icon = Icons.Outlined.Settings,
                contentDesc = "Room Settings",
                onClick = onClickSettings
            )

            // POWER / EXIT ICON
            TopActionCircleButton(
                icon = Icons.Default.PowerSettingsNew,
                contentDesc = "Exit Room",
                onClick = onClickPower
            )
        }
    }
}

@Composable
fun TopActionCircleButton(
    icon: ImageVector,
    contentDesc: String,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(32.dp)
            .clip(CircleShape)
            .background(Color.White.copy(alpha = 0.15f))
            .border(0.8.dp, Color.White.copy(alpha = 0.20f), CircleShape)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDesc,
            tint = Color.White,
            modifier = Modifier.size(16.dp)
        )
    }
}

// ============================================================================
// COMPONENT 2: 8 SEATS GRID
// - Seat Card strictly 60.dp (SeatCardExactSize)
// - White Mic Icon inside is large 32.dp (SeatWhiteMicIconSize)
// ============================================================================
@Composable
fun SeatsGridSection(
    seats: List<MicSeatModel>,
    onSeatClick: (MicSeatModel) -> Unit
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(4),
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        horizontalArrangement = Arrangement.SpaceEvenly,
        userScrollEnabled = false
    ) {
        items(seats, key = { it.seatNumber }) { seat ->
            SingleMicSeatItem(
                seat = seat,
                onClick = { onSeatClick(seat) }
            )
        }
    }
}

@Composable
fun SingleMicSeatItem(
    seat: MicSeatModel,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            contentAlignment = Alignment.Center
        ) {
            // SEAT CARD: Strictly 60.dp (Card ko bada nahi kiya)
            Box(
                modifier = Modifier
                    .size(SeatCardExactSize) // 60.dp fixed
                    .clip(CircleShape)
                    .background(
                        if (seat.userName != null) {
                            Brush.radialGradient(
                                colors = listOf(seat.avatarColor, Color(0xFF2A1B4E))
                            )
                        } else {
                            Brush.radialGradient(
                                colors = listOf(
                                    Color.White.copy(alpha = 0.14f),
                                    Color.White.copy(alpha = 0.08f)
                                )
                            )
                        }
                    )
                    .border(
                        width = if (seat.isSpeaking) 2.dp else 1.dp,
                        color = if (seat.isSpeaking) Color(0xFF00E676)
                        else Color.White.copy(alpha = 0.25f),
                        shape = CircleShape
                    )
                    .clickable { onClick() },
                contentAlignment = Alignment.Center
            ) {
                when {
                    seat.isLocked -> {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Locked",
                            tint = Color.White.copy(alpha = 0.75f),
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    seat.userName != null -> {
                        Icon(
                            imageVector = Icons.Default.Mic,
                            contentDescription = "Active White Mic",
                            tint = Color.White,
                            modifier = Modifier.size(SeatWhiteMicIconSize) // 32.dp Big White Mic
                        )
                    }
                    else -> {
                        // Empty Seat: BIG WHITE MIC ICON (32.dp) inside 60.dp Seat Card
                        Icon(
                            imageVector = Icons.Default.Mic,
                            contentDescription = "White Seat Mic",
                            tint = Color.White, // Pure White
                            modifier = Modifier.size(SeatWhiteMicIconSize) // 32.dp Big Mic Icon
                        )
                    }
                }
            }

            if (seat.isMuted) {
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .size(18.dp)
                        .clip(CircleShape)
                        .background(Color(0xFFFF1744))
                        .border(1.dp, Color.White, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.MicOff,
                        contentDescription = "Muted",
                        tint = Color.White,
                        modifier = Modifier.size(11.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = seat.userName ?: "No.${seat.seatNumber}",
            color = if (seat.userName != null) Color.White else Color.White.copy(alpha = 0.82f),
            fontSize = 11.sp,
            fontWeight = if (seat.userName != null) FontWeight.SemiBold else FontWeight.Normal,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

// ============================================================================
// COMPONENT 3A: OFFICIAL SYSTEM CARD (Alag Separate Card #1)
// ============================================================================
@Composable
fun OfficialSystemCard(noticeText: String) {
    Surface(
        color = Color.Black.copy(alpha = 0.42f),
        shape = RoundedCornerShape(10.dp),
        border = BorderStroke(0.8.dp, Color(0xFF00E676).copy(alpha = 0.30f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
            verticalAlignment = Alignment.Top
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color(0xFF00C853))
                    .padding(horizontal = 5.dp, vertical = 1.5.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Official",
                    color = Color.White,
                    fontSize = 9.5.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.width(6.dp))

            Text(
                text = noticeText,
                color = Color(0xFF69F0AE),
                fontSize = 11.sp,
                lineHeight = 14.5.sp,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

// ============================================================================
// COMPONENT 3B: ROOM ANNOUNCED CARD (Alag Separate Card #2)
// ============================================================================
@Composable
fun RoomAnnouncedCard(
    announcementTitle: String,
    announcementBody: String
) {
    Surface(
        color = Color.Black.copy(alpha = 0.42f),
        shape = RoundedCornerShape(10.dp),
        border = BorderStroke(0.8.dp, Color(0xFFFFAB00).copy(alpha = 0.30f)),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
            verticalAlignment = Alignment.Top
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(Color(0xFFFFAB00))
                    .padding(horizontal = 5.dp, vertical = 1.5.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = announcementTitle,
                    color = Color.Black,
                    fontSize = 9.5.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.width(6.dp))

            Text(
                text = announcementBody,
                color = Color(0xFFFFE57F),
                fontSize = 11.sp,
                lineHeight = 14.5.sp,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

// ============================================================================
// COMPONENT 4: PUBLIC CHAT BUBBLE
// ============================================================================
@Composable
fun PublicChatBubble(message: RoomChatMessageModel) {
    Box(
        modifier = Modifier
            .wrapContentSize()
            .clip(RoundedCornerShape(8.dp))
            .background(Color.Black.copy(alpha = 0.35f))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(4.dp))
                    .background(message.badgeColor)
                    .padding(horizontal = 4.dp, vertical = 1.dp)
            ) {
                Text(
                    text = "Lv.${message.senderLevel}",
                    color = Color.White,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.width(5.dp))

            Text(
                text = buildAnnotatedString {
                    withStyle(
                        SpanStyle(
                            color = Color(0xFF82B1FF),
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 11.5.sp
                        )
                    ) {
                        append("${message.senderName}: ")
                    }
                    withStyle(
                        SpanStyle(
                            color = Color.White,
                            fontSize = 11.5.sp
                        )
                    ) {
                        append(message.message)
                    }
                }
            )
        }
    }
}

// ============================================================================
// COMPONENT 5: BLUE ENTRY BANNER (Slides in from Right Side)
// ============================================================================
@Composable
fun BlueSlideEntryBanner(
    userName: String,
    vipLevel: String,
    onReplaySlide: () -> Unit
) {
    Box(
        modifier = Modifier
            .wrapContentSize()
            .clip(RoundedCornerShape(50))
            .background(
                Brush.horizontalGradient(
                    colors = listOf(
                        Color(0xFF0052D4),
                        Color(0xFF4364F7),
                        Color(0xFF6FB1FC)
                    )
                )
            )
            .border(1.dp, Color.White.copy(alpha = 0.55f), RoundedCornerShape(50))
            .clickable { onReplaySlide() }
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .background(Color(0xFFFFD700))
                    .padding(horizontal = 5.dp, vertical = 1.dp)
            ) {
                Text(
                    text = vipLevel,
                    color = Color.Black,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.ExtraBold
                )
            }

            Spacer(modifier = Modifier.width(5.dp))

            Text(
                text = userName,
                color = Color.White,
                fontSize = 11.5.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.width(4.dp))

            Text(
                text = "entered the room",
                color = Color.White.copy(alpha = 0.95f),
                fontSize = 11.sp
            )
        }
    }
}

// ============================================================================
// COMPONENT 6: COMPACT BLACK "ENTER THE ROOM" CARD
// - Fixed: Faltu bada nahi hai, wrapContentSize() + minimal padding
// ============================================================================
@Composable
fun CompactBlackEntryCard(
    userName: String,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .wrapContentSize() // Sirf text ke barabar width lega
            .clip(RoundedCornerShape(50))
            .background(Color.Black.copy(alpha = 0.52f))
            .border(0.6.dp, Color.White.copy(alpha = 0.14f), RoundedCornerShape(50))
            .clickable { onClick() }
            .padding(horizontal = 8.dp, vertical = 3.dp) // Tight compact padding
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = userName,
                color = Color(0xFF80D8FF),
                fontSize = 10.5.sp,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.width(4.dp))
            Text(
                text = "entered the room",
                color = Color.White.copy(alpha = 0.85f),
                fontSize = 10.5.sp
            )
        }
    }
}

// ============================================================================
// COMPONENT 7: RIGHT IMAGE BANNER (Stuck in Middle 100% Fixed)
// ============================================================================
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun RightSideAutoImageBanner(modifier: Modifier = Modifier) {
    val banners = remember {
        listOf(
            BannerItemModel(
                id = 1,
                title = "Lucky Wheel",
                subtitle = "Win 10x Coins",
                primaryColor = Color(0xFFFF1744),
                secondaryColor = Color(0xFFFF9100),
                icon = Icons.Default.Casino
            ),
            BannerItemModel(
                id = 2,
                title = "VIP Gala",
                subtitle = "Exclusive Frame",
                primaryColor = Color(0xFF651FFF),
                secondaryColor = Color(0xFF00B0FF),
                icon = Icons.Default.WorkspacePremium
            ),
            BannerItemModel(
                id = 3,
                title = "CP Ranking",
                subtitle = "Top Rewards",
                primaryColor = Color(0xFFF50057),
                secondaryColor = Color(0xFFFF80AB),
                icon = Icons.Default.Favorite
            )
        )
    }

    val pagerState = rememberPagerState(
        initialPage = 0,
        pageCount = { banners.size }
    )
    val isDragged by pagerState.interactionSource.collectIsDraggedAsState()

    // Safe Auto-Scroll Loop: Kabhi bhi beech mein nahi rukega
    LaunchedEffect(isDragged) {
        if (!isDragged) {
            while (true) {
                delay(2600)
                if (!pagerState.isScrollInProgress && banners.isNotEmpty()) {
                    val nextPage = (pagerState.settledPage + 1) % banners.size
                    try {
                        pagerState.animateScrollToPage(
                            page = nextPage,
                            animationSpec = tween(
                                durationMillis = 420,
                                easing = FastOutSlowInEasing
                            )
                        )
                    } catch (e: CancellationException) {
                        pagerState.scrollToPage(pagerState.settledPage)
                    }
                }
            }
        }
    }

    Column(
        modifier = modifier.width(76.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        HorizontalPager(
            state = pagerState,
            beyondBoundsPageCount = 1,
            modifier = Modifier
                .size(width = 76.dp, height = 96.dp)
                .clip(RoundedCornerShape(12.dp))
        ) { page ->
            val item = banners[page]
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(item.primaryColor, item.secondaryColor)
                        )
                    )
                    .border(1.dp, Color.White.copy(alpha = 0.35f), RoundedCornerShape(12.dp)),
                contentAlignment = Alignment.Center
            ) {
                Canvas(modifier = Modifier.fillMaxSize()) {
                    drawCircle(
                        color = Color.White.copy(alpha = 0.14f),
                        radius = size.minDimension * 0.45f,
                        center = Offset(size.width * 0.8f, size.height * 0.2f)
                    )
                    drawCircle(
                        color = Color.White.copy(alpha = 0.10f),
                        radius = size.minDimension * 0.35f,
                        center = Offset(size.width * 0.2f, size.height * 0.85f)
                    )
                }

                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier.padding(4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.22f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = item.icon,
                            contentDescription = item.title,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = item.title,
                        color = Color.White,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )

                    Text(
                        text = item.subtitle,
                        color = Color.White.copy(alpha = 0.9f),
                        fontSize = 8.5.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(5.dp))

        Row(
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            repeat(banners.size) { index ->
                val isSelected = pagerState.currentPage == index
                Box(
                    modifier = Modifier
                        .height(4.dp)
                        .width(if (isSelected) 10.dp else 4.dp)
                        .clip(RoundedCornerShape(50))
                        .background(
                            if (isSelected) Color.White
                            else Color.White.copy(alpha = 0.4f)
                        )
                )
            }
        }
    }
}

// ============================================================================
// COMPONENT 8: BOTTOM ACTION BAR
// - Uses exact same UniformIconGap (8.dp) as Top Header Icons
// ============================================================================
@Composable
fun BottomRoomActionBar(
    isMicMuted: Boolean,
    isSpeakerOn: Boolean,
    unreadMessages: Int,
    onClickSaySomething: () -> Unit,
    onToggleMic: () -> Unit,
    onToggleSpeaker: () -> Unit,
    onOpenMessageSheet: () -> Unit,
    onOpenGiftSheet: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        // Left Side Row (Gap = UniformIconGap = 8.dp)
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(UniformIconGap)
        ) {
            // "Say something..." Input Trigger (Opens Keyboard-Above Input Bar)
            Row(
                modifier = Modifier
                    .height(36.dp)
                    .clip(RoundedCornerShape(50))
                    .background(Color.White.copy(alpha = 0.14f))
                    .border(0.8.dp, Color.White.copy(alpha = 0.18f), RoundedCornerShape(50))
                    .clickable { onClickSaySomething() }
                    .padding(horizontal = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Outlined.ChatBubbleOutline,
                    contentDescription = "Chat",
                    tint = Color.White,
                    modifier = Modifier.size(15.dp)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Say something...",
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 11.5.sp
                )
            }

            // Mic Toggle Icon
            BottomBarCircleIcon(
                icon = if (isMicMuted) Icons.Default.MicOff else Icons.Default.Mic,
                tint = if (isMicMuted) Color(0xFFFF5252) else Color.White,
                onClick = onToggleMic
            )

            // Speaker Toggle Icon
            BottomBarCircleIcon(
                icon = if (isSpeakerOn) Icons.Default.VolumeUp else Icons.Default.VolumeOff,
                onClick = onToggleSpeaker
            )
        }

        // Right Side Row (Gap = UniformIconGap = 8.dp)
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(UniformIconGap)
        ) {
            // Message Icon with Unread Badge (Opens Pure White Message Sheet)
            Box {
                BottomBarCircleIcon(
                    icon = Icons.Outlined.Email,
                    onClick = onOpenMessageSheet
                )
                if (unreadMessages > 0) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .size(15.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFFF1744)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "$unreadMessages",
                            color = Color.White,
                            fontSize = 8.5.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Gift Button
            BottomBarCircleIcon(
                icon = Icons.Default.CardGiftcard,
                bgColor = Color(0xFFFF4081),
                onClick = onOpenGiftSheet
            )

            // Game / Menu Button
            BottomBarCircleIcon(
                icon = Icons.Outlined.SportsEsports,
                onClick = onOpenGiftSheet
            )
        }
    }
}

@Composable
fun BottomBarCircleIcon(
    icon: ImageVector,
    tint: Color = Color.White,
    bgColor: Color = Color.White.copy(alpha = 0.14f),
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(36.dp)
            .clip(CircleShape)
            .background(bgColor)
            .border(0.8.dp, Color.White.copy(alpha = 0.18f), CircleShape)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = tint,
            modifier = Modifier.size(18.dp)
        )
    }
}

// ============================================================================
// COMPONENT 9: 100% PURE WHITE MESSAGE BOTTOM SHEET
// - Top se Bottom tak 100% Color.White (No Grey Header, No Surface Tint)
// - Reply input bar also uses .imePadding() so it stays above the keyboard!
// ============================================================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PureWhiteMessageBottomSheet(
    messagesList: List<DirectMessageModel>,
    onSendNewMessage: (Int, String) -> Unit,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    var activeChatUser by remember { mutableStateOf<DirectMessageModel?>(null) }
    var replyInputText by remember { mutableStateOf("") }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = Color.White, // Strictly Pure White
        contentColor = Color.Black,
        tonalElevation = 0.dp,        // Material 3 grey elevation tint disabled
        scrimColor = Color.Black.copy(alpha = 0.45f),
        dragHandle = null,            // Top grey drag handle box completely removed
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
    ) {
        Surface(
            color = Color.White,
            contentColor = Color.Black,
            tonalElevation = 0.dp,
            shadowElevation = 0.dp,
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.68f)
                .imePadding() // <--- Sheet ke andar bhi input keyboard ke upar rahega
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.White) // Pure White Background
                    .navigationBarsPadding()
            ) {
                // 1. PURE WHITE TOP HEADER (No Grey at all)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White)
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        if (activeChatUser != null) {
                            Icon(
                                imageVector = Icons.Default.ArrowBack,
                                contentDescription = "Back",
                                tint = Color.Black,
                                modifier = Modifier
                                    .size(22.dp)
                                    .clickable { activeChatUser = null }
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                        }
                        Text(
                            text = activeChatUser?.userName ?: "Messages",
                            color = Color.Black,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close Sheet",
                        tint = Color.Black,
                        modifier = Modifier
                            .size(22.dp)
                            .clickable { onDismiss() }
                    )
                }

                if (activeChatUser == null) {
                    // 2. PURE WHITE TABS ROW
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.White)
                            .padding(horizontal = 16.dp, vertical = 4.dp),
                        horizontalArrangement = Arrangement.spacedBy(20.dp)
                    ) {
                        listOf("Messages", "Friends", "Official").forEachIndexed { index, title ->
                            val isSelected = selectedTabIndex == index
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier
                                    .background(Color.White)
                                    .clickable { selectedTabIndex = index }
                            ) {
                                Text(
                                    text = title,
                                    color = if (isSelected) Color.Black else Color(0xFF777777),
                                    fontSize = 14.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Box(
                                    modifier = Modifier
                                        .height(2.5.dp)
                                        .width(24.dp)
                                        .clip(RoundedCornerShape(50))
                                        .background(
                                            if (isSelected) Color(0xFF0072FF) else Color.White
                                        )
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(6.dp))

                    // 3. PURE WHITE MESSAGE LIST
                    LazyColumn(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                            .background(Color.White)
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        items(messagesList, key = { it.id }) { dm ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(Color.White)
                                    .clickable { activeChatUser = dm }
                                    .padding(vertical = 10.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box {
                                    Box(
                                        modifier = Modifier
                                            .size(46.dp)
                                            .clip(CircleShape)
                                            .background(dm.avatarBg),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = dm.userName.first().toString(),
                                            color = Color.White,
                                            fontSize = 17.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                    if (dm.isOnline) {
                                        Box(
                                            modifier = Modifier
                                                .align(Alignment.BottomEnd)
                                                .size(12.dp)
                                                .clip(CircleShape)
                                                .background(Color(0xFF00E676))
                                                .border(2.dp, Color.White, CircleShape)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Column(
                                    modifier = Modifier
                                        .weight(1f)
                                        .background(Color.White)
                                ) {
                                    Text(
                                        text = dm.userName,
                                        color = Color.Black,
                                        fontSize = 14.5.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = dm.lastMessage,
                                        color = Color(0xFF555555),
                                        fontSize = 12.5.sp,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }

                                Column(
                                    horizontalAlignment = Alignment.End,
                                    modifier = Modifier.background(Color.White)
                                ) {
                                    Text(
                                        text = dm.timeText,
                                        color = Color(0xFF888888),
                                        fontSize = 11.sp
                                    )
                                    if (dm.unreadCount > 0) {
                                        Spacer(modifier = Modifier.height(4.dp))
                                        Box(
                                            modifier = Modifier
                                                .size(18.dp)
                                                .clip(CircleShape)
                                                .background(Color(0xFFFF1744)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text(
                                                text = "${dm.unreadCount}",
                                                color = Color.White,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // 4. PURE WHITE CONVERSATION DETAIL VIEW
                    val chatUser = activeChatUser!!
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth()
                            .background(Color.White)
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(14.dp))
                                .background(Color.White)
                                .border(1.dp, Color(0xFFE5E5E5), RoundedCornerShape(14.dp))
                                .padding(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Text(
                                text = chatUser.lastMessage,
                                color = Color.Black,
                                fontSize = 13.5.sp
                            )
                        }
                    }

                    // Pure White Bottom Input Bar (Stays right above keyboard)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color.White)
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(42.dp)
                                .clip(RoundedCornerShape(50))
                                .background(Color.White)
                                .border(1.dp, Color(0xFFDADADA), RoundedCornerShape(50))
                                .padding(horizontal = 14.dp),
                            contentAlignment = Alignment.CenterStart
                        ) {
                            if (replyInputText.isEmpty()) {
                                Text(
                                    text = "Write a message...",
                                    color = Color(0xFF888888),
                                    fontSize = 13.sp
                                )
                            }
                            BasicTextField(
                                value = replyInputText,
                                onValueChange = { replyInputText = it },
                                textStyle = TextStyle(color = Color.Black, fontSize = 13.5.sp),
                                cursorBrush = SolidColor(Color(0xFF0072FF)),
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth()
                            )
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        Box(
                            modifier = Modifier
                                .size(42.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF0072FF))
                                .clickable {
                                    if (replyInputText.isNotBlank()) {
                                        onSendNewMessage(chatUser.id, replyInputText)
                                        activeChatUser = chatUser.copy(lastMessage = replyInputText)
                                        replyInputText = ""
                                    }
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Send,
                                contentDescription = "Send",
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

// ============================================================================
// COMPONENT 10: SEAT ACTION BOTTOM SHEET
// ============================================================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SeatControlBottomSheet(
    seat: MicSeatModel,
    onTakeOrLeaveSeat: () -> Unit,
    onToggleMuteSeat: () -> Unit,
    onToggleLockSeat: () -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF1B112C),
        contentColor = Color.White,
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
                .navigationBarsPadding(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Seat No.${seat.seatNumber}",
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onTakeOrLeaveSeat,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6C5CE7)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = if (seat.userName == null) "Take Mic Seat" else "Leave Mic Seat",
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedButton(
                onClick = onToggleMuteSeat,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = if (seat.isMuted) "Unmute Seat Mic" else "Mute Seat Mic",
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedButton(
                onClick = onToggleLockSeat,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = if (seat.isLocked) "Unlock Seat" else "Lock Seat",
                    color = Color(0xFFFF5252)
                )
            }
        }
    }
}

// ============================================================================
// COMPONENT 11: GIFT BOTTOM SHEET
// ============================================================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GiftSendBottomSheet(
    onSendGift: (GiftItemModel) -> Unit,
    onDismiss: () -> Unit
) {
    val gifts = remember {
        listOf(
            GiftItemModel(1, "Red Rose", 10, Color(0xFFFF1744), Icons.Default.LocalFlorist),
            GiftItemModel(2, "Golden Crown", 99, Color(0xFFFFD700), Icons.Default.EmojiEvents),
            GiftItemModel(3, "Sports Car", 500, Color(0xFF00B0FF), Icons.Default.DirectionsCar),
            GiftItemModel(4, "Luxury Yacht", 1999, Color(0xFFE040FB), Icons.Default.DirectionsBoat)
        )
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF160D29),
        contentColor = Color.White,
        dragHandle = null,
        shape = RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .navigationBarsPadding()
        ) {
            Text(
                text = "Send Gift to Room",
                color = Color.White,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(14.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                gifts.forEach { gift ->
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color.White.copy(alpha = 0.08f))
                            .clickable { onSendGift(gift) }
                            .padding(12.dp)
                    ) {
                        Icon(
                            imageVector = gift.icon,
                            contentDescription = gift.name,
                            tint = gift.color,
                            modifier = Modifier.size(30.dp)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(text = gift.name, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        Text(text = "${gift.price} Coins", color = Color(0xFFFFD700), fontSize = 10.sp)
                    }
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
        }
    }
}

// ============================================================================
// COMPONENT 12: ROOM SETTINGS SHEET, ONLINE USERS SHEET & EXIT DIALOG
// ============================================================================
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoomSettingsBottomSheet(
    onTriggerBlueBanner: () -> Unit,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF1B112C),
        contentColor = Color.White,
        dragHandle = null
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
                .navigationBarsPadding()
        ) {
            Text("Room Tools & Settings", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(modifier = Modifier.height(14.dp))
            Button(
                onClick = onTriggerBlueBanner,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0072FF)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Test Right-Slide Blue Entry Banner", color = Color.White)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OnlineUsersBottomSheet(
    onlineCount: Int,
    onDismiss: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF1B112C),
        contentColor = Color.White,
        dragHandle = null
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
                .navigationBarsPadding()
        ) {
            Text("Online Room Members ($onlineCount)", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(modifier = Modifier.height(12.dp))
            listOf("Aarav_VIP (VIP 8)", "Rohan_07", "Simran Kaur", "Karan_King").forEach { member ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF6C5CE7)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(member.first().toString(), color = Color.White, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(member, color = Color.White, fontSize = 14.sp)
                }
            }
        }
    }
}

@Composable
fun RoomPowerExitDialog(onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            color = Color(0xFF211538),
            shape = RoundedCornerShape(18.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("Room Options", color = Color.White, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onDismiss,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6C5CE7)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Keep Room Minimized", color = Color.White)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = onDismiss,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF1744)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Leave Room", color = Color.White)
                }
            }
        }
    }
}
