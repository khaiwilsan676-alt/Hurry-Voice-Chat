package com.hurry.voicechat

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
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

private const val RAW = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"
private const val API = "https://hurry-voice-chat-lz75.onrender.com"
private val Blue = Color(0xFF3B82F6)
private val TextBlack = Color(0xFF1D1D1F)
private val Gray = Color(0xFF6E6E6E)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { HurryNativeApp() }
    }
}

private enum class Tab { HOME, MESSAGE, ME }

@Composable
private fun HurryNativeApp() {
    var tab by remember { mutableStateOf(Tab.HOME) }
    Column(Modifier.fillMaxSize().background(Color.White)) {
        Box(Modifier.weight(1f)) {
            when (tab) {
                Tab.HOME -> RealHome()
                Tab.MESSAGE -> RealMessage()
                Tab.ME -> RealMe()
            }
        }
        Row(
            Modifier.fillMaxWidth().height(65.dp).background(Color.White)
                .border(1.dp, Color(0xFFF0F0F0)),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            BottomNav("Home", tab == Tab.HOME, { tab = Tab.HOME }, "⌂")
            BottomNav("Message", tab == Tab.MESSAGE, { tab = Tab.MESSAGE }, "▱")
            BottomNav("Me", tab == Tab.ME, { tab = Tab.ME }, "♙")
        }
    }
}

@Composable
private fun BottomNav(label:String, active:Boolean, click:()->Unit, glyph:String) {
    Column(
        Modifier.width(82.dp).clickable { click() },
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(glyph, fontSize = 29.sp, color = if (active) Blue else TextBlack)
        Text(label, fontSize = 12.sp, fontWeight = if(active) FontWeight.SemiBold else FontWeight.Normal,
            color = if(active) TextBlack else Gray)
    }
}

private data class Room(val name:String, val image:String, val id:String)

@Composable
private fun RealHome() {
    var activeTab by remember { mutableStateOf("popular") }
    var rooms by remember { mutableStateOf<List<Room>>(emptyList()) }

    LaunchedEffect(Unit) {
        runCatching {
            val json = java.net.URL("$API/api/rooms").readText()
            val regex = Regex("""\\"(?:name|roomName)\\"\s*:\s*\\"([^\\"]+)\\"""")
            rooms = regex.findAll(json).mapIndexed { i, m ->
                Room(m.groupValues[1], RAW + listOf("default-avatar.png","default-avatar.png","default-avatar.png","default-avatar.png")[i % 4], i.toString())
            }.toList().take(20)
        }
    }

    LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 18.dp)) {
        item {
            Column(
                Modifier.fillMaxWidth()
                    .background(Color(0xFFEFF6FF))
                    .padding(top = 35.dp, start = 12.dp, end = 12.dp, bottom = 8.dp)
            ) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                        RealTab("Mine", activeTab == "mine") { activeTab = "mine" }
                        RealTab("Popular", activeTab == "popular") { activeTab = "popular" }
                    }
                    Spacer(Modifier.weight(1f))
                    Text("⌕", fontSize = 29.sp, color = TextBlack)
                    Spacer(Modifier.width(8.dp))
                    Text("⌂", fontSize = 30.sp, color = TextBlack)
                }
                if (activeTab == "popular") {
                    Spacer(Modifier.height(5.dp))
                    var banner by remember { mutableStateOf(0) }
                    val banners = listOf("IMG-20260830-WA0081.jpg","IMG-20260818-WA0000.jpg","IMG-20260818-WA0001.jpg")
                    AsyncImage(
                        model = RAW + banners[banner],
                        contentDescription = "Banner",
                        modifier = Modifier.fillMaxWidth().height(135.dp).clip(RoundedCornerShape(6.dp))
                            .clickable { banner = (banner + 1) % banners.size },
                        contentScale = ContentScale.Crop
                    )
                    Row(Modifier.fillMaxWidth().padding(top = 5.dp), horizontalArrangement = Arrangement.Center) {
                        repeat(banners.size) { Text(if(it == banner) "━" else "•", fontSize = 11.sp, color = Color.White) }
                    }
                }
            }
        }
        if (rooms.isEmpty()) {
            items(listOf("Loading rooms…","Popular Voice Room","Friends Lounge","Music & Chat")) {
                RealRoomCard(Room(it, RAW + "default-avatar.png", it))
            }
        } else {
            items(rooms) { RealRoomCard(it) }
        }
    }
}

@Composable private fun RealTab(text:String, active:Boolean, click:()->Unit) {
    Text(text, Modifier.clickable { click() }, fontSize=22.sp,
        fontWeight=if(active) FontWeight.ExtraBold else FontWeight.Bold,
        color=if(active) TextBlack else Gray)
}

@Composable private fun RealRoomCard(room:Room) {
    Card(
        Modifier.fillMaxWidth().padding(horizontal=12.dp, vertical=5.dp),
        shape=RoundedCornerShape(9.dp),
        colors=CardDefaults.cardColors(containerColor=Color.White),
        elevation=CardDefaults.cardElevation(1.dp)
    ) {
        Row(Modifier.fillMaxWidth().padding(10.dp), verticalAlignment=Alignment.CenterVertically) {
            AsyncImage(room.image, room.name, Modifier.size(62.dp).clip(RoundedCornerShape(8.dp)), contentScale=ContentScale.Crop)
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(room.name, fontSize=16.sp, fontWeight=FontWeight.SemiBold, color=TextBlack)
                Text("Voice room · Live", fontSize=12.sp, color=Gray)
            }
            Text("›", fontSize=26.sp, color=Gray)
        }
    }
}

@Composable private fun RealMessage() {
    Column(Modifier.fillMaxSize().padding(top=16.dp, start=12.dp, end=12.dp)) {
        Text("Message", fontSize=28.sp, fontWeight=FontWeight.Bold, color=TextBlack)
        Spacer(Modifier.height(18.dp))
        Text("Chats will be connected to the existing Hurry Socket.IO backend in the native chat phase.", fontSize=14.sp, color=Gray)
    }
}

@Composable private fun RealMe() {
    LazyColumn(Modifier.fillMaxSize().background(Color(0xFFF8F9FB)),
        contentPadding=PaddingValues(bottom=18.dp)) {
        item {
            Column(Modifier.fillMaxWidth().background(Color.White)
                .padding(top=38.dp,start=14.dp,end=14.dp,bottom=18.dp)) {
                Row(verticalAlignment=Alignment.CenterVertically) {
                    AsyncImage(RAW+"default-avatar.png","Profile",
                        Modifier.size(76.dp).clip(androidx.compose.foundation.shape.CircleShape),
                        contentScale=ContentScale.Crop)
                    Spacer(Modifier.width(13.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Hurry User",fontSize=23.sp,fontWeight=FontWeight.Bold)
                        Text("ID: 000000",fontSize=12.sp,color=Gray)
                    }
                    Text("›",fontSize=30.sp,color=Gray)
                }
                Spacer(Modifier.height(16.dp))
                Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceEvenly) {
                    listOf("0\nFriends","0\nFollowers","0\nFollowing","0\nVisitors").forEach {
                        Text(it,textAlign=androidx.compose.ui.text.style.TextAlign.Center,fontSize=12.sp,color=TextBlack)
                    }
                }
            }
        }
        items(listOf("Invite Friends","Level","Family","SVIP","Medals","Store","Wallet","Setting","Hurry Support","Reports","Seller")) {
            Row(Modifier.fillMaxWidth().background(Color.White).padding(horizontal=16.dp,vertical=15.dp),
                verticalAlignment=Alignment.CenterVertically) {
                Text("●",fontSize=9.sp,color=Blue)
                Spacer(Modifier.width(14.dp))
                Text(it,Modifier.weight(1f),fontWeight=FontWeight.SemiBold,color=TextBlack)
                Text("›",fontSize=22.sp,color=Gray)
            }
            HorizontalDivider(color=Color(0xFFF1F1F1))
        }
    }
}
