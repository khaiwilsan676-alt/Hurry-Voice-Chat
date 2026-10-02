package com.hawa.app.nativeapp

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState

private object Routes {
    const val HOME = "home"
    const val ROOM = "room"
    const val MESSAGE = "message"
    const val ME = "me"
    const val WALLET = "wallet"
    const val STORE = "store"
    const val FAMILY = "family"
    const val SVIP = "svip"
    const val SETTINGS = "settings"
    const val LEVEL = "level"
    const val LEADERBOARD = "leaderboard"
    const val INVITE = "invite"
    const val REPORTS = "reports"
    const val MEDALS = "medals"
    const val SELLER = "seller"
}

private data class Tab(val route: String, val label: String)
private val tabs = listOf(Tab(Routes.HOME, "Home"), Tab(Routes.ROOM, "Room"), Tab(Routes.MESSAGE, "Message"), Tab(Routes.ME, "Me"))

@Composable
fun HurryNavHost(navController: NavHostController) {
    val backStack by navController.currentBackStackEntryAsState()
    val current = backStack?.destination?.route

    Scaffold(
        bottomBar = {
            if (tabs.any { it.route == current }) {
                NavigationBar {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = current == tab.route,
                            onClick = { navController.navigate(tab.route) { launchSingleTop = true; restoreState = true } },
                            icon = { Text("•") },
                            label = { Text(tab.label) }
                        )
                    }
                }
            }
        }
    ) { padding ->
        NavHost(navController, Routes.HOME, Modifier.padding(padding)) {
            composable(Routes.HOME) { HomeNative(navController) }
            composable(Routes.ROOM) { RoomNative() }
            composable(Routes.MESSAGE) { SimpleNative("Messages", "Chats and system messages") }
            composable(Routes.ME) { MeNative(navController) }
            composable(Routes.WALLET) { SimpleNative("Wallet", "Coins • Diamonds • Transactions") }
            composable(Routes.STORE) { SimpleNative("Store", "Gifts • Frames • Vehicles") }
            composable(Routes.FAMILY) { SimpleNative("Family", "Family and members") }
            composable(Routes.SVIP) { SimpleNative("SVIP", "SVIP benefits") }
            composable(Routes.SETTINGS) { SimpleNative("Settings", "Account • Privacy • Notifications") }
            composable(Routes.LEVEL) { SimpleNative("Level", "Level and progress") }
            composable(Routes.LEADERBOARD) { SimpleNative("Leaderboard", "Rankings") }
            composable(Routes.INVITE) { SimpleNative("Invite Friends", "Invite and rewards") }
            composable(Routes.REPORTS) { SimpleNative("Reports", "Report form") }
            composable(Routes.MEDALS) { SimpleNative("Medals", "Your medals") }
            composable(Routes.SELLER) { SimpleNative("Seller", "Seller tools") }
        }
    }
}

@Composable
private fun HomeNative(nav: NavHostController) {
    Column(
        Modifier.fillMaxSize().background(Color(0xFFF7F8FC)).padding(horizontal = 16.dp, vertical = 34.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("Hurry", color = Color(0xFF11131A))
        Text("Voice Chat", color = Color(0xFF4A6CFF))
        Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFF4A6CFF))) {
            Column(Modifier.padding(20.dp)) {
                Text("Live voice rooms", color = Color.White)
                Spacer(Modifier.height(8.dp))
                Text("Join a room and start talking", color = Color.White)
                Spacer(Modifier.height(14.dp))
                Button(onClick = { navController.navigate(Routes.ROOM) }) { Text("Explore Rooms") }
            }
        }
        Row(Modifier.fillMaxWidth()) {
            QuickButton("Wallet") { navController.navigate(Routes.WALLET) }
            Spacer(Modifier.width(10.dp))
            QuickButton("Store") { navController.navigate(Routes.STORE) }
        }
        Row(Modifier.fillMaxWidth()) {
            QuickButton("Leaderboard") { navController.navigate(Routes.LEADERBOARD) }
            Spacer(Modifier.width(10.dp))
            QuickButton("Invite") { navController.navigate(Routes.INVITE) }
        }
    }
}

@Composable
private fun RoomNative() {
    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 28.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("Live Rooms")
        Text("Popular rooms")
        repeat(4) { index ->
            Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.width(8.dp).height(42.dp).background(Color(0xFF4A6CFF), RoundedCornerShape(4.dp)))
                    Spacer(Modifier.width(12.dp))
                    Column { Text("Hurry Room ${index + 1}"); Text("Live • Voice chat") }
                }
            }
        }
    }
}

@Composable
private fun MeNative(navController: NavHostController) {
    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 38.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text("My Profile")
        Text("Hurry user")
        Button(onClick = { navController.navigate(Routes.WALLET) }) { Text("Wallet") }
        Button(onClick = { navController.navigate(Routes.FAMILY) }) { Text("Family") }
        Button(onClick = { navController.navigate(Routes.SETTINGS) }) { Text("Settings") }
    }
}

@Composable
private fun QuickButton(label: String, onClick: () -> Unit) {
    Button(onClick = onClick, modifier = Modifier.weight(1f)) { Text(label) }
}

@Composable
private fun SimpleNative(title: String, subtitle: String) {
    Column(Modifier.fillMaxSize().padding(horizontal = 16.dp, vertical = 24.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(title)
        Text(subtitle)
    }
}
