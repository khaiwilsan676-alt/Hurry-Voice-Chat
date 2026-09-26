package com.hawa.app;

import android.os.Bundle;
import android.graphics.Color;
import android.view.Window;
import android.view.WindowManager;
import android.os.Build;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();\n\n        // Android WebView defaults can block media/storage features that work in Chrome.\n        // Explicitly enable the settings required by Jitsi/WebRTC and cached media.\n        if (bridge != null && bridge.getWebView() != null) {\n            bridge.getWebView().getSettings().setDomStorageEnabled(true);\n            bridge.getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);\n        }

        // Keep screen awake while the app is open
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Existing edge-to-edge setup
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
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
