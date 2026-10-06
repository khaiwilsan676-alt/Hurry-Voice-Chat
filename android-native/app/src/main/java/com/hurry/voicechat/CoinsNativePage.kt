package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
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
       moveTo(size.width*.58f,size.height*.08f)
       lineTo(size.width*.27f,size.height*.08f)
       cubicTo(size.width*.18f,size.height*.08f,size.width*.14f,size.height*.13f,size.width*.14f,size.height*.23f)
       lineTo(size.width*.14f,size.height*.87f)
       cubicTo(size.width*.14f,size.height*.96f,size.width*.19f,size.height*.99f,size.width*.28f,size.height*.99f)
       lineTo(size.width*.79f,size.height*.99f)
       cubicTo(size.width*.88f,size.height*.99f,size.width*.92f,size.height*.94f,size.width*.92f,size.height*.85f)
       lineTo(size.width*.92f,size.height*.34f)
       close()
      }
      drawPath(path=p,color=c,style=stroke)
      drawLine(color=c,start=androidx.compose.ui.geometry.Offset(size.width*.58f,size.height*.08f),end=androidx.compose.ui.geometry.Offset(size.width*.58f,size.height*.34f),strokeWidth=stroke.width)
      drawLine(color=c,start=androidx.compose.ui.geometry.Offset(size.width*.58f,size.height*.34f),end=androidx.compose.ui.geometry.Offset(size.width*.92f,size.height*.34f),strokeWidth=stroke.width)
      drawLine(color=c,start=androidx.compose.ui.geometry.Offset(size.width*.36f,size.height*.51f),end=androidx.compose.ui.geometry.Offset(size.width*.70f,size.height*.51f),strokeWidth=stroke.width)
      drawLine(color=c,start=androidx.compose.ui.geometry.Offset(size.width*.36f,size.height*.68f),end=androidx.compose.ui.geometry.Offset(size.width*.70f,size.height*.68f),strokeWidth=stroke.width)
     }
    }
   }

   Column(Modifier.fillMaxSize().navigationBarsPadding()){
    // Real-app banner: edge-to-edge, no artificial card frame around the image.
    Box(
     Modifier
      .fillMaxWidth()
      .wrapContentHeight()
      .clip(RoundedCornerShape(0.dp))
     ){
     AsyncImage(
      RAW_WALLET+banner,
      null,
      Modifier.fillMaxWidth().wrapContentHeight(),
      contentScale=ContentScale.Fit
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
     Column(Modifier.fillMaxWidth().padding(top=20.dp).clip(RoundedCornerShape(12.dp)).background(Color.White).padding(16.dp)){
      Row(Modifier.fillMaxWidth().padding(bottom=12.dp),horizontalArrangement=Arrangement.SpaceBetween,verticalAlignment=Alignment.CenterVertically){
       Text("Exchange",fontSize=12.sp,fontWeight=FontWeight.Bold,color=Color(0xFF1F2937))
       Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(4.dp)){
        Text("100 =",fontSize=11.sp,fontWeight=FontWeight.SemiBold,color=Color(0xFF6B7280))
        AsyncImage(RAW_WALLET+"file_00000000e56882119c217d508b6733dc.png",null,Modifier.size(14.dp),contentScale=ContentScale.Fit)
        Text("33",fontSize=11.sp,fontWeight=FontWeight.SemiBold,color=Color(0xFF6B7280))
       }
      }
      Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)){
       Input("Input multiple",din,Modifier.weight(1f)){din=it;cin=((it.toLongOrNull()?:0)*33/100).toString()}
       Text("=",color=Color(0xFFD1D5DB),fontWeight=FontWeight.Bold)
       Input("Coins",cin,Modifier.weight(1f)){cin=it;din=((it.toLongOrNull()?:0)*100/33).toString()}
      }
     }
     Column(Modifier.fillMaxWidth().padding(horizontal=16.dp).padding(top=4.dp)){
      Text("exchange rate",fontSize=11.sp,fontWeight=FontWeight.Bold,color=Color(0xFF6B7280))
      Row(Modifier.fillMaxWidth().padding(top=8.dp),horizontalArrangement=Arrangement.spacedBy(8.dp)){
       listOf("20%","40%","60%","80%","100%").forEachIndexed{index,r->
        Box(
         Modifier
          .weight(1f)
          .height(38.dp)
          .clip(RoundedCornerShape(12.dp))
          .background(if(rate==r)Color(0xFF0044FF) else Color.White)
          .clickable{rate=r},
         contentAlignment=Alignment.Center
        ){
         Text(r,fontSize=12.sp,fontWeight=FontWeight.Bold,color=if(rate==r)Color.White else Color(0xFF0044FF))
        }
       }
      }
     }
     Spacer(Modifier.weight(1f))
     Row(Modifier.fillMaxWidth().padding(bottom=16.dp),horizontalArrangement=Arrangement.Center){
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
 Column(
  m
   .width(120.dp)
   .aspectRatio(1f)
   .clip(RoundedCornerShape(6.dp))
   .background(Color.White)
   .clickable{on()}
   .padding(8.dp),
  horizontalAlignment=Alignment.CenterHorizontally,
  verticalArrangement=Arrangement.Center
 ){
  AsyncImage(
   RAW_WALLET+"file_00000000e56882119c217d508b6733dc.png",
   null,
   Modifier.size(32.dp),
   contentScale=ContentScale.Fit
  )
  Text(c,Modifier.padding(top=6.dp),fontSize=17.sp,fontWeight=FontWeight.Bold,color=Color(0xFF111827),lineHeight=17.sp)
  Text(
   b,
   Modifier
    .padding(top=5.dp)
    .background(Color(0xFFEF4444),RoundedCornerShape(4.dp))
    .padding(horizontal=5.dp,vertical=3.dp),
   fontSize=9.sp,
   color=Color.White,
   fontWeight=FontWeight.Bold,
   lineHeight=9.sp
  )
  Text(p,Modifier.padding(top=6.dp),fontSize=14.sp,color=Color(0xFF6B7280),fontWeight=FontWeight.Medium,lineHeight=14.sp)
 }
}

@Composable private fun Input(h:String,v:String,m:Modifier,on:(String)->Unit){
 OutlinedTextField(v,onValueChange=on,modifier=m.height(52.dp),singleLine=true,placeholder={Text(h,fontSize=13.sp,color=Color(0xFF9CA3AF))},shape=RoundedCornerShape(12.dp),colors=OutlinedTextFieldDefaults.colors(focusedBorderColor=Color(0xFF0044FF),unfocusedBorderColor=Color(0xFFE5E7EB),focusedContainerColor=Color(0xFFF9FAFB),unfocusedContainerColor=Color(0xFFF9FAFB),focusedTextColor=Color(0xFF111827),unfocusedTextColor=Color(0xFF111827)),textStyle=LocalTextStyle.current.copy(fontSize=14.sp,fontWeight=FontWeight.Medium))
}

@Composable private fun ChatIcon(){
 Box(Modifier.size(44.dp).clickable{},contentAlignment=Alignment.Center){
  Box(Modifier.size(32.dp).clip(RoundedCornerShape(50)).background(Color(0xFF0044FF)),contentAlignment=Alignment.Center){
   Box(Modifier.size(19.dp).clip(RoundedCornerShape(50)).background(Color.White)){
    Row(Modifier.fillMaxSize().padding(horizontal=3.dp),horizontalArrangement=Arrangement.SpaceEvenly,verticalAlignment=Alignment.CenterVertically){
     repeat(3){Box(Modifier.size(3.dp).clip(RoundedCornerShape(50)).background(Color(0xFF0044FF)))}
    }
   }
   Box(
    Modifier
     .size(6.dp)
     .offset(x=(-5).dp,y=7.dp)
     .rotate(45f)
     .background(Color.White)
   )
  }
 }
}

@Composable private fun PaymentSheet(onClose:()->Unit,onRecharge:()->Unit){
 Box(Modifier.fillMaxSize().clickable{onClose()},contentAlignment=Alignment.BottomCenter){
  Column(
   Modifier
    .fillMaxWidth()
    .clickable(enabled=false){}
    .clip(RoundedCornerShape(topStart=28.dp,topEnd=28.dp))
    .background(Color.White)
  ){
   Row(
    Modifier.fillMaxWidth().padding(horizontal=20.dp,vertical=16.dp),
    verticalAlignment=Alignment.CenterVertically
   ){
    Text("Payment Method",Modifier.weight(1f),textAlign=TextAlign.Center,fontSize=18.sp,fontWeight=FontWeight.Bold,color=Color(0xFF111827))
    Row(
     Modifier.clip(RoundedCornerShape(6.dp)).background(Color(0xFFF3F4F6)).padding(horizontal=8.dp,vertical=4.dp),
     verticalAlignment=Alignment.CenterVertically
    ){
     Text("🇮🇳",fontSize=12.sp)
     Text("in",Modifier.padding(start=5.dp),fontSize=13.sp,fontWeight=FontWeight.Medium,color=Color(0xFF374151))
    }
   }
   Row(
    Modifier.fillMaxWidth().padding(horizontal=20.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFFF8F9FA)).padding(14.dp),
    verticalAlignment=Alignment.CenterVertically,
    horizontalArrangement=Arrangement.SpaceBetween
   ){
    Column{
     Text("Coins",fontSize=13.sp,color=Color(0xFF6B7280),fontWeight=FontWeight.Medium)
     Row(Modifier.padding(top=4.dp),verticalAlignment=Alignment.CenterVertically){
      AsyncImage(RAW_WALLET+"file_00000000e56882119c217d508b6733dc.png",null,Modifier.size(20.dp),contentScale=ContentScale.Fit)
      Text("1,030,000",Modifier.padding(start=6.dp),fontSize=18.sp,fontWeight=FontWeight.Bold,color=Color(0xFF111827))
     }
    }
    Column(horizontalAlignment=Alignment.End){
     Text("Price",fontSize=13.sp,color=Color(0xFF6B7280),fontWeight=FontWeight.Medium)
     Text("₹100.00",Modifier.padding(top=4.dp),fontSize=18.sp,fontWeight=FontWeight.Bold,color=Color(0xFF111827))
    }
   }
   Text("Select payment method",Modifier.padding(start=20.dp,top=16.dp,bottom=14.dp),fontSize=13.sp,color=Color(0xFF6B7280),fontWeight=FontWeight.Medium)
   Row(
    Modifier.fillMaxWidth().padding(horizontal=20.dp),
    verticalAlignment=Alignment.CenterVertically
   ){
    Text("UPI",fontSize=18.sp,fontWeight=FontWeight.Black,color=Color(0xFF1F2937))
    Box(Modifier.padding(start=10.dp).size(18.dp),contentAlignment=Alignment.Center){
     Text("G",fontSize=17.sp,fontWeight=FontWeight.Bold,color=Color(0xFF4285F4))
    }
    Box(Modifier.padding(start=8.dp).size(18.dp).clip(RoundedCornerShape(4.dp)).background(Color(0xFF5F259F)),contentAlignment=Alignment.Center){
     Text("पे",fontSize=10.sp,fontWeight=FontWeight.Bold,color=Color.White)
    }
    Text("Paytm",Modifier.padding(start=8.dp),fontSize=13.sp,fontWeight=FontWeight.Black,color=Color(0xFF002970))
    Spacer(Modifier.weight(1f))
    Row(verticalAlignment=Alignment.CenterVertically){
     AsyncImage(RAW_WALLET+"file_00000000e56882119c217d508b6733dc.png",null,Modifier.size(16.dp),contentScale=ContentScale.Fit)
     Text("1,030,000",Modifier.padding(start=4.dp),fontSize=12.sp,fontWeight=FontWeight.SemiBold,color=Color(0xFF111827))
    }
    Box(Modifier.padding(start=12.dp).size(20.dp).clip(RoundedCornerShape(50)).border(2.dp,Color(0xFF22C55E),RoundedCornerShape(50)),contentAlignment=Alignment.Center){
     Box(Modifier.size(10.dp).clip(RoundedCornerShape(50)).background(Color(0xFF22C55E)))
    }
   }
   Box(
    Modifier.fillMaxWidth().padding(horizontal=20.dp,vertical=20.dp).height(50.dp).clip(RoundedCornerShape(12.dp)).background(Color(0xFF0044FF)).clickable{onRecharge()},
    contentAlignment=Alignment.Center
   ){
    Text("Recharge",fontSize=16.sp,fontWeight=FontWeight.Bold,color=Color.White)
   }
  }
 }
}

@Composable private fun PaySheet(onClose:()->Unit,onSelect:()->Unit){
 Box(Modifier.fillMaxSize().clickable{onClose()},contentAlignment=Alignment.BottomCenter){
  Column(
   Modifier
    .fillMaxWidth()
    .clickable(enabled=false){}
    .clip(RoundedCornerShape(topStart=24.dp,topEnd=24.dp))
    .background(Color.White)
    .padding(bottom=8.dp)
  ){
   Row(
    Modifier.fillMaxWidth().padding(vertical=16.dp,horizontal=16.dp).border(1.dp,Color(0xFFF3F4F6),RoundedCornerShape(topStart=24.dp,topEnd=24.dp)),
    verticalAlignment=Alignment.CenterVertically
   ){
    Spacer(Modifier.weight(1f))
    Text("Pay Using",Modifier.weight(2f),textAlign=TextAlign.Center,fontSize=17.sp,fontWeight=FontWeight.Bold,color=Color(0xFF111827))
    Box(Modifier.weight(1f),contentAlignment=Alignment.CenterEnd){
     Text("×",Modifier.size(28.dp).clickable{onClose()},fontSize=24.sp,color=Color(0xFF111827),textAlign=TextAlign.Center)
    }
   }
   Column(Modifier.fillMaxWidth().padding(horizontal=20.dp)){
    Row(Modifier.fillMaxWidth().clickable{onSelect()}.padding(vertical=16.dp),verticalAlignment=Alignment.CenterVertically){
     Box(Modifier.size(44.dp).clip(RoundedCornerShape(50)).background(Color.White).border(1.dp,Color(0xFFE5E7EB),RoundedCornerShape(50)),contentAlignment=Alignment.Center){
      androidx.compose.foundation.Image(
       painter=androidx.compose.ui.res.painterResource(com.hurry.voicechat.R.drawable.ic_gpay),
       contentDescription=null,
       modifier=Modifier.size(22.dp)
      )
     }
     Text("GPay",Modifier.padding(start=16.dp),fontSize=16.sp,fontWeight=FontWeight.Medium,color=Color(0xFF111827))
    }
    HorizontalDivider(color=Color(0xFFF9FAFB))
    Row(Modifier.fillMaxWidth().clickable{onSelect()}.padding(vertical=16.dp),verticalAlignment=Alignment.CenterVertically){
     Box(Modifier.size(44.dp).clip(RoundedCornerShape(50)),contentAlignment=Alignment.Center){
      Box(Modifier.fillMaxSize().clip(RoundedCornerShape(12.dp)).background(Color(0xFF5F259F)),contentAlignment=Alignment.Center){
       Text("पे",fontSize=26.sp,fontWeight=FontWeight.Bold,color=Color.White,lineHeight=26.sp)
      }
     }
     Text("PhonePe",Modifier.padding(start=16.dp),fontSize=16.sp,fontWeight=FontWeight.Medium,color=Color(0xFF111827))
    }
    HorizontalDivider(color=Color(0xFFF9FAFB))
    Row(Modifier.fillMaxWidth().clickable{onSelect()}.padding(vertical=16.dp),verticalAlignment=Alignment.CenterVertically){
     Box(Modifier.size(44.dp).clip(RoundedCornerShape(50)).background(Color.White).border(1.dp,Color(0xFFE5E7EB),RoundedCornerShape(50)),contentAlignment=Alignment.Center){
      Row{
       Text("Pay",fontSize=15.sp,fontWeight=FontWeight.Black,color=Color(0xFF002970))
       Text("tm",fontSize=15.sp,fontWeight=FontWeight.Black,color=Color(0xFF00BAF2))
      }
     }
     Text("Paytm",Modifier.padding(start=16.dp),fontSize=16.sp,fontWeight=FontWeight.Medium,color=Color(0xFF111827))
    }
    HorizontalDivider(color=Color(0xFFF9FAFB))
    Row(Modifier.fillMaxWidth().clickable{onSelect()}.padding(vertical=16.dp),verticalAlignment=Alignment.CenterVertically){
     Box(Modifier.size(44.dp).clip(RoundedCornerShape(50)).background(Color(0xFFF3F4F6)),contentAlignment=Alignment.Center){
      Text("...",fontSize=17.sp,fontWeight=FontWeight.Black,color=Color(0xFF9CA3AF))
     }
     Text("Other",Modifier.padding(start=16.dp),fontSize=16.sp,fontWeight=FontWeight.Medium,color=Color(0xFF111827))
    }
   }
  }
 }
}
