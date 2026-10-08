package com.hurry.voicechat

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage

// ─── Room DB (IndexedDB equivalent) — same file ───
import androidx.room.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════
private const val RAW = "https://raw.githubusercontent.com/khaiwilsan676-alt/Hurry-Voice-Chat/main/public/"
private const val HONOUR_BG  = RAW + "IMG_20260912_144404.png"
private const val CHARM_BG   = RAW + "IMG_20260912_144324.png"
private const val ROOM_BG    = RAW + "IMG_20260912_144347.png"
private const val CARD_FRAME = RAW + "file_00000000048882118276c7215012963f.png"

// MePage wala exact gradient
private val MePageTopGradient = androidx.compose.ui.graphics.Brush.verticalGradient(
    0.0f  to Color(0xFF3B82F6),
    0.85f to Color(0xFFEFF6FF),
    1.0f  to Color(0xFFF9FAFB)
)

// ═══════════════════════════════════════════════════════
// ROOM DB — INDEXEDDB EQUIVALENT (same file)
// ═══════════════════════════════════════════════════════
@Entity(tableName = "rooms")
data class RoomEntity(
    @PrimaryKey val id: String,
    val name: String,
    val country: String,
    val image: String,
    val accountId: String,
    val createdAt: Long,
    val isLocked: Boolean = false,
    val roomPassword: String? = null,
    val cachedAt: Long = System.currentTimeMillis()
)

@Dao
interface RoomDao {
    @Query("SELECT * FROM rooms ORDER BY createdAt DESC")
    fun getAll(): List<RoomEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertAll(rooms: List<RoomEntity>): List<Long>

    @Query("DELETE FROM rooms")
    fun clearAll(): Int
}

@Database(entities = [RoomEntity::class], version = 2, exportSchema = false)
abstract class HurryDatabase : RoomDatabase() {
    abstract fun roomDao(): RoomDao

    companion object {
        @Volatile private var INSTANCE: HurryDatabase? = null
        fun get(context: Context): HurryDatabase =
            INSTANCE ?: synchronized(this) {
                INSTANCE ?: Room.databaseBuilder(
                    context.applicationContext,
                    HurryDatabase::class.java,
                    "hurry_cache.db"
                ).fallbackToDestructiveMigration()
                 .build().also { INSTANCE = it }
            }
    }
}

// ═══════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════
@Composable
fun HomeScreen(
    onRoom: (HurryRoom) -> Unit,
    onMine: () -> Unit = {},
    onPopular: () -> Unit = {},
    mineSelected: Boolean = false
) {
    val mine = mineSelected
    val context = LocalContext.current
    val dao = remember {
        runCatching { HurryDatabase.get(context).roomDao() }.getOrNull()
    }

    var rooms by remember { mutableStateOf<List<HurryRoom>?>(null) }

    // Room cache is optional: a corrupt/old database must never close the app.
    LaunchedEffect(Unit) {
        val cached = if (dao != null) {
            runCatching { withContext(Dispatchers.IO) { dao.getAll() } }.getOrDefault(emptyList())
        } else {
            emptyList()
        }

        if (cached.isNotEmpty()) {
            rooms = cached.map {
                HurryRoom(
                    id = it.id,
                    name = it.name,
                    country = it.country,
                    image = it.image,
                    accountId = it.accountId
                )
            }
        }

        // Server data remains the source of truth.
        val fresh = runCatching { HurryApi.rooms() }.getOrDefault(emptyList())

        if (fresh.isNotEmpty()) {
            rooms = fresh
            if (dao != null) {
                runCatching {
                    withContext(Dispatchers.IO) {
                        dao.clearAll()
                        dao.insertAll(
                            fresh.map {
                                RoomEntity(
                                    id = it.id,
                                    name = it.name,
                                    country = it.country,
                                    image = it.image,
                                    accountId = it.accountId ?: "",
                                    createdAt = System.currentTimeMillis()
                                )
                            }
                        )
                    }
                }
            }
        } else if (rooms == null) {
            rooms = emptyList()
        }
    }

    if (mine) {
        MineNativePage(onBack = onPopular)
        return
    }

    val banners = listOf(
        RAW + "IMG-20260830-WA0081.jpg",
        RAW + "IMG-20260818-WA0000.jpg",
        RAW + "IMG-20260818-WA0001.jpg"
    )
    val pager = rememberPagerState(pageCount = { banners.size })

    // Auto-scroll — user drag ke time ruk jaata hai
    LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay(5000)
            if (!pager.isScrollInProgress) {
                pager.animateScrollToPage((pager.currentPage + 1) % banners.size)
            }
        }
    }

    Column(
        Modifier.fillMaxSize().background(Color(0xFFF9FAFB))
    ) {
        // ───────── TOP HEADER (MePage gradient) ─────────
        Column(
            Modifier
                .fillMaxWidth()
                .background(MePageTopGradient)
                .statusBarsPadding()
                .padding(top = 3.dp, start = 12.dp, end = 12.dp, bottom = 2.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(
                        Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { onPopular() }
                            .padding(horizontal = 4.dp, vertical = 4.dp)
                    ) {
                        Text(
                            "Popular",
                            fontSize = 21.sp,
                            fontWeight = FontWeight.Bold,
                            color = HurryText
                        )
                    }
                    Box(
                        Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .clickable { onMine() }
                            .padding(horizontal = 4.dp, vertical = 4.dp)
                    ) {
                        Text(
                            "Mine",
                            fontSize = 21.sp,
                            fontWeight = FontWeight.Normal,
                            color = HurryMuted
                        )
                    }
                }
                Spacer(Modifier.weight(1f))
                HurrySearchIcon()
                Spacer(Modifier.width(10.dp))
                HurryHouseIcon()
                Spacer(Modifier.width(2.dp))
            }
        }

        // ───────── SMALL GAP (header ↔ banner) ─────────
        Spacer(Modifier.height(6.dp))

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 12.dp)
        ) {
            // ───────── BANNER ─────────
            item {
                Column(
                    Modifier
                        .fillMaxWidth()
                        .background(
                            androidx.compose.ui.graphics.Brush.verticalGradient(
                                listOf(Color(0xFFEFF6FF), Color(0xFFF9FAFB))
                            )
                        )
                        .padding(top = 4.dp, start = 12.dp, end = 12.dp, bottom = 2.dp)
                ) {
                    Box(
                        Modifier
                            .fillMaxWidth()
                            .height((13.5f * LocalConfiguration.current.screenHeightDp / 100f).dp)
                            .clip(RoundedCornerShape(6.dp))
                    ) {
                        HorizontalPager(
                            state = pager,
                            modifier = Modifier.fillMaxSize(),
                            userScrollEnabled = true,
                            pageSpacing = 0.dp
                        ) { page ->
                            AsyncImage(
                                model = banners[page],
                                contentDescription = null,
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                        Row(
                            Modifier
                                .align(Alignment.BottomCenter)
                                .padding(bottom = 5.dp),
                            horizontalArrangement = Arrangement.Center
                        ) {
                            repeat(banners.size) { i ->
                                Box(
                                    Modifier
                                        .padding(horizontal = 1.5.dp)
                                        .size(5.dp)
                                        .clip(RoundedCornerShape(50))
                                        .background(
                                            if (i == pager.currentPage) Color.White
                                            else Color.White.copy(alpha = 0.75f)
                                        )
                                )
                            }
                        }
                    }
                }
            }

            // ───────── CATEGORY CARDS (glitch-free shift) ─────────
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp)
                        .graphicsLayer { translationY = -4.dp.toPx() },
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    HurryCategoryCard("Honour", HONOUR_BG, Modifier.weight(1f))
                    HurryCategoryCard("Charm",  CHARM_BG,  Modifier.weight(1f))
                    HurryCategoryCard("Room",   ROOM_BG,   Modifier.weight(1f))
                }
            }

            // ───────── ROOMS GRID ─────────
            if (rooms == null) {
                item {
                    Box(
                        Modifier.fillMaxWidth().height(180.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(color = HurryBlue, strokeWidth = 2.dp)
                    }
                }
            } else if (rooms!!.isNotEmpty()) {
                val roomRows = rooms!!.chunked(2)
                items(
                    items = roomRows,
                    key = { row -> row.first().id }   // scroll glitch fix
                ) { row ->
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(2.dp)  // gap kam
                    ) {
                        row.forEach { room ->
                            RoomListCard(room, onRoom, Modifier.weight(1f))
                        }
                        if (row.size == 1) Spacer(Modifier.weight(1f))
                    }
                }
            }
            // Empty pe kuch nahi — text hata diya
        }
    }
}

// ═══════════════════════════════════════════════════════
// ROOM CARD
// ═══════════════════════════════════════════════════════
@Composable
private fun RoomListCard(
    room: HurryRoom,
    onRoom: (HurryRoom) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier.fillMaxWidth().clickable { onRoom(room) }) {
        Box(
            Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .clip(RoundedCornerShape(10.dp))
                .background(Color(0xFFE5E7EB))   // placeholder
        ) {
            AsyncImage(
                model = if (room.image.startsWith("http")) room.image
                        else RAW + room.image.trimStart('/'),
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
        }
        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 1.dp, vertical = 0.5.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(1.dp)
        ) {
            Text(room.country, fontSize = 14.sp, maxLines = 1)
            Text(
                room.name,
                fontSize = 14.sp,
                fontWeight = FontWeight.Normal,
                color = Color(0xFF202124),
                maxLines = 1,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

// ═══════════════════════════════════════════════════════
// HOUSE ICON (real app jaisa)
// ═══════════════════════════════════════════════════════
@Composable
fun HurryHouseIcon(selected: Boolean = false) {
    androidx.compose.foundation.Canvas(Modifier.size(32.dp)) {
        val lineColor = if (selected) Color(0xFF3B82F6) else Color(0xFF2D2D2D)
        val barColor  = if (selected) Color.White      else Color(0xFF2D2D2D)
        val sw        = 2.4.dp.toPx()
        val w = size.width
        val h = size.height
        val sx = w / 32f
        val sy = h / 32f
        fun x(v: Float) = v * sx
        fun y(v: Float) = v * sy

        val house = Path().apply {
            moveTo(x(16f), y(3.5f))
            cubicTo(x(14.5f), y(3.5f), x(3f),   y(8f),    x(3f),   y(13.5f))
            lineTo(x(3f), y(21.5f))
            cubicTo(x(3f),    y(25.5f), x(6f),   y(28.5f), x(10.5f), y(28.5f))
            lineTo(x(21.5f), y(28.5f))
            cubicTo(x(26f),   y(28.5f), x(29f),  y(25.5f), x(29f),   y(21.5f))
            lineTo(x(29f), y(13.5f))
            cubicTo(x(29f),   y(8f),    x(17.5f), y(3.5f), x(16f),   y(3.5f))
            close()
        }
        drawPath(
            path = house,
            color = lineColor,
            style = Stroke(width = sw, cap = StrokeCap.Round, join = StrokeJoin.Round)
        )

        // 3 equalizer bars
        drawRoundRect(
            color = barColor,
            topLeft = Offset(x(9f), y(14.5f)),
            size = Size(x(3.5f), y(6f)),
            cornerRadius = CornerRadius(1.5f * sx, 1.5f * sy)
        )
        drawRoundRect(
            color = barColor,
            topLeft = Offset(x(14.2f), y(11.5f)),
            size = Size(x(3.5f), y(9f)),
            cornerRadius = CornerRadius(1.5f * sx, 1.5f * sy)
        )
        drawRoundRect(
            color = barColor,
            topLeft = Offset(x(19.5f), y(14f)),
            size = Size(x(3.5f), y(6.5f)),
            cornerRadius = CornerRadius(1.5f * sx, 1.5f * sy)
        )
    }
}

// ═══════════════════════════════════════════════════════
// CATEGORY CARD
// ═══════════════════════════════════════════════════════
@Composable
private fun HurryCategoryCard(
    label: String,
    bg: String,
    modifier: Modifier = Modifier
) {
    Box(modifier.height(92.dp).clip(RoundedCornerShape(16.dp))) {
        AsyncImage(
            model = bg,
            contentDescription = label,
            modifier = Modifier
                .fillMaxSize()
                .offset(y = 1.dp)
                .graphicsLayer {
                    val s = if (label.equals("Honour", true)) 1.08f else 1.02f
                    scaleX = s; scaleY = s
                },
            contentScale = ContentScale.Fit
        )
        Text(
            text = label.uppercase(),
            modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
            textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            fontSize = 11.sp,
            fontWeight = FontWeight.Black,
            color = Color.White
        )
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(start = 3.dp, end = 3.dp, bottom = 2.dp)
        ) {
            AsyncImage(
                model = CARD_FRAME,
                contentDescription = null,
                modifier = Modifier.fillMaxWidth().wrapContentHeight(),
                contentScale = ContentScale.FillWidth
            )
            Row(
                Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth(.68f)
                    .height(30.dp)
                    .offset(y = (-1).dp),
                horizontalArrangement = Arrangement.Center,
                verticalAlignment = Alignment.CenterVertically
            ) {
                AsyncImage(
                    model = RAW + "logo.png",
                    contentDescription = null,
                    modifier = Modifier.size(24.dp).clip(RoundedCornerShape(50)),
                    contentScale = ContentScale.Crop
                )
                Spacer(Modifier.width(2.dp))
                AsyncImage(
                    model = RAW + "logo.png",
                    contentDescription = null,
                    modifier = Modifier.size(29.dp).clip(RoundedCornerShape(50)).padding(1.dp),
                    contentScale = ContentScale.Crop
                )
                Spacer(Modifier.width(2.dp))
                AsyncImage(
                    model = RAW + "logo.png",
                    contentDescription = null,
                    modifier = Modifier.size(24.dp).clip(RoundedCornerShape(50)),
                    contentScale = ContentScale.Crop
                )
            }
        }
    }
}
