package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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

private const val RAW_ME = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"

@Composable
fun MeScreen() {
    val items=listOf(
        "Invite Friends" to "IMG_20260915_225333.png",
        "Family" to "IMG_20260915_225349.png",
        "Level" to "IMG_20260915_225404.png",
        "Medals" to "IMG_20260915_225426.png",
        "Store" to "IMG_20260915_225447.png",
        "Bag" to "IMG_20260915_225506.png",
        "Seller Center" to "IMG_20260915_225536.png"
    )
    LazyColumn(Modifier.fillMaxSize().background(Color(0xFFF7F8FA)),contentPadding=PaddingValues(bottom=12.dp)) {
        item {
            Column(Modifier.fillMaxWidth().background(Color.White).padding(top=40.dp,start=14.dp,end=14.dp,bottom=18.dp)) {
                Row(verticalAlignment=Alignment.CenterVertically) {
                    AsyncImage(RAW_ME+"default-avatar.png",null,Modifier.size(76.dp).clip(CircleShape),contentScale=ContentScale.Crop)
                    Spacer(Modifier.width(13.dp))
                    Column {
                        Text("Hurry User",fontSize=22.sp,color=HurryText)
                        Text("ID: —",fontSize=12.sp,color=HurryMuted)
                    }
                }
                Spacer(Modifier.height(18.dp))
                Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceEvenly) {
                    listOf("Following","Followers","Friends","Visitors").forEach {
                        Column(horizontalAlignment=Alignment.CenterHorizontally) {
                            Text("0",fontSize=15.sp,color=HurryText)
                            Text(it,fontSize=11.sp,color=HurryMuted)
                        }
                    }
                }
            }
        }
        items(items) { (label,asset) ->
            Row(Modifier.fillMaxWidth().background(Color.White).padding(horizontal=16.dp,vertical=13.dp),verticalAlignment=Alignment.CenterVertically) {
                AsyncImage(RAW_ME+asset,null,Modifier.size(30.dp),contentScale=ContentScale.Contain)
                Spacer(Modifier.width(14.dp))
                Text(label,Modifier.weight(1f),fontSize=15.sp,color=HurryText)
                Text("›",fontSize=23.sp,color=Color(0xFFAAAAAA))
            }
        }
    }
}
