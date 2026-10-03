package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage

private const val RAW_ROOM = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"

@Composable
fun RoomScreen(room:HurryRoom, onBack:()->Unit) {
    Column(Modifier.fillMaxSize().background(Color(0xFF10131A))) {
        Row(Modifier.fillMaxWidth().padding(top=28.dp,start=10.dp,end=10.dp),verticalAlignment=Alignment.CenterVertically) {
            Text("‹",fontSize=34.sp,color=Color.White)
            Spacer(Modifier.width(8.dp))
            AsyncImage(if(room.image.startsWith("http")) room.image else RAW_ROOM+room.image.trimStart('/'),null,
                Modifier.size(40.dp).clip(CircleShape),contentScale=ContentScale.Crop)
            Spacer(Modifier.width(9.dp))
            Column(Modifier.weight(1f)) {
                Text(room.name,fontSize=16.sp,color=Color.White)
                if(room.announcement.isNotBlank()) Text(room.announcement,fontSize=11.sp,color=Color.White.copy(alpha=.7f),maxLines=1)
            }
        }
        Spacer(Modifier.height(18.dp))
        // Native seat layout follows the actual Hurry room geometry: 15 positions.
        Column(Modifier.fillMaxWidth(),horizontalAlignment=Alignment.CenterHorizontally) {
            SeatRow(listOf(1,2,3,4,5),room)
            Spacer(Modifier.height(18.dp))
            SeatRow(listOf(6,7,8,9,10),room)
            Spacer(Modifier.height(18.dp))
            SeatRow(listOf(11,12,13,14,15),room)
        }
        Spacer(Modifier.weight(1f))
        Row(Modifier.fillMaxWidth().padding(12.dp),horizontalArrangement=Arrangement.SpaceEvenly) {
            listOf("Message","Gift","Mic","More").forEach { Text(it,color=Color.White,fontSize=14.sp) }
        }
    }
}
@Composable private fun SeatRow(nums:List<Int>,room:HurryRoom) {
    Row(horizontalArrangement=Arrangement.spacedBy(9.dp)) {
        nums.forEach { n ->
            Column(horizontalAlignment=Alignment.CenterHorizontally,modifier=Modifier.width(58.dp)) {
                Box(Modifier.size(54.dp).clip(CircleShape).background(Color(0xFF2C9ED6)),contentAlignment=Alignment.Center) {
                    AsyncImage(if(n==1) (if(room.image.startsWith("http")) room.image else RAW_ROOM+room.image.trimStart('/')) else RAW_ROOM+"file_000000003e7482309b7f6e7f2a922160.png",
                        null,Modifier.size(48.dp).clip(CircleShape),contentScale=ContentScale.Crop)
                }
                Text(if(n==1) room.name else "$n",color=Color.White,fontSize=9.sp,maxLines=1)
            }
        }
    }
}
