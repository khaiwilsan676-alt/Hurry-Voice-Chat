package com.hurry.voicechat

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URL

private const val INVITE_ASSET_BASE = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"

@Composable
fun InviteFriends(onBack: (() -> Unit)? = null, onClose: (() -> Unit)? = null) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("hurry_user", Context.MODE_PRIVATE) }
    val storedUid = prefs.getString("uid", "")?.takeIf { it.isNotBlank() }
        ?: prefs.getString("userUID", "")?.takeIf { it.isNotBlank() }
    val inviteCode = storedUid ?: "WELCOME123"
    val inviteLink = "https://yourapp.com/invite/$inviteCode"
    var showShare by remember { mutableStateOf(false) }
    var copied by remember { mutableStateOf(false) }
    var ruleType by remember { mutableStateOf("") }
    val screenHeight = LocalConfiguration.current.screenHeightDp.dp
    val bg = Color(0xFF4D0515)
    val gold = Color(0xFFFFD52A)

    BoxWithConstraints(Modifier.fillMaxSize().background(bg)) {
        val h = maxHeight
        // Original TSX: fixed 50vh top art, with the main image stack starting at 45vh.
        KeyedInviteImage(
            "IMG-20260830-WA0076.jpg", Modifier.fillMaxWidth().height(h * .50f).align(Alignment.TopCenter),
            ContentScale.Crop, removeGreen = true, alignment = Alignment.TopCenter
        )
        Box(Modifier.fillMaxWidth().height(h * .50f).align(Alignment.TopCenter)
            .background(Brush.verticalGradient(0f to Color.Transparent, .65f to Color.Transparent, 1f to bg)))

        Column(
            Modifier.fillMaxWidth().fillMaxHeight().verticalScroll(rememberScrollState())
                .padding(top = h * .45f, bottom = h * .25f),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Ornament / Friend's Invite image; keep source aspect ratio just like the TSX canvas.
            Box(Modifier.fillMaxWidth().widthIn(max = 448.dp)) {
                KeyedInviteImage("1788074201753~2.jpg", Modifier.fillMaxWidth(), ContentScale.Fit, removeGreen = true)
                Row(Modifier.fillMaxWidth().align(Alignment.BottomCenter).padding(start = 30.dp, end = 30.dp, bottom = 15.dp),
                    horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Friend's Invite", color = gold, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text("0", color = gold, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                }
            }

            // My Gain panel and all three interactive reward rows.
            Box(Modifier.fillMaxWidth().widthIn(max = 448.dp)) {
                KeyedInviteImage("1788100666322~2.jpg", Modifier.fillMaxWidth(), ContentScale.Fit, removeGreen = true)
                Column(Modifier.fillMaxWidth().padding(top = 100.dp, start = 40.dp, end = 35.dp)) {
                    InviteRewardRow("Invite Friends", "250000", gold, onClick = { ruleType = "invite" })
                    Spacer(Modifier.height(53.dp))
                    InviteRewardRow("Friends Recharge", "250000", gold, subtitle = ">500000 Coins", onClick = { ruleType = "recharge" })
                    Spacer(Modifier.height(52.dp))
                    InviteRewardRow("Friends Send\nGift", "6%", gold, onClick = { ruleType = "gift" })
                }
            }

            // Coins panel. Original image and reward labels stay in the artwork's own proportions.
            Box(Modifier.fillMaxWidth().widthIn(max = 448.dp)) {
                KeyedInviteImage("1788102034828~2.jpg", Modifier.fillMaxWidth(), ContentScale.Fit, removeGreen = true)
                Column(Modifier.fillMaxWidth().align(Alignment.TopCenter).padding(top = h * .31f),
                    horizontalAlignment = Alignment.CenterHorizontally) {
                    KeyedInviteImage("file_00000000e56882119c217d508b6733dc.png", Modifier.size(50.dp), ContentScale.Fit, removeGreen = false)
                    Text("0", color = gold, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold)
                    Spacer(Modifier.height(12.dp))
                    Box(Modifier.clip(RoundedCornerShape(24.dp))
                        .background(Brush.verticalGradient(listOf(Color(0xFFE62E2E), Color(0xFFB80D0D), Color(0xFF7A0000))))
                        .clickable { showShare = true }
                        .padding(horizontal = 40.dp, vertical = 7.dp)) {
                        Text("Claim", color = Color(0xFFFFE66B), fontSize = 14.sp, fontWeight = FontWeight.ExtraBold)
                    }
                }
                Row(Modifier.fillMaxWidth().align(Alignment.BottomCenter).padding(bottom = h * .09f, start = 85.dp, end = 80.dp),
                    horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("0", color = gold, fontSize = 25.sp, fontWeight = FontWeight.Bold)
                        Text("Number\nInvitation", color = gold, fontSize = 10.sp, textAlign = TextAlign.Center, lineHeight = 12.sp)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        KeyedInviteImage("file_00000000e56882119c217d508b6733dc.png", Modifier.size(40.dp), ContentScale.Fit, removeGreen = false)
                        Text("0", color = gold, fontSize = 25.sp, fontWeight = FontWeight.Bold)
                        Text("Total Coins\nRewards", color = gold, fontSize = 10.sp, textAlign = TextAlign.Center, lineHeight = 12.sp)
                    }
                }
            }
            Spacer(Modifier.height(h * .08f))
        }

        // Bottom decorative artwork is also the real app's share-sheet handle.
        KeyedInviteImage(
            "1788074191602~2.jpg",
            Modifier.align(Alignment.BottomEnd).fillMaxWidth(.88f).widthIn(max = 360.dp)
                .height(h * .25f).clickable { showShare = true },
            ContentScale.Fit, removeGreen = true, alignment = Alignment.BottomEnd
        )

        IconButton(onClick = { (onBack ?: onClose)?.invoke() },
            modifier = Modifier.align(Alignment.TopStart).padding(top = 24.dp, start = 0.dp)) {
            Icon(Icons.Default.ArrowBack, "Back", tint = Color.White, modifier = Modifier.size(28.dp))
        }
        IconButton(onClick = { ruleType = "help" },
            modifier = Modifier.align(Alignment.TopEnd).padding(top = 24.dp, end = 12.dp)) {
            Icon(Icons.Default.HelpOutline, "Details", tint = Color.White, modifier = Modifier.size(28.dp))
        }

        if (ruleType.isNotEmpty()) {
            val body = when (ruleType) {
                "invite" -> "If invite friend download & enter the Invite code in the input Given. Then a Inverter will Receive a 250,000Coins rewards hand to hand in there coins wallet"
                "recharge" -> "If the Invited friend Recharge more then >500000 so a inviter User will receive 250000 coins In there Coins wallet"
                "gift" -> "If Invited friend Will send Gift to any one So a Inviter user will receive 6% of the Sended gift Value."
                else -> "1. Invite a friend to register and receive instant coins. You will get 100,000 coins when they log in. If your friend logs into the Hurry app the next day or within 3 days, they will receive an additional 150,000 coins.\n\n2. If your invited friend recharges 500,000 coins within 90 days, you will receive 6% of the coins from each recharge. Additionally, if your friend sends gift coins, you will receive 6% of the coins from the gifts they send.\n\n3. The Hurry app must not already be downloaded or registered on your friend's phone, and they must not be part of another account's network. The invitation will be considered successful—and rewards granted—only when all these conditions are met.\n\n4. Invite your friends; you will earn free coins when they recharge or send gifts.\n\nBest regards, The Hurry Team"
            }
            Dialog(onDismissRequest = { ruleType = "" }) {
                Column(Modifier.fillMaxWidth().widthIn(max = 300.dp).clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFF750A75)).padding(16.dp)) {
                    Text("Rules", Modifier.fillMaxWidth(), color = gold, fontSize = 19.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(12.dp))
                    Column(Modifier.heightIn(max = h * .62f).verticalScroll(rememberScrollState())) {
                        Text(body, color = Color.White, fontSize = if (ruleType == "help") 11.sp else 12.sp, lineHeight = 17.sp)
                    }
                }
            }
        }

        AnimatedVisibility(
            visible = showShare,
            modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth(),
            enter = slideInVertically(initialOffsetY = { it }),
            exit = slideOutVertically(targetOffsetY = { it })
        ) {
            Column(Modifier.fillMaxWidth().height(h * .20f)
                .clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                .background(Color.White).padding(horizontal = 14.dp, vertical = 6.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    IconButton(onClick = { showShare = false }, modifier = Modifier.size(28.dp)) {
                        Icon(Icons.Default.Close, "Close", tint = Color.Gray, modifier = Modifier.size(18.dp))
                    }
                }
                Row(Modifier.fillMaxWidth().weight(1f), horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.CenterVertically) {
                    InviteShareOption("WhatsApp", Color(0xFF25D366), "W") { shareInvite(context, inviteLink, inviteCode, "com.whatsapp") }
                    InviteShareOption("Facebook", Color(0xFF1877F2), "f") { shareInvite(context, inviteLink, inviteCode, "com.facebook.katana") }
                    InviteShareOption("Copy Link", Color(0xFF0088CC), "↗") {
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        clipboard.setPrimaryClip(ClipData.newPlainText("Invite link", inviteLink))
                        copied = true
                        Toast.makeText(context, "Link copied!", Toast.LENGTH_SHORT).show()
                    }
                    InviteShareOption("More", Color(0xFFFF8A00), "•••") { shareInvite(context, inviteLink, inviteCode, null) }
                }
                if (copied) Text("✓ Link copied!", Modifier.fillMaxWidth(), color = Color(0xFF2563EB), fontSize = 11.sp, textAlign = TextAlign.Center)
            }
        }
    }
}

@Composable
private fun KeyedInviteImage(
    asset: String,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Fit,
    removeGreen: Boolean,
    alignment: Alignment = Alignment.Center
) {
    var bitmap by remember(asset, removeGreen) { mutableStateOf<Bitmap?>(null) }
    LaunchedEffect(asset, removeGreen) {
        bitmap = withContext(Dispatchers.IO) {
            runCatching {
                URL(INVITE_ASSET_BASE + asset).openStream().use { input ->
                    BitmapFactory.decodeStream(input)
                }?.let { source ->
                    if (!removeGreen && asset == "file_00000000e56882119c217d508b6733dc.png") {
                        val copy = source.copy(Bitmap.Config.ARGB_8888, true)
                        for (y in 0 until copy.height) for (x in 0 until copy.width) {
                            val c = copy.getPixel(x, y)
                            val r = android.graphics.Color.red(c)
                            val g = android.graphics.Color.green(c)
                            val b = android.graphics.Color.blue(c)
                            if (r > 210 && g > 210 && b > 210) {
                                val avg = (r + g + b) / 3
                                val alpha = if (avg > 240) 0 else (255 * (1f - (avg - 210) / 30f)).toInt().coerceIn(0, 255)
                                copy.setPixel(x, y, android.graphics.Color.argb(alpha, r, g, b))
                            }
                        }
                        copy
                    } else if (removeGreen) {
                        val copy = source.copy(Bitmap.Config.ARGB_8888, true)
                        for (y in 0 until copy.height) for (x in 0 until copy.width) {
                            val c = copy.getPixel(x, y)
                            val r = android.graphics.Color.red(c)
                            val g = android.graphics.Color.green(c)
                            val b = android.graphics.Color.blue(c)
                            val diff = g - maxOf(r, b)
                            if (diff > 30 && g > 60) {
                                copy.setPixel(x, y, android.graphics.Color.TRANSPARENT)
                            } else if (diff > 10 && g > 50) {
                                val alpha = (255 * (1f - (diff - 10) / 20f)).toInt().coerceIn(0, 255)
                                val nr = maxOf(r, b)
                                copy.setPixel(x, y, android.graphics.Color.argb(alpha, nr, nr, nr))
                            }
                        }
                        copy
                    } else source
                }
            }.getOrNull()
        }
    }
    val loaded = bitmap
    if (loaded != null) {
        Image(bitmap = loaded.asImageBitmap(), contentDescription = asset, modifier = modifier,
            contentScale = contentScale, alignment = alignment)
    } else {
        Spacer(modifier)
    }
}

@Composable
private fun InviteRewardRow(
    label: String,
    reward: String,
    gold: Color,
    subtitle: String? = null,
    onClick: () -> Unit
) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f)) {
            Text(label, color = gold, fontSize = 14.sp, fontWeight = FontWeight.Bold, lineHeight = 16.sp)
            if (subtitle != null) Text(subtitle, color = Color(0xFFFFE45B), fontSize = 10.sp, fontWeight = FontWeight.Medium)
        }
        Row(Modifier.clip(RoundedCornerShape(16.dp)).clickable { onClick() }.padding(vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
            Text("Get", color = gold, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
            KeyedInviteImage("file_00000000e56882119c217d508b6733dc.png", Modifier.size(20.dp), ContentScale.Fit, removeGreen = false)
            Text(reward, color = gold, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Box(Modifier.size(16.dp).clip(CircleShape).background(gold), contentAlignment = Alignment.Center) {
                Text("›", color = Color(0xFF4D0515), fontSize = 16.sp, fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}

@Composable
private fun InviteShareOption(label: String, color: Color, symbol: String, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(5.dp),
        modifier = Modifier.clickable { onClick() }.padding(horizontal = 2.dp)) {
        Box(Modifier.size(48.dp).clip(CircleShape).background(color), contentAlignment = Alignment.Center) {
            Text(symbol, color = Color.White, fontSize = if (symbol == "•••") 17.sp else 22.sp, fontWeight = FontWeight.Bold)
        }
        Text(label, color = Color(0xFF262626), fontSize = 11.sp, fontWeight = FontWeight.Medium)
    }
}

private fun shareInvite(context: Context, link: String, code: String, packageName: String?) {
    val shareText = "Join me on this amazing app! Use my invite code: $code or click here: $link"
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, shareText)
        if (packageName != null) setPackage(packageName)
    }
    try {
        context.startActivity(if (packageName == null) Intent.createChooser(intent, "Invite friends") else intent)
    } catch (_: Exception) {
        Toast.makeText(context, "App not available; use More to share", Toast.LENGTH_SHORT).show()
    }
}
