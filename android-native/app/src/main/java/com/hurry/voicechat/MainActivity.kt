package com.hurry.voicechat

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.material3.Text
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.Image
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.shape.RoundedCornerShape
import coil.compose.AsyncImage
import androidx.compose.ui.Alignment
import androidx.core.content.FileProvider
import androidx.core.view.WindowInsetsControllerCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = true
            isAppearanceLightNavigationBars = true
        }
        setContent {
            var showLaunch by remember { mutableStateOf(true) }
            LaunchedEffect(Unit) {
                showLaunch = false
                checkForHurryUpdate()
            }
            if (showLaunch) {
                HurryLaunchScreen()
            } else {
                HurryNativeRoot()
            }
        }
    }

    private suspend fun checkForHurryUpdate() {
        withContext(Dispatchers.IO) {
            runCatching {
                val api = URL("https://api.github.com/repos/khaiwilsan676-alt/Hurry-Voice-Chat/releases/latest")
                val connection = (api.openConnection() as HttpURLConnection).apply {
                    requestMethod = "GET"
                    connectTimeout = 8000
                    readTimeout = 8000
                    setRequestProperty("Accept", "application/vnd.github+json")
                    setRequestProperty("User-Agent", "Hurry-Native")
                }
                val json = connection.inputStream.bufferedReader().use { it.readText() }
                connection.disconnect()

                val tag = JSONObject(json).optString("tag_name")
                val remoteCode = tag.substringAfterLast("-").toIntOrNull() ?: return@runCatching
                val localCode = packageManager.getPackageInfo(packageName, 0).longVersionCode.toInt()
                if (remoteCode <= localCode) return@runCatching

                val assets = JSONObject(json).optJSONArray("assets") ?: return@runCatching
                val asset = (0 until assets.length()).map { assets.getJSONObject(it) }
                    .firstOrNull { it.optString("name") == "hurry-native.apk" }
                    ?: return@runCatching
                val downloadUrl = asset.optString("browser_download_url")
                if (downloadUrl.isBlank()) return@runCatching

                val apk = File(cacheDir, "hurry-native-update.apk")
                val dl = (URL(downloadUrl).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 15000
                    readTimeout = 30000
                    setRequestProperty("User-Agent", "Hurry-Native")
                }
                dl.inputStream.use { input -> apk.outputStream().use { output -> input.copyTo(output) } }
                dl.disconnect()

                runOnUiThread {
                    val uri: Uri = FileProvider.getUriForFile(this@MainActivity, "$packageName.fileprovider", apk)
                    val intent = Intent(Intent.ACTION_VIEW).apply {
                        setDataAndType(uri, "application/vnd.android.package-archive")
                        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    startActivity(intent)
                }
            }
        }
    }
}

@Composable
private fun HurryLaunchScreen() {
    Box(Modifier.fillMaxSize()) {
        AsyncImage(
            model = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/file_000000003b34820ba9a4e048344ec207.png",
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = androidx.compose.ui.layout.ContentScale.Crop
        )
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(
                    top = LocalConfiguration.current.screenHeightDp.dp * 0.20f,
                    start = 16.dp,
                    end = 16.dp
                ),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/logo.png",
                contentDescription = "Hurry logo",
                modifier = Modifier
                    .width(58.dp)
                    .height(58.dp)
                    .clip(RoundedCornerShape(16.dp)),
                contentScale = androidx.compose.ui.layout.ContentScale.Crop
            )
            Spacer(Modifier.width(10.dp))
            Text(
                "Hurry",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        }
    }
}

@Composable
private fun HurryNativeRoot() {
    var tab by remember { mutableStateOf(HurryTab.HOME) }
    var homeMine by remember { mutableStateOf(false) }
    var openedRoom by remember { mutableStateOf<HurryRoom?>(null) }
    var openedChat by remember { mutableStateOf<Triple<String, String, String>?>(null) }
    var openedMePage by remember { mutableStateOf<String?>(null) }

    BackHandler(enabled = openedRoom != null || openedChat != null || openedMePage != null) {
        when {
            openedChat != null -> openedChat = null
            openedRoom != null -> openedRoom = null
            openedMePage != null -> openedMePage = null
        }
    }

    HurryTheme {
        Box(Modifier.fillMaxSize()) {
            if (openedRoom != null) {
                RoomScreen(openedRoom!!, onBack = { openedRoom = null })
            } else if (openedChat != null) {
                val chat = openedChat!!
                NativeChatScreen(chat.second, chat.third, onBack = { openedChat = null })
            } else {
                Column(Modifier.fillMaxSize()) {
                    Box(Modifier.weight(1f)) {
                        when (tab) {
                            HurryTab.HOME -> HomeScreen(
                                onRoom = { openedRoom = it },
                                onMine = { homeMine = true },
                                onPopular = { homeMine = false },
                                mineSelected = homeMine
                            )
                            HurryTab.MESSAGE -> MessageScreen { uid, name, image ->
                                openedChat = Triple(uid, name, image)
                            }
                            HurryTab.ME -> if (openedMePage == "Coins") CoinsNativePage(onBack = { openedMePage = null })
                            else if (openedMePage == "Diamonds") DiamondsNativePage(onBack = { openedMePage = null })
                            else if (openedMePage != null) MeNativeSubPage(openedMePage!!, onBack = { openedMePage = null })
                            else MeScreen(onOpen = { openedMePage = it })
                        }
                    }
                    HurryBottomNav(tab, onTab = { tab = it })
                }
            }
        }
    }
}

@Composable
private fun MeNativeSubPage(title: String, onBack: () -> Unit) {
    Column(Modifier.fillMaxSize().background(Color.White).statusBarsPadding()) {
        Row(Modifier.fillMaxWidth().height(56.dp).padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("‹", fontSize = 36.sp, color = Color(0xFF222222), modifier = Modifier.clickable { onBack() })
            Spacer(Modifier.width(12.dp)); Text(title, fontSize = 20.sp, fontWeight = FontWeight.Normal, color = Color(0xFF111827))
        }
    }
}