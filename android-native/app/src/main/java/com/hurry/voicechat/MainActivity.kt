package com.hurry.voicechat

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
 override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); enableEdgeToEdge(); setContent { HurryNativeApp() } }
}

private enum class Tab(val label:String,val icon:String){ HOME("Home","⌂"), MESSAGE("Message","✉"), ME("Me","●") }

@Composable fun HurryNativeApp(){
 var tab by remember { mutableStateOf(Tab.HOME) }
 var screen by remember { mutableStateOf("Home") }
 val go:(String)->Unit={screen=it}
 Scaffold(bottomBar={ if(screen in listOf("Home","Message","Me")) NavigationBar {
  Tab.entries.forEach { item -> NavigationBarItem(selected=tab==item,onClick={tab=item;screen=item.label},icon={Text(item.icon)},label={Text(item.label)}) }
 }}) { pad ->
  Box(Modifier.fillMaxSize().padding(pad)){ when(screen){
   "Home"->HomeScreen(go); "Message"->SimpleScreen("Message","Your conversations will appear here.")
   "Me"->MeScreen(go); "Room"->SimpleScreen("Room","Native voice room"); "Room Settings"->SimpleScreen("Room Settings","Mic mode and room theme")
   "Leaderboard"->SimpleScreen("Leaderboard","Leaderboard"); "Invite Friends"->SimpleScreen("Invite Friends","Invite friends"); "Level"->SimpleScreen("Level","Level and progress")
   "Family"->SimpleScreen("Family","Family"); "SVIP"->SimpleScreen("SVIP","SVIP"); "Setting"->SimpleScreen("Setting","Settings")
   "Store"->SimpleScreen("Store","Store"); "Wallet"->SimpleScreen("Wallet","Wallet"); "Chat Screen"->SimpleScreen("Chat Screen","Chat")
   "Hurry Support"->SimpleScreen("Hurry Support","Support"); "Reports"->SimpleScreen("Reports","Report form"); "Medals"->SimpleScreen("Medals","Medals")
   "Seller"->SimpleScreen("Seller","Seller Center"); else->SimpleScreen(screen,"")
  }}
 }
}

@Composable private fun HomeScreen(go:(String)->Unit){Column(Modifier.fillMaxSize().padding(top=34.dp,start=16.dp,end=16.dp)){Text("Hurry",fontSize=28.sp);Spacer(Modifier.height(18.dp));Text("Popular   Mine   Following   Recent",fontSize=15.sp);Spacer(Modifier.height(18.dp));Button(onClick={go("Room")},modifier=Modifier.fillMaxWidth()){Text("Enter Voice Room")};Spacer(Modifier.height(10.dp));Button(onClick={go("Leaderboard")},modifier=Modifier.fillMaxWidth()){Text("Leaderboard")};Spacer(Modifier.height(10.dp));Button(onClick={go("Invite Friends")},modifier=Modifier.fillMaxWidth()){Text("Invite Friends")}}}

@Composable private fun MeScreen(go:(String)->Unit){LazyColumn(Modifier.fillMaxSize().padding(top=38.dp,start=16.dp,end=16.dp)){item{Text("Me",fontSize=28.sp);Spacer(Modifier.height(16.dp))};item{Menu("Wallet"){go("Wallet")}};item{Menu("Store"){go("Store")}};item{Menu("Level"){go("Level")}};item{Menu("Family"){go("Family")}};item{Menu("SVIP"){go("SVIP")}};item{Menu("Medals"){go("Medals")}};item{Menu("Setting"){go("Setting")}};item{Menu("Hurry Support"){go("Hurry Support")}}}
@Composable private fun Menu(text:String,onClick:()->Unit){Button(onClick=onClick,modifier=Modifier.fillMaxWidth().padding(vertical=5.dp)){Text(text)}}
@Composable private fun SimpleScreen(title:String,body:String){Column(Modifier.fillMaxSize().padding(24.dp),horizontalAlignment=Alignment.CenterHorizontally){Text(title,fontSize=26.sp);Spacer(Modifier.height(20.dp));Text(body,fontSize=16.sp)}}