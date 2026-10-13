package com.hurry.voicechat

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URL
import kotlin.math.roundToInt

private const val INVITE_ASSET_BASE = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"
private fun inviteAsset(file: String) = INVITE_ASSET_BASE + file
private enum class InviteKey { NONE, GREEN, WHITE }

@Composable
private fun InviteArt(file: String, modifier: Modifier = Modifier, key: InviteKey = InviteKey.NONE, scale: ContentScale = ContentScale.Fit) {
    var bitmap by remember(file, key) { mutableStateOf<Bitmap?>(null) }
    LaunchedEffect(file, key) {
        bitmap = withContext(Dispatchers.IO) {
            runCatching {
                val source = URL(inviteAsset(file)).openStream().use { BitmapFactory.decodeStream(it) }
                if (source == null || key == InviteKey.NONE) source
                else {
                    val output = source.copy(Bitmap.Config.ARGB_8888, true)
                    val pixels = IntArray(output.width * output.height)
                    output.getPixels(pixels, 0, output.width, 0, 0, output.width, output.height)
                    for (i in pixels.indices) {
                        val p = pixels[i]
                        val a = (p ushr 24) and 0xff
                        val r = (p ushr 16) and 0xff
                        val g = (p ushr 8) and 0xff
                        val b = p and 0xff
                        if (key == InviteKey.GREEN) {
                            val maxRB = maxOf(r, b)
                            val diff = g - maxRB
                            if (diff > 30 && g > 60) pixels[i] = p and 0x00ffffff
                            else if (diff > 10 && g > 50) {
                                val factor = (diff - 10) / 20f
                                val na = kotlin.math.roundToInt(a * (1f - factor)).coerceIn(0, 255)
                                pixels[i] = (na shl 24) or (r shl 16) or (maxRB shl 8) or b
                            }
                        } else {
                            if (r > 210 && g > 210 && b > 210) {
                                val avg = (r + g + b) / 3f
                                if (avg > 240f) pixels[i] = p and 0x00ffffff
                                else {
                                    val factor = (avg - 210f) / 30f
                                    val na = (a * (1f - factor)).toInt().coerceIn(0, 255)
                                    pixels[i] = (na shl 24) or (r shl 16) or (g shl 8) or b
                                }
                            }
                        }
                    }
                    output.setPixels(pixels, 0, output.width, 0, 0, output.width, output.height)
                    output
                }
            }.getOrNull()
        }
    }
    val image = bitmap
    if (image != null) {
        Image(
            bitmap = image.asImageBitmap(),
            contentDescription = file,
            modifier = modifier,
            contentScale = scale
        )
    } else {
        Box(modifier)
    }
}

private val inviteYellow = Color(0xFFFFD52A)
private val invitePaleYellow = Color(0xFFFFE76A)
private val inviteRed = Color(0xFF4D0515)
private val invitePopupPurple = Color(0xFF750A75)

@Composable
fun InviteFriends(onBack: (() -> Unit)? = null, onClose: (() -> Unit)? = null) {
    val context = LocalContext.current
    val configuration = LocalConfiguration.current
    val screenHeight = configuration.screenHeightDp.dp
    val userPrefs = remember { context.getSharedPreferences("hurry_auth", Context.MODE_PRIVATE) }
    val code = userPrefs.getString("uid", null)?.takeIf { it.isNotBlank() } ?: "WELCOME123"
    val inviteLink = "https://yourapp.com/invite/$code"
    var isSheetOpen by remember { mutableStateOf(false) }
    var copied by remember { mutableStateOf(false) }
    var inviteRules by remember { mutableStateOf(false) }
    var giftRules by remember { mutableStateOf(false) }
    var rechargeRules by remember { mutableStateOf(false) }
    var helpRules by remember { mutableStateOf(false) }

    fun share(platform: String) {
        val shareText = "Join me on this amazing app! Use my invite code: $code or click here: $inviteLink"
        try {
            when (platform) {
                "whatsapp" -> {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/?text=" + Uri.encode(shareText)))
                    context.startActivity(intent)
                }
                "facebook" -> {
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://www.facebook.com/sharer/sharer.php?u=" + Uri.encode(inviteLink)))
                    context.startActivity(intent)
                }
                "copy" -> {
                    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    clipboard.setPrimaryClip(ClipData.newPlainText("Invite link", inviteLink))
                    copied = true
                    Toast.makeText(context, "Link copied!", Toast.LENGTH_SHORT).show()
                }
                else -> {
                    val intent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TITLE, "Invite Code")
                        putExtra(Intent.EXTRA_TEXT, shareText)
                    }
                    context.startActivity(Intent.createChooser(intent, null))
                }
            }
        } catch (_: Exception) {
            Toast.makeText(context, "Unable to open sharing app", Toast.LENGTH_SHORT).show()
        }
    }

    BoxWithConstraints(Modifier.fillMaxSize().background(inviteRed)) {
        Box(Modifier.fillMaxWidth().height(screenHeight * .5f).align(Alignment.TopCenter)) {
            InviteArt(
                "IMG-20260830-WA0076.jpg",
                Modifier.fillMaxSize(),
                key = InviteKey.GREEN,
                scale = ContentScale.Crop
            )
            Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color.Transparent, inviteRed))))
        }

        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(bottom = screenHeight * .25f)
        ) {
            Spacer(Modifier.height(screenHeight * .45f))
            Column(
                Modifier.fillMaxWidth().widthIn(max = 448.dp).align(Alignment.CenterHorizontally).padding(horizontal = 0.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(Modifier.fillMaxWidth()) {
                    InviteArt("1788074201753~2.jpg", Modifier.fillMaxWidth().wrapContentHeight(), key = InviteKey.GREEN)
                    Row(
                        Modifier.fillMaxWidth().align(Alignment.BottomCenter).padding(start = 30.dp, end = 30.dp, bottom = 15.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Friend's Invite", color = inviteYellow, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text("0", color = inviteYellow, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Box(Modifier.fillMaxWidth()) {
                    InviteArt("1788100666322~2.jpg", Modifier.fillMaxWidth().wrapContentHeight(), key = InviteKey.GREEN)
                    Column(Modifier.fillMaxWidth().padding(horizontal = 35.dp)) {
                        Row(
                            Modifier.fillMaxWidth().padding(top = 100.dp).height(24.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Invite Friends", color = inviteYellow, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            InviteReward("250000", onClick = { inviteRules = true })
                        }
                        Row(
                            Modifier.fillMaxWidth().padding(top = 51.dp).height(32.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Friends Recharge", color = inviteYellow, fontSize = 14.sp, fontWeight = FontWeight.Bold, lineHeight = 16.sp)
                                Text(">500000 Coins", color = invitePaleYellow, fontSize = 10.sp, fontWeight = FontWeight.Medium, letterSpacing = 1.sp)
                            }
                            InviteReward("250000", onClick = { rechargeRules = true })
                        }
                        Row(
                            Modifier.fillMaxWidth().padding(top = 48.dp).height(38.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text("Friends Send", color = inviteYellow, fontSize = 14.sp, fontWeight = FontWeight.Bold, lineHeight = 16.sp)
                                Text("Gift", color = inviteYellow, fontSize = 14.sp, fontWeight = FontWeight.Bold, lineHeight = 16.sp)
                            }
                            InviteReward("6%", onClick = { giftRules = true })
                        }
                    }
                }

                Box(Modifier.fillMaxWidth()) {
                    InviteArt("1788102034828~2.jpg", Modifier.fillMaxWidth().wrapContentHeight(), key = InviteKey.GREEN)
                    Column(Modifier.fillMaxWidth()) {
                        Column(
                            Modifier.align(Alignment.CenterHorizontally).padding(bottom = screenHeight * .31f),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            InviteArt("file_00000000e56882119c217d508b6733dc.png", Modifier.size(50.dp), key = InviteKey.WHITE)
                            Text("0", color = inviteYellow, fontSize = 30.sp, fontWeight = FontWeight.Bold, lineHeight = 32.sp)
                            Box(
                                Modifier.padding(top = 12.dp).clip(CircleShape)
                                    .background(Brush.verticalGradient(listOf(Color(0xFFE62E2E), Color(0xFFB80D0D), Color(0xFF7A0000))))
                                    .border(1.5.dp, inviteYellow, CircleShape)
                                    .padding(horizontal = 40.dp, vertical = 6.dp)
                            ) {
                                Text("Claim", color = inviteYellow, fontSize = 14.sp, fontWeight = FontWeight.ExtraBold)
                            }
                        }
                        Row(
                            Modifier.fillMaxWidth().padding(start = 85.dp, end = 80.dp, top = 0.dp, bottom = screenHeight * .09f),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Bottom
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("0", color = inviteYellow, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                                Text("Number\nInvitation", color = inviteYellow, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, lineHeight = 12.sp, textAlign = TextAlign.Center)
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                InviteArt("file_00000000e56882119c217d508b6733dc.png", Modifier.size(40.dp), key = InviteKey.WHITE)
                                Text("0", color = inviteYellow, fontSize = 24.sp, fontWeight = FontWeight.Bold, lineHeight = 25.sp)
                                Text("Total Coins\nRewards", color = inviteYellow, fontSize = 10.sp, fontWeight = FontWeight.SemiBold, lineHeight = 12.sp, textAlign = TextAlign.Center)
                            }
                        }
                    }
                }
                Spacer(Modifier.height(screenHeight * .08f))
            }
        }

        InviteArt(
            "1788074191602~2.jpg",
            Modifier.align(Alignment.BottomEnd).padding(end = 8.dp).widthIn(max = 360.dp).fillMaxWidth(.88f).wrapContentHeight().clickable { isSheetOpen = true },
            key = InviteKey.GREEN
        )
        IconButton(
            onClick = { onBack?.invoke() ?: onClose?.invoke() },
            modifier = Modifier.align(Alignment.TopStart).statusBarsPadding().padding(start = 0.dp, top = 16.dp)
        ) {
            Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White, modifier = Modifier.size(28.dp))
        }
        IconButton(
            onClick = { helpRules = true },
            modifier = Modifier.align(Alignment.TopEnd).statusBarsPadding().padding(end = 8.dp, top = 16.dp)
        ) {
            Icon(Icons.Default.HelpOutline, contentDescription = "Details", tint = Color.White, modifier = Modifier.size(28.dp))
        }

        if (isSheetOpen) {
            Box(Modifier.fillMaxSize().align(Alignment.BottomCenter)) {
                Column(
                    Modifier.align(Alignment.BottomCenter).fillMaxWidth().height(screenHeight * .20f)
                        .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                        .background(Color.White).padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        IconButton(onClick = { isSheetOpen = false }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.Close, contentDescription = "Close", tint = Color(0xFF9CA3AF), modifier = Modifier.size(18.dp))
                        }
                    }
                    Row(Modifier.fillMaxWidth().weight(1f), horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.CenterVertically) {
                        InviteShareItem("WhatsApp", Color(0xFF25D366), "whatsapp") { share("whatsapp") }
                        InviteShareItem("Facebook", Color(0xFF1877F2), "facebook") { share("facebook") }
                        InviteShareItem("Copy Link", Color(0xFF0088CC), "link") { share("copy") }
                        InviteShareItem("More", Color(0xFFF97316), "more") { share("more") }
                    }
                    if (copied) Text("✓ Link copied!", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center, color = Color(0xFF2563EB), fontSize = 11.sp)
                }
            }
        }
    }

    if (inviteRules) InviteRulesDialog(
        text = "If invite friend download & enter the Invite code in the input Given. Then a Inverter will Receive a 250,000Coins rewards hand to hand in there coins wallet",
        centered = false
    ) { inviteRules = false }
    if (giftRules) InviteRulesDialog(
        text = "If Invited friend Will send Gift to any one So a Inviter user will receive 6% of the Sended gift Value.",
        centered = true
    ) { giftRules = false }
    if (rechargeRules) InviteRulesDialog(
        text = "If the Invited friend Recharge more then >500000 so a inviter User will receive 250000 coins In there Coins wallet",
        centered = true
    ) { rechargeRules = false }
    if (helpRules) InviteRulesDialog(
        text = "1. Invite a friend to register and receive instant coins. You will get 100,000 coins when they log in. If your friend logs into the Zyora app the next day or within 3 days, they will receive an additional 150,000 coins.\n\n2. If your invited friend recharges 500,000 coins within 90 days, you will receive 6% of the coins from each recharge. Additionally, if your friend sends gift coins, you will receive 6% of the coins from the gifts they send.\n\n3. The Zyora app must not already be downloaded or registered on your friend's phone, and they must not be part of another account's network. The invitation will be considered successful—and rewards granted—only when all these conditions are met.\n\n4. Invite your friends; you will earn free coins when they recharge or send gifts.\n\nBest regards, The Zyora Team",
        centered = false,
        smallText = true
    ) { helpRules = false }
}

@Composable
private fun InviteReward(value: String, onClick: () -> Unit) {
    Row(
        modifier = Modifier.clickable(onClick = onClick),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(3.dp)
    ) {
        Text("Get", color = inviteYellow, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        InviteArt("file_00000000e56882119c217d508b6733dc.png", Modifier.size(20.dp), key = InviteKey.WHITE)
        Text(value, color = inviteYellow, fontSize = 14.sp, fontWeight = FontWeight.Bold, maxLines = 1)
        Box(Modifier.padding(start = 1.dp).size(16.dp).clip(CircleShape).background(inviteYellow), contentAlignment = Alignment.Center) {
            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = inviteRed, modifier = Modifier.size(14.dp))
        }
    }
}

@Composable
private fun InviteShareItem(label: String, color: Color, glyph: String, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.clickable(onClick = onClick)) {
        Box(Modifier.size(48.dp).clip(CircleShape).background(color), contentAlignment = Alignment.Center) {
            when (glyph) {
                "whatsapp" -> InviteBrandGlyph("M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.23.31-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.77 2.7 4.29 3.79.26.26 1.15.53 1.44.53.48 0 1.15-.07 1.58-.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z", Modifier.size(24.dp))
                "facebook" -> InviteBrandGlyph("M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z", Modifier.size(24.dp))
                "link" -> Icon(Icons.Default.Link, contentDescription = null, tint = Color.White, modifier = Modifier.size(22.dp))
                "more" -> Icon(Icons.Default.MoreHoriz, contentDescription = null, tint = Color.White, modifier = Modifier.size(22.dp))
            }
        }
        Text(label, color = Color(0xFF1F2937), fontSize = 11.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun InviteBrandGlyph(pathData: String, modifier: Modifier = Modifier) {
    val path = remember(pathData) { PathParser().parsePathString(pathData).toPath() }
    androidx.compose.foundation.Canvas(modifier) {
        drawContext.transform.scale(size.width / 24f, size.height / 24f, pivot = androidx.compose.ui.geometry.Offset.Zero)
        drawPath(path, color = Color.White)
        drawContext.transform.scale(24f / size.width, 24f / size.height, pivot = androidx.compose.ui.geometry.Offset.Zero)
    }
}

@Composable
private fun InviteRulesDialog(text: String, centered: Boolean, smallText: Boolean = false, onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(Modifier.fillMaxWidth().padding(horizontal = 32.dp), contentAlignment = Alignment.Center) {
            Column(
                Modifier.fillMaxWidth().widthIn(max = 300.dp).clip(RoundedCornerShape(16.dp))
                    .background(invitePopupPurple).border(3.dp, Color(0xFFFACC15), RoundedCornerShape(16.dp))
                    .padding(start = 16.dp, end = 16.dp, top = 20.dp, bottom = 24.dp)
            ) {
                Text("Rules", modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), color = inviteYellow, fontSize = 18.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp, textAlign = TextAlign.Center)
                Text(
                    text,
                    modifier = Modifier.fillMaxWidth(),
                    color = Color.White,
                    fontSize = if (smallText) 11.sp else 12.sp,
                    lineHeight = if (smallText) 16.sp else 18.sp,
                    fontWeight = FontWeight.Medium,
                    textAlign = if (centered) TextAlign.Center else TextAlign.Start
                )
            }
        }
    }
}
