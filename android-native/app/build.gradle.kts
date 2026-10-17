plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.devtools.ksp")   // ← ADDED
}
android {
    namespace = "com.hurry.voicechat"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.hurry.voicechat"
        minSdk = 26
        targetSdk = 36
        versionCode = System.getenv("GITHUB_RUN_NUMBER")?.toIntOrNull() ?: 1
        versionName = System.getenv("HURRY_VERSION_NAME") ?: "1.0"
    }
    buildFeatures { compose = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
kotlin {
    jvmToolchain(17)
}
dependencies {
    implementation(platform("androidx.compose:compose-bom:2025.09.00"))
    implementation("androidx.activity:activity-compose:1.11.0")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.media3:media3-exoplayer:1.8.0")
    implementation("androidx.media3:media3-ui:1.8.0")
    implementation("androidx.navigation:navigation-compose:2.9.4")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.9.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.10.2")
    implementation("io.coil-kt.coil3:coil-compose:3.3.0")
    implementation("io.coil-kt.coil3:coil-network-okhttp:3.3.0")
    implementation("io.socket:socket.io-client:2.1.1")

    // ─── Room DB (IndexedDB ka native equivalent) ───  ← ADDED
    implementation("androidx.room:room-runtime:2.8.4")
    implementation("androidx.room:room-ktx:2.8.4")
    ksp("androidx.room:room-compiler:2.8.4")
}

// Generate the native launcher icon from the same current Zyora logo used by the app.
val zyoraLauncherResDir = layout.buildDirectory.dir("generated/res/zyoraLauncherLogo")
val downloadZyoraLauncherLogo by tasks.registering {
    outputs.file(zyoraLauncherResDir.map { it.file("drawable-nodpi/zyora_launcher_logo.jpg") })
    doLast {
        val target = zyoraLauncherResDir.get().file("drawable-nodpi/zyora_launcher_logo.jpg").asFile
        target.parentFile.mkdirs()
        val logoUrl = java.net.URL("https://raw.githubusercontent.com/khaiwilsan676-alt/Zyora-Voice-Chat/main/public/image_20261014_125545-iss-logo-ko-dekh-yr-iski-body-position-dekh-or-han-right-wale-hand-lion-ke-fol.jpg")
        logoUrl.openStream().use { input -> target.outputStream().use { output -> input.copyTo(output) } }
        check(target.length() > 0L) { "Zyora launcher logo download was empty" }
    }
}
android.sourceSets.getByName("main").res.srcDir(zyoraLauncherResDir)
tasks.named("preBuild").configure { dependsOn(downloadZyoraLauncherLogo) }
