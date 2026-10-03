package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage

@Composable
fun MineNativePage(onBack: () -> Unit) {
    var recent by remember { mutableStateOf(false) }
    val card = Modifier.fillMaxWidth().height(120.dp).pointerInput(Unit) { detectTapGestures(onTap = {}) }
    LazyColumn(
        Modifier.fillMaxSize().background(Color.White),
        contentPadding = PaddingValues(top = 35.dp, start = 12.dp, end = 12.dp, bottom = 80.dp)
    ) {
        item {
            Box(card.clip(RoundedCornerShape(6.dp)).background(
                Brush.linearGradient(listOf(Color(0xFF667EEA), Color(0xFF764BA2)))
            )) {
                Row(Modifier.fillMaxSize().padding(24.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(56.dp).background(Color.White.copy(alpha=.2f), RoundedCornerShape(50)), contentAlignment=Alignment.Center) {
                        Text("+", color=Color.White, fontSize=32.sp)
                    }
                    Spacer(Modifier.width(16.dp))
                    Column {
                        Text("Embark Your Hurry Journey!", color=Color.White, fontSize=20.sp)
                        Text("Tap to create your room", color=Color.White.copy(alpha=.8f), fontSize=14.sp)
                    }
                }
            }
            Row(Modifier.padding(top=12.dp).pointerInput(Unit){detectTapGestures(onTap={})}, horizontalArrangement=Arrangement.spacedBy(16.dp)) {
                Text("Following", fontSize=14.sp, color=if(!recent) Color(0xFF111827) else Color(0xFF9CA3AF))
                Text("Recent", fontSize=14.sp, color=if(recent) Color(0xFF111827) else Color(0xFF9CA3AF),
                    modifier=Modifier.pointerInput(Unit){detectTapGestures(onTap={recent=true})})
            }
        }
        item {
            Column(Modifier.fillMaxWidth().padding(top=40.dp), horizontalAlignment=Alignment.CenterHorizontally) {
                AsyncImage("https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/file_0000000047308211a02722299d1fda2e.png", null, Modifier.size(160.dp))
                Text("No data", color=Color(0xFF9CA3AF), fontSize=14.sp)
            }
        }
    }
}
