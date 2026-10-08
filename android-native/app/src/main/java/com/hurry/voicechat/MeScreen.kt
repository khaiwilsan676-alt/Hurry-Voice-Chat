package com.hurry.voicechat

import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.shape.CircleShape
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
private const val HONOUR_BG   = RAW + "IMG_20260912_144404.png"
private const val CHARM_BG    = RAW + "IMG_20260912_144324.png"
private const val ROOM_BG     = RAW + "IMG_20260912_144347.png"
private const val CARD_FRAME  = RAW + "file_00000000048882118276c7215012963f.png"

// ═══ DECORATION IMAGES ═══
private const val DECOR_CORNER    = RAW + "IMG_20260916_002115.png"
private const val RANK_BADGE_1    = RAW + "IMG_20260922_112156.png"
private const val RANK_BADGE_2    = RAW + "IMG_20260922_112129.png"
private const val RANK_BADGE_3    = RAW + "IMG_20260922_112110.png"

// ═══ MeScreen wala exact gradient (620px fade) ═══
private val MePageTopGradient = androidx.compose.ui.graphics.Brush.verticalGradient(
    listOf(Color(0xFF3B82F6), Color(0xFFEFF6FF), Color(0xFFF9FAFB)),
    startY = 0f,
    endY = 620f
)

// ═══ Blue gradient for banner/category ═══
private val BlueExtendedGradient = androidx.compose.ui.graphics.Brush.verticalGradient(
    0.0f to Color(0xFFEFF6FF),
    0.7f to Color(0xFFEFF6FF),
    1.0f to Color(0xFFF9FAFB)
)

// ═══════════════════════════════════════════════════════
// ROOM DB — INDEXEDDB EQUIVALENT
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
// COUNTRY PILL DATA
// ═══════════════════════════════════════════════════════
private data class CountryPill(
    val flag: String?,
    val label: String,
    val value: String
)

private val countryPills = listOf(
    CountryPill(null, "All",          "all"),
    CountryPill("🇮🇳", "India",        "India"),
    CountryPill("🇸🇬", "Singapore",    "Singapore"),
    CountryPill("🇵🇰", "Pakistan",     "Pakistan"),
    CountryPill("🇺🇸", "USA",          "USA"),
    CountryPill("🇿🇦", "South Africa", "South Africa"),
    CountryPill("🇹🇷", "Turkey",       "Turkey")
)

// ═══════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════
@Composable
fun HomeScreen(
    onRoom: (HurryRoom) -> Unit,
    onMine: () -> Unit = {},
    onPopular: () -> Unit = {},
    onLeaderboard: (String) -> Unit = {},
    onInviteFriends: () -> Unit = {},
    mineSelected: Boolean = false
) {
    val mine = mineSelected
    val context = LocalContext.current
    val dao = remember {
        runCatching { HurryDatabase.get(context).roomDao() }.getOrNull()
    }

    var rooms by remember { mutableStateOf<List<HurryRoom>?>(null) }
    var selectedCountry by remember { mutableStateOf("all") }

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

    LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay(5000)
            if (!pager.isScrollInProgress) {
                pager.animateScrollToPage((pager.currentPage + 1) % banners.size)
            }
        }
    }

    val filteredRooms = remember(rooms, selectedCountry) {
        val list = rooms ?: emptyList()
        if (selectedCountry == "all") list
        else list.filter { it.country.contains(selectedCountry, ignoreCase = true) }
    }

    Box(Modifier.fillMaxSize().background(Color(0xFFF9FAFB))) {

        Column(Modifier.fillMaxSize()) {

            // ═══════════ FIXED TOP HEADER ═══════════
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
            // ═══════════ END FIXED TOP HEADER ═══════════

            // ═══════════ SCROLLABLE AREA ═══════════
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                // ───────── BANNER ─────────
                item {
                    Column(
                        Modifier
                            .fillMaxWidth()
                            .background(BlueExtendedGradient)
                            .padding(top = 6.dp, start = 12.dp, end = 12.dp, bottom = 4.dp)
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
                                    modifier = Modifier.fillMaxSize().clickable { onInviteFriends() },
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

                // ───────── CATEGORY CARDS ─────────
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(BlueExtendedGradient)
                            .padding(horizontal = 12.dp, vertical = 3.dp)
                            .graphicsLayer { translationY = (-4).dp.toPx() },
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        HurryCategoryCard("Honour", HONOUR_BG, Modifier.weight(1f)) { onLeaderboard("honour") }
                        HurryCategoryCard("Charm",  CHARM_BG,  Modifier.weight(1f)) { onLeaderboard("charm") }
                        HurryCategoryCard("Room",   ROOM_BG,   Modifier.weight(1f)) { onLeaderboard("room") }
                    }
                }

                // ───────── COUNTRY PILLS — STICKY ─────────
                stickyHeader {
                    Column(
                        Modifier
                            .fillMaxWidth()
                            .background(Color(0xFFEFF6FF))
                    ) {
                        CountryPillRow(
                            selected = selectedCountry,
                            onSelect = { selectedCountry = it }
                        )
                        Spacer(Modifier.height(6.dp))
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
                } else if (filteredRooms.isEmpty()) {
                    item {
                        Box(
                            Modifier.fillMaxWidth().height(120.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "No rooms in this country",
                                fontSize = 14.sp,
                                color = Color(0xFF6B7280)
                            )
                        }
                    }
                } else {
                    val roomRows = filteredRooms.chunked(2)
                    items(
                        items = roomRows,
                        key = { row -> row.first().id }
                    ) { row ->
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp),
                            horizontalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            row.forEachIndexed { indexInRow, room ->
                                val globalIndex = roomRows.indexOf(row) * 2 + indexInRow
                                RoomListCard(
                                    room = room,
                                    onRoom = onRoom,
                                    rank = globalIndex + 1,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                            if (row.size == 1) Spacer(Modifier.weight(1f))
                        }
                    }
                }
            }
        }

        // ═══════════ BOTTOM-RIGHT DECORATION ═══════════
        AsyncImage(
            model = DECOR_CORNER,
            contentDescription = null,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(end = 16.dp, bottom = 90.dp)
                .size(70.dp),
            contentScale = ContentScale.Fit
        )
    }
}

// ═══════════════════════════════════════════════════════
// COUNTRY PILL ROW (All icon = MePage Language icon)
// ═══════════════════════════════════════════════════════
@Composable
private fun CountryPillRow(
    selected: String,
    onSelect: (String) -> Unit
) {
    LazyRow(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        contentPadding = PaddingValues(horizontal = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        userScrollEnabled = true
    ) {
        items(countryPills.size) { index ->
            val pill = countryPills[index]
            val active = selected == pill.value

            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .background(if (active) HurryBlue else Color.White)
                    .clickable { onSelect(pill.value) }
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                if (pill.flag == null) {
                    // ⬇️ MePage wala Language icon
                    androidx.compose.foundation.Canvas(Modifier.size(16.dp)) {
                        val stroke = Stroke(
                            width = 1.6.dp.toPx(),
                            cap = StrokeCap.Round,
                            join = StrokeJoin.Round
                        )
                        val c = if (active) Color.White else Color(0xFF1E1E1E)
                        val cx = size.width / 2f
                        val cy = size.height / 2f

                        // Outer circle
                        drawCircle(
                            color = c,
                            radius = size.minDimension * 0.42f,
                            center = Offset(cx, cy),
                            style = stroke
                        )
                        // Horizontal line
                        drawLine(
                            color = c,
                            start = Offset(size.width * 0.08f, cy),
                            end = Offset(size.width * 0.92f, cy),
                            strokeWidth = stroke.width
                        )
                        // Vertical oval (globe meridian)
                        drawOval(
                            color = c,
                            topLeft = Offset(size.width * 0.33f, size.height * 0.08f),
                            size = Size(size.width * 0.34f, size.height * 0.84f),
                            style = stroke
                        )
                    }
                } else {
                    Text(pill.flag, fontSize = 14.sp)
                }

                Text(
                    text = pill.label,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (active) Color.White else Color(0xFF374151),
                    maxLines = 1
                )
            }
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
    rank: Int = 0,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth().clickable { onRoom(room) },
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Box(
            Modifier
                .fillMaxWidth()
                .aspectRatio(1f)
                .clip(RoundedCornerShape(10.dp))
                .background(Color(0xFFE5E7EB))
        ) {
            AsyncImage(
                model = if (room.image.startsWith("http")) room.image
                        else RAW + room.image.trimStart('/'),
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )

            // 🏆 Rank Badge for top 3
            if (rank in 1..3) {
                AsyncImage(
                    model = when (rank) {
                        1 -> RANK_BADGE_1
                        2 -> RANK_BADGE_2
                        else -> RANK_BADGE_3
                    },
                    contentDescription = null,
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .offset(x = 6.dp, y = (-11).dp)
                        .size(55.dp),
                    contentScale = ContentScale.Fit
                )
            }

            // 🔒 Lock icon
            if (room.isLocked) {
                Box(
                    Modifier
                        .align(Alignment.TopEnd)
                        .padding(8.dp)
                        .size(26.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.30f)),
                    contentAlignment = Alignment.Center
                ) {
                    androidx.compose.foundation.Canvas(Modifier.size(14.dp)) {
                        val c = Color.White
                        val sw = 1.8.dp.toPx()
                        drawRoundRect(
                            color = c,
                            topLeft = Offset(size.width * 0.15f, size.height * 0.42f),
                            size = Size(size.width * 0.70f, size.height * 0.50f),
                            cornerRadius = CornerRadius(2.dp.toPx(), 2.dp.toPx()),
                            style = Stroke(width = sw)
                        )
                        drawArc(
                            color = c,
                            startAngle = 180f,
                            sweepAngle = 180f,
                            useCenter = false,
                            topLeft = Offset(size.width * 0.28f, size.height * 0.12f),
                            size = Size(size.width * 0.44f, size.height * 0.55f),
                            style = Stroke(width = sw, cap = StrokeCap.Round)
                        )
                    }
                }
            }

            // 🎵 Live Room Stats
            LiveRoomStats()
        }

        Row(
            Modifier
                .fillMaxWidth()
                .padding(horizontal = 1.dp, vertical = 0.5.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(2.dp)
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
// LIVE ROOM STATS
// ═══════════════════════════════════════════════════════
@Composable
private fun LiveRoomStats() {
    var count by remember { mutableIntStateOf((1000..5000).random()) }

    LaunchedEffect(Unit) {
        while (true) {
            kotlinx.coroutines.delay((1000..3000).random().toLong())
            count += (-3..3).random()
        }
    }

    Row(
        modifier = Modifier
            .align(Alignment.BottomEnd)
            .padding(8.dp),
        verticalAlignment = Alignment.Bottom,
        horizontalArrangement = Arrangement.spacedBy(3.dp)
    ) {
        Text(
            text = count.toString(),
            color = Color.White,
            fontSize = 11.sp,
            fontWeight = FontWeight.ExtraBold
        )

        Row(
            Modifier.height(9.dp),
            verticalAlignment = Alignment.Bottom,
            horizontalArrangement = Arrangement.spacedBy(2.dp)
        ) {
            Box(
                Modifier
                    .width(2.5.dp).height(5.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color.White)
            )
            Box(
                Modifier
                    .width(2.5.dp).height(9.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color.White)
            )
            Box(
                Modifier
                    .width(2.5.dp).height(6.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color.White)
            )
        }
    }
}

// ═══════════════════════════════════════════════════════
// HOUSE ICON
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
    modifier: Modifier = Modifier,
    onClick: () -> Unit = {}
) {
    Box(modifier.height(92.dp).clip(RoundedCornerShape(16.dp)).clickable { onClick() }) {
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
