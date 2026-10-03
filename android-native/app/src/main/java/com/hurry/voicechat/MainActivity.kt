package com.hurry.voicechat

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.sp
import androidx.navigation.compose.*

class MainActivity : ComponentActivity() {
 override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); enableEdgeToEdge(); setContent { HurryApp() } }
}
@Composable fun HurryApp() { val nav=rememberNavController(); NavHost(navController=nav,startDestination="home") {
 composable("home"){NativePlaceholder("Hurry","Home")}; composable("room"){NativePlaceholder("Hurry","Room")}; composable("messages"){NativePlaceholder("Hurry","Messages")}; composable("me"){NativePlaceholder("Hurry","Me")}
} }
@Composable private fun NativePlaceholder(title:String,screen:String){Box(Modifier.fillMaxSize(),Alignment.Center){Text("$title • $screen",fontSize=24.sp)}}