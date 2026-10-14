package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

private data class SearchUserNative(val id:String,val accountId:String,val name:String,val country:String,val image:String,val bio:String)

@Composable
fun SearchPage(onBack:()->Unit={},onOpenProfile:(RoomProfileUser)->Unit={}) {
 var query by remember { mutableStateOf("") }
 var tab by remember { mutableStateOf("User") }
 var results by remember { mutableStateOf<List<SearchUserNative>>(emptyList()) }
 var searching by remember { mutableStateOf(false) }
 var hasSearched by remember { mutableStateOf(false) }
 val scope= rememberCoroutineScope()
 suspend fun performSearch(qInput:String) {
  val q=qInput.trim(); if(q.isBlank()) { results=emptyList(); hasSearched=false; searching=false; return }
  searching=true; hasSearched=true
  results=withContext(Dispatchers.IO) {
   runCatching {
    val encoded=URLEncoder.encode(q,"UTF-8")
    val conn=URL("https://hurry-voice-chat-lz75.onrender.com/api/users?search=$encoded&accountId=$encoded&q=$encoded").openConnection() as HttpURLConnection
    conn.connectTimeout=9000; conn.readTimeout=9000
    try {
     val body=conn.inputStream.bufferedReader().use{it.readText()}
     val arr=if(body.trim().startsWith("[")) JSONArray(body) else {
      val o=JSONObject(body)
      o.optJSONArray("users") ?: JSONArray().apply { o.optJSONObject("user")?.let{put(it)} }
     }
     val list= mutableListOf<SearchUserNative>(); val seen=mutableSetOf<String>()
     for(i in 0 until arr.length()) {
      val u=arr.optJSONObject(i) ?: continue
      val id=u.optString("id",u.optString("uid",u.optString("appLongId","")))
      val acc=u.optString("accountId",u.optString("accountNumber",u.optString("displayUserNumber",u.optString("Account Number",id))))
      if(acc.isBlank() || !seen.add(acc)) continue
      list.add(SearchUserNative(id.ifBlank{acc},acc,u.optString("name",u.optString("displayName",u.optString("userName","User"))),u.optString("country","🇮🇳"),u.optString("image",u.optString("photo",u.optString("photoURL",u.optString("avatar","")))),u.optString("bio","")))
     }
     list
    } finally { conn.disconnect() }
   }.getOrDefault(emptyList())
  }
  searching=false
 }
 LaunchedEffect(query,tab) {
  delay(350)
  if(query.isNotBlank()) performSearch(query)
  else { results=emptyList(); hasSearched=false; searching=false }
 }
 Column(Modifier.fillMaxSize().background(Color(0xFFF0F2F5))) {
  Row(Modifier.fillMaxWidth().background(Color(0xFFF0F2F5)).statusBarsPadding().padding(start=14.dp,end=14.dp,top=7.dp,bottom=6.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)) {
   TextField(query,{query=it},modifier=Modifier.weight(1f).height(38.dp).clip(CircleShape),placeholder={Text("Search by ID or name...",fontSize=13.sp,color=Color(0xFF9CA3AF))},leadingIcon={Icon(Icons.Default.Search,contentDescription="Search",tint=Color(0xFF6B7280),modifier=Modifier.size(19.dp))},singleLine=true,textStyle=androidx.compose.ui.text.TextStyle(fontSize=14.sp,fontWeight=FontWeight.Medium,color=Color(0xFF1F2937)),colors=TextFieldDefaults.colors(focusedContainerColor=Color(0xFFE5E7EB),unfocusedContainerColor=Color(0xFFE5E7EB),focusedIndicatorColor=Color.Transparent,unfocusedIndicatorColor=Color.Transparent,disabledIndicatorColor=Color.Transparent,cursorColor=Color(0xFF2563EB)),shape=CircleShape)
   Text("Cancel",modifier=Modifier.clickable{onBack()}.padding(vertical=8.dp),fontSize=14.sp,fontWeight=FontWeight.Medium,color=Color(0xFF374151))
  }
  Row(Modifier.fillMaxWidth().background(Color(0xFFF0F2F5)).padding(start=18.dp, end=16.dp),horizontalArrangement=Arrangement.spacedBy(22.dp)) {
   listOf("User","Room").forEach { label -> Column(Modifier.clickable{tab=label}.padding(top=8.dp,bottom=4.dp),horizontalAlignment=Alignment.Start) {
    Text(label,fontSize=14.sp,fontWeight=if(tab==label) FontWeight.SemiBold else FontWeight.Normal,color=if(tab==label)Color.Black else Color(0xFF6B7280))
    Spacer(Modifier.height(3.dp)); Box(Modifier.width(if(tab==label)18.dp else 0.dp).height(2.dp).clip(RoundedCornerShape(2.dp)).background(if(tab==label)Color.Black else Color.Transparent))
   } }
  }
  Box(Modifier.fillMaxSize().padding(16.dp)) {
   when {
    searching -> Column(Modifier.fillMaxWidth().padding(top=76.dp),horizontalAlignment=Alignment.CenterHorizontally){Icon(Icons.Default.Search,contentDescription="Searching",tint=Color(0xFF6B7280),modifier=Modifier.size(30.dp));Spacer(Modifier.height(12.dp));Text("Searching...",fontSize=12.sp,fontWeight=FontWeight.SemiBold,color=Color(0xFF9CA3AF))}
    hasSearched && results.isEmpty() -> Column(Modifier.fillMaxWidth().padding(top=76.dp),horizontalAlignment=Alignment.CenterHorizontally){Icon(Icons.Default.Search,null,tint=Color(0x669CA3AF),modifier=Modifier.size(48.dp));Spacer(Modifier.height(8.dp));Text("No result found",fontSize=14.sp,fontWeight=FontWeight.SemiBold,color=Color(0xFF6B7280));Text("Try different ID or name",fontSize=12.sp,color=Color(0xFF9CA3AF),modifier=Modifier.padding(top=4.dp))}
    !hasSearched -> Column(Modifier.fillMaxWidth().padding(top=76.dp),horizontalAlignment=Alignment.CenterHorizontally){Icon(Icons.Default.Search,null,tint=Color(0x669CA3AF),modifier=Modifier.size(48.dp));Spacer(Modifier.height(12.dp));Text("Search ${if(tab=="User")"Users" else "Rooms"}",fontSize=14.sp,fontWeight=FontWeight.SemiBold,color=Color(0xFF6B7280));Text("Enter ID or name to find people",fontSize=12.sp,color=Color(0xFF9CA3AF),modifier=Modifier.padding(top=4.dp))}
    else -> LazyColumn(verticalArrangement=Arrangement.spacedBy(12.dp)) { items(results,key={it.accountId}) { u ->
     Row(Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(Color.White).clickable{onOpenProfile(RoomProfileUser(id=u.id,uid=u.id,accountId=u.accountId,name=u.name,image=u.image,country=u.country,flag="",bio=u.bio))}.padding(14.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(13.dp)) {
      AsyncImage(model=u.image.ifBlank{"https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/default-avatar.png"},contentDescription=u.name,modifier=Modifier.size(48.dp).clip(CircleShape).background(Color(0xFFE5E7EB)),contentScale=ContentScale.Crop)
      Column(Modifier.weight(1f)){Text(u.name,fontSize=14.sp,fontWeight=FontWeight.Bold,color=Color(0xFF111827),maxLines=1,overflow=TextOverflow.Ellipsis);Text(u.country,fontSize=12.sp,color=Color(0xFF6B7280),maxLines=1);Text("ID: ${u.accountId}",fontSize=12.sp,color=Color(0xFF9CA3AF),fontWeight=FontWeight.Medium,modifier=Modifier.padding(top=2.dp))}
      if(tab=="Room") Box(Modifier.clip(CircleShape).background(Brush.horizontalGradient(listOf(Color(0xFF3B82F6),Color(0xFF4F46E5)))).padding(horizontal=14.dp,vertical=7.dp)){Text("Enter",color=Color.White,fontSize=12.sp,fontWeight=FontWeight.Bold)}
     }
    } }
   }
  }
 }
}
