package com.hawa.app.nativeapp

import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

class NativeSocket {
    private var socket: Socket? = null

    fun connect() {
        if (socket?.connected() == true) return
        socket = IO.socket("https://hurry-voice-chat-lz75.onrender.com").apply {
            connect()
        }
    }

    fun on(event: String, listener: (JSONObject) -> Unit) {
        socket?.on(event) { args ->
            val value = args.firstOrNull()
            if (value is JSONObject) listener(value)
        }
    }

    fun emit(event: String, data: JSONObject) {
        socket?.emit(event, data)
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }

    fun isConnected(): Boolean = socket?.connected() == true
}
