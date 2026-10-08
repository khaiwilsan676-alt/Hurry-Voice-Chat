package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun HelpFeedbackPage(onBack: () -> Unit = {}) {
    Column(Modifier.fillMaxSize().background(Color.White)) {
        Row(
            Modifier.fillMaxWidth().statusBarsPadding().height(58.dp).padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("‹", fontSize = 34.sp, color = Color(0xFF222222),
                modifier = Modifier.clickable { onBack() }.padding(horizontal = 10.dp))
            Text("Help & Feedback", fontSize = 20.sp, color = Color(0xFF111827))
        }
        Column(Modifier.fillMaxWidth().padding(20.dp)) {
            Text("Help & Feedback", fontSize = 22.sp, color = Color(0xFF111827))
            Spacer(Modifier.height(12.dp))
            Text("Find answers or send feedback to the Hurry Team.", fontSize = 14.sp, color = Color(0xFF6B7280))
        }
    }
}
