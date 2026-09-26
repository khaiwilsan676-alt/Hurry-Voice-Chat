package com.hawa.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.WindowInsets;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // Keep Android system bars visible and reserve their space for the WebView.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(true);
        }

        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            window.getDecorView().setSystemUiVisibility(0);
        }

        // Android WebView compatibility for media/storage features.
        if (bridge != null && bridge.getWebView() != null) {
            android.webkit.WebSettings settings = bridge.getWebView().getSettings();
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setCacheMode(android.webkit.WebSettings.LOAD_DEFAULT);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);

            WebView webView = bridge.getWebView();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                webView.setOnApplyWindowInsetsListener((view, insets) -> {
                    android.graphics.Insets bars = insets.getInsets(
                        WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars()
                    );
                    view.setPadding(bars.left, 0, bars.right, bars.bottom);
                    view.post(() -> view.evaluateJavascript(
                        "document.documentElement.style.setProperty('--status-bar-height','" + bars.top + "px')",
                        null
                    ));
                    return insets;
                });
                webView.requestApplyInsets();
            }
        }

        // Keep screen awake while the app is open.
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Android Back: navigate WebView history when possible. At the root,
        // deliberately do nothing so the Android Back button cannot close
        // or background Hurry accidentally.
        getOnBackPressedDispatcher().addCallback(
            this,
            new OnBackPressedCallback(true) {
                @Override
                public void handleOnBackPressed() {
                    if (bridge != null && bridge.getWebView() != null
                            && bridge.getWebView().canGoBack()) {
                        bridge.getWebView().goBack();
                    }
                    // No WebView history: stay inside the app.
                }
            }
        );
    }
}