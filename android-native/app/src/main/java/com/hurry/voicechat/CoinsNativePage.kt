package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
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

private const val RAW_WALLET="https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"

@Composable fun CoinsNativePage(onBack:()->Unit)=RechargeNativePage(onBack,false)
@Composable fun DiamondsNativePage(onBack:()->Unit)=RechargeNativePage(onBack,true)

@Composable
private fun RechargeNativePage(onBack:()->Unit, diamondsTab:Boolean){
 var tab by remember{mutableStateOf(if(diamondsTab)1 else 0)}
 var pay by remember{mutableStateOf(false)}
 var payUsing by remember{mutableStateOf(false)}
 var pack by remember{mutableStateOf("1,030,000")}
 var price by remember{mutableStateOf("₹100")}
 var coins by remember{mutableStateOf(0L)}
 var diamonds by remember{mutableStateOf(0L)}
 var din by remember{mutableStateOf("")}
 var cin by remember{mutableStateOf("")}
 var rate by remember{mutableStateOf("100%")}
 val banner=if(tab==1)"file_0000000085a482088fb089cb76f3d1af.png" else "file_00000000f3d88211964f0057da4bc797.png"
 Box(Modifier.fillMaxSize().background(Color.White)){
  Column(Modifier.fillMaxSize().statusBarsPadding()){
   Row(Modifier.fillMaxWidth().height(56.dp).padding(horizontal=8.dp),verticalAlignment=Alignment.CenterVertically){
    Text("‹",Modifier.size(44.dp).clickable{onBack()},fontSize=38.sp,color=Color(0xFF111827))
    Text("Recharge",Modifier.weight(1f),textAlign=androidx.compose.ui.text.style.TextAlign.Center,fontSize=17.sp,fontWeight=FontWeight.Bold)
    Text("▤",Modifier.size(44.dp),textAlign=androidx.compose.ui.text.style.TextAlign.Center,fontSize=21.sp)
   }
   Column(Modifier.fillMaxSize().padding(horizontal=16.dp)){
    Box(Modifier.fillMaxWidth().height(154.dp).clip(RoundedCornerShape(8.dp))){
     AsyncImage(RAW_WALLET+banner,null,Modifier.fillMaxSize(),contentScale=ContentScale.Crop)
     Column(Modifier.padding(start=24.dp,top=26.dp)){
      Text(if(tab==1)"My Diamonds" else "My Coins",fontSize=14.sp,color=Color(0xFFE5E7EB))
      Text(if(tab==1)diamonds.toString() else coins.toString(),fontSize=22.sp,color=Color(0xFFFFD84D),fontWeight=FontWeight.Bold)
     }
    }
    Row(Modifier.fillMaxWidth().padding(top=14.dp).clip(RoundedCornerShape(30.dp)).background(Color(0x33000000)).padding(4.dp)){
     Tab("Coins",tab==0,Modifier.weight(1f)){tab=0}; Tab("Diamonds",tab==1,Modifier.weight(1f)){tab=1}; Tab("Agent",tab==2,Modifier.weight(1f)){tab=2}
    }
    if(tab==0){
     Text("Recharge Coins",Modifier.padding(top=20.dp),fontSize=15.sp,fontWeight=FontWeight.Bold)
     Row(Modifier.fillMaxWidth().padding(top=10.dp),horizontalArrangement=Arrangement.spacedBy(10.dp)){
      Pack("1,000,000","₹100","+Bounce 30,000",Modifier.weight(1f)){pack="1,030,000";price="₹100";pay=true}
     }
    }else if(tab==1){
     Text("Exchange",Modifier.padding(top=20.dp),fontSize=15.sp,fontWeight=FontWeight.Bold)
     Row(Modifier.fillMaxWidth().padding(top=10.dp),verticalAlignment=Alignment.CenterVertically){
      Input("Diamonds",din,Modifier.weight(1f)){din=it;cin=((it.toLongOrNull()?:0)*33/100).toString()}
      Text("=",Modifier.padding(horizontal=8.dp),color=Color.LightGray,fontWeight=FontWeight.Bold)
      Input("Coins",cin,Modifier.weight(1f)){cin=it;din=((it.toLongOrNull()?:0)*100/33).toString()}
     }
     Text("exchange rate",Modifier.padding(top=18.dp),fontSize=11.sp,fontWeight=FontWeight.Bold,color=Color.Gray)
     Row(Modifier.fillMaxWidth().padding(top=7.dp),horizontalArrangement=Arrangement.spacedBy(6.dp)){
      listOf("20%","40%","60%","80%","100%").forEach{r->Box(Modifier.weight(1f).height(38.dp).clip(RoundedCornerShape(12.dp)).background(if(rate==r)Color(0xFF0044FF) else Color.White).clickable{rate=r},contentAlignment=Alignment.Center){Text(r,fontSize=11.sp,fontWeight=FontWeight.Bold,color=if(rate==r)Color.White else Color(0xFF0044FF))}}
     }
     Spacer(Modifier.height(42.dp))
     Box(Modifier.fillMaxWidth(.75f).height(50.dp).clip(RoundedCornerShape(28.dp)).background(Color(0xFF0044FF)).clickable{
      val d=din.toLongOrNull()?:0;val c=cin.toLongOrNull()?:0;if(d>0&&d<=diamonds&&c>0){diamonds-=d;coins+=c;din="";cin=""}
     },contentAlignment=Alignment.Center){Text("Exchange",color=Color.White,fontWeight=FontWeight.Bold)}
    }else{
     Row(Modifier.fillMaxWidth().padding(top=22.dp,start=8.dp,end=8.dp),verticalAlignment=Alignment.CenterVertically){
      Box(Modifier.size(50.dp).clip(RoundedCornerShape(25.dp)).background(Color(0xFFE5E7EB)),contentAlignment=Alignment.Center){Text("A",fontWeight=FontWeight.Bold,color=Color.Gray)}
      Text("Agent Anmol",Modifier.weight(1f).padding(start=12.dp),fontSize=17.sp,fontWeight=FontWeight.Bold)
      Box(Modifier.size(44.dp).clip(RoundedCornerShape(22.dp)).background(Color(0xFF0044FF)),contentAlignment=Alignment.Center){Text("•••",color=Color.White,fontWeight=FontWeight.Bold)}
     }
    }
   }
  }
  if(pay||payUsing)Box(Modifier.fillMaxSize().background(Color.Black.copy(.4f)).clickable{pay=false;payUsing=false})
  if(pay)Sheet("Payment Method",onClose={pay=false}){pay=false;payUsing=true;Unit}
  if(payUsing)PaySheet(onClose={payUsing=false}){coins+=pack.replace(",","").toLongOrNull()?:0;payUsing=false}
 }
}
@Composable private fun Tab(t:String,s:Boolean,m:Modifier,c:()->Unit){Box(m.height(40.dp).clip(RoundedCornerShape(25.dp)).background(if(s)Color.White else Color.Transparent).clickable{c()},contentAlignment=Alignment.Center){Text(t,fontSize=13.sp,fontWeight=FontWeight.Bold)}}
@Composable private fun Pack(c:String,p:String,b:String,m:Modifier,on:()->Unit){Column(m.aspectRatio(1f).clip(RoundedCornerShape(8.dp)).clickable{on()}.padding(10.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.Center){AsyncImage(RAW_WALLET+"file_00000000e56882119c217d508b6733dc.png",null,Modifier.size(32.dp));Text(c,Modifier.padding(top=6.dp),fontSize=17.sp,fontWeight=FontWeight.Bold);Text(b,Modifier.padding(top=5.dp).background(Color.Red,RoundedCornerShape(4.dp)).padding(4.dp),fontSize=9.sp,color=Color.White,fontWeight=FontWeight.Bold);Text(p,Modifier.padding(top=6.dp),fontSize=14.sp,color=Color.Gray)}}
@Composable private fun Input(h:String,v:String,m:Modifier,on:(String)->Unit){OutlinedTextField(v,onValueChange=on,modifier=m,singleLine=true,placeholder={Text(h,fontSize=12.sp)},shape=RoundedCornerShape(12.dp))}
@Composable private fun Sheet(title:String,onClose:()->Unit,onRecharge:()->Unit){Box(Modifier.fillMaxSize()){Column(Modifier.fillMaxWidth().align(Alignment.BottomCenter).Modifier.fillMaxWidth().clip(RoundedCornerShape(topStart=28.dp,topEnd=28.dp)).background(Color.White).padding(bottom=20.dp)){Text(title,Modifier.fillMaxWidth().padding(vertical=18.dp),textAlign=androidx.compose.ui.text.style.TextAlign.Center,fontSize=18.sp,fontWeight=FontWeight.Bold);Row(Modifier.fillMaxWidth().padding(horizontal=20.dp).background(Color(0xFFF8F9FA),RoundedCornerShape(12.dp)).padding(16.dp),horizontalArrangement=Arrangement.SpaceBetween){Text("Coins",fontSize=13.sp);Text("₹100",fontSize=18.sp,fontWeight=FontWeight.Bold)};Text("Select payment method",Modifier.padding(20.dp),fontSize=13.sp,color=Color.Gray);Text("UPI   GPay   PhonePe   Paytm",Modifier.padding(horizontal=20.dp),fontSize=14.sp,fontWeight=FontWeight.Bold);Button(onClick=onRecharge,Modifier.fillMaxWidth().padding(20.dp),shape=RoundedCornerShape(12.dp),colors=ButtonDefaults.buttonColors(containerColor=Color(0xFF0044FF))){Text("Recharge")}}}}
@Composable private fun PaySheet(onClose:()->Unit,onSelect:()->Unit){Box(Modifier.fillMaxSize()){Column(Modifier.fillMaxWidth().align(Alignment.BottomCenter).Modifier.fillMaxWidth().align(Alignment.BottomCenter).clip(RoundedCornerShape(topStart=28.dp,topEnd=28.dp)).background(Color.White).padding(bottom=20.dp)){Row(Modifier.fillMaxWidth().padding(16.dp)){Text("Pay Using",Modifier.weight(1f),textAlign=androidx.compose.ui.text.style.TextAlign.Center,fontSize=17.sp,fontWeight=FontWeight.Bold);Text("×",Modifier.clickable{onClose()},fontSize=24.sp)};listOf("GPay","PhonePe","Paytm","Other").forEach{n->Row(Modifier.fillMaxWidth().clickable{onSelect()}.padding(20.dp,14.dp),verticalAlignment=Alignment.CenterVertically){Box(Modifier.size(44.dp).clip(RoundedCornerShape(22.dp)).background(Color(0xFFF3F4F6)),contentAlignment=Alignment.Center){Text(if(n=="GPay")"G" else if(n=="PhonePe")"पे" else if(n=="Paytm")"P" else "…",fontWeight=FontWeight.Bold)};Text(n,Modifier.padding(start=16.dp),fontSize=16.sp)}}}}}
