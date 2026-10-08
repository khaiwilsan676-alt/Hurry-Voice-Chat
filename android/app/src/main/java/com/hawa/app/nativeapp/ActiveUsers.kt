package com.hawa.app.nativeapp

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

data class ActiveUser(val accountId:String,val name:String,val image:String)

@Composable
fun ActiveUsers(users:List<ActiveUser> = emptyList()) {
    Column(Modifier.fillMaxWidth()) {
        users.forEach { Text(it.name) }
    }
}
