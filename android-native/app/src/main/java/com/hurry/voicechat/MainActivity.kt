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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { HurryNativeApp() }
    }
}

private enum class Tab(val label: String) { HOME("Home"), MESSAGE("Message"), ME("Me") }

@Composable
fun HurryNativeApp() {
    var tab by remember { mutableStateOf(Tab.HOME) }
    var screen by remember { mutableStateOf("Home") }

    MaterialTheme {
        Scaffold(
            containerColor = Color(0xFFF8FAFC),
            bottomBar = {
                if (screen == "Home" || screen == "Message" || screen == "Me") {
                    NavigationBar(containerColor = Color.White) {
                        Tab.entries.forEach { item ->
                            NavigationBarItem(
                                selected = tab == item,
                                onClick = { tab = item; screen = item.label },
                                icon = { Text(if (item == Tab.HOME) "⌂" else if (item == Tab.MESSAGE) "✉" else "●", fontSize = 21.sp) },
                                label = { Text(item.label) }
                            )
                        }
                    }
                }
            }
        ) { padding ->
            Box(Modifier.fillMaxSize().padding(padding)) {
                when (screen) {
                    "Home" -> HomeScreen { screen = it }
                    "Message" -> MessageScreen()
                    "Me" -> MeScreen { screen = it }
                    else -> DetailScreen(screen) {
                        screen = if (screen == "Room" || screen == "Room Settings") "Home" else "Me"
                    }
                }
            }
        }
    }
}

@Composable
private fun HomeScreen(open: (String) -> Unit) {
    val rooms = listOf(
        "Popular Voice Room" to "Join a room and start talking",
        "Friends Lounge" to "Meet your friends",
        "Music & Chat" to "Talk, listen and have fun"
    )
    LazyColumn(
        modifier = Modifier.fillMaxSize().background(
            Brush.verticalGradient(listOf(Color(0xFF3B82F6), Color(0xFFEFF6FF), Color.White))
        ).padding(top = 34.dp, start = 14.dp, end = 14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text("Hurry", color = Color.White, fontSize = 30.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.weight(1f))
                Text("🔔", fontSize = 21.sp)
            }
            Spacer(Modifier.height(18.dp))
            Surface(shape = RoundedCornerShape(14.dp), color = Color.White.copy(alpha = .96f)) {
                Row(Modifier.fillMaxWidth().padding(4.dp)) {
                    listOf("Popular", "Mine", "Following", "Recent").forEachIndexed { i, label ->
                        Box(Modifier.weight(1f).clip(RoundedCornerShape(11.dp)).background(if (i == 0) Color(0xFFE8F1FF) else Color.Transparent).padding(vertical = 10.dp), contentAlignment = Alignment.Center) {
                            Text(label, fontSize = 13.sp, fontWeight = if (i == 0) FontWeight.Bold else FontWeight.Normal)
                        }
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
        }
        items(rooms) { (title, subtitle) ->
            Card(
                Modifier.fillMaxWidth().clickable { open("Room") },
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White)
            ) {
                Column(Modifier.padding(14.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(52.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFFDCEBFF)), contentAlignment = Alignment.Center) {
                            Text("🎙", fontSize = 24.sp)
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(title, fontWeight = FontWeight.SemiBold, fontSize = 16.sp)
                            Text(subtitle, color = Color.Gray, fontSize = 13.sp)
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                    Button(onClick = { open("Room") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(10.dp)) {
                        Text("Enter Room")
                    }
                }
            }
        }
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(onClick = { open("Leaderboard") }, modifier = Modifier.weight(1f)) { Text("Leaderboard") }
                OutlinedButton(onClick = { open("Invite Friends") }, modifier = Modifier.weight(1f)) { Text("Invite Friends") }
            }
            Spacer(Modifier.height(20.dp))
        }
    }
}

@Composable
private fun MessageScreen() {
    LazyColumn(Modifier.fillMaxSize().padding(top = 16.dp, start = 14.dp, end = 14.dp)) {
        item {
            Text("Message", fontSize = 28.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(12.dp))
            Surface(Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), color = Color.White) {
                Text("No conversations yet", Modifier.padding(18.dp), color = Color.Gray)
            }
        }
    }
}

@Composable
private fun MeScreen(open: (String) -> Unit) {
    val menu = listOf(
        "Invite Friends", "Family", "Level", "Medals", "Store", "Bag",
        "Wallet", "SVIP", "Setting", "Hurry Support", "Reports", "Seller"
    )
    LazyColumn(
        Modifier.fillMaxSize().background(Color(0xFFF8FAFC)).padding(bottom = 12.dp),
        verticalArrangement = Arrangement.spacedBy(0.dp)
    ) {
        item {
            Column(
                Modifier.fillMaxWidth().background(
                    Brush.verticalGradient(listOf(Color(0xFF3B82F6), Color(0xFFEFF6FF), Color(0xFFF8FAFC)))
                ).padding(top = 8.dp, start = 14.dp, end = 14.dp, bottom = 18.dp)
            ) {
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(76.dp).clip(CircleShape).background(Color(0xFF64748B)), contentAlignment = Alignment.Center) {
                        Text("H", color = Color.White, fontSize = 34.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.width(14.dp))
                    Column {
                        Text("Hurry User", fontSize = 23.sp, fontWeight = FontWeight.Bold)
                        Text("ID: 000000", color = Color.DarkGray, fontSize = 12.sp)
                    }
                    Spacer(Modifier.weight(1f))
                    Text("›", fontSize = 30.sp, color = Color.DarkGray)
                }
                Spacer(Modifier.height(18.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                    listOf("0\nFriends", "1\nFollowers", "0\nFollowing", "1\nVisitors").forEach {
                        Text(it, textAlign = androidx.compose.ui.text.style.TextAlign.Center, fontSize = 12.sp)
                    }
                }
            }
        }
        item {
            Row(Modifier.padding(horizontal = 12.dp, vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                listOf("🪙 0", "💎 0").forEach { value ->
                    Surface(Modifier.weight(1f), shape = RoundedCornerShape(9.dp), color = Color.White) {
                        Text(value, Modifier.padding(vertical = 15.dp), textAlign = androidx.compose.ui.text.style.TextAlign.Center, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
        items(menu) { item ->
            Row(
                Modifier.fillMaxWidth().background(Color.White).clickable { open(item) }.padding(horizontal = 16.dp, vertical = 15.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("●", fontSize = 12.sp, color = Color(0xFF3B82F6))
                Spacer(Modifier.width(14.dp))
                Text(item, Modifier.weight(1f), fontWeight = FontWeight.SemiBold)
                Text("›", color = Color.Gray, fontSize = 22.sp)
            }
            HorizontalDivider(color = Color(0xFFF1F5F9))
        }
    }
}

@Composable
private fun DetailScreen(title: String, back: () -> Unit) {
    val top = when (title) {
        "Room" -> 28.dp; "Leaderboard" -> 30.dp; "Invite Friends" -> 26.dp
        "Level" -> 29.dp; "Family" -> 20.dp; "SVIP" -> 15.dp
        "Setting", "Store", "Bag", "Wallet" -> 20.dp; "Chat Screen" -> 27.dp
        "Hurry Support" -> 30.dp; "Reports", "Medals", "Seller" -> 24.dp
        else -> 20.dp
    }
    Column(Modifier.fillMaxSize().padding(top = top, start = 16.dp, end = 16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("‹", fontSize = 34.sp, modifier = Modifier.clickable { back() })
            Spacer(Modifier.width(8.dp))
            Text(title, fontSize = 24.sp, fontWeight = FontWeight.Bold)
        }
        Spacer(Modifier.height(20.dp))
        Text(
            when (title) {
                "Reports" -> "Report form"
                "Room Settings" -> "Mic mode and background theme"
                "Wallet" -> "Coins and diamonds"
                "Store" -> "Store"
                else -> title
            },
            fontSize = 16.sp, color = Color.Gray
        )
    }
}
