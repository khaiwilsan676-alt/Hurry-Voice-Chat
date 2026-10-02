package com.hawa.app.nativeapp

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.compose.runtime.getValue

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

private val tabs = listOf(
    Tab(Routes.HOME, "Home"),
    Tab(Routes.ROOM, "Room"),
    Tab(Routes.MESSAGE, "Message"),
    Tab(Routes.ME, "Me")
)

@Composable
fun HurryNavHost(navController: NavHostController) {
    val backStack by navController.currentBackStackEntryAsState()
    val current = backStack?.destination?.route

    Scaffold(
        bottomBar = {
            NavigationBar {
                tabs.forEach { tab ->
                    NavigationBarItem(
                        selected = current == tab.route,
                        onClick = { navController.navigate(tab.route) { launchSingleTop = true } },
                        icon = { Text("•") },
                        label = { Text(tab.label) }
                    )
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.HOME,
            modifier = Modifier.padding(padding)
        ) {
            composable(Routes.HOME) { NativeScreen("Hurry Home") }
            composable(Routes.ROOM) { NativeScreen("Live Rooms") }
            composable(Routes.MESSAGE) { NativeScreen("Messages") }
            composable(Routes.ME) { NativeScreen("My Profile") }
            composable(Routes.WALLET) { NativeScreen("Wallet") }
            composable(Routes.STORE) { NativeScreen("Store") }
            composable(Routes.FAMILY) { NativeScreen("Family") }
            composable(Routes.SVIP) { NativeScreen("SVIP") }
            composable(Routes.SETTINGS) { NativeScreen("Settings") }
            composable(Routes.LEVEL) { NativeScreen("Level") }
            composable(Routes.LEADERBOARD) { NativeScreen("Leaderboard") }
            composable(Routes.INVITE) { NativeScreen("Invite Friends") }
            composable(Routes.REPORTS) { NativeScreen("Reports") }
            composable(Routes.MEDALS) { NativeScreen("Medals") }
            composable(Routes.SELLER) { NativeScreen("Seller") }
        }
    }
}

@Composable
private fun NativeScreen(title: String) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(title)
    }
}
