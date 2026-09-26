package com.hawa.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;

import androidx.activity.OnBackPressedCallback;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // Android WebView defaults can block media/storage features that work in Chrome.
        // Explicitly enable the settings required by Jitsi/WebRTC and cached media.
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().getSettings().setDomStorageEnabled(true);
            bridge.getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
        }

        // Keep screen awake while the app is open.
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Existing edge-to-edge setup.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
        }

        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);

        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        // Android Back handling.
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
