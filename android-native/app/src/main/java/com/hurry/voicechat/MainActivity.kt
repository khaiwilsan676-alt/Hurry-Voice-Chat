package com.hurry.voicechat

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val Blue = Color(0xFF3B82F6)
private val Bg = Color(0xFFF8F9FB)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { HurryNativeApp() }
    }
}

private enum class Page { HOME, MESSAGE, ME, ROOM, LEADERBOARD, INVITE, SETTINGS }

@Composable
private fun HurryNativeApp() {
    var page by remember { mutableStateOf(Page.HOME) }

    MaterialTheme {
        Surface(Modifier.fillMaxSize(), color = Bg) {
            when (page) {
                Page.HOME -> MainHome(onOpen = { page = it })
                Page.MESSAGE -> MainMessage()
                Page.ME -> MainMe(onOpen = { page = it })
                Page.ROOM -> NativeRoom(onBack = { page = Page.HOME })
                Page.LEADERBOARD -> NativeDetail("Leaderboard", 30, Page.HOME) { page = it }
                Page.INVITE -> NativeDetail("Invite Friends", 26, Page.HOME) { page = it }
                Page.SETTINGS -> NativeDetail("Setting", 20, Page.ME) { page = it }
            }
        }
    }
}

@Composable
private fun BottomBar(selected: Page, onSelect: (Page) -> Unit) {
    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 0.dp,
        modifier = Modifier.height(65.dp)
    ) {
        listOf(Page.HOME to "Home", Page.MESSAGE to "Message", Page.ME to "Me").forEach { (p, label) ->
            NavigationBarItem(
                selected = selected == p,
                onClick = { onSelect(p) },
                icon = {
                    when (p) {
                        Page.HOME -> NativeHomeIcon(selected == p)
                        Page.MESSAGE -> NativeMessageIcon(selected == p)
                        else -> NativeMeIcon(selected == p)
                    }
                },
                label = { Text(label, fontSize = 12.sp, fontWeight = if (selected == p) FontWeight.SemiBold else FontWeight.Normal) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = Color.Unspecified,
                    unselectedIconColor = Color.Unspecified,
                    selectedTextColor = Color.Black,
                    unselectedTextColor = Color.Gray,
                    indicatorColor = Color.Transparent
                )
            )
        }
    }
}

@Composable private fun NativeHomeIcon(active: Boolean) {
    Text("◉", fontSize = 28.sp, color = if (active) Blue else Color(0xFF222222))
}
@Composable private fun NativeMessageIcon(active: Boolean) {
    Text("▢", fontSize = 27.sp, color = if (active) Blue else Color(0xFF222222))
}
@Composable private fun NativeMeIcon(active: Boolean) {
    Text("●", fontSize = 27.sp, color = if (active) Blue else Color(0xFF222222))
}

@Composable
private fun MainHome(onOpen: (Page) -> Unit) {
    var activeTab by remember { mutableStateOf("popular") }
    val rooms = listOf("Popular Voice Room", "Friends Lounge", "Music & Chat", "Late Night Talk")

    Scaffold(
        containerColor = Color.White,
        bottomBar = { BottomBar(Page.HOME) { onOpen(it) } }
    ) { pad ->
        LazyColumn(
            Modifier.fillMaxSize().padding(pad).background(Color.White),
            contentPadding = PaddingValues(bottom = 12.dp)
        ) {
            item {
                Column(
                    Modifier.fillMaxWidth().background(Color.White)
                        .padding(top = 35.dp, start = 12.dp, end = 12.dp)
                ) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            HomeTab("Mine", activeTab == "mine") { activeTab = "mine" }
                            HomeTab("Popular", activeTab == "popular") { activeTab = "popular" }
                        }
                        Spacer(Modifier.weight(1f))
                        Text("⌕", fontSize = 31.sp, color = Color(0xFF2D2D2D))
                        Spacer(Modifier.width(10.dp))
                        Text("⌂", fontSize = 29.sp, color = Color(0xFF2D2D2D))
                    }

                    if (activeTab == "popular") {
                        Spacer(Modifier.height(7.dp))
                        Box(
                            Modifier.fillMaxWidth().height(110.dp)
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFFEAF2FF)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("Hurry", fontSize = 30.sp, fontWeight = FontWeight.Bold, color = Blue)
                        }
                        Row(
                            Modifier.fillMaxWidth().padding(top = 6.dp),
                            horizontalArrangement = Arrangement.Center
                        ) {
                            repeat(4) { i ->
                                Box(
                                    Modifier.padding(horizontal = 3.dp).size(if (i == 0) 8.dp else 6.dp)
                                        .clip(CircleShape)
                                        .background(if (i == 0) Color.White else Color.LightGray)
                                )
                            }
                        }
                    }
                }
            }

            items(rooms) { title ->
                Card(
                    Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 5.dp)
                        .clickable { onOpen(Page.ROOM) },
                    shape = RoundedCornerShape(9.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                ) {
                    Row(Modifier.fillMaxWidth().padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            Modifier.size(62.dp).clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFFE9F1FF)),
                            contentAlignment = Alignment.Center
                        ) { Text("🎙", fontSize = 28.sp) }
                        Spacer(Modifier.width(10.dp))
                        Column(Modifier.weight(1f)) {
                            Text(title, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                            Text("Voice room · Live", fontSize = 12.sp, color = Color.Gray)
                            Spacer(Modifier.height(5.dp))
                            Text("●  Online", fontSize = 11.sp, color = Color(0xFF22A447))
                        }
                        Text("›", fontSize = 25.sp, color = Color.Gray)
                    }
                }
            }
        }
    }
}

@Composable
private fun HomeTab(text: String, active: Boolean, onClick: () -> Unit) {
    Text(
        text,
        Modifier.clickable { onClick() }.padding(bottom = 7.dp),
        fontSize = 22.sp,
        fontWeight = FontWeight.Bold,
        color = if (active) Color(0xFF1E1E1E) else Color(0xFF6E6E6E)
    )
}

@Composable
private fun MainMessage() {
    Scaffold(containerColor = Color.White, bottomBar = { BottomBar(Page.MESSAGE) {} }) { pad ->
        Column(
            Modifier.fillMaxSize().padding(pad).padding(top = 16.dp, start = 12.dp, end = 12.dp)
        ) {
            Text("Message", fontSize = 28.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(14.dp))
            Text("No conversations yet", color = Color.Gray, fontSize = 14.sp)
        }
    }
}

@Composable
private fun MainMe(onOpen: (Page) -> Unit) {
    val rows = listOf("Invite Friends" to Page.INVITE, "Family" to Page.SETTINGS, "Level" to Page.SETTINGS,
        "Medals" to Page.SETTINGS, "Store" to Page.SETTINGS, "Wallet" to Page.SETTINGS,
        "SVIP" to Page.SETTINGS, "Setting" to Page.SETTINGS, "Hurry Support" to Page.SETTINGS,
        "Reports" to Page.SETTINGS, "Seller" to Page.SETTINGS)

    Scaffold(containerColor = Bg, bottomBar = { BottomBar(Page.ME) { onOpen(it) } }) { pad ->
        LazyColumn(Modifier.fillMaxSize().padding(pad)) {
            item {
                Column(
                    Modifier.fillMaxWidth().background(Color.White)
                        .padding(top = 38.dp, start = 14.dp, end = 14.dp, bottom = 18.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(76.dp).clip(CircleShape).background(Color(0xFF64748B)), contentAlignment = Alignment.Center) {
                            Text("H", color = Color.White, fontSize = 34.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.width(13.dp))
                        Column {
                            Text("Hurry User", fontSize = 23.sp, fontWeight = FontWeight.Bold)
                            Text("ID: 000000", fontSize = 12.sp, color = Color.Gray)
                        }
                        Spacer(Modifier.weight(1f))
                        Text("›", fontSize = 30.sp, color = Color.Gray)
                    }
                    Spacer(Modifier.height(17.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                        listOf("0\nFriends", "1\nFollowers", "0\nFollowing", "1\nVisitors").forEach {
                            Text(it, textAlign = TextAlign.Center, fontSize = 12.sp)
                        }
                    }
                }
            }
            item {
                Row(Modifier.padding(10.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("🪙 0", "💎 0").forEach {
                        Surface(Modifier.weight(1f), shape = RoundedCornerShape(9.dp), color = Color.White) {
                            Text(it, Modifier.padding(vertical = 15.dp), textAlign = TextAlign.Center, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
            items(rows) { (label, target) ->
                Row(
                    Modifier.fillMaxWidth().background(Color.White).clickable { onOpen(target) }
                        .padding(horizontal = 16.dp, vertical = 15.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("●", fontSize = 10.sp, color = Blue)
                    Spacer(Modifier.width(14.dp))
                    Text(label, Modifier.weight(1f), fontWeight = FontWeight.SemiBold)
                    Text("›", fontSize = 22.sp, color = Color.Gray)
                }
                HorizontalDivider(color = Color(0xFFF1F1F1))
            }
        }
    }
}

@Composable
private fun NativeRoom(onBack: () -> Unit) {
    Column(Modifier.fillMaxSize().background(Color(0xFFF8F9FB)).padding(top = 28.dp)) {
        Row(Modifier.fillMaxWidth().padding(horizontal = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("‹", Modifier.clickable { onBack() }, fontSize = 34.sp)
            Spacer(Modifier.width(8.dp))
            Text("Room", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(20.dp))
        Box(Modifier.fillMaxWidth().height(240.dp).padding(12.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFF20232A)),
            contentAlignment = Alignment.Center) {
            Text("Voice Room", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun NativeDetail(title: String, top: Int, back: Page, onBack: (Page) -> Unit) {
    Column(Modifier.fillMaxSize().background(Bg).padding(top = top.dp, start = 16.dp, end = 16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("‹", Modifier.clickable { onBack(back) }, fontSize = 34.sp)
            Spacer(Modifier.width(8.dp))
            Text(title, fontSize = 24.sp, fontWeight = FontWeight.Bold)
        }
    }
}
