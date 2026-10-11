package com.hurry.voicechat

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.widget.Toast
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
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil3.compose.AsyncImage

private const val INVITE_ASSET_BASE = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"

@Composable
fun InviteFriends(onBack: (() -> Unit)? = null, onClose: (() -> Unit)? = null) {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("hurry_user", Context.MODE_PRIVATE) }
    val uid = prefs.getString("uid", "")?.takeIf { it.isNotBlank() } ?: "N/A"
    val inviteCode = if (uid == "N/A") "WELCOME123" else uid
    val inviteLink = "https://yourapp.com/invite/$inviteCode"
    var showShare by remember { mutableStateOf(false) }
    var copied by remember { mutableStateOf(false) }
    var ruleType by remember { mutableStateOf("") }
    val screenHeight = LocalConfiguration.current.screenHeightDp.dp
    val bg = Color(0xFF4D0515)
    val gold = Color(0xFFFFD52A)

    Box(Modifier.fillMaxSize().background(bg)) {
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(bottom = screenHeight * 0.22f)
        ) {
            Box(Modifier.fillMaxWidth().height(screenHeight * 0.50f)) {
                AsyncImage(
                    INVITE_ASSET_BASE + "IMG-20260830-WA0076.jpg", null,
                    Modifier.fillMaxSize(), contentScale = ContentScale.Crop,
                    alignment = Alignment.TopCenter
                )
                Box(Modifier.fillMaxSize().background(Brush.verticalGradient(
                    0f to Color.Transparent, 0.60f to Color.Transparent, 1f to bg
                )))
            }

            Column(Modifier.fillMaxWidth().offset(y = -(screenHeight * 0.05f)), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Box(Modifier.fillMaxWidth()) {
                    AsyncImage(INVITE_ASSET_BASE + "1788074201753~2.jpg", null,
                        Modifier.fillMaxWidth().height(screenHeight * 0.25f), contentScale = ContentScale.Fit)
                    Row(Modifier.fillMaxWidth().align(Alignment.BottomCenter).padding(horizontal = 30.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("Friend's Invite", color = gold, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text("0", color = gold, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Box(Modifier.fillMaxWidth()) {
                    AsyncImage(INVITE_ASSET_BASE + "1788100666322~2.jpg", null,
                        Modifier.fillMaxWidth().height(screenHeight * 0.43f), contentScale = ContentScale.Fit)
                    Column(Modifier.fillMaxWidth().padding(start = 40.dp, end = 30.dp, top = 42.dp)) {
                        InviteRewardRow("Invite Friends", "250000", gold, onClick = { ruleType = "invite" })
                        Spacer(Modifier.height(34.dp))
                        InviteRewardRow("Friends Recharge", "250000", gold, subtitle = ">500000 Coins", onClick = { ruleType = "recharge" })
                        Spacer(Modifier.height(30.dp))
                        InviteRewardRow("Friends Send\nGift", "6%", gold, onClick = { ruleType = "gift" })
                    }
                }

                Box(Modifier.fillMaxWidth()) {
                    AsyncImage(INVITE_ASSET_BASE + "1788102034828~2.jpg", null,
                        Modifier.fillMaxWidth().height(screenHeight * 0.75f), contentScale = ContentScale.Fit)
                    Column(Modifier.fillMaxWidth().align(Alignment.TopCenter).padding(top = screenHeight * 0.12f),
                        horizontalAlignment = Alignment.CenterHorizontally) {
                        AsyncImage(INVITE_ASSET_BASE + "file_00000000e56882119c217d508b6733dc.png", null,
                            Modifier.size(50.dp), contentScale = ContentScale.Fit)
                        Text("0", color = gold, fontSize = 30.sp, fontWeight = FontWeight.ExtraBold)
                        Spacer(Modifier.height(10.dp))
                        Box(Modifier.clip(RoundedCornerShape(24.dp)).background(
                            Brush.verticalGradient(listOf(Color(0xFFE62E2E), Color(0xFFB80D0D), Color(0xFF7A0000)))
                        ).background(Color.Transparent).clickable { showShare = true }
                            .padding(horizontal = 40.dp, vertical = 7.dp)) {
                            Text("Claim", color = Color(0xFFFFE66B), fontSize = 14.sp, fontWeight = FontWeight.ExtraBold)
                        }
                    }
                    Row(Modifier.fillMaxWidth().align(Alignment.BottomCenter).padding(bottom = screenHeight * 0.10f, start = 54.dp, end = 54.dp),
                        horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Bottom) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("0", color = gold, fontSize = 25.sp, fontWeight = FontWeight.Bold)
                            Text("Number\nInvitation", color = gold, fontSize = 10.sp, textAlign = TextAlign.Center, lineHeight = 12.sp)
                        }
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            AsyncImage(INVITE_ASSET_BASE + "file_00000000e56882119c217d508b6733dc.png", null,
                                Modifier.size(40.dp), contentScale = ContentScale.Fit)
                            Text("0", color = gold, fontSize = 25.sp, fontWeight = FontWeight.Bold)
                            Text("Total Coins\nRewards", color = gold, fontSize = 10.sp, textAlign = TextAlign.Center, lineHeight = 12.sp)
                        }
                    }
                }
            }
        }

        AsyncImage(
            INVITE_ASSET_BASE + "1788074191602~2.jpg", null,
            Modifier.align(Alignment.BottomEnd).fillMaxWidth(0.88f).height(screenHeight * 0.22f)
                .clickable { showShare = true },
            contentScale = ContentScale.Fit, alignment = Alignment.BottomEnd
        )

        IconButton(onClick = { (onBack ?: onClose)?.invoke() },
            modifier = Modifier.align(Alignment.TopStart).padding(top = 28.dp, start = 4.dp)) {
            Icon(Icons.Default.ArrowBack, "Back", tint = Color.White, modifier = Modifier.size(28.dp))
        }
        IconButton(onClick = { ruleType = "help" },
            modifier = Modifier.align(Alignment.TopEnd).padding(top = 28.dp, end = 8.dp)) {
            Icon(Icons.Default.HelpOutline, "Invite rules", tint = Color.White, modifier = Modifier.size(28.dp))
        }

        if (ruleType.isNotEmpty()) {
            val title = "Rules"
            val body = when (ruleType) {
                "invite" -> "If invite friend download & enter the Invite code in the input given, then an inviter will receive a 250,000 coins reward in their coins wallet."
                "recharge" -> "If the invited friend recharges more than 500,000 coins, the inviter will receive 250,000 coins in their coins wallet."
                "gift" -> "If the invited friend sends gifts, the inviter user will receive 6% of the sent gift value."
                else -> "1. Invite a friend to register and receive instant coins. You will get 100,000 coins when they log in. If your friend logs into the Hurry app the next day or within 3 days, they will receive an additional 150,000 coins.\n\n2. If your invited friend recharges 500,000 coins within 90 days, you will receive 6% of the coins from each recharge. Additionally, if your friend sends gift coins, you will receive 6% of the coins from the gifts they send.\n\n3. The Hurry app must not already be downloaded or registered on your friend's phone, and they must not be part of another account's network. The invitation will be considered successful—and rewards granted—only when all these conditions are met.\n\n4. Invite your friends; you will earn free coins when they recharge or send gifts.\n\nBest regards, The Hurry Team"
            }
            Dialog(onDismissRequest = { ruleType = "" }) {
                Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFF750A75)).padding(16.dp)) {
                    Text(title, Modifier.fillMaxWidth(), color = gold, fontSize = 19.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(12.dp))
                    Column(Modifier.heightIn(max = screenHeight * 0.62f).verticalScroll(rememberScrollState())) {
                        Text(body, color = Color.White, fontSize = if (ruleType == "help") 11.sp else 12.sp, lineHeight = 17.sp)
                    }
                }
            }
        }

        if (showShare) {
            Box(Modifier.fillMaxSize().background(Color.Transparent).clickable { showShare = false }, contentAlignment = Alignment.BottomCenter) {
                Column(Modifier.fillMaxWidth().height(screenHeight * 0.20f).clip(RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp))
                    .background(Color.White).clickable(enabled = false) {}.padding(horizontal = 14.dp, vertical = 6.dp)) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                        IconButton(onClick = { showShare = false }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.Close, "Close", tint = Color.Gray, modifier = Modifier.size(18.dp))
                        }
                    }
                    Row(Modifier.fillMaxWidth().weight(1f), horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.CenterVertically) {
                        ShareOption("WhatsApp", Color(0xFF25D366), "W") { shareInvite(context, inviteLink, inviteCode, "com.whatsapp") }
                        ShareOption("Facebook", Color(0xFF1877F2), "f") { shareInvite(context, inviteLink, inviteCode, "com.facebook.katana") }
                        ShareOption("Copy Link", Color(0xFF0088CC), "↗") {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            clipboard.setPrimaryClip(ClipData.newPlainText("Invite link", inviteLink))
                            copied = true
                            Toast.makeText(context, "Link copied", Toast.LENGTH_SHORT).show()
                        }
                        ShareOption("More", Color(0xFFFF8A00), "•••") { shareInvite(context, inviteLink, inviteCode, null) }
                    }
                    if (copied) Text("✓ Link copied!", Modifier.fillMaxWidth(), color = Color(0xFF2563EB), fontSize = 11.sp, textAlign = TextAlign.Center)
                }
            }
        }
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
            AsyncImage(INVITE_ASSET_BASE + "file_00000000e56882119c217d508b6733dc.png", null, Modifier.size(20.dp), contentScale = ContentScale.Fit)
            Text(reward, color = gold, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Box(Modifier.size(16.dp).clip(CircleShape).background(gold), contentAlignment = Alignment.Center) {
                Text("›", color = Color(0xFF4D0515), fontSize = 16.sp, fontWeight = FontWeight.ExtraBold)
            }
        }
    }
}

@Composable
private fun ShareOption(label: String, color: Color, symbol: String, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(5.dp),
        modifier = Modifier.clickable { onClick() }.padding(horizontal = 2.dp)) {
        Box(Modifier.size(48.dp).clip(CircleShape).background(color), contentAlignment = Alignment.Center) {
            Text(symbol, color = Color.White, fontSize = if (symbol == "•••") 17.sp else 22.sp, fontWeight = FontWeight.Bold)
        }
        Text(label, color = Color(0xFF262626), fontSize = 11.sp, fontWeight = FontWeight.Medium)
    }
}

private fun shareInvite(context: Context, link: String, code: String, packageName: String?) {
    val text = "Join me on this amazing app! Use my invite code: $code or click here: $link"
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_TEXT, text)
        if (packageName != null) setPackage(packageName)
    }
    try {
        context.startActivity(if (packageName == null) Intent.createChooser(intent, "Invite friends") else intent)
    } catch (_: Exception) {
        Toast.makeText(context, "App not available; use More to share", Toast.LENGTH_SHORT).show()
    }
}
