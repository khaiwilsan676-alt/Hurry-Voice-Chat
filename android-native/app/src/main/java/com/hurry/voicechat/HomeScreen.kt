package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage

private const val RAW = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"
private const val HONOUR_BG = RAW + "IMG_20260912_144404.png"
private const val CHARM_BG = RAW + "IMG_20260912_144324.png"
private const val ROOM_BG = RAW + "IMG_20260912_144347.png"
private const val CARD_FRAME = RAW + "file_00000000048882118276c7215012963f.png"
private val HomeWhiteBlue = Color(0xFFFCFDFF)

@Composable
fun HomeScreen(
    onRoom: (HurryRoom) -> Unit,
    onMine: () -> Unit = {},
    onPopular: () -> Unit = {},
    mineSelected: Boolean = false
) {
    var rooms by remember { mutableStateOf<List<HurryRoom>?>(null) }
    LaunchedEffect(Unit) { rooms = HurryApi.rooms() }

    val banners = listOf(
        RAW + "IMG-20260830-WA0081.jpg",
        RAW + "IMG-20260818-WA0000.jpg",
        RAW + "IMG-20260818-WA0001.jpg"
    )
    val pager = rememberPagerState(pageCount = { banners.size })

    LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay(5000)
            pager.animateScrollToPage((pager.currentPage + 1) % banners.size)
        }
    }

    if (mineSelected) {
        Column(Modifier.fillMaxSize().background(HomeWhiteBlue)) {
            HomeTopBar(mine = true, onMine = onMine, onPopular = onPopular)
            MineNativePage(onBack = onPopular)
        }
        return
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().background(HomeWhiteBlue),
        contentPadding = PaddingValues(bottom = 12.dp)
    ) {
        item {
            HomeTopBar(mine = false, onMine = onMine, onPopular = onPopular)
        }
        item {
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                HurryCategoryCard("Honour", HONOUR_BG, Modifier.weight(1f))
                HurryCategoryCard("Charm", CHARM_BG, Modifier.weight(1f))
                HurryCategoryCard("Room", ROOM_BG, Modifier.weight(1f))
            }
        }

        when {
            rooms == null -> item {
                Box(Modifier.fillMaxWidth().height(180.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = HurryBlue, strokeWidth = 2.dp)
                }
            }
            rooms!!.isEmpty() -> item {
                Text("No rooms available", Modifier.padding(20.dp), color = HurryMuted, fontSize = 14.sp)
            }
            else -> {
                items(rooms!!.chunked(2)) { row ->
                    Row(
                        Modifier.fillMaxWidth().padding(horizontal = 2.dp),
                        horizontalArrangement = Arrangement.spacedBy(0.dp)
                    ) {
                        row.forEach { room ->
                            RoomListCard(room, onRoom, Modifier.weight(1f))
                        }
                        if (row.size == 1) Spacer(Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

@Composable
private fun RoomListCard(
    room: HurryRoom,
    onRoom: (HurryRoom) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier.fillMaxWidth().padding(horizontal = 6.dp, vertical = 4.dp)
            .clickable { onRoom(room) }
    ) {
        Box(Modifier.fillMaxWidth().aspectRatio(1f).clip(RoundedCornerShape(10.dp))) {
            AsyncImage(
                model = if (room.image.startsWith("http")) room.image else RAW + room.image.trimStart('/'),
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        }
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 1.dp, vertical = 1.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Text(room.country, fontSize = 14.sp, maxLines = 1)
            Text(
                room.name,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFF202124),
                maxLines = 1,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun HurryCategoryCard(label: String, bg: String, modifier: Modifier = Modifier) {
    Box(modifier.height(92.dp).clip(RoundedCornerShape(16.dp))) {
        AsyncImage(
            model = bg,
            contentDescription = label,
            modifier = Modifier.fillMaxSize().offset(y = 1.dp).graphicsLayer {
                scaleX = if (label.equals("Honour", true)) 1.08f else 1.02f
                scaleY = if (label.equals("Honour", true)) 1.08f else 1.02f
            },
            contentScale = ContentScale.Fit
        )
        Text(
            text = label.uppercase(),
            modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            fontSize = 11.sp,
            fontWeight = FontWeight.Black,
            color = Color.White
        )
        Box(
            modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth(.85f)
                .padding(bottom = 4.dp).offset(y = 2.dp)
        ) {
            AsyncImage(
                model = CARD_FRAME,
                contentDescription = null,
                modifier = Modifier.fillMaxWidth().wrapContentHeight(),
                contentScale = ContentScale.Fit
            )
            Row(
                Modifier.fillMaxSize(),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                AsyncImage(
                    model = RAW + "logo.png",
                    contentDescription = null,
                    modifier = Modifier.fillMaxHeight().aspectRatio(1f).weight(.24f)
                        .padding(end = 1.dp).offset(y = 1.dp),
                    contentScale = ContentScale.Crop
                )
                AsyncImage(
                    model = RAW + "logo.png",
                    contentDescription = null,
                    modifier = Modifier.fillMaxHeight().aspectRatio(1f).weight(.32f)
                        .offset(y = (-1).dp),
                    contentScale = ContentScale.Crop
                )
                AsyncImage(
                    model = RAW + "logo.png",
                    contentDescription = null,
                    modifier = Modifier.fillMaxHeight().aspectRatio(1f).weight(.24f)
                        .padding(start = 1.dp).offset(y = 1.dp),
                    contentScale = ContentScale.Crop
                )
            }
        }
    }
}


@Composable
private fun HomeTopBar(
    mine: Boolean,
    onMine: () -> Unit,
    onPopular: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(HomeWhiteBlue)
            .statusBarsPadding()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .padding(horizontal = 18.dp),
            horizontalArrangement = Arrangement.Center,
            verticalAlignment = Alignment.Bottom
        ) {
            HomeTopTab(
                label = "Popular",
                selected = !mine,
                onClick = onPopular
            )
            Spacer(Modifier.width(30.dp))
            HomeTopTab(
                label = "Mine",
                selected = mine,
                onClick = onMine
            )
        }
    }
}

@Composable
private fun HomeTopTab(
    label: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .width(76.dp)
            .height(46.dp)
            .clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Bottom
    ) {
        Text(
            text = label,
            fontSize = 16.sp,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
            color = if (selected) Color(0xFF202124) else Color(0xFF8A8F98),
            maxLines = 1
        )
        Spacer(Modifier.height(7.dp))
        Box(
            modifier = Modifier
                .width(if (selected) 28.dp else 0.dp)
                .height(3.dp)
                .clip(RoundedCornerShape(3.dp))
                .background(if (selected) HurryBlue else Color.Transparent)
        )
        Spacer(Modifier.height(2.dp))
    }
}
