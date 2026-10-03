plugins { id("com.android.application"); id("org.jetbrains.kotlin.android"); id("org.jetbrains.kotlin.plugin.compose") }
android { namespace = "com.hurry.voicechat"; compileSdk = 36
 defaultConfig { applicationId = "com.hurry.voicechat"; minSdk = 26; targetSdk = 36; versionCode = 1; versionName = "1.0" }
 buildFeatures { compose = true }
}
dependencies {
 implementation(platform("androidx.compose:compose-bom:2025.09.00"))
 implementation("androidx.activity:activity-compose:1.11.0")
 implementation("androidx.compose.ui:ui")
 implementation("androidx.compose.ui:ui-tooling-preview")
 implementation("androidx.compose.material3:material3")
 implementation("androidx.navigation:navigation-compose:2.9.4")
 implementation("androidx.lifecycle:lifecycle-runtime-compose:2.9.3")
}