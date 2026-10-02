package com.hawa.app.nativeapp

import android.content.Context
import android.media.AudioManager
import android.media.MediaRecorder

class NativeAudioManager(context: Context) {
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private var recorder: MediaRecorder? = null

    fun setSpeaker(enabled: Boolean) {
        audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
        audioManager.isSpeakerphoneOn = enabled
    }

    fun startLocalCapture(): Boolean {
        if (recorder != null) return true
        return try {
            recorder = MediaRecorder().apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP)
                setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB)
                setOutputFile("/dev/null")
                prepare()
                start()
            }
            true
        } catch (_: Exception) {
            recorder?.release()
            recorder = null
            false
        }
    }

    fun stopLocalCapture() {
        recorder?.runCatching { stop() }
        recorder?.release()
        recorder = null
    }

    fun release() {
        stopLocalCapture()
        audioManager.mode = AudioManager.MODE_NORMAL
    }
}
