package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun SettingsPage(onBack: () -> Unit = {}) {
    Column(Modifier.fillMaxSize().background(Color.White)) {
        Row(
            Modifier.fillMaxWidth().statusBarsPadding().height(58.dp).padding(horizontal = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("‹", fontSize = 34.sp, color = Color(0xFF222222),
                modifier = Modifier.clickable { onBack() }.padding(horizontal = 10.dp))
            Text("Settings", fontSize = 20.sp, color = Color(0xFF111827))
        }
        LazyColumn(Modifier.fillMaxSize()) {
            item { SettingRow("Account & Security") }
            item { SettingRow("Notifications") }
            item { SettingRow("Privacy") }
            item { SettingRow("General") }
            item { SettingRow("About Hurry") }
        }
    }
}

@Composable
private fun SettingRow(title: String) {
    Row(
        Modifier.fillMaxWidth().clickable { }.padding(horizontal = 20.dp, vertical = 17.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, Modifier.weight(1f), fontSize = 15.sp, color = Color(0xFF171717))
        Text("›", fontSize = 25.sp, color = Color(0xFFAAAAAA))
    }
}
