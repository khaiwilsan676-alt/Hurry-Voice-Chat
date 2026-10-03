package com.hurry.voicechat

import android.os.Bundle
import android.view.WindowManager
import androidx.core.view.WindowCompat
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.attributes = window.attributes.apply { layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS }
        enableEdgeToEdge()
        WindowCompat.getInsetsController(window, window.decorView).isAppearanceLightStatusBars = true
        window.isNavigationBarContrastEnforced = false
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
                            HurryTab.MESSAGE -> MessageScreen { uid, name, image -> openedChat = Triple(uid, name, image) }
                            HurryTab.ME -> MeScreen()
                        }
                    }
                    HurryBottomNav(tab, onTab = { tab = it })
                }
            }
        }
    }
}
