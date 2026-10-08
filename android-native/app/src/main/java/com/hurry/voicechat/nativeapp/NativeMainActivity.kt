package com.hurry.voicechat.nativeapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.*
import androidx.compose.material3.MaterialTheme
import com.hurry.voicechat.HomePage
import com.hurry.voicechat.MessagePage
import com.hurry.voicechat.MePage

class NativeMainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        setContent {
            MaterialTheme {
                var page by remember { mutableStateOf("home") }
                when (page) {
                    "message" -> MessagePage()
                    "me" -> MePage(onBack = { page = "home" })
                    else -> HomePage(
                        onOpenMessage = { page = "message" },
                        onOpenMe = { page = "me" }
                    )
                }
            }
        }
    }
}
