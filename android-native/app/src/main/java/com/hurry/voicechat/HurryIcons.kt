package com.hurry.voicechat

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
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

        // Clean real-app style home: peaked roof, softly rounded body,
        // and a single centered doorway — no square/box outline.
        val p = Path().apply {
            moveTo(size.width * .10f, size.height * .47f)
            lineTo(size.width * .50f, size.height * .12f)
            lineTo(size.width * .90f, size.height * .47f)
            moveTo(size.width * .20f, size.height * .40f)
            lineTo(size.width * .20f, size.height * .78f)
            quadraticBezierTo(
                size.width * .20f, size.height * .88f,
                size.width * .30f, size.height * .88f
            )
            lineTo(size.width * .70f, size.height * .88f)
            quadraticBezierTo(
                size.width * .80f, size.height * .88f,
                size.width * .80f, size.height * .78f
            )
            lineTo(size.width * .80f, size.height * .40f)
        }

        drawPath(
            path = p,
            color = c,
            style = Stroke(width = stroke, cap = StrokeCap.Round, join = StrokeJoin.Round)
        )
        drawRoundRect(
            color = c,
            topLeft = Offset(size.width * .40f, size.height * .63f),
            size = androidx.compose.ui.geometry.Size(size.width * .20f, size.height * .25f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(2.5.dp.toPx()),
            style = Stroke(width = stroke, cap = StrokeCap.Round)
        )
    }
}

@Composable
fun HurryMessageIcon(active: Boolean, modifier: Modifier = Modifier) {
    Canvas(modifier.size(25.dp)) {
        val c = if (active) HurryBlue else Color(0xFF303030)
        drawRoundRect(color = c, topLeft = Offset(size.width*.12f,size.height*.16f),
            size = androidx.compose.ui.geometry.Size(size.width*.76f,size.height*.66f),
            cornerRadius = androidx.compose.ui.geometry.CornerRadius(4.dp.toPx()),
            style = Stroke(2.1.dp.toPx()))
        drawLine(color = c, start = Offset(size.width*.25f,size.height*.39f), end = Offset(size.width*.75f,size.height*.39f), strokeWidth = 2.dp.toPx(), cap = StrokeCap.Round)
        drawLine(color = c, start = Offset(size.width*.25f,size.height*.58f), end = Offset(size.width*.62f,size.height*.58f), strokeWidth = 2.dp.toPx(), cap = StrokeCap.Round)
    }
}

@Composable
fun HurryMeIcon(active: Boolean, modifier: Modifier = Modifier) {
    Canvas(modifier.size(25.dp)) {
        val c = if (active) HurryBlue else Color(0xFF303030)
        drawCircle(color = c, radius = size.minDimension*.22f, center = Offset(size.width*.5f,size.height*.32f), style = Stroke(width = 2.1.dp.toPx()))
        drawRoundRect(color = c, topLeft=Offset(size.width*.2f,size.height*.58f),
            size=androidx.compose.ui.geometry.Size(size.width*.6f,size.height*.27f),
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
