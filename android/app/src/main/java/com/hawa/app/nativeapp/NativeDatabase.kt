package com.hawa.app.nativeapp

import android.content.Context
import androidx.room.Database
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Room
import androidx.room.RoomDatabase

@Entity(tableName = "cached_rooms")
data class CachedRoom(@PrimaryKey val accountId: String, val name: String, val image: String, val updatedAt: Long)

@Database(entities = [CachedRoom::class], version = 1, exportSchema = false)
abstract class NativeDatabase : RoomDatabase() {
    abstract fun rooms(): CachedRoomDao
    companion object {
        fun create(context: Context): NativeDatabase =
            Room.databaseBuilder(context, NativeDatabase::class.java, "hurry_native.db").build()
    }
}

@androidx.room.Dao
interface CachedRoomDao {
    @androidx.room.Query("SELECT * FROM cached_rooms ORDER BY updatedAt DESC")
    suspend fun all(): List<CachedRoom>
    @androidx.room.Insert(onConflict = androidx.room.OnConflictStrategy.REPLACE)
    suspend fun upsert(room: CachedRoom)
}
