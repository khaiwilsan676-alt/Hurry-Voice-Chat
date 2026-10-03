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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage

private const val RAW_ME = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"

private data class MeMenu(val label: String, val asset: String)

@Composable
fun MeScreen() {
    val context = LocalContext.current
    val prefs = remember { context.getSharedPreferences("hurry_user", Context.MODE_PRIVATE) }
    val uid = prefs.getString("uid", "") ?: ""
    val name = prefs.getString("name", "")?.takeIf { it.isNotBlank() && it.lowercase() !in listOf("guest","user","null","undefined") }
        ?: "Hurry User"
    val photo = prefs.getString("photo", "") ?: ""
    val account = prefs.getString("accountNumber", "") ?: ""
    val phone = prefs.getString("phone", "") ?: ""

    val topItems = listOf(
        MeMenu("Invite Friends", "IMG_20260915_225333.png"),
        MeMenu("Family", "IMG_20260915_225349.png"),
        MeMenu("Level", "IMG_20260915_225404.png"),
        MeMenu("Medal", "IMG_20260915_225426.png"),
        MeMenu("Store", "IMG_20260915_225447.png"),
        MeMenu("Bag", "IMG_20260915_225506.png"),
        MeMenu("Seller Center", "IMG_20260915_225536.png")
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(Color(0xFFF9FAFB)),
        contentPadding = PaddingValues(bottom = 24.dp)
    ) {
        item {
            Column(
                Modifier.fillMaxWidth().background(
                    Brush.verticalGradient(
                        listOf(Color(0xFF3B82F6), Color(0xFFEFF6FF), Color(0xFFF9FAFB)),
                        startY = 0f, endY = 620f
                    )
                ).padding(top = 40.dp, start = 16.dp, end = 16.dp, bottom = 16.dp)
            ) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
                    Row(Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                        if (photo.isNotBlank()) {
                            AsyncImage(photo, null, Modifier.size(80.dp).clip(CircleShape), contentScale = ContentScale.Crop)
                        } else {
                            Box(Modifier.size(80.dp).clip(CircleShape).background(Color(0xFF666666)), contentAlignment = Alignment.Center) {
                                Text(name.take(1).uppercase(), color = Color.White, fontSize = 34.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        Spacer(Modifier.width(16.dp))
                        Column {
                            Text(name, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color(0xFF111827))
                            if (account.isNotBlank()) Text("ID: $account", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF374151))
                            if (phone.isNotBlank()) Text(phone, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF4B5563))
                        }
                    }
                    Text("›", fontSize = 32.sp, color = Color(0xFF374151), modifier = Modifier.padding(top = 10.dp))
                }

                Spacer(Modifier.height(18.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    Stat("0", "Friends")
                    DividerV()
                    Stat("1", "Followers")
                    DividerV()
                    Stat("0", "Following")
                    DividerV()
                    Stat("1", "Visitors")
                }
            }
        }

        item {
            Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 0.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                FeatureImage("file_00000000f26c81f88083bc494a0f229b.png", Modifier.weight(1f).height(56.dp))
                FeatureImage("file_00000000fe848207abf557a118ff8a5b.png", Modifier.weight(1f).height(56.dp))
            }
        }

        item {
            AsyncImage(
                RAW_ME + "file_00000000a25081fbb57574619596eed8.png", null,
                Modifier.fillMaxWidth().padding(horizontal = 12.dp).padding(top = 0.dp).heightIn(min = 76.dp).clip(RoundedCornerShape(8.dp)),
                contentScale = ContentScale.Crop
            )
        }

        item {
            MenuCard(topItems, Modifier.offset(y = (-32).dp))
        }

        item {
            val bottom = listOf("Language Setting", "Settings", "Customer Service", "Help & Feedback")
            Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp).clip(RoundedCornerShape(6.dp)).background(Color.White)) {
                bottom.forEach { label ->
                    Row(
                        Modifier.fillMaxWidth().clickable { }.padding(horizontal = 16.dp, vertical = 15.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(Modifier.size(32.dp), contentAlignment = Alignment.Center) {
                            Text(if (label == "Settings") "⚙" else if (label == "Help & Feedback") "?" else "◎", fontSize = 22.sp, color = Color(0xFF333333))
                        }
                        Spacer(Modifier.width(4.dp))
                        Text(label, Modifier.weight(1f), fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF171717))
                        Text("›", fontSize = 25.sp, color = Color(0xFFAAAAAA))
                    }
                }
            }
        }
    }
}

@Composable private fun Stat(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color(0xFF111827))
        Text(label, fontSize = 11.sp, color = Color(0xFF4B5563))
    }
}
@Composable private fun DividerV() { Box(Modifier.height(34.dp).width(1.dp).background(Color(0xFFD1D5DB))) }

@Composable private fun FeatureImage(asset: String, modifier: Modifier) {
    AsyncImage(RAW_ME + asset, null, modifier.clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop)
}

@Composable private fun MenuCard(items: List<MeMenu>, modifier: Modifier = Modifier) {
    Column(modifier.padding(horizontal = 16.dp, vertical = 0.dp).clip(RoundedCornerShape(6.dp)).background(Color.White)) {
        items.forEach { item ->
            Row(Modifier.fillMaxWidth().clickable { }.padding(horizontal = 16.dp, vertical = 13.dp), verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(RAW_ME + item.asset, null, Modifier.size(if (item.label == "Seller Center") 40.dp else 32.dp), contentScale = ContentScale.Crop)
                Spacer(Modifier.width(16.dp))
                Text(item.label, Modifier.weight(1f), fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF171717))
                Text("›", fontSize = 25.sp, color = Color(0xFFAAAAAA))
            }
        }
    }
}
