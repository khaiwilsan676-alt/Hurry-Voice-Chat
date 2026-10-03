package com.hurry.voicechat

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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

private enum class Tab(val label: String, val icon: String) {
    HOME("Home", "⌂"),
    MESSAGE("Message", "✉"),
    ME("Me", "●")
}

@Composable
fun HurryNativeApp() {
    var tab by remember { mutableStateOf(Tab.HOME) }
    var screen by remember { mutableStateOf("Home") }

    val open: (String) -> Unit = { screen = it }

    MaterialTheme {
        Scaffold(
            bottomBar = {
                if (screen == "Home" || screen == "Message" || screen == "Me") {
                    NavigationBar {
                        Tab.entries.forEach { item ->
                            NavigationBarItem(
                                selected = tab == item,
                                onClick = {
                                    tab = item
                                    screen = item.label
                                },
                                icon = { Text(item.icon, fontSize = 20.sp) },
                                label = { Text(item.label) }
                            )
                        }
                    }
                }
            }
        ) { padding ->
            Box(Modifier.fillMaxSize().padding(padding)) {
                when (screen) {
                    "Home" -> HomeScreen(open)
                    "Message" -> MessageScreen()
                    "Me" -> MeScreen(open)
                    else -> DetailScreen(screen) { screen = when (screen) {
                        "Room", "Room Settings" -> "Home"
                        else -> "Me"
                    } }
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
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 34.dp, start = 16.dp, end = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text("Hurry", fontSize = 30.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Text("Voice chat", fontSize = 15.sp)
            Spacer(Modifier.height(16.dp))
            Text("Popular    Mine    Following    Recent", fontSize = 15.sp)
        }
        items(rooms) { (title, subtitle) ->
            Card(Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp)) {
                    Text(title, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.height(6.dp))
                    Text(subtitle, fontSize = 14.sp)
                    Spacer(Modifier.height(12.dp))
                    Button(
                        onClick = { open("Room") },
                        modifier = Modifier.fillMaxWidth()
                    ) { Text("Enter Room") }
                }
            }
        }
        item {
            OutlinedButton(
                onClick = { open("Leaderboard") },
                modifier = Modifier.fillMaxWidth()
            ) { Text("Leaderboard") }
            Spacer(Modifier.height(4.dp))
            OutlinedButton(
                onClick = { open("Invite Friends") },
                modifier = Modifier.fillMaxWidth()
            ) { Text("Invite Friends") }
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun MessageScreen() {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 16.dp, start = 16.dp, end = 16.dp)
    ) {
        item {
            Text("Message", fontSize = 28.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(18.dp))
        }
        items(listOf("No conversations yet")) { text ->
            Card(Modifier.fillMaxWidth()) {
                Text(text, modifier = Modifier.padding(18.dp))
            }
        }
    }
}

@Composable
private fun MeScreen(open: (String) -> Unit) {
    val menu = listOf(
        "Wallet", "Store", "Level", "Family", "SVIP",
        "Medals", "Setting", "Hurry Support", "Reports", "Seller"
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(top = 38.dp, start = 16.dp, end = 16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Text("Me", fontSize = 28.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(12.dp))
        }
        items(menu) { item ->
            OutlinedButton(
                onClick = { open(item) },
                modifier = Modifier.fillMaxWidth()
            ) { Text(item) }
        }
        item { Spacer(Modifier.height(16.dp)) }
    }
}

@Composable
private fun DetailScreen(title: String, back: () -> Unit) {
    val body = when (title) {
        "Room" -> "Native voice room foundation"
        "Room Settings" -> "Mic mode and background theme"
        "Leaderboard" -> "Leaderboard"
        "Invite Friends" -> "Invite friends"
        "Level" -> "Level and progress"
        "Family" -> "Family"
        "SVIP" -> "SVIP"
        "Setting" -> "Settings"
        "Store" -> "Store"
        "Wallet" -> "Wallet"
        "Chat Screen" -> "Chat"
        "Hurry Support" -> "Support"
        "Reports" -> "Report form"
        "Medals" -> "Medals"
        "Seller" -> "Seller Center"
        else -> ""
    }

    Column(
        Modifier
            .fillMaxSize()
            .padding(
                top = when (title) {
                    "Room" -> 28.dp
                    "Leaderboard" -> 30.dp
                    "Invite Friends" -> 26.dp
                    "Level" -> 29.dp
                    "Family" -> 20.dp
                    "SVIP" -> 15.dp
                    "Setting", "Store" -> 20.dp
                    "Chat Screen" -> 27.dp
                    "Hurry Support" -> 30.dp
                    "Reports", "Medals", "Seller" -> 24.dp
                    else -> 24.dp
                },
                start = 16.dp,
                end = 16.dp
            ),
        horizontalAlignment = Alignment.Start
    ) {
        Text(title, fontSize = 26.sp, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        Text(body, fontSize = 16.sp)
        Spacer(Modifier.height(24.dp))
        if (title == "Room") {
            Button(onClick = { }) { Text("Join") }
            Spacer(Modifier.height(8.dp))
            OutlinedButton(onClick = { }) { Text("Room Settings") }
        }
        Spacer(Modifier.height(24.dp))
        TextButton(onClick = back) { Text("Back") }
    }
}
