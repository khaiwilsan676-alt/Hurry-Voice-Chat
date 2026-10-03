package com.hurry.voicechat

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Path
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

@Composable
fun HurryHomeIcon(active: Boolean, modifier: Modifier = Modifier) {
    Canvas(modifier.size(25.dp)) {
        val c = if (active) HurryBlue else Color(0xFF303030)
        val p = Path().apply {
            moveTo(size.width * .12f, size.height * .48f)
            lineTo(size.width * .5f, size.height * .14f)
            lineTo(size.width * .88f, size.height * .48f)
            lineTo(size.width * .82f, size.height * .48f)
            lineTo(size.width * .82f, size.height * .88f)
            lineTo(size.width * .18f, size.height * .88f)
            lineTo(size.width * .18f, size.height * .48f)
        }
        drawPath(p, c, style = Stroke(2.1.dp.toPx(), join = StrokeJoin.Round))
        drawLine(c, Offset(size.width*.43f,size.height*.88f), Offset(size.width*.43f,size.height*.61f), 2.1.dp.toPx(), StrokeCap.Round)
        drawLine(c, Offset(size.width*.57f,size.height*.88f), Offset(size.width*.57f,size.height*.61f), 2.1.dp.toPx(), StrokeCap.Round)
    }
}

@Composable
fun HurryMessageIcon(active: Boolean, modifier: Modifier = Modifier) {
    Canvas(modifier.size(25.dp)) {
        val c = if (active) HurryBlue else Color(0xFF303030)
        drawRoundRect(c, topLeft = Offset(size.width*.12f,size.height*.16f),
            size = androidx.compose.ui.geometry.Size(size.width*.76f,size.height*.66f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(4.dp.toPx()),
            style = Stroke(2.1.dp.toPx()))
        drawLine(c, Offset(size.width*.25f,size.height*.39f), Offset(size.width*.75f,size.height*.39f), 2.dp.toPx(), StrokeCap.Round)
        drawLine(c, Offset(size.width*.25f,size.height*.58f), Offset(size.width*.62f,size.height*.58f), 2.dp.toPx(), StrokeCap.Round)
    }
}

@Composable
fun HurryMeIcon(active: Boolean, modifier: Modifier = Modifier) {
    Canvas(modifier.size(25.dp)) {
        val c = if (active) HurryBlue else Color(0xFF303030)
        drawCircle(c, size.minDimension*.22f, Offset(size.width*.5f,size.height*.32f), style=Stroke(2.1.dp.toPx()))
        drawRoundRect(c, topLeft=Offset(size.width*.2f,size.height*.58f),
            size=androidx.compose.ui.geometry.Size(size.width*.6f,size.height*.27f),
            cornerRadius=androidx.compose.ui.geometry.CornerRadius(8.dp.toPx()),
            style=Stroke(2.1.dp.toPx()))
    }
}

@Composable
fun HurrySearchIcon(modifier: Modifier = Modifier) {
    Canvas(modifier.size(23.dp)) {
        val c = Color(0xFF222222)
        drawCircle(c, size.minDimension*.34f, Offset(size.width*.43f,size.height*.43f), style=Stroke(2.1.dp.toPx()))
        drawLine(c, Offset(size.width*.68f,size.height*.68f), Offset(size.width*.9f,size.height*.9f), 2.1.dp.toPx(), StrokeCap.Round)
    }
}
