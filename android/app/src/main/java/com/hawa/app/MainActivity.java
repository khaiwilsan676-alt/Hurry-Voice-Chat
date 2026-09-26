package com.hawa.app;

import android.os.Bundle;
import android.graphics.Color;
import android.view.Window;
import android.view.WindowManager;
import android.os.Build;
import android.view.WindowInsets;
import android.webkit.WebView;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // Keep screen awake while the app is open
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Restore the previous Android safe-area behavior.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(true);
        }

        window.addFlags(
            WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS
        );

        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        // Restore the previous top safe-area inset bridge for the WebView.
        if (bridge != null && bridge.getWebView() != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WebView webView = bridge.getWebView();
            webView.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(
                    WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars()
                );
                view.setPadding(bars.left, 0, bars.right, bars.bottom);
                view.post(() -> webView.evaluateJavascript(
                    "document.documentElement.style.setProperty('--status-bar-height','" + bars.top + "px')",
                    null
                ));
                return insets;
            });
            webView.requestApplyInsets();
        }

        // Android Back handling
        getOnBackPressedDispatcher().addCallback(
            this,
            new OnBackPressedCallback(true) {
                @Override
                public void handleOnBackPressed() {
                    if (bridge != null && bridge.getWebView() != null) {
                        if (bridge.getWebView().canGoBack()) {
                            bridge.getWebView().goBack();
                        } else {
                            moveTaskToBack(true);
                        }
                    } else {
                        moveTaskToBack(true);
                    }
                }
            }
        );
    }
}
