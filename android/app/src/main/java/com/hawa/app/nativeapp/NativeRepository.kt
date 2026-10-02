package com.hawa.app.nativeapp

import org.json.JSONArray
import org.json.JSONObject

class NativeRepository {
    suspend fun rooms(): JSONArray = NativeNetwork.rooms()
    suspend fun user(uid: String): JSONObject = JSONObject(NativeNetwork.get("/api/users/${uid}"))
    suspend fun saveUser(user: JSONObject): JSONObject = JSONObject(NativeNetwork.put("/api/users", user))
    suspend fun saveRoom(room: JSONObject): JSONObject = JSONObject(NativeNetwork.put("/api/rooms", room))
    suspend fun sendMessage(roomId: String, message: JSONObject): JSONObject =
        JSONObject(NativeNetwork.post("/api/rooms/${roomId}/messages", message))
}
