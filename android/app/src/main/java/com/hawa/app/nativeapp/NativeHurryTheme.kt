package com.hawa.app.nativeapp

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val HurryColors = darkColorScheme(
    primary = Color(0xFF4A6CFF),
    secondary = Color(0xFF7C4DFF),
    background = Color(0xFF08090D),
    surface = Color(0xFF11131A),
    onBackground = Color.White,
    onSurface = Color.White
)

@Composable
fun NativeHurryTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = HurryColors,
        content = content
    )
}
