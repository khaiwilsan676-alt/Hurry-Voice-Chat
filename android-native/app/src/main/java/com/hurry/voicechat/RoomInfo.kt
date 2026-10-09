package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage

data class RoomInfoOwner(val id:String="",val uid:String="",val accountId:String="",val name:String,val image:String)
data class RoomInfoData(val roomName:String,val roomDp:String,val roomAnnouncement:String,val roomId:String)
data class RoomInfoFollower(val accountId:String,val name:String,val image:String)

@Composable
fun RoomInfo(
    isOpen:Boolean,
    onClose:()->Unit,
    isRoomOwner:Boolean,
    roomOwner:RoomInfoOwner,
    roomData:RoomInfoData,
    roomFollowers:List<RoomInfoFollower>,
    onOpenProfile:(RoomInfoFollower)->Unit,
    onCopyId:(String)->Unit,
    copied:Boolean=false
) {
    if (!isOpen) return
    var tab by remember { mutableStateOf(0) }

    Box(Modifier.fillMaxSize(), contentAlignment=Alignment.BottomCenter) {
        Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha=.30f)).clickable(onClick=onClose))
        Column(
            Modifier.fillMaxWidth().fillMaxHeight(.50f)
                .clip(RoundedCornerShape(topStart=24.dp,topEnd=24.dp))
                .background(Color.White)
        ) {
            Box(Modifier.fillMaxWidth().padding(start=24.dp,end=24.dp,top=22.dp,bottom=14.dp)) {
                if (!isRoomOwner) {
                    Icon(Icons.Default.Warning, contentDescription="Report room", tint=Color.Black,
                        modifier=Modifier.align(Alignment.CenterStart).size(22.dp))
                }
                Text("Room Information", modifier=Modifier.fillMaxWidth(),
                    textAlign=TextAlign.Center, fontSize=18.sp, fontWeight=FontWeight.Bold,
                    color=Color(0xFF333333))
            }

            Row(Modifier.fillMaxWidth().padding(horizontal=24.dp)) {
                listOf("Profile","Members").forEachIndexed { index, label ->
                    Column(
                        Modifier.weight(1f).clickable { tab=index }.padding(top=2.dp),
                        horizontalAlignment=Alignment.CenterHorizontally
                    ) {
                        Text(label, modifier=Modifier.padding(vertical=11.dp),
                            fontSize=14.sp, fontWeight=FontWeight.SemiBold,
                            color=if(tab==index) Color.Black else Color(0xFF9CA3AF))
                        Box(Modifier.fillMaxWidth().height(2.dp)
                            .background(if(tab==index) Color.Black else Color.Transparent))
                    }
                }
            }
            Box(Modifier.fillMaxWidth().height(1.dp).background(Color(0xFFE5E7EB)))

            if (tab==0) {
                Column(
                    Modifier.fillMaxWidth().weight(1f).padding(horizontal=24.dp,vertical=16.dp),
                    verticalArrangement=Arrangement.spacedBy(16.dp)
                ) {
                    Row(verticalAlignment=Alignment.CenterVertically) {
                        AsyncImage(
                            model=roomData.roomDp.ifBlank { "/default-avatar.png" },
                            contentDescription="Room",
                            modifier=Modifier.size(56.dp).clip(RoundedCornerShape(12.dp)),
                            contentScale=ContentScale.Crop
                        )
                        Column(Modifier.padding(start=12.dp)) {
                            Text(roomData.roomName.ifBlank{"Room"},fontSize=15.sp,
                                fontWeight=FontWeight.SemiBold,color=Color(0xFF333333))
                            Row(verticalAlignment=Alignment.CenterVertically) {
                                Text("ID: "+roomData.roomId,fontSize=12.sp,color=Color(0xFF9CA3AF))
                                IconButton(onClick={onCopyId(roomData.roomId)},modifier=Modifier.size(26.dp)) {
                                    Icon(Icons.Default.ContentCopy,contentDescription="Copy room ID",
                                        tint=Color(0xFF6B7280),modifier=Modifier.size(15.dp))
                                }
                                if(copied) Text("Copied!",fontSize=11.sp,color=Color(0xFF22C55E))
                            }
                        }
                    }
                    Column {
                        Text("Host",fontSize=12.sp,fontWeight=FontWeight.Medium,color=Color(0xFF9CA3AF))
                        Text(roomOwner.name.ifBlank{"Unknown"},Modifier.padding(top=4.dp),
                            fontSize=14.sp,fontWeight=FontWeight.Medium,color=Color(0xFF333333))
                    }
                    Column {
                        Text("Announcement:",fontSize=12.sp,fontWeight=FontWeight.Medium,color=Color(0xFF9CA3AF))
                        Text(roomData.roomAnnouncement.ifBlank{"—"},Modifier.padding(top=4.dp),
                            fontSize=14.sp,color=Color(0xFF374151))
                    }
                }
            } else {
                if (roomFollowers.isEmpty()) {
                    Column(Modifier.fillMaxWidth().weight(1f).padding(16.dp),
                        horizontalAlignment=Alignment.CenterHorizontally,
                        verticalArrangement=Arrangement.Center) {
                        MemberRow(roomOwner.name,roomOwner.image,roomOwner.accountId,true) {
                            onOpenProfile(RoomInfoFollower(roomOwner.accountId,roomOwner.name,roomOwner.image))
                        }
                        Spacer(Modifier.height(8.dp))
                        Text("No followers yet",modifier=Modifier.fillMaxWidth().padding(20.dp),
                            textAlign=TextAlign.Center,fontSize=14.sp,color=Color(0xFF9CA3AF))
                    }
                } else {
                    LazyColumn(Modifier.fillMaxSize().padding(horizontal=16.dp,vertical=12.dp),
                        verticalArrangement=Arrangement.spacedBy(8.dp)) {
                        item {
                            MemberRow(roomOwner.name,roomOwner.image,roomOwner.accountId,true) {
                                onOpenProfile(RoomInfoFollower(roomOwner.accountId,roomOwner.name,roomOwner.image))
                            }
                        }
                        items(roomFollowers,key={it.accountId}) { f ->
                            MemberRow(f.name,f.image,f.accountId,false) { onOpenProfile(f) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MemberRow(name:String,image:String,id:String,owner:Boolean,onClick:()->Unit) {
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp))
            .background(Color(0xFFF9FAFB)).clickable(onClick=onClick).padding(horizontal=12.dp,vertical=10.dp),
        verticalAlignment=Alignment.CenterVertically
    ) {
        AsyncImage(
            model=if(image.isBlank()) "/default-avatar.png" else image,
            contentDescription=name,
            modifier=Modifier.size(36.dp).clip(CircleShape),
            contentScale=ContentScale.Crop
        )
        Text(name,Modifier.weight(1f).padding(start=12.dp),fontSize=14.sp,
            fontWeight=FontWeight.Medium,color=Color(0xFF333333),maxLines=1)
        if(owner) Text("⌂",fontSize=18.sp,color=Color(0xFF3B82F6))
    }
}
