package com.hurry.voicechat

import android.os.Bundle
import android.view.Window
import androidx.activity.ComponentActivity
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)

        // Stable edge-to-edge setup for Redmi/Android 14-16.
        // Avoid the display-cutout/window-attribute path that can terminate
        // the process on some OEM builds.
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = android.graphics.Color.TRANSPARENT
        window.navigationBarColor = android.graphics.Color.TRANSPARENT
        WindowInsetsControllerCompat(window, window.decorView).isAppearanceLightStatusBars = true

        setContent { HurryNativeRoot() }
    }
}

@Composable
private fun HurryNativeRoot() {
    var tab by remember { mutableStateOf(HurryTab.HOME) }
    var openedRoom by remember { mutableStateOf<HurryRoom?>(null) }
    var openedChat by remember { mutableStateOf<Triple<String, String, String>?>(null) }

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
                            HurryTab.HOME -> HomeScreen(onRoom = { openedRoom = it })
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
