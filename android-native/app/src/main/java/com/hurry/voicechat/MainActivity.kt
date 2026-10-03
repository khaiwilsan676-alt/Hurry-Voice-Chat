package com.hurry.voicechat

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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

private val HurryBlue = Color(0xFF3B82F6)
private val HurryText = Color(0xFF1D1D1F)
private val HurryGray = Color(0xFF6E6E6E)
private val HurryBg = Color(0xFFF8F9FB)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { HurryNativeApp() }
    }
}

private enum class MainPage { HOME, MESSAGE, ME }
private enum class SubPage {
    NONE, ROOM, LEADERBOARD, INVITE, LEVEL, FAMILY, SVIP, SETTING, STORE,
    WALLET, CHAT, SUPPORT, REPORTS, MEDALS, SELLER, PUBLIC_PROFILE
}

@Composable
private fun HurryNativeApp() {
    var mainPage by remember { mutableStateOf(MainPage.HOME) }
    var subPage by remember { mutableStateOf(SubPage.NONE) }

    val openMain: (MainPage) -> Unit = { mainPage = it; subPage = SubPage.NONE }
    val openSub: (SubPage) -> Unit = { subPage = it }

    MaterialTheme {
        Surface(Modifier.fillMaxSize(), color = Color.White) {
            if (subPage != SubPage.NONE) {
                NativeSubScreen(subPage) { subPage = SubPage.NONE }
            } else {
                when (mainPage) {
                    MainPage.HOME -> HomeScreen(openSub)
                    MainPage.MESSAGE -> MessageScreen()
                    MainPage.ME -> MeScreen(openSub)
                }
                NativeBottomBar(mainPage, openMain)
            }
        }
    }
}

@Composable
private fun NativeBottomBar(page: MainPage, onSelect: (MainPage) -> Unit) {
    Box(
        Modifier.fillMaxWidth().height(65.dp).background(Color.White)
            .border(1.dp, Color(0xFFF0F0F0)).padding(horizontal = 12.dp)
    ) {
        Row(Modifier.fillMaxSize(), horizontalArrangement = Arrangement.SpaceAround, verticalAlignment = Alignment.CenterVertically) {
            BottomItem(page == MainPage.HOME, "Home", onClick = { onSelect(MainPage.HOME) }) { HomeIcon(page == MainPage.HOME) }
            BottomItem(page == MainPage.MESSAGE, "Message", onClick = { onSelect(MainPage.MESSAGE) }) { MessageIcon(page == MainPage.MESSAGE) }
            BottomItem(page == MainPage.ME, "Me", onClick = { onSelect(MainPage.ME) }) { MeIcon(page == MainPage.ME) }
        }
    }
}

@Composable private fun BottomItem(active: Boolean, label: String, onClick: () -> Unit, icon: @Composable () -> Unit) {
    Column(Modifier.width(70.dp).clickable { onClick() }, horizontalAlignment = Alignment.CenterHorizontally) {
        icon()
        Text(label, fontSize = 12.sp, fontWeight = if (active) FontWeight.SemiBold else FontWeight.Normal,
            color = if (active) HurryText else Color.Gray)
    }
}
@Composable private fun HomeIcon(active: Boolean) {
    Text("◉", fontSize = 29.sp, color = if (active) HurryBlue else HurryText)
}
@Composable private fun MessageIcon(active: Boolean) {
    Text("▱", fontSize = 30.sp, color = if (active) HurryBlue else HurryText)
}
@Composable private fun MeIcon(active: Boolean) {
    Text("♙", fontSize = 30.sp, color = if (active) HurryBlue else HurryText)
}

@Composable
private fun HomeScreen(openSub: (SubPage) -> Unit) {
    var tab by remember { mutableStateOf("popular") }
    val rooms = listOf(
        "Popular Voice Room" to "Voice room · Live",
        "Friends Lounge" to "Voice room · Live",
        "Music & Chat" to "Voice room · Live",
        "Late Night Talk" to "Voice room · Live"
    )

    Column(Modifier.fillMaxSize().background(Color.White).padding(bottom = 65.dp)) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 14.dp)) {
            item {
                Column(Modifier.fillMaxWidth().background(
                    if (tab == "mine") Color(0xFFEFF6FF) else Color(0xFFEFF6FF)
                ).padding(top = 35.dp, start = 12.dp, end = 12.dp, bottom = 8.dp)) {
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                            NativeTab("Mine", tab == "mine") { tab = "mine" }
                            NativeTab("Popular", tab == "popular") { tab = "popular" }
                        }
                        Spacer(Modifier.weight(1f))
                        Text("⌕", fontSize = 30.sp, color = HurryText)
                        Spacer(Modifier.width(10.dp))
                        Text("⌂", fontSize = 30.sp, color = HurryText)
                    }
                    if (tab == "popular") {
                        Spacer(Modifier.height(4.dp))
                        Box(Modifier.fillMaxWidth().height(13.5f.dp).heightIn(min = 96.dp, max = 120.dp)
                            .clip(RoundedCornerShape(6.dp)).background(Color(0xFFDCEBFF)), contentAlignment = Alignment.Center) {
                            Text("Hurry", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = HurryBlue)
                        }
                        Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.Center) {
                            repeat(4) { Text(if (it == 0) "━" else "•", fontSize = if (it == 0) 12.sp else 10.sp, color = Color.White) }
                        }
                    }
                }
            }
            items(rooms.size) { index ->
                val room = rooms[index]
                Card(
                    Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 5.dp).clickable { openSub(SubPage.ROOM) },
                    shape = RoundedCornerShape(9.dp), colors = CardDefaults.cardColors(Color.White),
                    elevation = CardDefaults.cardElevation(1.dp)
                ) {
                    Row(Modifier.fillMaxWidth().padding(10.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(62.dp).clip(RoundedCornerShape(8.dp)).background(Color(0xFFE9F1FF)), contentAlignment = Alignment.Center) {
                            Text("♬", fontSize = 27.sp, color = HurryBlue)
                        }
                        Spacer(Modifier.width(10.dp))
                        Column(Modifier.weight(1f)) {
                            Text(room.first, fontSize = 16.sp, fontWeight = FontWeight.SemiBold, color = HurryText)
                            Text(room.second, fontSize = 12.sp, color = HurryGray)
                            Text("●  Online", fontSize = 11.sp, color = Color(0xFF22A447), modifier = Modifier.padding(top = 4.dp))
                        }
                        Text("›", fontSize = 26.sp, color = HurryGray)
                    }
                }
            }
        }
    }
}

@Composable private fun NativeTab(text: String, active: Boolean, onClick: () -> Unit) {
    Column(Modifier.clickable { onClick() }, horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text, fontSize = 22.sp, fontWeight = if (active) FontWeight.ExtraBold else FontWeight.Bold,
            color = if (active) HurryText else HurryGray)
        if (active) Text("⌣", fontSize = 16.sp, color = HurryText, modifier = Modifier.height(8.dp))
    }
}

@Composable
private fun MessageScreen() {
    Column(Modifier.fillMaxSize().background(Color.White).padding(top = 16.dp, start = 12.dp, end = 12.dp, bottom = 65.dp)) {
        Text("Message", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = HurryText)
        Spacer(Modifier.height(16.dp))
        Text("No conversations yet", fontSize = 14.sp, color = HurryGray)
    }
}

@Composable
private fun MeScreen(openSub: (SubPage) -> Unit) {
    val menu = listOf(
        "Invite Friends" to SubPage.INVITE, "Level" to SubPage.LEVEL, "Family" to SubPage.FAMILY,
        "SVIP" to SubPage.SVIP, "Medals" to SubPage.MEDALS, "Store" to SubPage.STORE,
        "Wallet" to SubPage.WALLET, "Setting" to SubPage.SETTING, "Hurry Support" to SubPage.SUPPORT,
        "Reports" to SubPage.REPORTS, "Seller" to SubPage.SELLER
    )
    LazyColumn(Modifier.fillMaxSize().background(HurryBg).padding(bottom = 65.dp)) {
        item {
            Column(Modifier.fillMaxWidth().background(Color.White).padding(top = 38.dp, start = 14.dp, end = 14.dp, bottom = 18.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(76.dp).clip(CircleShape).background(Color(0xFF64748B)), contentAlignment = Alignment.Center) {
                        Text("H", color = Color.White, fontSize = 34.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.width(13.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Hurry User", fontSize = 23.sp, fontWeight = FontWeight.Bold)
                        Text("ID: 000000", fontSize = 12.sp, color = HurryGray)
                    }
                    Text("›", fontSize = 30.sp, color = HurryGray)
                }
                Spacer(Modifier.height(16.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    listOf("0\nFriends", "1\nFollowers", "0\nFollowing", "1\nVisitors").forEach {
                        Text(it, textAlign = TextAlign.Center, fontSize = 12.sp, color = HurryText)
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
        items(menu.size) { i ->
            val item = menu[i]
            Row(Modifier.fillMaxWidth().background(Color.White).clickable { openSub(item.second) }.padding(horizontal = 16.dp, vertical = 15.dp),
                verticalAlignment = Alignment.CenterVertically) {
                Text("●", fontSize = 9.sp, color = HurryBlue)
                Spacer(Modifier.width(14.dp))
                Text(item.first, Modifier.weight(1f), fontWeight = FontWeight.SemiBold, color = HurryText)
                Text("›", fontSize = 22.sp, color = HurryGray)
            }
            HorizontalDivider(color = Color(0xFFF1F1F1))
        }
    }
}

@Composable
private fun NativeSubScreen(page: SubPage, onBack: () -> Unit) {
    val title = when(page) {
        SubPage.ROOM -> "Room"; SubPage.LEADERBOARD -> "Leaderboard"; SubPage.INVITE -> "Invite Friends"
        SubPage.LEVEL -> "Level"; SubPage.FAMILY -> "Family"; SubPage.SVIP -> "SVIP"
        SubPage.SETTING -> "Setting"; SubPage.STORE -> "Store"; SubPage.WALLET -> "Wallet"
        SubPage.CHAT -> "Chat"; SubPage.SUPPORT -> "Hurry Support"; SubPage.REPORTS -> "Reports"
        SubPage.MEDALS -> "Medals"; SubPage.SELLER -> "Seller"; SubPage.PUBLIC_PROFILE -> "Profile"
        SubPage.NONE -> ""
    }
    val top = when(page) {
        SubPage.ROOM -> 28; SubPage.LEADERBOARD -> 30; SubPage.INVITE -> 26; SubPage.LEVEL -> 29
        SubPage.FAMILY -> 20; SubPage.SVIP -> 15; SubPage.SETTING -> 20; SubPage.STORE -> 20
        SubPage.WALLET -> 20; SubPage.CHAT -> 27; SubPage.SUPPORT -> 30; SubPage.REPORTS -> 24
        SubPage.MEDALS -> 24; SubPage.SELLER -> 24; else -> 20
    }
    Column(Modifier.fillMaxSize().background(if (page == SubPage.ROOM) Color(0xFFF8F9FB) else Color.White).padding(top = top.dp)) {
        Row(Modifier.fillMaxWidth().height(48.dp).padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("‹", Modifier.clickable { onBack() }, fontSize = 36.sp, color = HurryText)
            Spacer(Modifier.width(8.dp))
            Text(title, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = HurryText)
        }
        if (page == SubPage.ROOM) {
            Box(Modifier.fillMaxWidth().height(250.dp).padding(12.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFF20232A)), contentAlignment = Alignment.Center) {
                Text("Voice Room", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Bold)
            }
        } else if (page == SubPage.WALLET || page == SubPage.STORE) {
            Text(if (page == SubPage.WALLET) "Wallet balance" else "Store", Modifier.padding(18.dp), fontSize = 18.sp, fontWeight = FontWeight.Bold)
        }
    }
}
