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
import androidx.compose.ui.text.style.TextAlign
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
 var coins by remember{mutableStateOf(0L)}
 var diamonds by remember{mutableStateOf(0L)}
 var din by remember{mutableStateOf("")}
 var cin by remember{mutableStateOf("")}
 var rate by remember{mutableStateOf("100%")}
 val banner=if(tab==1)"file_0000000085a482088fb089cb76f3d1af.png" else "file_00000000f3d88211964f0057da4bc797.png"

 Box(Modifier.fillMaxSize().background(Color.White)){
  Column(
   Modifier.fillMaxSize().background(
    androidx.compose.ui.graphics.Brush.verticalGradient(
     listOf(Color(0xFF3B82F6),Color(0xFF60A5FA),Color(0xFFEFF6FF)),
     startY=0f,endY=180f
    )
   ).statusBarsPadding()
  ){
   Row(Modifier.fillMaxWidth().height(48.dp).padding(horizontal=4.dp),verticalAlignment=Alignment.CenterVertically){
    Box(Modifier.size(44.dp).clickable{onBack()},contentAlignment=Alignment.Center){
     androidx.compose.foundation.Canvas(Modifier.size(24.dp)){
      val c=Color.White
      val stroke=androidx.compose.ui.graphics.drawscope.Stroke(width=2.4.dp.toPx(),cap=androidx.compose.ui.graphics.StrokeCap.Round,join=androidx.compose.ui.graphics.StrokeJoin.Round)
      drawLine(color = c, start = androidx.compose.ui.geometry.Offset(size.width*.82f,size.height*.50f), end = androidx.compose.ui.geometry.Offset(size.width*.18f,size.height*.50f), strokeWidth=stroke.width)
      drawLine(color = c, start = androidx.compose.ui.geometry.Offset(size.width*.18f,size.height*.50f), end = androidx.compose.ui.geometry.Offset(size.width*.46f,size.height*.22f), strokeWidth=stroke.width)
      drawLine(color = c, start = androidx.compose.ui.geometry.Offset(size.width*.18f,size.height*.50f), end = androidx.compose.ui.geometry.Offset(size.width*.46f,size.height*.78f), strokeWidth=stroke.width)
     }
    }
    Text("Recharge",Modifier.weight(1f),textAlign=TextAlign.Center,fontSize=17.sp,fontWeight=FontWeight.Bold,color=Color.White)
    Box(Modifier.size(44.dp),contentAlignment=Alignment.Center){
     androidx.compose.foundation.Canvas(Modifier.size(23.dp)){
      val c=Color.White
      val stroke=androidx.compose.ui.graphics.drawscope.Stroke(width=2.dp.toPx(),join=androidx.compose.ui.graphics.StrokeJoin.Round)
      val p=androidx.compose.ui.graphics.Path().apply{
       moveTo(size.width*.30f,size.height*.08f)
       lineTo(size.width*.57f,size.height*.08f)
       lineTo(size.width*.82f,size.height*.33f)
       lineTo(size.width*.82f,size.height*.90f)
       lineTo(size.width*.30f,size.height*.90f)
       close()
      }
      drawPath(path=p,color=c,style=stroke)
      drawLine(color=c,start=androidx.compose.ui.geometry.Offset(size.width*.57f,size.height*.08f),end=androidx.compose.ui.geometry.Offset(size.width*.57f,size.height*.33f),strokeWidth=stroke.width)
      drawLine(color=c,start=androidx.compose.ui.geometry.Offset(size.width*.57f,size.height*.33f),end=androidx.compose.ui.geometry.Offset(size.width*.82f,size.height*.33f),strokeWidth=stroke.width)
      drawLine(color=c,start=androidx.compose.ui.geometry.Offset(size.width*.40f,size.height*.50f),end=androidx.compose.ui.geometry.Offset(size.width*.69f,size.height*.50f),strokeWidth=stroke.width)
      drawLine(color=c,start=androidx.compose.ui.geometry.Offset(size.width*.40f,size.height*.66f),end=androidx.compose.ui.geometry.Offset(size.width*.69f,size.height*.66f),strokeWidth=stroke.width)
     }
    }
   }

   Column(Modifier.fillMaxSize().navigationBarsPadding()){
    // Real-app banner: edge-to-edge, no artificial card frame around the image.
    Box(
     Modifier
      .fillMaxWidth()
      .aspectRatio(2.7f)
      .clip(RoundedCornerShape(0.dp))
     ){
     AsyncImage(
      RAW_WALLET+banner,
      null,
      Modifier.fillMaxSize(),
      contentScale=ContentScale.FillBounds
     )
     Column(Modifier.padding(start=24.dp,top=26.dp)){
      Text(if(tab==1)"My Diamonds" else "My Coins",fontSize=14.sp,color=Color(0xFFE5E7EB),fontWeight=FontWeight.Medium)
      Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(7.dp)){
       Text(if(tab==1)diamonds.toString() else coins.toString(),fontSize=22.sp,color=Color(0xFFFFD84D),fontWeight=FontWeight.Bold)
       AsyncImage(RAW_WALLET+"file_00000000e56882119c217d508b6733dc.png",null,Modifier.size(20.dp),contentScale=ContentScale.Fit)
      }
     }
    }

    Row(Modifier.fillMaxWidth().padding(horizontal=16.dp).padding(top=18.dp).clip(RoundedCornerShape(30.dp)).background(Color(0x33000000)).padding(4.dp)){
     Tab("Coins",tab==0,Modifier.weight(1f)){tab=0}
     Tab("Diamonds",tab==1,Modifier.weight(1f)){tab=1}
     Tab("Agent",tab==2,Modifier.weight(1f)){tab=2}
    }

    if(tab==0){
     Text("Recharge Coins",Modifier.padding(top=20.dp),fontSize=15.sp,fontWeight=FontWeight.Bold,color=Color(0xFF111827))
     Row(Modifier.fillMaxWidth().padding(top=10.dp)){
      Pack("1,000,000","₹ 100","+Bounce 30,000",Modifier.width(120.dp)){pay=true}
     }
    }else if(tab==1){
     Column(Modifier.fillMaxWidth().padding(horizontal=16.dp).padding(top=20.dp).clip(RoundedCornerShape(16.dp)).background(Color.White).padding(16.dp)){
      Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){
       Text("Exchange",fontSize=15.sp,fontWeight=FontWeight.Bold,color=Color(0xFF111827))
       Text("100 = 🪙 33",fontSize=12.sp,fontWeight=FontWeight.SemiBold,color=Color(0xFF6B7280))
      }
      Row(Modifier.fillMaxWidth().padding(top=12.dp),verticalAlignment=Alignment.CenterVertically){
       Input("Input multiple",din,Modifier.weight(1f)){din=it;cin=((it.toLongOrNull()?:0)*33/100).toString()}
       Text("=",Modifier.padding(horizontal=8.dp),color=Color.LightGray,fontWeight=FontWeight.Bold)
       Input("Coins",cin,Modifier.weight(1f)){cin=it;din=((it.toLongOrNull()?:0)*100/33).toString()}
      }
     }
     Text("Exchange rate",Modifier.padding(horizontal=16.dp).padding(top=18.dp),fontSize=14.sp,fontWeight=FontWeight.Bold,color=Color(0xFF111827))
     Row(Modifier.fillMaxWidth().padding(horizontal=16.dp).padding(top=10.dp),horizontalArrangement=Arrangement.spacedBy(8.dp)){
      listOf("20%","40%","60%","80%","100%").forEach{r->Box(Modifier.weight(1f).height(42.dp).clip(RoundedCornerShape(10.dp)).background(if(rate==r)Color(0xFF0044FF) else Color.White).clickable{rate=r},contentAlignment=Alignment.Center){Text(r,fontSize=12.sp,fontWeight=FontWeight.SemiBold,color=if(rate==r)Color.White else Color(0xFF0044FF))}}
     }
     Spacer(Modifier.height(54.dp))
     Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.Center){
     Box(Modifier.fillMaxWidth(.75f).height(50.dp).clip(RoundedCornerShape(28.dp)).background(Color(0xFF0044FF)).clickable{
      val d=din.toLongOrNull()?:0;val c=cin.toLongOrNull()?:0
      if(d>0&&d<=diamonds&&c>0){diamonds-=d;coins+=c;din="";cin=""}
     },contentAlignment=Alignment.Center){Text("Exchange",color=Color.White,fontWeight=FontWeight.Bold,fontSize=15.sp)}
     }
    }else{
     Row(Modifier.fillMaxWidth().padding(top=20.dp,start=8.dp,end=8.dp),verticalAlignment=Alignment.CenterVertically){
      Box(Modifier.size(48.dp).clip(RoundedCornerShape(50)).background(Color(0xFFE5E7EB)),contentAlignment=Alignment.Center){
       Text("A",fontWeight=FontWeight.Bold,color=Color.Gray,fontSize=17.sp)
      }
      Text("Agent Anmol",Modifier.weight(1f).padding(start=12.dp),fontSize=17.sp,fontWeight=FontWeight.Bold,color=Color(0xFF111827))
      ChatIcon()
     }
    }
   }
  }

  if(pay||payUsing)Box(Modifier.fillMaxSize().background(Color.Black.copy(.40f)).clickable{pay=false;payUsing=false})
  if(pay)PaymentSheet(onClose={pay=false}){pay=false;payUsing=true}
  if(payUsing)PaySheet(onClose={payUsing=false}){coins+=1030000;payUsing=false}
 }
}

@Composable private fun Tab(t:String,s:Boolean,m:Modifier,c:()->Unit){
 Box(m.height(40.dp).clip(RoundedCornerShape(25.dp)).background(if(s)Color.White else Color.Transparent).clickable{c()},contentAlignment=Alignment.Center){
  Text(t,fontSize=13.sp,fontWeight=FontWeight.Bold,color=Color(0xFF111827))
 }
}

@Composable private fun Pack(c:String,p:String,b:String,m:Modifier,on:()->Unit){
 Column(m.aspectRatio(1f).clip(RoundedCornerShape(6.dp)).background(Color.White).clickable{on()}.padding(8.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.Center){
  AsyncImage(RAW_WALLET+"file_00000000e56882119c217d508b6733dc.png",null,Modifier.size(32.dp),contentScale=ContentScale.Fit)
  Text(c,Modifier.padding(top=6.dp),fontSize=17.sp,fontWeight=FontWeight.Bold,color=Color(0xFF111827))
  Text(b,Modifier.padding(top=5.dp).background(Color(0xFFEF4444),RoundedCornerShape(4.dp)).padding(horizontal=5.dp,vertical=3.dp),fontSize=9.sp,color=Color.White,fontWeight=FontWeight.Bold)
  Text(p,Modifier.padding(top=6.dp),fontSize=14.sp,color=Color(0xFF6B7280),fontWeight=FontWeight.Medium)
 }
}

@Composable private fun Input(h:String,v:String,m:Modifier,on:(String)->Unit){
 OutlinedTextField(v,onValueChange=on,modifier=m.height(52.dp),singleLine=true,placeholder={Text(h,fontSize=13.sp,color=Color(0xFF9CA3AF))},shape=RoundedCornerShape(12.dp),colors=OutlinedTextFieldDefaults.colors(focusedBorderColor=Color(0xFF0044FF),unfocusedBorderColor=Color(0xFFE5E7EB),focusedContainerColor=Color(0xFFF9FAFB),unfocusedContainerColor=Color(0xFFF9FAFB),focusedTextColor=Color(0xFF111827),unfocusedTextColor=Color(0xFF111827)),textStyle=LocalTextStyle.current.copy(fontSize=14.sp,fontWeight=FontWeight.Medium))
}

@Composable private fun ChatIcon(){
 Box(Modifier.size(44.dp).clickable{},contentAlignment=Alignment.Center){
  Box(Modifier.size(40.dp).clip(RoundedCornerShape(50)).background(Color(0xFF0044FF)),contentAlignment=Alignment.Center){
   Box(Modifier.size(25.dp).clip(RoundedCornerShape(50)).background(Color.White)){
    Row(Modifier.fillMaxSize().padding(horizontal=5.dp),horizontalArrangement=Arrangement.SpaceEvenly,verticalAlignment=Alignment.CenterVertically){
     repeat(3){Box(Modifier.size(3.dp).clip(RoundedCornerShape(50)).background(Color(0xFF0044FF)))}
    }
   }
  }
 }
}

@Composable private fun PaymentSheet(onClose:()->Unit,onRecharge:()->Unit){
 Box(Modifier.fillMaxSize(),contentAlignment=Alignment.BottomCenter){
  Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(topStart=28.dp,topEnd=28.dp)).background(Color.White).padding(bottom=20.dp)){
   Row(Modifier.fillMaxWidth().padding(vertical=16.dp,horizontal=20.dp),verticalAlignment=Alignment.CenterVertically){
    Spacer(Modifier.width(44.dp));Text("Payment Method",Modifier.weight(1f),textAlign=TextAlign.Center,fontSize=18.sp,fontWeight=FontWeight.Bold)
    Text("×",Modifier.size(44.dp).clickable{onClose()},fontSize=24.sp,textAlign=TextAlign.Center)
   }
   Row(Modifier.fillMaxWidth().padding(horizontal=20.dp).background(Color(0xFFF8F9FA),RoundedCornerShape(12.dp)).padding(14.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.SpaceBetween){
    Column{Text("Coins",fontSize=13.sp,color=Color.Gray);Row(verticalAlignment=Alignment.CenterVertically){AsyncImage(RAW_WALLET+"file_00000000e56882119c217d508b6733dc.png",null,Modifier.size(20.dp));Text("1,030,000",Modifier.padding(start=6.dp),fontSize=18.sp,fontWeight=FontWeight.Bold)}}
    Column(horizontalAlignment=Alignment.End){Text("Price",fontSize=13.sp,color=Color.Gray);Text("₹100.00",fontSize=18.sp,fontWeight=FontWeight.Bold)}
   }
   Text("Select payment method",Modifier.padding(20.dp),fontSize=13.sp,color=Color.Gray)
   Row(Modifier.fillMaxWidth().padding(horizontal=20.dp),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(14.dp)){
    Text("UPI",fontSize=18.sp,fontWeight=FontWeight.Black)
    Text("G",fontSize=17.sp,fontWeight=FontWeight.Bold,color=Color(0xFF4285F4))
    Text("पे",fontSize=13.sp,fontWeight=FontWeight.Bold,color=Color(0xFF5F259F))
    Text("Paytm",fontSize=13.sp,fontWeight=FontWeight.Black,color=Color(0xFF002970))
    Spacer(Modifier.weight(1f));Text("🪙 1,030,000",fontSize=12.sp,fontWeight=FontWeight.SemiBold)
   }
   Button(onClick=onRecharge,Modifier.fillMaxWidth().padding(20.dp),shape=RoundedCornerShape(12.dp),colors=ButtonDefaults.buttonColors(containerColor=Color(0xFF0044FF))){Text("Recharge",fontSize=16.sp,fontWeight=FontWeight.Bold)}
  }
 }
}

@Composable private fun PaySheet(onClose:()->Unit,onSelect:()->Unit){
 Box(Modifier.fillMaxSize(),contentAlignment=Alignment.BottomCenter){
  Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(topStart=28.dp,topEnd=28.dp)).background(Color.White).padding(bottom=20.dp)){
   Row(Modifier.fillMaxWidth().padding(16.dp),verticalAlignment=Alignment.CenterVertically){
    Spacer(Modifier.weight(1f));Text("Pay Using",Modifier.weight(2f),textAlign=TextAlign.Center,fontSize=17.sp,fontWeight=FontWeight.Bold);Text("×",Modifier.weight(1f).clickable{onClose()},fontSize=24.sp,textAlign=TextAlign.Center)
   }
   listOf("GPay","PhonePe","Paytm","Other").forEachIndexed{idx,n->
    Row(Modifier.fillMaxWidth().clickable{onSelect()}.padding(horizontal=20.dp,vertical=14.dp),verticalAlignment=Alignment.CenterVertically){
     Box(Modifier.size(44.dp).clip(RoundedCornerShape(50)).background(if(n=="PhonePe")Color(0xFF5F259F) else Color(0xFFF3F4F6)),contentAlignment=Alignment.Center){
      Text(if(n=="GPay")"G" else if(n=="PhonePe")"पे" else if(n=="Paytm")"Paytm" else "…",fontWeight=FontWeight.Bold,color=if(n=="PhonePe")Color.White else Color(0xFF111827),fontSize=if(n=="Paytm")11.sp else 17.sp)
     }
     Text(n,Modifier.padding(start=16.dp),fontSize=16.sp,color=Color(0xFF111827))
    }
    if(idx<3)HorizontalDivider(color=Color(0xFFF3F4F6))
   }
  }
 }
}
