package com.hawa.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.view.WindowInsets;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // Keep the Android status/navigation bars visible. The WebView gets
        // the real system-bar insets so app content never sits underneath
        // the Android navigation buttons/gesture area.
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
            bridge.getWebView().getSettings().setDomStorageEnabled(true);
            bridge.getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);

            View webView = bridge.getWebView();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                webView.setOnApplyWindowInsetsListener((view, insets) -> {
                    WindowInsets.Type.InsetsTypeMask ignored = null;
                    android.graphics.Insets bars = insets.getInsets(
                        WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars()
                    );
                    view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                    return insets;
                });
                webView.requestApplyInsets();
            }
        }

        // Keep screen awake while the app is open.
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Android Back: navigate WebView history when possible. At the root,
        // deliberately do nothing so the Android Back button cannot close
        // or background the Hurry app accidentally.
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
