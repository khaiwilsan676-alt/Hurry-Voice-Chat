package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun MessageScreen() {
    Column(Modifier.fillMaxSize().background(Color.White).padding(top=16.dp, start=14.dp, end=14.dp)) {
        Text("Message", fontSize=25.sp, color=HurryText)
        Spacer(Modifier.height(20.dp))
        Text("Your conversations", fontSize=14.sp, color=HurryMuted)
    }
}
