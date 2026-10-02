package com.hawa.app.nativeapp

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

object NativeNetwork {
    private const val BASE_URL = "https://hurry-voice-chat-lz75.onrender.com"

    suspend fun get(path: String): String = request("GET", path, null)

    suspend fun put(path: String, body: JSONObject): String = request("PUT", path, body.toString())

    suspend fun post(path: String, body: JSONObject): String = request("POST", path, body.toString())

    suspend fun rooms(): JSONArray {
        val json = JSONObject(get("/api/rooms"))
        return json.optJSONArray("rooms") ?: JSONArray()
    }

    private suspend fun request(method: String, path: String, body: String?): String =
        withContext(Dispatchers.IO) {
            val url = URL(BASE_URL.trimEnd('/') + "/" + path.trimStart('/'))
            val connection = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = method
                connectTimeout = 15000
                readTimeout = 20000
                setRequestProperty("Accept", "application/json")
                if (body != null) {
                    doOutput = true
                    setRequestProperty("Content-Type", "application/json; charset=utf-8")
                }
            }
            try {
                if (body != null) {
                    connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
                }
                val code = connection.responseCode
                val stream = if (code in 200..299) connection.inputStream else connection.errorStream
                val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
                if (code !in 200..299) error("HTTP $code: $text")
                text
            } finally {
                connection.disconnect()
            }
        }
}
