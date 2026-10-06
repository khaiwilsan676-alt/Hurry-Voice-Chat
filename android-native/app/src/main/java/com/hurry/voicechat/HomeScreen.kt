package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.input.pointer.pointerInput
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
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage

private const val RAW = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"
private const val HONOUR_BG = RAW + "IMG_20260912_144404.png"
private const val CHARM_BG = RAW + "IMG_20260912_144324.png"
private const val ROOM_BG = RAW + "IMG_20260912_144347.png"
private const val CARD_FRAME = RAW + "file_00000000048882118276c7215012963f.png"

@Composable
fun HomeScreen(onRoom: (HurryRoom) -> Unit, onMine: () -> Unit = {}, onPopular: () -> Unit = {}, mineSelected: Boolean = false) {
    val mine = mineSelected
    var rooms by remember { mutableStateOf<List<HurryRoom>?>(null) }
    LaunchedEffect(Unit) { rooms = HurryApi.rooms() }

    if (mine) {
        MineNativePage(onBack = onPopular)
        return
    }

    val banners = listOf(
        RAW + "IMG-20260830-WA0081.jpg",
        RAW + "IMG-20260818-WA0000.jpg",
        RAW + "IMG-20260818-WA0001.jpg"
    )
    val pager = rememberPagerState(pageCount = { banners.size })

    LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay(5000)
            val next = (pager.currentPage + 1) % banners.size
            pager.animateScrollToPage(next)
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(Color.White),
        contentPadding = PaddingValues(bottom = 12.dp)
    ) {
        item {
            Column(
                Modifier.fillMaxWidth().background(androidx.compose.ui.graphics.Brush.verticalGradient(listOf(Color(0xFF3B82F6), Color(0xFFEFF6FF), Color.White))).statusBarsPadding().padding(top = 3.dp, start = 12.dp, end = 12.dp, bottom = 2.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Box(Modifier.wrapContentSize().pointerInput(Unit) { detectTapGestures(onTap = { onPopular() }) }) {
                            Text("Popular", fontSize=21.sp, fontWeight=if(!mine) FontWeight.Bold else FontWeight.Normal, color=if(!mine) HurryText else HurryMuted)
                        }
                        Box(Modifier.wrapContentSize().pointerInput(Unit) { detectTapGestures(onTap = { onMine() }) }) {
                            Text("Mine", fontSize=21.sp, fontWeight=FontWeight.Normal, color=HurryMuted)
                        }
                    }
                    Spacer(Modifier.weight(1f))
                    HurrySearchIcon()
                    Spacer(Modifier.width(10.dp))
                    HurryHouseIcon()
                    Spacer(Modifier.width(2.dp))
                }
                Spacer(Modifier.height(7.dp))
                Box(Modifier.fillMaxWidth().height((13.5f * LocalConfiguration.current.screenHeightDp / 100f).dp).clip(RoundedCornerShape(6.dp))) {
                    HorizontalPager(state = pager, modifier = Modifier.fillMaxSize(), userScrollEnabled = true, pageSpacing = 0.dp) { page ->
                        AsyncImage(model=banners[page], contentDescription=null, modifier=Modifier.fillMaxSize(), contentScale=ContentScale.Crop)
                    }
                    Row(Modifier.align(Alignment.BottomCenter).padding(bottom = 5.dp), horizontalArrangement = Arrangement.Center) {
                        repeat(banners.size) { i ->
                            Box(Modifier.padding(horizontal=1.5.dp).size(5.dp).clip(RoundedCornerShape(50)).background(if(i==pager.currentPage) Color.White else Color.White.copy(alpha=0.75f)))
                        }
                    }
                }
            }
        }
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp).offset(y = (-4).dp).padding(top = 0.dp, bottom = 1.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                HurryCategoryCard("Honour", HONOUR_BG, Modifier.weight(1f))
                HurryCategoryCard("Charm", CHARM_BG, Modifier.weight(1f))
                HurryCategoryCard("Room", ROOM_BG, Modifier.weight(1f))
            }
        }

        if (rooms == null) {
            item { Box(Modifier.fillMaxWidth().height(180.dp), contentAlignment=Alignment.Center) { CircularProgressIndicator(color=HurryBlue, strokeWidth=2.dp) } }
        } else if (rooms!!.isEmpty()) {
            item { Text("No rooms available", Modifier.padding(20.dp), color=HurryMuted, fontSize=14.sp) }
        } else {
            val roomRows = rooms!!.chunked(2)
            items(roomRows) { row ->
                Row(Modifier.fillMaxWidth().padding(horizontal=0.dp), horizontalArrangement=Arrangement.spacedBy((-4).dp)) {
                    row.forEach { room -> RoomListCard(room, onRoom, Modifier.weight(1f)) }
                    if (row.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun RoomListCard(room:HurryRoom, onRoom:(HurryRoom)->Unit, modifier: Modifier = Modifier) {
    Column(modifier.fillMaxWidth().padding(horizontal=6.dp, vertical=2.dp).clickable { onRoom(room) }) {
        Box(Modifier.fillMaxWidth().aspectRatio(1f).clip(RoundedCornerShape(10.dp))) {
            AsyncImage(model=if(room.image.startsWith("http")) room.image else RAW + room.image.trimStart('/'), contentDescription=null, modifier=Modifier.fillMaxSize(), contentScale=ContentScale.Crop)
        }
        Row(Modifier.fillMaxWidth().padding(horizontal=1.dp, vertical=1.dp), verticalAlignment=Alignment.CenterVertically, horizontalArrangement=Arrangement.spacedBy(2.dp)) {
            Text(room.country, fontSize=14.sp, maxLines=1)
            Text(room.name, fontSize=14.sp, fontWeight=FontWeight.Normal, color=Color(0xFF202124), maxLines=1, modifier=Modifier.weight(1f))
        }
    }
}

@Composable
fun HurryHouseIcon() {
    androidx.compose.foundation.Canvas(Modifier.size(32.dp)) {
        val c = Color(0xFF2D2D2D); val w = size.width; val h = size.height
        val p = androidx.compose.ui.graphics.Path().apply {
            moveTo(w*.50f,h*.11f); cubicTo(w*.42f,h*.11f,w*.10f,h*.25f,w*.10f,h*.43f); lineTo(w*.10f,h*.68f); cubicTo(w*.10f,h*.86f,w*.23f,h*.94f,w*.39f,h*.94f); lineTo(w*.61f,h*.94f); cubicTo(w*.77f,h*.94f,w*.90f,h*.86f,w*.90f,h*.68f); lineTo(w*.90f,h*.43f); cubicTo(w*.90f,h*.25f,w*.58f,h*.11f,w*.50f,h*.11f); close()
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
        AsyncImage(model=bg, contentDescription=label, modifier=Modifier.fillMaxSize().offset(y=1.dp).graphicsLayer { scaleX=if (label.equals("Honour", true)) 1.08f else 1.02f; scaleY=if (label.equals("Honour", true)) 1.08f else 1.02f }, contentScale=ContentScale.Fit)
        Text(text=label.uppercase(), modifier=Modifier.fillMaxWidth().padding(top=16.dp), textAlign=androidx.compose.ui.text.style.TextAlign.Center, fontSize=11.sp, fontWeight=FontWeight.Black, color=Color.White)
        androidx.compose.foundation.layout.Box(
            modifier=Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(horizontal=3.dp, bottom=2.dp)
        ) {
            AsyncImage(
                model=CARD_FRAME,
                contentDescription=null,
                modifier=Modifier.fillMaxWidth().wrapContentHeight(),
                contentScale=ContentScale.FillWidth
            )
            Row(
                Modifier.align(Alignment.BottomCenter).fillMaxWidth(.68f).height(30.dp).offset(y=(-1).dp),
                horizontalArrangement=Arrangement.Center,
                verticalAlignment=Alignment.CenterVertically
            ) {
                AsyncImage(
                    model=RAW+"logo.png",
                    contentDescription=null,
                    modifier=Modifier.size(24.dp).clip(RoundedCornerShape(50)),
                    contentScale=ContentScale.Crop
                )
                Spacer(Modifier.width(2.dp))
                AsyncImage(
                    model=RAW+"logo.png",
                    contentDescription=null,
                    modifier=Modifier.size(29.dp).clip(RoundedCornerShape(50)).padding(1.dp),
                    contentScale=ContentScale.Crop
                )
                Spacer(Modifier.width(2.dp))
                AsyncImage(
                    model=RAW+"logo.png",
                    contentDescription=null,
                    modifier=Modifier.size(24.dp).clip(RoundedCornerShape(50)),
                    contentScale=ContentScale.Crop
                )
            }
        }
    }
}