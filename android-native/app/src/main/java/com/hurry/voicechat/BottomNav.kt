package com.hurry.voicechat

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun HurryBottomNav(tab:HurryTab, onTab:(HurryTab)->Unit) {
    Row(Modifier.fillMaxWidth().height(66.dp).background(Color.White),
        horizontalArrangement=Arrangement.SpaceEvenly, verticalAlignment=Alignment.CenterVertically) {
        NavItem(HurryTab.HOME, tab, onTab, "Home")
        NavItem(HurryTab.MESSAGE, tab, onTab, "Message")
        NavItem(HurryTab.ME, tab, onTab, "Me")
    }
}
@Composable private fun NavItem(which:HurryTab, selected:HurryTab, onTab:(HurryTab)->Unit, label:String) {
    Column(Modifier.width(92.dp).clickable{onTab(which)}, horizontalAlignment=Alignment.CenterHorizontally) {
        when(which) {
            HurryTab.HOME -> HurryHomeIcon(which==selected)
            HurryTab.MESSAGE -> HurryMessageIcon(which==selected)
            HurryTab.ME -> HurryMeIcon(which==selected)
        }
        Text(label, fontSize=11.sp, color=if(which==selected) HurryText else HurryMuted)
    }
}
