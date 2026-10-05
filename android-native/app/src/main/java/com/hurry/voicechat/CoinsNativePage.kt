package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage

private const val RAW_WALLET = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"

@Composable
fun CoinsNativePage(onBack: () -> Unit) {
    var coins by remember { mutableStateOf(0L) }

    LaunchedEffect(Unit) {
        // Keep the native wallet screen tied to the same local wallet data used by Hurry.
        // The native app currently stores its login/session state in SharedPreferences;
        // the balance is shown as 0 until the native wallet backend is connected.
        coins = 0L
    }

    Column(Modifier.fillMaxSize().background(Color.White)) {
        Row(
            Modifier.fillMaxWidth().statusBarsPadding().height(56.dp).padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("‹", fontSize = 36.sp, color = Color(0xFF222222))
            Spacer(Modifier.width(12.dp))
            Text("Coins", fontSize = 20.sp, fontWeight = FontWeight.Normal, color = Color(0xFF111827))
        }

        Column(Modifier.fillMaxWidth().padding(horizontal = 12.dp)) {
            AsyncImage(
                model = RAW_WALLET + "file_00000000f3d88211964f0057da4bc797.png",
                contentDescription = "Coins",
                modifier = Modifier.fillMaxWidth().height(120.dp).clip(RoundedCornerShape(8.dp)),
                contentScale = ContentScale.Crop
            )
            Spacer(Modifier.height(14.dp))
            Text("Coins", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF111827))
            Spacer(Modifier.height(6.dp))
            Text("%,d".format(coins), fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color(0xFF111827))
        }
    }
}
