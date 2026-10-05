package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
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

private const val RAW_WALLET = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"

@Composable
fun CoinsNativePage(onBack: () -> Unit) = RechargeNativePage(onBack, false)

@Composable
fun DiamondsNativePage(onBack: () -> Unit) = RechargeNativePage(onBack, true)

@Composable
private fun RechargeNativePage(onBack: () -> Unit, diamondsTab: Boolean) {
    var activeTab by remember { mutableStateOf(if (diamondsTab) 1 else 0) }
    val banner = if (activeTab == 0) "file_00000000f3d88211964f0057da4bc797.png" else "file_0000000085a482088fb089cb76f3d1af.png"

    Column(Modifier.fillMaxSize().background(Color(0xFFF3F4F6))) {
        Box(
            Modifier.fillMaxWidth().background(Color(0xFF1A66FF))
                .statusBarsPadding().height(48.dp)
        ) {
            Text("‹", Modifier.align(Alignment.CenterStart).padding(start = 12.dp),
                fontSize = 38.sp, color = Color.White)
            Text("Recharge", Modifier.align(Alignment.Center),
                fontSize = 17.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Text("▤", Modifier.align(Alignment.CenterEnd).padding(end = 16.dp),
                fontSize = 22.sp, color = Color.White)
        }

        Column(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
            AsyncImage(
                model = RAW_WALLET + banner,
                contentDescription = null,
                modifier = Modifier.fillMaxWidth().height(154.dp),
                contentScale = ContentScale.Crop
            )

            Row(
                Modifier.fillMaxWidth().padding(top = 14.dp).clip(RoundedCornerShape(30.dp))
                    .background(Color(0x33000000)).padding(4.dp)
            ) {
                RechargeTab("Coins", activeTab == 0, Modifier.weight(1f)) { activeTab = 0 }
                RechargeTab("Diamonds", activeTab == 1, Modifier.weight(1f)) { activeTab = 1 }
                RechargeTab("Agent", activeTab == 2, Modifier.weight(1f)) { activeTab = 2 }
            }

            Spacer(Modifier.height(14.dp))

            if (activeTab == 0) {
                Text("My Coins", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color(0xFF6B7280))
                Text("0", fontSize = 25.sp, fontWeight = FontWeight.Bold, color = Color(0xFF111827))
                Spacer(Modifier.height(12.dp))
                Text("Recharge Coins", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                RechargeOption("100 Coins", "₹10", Modifier.fillMaxWidth())
                RechargeOption("500 Coins", "₹50", Modifier.fillMaxWidth())
                RechargeOption("1,000 Coins", "₹100", Modifier.fillMaxWidth())
                Spacer(Modifier.height(14.dp))
                Text("Payment Method", fontSize = 12.sp, fontWeight = FontWeight.Medium, color = Color(0xFF6B7280))
                Text("UPI   GPay   PhonePe   Paytm", fontSize = 15.sp, fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(top = 8.dp))
            } else if (activeTab == 1) {
                Text("My Diamonds", fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color(0xFF6B7280))
                Text("0", fontSize = 25.sp, fontWeight = FontWeight.Bold, color = Color(0xFF111827))
                Spacer(Modifier.height(12.dp))
                Text("Exchange", fontSize = 15.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Text("Diamonds", fontSize = 12.sp, color = Color(0xFF6B7280))
                Spacer(Modifier.height(6.dp))
                Box(Modifier.fillMaxWidth().height(48.dp).background(Color.White, RoundedCornerShape(12.dp))) {
                    Text("Enter diamonds", Modifier.align(Alignment.CenterStart).padding(start = 16.dp), color = Color(0xFF9CA3AF))
                }
                Spacer(Modifier.height(12.dp))
                Text("exchange rate", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF6B7280))
                Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("20%","40%","60%","80%","100%").forEach {
                        Box(Modifier.weight(1f).height(38.dp).background(Color.White, RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center) {
                            Text(it, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0044FF))
                        }
                    }
                }
                Spacer(Modifier.height(24.dp))
                Box(Modifier.fillMaxWidth(.75f).height(48.dp).align(Alignment.CenterHorizontally)
                    .background(Color(0xFF0044FF), RoundedCornerShape(28.dp)), contentAlignment = Alignment.Center) {
                    Text("Exchange", color = Color.White, fontWeight = FontWeight.Bold)
                }
            } else {
                Text("Agent", fontSize = 18.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
private fun RechargeTab(label: String, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    Box(modifier.height(40.dp).clip(RoundedCornerShape(25.dp))
        .background(if (selected) Color.Black else Color.Transparent)
        .clickable { onClick() }, contentAlignment = Alignment.Center) {
        Text(label, fontSize = 13.sp, fontWeight = FontWeight.Bold,
            color = if (selected) Color.White else Color.Black)
    }
}

@Composable
private fun RechargeOption(title: String, price: String, modifier: Modifier) {
    Row(modifier.padding(vertical = 5.dp).background(Color.White, RoundedCornerShape(12.dp))
        .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalAlignment = Alignment.CenterVertically) {
        Text(title, Modifier.weight(1f), fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
        Text(price, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0044FF))
    }
}
