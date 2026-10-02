package com.hawa.app.nativeapp

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONObject

class NativeAppState(context: Context) {
    private val storage = NativeStorage(context)
    private val _user = MutableStateFlow(JSONObject(storage.getString("user_json", "{}") ?: "{}"))
    val user: StateFlow<JSONObject> = _user
    fun saveUser(value: JSONObject) { storage.putString("user_json", value.toString()); _user.value = value }
    fun clearUser() { storage.putString("user_json", "{}"); _user.value = JSONObject() }
    fun isLoggedIn(): Boolean = _user.value.optString("uid").isNotBlank()
}
