package com.hurry.voicechat

import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import android.os.Handler
import android.os.Looper
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import org.json.JSONArray
import org.json.JSONObject
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage

data class RoomPageOwner(val id:String="",val uid:String="",val accountId:String="",val name:String="Room",val image:String="",val country:String="🇮🇳")
data class RoomPageCurrentUser(val id:String="",val uid:String="",val accountId:String="",val name:String="User",val image:String="")
data class NativeRoomSeat(val number:Int,val occupied:Boolean=false,val locked:Boolean=false,val muted:Boolean=false,val speaking:Boolean=false,val userName:String="",val userImage:String="",val accountId:String="")
data class NativeRoomMessage(val id:String,val text:String,val sender:String,val senderImage:String,val senderAccountId:String="",val timestamp:Long=System.currentTimeMillis(),val type:String="message")

@Composable
fun RoomPage(
    roomOwner: RoomPageOwner,
    currentUser: RoomPageCurrentUser,
    onClose:()->Unit={},
    onBack:()->Unit=onClose,
    onKeepRoom:(String,String,String)->Unit={_,_,_->},
    onFollowToggle:(String,Boolean)->Unit={_,_->}
) {
    val roomId=roomOwner.id.ifBlank{roomOwner.accountId.ifBlank{roomOwner.uid.ifBlank{"default-room"}}}
    val accountId=currentUser.accountId.ifBlank{currentUser.uid.ifBlank{currentUser.id.ifBlank{"guest"}}}
    val clipboard = LocalClipboardManager.current
    var copiedId by remember { mutableStateOf("") }
    var roomName by remember{mutableStateOf(roomOwner.name.ifBlank{"Room"})}
    var roomImage by remember{mutableStateOf(roomOwner.image)}
    var followed by remember{mutableStateOf(false)}
    var speaker by remember{mutableStateOf(true)}
    var locked by remember{mutableStateOf(false)}
    var showChat by remember{mutableStateOf(false)}
    var showMenu by remember{mutableStateOf(false)}
    var showExitMenu by remember{mutableStateOf(false)}
    var showInfo by remember{mutableStateOf(false)}
    var showActiveUsers by remember{mutableStateOf(false)}
    var showSettings by remember{mutableStateOf(false)}
    var showGift by remember{mutableStateOf(false)}
    var showEmoji by remember{mutableStateOf(false)}
    var showGames by remember{mutableStateOf(false)}
    var showRoomTask by remember{mutableStateOf(false)}
    var showWildParty by remember{mutableStateOf(false)}
    var showFruitParty by remember{mutableStateOf(false)}
    var showMusic by remember{mutableStateOf(false)}
    var input by remember{mutableStateOf("")}
    var announcement by remember{mutableStateOf("")}
    var selectedSeat by remember{mutableIntStateOf(0)}
    var showSeatSheet by remember{mutableStateOf(false)}
    val messages=remember{mutableStateListOf<NativeRoomMessage>()}
    val seats=remember{mutableStateListOf<NativeRoomSeat>().apply{for(i in 1..15)add(NativeRoomSeat(i))}}
    val backendRoomUsers=remember{mutableStateListOf<ActiveUserNative>()}

    DisposableEffect(roomId,accountId,currentUser.name,currentUser.image,roomOwner.id,roomOwner.accountId) {
        val roomSocket = IO.socket("https://hurry-voice-chat-lz75.onrender.com")
        val mainHandler = Handler(Looper.getMainLooper())
        val presenceListener = Emitter.Listener { args ->
            val payload = args.firstOrNull() as? JSONObject
            if (payload != null && payload.optString("roomId") == roomId) {
                val usersJson = payload.optJSONArray("users") ?: JSONArray()
                val parsed = ArrayList<ActiveUserNative>()
                for (index in 0 until usersJson.length()) {
                    val user = usersJson.optJSONObject(index) ?: continue
                    val userId = user.optString("accountId", user.optString("userId"))
                    if (userId.isNotBlank()) parsed.add(ActiveUserNative(
                        accountId=userId,
                        name=user.optString("name","User").ifBlank{"User"},
                        image=user.optString("image","")
                    ))
                }
                mainHandler.post { backendRoomUsers.clear(); backendRoomUsers.addAll(parsed) }
            }
        }
        val seatListener = Emitter.Listener { args ->
            val payload = args.firstOrNull() as? JSONObject
            if (payload != null && payload.optString("roomId") == roomId) {
                val seatsJson = payload.optJSONArray("seats") ?: JSONArray()
                val parsed = ArrayList<NativeRoomSeat>()
                for (index in 0 until seatsJson.length()) {
                    val seat = seatsJson.optJSONObject(index) ?: continue
                    val user = seat.optJSONObject("user")
                    parsed.add(NativeRoomSeat(
                        number=seat.optInt("number",index+1),
                        occupied=seat.optBoolean("isOccupied",user != null),
                        locked=seat.optBoolean("isLocked",false),
                        muted=seat.optBoolean("isMuted",false),
                        speaking=seat.optBoolean("isSpeaking",false),
                        userName=if (user == null) "" else user.optString("name","User"),
                        userImage=if (user == null) "" else user.optString("image",user.optString("dp","")),
                        accountId=if (user == null) "" else user.optString("accountId",user.optString("userId",""))
                    ))
                }
                mainHandler.post {
                    val byNumber = parsed.associateBy { it.number }
                    for (index in seats.indices) {
                        val number = seats[index].number
                        seats[index] = byNumber[number] ?: NativeRoomSeat(number=number)
                    }
                    parsed.filter { it.number !in seats.map(NativeRoomSeat::number) }.forEach { seats.add(it) }
                }
            }
        }
        val connectListener = Emitter.Listener {
            val joinPayload = JSONObject()
                .put("roomId",roomId)
                .put("userId",currentUser.uid.ifBlank{currentUser.id.ifBlank{accountId}})
                .put("accountId",accountId)
                .put("roomOwnerId",roomOwner.uid.ifBlank{roomOwner.id.ifBlank{roomOwner.accountId.ifBlank{roomId}}})
                .put("name",currentUser.name)
                .put("dp",currentUser.image)
            roomSocket.emit("room_join",joinPayload)
            roomSocket.emit("room_presence_request",JSONObject().put("roomId",roomId))
            roomSocket.emit("room_seats_request",JSONObject().put("roomId",roomId))
        }
        roomSocket.on("room_presence",presenceListener)
        roomSocket.on("room_seats",seatListener)
        roomSocket.on(Socket.EVENT_CONNECT,connectListener)
        roomSocket.connect()
        onDispose {
            roomSocket.emit("room_leave",JSONObject().put("roomId",roomId).put("userId",accountId).put("accountId",accountId))
            roomSocket.off("room_presence",presenceListener)
            roomSocket.off("room_seats",seatListener)
            roomSocket.off(Socket.EVENT_CONNECT,connectListener)
            roomSocket.disconnect()
            roomSocket.close()
            mainHandler.post { backendRoomUsers.clear() }
        }
    }

    Box(Modifier.fillMaxSize().background(Color.Black)){
        AsyncImage(model=roomImage,contentDescription=null,modifier=Modifier.fillMaxSize(),contentScale=ContentScale.Crop)
        Row(
            modifier=Modifier.align(Alignment.TopStart).padding(top=38.dp,start=2.dp)
                .clip(RoundedCornerShape(topEnd=10.dp,bottomEnd=10.dp))
                .background(Brush.horizontalGradient(listOf(Color(0xE6242B35),Color(0x99242B35),Color.Transparent)))
                .clickable{showInfo=true}
                .padding(start=10.dp,end=12.dp,top=5.dp,bottom=5.dp),
            verticalAlignment=Alignment.CenterVertically,
            horizontalArrangement=Arrangement.spacedBy(5.dp)
        ){
            GreenColorRemovalImage(
                imageUrl="https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/1788258883971~2.jpg",
                contentDescription="Room trophy",
                modifier=Modifier.size(18.dp),
                contentScale=ContentScale.Fit,
                threshold=0.5f
            )
            Text("0",color=Color(0xFFEEF3A3),fontSize=13.sp,fontWeight=androidx.compose.ui.text.font.FontWeight.Bold)
            Icon(Icons.Default.ChevronRight,null,tint=Color(0xFFEEF3A3),modifier=Modifier.size(13.dp))
        }
        Column(Modifier.fillMaxSize()){
            Row(Modifier.fillMaxWidth().padding(top=28.dp,start=6.dp,end=6.dp),verticalAlignment=Alignment.CenterVertically){
                AsyncImage(model=roomImage,contentDescription="Room profile",modifier=Modifier.size(34.dp).clip(RoundedCornerShape(6.dp)).clickable{showInfo=true},contentScale=ContentScale.Crop)
                Column(Modifier.weight(1f).padding(start=6.dp)){
                    Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(3.dp)){
                        Text(roomName.take(12).let { if(roomName.length>12) it+"..." else it },color=Color.White,fontSize=12.sp,fontWeight=androidx.compose.ui.text.font.FontWeight.Bold,maxLines=1,overflow=TextOverflow.Ellipsis)
                        Text(roomCountryFlag(roomOwner.country),color=Color.White,fontSize=12.sp,maxLines=1)
                        if(accountId!=roomOwner.accountId.ifBlank{roomOwner.id}) IconButton(onClick={followed=!followed;onFollowToggle(roomId,followed)},modifier=Modifier.size(22.dp)){Image(painterResource(R.drawable.ic_hurry_heart),contentDescription="Follow",modifier=Modifier.size(12.dp))}
                    }
                    Text("ID:"+roomOwner.accountId.ifBlank{roomOwner.id.ifBlank{roomId}},color=Color.White,fontSize=10.sp,maxLines=1)
                }
                Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(3.dp)){
                    Row(
                        modifier=Modifier.height(32.dp).clip(CircleShape).background(Color.Black.copy(alpha=.30f)).clickable{showActiveUsers=true}.padding(horizontal=6.dp),
                        verticalAlignment=Alignment.CenterVertically,
                        horizontalArrangement=Arrangement.spacedBy(3.dp)
                    ){
                        Image(painterResource(R.drawable.ic_hurry_people),contentDescription="Active users",modifier=Modifier.size(19.dp))
                        Text(backendRoomUsers.size.toString(),color=Color.White,fontSize=10.sp,fontWeight=androidx.compose.ui.text.font.FontWeight.SemiBold)
                    }
                    if(accountId==roomOwner.accountId.ifBlank{roomOwner.id}) Box(
                        Modifier.size(32.dp).clip(CircleShape).background(Color.Black.copy(alpha=.30f)).clickable{showSettings=true},
                        contentAlignment=Alignment.Center
                    ){Image(painterResource(R.drawable.ic_hurry_settings),contentDescription="Room settings",modifier=Modifier.size(19.dp))}
                    Box(
                        Modifier.size(32.dp).clip(CircleShape).background(Color.Black.copy(alpha=.30f)).clickable{showExitMenu=true},
                        contentAlignment=Alignment.Center
                    ){Image(painterResource(R.drawable.ic_hurry_power),contentDescription="Exit room",modifier=Modifier.size(19.dp))}
                }
            }
            if(announcement.isNotBlank()) Surface(Modifier.fillMaxWidth().padding(10.dp),color=Color.Black.copy(.4f),shape=RoundedCornerShape(18.dp)){
                Text(announcement,color=Color.White,fontSize=13.sp,modifier=Modifier.padding(10.dp),maxLines=1,overflow=TextOverflow.Ellipsis)
            }
            Spacer(Modifier.weight(1f))
            Column(
                Modifier.fillMaxWidth().padding(horizontal=5.dp),
                verticalArrangement=Arrangement.spacedBy(7.dp)
            ) {
                seats.chunked(5).forEach { rowSeats ->
                    Row(Modifier.fillMaxWidth(), horizontalArrangement=Arrangement.SpaceEvenly) {
                        rowSeats.forEach { seat ->
                            NativeSeat(seat, roomOwner.accountId.ifBlank{roomOwner.id}) {
                                selectedSeat = seat.number
                                showSeatSheet = true
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.weight(1f))
            if(messages.isNotEmpty()) LazyColumn(Modifier.fillMaxWidth().height(150.dp).padding(horizontal=10.dp)){items(messages,key={it.id}){NativeMessage(it)}}
            if(showChat) Row(Modifier.fillMaxWidth().padding(8.dp),verticalAlignment=Alignment.CenterVertically){
                IconButton(onClick={showEmoji=!showEmoji}){Icon(Icons.Default.EmojiEmotions,null,tint=Color.White)}
                OutlinedTextField(value=input,onValueChange={input=it},modifier=Modifier.weight(1f),singleLine=true,placeholder={Text("Message")})
                IconButton(onClick={if(input.isNotBlank()){messages.add(NativeRoomMessage(System.currentTimeMillis().toString(),input,currentUser.name,currentUser.image,accountId));input=""}}){Icon(Icons.Default.Send,null,tint=Color.White)}
            }
            Row(Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal=8.dp, vertical=6.dp).height(40.dp),verticalAlignment=Alignment.CenterVertically){
                Row(Modifier.weight(1f),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(3.dp)){
                    RoomFooterButton(onClick={showChat=!showChat},description="Say Hi Chat",icon=R.drawable.ic_hurry_chat)
                    val selfSeatIndex=seats.indexOfFirst{it.occupied && it.accountId==accountId}
                    if(selfSeatIndex>=0) RoomFooterButton(onClick={seats[selfSeatIndex]=seats[selfSeatIndex].copy(muted=!seats[selfSeatIndex].muted)},description="Microphone",icon=if(seats[selfSeatIndex].muted) R.drawable.ic_hurry_mic_muted else R.drawable.ic_hurry_mic)
                    if(selfSeatIndex>=0) RoomFooterButton(onClick={showEmoji=true},description="Emoji",icon=R.drawable.ic_hurry_emoji)
                }
                Box(Modifier.size(47.dp),contentAlignment=Alignment.Center){
                    AsyncImage(model="https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/file_0000000019c4821180028eebae10dbfc.png",contentDescription="Gift",modifier=Modifier.size(47.dp).clickable{showGift=true},contentScale=ContentScale.Fit)
                }
                Row(Modifier.weight(1f),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(3.dp,Alignment.End)){
                    RoomFooterButton(onClick={showChat=!showChat},description="Message Box Menu",icon=R.drawable.ic_hurry_mail)
                    RoomFooterButton(onClick={showMenu=true},description="Apps Menu",icon=R.drawable.ic_hurry_apps)
                }
            }
        }
        // Real Hurry room's right-side image stack (banner, room task and games).
        var sideBannerIndex by remember { mutableIntStateOf(0) }
        LaunchedEffect(Unit) {
            while (true) {
                kotlinx.coroutines.delay(3000)
                sideBannerIndex = (sideBannerIndex + 1) % 2
            }
        }
        Column(
            modifier=Modifier.align(Alignment.BottomEnd)
                .padding(end=10.dp, bottom=78.dp)
                .heightIn(max=330.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment=Alignment.CenterHorizontally,
            verticalArrangement=Arrangement.spacedBy(2.dp)
        ) {
            AsyncImage(
                model=if(sideBannerIndex==0)
                    "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/1788339540059~2.jpg"
                else
                    "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/1788339681679~2.jpg",
                contentDescription="Room side banner",
                modifier=Modifier.size(width=60.dp,height=84.dp).clip(RoundedCornerShape(8.dp)),
                contentScale=ContentScale.Crop
            )
            Row(horizontalArrangement=Arrangement.spacedBy(2.dp),verticalAlignment=Alignment.CenterVertically) {
                Box(Modifier.size(6.dp).clip(CircleShape).background(Color.White))
                Box(Modifier.size(4.dp).clip(CircleShape).background(Color.White.copy(alpha=.4f)))
            }
            GreenColorRemovalImage(
                imageUrl="https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/IMG-20260902-WA0066.jpg",
                contentDescription="Room task",
                modifier=Modifier.size(63.dp).clickable { showRoomTask=true },
                contentScale=ContentScale.Fit,
                threshold=0.45f
            )
            AsyncImage(
                model="https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/file_000000002a8c81fab8232bebeeeb45cc.png",
                contentDescription="Games",
                modifier=Modifier.size(56.dp).clickable { showGames=true },
                contentScale=ContentScale.Fit
            )
        }
        if(showExitMenu) RoomExitMenu(
            onKeep={showExitMenu=false;onKeepRoom(roomName,roomImage,roomId)},
            onExit={showExitMenu=false;onClose()},
            onDismiss={showExitMenu=false}
        )
        if(showMenu) RoomMenu(
            owner=accountId==roomOwner.accountId.ifBlank{roomOwner.id},
            onClose={showMenu=false},
            onSettings={showMenu=false;showSettings=true},
            onLeave={showMenu=false;onClose()}
        )
        val activeRoomUsers = backendRoomUsers.toList()
        val roomFollowers = seats.filter { it.occupied && it.accountId.isNotBlank() && it.accountId != roomOwner.accountId && it.accountId != roomOwner.id }
            .map { RoomInfoFollower(it.accountId,it.userName,it.userImage) }
        if(showInfo) RoomInfo(
            isOpen=true,
            onClose={showInfo=false},
            isRoomOwner=accountId==roomOwner.accountId.ifBlank{roomOwner.id},
            roomOwner=RoomInfoOwner(id=roomOwner.id,uid=roomOwner.uid,accountId=roomOwner.accountId.ifBlank{roomOwner.id},name=roomOwner.name,image=roomOwner.image),
            roomData=RoomInfoData(roomName,roomImage,announcement,roomId),
            roomFollowers=roomFollowers,
            onOpenProfile={ follower -> seats.firstOrNull{it.accountId==follower.accountId}?.let{selectedSeat=it.number};showInfo=false },
            onCopyId={ id -> clipboard.setText(AnnotatedString(id));copiedId=id },
            copied=copiedId==roomId
        )
        if(showActiveUsers) ActiveUsers(
            isOpen=true,
            onClose={showActiveUsers=false},
            roomUsers=activeRoomUsers,
            onOpenProfile={ user -> seats.firstOrNull{it.accountId==user.accountId}?.let{selectedSeat=it.number};showActiveUsers=false },
            onCopyUserId={ id -> clipboard.setText(AnnotatedString(id));copiedId=id }
        )
        if(showSettings) RoomSettings(roomName,announcement,locked,{roomName=it},{announcement=it},{locked=it},{showSettings=false}){onKeepRoom(roomName,roomImage,roomId);showSettings=false}
        if(showGift) GiftPicker(
            open=true,
            onClose={showGift=false},
            seats=seats.toList(),
            roomId=roomId,
            currentUserAccountId=accountId,
            currentUserName=currentUser.name,
            currentUserImage=currentUser.image,
            roomUsers=activeRoomUsers
        )
        if(showGames) GamesSheet(
            onClose={showGames=false},
            onWildParty={showGames=false;showWildParty=true},
            onFruitParty={showGames=false;showFruitParty=true},
            onRoomTask={showGames=false;showRoomTask=true}
        )
        if(showRoomTask) Roomtask(onBack={showRoomTask=false})
        if(showWildParty) Wildparty(onClose={showWildParty=false},onMinimize={showWildParty=false})
        if(showFruitParty) Fruitparty(onClose={showFruitParty=false},onMinimize={showFruitParty=false})
        if(showMusic) MusicSheet{showMusic=false}
        if(showEmoji) EmojiSheet({showEmoji=false}){input+=it;showEmoji=false}
        if(showSeatSheet && selectedSeat>0) {
            val seat=seats.firstOrNull{it.number==selectedSeat}
            if(seat!=null) SeatActionSheet(
                seat=seat,
                isOwner=accountId==roomOwner.accountId.ifBlank{roomOwner.id},
                isMySeat=seat.occupied && seat.accountId==accountId,
                onDismiss={showSeatSheet=false;selectedSeat=0},
                onTake={ if(!seat.occupied && !seat.locked){seats[selectedSeat-1]=seat.copy(occupied=true,userName=currentUser.name,userImage=currentUser.image,accountId=accountId);showSeatSheet=false;selectedSeat=0} },
                onLeave={seats[selectedSeat-1]=seat.copy(occupied=false,userName="",userImage="",accountId="",muted=false,speaking=false);showSeatSheet=false;selectedSeat=0},
                onMute={seats[selectedSeat-1]=seat.copy(muted=!seat.muted);showSeatSheet=false;selectedSeat=0},
                onLock={seats[selectedSeat-1]=seat.copy(locked=!seat.locked);showSeatSheet=false;selectedSeat=0},
                onInvite={clipboard.setText(AnnotatedString("Join room $roomName — seat $selectedSeat (ID: $roomId)"));showSeatSheet=false;selectedSeat=0}
            )
        }
        if(selectedSeat>0 && seats.firstOrNull{it.number==selectedSeat}?.occupied==true && !showSeatSheet) {
            MemberSheet(seats.first{it.number==selectedSeat}){selectedSeat=0}
        }
    }
}

@Composable private fun SeatActionSheet(
    seat:NativeRoomSeat,isOwner:Boolean,isMySeat:Boolean,onDismiss:()->Unit,
    onTake:()->Unit,onLeave:()->Unit,onMute:()->Unit,onLock:()->Unit,onInvite:()->Unit
){
    Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha=.30f)).clickable{onDismiss()},contentAlignment=Alignment.BottomCenter){
        Surface(Modifier.fillMaxWidth(),color=Color.White.copy(alpha=.96f),shape=RoundedCornerShape(topStart=24.dp,topEnd=24.dp)){
            Column(Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal=16.dp,vertical=12.dp),verticalArrangement=Arrangement.spacedBy(2.dp)){
                if(!seat.occupied && !isMySeat) SeatSheetAction("Take Mic",enabled=!seat.locked,onClick=onTake)
                if(isMySeat) SeatSheetAction("Leave Seat",onClick=onLeave)
                if(isOwner || isMySeat || seat.occupied) SeatSheetAction(if(seat.muted)"Unmute Seat" else "Mute Seat",onClick=onMute)
                if(isOwner) SeatSheetAction(if(seat.locked)"Unlock Mic" else "Lock Mic",onClick=onLock)
                SeatSheetAction("Invite",onClick=onInvite)
            }
        }
    }
}
@Composable private fun SeatSheetAction(label:String,enabled:Boolean=true,onClick:()->Unit){
    TextButton(onClick=onClick,enabled=enabled,modifier=Modifier.fillMaxWidth().height(44.dp),shape=RoundedCornerShape(10.dp)){
        Text(label,color=if(enabled)Color(0xFF171717) else Color.Gray,fontSize=14.sp)
    }
}

@Composable private fun RoomFooterButton(onClick:()->Unit,description:String,icon:Int){
    Box(Modifier.size(36.dp).clip(CircleShape).background(Color.Black.copy(alpha=.30f)).clickable(onClick=onClick),contentAlignment=Alignment.Center){
        Image(painterResource(icon),contentDescription=description,modifier=Modifier.size(when(description){"Say Hi Chat"->25.dp;"Microphone"->26.dp;"Emoji"->23.dp;"Message Box Menu"->24.dp;"Apps Menu"->23.dp;else->21.dp}))
    }
}

@Composable private fun NativeSeat(seat:NativeRoomSeat,ownerId:String,onClick:()->Unit){
    val raw="https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"
    Column(
        horizontalAlignment=Alignment.CenterHorizontally,
        modifier=Modifier.width(66.dp).clickable(onClick=onClick)
    ){
        Box(Modifier.size(56.dp),contentAlignment=Alignment.Center){
            Box(
                Modifier.fillMaxSize().border(
                    width=2.5.dp,
                    brush=Brush.linearGradient(
                        if(seat.locked) listOf(Color(0xFFF3F4F6),Color(0xFF9CA3AF),Color(0xFF4B5563))
                        else listOf(Color(0xFFD9F7FF),Color(0xFF91E1FF),Color(0xFF4DBFEF),Color(0xFF167DB9))
                    ),
                    shape=CircleShape
                )
            )
            Box(
                Modifier.fillMaxSize(.91f).clip(CircleShape),
                contentAlignment=Alignment.Center
            ){
                if(seat.locked) {
                    AsyncImage(model=raw+"file_0000000015a48211b000ee447a786f7c.png",contentDescription="Locked seat",modifier=Modifier.fillMaxSize(.62f),contentScale=ContentScale.Fit)
                } else if(seat.occupied&&seat.userImage.isNotBlank()) {
                    AsyncImage(model=seat.userImage,contentDescription=seat.userName,modifier=Modifier.fillMaxSize(),contentScale=ContentScale.Crop)
                } else {
                    AsyncImage(model=raw+"file_000000003e7482309b7f6e7f2a922160.png",contentDescription="Empty seat",modifier=Modifier.fillMaxSize(.65f),contentScale=ContentScale.Fit)
                }
            }
            if(seat.muted) Icon(Icons.Default.MicOff,null,tint=Color.White,modifier=Modifier.align(Alignment.BottomEnd).size(15.dp))
        }
        Text(if(seat.occupied)seat.userName else seat.number.toString(),color=Color.White.copy(.9f),fontSize=9.sp,maxLines=1,overflow=TextOverflow.Ellipsis)
    }
}

@Composable private fun NativeMessage(m:NativeRoomMessage){
    Row(Modifier.fillMaxWidth().padding(vertical=2.dp),verticalAlignment=Alignment.CenterVertically){
        AsyncImage(model=m.senderImage,contentDescription=null,modifier=Modifier.size(26.dp).clip(CircleShape),contentScale=ContentScale.Crop)
        Column(Modifier.padding(start=6.dp)){Text(m.sender,color=Color.White.copy(.7f),fontSize=11.sp);Text(m.text,color=Color.White,fontSize=13.sp)}
    }
}

@Composable private fun RoomExitMenu(onKeep:()->Unit,onExit:()->Unit,onDismiss:()->Unit){
    val raw="https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"
    Box(Modifier.fillMaxSize().background(Color.Black.copy(.45f)).clickable{onDismiss()},contentAlignment=Alignment.TopCenter){
        Row(Modifier.fillMaxWidth().padding(top=150.dp).clickable(enabled=false){}.padding(horizontal=34.dp),horizontalArrangement=Arrangement.spacedBy(56.dp),verticalAlignment=Alignment.CenterVertically){
            Column(horizontalAlignment=Alignment.CenterHorizontally,modifier=Modifier.weight(1f).clickable{onKeep()}){
                AsyncImage(model=raw+"IMG_20261002_113229.png",contentDescription="Keep",modifier=Modifier.size(67.dp),contentScale=ContentScale.Fit)
                Text("Keep",color=Color.White,fontSize=14.sp,fontWeight=androidx.compose.ui.text.font.FontWeight.SemiBold)
            }
            Column(horizontalAlignment=Alignment.CenterHorizontally,modifier=Modifier.weight(1f).clickable{onExit()}){
                AsyncImage(model=raw+"IMG_20261002_113213.png",contentDescription="Exit",modifier=Modifier.size(67.dp),contentScale=ContentScale.Fit)
                Text("Exit",color=Color.White,fontSize=14.sp,fontWeight=androidx.compose.ui.text.font.FontWeight.SemiBold)
            }
        }
    }
}

@Composable private fun RoomMenu(owner:Boolean,onClose:()->Unit,onSettings:()->Unit,onLeave:()->Unit){
    Box(Modifier.fillMaxSize().background(Color.Black.copy(.35f)).clickable{onClose()},contentAlignment=Alignment.BottomCenter){
        Surface(Modifier.fillMaxWidth().padding(14.dp),color=Color(0xFF181818),shape=RoundedCornerShape(22.dp)){
            Column(Modifier.padding(18.dp),horizontalAlignment=Alignment.CenterHorizontally){
                Text("Room",color=Color.White,fontSize=17.sp)
                if(owner)TextButton(onClick=onSettings){Text("Room settings",color=Color.White)}
                TextButton(onClick=onLeave){Text("Leave room",color=Color.White)}
                TextButton(onClick=onClose){Text("Cancel",color=Color.White.copy(.7f))}
            }
        }
    }
}

@Composable private fun MemberSheet(seat:NativeRoomSeat,onClose:()->Unit)=SimpleSheet("Member",onClose){
    AsyncImage(model=seat.userImage,contentDescription=null,modifier=Modifier.size(76.dp).clip(CircleShape),contentScale=ContentScale.Crop)
    Text(seat.userName,color=Color.White,fontSize=17.sp);Text("ID: "+seat.accountId,color=Color.White.copy(.65f),fontSize=12.sp)
}

@Composable private fun RoomSettings(name:String,announcement:String,locked:Boolean,onName:(String)->Unit,onAnnouncement:(String)->Unit,onLocked:(Boolean)->Unit,onClose:()->Unit,onSave:()->Unit)=SimpleSheet("Room settings",onClose){
    OutlinedTextField(name,onName,singleLine=true,label={Text("Room name")})
    Spacer(Modifier.height(8.dp));OutlinedTextField(announcement,onAnnouncement,singleLine=true,label={Text("Announcement")})
    Row(verticalAlignment=Alignment.CenterVertically){Text("Lock room",color=Color.White,modifier=Modifier.weight(1f));TextButton(onClick={onLocked(!locked)}){Text(if(locked)"ON" else "OFF",color=Color.White)}}
    TextButton(onClick=onSave){Text("Save",color=Color.White)}
}

@Composable private fun GiftSheet(onClose:()->Unit)=SimpleSheet("Gift",onClose){
    Row(Modifier.horizontalScroll(rememberScrollState())){listOf("Hot","Lucky","Luxury","Event").forEach{TextButton(onClick={}){Text(it,color=Color.White)}}}
    Text("Select a gift",color=Color.White.copy(.7f),modifier=Modifier.padding(12.dp))
}

@Composable private fun GamesSheet(onClose:()->Unit,onWildParty:()->Unit,onFruitParty:()->Unit,onRoomTask:()->Unit){
    val raw="https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"
    Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha=.30f)).clickable{onClose()},contentAlignment=Alignment.BottomCenter){
        Surface(Modifier.fillMaxWidth().clickable(enabled=false){},color=Color(0xFF24212A),shape=RoundedCornerShape(topStart=18.dp,topEnd=18.dp)){
            Column(Modifier.fillMaxWidth().navigationBarsPadding().padding(start=18.dp,end=18.dp,top=12.dp,bottom=20.dp)){
                Box(Modifier.align(Alignment.CenterHorizontally).width(38.dp).height(4.dp).clip(CircleShape).background(Color.White.copy(alpha=.45f)))
                Spacer(Modifier.height(14.dp))
                Text("Games",color=Color.White,fontSize=16.sp,fontWeight=androidx.compose.ui.text.font.FontWeight.Bold)
                Spacer(Modifier.height(18.dp))
                Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceAround,verticalAlignment=Alignment.Top){
                    GameSheetItem(raw+"file_000000009d808211b8ffb7c2183b4ef5.png","Wild party",onWildParty)
                    GameSheetItem(raw+"file_00000000c9e08211ab3e8c4d511b7965.png","Fruit party",onFruitParty)
                    GameSheetItem(raw+"IMG-20260902-WA0066.jpg","Room task",onRoomTask)
                }
            }
        }
    }
}
@Composable private fun GameSheetItem(image:String,label:String,onClick:()->Unit){
    Column(Modifier.width(84.dp).clickable(onClick=onClick),horizontalAlignment=Alignment.CenterHorizontally){
        AsyncImage(model=image,contentDescription=label,modifier=Modifier.size(54.dp),contentScale=ContentScale.Fit)
        Spacer(Modifier.height(5.dp))
        Text(label,color=Color.White,fontSize=10.sp,maxLines=1)
    }
}

@Composable private fun MusicSheet(onClose:()->Unit){
    var volume by remember{mutableFloatStateOf(1f)}
    SimpleSheet("Music",onClose){
        Row(verticalAlignment=Alignment.CenterVertically){Icon(Icons.Default.MusicNote,null,tint=Color.White);Slider(volume,{volume=it},Modifier.weight(1f));Text((volume*100).toInt().toString()+"%",color=Color.White,fontSize=11.sp)}
        Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.Center){TextButton(onClick={}){Text("Previous",color=Color.White)};TextButton(onClick={}){Text("Play",color=Color.White)};TextButton(onClick={}){Text("Next",color=Color.White)}}
    }
}

@Composable private fun EmojiSheet(onClose:()->Unit,onEmoji:(String)->Unit)=SimpleSheet("Emoji",onClose){
    Row(Modifier.horizontalScroll(rememberScrollState())){listOf("😀","😂","😍","😎","🥰","😭","🔥","❤️").forEach{Text(it,fontSize=27.sp,modifier=Modifier.padding(7.dp).clickable{onEmoji(it)})}}
}

@Composable private fun SimpleSheet(title:String,onClose:()->Unit,content: @Composable () -> Unit){
    Box(Modifier.fillMaxSize().background(Color.Black.copy(.42f)).clickable{onClose()},contentAlignment=Alignment.BottomCenter){
        Surface(Modifier.fillMaxWidth().clickable(enabled=false){},color=Color(0xFF171717),shape=RoundedCornerShape(topStart=22.dp,topEnd=22.dp)){
            Column(Modifier.padding(18.dp).navigationBarsPadding()){
                Row(verticalAlignment=Alignment.CenterVertically){Text(title,color=Color.White,fontSize=18.sp,modifier=Modifier.weight(1f));IconButton(onClick=onClose){Icon(Icons.Default.Close,null,tint=Color.White)}}
                content();Spacer(Modifier.height(18.dp))
            }
        }
    }
}


private fun roomCountryFlag(country: String): String {
    val value = country.trim()
    return when {
        value.contains("india", true) || value.contains("🇮🇳") -> "🇮🇳"
        value.contains("singapore", true) || value.contains("🇸🇬") -> "🇸🇬"
        value.contains("pakistan", true) || value.contains("🇵🇰") -> "🇵🇰"
        value.contains("usa", true) || value.contains("united states", true) || value.contains("🇺🇸") -> "🇺🇸"
        value.contains("south africa", true) || value.contains("🇿🇦") -> "🇿🇦"
        value.contains("turkey", true) || value.contains("türkiye", true) || value.contains("🇹🇷") -> "🇹🇷"
        value.isBlank() -> "🇮🇳"
        else -> country
    }
}
