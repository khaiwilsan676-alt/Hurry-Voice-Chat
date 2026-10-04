package com.hurry.voicechat

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = true
            isAppearanceLightNavigationBars = true
        }
        setContent { HurryNativeRoot() }
    }
}

@Composable
private fun HurryNativeRoot() {
    var tab by remember { mutableStateOf(HurryTab.HOME) }
    var homeMine by remember { mutableStateOf(false) }
    var openedRoom by remember { mutableStateOf<HurryRoom?>(null) }
    var openedChat by remember { mutableStateOf<Triple<String, String, String>?>(null) }

    BackHandler(enabled = openedRoom != null || openedChat != null) {
        when {
            openedChat != null -> openedChat = null
            openedRoom != null -> openedRoom = null
        }
    }

    HurryTheme {
        Box(Modifier.fillMaxSize()) {
            if (openedRoom != null) {
                RoomScreen(openedRoom!!, onBack = { openedRoom = null })
            } else if (openedChat != null) {
                val chat = openedChat!!
                NativeChatScreen(chat.second, chat.third, onBack = { openedChat = null })
            } else {
                Column(Modifier.fillMaxSize()) {
                    Box(Modifier.weight(1f)) {
                        when (tab) {
                            HurryTab.HOME -> HomeScreen(
                                onRoom = { openedRoom = it },
                                onMine = { homeMine = true },
                                onPopular = { homeMine = false },
                                mineSelected = homeMine
                            )
                            HurryTab.MESSAGE -> MessageScreen { uid, name, image ->
                                openedChat = Triple(uid, name, image)
                            }
                            HurryTab.ME -> MeScreen()
                        }
                    }
                    HurryBottomNav(tab, onTab = { tab = it })
                }
            }
        }
    }
}
