package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import kotlinx.coroutines.launch

private const val RAW = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"
private const val HONOUR_BG = RAW + "IMG_20260912_144404.png"
private const val CHARM_BG = RAW + "IMG_20260912_144324.png"
private const val ROOM_BG = RAW + "IMG_20260912_144347.png"
private const val CARD_FRAME = RAW + "file_00000000048882118276c7215012963f.png"

@Composable
fun HomeScreen(onRoom: (HurryRoom) -> Unit) {
    var mine by remember { mutableStateOf(false) }
    var rooms by remember { mutableStateOf<List<HurryRoom>?>(null) }
    LaunchedEffect(Unit) { rooms = HurryApi.rooms() }

    val banners = listOf(
        RAW + "IMG-20260830-WA0081.jpg",
        RAW + "IMG-20260818-WA0000.jpg",
        RAW + "IMG-20260818-WA0001.jpg"
    )
    val pager = rememberPagerState(pageCount = { banners.size })
    val scope = rememberCoroutineScope()

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(Color.White),
        contentPadding = PaddingValues(bottom = 12.dp)
    ) {
        item {
            Column(
                Modifier.fillMaxWidth().background(androidx.compose.ui.graphics.Brush.verticalGradient(listOf(Color(0xFF3B82F6), Color(0xFFEFF6FF), Color.White))).padding(top = 35.dp, start = 12.dp, end = 12.dp, bottom = 8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Text("Mine", fontSize=21.sp, fontWeight=if(mine) FontWeight.ExtraBold else FontWeight.Bold,
                            color=if(mine) HurryText else HurryMuted, modifier=Modifier.clickable { mine=true })
                        Text("Popular", fontSize=21.sp, fontWeight=if(!mine) FontWeight.ExtraBold else FontWeight.Bold,
                            color=if(!mine) HurryText else HurryMuted, modifier=Modifier.clickable { mine=false })
                    }
                    Spacer(Modifier.weight(1f))
                    HurrySearchIcon()
                    Spacer(Modifier.width(10.dp))
                    HurryHouseIcon()
                    Spacer(Modifier.width(2.dp))
                }
                Spacer(Modifier.height(9.dp))
                HorizontalPager(state=pager, modifier=Modifier.fillMaxWidth().height(154.dp)) { page ->
                    AsyncImage(
                        model=banners[page], contentDescription=null,
                        modifier=Modifier.fillMaxSize().clip(RoundedCornerShape(7.dp)),
                        contentScale=ContentScale.Crop
                    )
                }
                Row(Modifier.fillMaxWidth().padding(top=5.dp), horizontalArrangement=Arrangement.Center) {
                    repeat(banners.size) { i ->
                        Box(Modifier.padding(horizontal=2.dp).size(if(i==pager.currentPage) 7.dp else 5.dp)
                            .clip(RoundedCornerShape(50)).background(if(i==pager.currentPage) HurryBlue else Color.LightGray))
                    }
                }
            }
        }
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp).padding(top = 2.dp, bottom = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                HurryCategoryCard("Honour", HONOUR_BG, Modifier.weight(1f))
                HurryCategoryCard("Charm", CHARM_BG, Modifier.weight(1f))
                HurryCategoryCard("Room", ROOM_BG, Modifier.weight(1f))
            }
        }

        if (rooms == null) {
            item {
                Box(Modifier.fillMaxWidth().height(180.dp), contentAlignment=Alignment.Center) {
                    CircularProgressIndicator(color=HurryBlue, strokeWidth=2.dp)
                }
            }
        } else if (rooms!!.isEmpty()) {
            item {
                Text("No rooms available", Modifier.padding(20.dp), color=HurryMuted, fontSize=14.sp)
            }
        } else {
            items(rooms!!) { room ->
                RoomListCard(room, onRoom)
            }
        }
    }
}

@Composable
private fun RoomListCard(room:HurryRoom, onRoom:(HurryRoom)->Unit) {
    Row(
        Modifier.fillMaxWidth().clickable { onRoom(room) }.padding(horizontal=12.dp, vertical=7.dp),
        verticalAlignment=Alignment.CenterVertically
    ) {
        AsyncImage(
            model=if(room.image.startsWith("http")) room.image else RAW + room.image.trimStart('/'),
            contentDescription=null,
            modifier=Modifier.size(62.dp).clip(RoundedCornerShape(10.dp)),
            contentScale=ContentScale.Crop
        )
        Spacer(Modifier.width(11.dp))
        Column(Modifier.weight(1f)) {
            Text(room.name, fontSize=16.sp, fontWeight=FontWeight.SemiBold, color=HurryText, maxLines=1)
            if (room.announcement.isNotBlank())
                Text(room.announcement, fontSize=12.sp, color=HurryMuted, maxLines=1)
        }
        Text("›", fontSize=27.sp, color=Color(0xFFAAAAAA))
    }
}

@Composable
private fun HurryHouseIcon() {
    androidx.compose.foundation.Canvas(Modifier.size(32.dp)) {
        val c = Color(0xFF2D2D2D)
        val w = size.width
        val h = size.height
        val p = androidx.compose.ui.graphics.Path().apply {
            moveTo(w*.50f,h*.11f)
            cubicTo(w*.42f,h*.11f,w*.10f,h*.25f,w*.10f,h*.43f)
            lineTo(w*.10f,h*.68f)
            cubicTo(w*.10f,h*.86f,w*.23f,h*.94f,w*.39f,h*.94f)
            lineTo(w*.61f,h*.94f)
            cubicTo(w*.77f,h*.94f,w*.90f,h*.86f,w*.90f,h*.68f)
            lineTo(w*.90f,h*.43f)
            cubicTo(w*.90f,h*.25f,w*.58f,h*.11f,w*.50f,h*.11f)
            close()
        }
        drawPath(p,c,style=androidx.compose.ui.graphics.drawscope.Stroke(2.2.dp.toPx(),join=androidx.compose.ui.graphics.StrokeJoin.Round))
        drawRoundRect(c,topLeft=Offset(w*.28f,h*.45f),size=androidx.compose.ui.geometry.Size(w*.11f,h*.20f),cornerRadius=androidx.compose.ui.geometry.CornerRadius(2.dp.toPx()))
        drawRoundRect(c,topLeft=Offset(w*.445f,h*.37f),size=androidx.compose.ui.geometry.Size(w*.11f,h*.28f),cornerRadius=androidx.compose.ui.geometry.CornerRadius(2.dp.toPx()))
        drawRoundRect(c,topLeft=Offset(w*.61f,h*.43f),size=androidx.compose.ui.geometry.Size(w*.11f,h*.22f),cornerRadius=androidx.compose.ui.geometry.CornerRadius(2.dp.toPx()))
    }
}

@Composable
private fun HurryCategoryCard(label:String,bg:String,modifier:Modifier=Modifier) {
    androidx.compose.foundation.layout.Box(modifier.height(92.dp).clip(RoundedCornerShape(16.dp))) {
        AsyncImage(model=bg,contentDescription=label,modifier=Modifier.fillMaxSize(),contentScale=ContentScale.FillBounds)
        Text(text=label.uppercase(),modifier=Modifier.fillMaxWidth().padding(top=15.dp),textAlign=androidx.compose.ui.text.style.TextAlign.Center,fontSize=11.sp,fontWeight=FontWeight.Black,color=Color.White)
        androidx.compose.foundation.layout.Box(modifier=Modifier.align(Alignment.BottomCenter).fillMaxWidth(.85f).padding(bottom=8.dp).height(25.dp)) {
            AsyncImage(model=CARD_FRAME,contentDescription=null,modifier=Modifier.fillMaxSize(),contentScale=ContentScale.FillBounds)
            Row(Modifier.fillMaxSize(),horizontalArrangement=Arrangement.Center,verticalAlignment=Alignment.CenterVertically) {
                AsyncImage(model=RAW+"logo.png",contentDescription=null,modifier=Modifier.size(18.dp),contentScale=ContentScale.Crop)
                Spacer(Modifier.width(2.dp))
                AsyncImage(model=RAW+"logo.png",contentDescription=null,modifier=Modifier.size(21.dp),contentScale=ContentScale.Crop)
                Spacer(Modifier.width(2.dp))
                AsyncImage(model=RAW+"logo.png",contentDescription=null,modifier=Modifier.size(18.dp),contentScale=ContentScale.Crop)
            }
        }
    }
}
