package com.hawa.app.nativeapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.core.view.WindowCompat
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController

class NativeMainActivity : ComponentActivity() {
    private lateinit var nativeSocket: NativeSocket
    private lateinit var audioManager: NativeAudioManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = android.graphics.Color.TRANSPARENT
        window.navigationBarColor = android.graphics.Color.TRANSPARENT

        NativePermissions.requestAudioAndCamera(this)
        nativeSocket = NativeSocket().also { it.connect() }
        audioManager = NativeAudioManager(this)

        setContent {
            NativeHurryTheme {
                val navController = rememberNavController()
                Surface(modifier = Modifier.fillMaxSize()) {
                    HurryNavHost(navController)
                }
            }
        }
    }

    override fun onDestroy() {
        audioManager.release()
        nativeSocket.disconnect()
        super.onDestroy()
    }
}
