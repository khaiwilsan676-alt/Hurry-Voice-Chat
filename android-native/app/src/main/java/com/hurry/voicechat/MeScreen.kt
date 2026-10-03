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
            MenuCard(topItems, Modifier.offset(y = (-28).dp))
        }

        item {
            val bottom = listOf("Language Setting", "Settings", "Customer Service", "Help & Feedback")
            Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp).clip(RoundedCornerShape(6.dp)).background(Color.White)) {
                bottom.forEach { label ->
                    Row(
                        Modifier.fillMaxWidth().clickable { }.padding(horizontal = 16.dp, vertical = 15.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        MeMenuIcon(
                            type = when (label) {
                                "Language Setting" -> MeIconType.LANGUAGE
                                "Settings" -> MeIconType.SETTINGS
                                "Customer Service" -> MeIconType.SUPPORT
                                else -> MeIconType.HELP
                            }
                        )
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
enum class MeIconType { LANGUAGE, SETTINGS, SUPPORT, HELP }

@Composable
private fun MeMenuIcon(type: MeIconType) {
    androidx.compose.foundation.Canvas(Modifier.size(24.dp)) {
        // The real Hurry web icons use a 24x24 Lucide-style coordinate system.
        // Canvas coordinates are pixels, so scale the 24-unit artwork to the
        // actual 24dp canvas; this keeps the native icon visually identical.
        val unit = size.minDimension / 24f
        androidx.compose.ui.graphics.drawscope.scale(unit, unit) {
            val stroke = androidx.compose.ui.graphics.drawscope.Stroke(
                width = 2f / unit,
                cap = androidx.compose.ui.graphics.StrokeCap.Round,
                join = androidx.compose.ui.graphics.StrokeJoin.Round
            )
            val c = Color(0xFF1E1E1E)
            when (type) {
                MeIconType.LANGUAGE -> {
                    drawCircle(c, radius = 10f, center = androidx.compose.ui.geometry.Offset(12f, 12f), style = stroke)
                    drawLine(c, androidx.compose.ui.geometry.Offset(2f, 12f), androidx.compose.ui.geometry.Offset(22f, 12f), strokeWidth = stroke.width)
                    drawOval(
                        c,
                        topLeft = androidx.compose.ui.geometry.Offset(8f, 2f),
                        size = androidx.compose.ui.geometry.Size(8f, 20f),
                        style = stroke
                    )
                }
                MeIconType.SETTINGS -> {
                    val path = androidx.compose.ui.graphics.Path().apply {
                        moveTo(12f, 2f)
                        lineTo(20f, 6.67f)
                        lineTo(20f, 17.33f)
                        lineTo(12f, 22f)
                        lineTo(4f, 17.33f)
                        lineTo(4f, 6.67f)
                        close()
                    }
                    drawPath(path, c, style = stroke)
                    drawCircle(c, radius = 3f, center = androidx.compose.ui.geometry.Offset(12f, 12f), style = stroke)
                }
                MeIconType.SUPPORT -> {
                    val p = androidx.compose.ui.graphics.Path().apply {
                        moveTo(5.5f, 11f)
                        lineTo(5.5f, 8.5f)
                        cubicTo(5.5f, 5f, 8.2f, 3f, 12f, 3f)
                        cubicTo(15.8f, 3f, 18.5f, 5f, 18.5f, 8.5f)
                        lineTo(18.5f, 15.2f)
                        cubicTo(18.5f, 18.5f, 16.2f, 21f, 12f, 21f)
                    }
                    drawPath(p, c, style = stroke)

                    val left = androidx.compose.ui.graphics.Path().apply {
                        moveTo(3f, 10.2f)
                        lineTo(3f, 13.8f)
                        cubicTo(3f, 14.6f, 3.5f, 15.2f, 4.2f, 15.2f)
                        lineTo(5.5f, 15.2f)
                        lineTo(5.5f, 9f)
                        lineTo(4.2f, 9f)
                        cubicTo(3.5f, 9f, 3f, 9.5f, 3f, 10.2f)
                        close()
                    }
                    drawPath(left, c, style = stroke)

                    val right = androidx.compose.ui.graphics.Path().apply {
                        moveTo(18.5f, 9f)
                        lineTo(19.8f, 9f)
                        cubicTo(20.5f, 9f, 21f, 9.4f, 21f, 10.2f)
                        lineTo(21f, 13.8f)
                        cubicTo(21f, 14.6f, 20.5f, 15.2f, 19.8f, 15.2f)
                        lineTo(18.5f, 15.2f)
                        close()
                    }
                    drawPath(right, c, style = stroke)

                    val smile = androidx.compose.ui.graphics.Path().apply {
                        moveTo(9.2f, 13.8f)
                        cubicTo(9.2f, 15f, 10.3f, 16f, 12f, 16f)
                        cubicTo(13.7f, 16f, 14.8f, 15f, 14.8f, 13.8f)
                    }
                    drawPath(smile, c, style = stroke)
                }
                MeIconType.HELP -> {
                    drawCircle(c, radius = 10f, center = androidx.compose.ui.geometry.Offset(12f, 12f), style = stroke)
                    val q = androidx.compose.ui.graphics.Path().apply {
                        moveTo(9.09f, 9f)
                        cubicTo(9.35f, 7.15f, 10.45f, 6f, 12f, 6f)
                        cubicTo(13.75f, 6f, 14.92f, 7.25f, 14.92f, 9f)
                        cubicTo(14.92f, 11f, 12f, 12f, 12f, 14f)
                    }
                    drawPath(q, c, style = stroke)
                    drawCircle(c, radius = 1f, center = androidx.compose.ui.geometry.Offset(12f, 17f))
                }
            }
        }
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
