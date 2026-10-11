package com.hurry.voicechat
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun Leaderboard(onBack:()->Unit={}, initialTab:String="honour") {
    var tab by remember { mutableStateOf(initialTab) }; var period by remember { mutableStateOf("daily") }
    val tabs=listOf("honour" to "Honour","charm" to "Charm","room" to "Room")
    val periods=listOf("daily" to "Daily","weekly" to "Weekly","monthly" to "Monthly")
    val raw = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"
    val topImage = when (tab) {
        "charm" -> "file_0000000086f481fa8653fc12d2577596.png"
        "room" -> "file_00000000619c822f8a1577f69e039527.png"
        else -> "file_00000000b83c81fa93d3e53e046c1b81.png"
    }
    val screenHeight = LocalConfiguration.current.screenHeightDp.dp
    Box(Modifier.fillMaxSize().background(Color(0xFF1A0204))) {
        Box(Modifier.fillMaxWidth().height(screenHeight * 0.60f).align(Alignment.TopCenter)) {
            AsyncImage(
                model = raw + topImage,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
            Box(
                Modifier.fillMaxSize().background(
                    Brush.verticalGradient(
                        0f to Color.Transparent,
                        0.45f to Color(0x331A0204),
                        1f to Color(0xFF1A0204)
                    )
                )
            )
        }
        Column(Modifier.fillMaxSize().statusBarsPadding()) {
            Row(Modifier.fillMaxWidth().height(36.dp).padding(horizontal = 8.dp),verticalAlignment=Alignment.CenterVertically) {
                AsyncImage(
                    model = raw + "file_0000000051d881f5af4f9cf84a56dcd3.png",
                    contentDescription = "Back",
                    modifier = Modifier.size(32.dp).clickable(onClick=onBack),
                    contentScale = ContentScale.Fit
                )
                Spacer(Modifier.weight(1f))
                Row(
                    Modifier.fillMaxWidth(0.72f).height(26.dp)
                        .border(1.dp, Color(0xFFD4AF37), RoundedCornerShape(24.dp))
                        .background(Color(0xCC110A07), RoundedCornerShape(24.dp))
                        .padding(2.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    tabs.forEach { (id,label) ->
                        Box(
                            Modifier.weight(1f).fillMaxHeight()
                                .clip(RoundedCornerShape(22.dp))
                                .background(
                                    if (tab == id) Brush.verticalGradient(
                                        listOf(Color(0xFFE7B865), Color(0xFFBA7627), Color(0xFF743410))
                                    ) else Brush.verticalGradient(listOf(Color.Transparent, Color.Transparent))
                                )
                                .clickable { tab = id },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(label, color=if(tab==id) Color.White else Color(0xFF8A857D),
                                fontSize=14.sp, fontWeight=androidx.compose.ui.text.font.FontWeight.SemiBold)
                        }
                    }
                }
                Spacer(Modifier.weight(1f))
                AsyncImage(
                    model = raw + "file_0000000073ec820b832b6dafb168dabe.png",
                    contentDescription = "Leaderboard rules",
                    modifier = Modifier.size(32.dp).clickable { /* ranking rules action */ },
                    contentScale = ContentScale.Fit
                )
            }
            Row(Modifier.fillMaxWidth().height(40.dp).padding(top=2.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.width(220.dp).fillMaxHeight()) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Row(Modifier.fillMaxSize(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        periods.forEach { (id,label)->
                            Box(Modifier.weight(1f).fillMaxHeight().clickable { period=id }, contentAlignment=Alignment.Center) {
                                Text(label,color=Color.White,fontSize=15.sp,fontWeight=androidx.compose.ui.text.font.FontWeight.Bold)
                            }
                        }
                    }
                    val activeIndex = periods.indexOfFirst { it.first == period }.coerceAtLeast(0)
                    Box(Modifier.fillMaxSize().padding(start = (activeIndex * (220f / 3f)).dp).width((220f / 3f).dp), contentAlignment=Alignment.TopCenter) {
                        Column(Modifier.fillMaxWidth().fillMaxHeight(), horizontalAlignment=Alignment.CenterHorizontally) {
                            Spacer(Modifier.height(2.dp))
                            Box(Modifier.fillMaxWidth().height(36.dp).background(Brush.verticalGradient(listOf(Color(0x99D4AF37), Color(0x40D4AF37), Color.Transparent)), RoundedCornerShape(6.dp)))
                        }
                    }
                }
            }
            LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(12.dp),verticalArrangement=Arrangement.spacedBy(8.dp)) {
                items(50) { i -> Row(Modifier.fillMaxWidth().background(Color(0xFF240A0D),RoundedCornerShape(10.dp)).padding(12.dp),verticalAlignment=Alignment.CenterVertically) {
                    Text("#"+(i+4),color=Color.White,modifier=Modifier.width(45.dp)); Box(Modifier.size(44.dp).background(Color(0xFF402126),RoundedCornerShape(22.dp))); Spacer(Modifier.width(10.dp)); Text("Hurry User "+(i+4),color=Color.White,modifier=Modifier.weight(1f)); Text(""+(50-i).coerceAtLeast(1),color=Color(0xFFFFD56A))
                }}
            }
        }
    }
}
