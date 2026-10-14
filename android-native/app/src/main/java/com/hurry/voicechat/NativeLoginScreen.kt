package com.hurry.voicechat

import android.provider.Settings
import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import androidx.compose.foundation.background
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import coil3.compose.AsyncImage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

private const val HURRY_FIREBASE_API_KEY = "AIzaSyBNTxdeuqc3F7R4eyjmwdQqQ2YWv9-9yv4"
private const val HURRY_API_BASE = "https://hurry-voice-chat-lz75.onrender.com"
private const val HURRY_VIDEO = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/VID_20260804_011114_027_bsl.mp4"
private const val HURRY_LOGO = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/image_20261014_125545-iss-logo-ko-dekh-yr-iski-body-position-dekh-or-han-right-wale-hand-lion-ke-fol.jpg"

@Composable
fun NativeLoginScreen(onLoginSuccess: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var page by remember { mutableStateOf("welcome") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var showGoogleSetupMessage by remember { mutableStateOf(false) }
    var showPrivacyPolicy by remember { mutableStateOf(false) }

    Box(Modifier.fillMaxSize().background(Color(0xFF111827))) {
        val backgroundPlayer = remember(context) {
            ExoPlayer.Builder(context).build().apply {
                setMediaItem(MediaItem.fromUri(Uri.parse(HURRY_VIDEO)))
                repeatMode = Player.REPEAT_MODE_ONE
                volume = 0f
                playWhenReady = true
                prepare()
            }
        }
        DisposableEffect(backgroundPlayer) {
            onDispose { backgroundPlayer.release() }
        }
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                PlayerView(ctx).apply {
                    player = backgroundPlayer
                    useController = false
                    resizeMode = AspectRatioFrameLayout.RESIZE_MODE_ZOOM
                    setShutterBackgroundColor(android.graphics.Color.TRANSPARENT)
                    setBackgroundColor(android.graphics.Color.TRANSPARENT)
                    isClickable = false
                    isFocusable = false
                }
            },
            update = { view ->
                if (view.player !== backgroundPlayer) view.player = backgroundPlayer
                if (backgroundPlayer.playbackState == Player.STATE_IDLE) backgroundPlayer.prepare()
                if (!backgroundPlayer.isPlaying) backgroundPlayer.play()
            }
        )
        Box(Modifier.fillMaxSize().background(Color.Black.copy(alpha = if (page == "welcome") .30f else .40f)))
        if (showPrivacyPolicy) {
            Column(
                Modifier.fillMaxSize().background(Color.White).verticalScroll(rememberScrollState()).padding(horizontal = 22.dp),
                horizontalAlignment = Alignment.Start
            ) {
                Row(Modifier.fillMaxWidth().padding(top = 12.dp, bottom = 18.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("‹", color = Color(0xFF374151), fontSize = 38.sp, modifier = Modifier.clickable { showPrivacyPolicy = false }.padding(horizontal = 8.dp))
                    Text("Privacy Policy", color = Color(0xFF111827), fontSize = 18.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(start = 8.dp))
                }
                Text("Privacy Policy", color = Color(0xFF111827), fontSize = 25.sp, fontWeight = FontWeight.Bold)
                Text("Last updated: October 14, 2026", color = Color(0xFF6B7280), fontSize = 13.sp, modifier = Modifier.padding(top = 8.dp, bottom = 22.dp))
                PrivacySection("1. Information We Collect", "We collect information you provide directly to us, including your name, email address, and profile information when you create an account. We also collect information about your use of our services.")
                PrivacySection("2. How We Use Your Information", "We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to develop new features.")
                PrivacySection("3. Information Sharing", "We do not sell your personal information. We may share information when necessary to provide our services, comply with legal obligations, or protect users and our service.")
                PrivacySection("4. Data Security", "We take reasonable measures to protect information associated with your account. No method of electronic storage or transmission is completely secure.")
                PrivacySection("5. Your Choices", "You may update your account information and contact us regarding privacy-related requests.")
                PrivacySection("6. Changes to This Policy", "We may update this Privacy Policy from time to time. Changes will be reflected on this page.")
                Spacer(Modifier.height(30.dp))
            }
        } else if (page == "welcome") {
            Column(Modifier.fillMaxSize().padding(horizontal = 20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Spacer(Modifier.weight(1f))
                Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                    AsyncImage(model = HURRY_LOGO, contentDescription = "Hurry", modifier = Modifier.size(80.dp).clip(RoundedCornerShape(18.dp)))
                    Text("Zaho", color = Color.White, fontSize = 30.sp, fontWeight = FontWeight.Bold)
                }
                Spacer(Modifier.weight(1.2f))
                Button(
                    onClick = { error = ""; showGoogleSetupMessage = true },
                    enabled = !loading,
                    modifier = Modifier.fillMaxWidth().height(54.dp),
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF222222))
                ) {
                    GoogleLoginIcon(Modifier.size(22.dp))
                    Spacer(Modifier.width(10.dp))
                    Text("Google", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }
                Spacer(Modifier.height(14.dp))
                Button(
                    onClick = { page = "login"; error = ""; showGoogleSetupMessage = false },
                    modifier = Modifier.fillMaxWidth().height(54.dp),
                    shape = RoundedCornerShape(50),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB), contentColor = Color.White)
                ) {
                    AccountLoginIcon(Modifier.size(22.dp))
                    Spacer(Modifier.width(10.dp))
                    Text("Account", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }
                Spacer(Modifier.height(24.dp))
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 18.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Login means you agree to the ", color = Color.White.copy(alpha = .85f), fontSize = 12.sp)
                    Text("Terms of Service", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                    Text(", ", color = Color.White.copy(alpha = .85f), fontSize = 12.sp)
                    Text(
                        "Privacy Policy",
                        color = Color(0xFF93C5FD),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        modifier = Modifier.clickable { showPrivacyPolicy = true }
                    )
                }
            }
        } else {
            Column(
                Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(Modifier.fillMaxWidth().padding(top = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("‹", color = Color.White, fontSize = 38.sp, modifier = Modifier.clickable {
                        page = if (page == "signup") "login" else "welcome"
                        email = ""; password = ""; error = ""
                    }.padding(horizontal = 8.dp))
                }
                Spacer(Modifier.height(18.dp))
                AsyncImage(model = HURRY_LOGO, contentDescription = "Hurry", modifier = Modifier.size(64.dp).clip(RoundedCornerShape(16.dp)))
                Spacer(Modifier.height(12.dp))
                Text(if (page == "signup") "Create Account" else "Welcome Back!", color = Color.White, fontSize = 26.sp, fontWeight = FontWeight.Bold)
                Text(if (page == "signup") "Sign up to get started" else "Sign in to your account", color = Color.White.copy(alpha = .75f), fontSize = 14.sp, modifier = Modifier.padding(top = 4.dp, bottom = 24.dp))
                if (error.isNotBlank()) {
                    Text(error, color = Color.White, fontSize = 13.sp, modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color(0x66EF4444)).padding(12.dp))
                    Spacer(Modifier.height(12.dp))
                }
                AuthField("E-mail Address", email, { email = it }, "Enter your email", false, KeyboardType.Email)
                Spacer(Modifier.height(16.dp))
                AuthField("Password", password, { password = it }, if (page == "signup") "Create a password (min 6 characters)" else "Enter your password", !showPassword, KeyboardType.Password,
                    trailing = if (showPassword) "Hide" else "Show",
                    onTrailing = { showPassword = !showPassword })
                Spacer(Modifier.height(22.dp))
                Button(
                    onClick = {
                        scope.launch {
                            loading = true
                            error = ""
                            try {
                                if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email.trim()).matches()) throw IllegalArgumentException("Please enter a valid email.")
                                if (password.length < 6) throw IllegalArgumentException("Password must be at least 6 characters long.")
                                val user = withContext(Dispatchers.IO) { firebaseEmailAuth(email.trim(), password, page == "signup") }
                                withContext(Dispatchers.IO) { syncHurryUser(user, context) }
                                context.getSharedPreferences("hurry_auth", android.content.Context.MODE_PRIVATE).edit()
                                    .putString("uid", user.optString("localId"))
                                    .putString("email", user.optString("email", email.trim()))
                                    .putString("idToken", user.optString("idToken"))
                                    .apply()
                                onLoginSuccess()
                            } catch (t: Throwable) {
                                error = authErrorText(t.message ?: "Authentication failed. Please try again.")
                            } finally {
                                loading = false
                            }
                        }
                    },
                    enabled = !loading && email.isNotBlank() && password.isNotBlank(),
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = Color(0xFF2563EB), disabledContainerColor = Color.White.copy(alpha = .4f))
                ) {
                    if (loading) CircularProgressIndicator(Modifier.size(20.dp), color = Color(0xFF2563EB), strokeWidth = 2.dp)
                    else Text(if (page == "signup") "Sign Up" else "Login", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }
                Spacer(Modifier.height(18.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(if (page == "signup") "Already have an account? " else "Don't have an account? ", color = Color.White.copy(alpha = .8f), fontSize = 14.sp)
                    Text(if (page == "signup") "Login" else "Sign Up", color = Color(0xFF93C5FD), fontSize = 14.sp, fontWeight = FontWeight.Bold, modifier = Modifier.clickable {
                        page = if (page == "signup") "login" else "signup"
                        password = ""; error = ""
                    })
                }
                Spacer(Modifier.height(28.dp))
            }
        }
        if (showGoogleSetupMessage) {
            ModalBottomSheet(
                onDismissRequest = { showGoogleSetupMessage = false },
                containerColor = Color.White,
                contentColor = Color(0xFF111827),
                dragHandle = { BottomSheetDefaults.DragHandle(color = Color(0xFFD1D5DB)) }
            ) {
                Column(
                    Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 24.dp).padding(bottom = 28.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    GoogleLoginIcon(Modifier.size(38.dp))
                    Spacer(Modifier.height(12.dp))
                    Text("Google", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF111827))
                    Spacer(Modifier.height(10.dp))
                    Text(
                        "Google sign-in is not configured for this Android app yet.",
                        fontSize = 14.sp,
                        color = Color(0xFF6B7280),
                        textAlign = TextAlign.Center
                    )
                    Spacer(Modifier.height(20.dp))
                    TextButton(onClick = { showGoogleSetupMessage = false }) {
                        Text("Close", color = Color(0xFF2563EB), fontSize = 15.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun AuthField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    hideText: Boolean,
    keyboardType: KeyboardType,
    trailing: String? = null,
    onTrailing: (() -> Unit)? = null
) {
    Column(Modifier.fillMaxWidth()) {
        Text(label, color = Color.White.copy(alpha = .92f), fontSize = 14.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 8.dp))
        Row(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Color.White.copy(alpha = .12f)).padding(horizontal = 14.dp, vertical = 15.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(Modifier.weight(1f)) {
                if (value.isEmpty()) Text(placeholder, color = Color.White.copy(alpha = .5f), fontSize = 14.sp)
                BasicTextField(
                    value = value,
                    onValueChange = onValueChange,
                    singleLine = true,
                    textStyle = androidx.compose.ui.text.TextStyle(color = Color.White, fontSize = 15.sp),
                    visualTransformation = if (hideText) PasswordVisualTransformation() else VisualTransformation.None,
                    keyboardOptions = KeyboardOptions(keyboardType = keyboardType)
                )
            }
            if (trailing != null && onTrailing != null) {
                Text(trailing, color = Color.White.copy(alpha = .75f), fontSize = 12.sp, modifier = Modifier.clickable { onTrailing() }.padding(start = 8.dp))
            }
        }
    }
}

private fun firebaseEmailAuth(email: String, password: String, create: Boolean): JSONObject {
    val action = if (create) "accounts:signUp" else "accounts:signInWithPassword"
    val url = URL("https://identitytoolkit.googleapis.com/v1/$action?key=$HURRY_FIREBASE_API_KEY")
    val connection = (url.openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"
        connectTimeout = 15000
        readTimeout = 20000
        doOutput = true
        setRequestProperty("Content-Type", "application/json")
    }
    val body = JSONObject().put("email", email).put("password", password).put("returnSecureToken", true)
    connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
    val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
    val response = stream.bufferedReader().use { it.readText() }
    val code = connection.responseCode
    connection.disconnect()
    val json = JSONObject(response)
    if (code !in 200..299) throw IllegalStateException(json.optJSONObject("error")?.optString("message") ?: "Authentication failed.")
    return json
}

private fun syncHurryUser(user: JSONObject, context: android.content.Context) {
    val uid = user.optString("localId")
    val email = user.optString("email")
    if (uid.isBlank()) throw IllegalStateException("Firebase did not return a user ID.")
    val name = email.substringBefore("@").ifBlank { "User" }
    val accountId = (10000000 + (kotlin.math.abs(uid.hashCode()) % 90000000)).toString()
    val deviceId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID).orEmpty()

    val banConnection = (URL("$HURRY_API_BASE/api/check-ban").openConnection() as HttpURLConnection).apply {
        requestMethod = "POST"; connectTimeout = 8000; readTimeout = 8000; doOutput = true
        setRequestProperty("Content-Type", "application/json")
    }
    banConnection.outputStream.use { it.write(JSONObject().put("accountId", accountId).put("deviceId", deviceId).toString().toByteArray(Charsets.UTF_8)) }
    val banCode = banConnection.responseCode
    val banStream = if (banCode in 200..299) banConnection.inputStream else banConnection.errorStream
    val banJson = runCatching { JSONObject(banStream.bufferedReader().use { it.readText() }) }.getOrDefault(JSONObject())
    banConnection.disconnect()
    if (banJson.optBoolean("banned")) throw IllegalStateException("This account or device is blocked from signing in.")

    val profile = JSONObject()
        .put("id", uid).put("uid", uid).put("appLongId", uid)
        .put("name", name).put("email", email).put("gmail", email)
        .put("image", "/default-avatar.png").put("avatar", "/default-avatar.png")
        .put("accountId", accountId).put("accountNumber", accountId)
        .put("country", "🇮🇳").put("deviceId", deviceId)
    val save = (URL("$HURRY_API_BASE/api/users").openConnection() as HttpURLConnection).apply {
        requestMethod = "PUT"; connectTimeout = 12000; readTimeout = 12000; doOutput = true
        setRequestProperty("Content-Type", "application/json")
    }
    save.outputStream.use { it.write(profile.toString().toByteArray(Charsets.UTF_8)) }
    val saveCode = save.responseCode
    val saveStream = if (saveCode in 200..299) save.inputStream else save.errorStream
    val saveText = runCatching { saveStream.bufferedReader().use { it.readText() } }.getOrDefault("")
    save.disconnect()
    if (saveCode !in 200..299) throw IllegalStateException("Signed in, but profile sync failed. Please try again.")
    context.getSharedPreferences("hurry_auth", android.content.Context.MODE_PRIVATE).edit()
        .putString("name", name).putString("accountId", accountId).putString("deviceId", deviceId).apply()
}

private fun authErrorText(raw: String): String = when {
    raw.contains("EMAIL_EXISTS") -> "An account already exists with this email. Please login instead."
    raw.contains("EMAIL_NOT_FOUND") || raw.contains("INVALID_PASSWORD") || raw.contains("INVALID_LOGIN_CREDENTIALS") -> "Invalid email or password. Please try again."
    raw.contains("WEAK_PASSWORD") -> "Password must be at least 6 characters long."
    raw.contains("INVALID_EMAIL") -> "Please enter a valid email."
    raw.contains("TOO_MANY_ATTEMPTS_TRY_LATER") -> "Too many attempts. Please try again later."
    raw.contains("OPERATION_NOT_ALLOWED") -> "Email/password sign-in is not enabled for this Firebase project."
    else -> raw
}

 
@Composable
private fun AccountLoginIcon(modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val stroke = androidx.compose.ui.graphics.drawscope.Stroke(width = size.minDimension * .095f)
        val centerX = size.width / 2f
        val headRadius = size.minDimension * .19f
        drawCircle(
            color = Color.White,
            radius = headRadius,
            center = androidx.compose.ui.geometry.Offset(centerX, size.height * .31f),
            style = stroke
        )
        drawArc(
            color = Color.White,
            startAngle = 180f,
            sweepAngle = 180f,
            useCenter = false,
            topLeft = androidx.compose.ui.geometry.Offset(size.width * .16f, size.height * .43f),
            size = androidx.compose.ui.geometry.Size(size.width * .68f, size.height * .50f),
            style = stroke
        )
    }
}

@Composable
private fun PrivacySection(title: String, body: String) {
    Column(Modifier.fillMaxWidth().padding(bottom = 22.dp)) {
        Text(title, color = Color(0xFF111827), fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        Spacer(Modifier.height(8.dp))
        Text(body, color = Color(0xFF374151), fontSize = 14.sp, lineHeight = 21.sp)
    }
}


@Composable
private fun GoogleLoginIcon(modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val strokeWidth = size.minDimension * 0.16f
        val inset = strokeWidth / 2f
        val arcSize = androidx.compose.ui.geometry.Size(size.width - strokeWidth, size.height - strokeWidth)
        val topLeft = androidx.compose.ui.geometry.Offset(inset, inset)
        val stroke = androidx.compose.ui.graphics.drawscope.Stroke(width = strokeWidth, cap = androidx.compose.ui.graphics.StrokeCap.Butt)
        drawArc(Color(0xFF4285F4), -45f, 90f, false, topLeft, arcSize, style = stroke)
        drawArc(Color(0xFF34A853), 45f, 90f, false, topLeft, arcSize, style = stroke)
        drawArc(Color(0xFFFBBC05), 135f, 90f, false, topLeft, arcSize, style = stroke)
        drawArc(Color(0xFFEA4335), 225f, 90f, false, topLeft, arcSize, style = stroke)
        drawLine(
            color = Color(0xFF4285F4),
            start = androidx.compose.ui.geometry.Offset(size.width * 0.53f, size.height * 0.50f),
            end = androidx.compose.ui.geometry.Offset(size.width * 0.96f, size.height * 0.50f),
            strokeWidth = strokeWidth
        )
    }
}
