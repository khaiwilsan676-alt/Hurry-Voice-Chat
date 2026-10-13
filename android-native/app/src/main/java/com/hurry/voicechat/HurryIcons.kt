package com.hurry.voicechat

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

@Composable
fun HurryHomeIcon(active: Boolean, modifier: Modifier = Modifier) {
    Canvas(modifier.size(25.dp)) {
        val c = if (active) HurryBlue else Color(0xFF303030)
        val stroke = 2.1.dp.toPx()
        val p = Path().apply {
            moveTo(size.width * .10f, size.height * .47f)
            lineTo(size.width * .50f, size.height * .12f)
            lineTo(size.width * .90f, size.height * .47f)
            moveTo(size.width * .20f, size.height * .40f)
            lineTo(size.width * .20f, size.height * .78f)
            quadraticBezierTo(size.width * .20f, size.height * .88f, size.width * .30f, size.height * .88f)
            lineTo(size.width * .70f, size.height * .88f)
            quadraticBezierTo(size.width * .80f, size.height * .88f, size.width * .80f, size.height * .78f)
            lineTo(size.width * .80f, size.height * .40f)
        }
        drawPath(p, c, style = Stroke(stroke, cap = StrokeCap.Round, join = StrokeJoin.Round))
        drawRoundRect(c, Offset(size.width * .40f, size.height * .63f), Size(size.width * .20f, size.height * .25f),
            androidx.compose.ui.geometry.CornerRadius(2.5.dp.toPx()), style = Stroke(stroke, cap = StrokeCap.Round))
    }
}

@Composable
fun HurryMessageIcon(active: Boolean, modifier: Modifier = Modifier) {
    Canvas(modifier.size(25.dp)) {
        val c = if (active) HurryBlue else Color(0xFF303030)
        val w = size.width
        val h = size.height
        val p = Path().apply {
            moveTo(w * .27f, h * .13f)
            lineTo(w * .73f, h * .13f)
            cubicTo(w * .84f, h * .13f, w * .90f, h * .21f, w * .90f, h * .32f)
            lineTo(w * .90f, h * .57f)
            cubicTo(w * .90f, h * .68f, w * .83f, h * .75f, w * .71f, h * .75f)
            lineTo(w * .59f, h * .75f)
            lineTo(w * .48f, h * .90f)
            cubicTo(w * .45f, h * .94f, w * .40f, h * .92f, w * .40f, h * .87f)
            lineTo(w * .37f, h * .75f)
            lineTo(w * .27f, h * .75f)
            cubicTo(w * .15f, h * .75f, w * .10f, h * .68f, w * .10f, h * .57f)
            lineTo(w * .10f, h * .32f)
            cubicTo(w * .10f, h * .21f, w * .16f, h * .13f, w * .27f, h * .13f)
            close()
        }
        drawPath(p, c, style = Stroke(width = 2.1.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
        drawLine(c, Offset(w * .27f, h * .36f), Offset(w * .72f, h * .36f), 1.8.dp.toPx(), cap = StrokeCap.Round)
        drawLine(c, Offset(w * .27f, h * .52f), Offset(w * .60f, h * .52f), 1.8.dp.toPx(), cap = StrokeCap.Round)
    }
}

@Composable
fun HurryMeIcon(active: Boolean, modifier: Modifier = Modifier) {
    Canvas(modifier.size(25.dp)) {
        val c = if (active) HurryBlue else Color(0xFF303030)
        drawCircle(color = c, radius = size.minDimension*.22f, center = Offset(size.width*.5f,size.height*.32f), style = Stroke(width = 2.1.dp.toPx()))
        drawRoundRect(color = c, topLeft=Offset(size.width*.2f,size.height*.58f),
            size=Size(size.width*.6f,size.height*.27f),
            cornerRadius=androidx.compose.ui.geometry.CornerRadius(8.dp.toPx()),
            style=Stroke(2.1.dp.toPx()))
    }
}

@Composable
fun HurrySearchIcon(modifier: Modifier = Modifier) {
    Canvas(modifier.size(26.dp)) {
        val c = Color(0xFF222222)
        drawCircle(color = c, radius = size.minDimension*.25f, center = Offset(size.width*.446f,size.height*.446f), style = Stroke(width = 2.1.dp.toPx()))
        drawLine(color = c, start = Offset(size.width*.65f,size.height*.65f), end = Offset(size.width*.86f,size.height*.86f), strokeWidth = 2.1.dp.toPx(), cap = StrokeCap.Round)
    }
}
