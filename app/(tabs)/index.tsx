import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, FONTS } from '../../constants/theme';
import { calcDensity, getAllSessions, getTodaySession, Session, Sessions } from '../../store/storage';

const CELL = 13;
const GAP = 3;

// ── Date helper (local time, no UTC shift) ────────────────

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Quarter helpers ───────────────────────────────────────

// quarterIndex: 0 = Q1 2026, 1 = Q2 2026, 2 = Q3 2026, ...
function getQuarterInfo(quarterIndex: number): { label: string; startMonth: number; year: number } {
  const year = 2026 + Math.floor(quarterIndex / 4);
  const quarter = (quarterIndex % 4) + 1;
  const startMonth = (quarter - 1) * 3; // 0=Jan, 3=Apr, 6=Jul, 9=Oct
  return { label: `Q${quarter} ${year}`, startMonth, year };
}

function currentQuarterIndex(): number {
  const now = today();
  const yearDiff = now.getFullYear() - 2026;
  const quarter = Math.floor(now.getMonth() / 3);
  return yearDiff * 4 + quarter;
}

// ── Build quarter grid ────────────────────────────────────

type GridCell = {
  dateKey: string;
  density: number | null;
  isToday: boolean;
  isEmpty: boolean; // padding cell
};

function buildQuarterGrid(sessions: Sessions, quarterIndex: number): GridCell[][] {
  const { startMonth, year } = getQuarterInfo(quarterIndex);
  const todayStr = toDateKey(today());
  const todayDate = today();

  // Quarter spans 3 months
  const quarterStart = new Date(year, startMonth, 1);
  const quarterEnd = new Date(year, startMonth + 3, 0); // last day of quarter

  // Find the Sunday on or before quarterStart
  const gridStart = new Date(quarterStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay()); // go back to Sunday

  // Find the Saturday on or after quarterEnd
  const gridEnd = new Date(quarterEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay())); // go forward to Saturday

  const weeks: GridCell[][] = [];
  const cursor = new Date(gridStart);

  while (cursor <= gridEnd) {
    const week: GridCell[] = [];
    for (let d = 0; d < 7; d++) {
      const dateKey = toDateKey(cursor);
      const isInQuarter = cursor >= quarterStart && cursor <= quarterEnd;
      const isFuture = cursor > todayDate;

      if (!isInQuarter) {
        week.push({ dateKey, density: null, isToday: false, isEmpty: true });
      } else {
        const session = sessions[dateKey];
        const density = isFuture ? null : session ? calcDensity(session) : 0;
        week.push({ dateKey, density, isToday: dateKey === todayStr, isEmpty: false });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

// ── Density → color ───────────────────────────────────────

function densityColor(d: number | null, isEmpty: boolean): string {
  if (isEmpty) return C.bg;
  if (d === null) return C.border;
  if (d === 0) return C.border;
  if (d < 0.25) return C.amber1;
  if (d < 0.5) return C.amber2;
  if (d < 0.75) return C.amber3;
  return C.amber4;
}

// ── Calc streak ───────────────────────────────────────────

function calcStreak(sessions: Sessions): number {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const dateKey = toDateKey(date);
    const session = sessions[dateKey];
    if (session && session.locked) {
      streak++;
    } else if (i === 0) {
      continue; // today not locked yet, keep checking previous days
    } else {
      break;
    }
  }
  return streak;
}

// ── Heatmap ───────────────────────────────────────────────

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function Heatmap({ sessions }: { sessions: Sessions }) {
  const maxQ = currentQuarterIndex();
  const [quarterIndex, setQuarterIndex] = useState(maxQ);
  const grid = buildQuarterGrid(sessions, quarterIndex);
  const streak = calcStreak(sessions);
  const { label } = getQuarterInfo(quarterIndex);

  return (
    <View>
      <View style={hm.topRow}>
        <View style={hm.gridSection}>

          {/* Nav */}
          <View style={hm.nav}>
            <TouchableOpacity onPress={() => setQuarterIndex(q => q - 1)} style={hm.navBtn} disabled={quarterIndex <= 0}>
              <Text style={[hm.navTxt, quarterIndex <= 0 && { color: C.textDim }]}>‹</Text>
            </TouchableOpacity>
            <Text style={hm.quarterLabel}>{label}</Text>
            <TouchableOpacity onPress={() => setQuarterIndex(q => q + 1)} style={hm.navBtn} disabled={quarterIndex >= maxQ}>
              <Text style={[hm.navTxt, quarterIndex >= maxQ && { color: C.textDim }]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day labels + grid */}
          <View style={hm.wrap}>
            <View style={hm.labels}>
              {DAY_LABELS.map((l, i) => (
                <Text key={i} style={hm.label}>{l}</Text>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={hm.scroll}>
              {grid.map((week, wi) => (
                <View key={wi} style={hm.col}>
                  {week.map((cell, di) => (
                    <View
                      key={di}
                      style={[
                        hm.cell,
                        { backgroundColor: densityColor(cell.density, cell.isEmpty) },
                        cell.isToday && hm.cellToday,
                      ]}
                    />
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>

        </View>

        {/* Streak */}
        <View style={hm.streakBox}>
          <Text style={hm.streakNum}>{streak}</Text>
          <Text style={hm.streakFire}>🔥</Text>
          <Text style={hm.streakLabel}>STREAK</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={hm.legend}>
        <Text style={hm.legendTxt}>Less</Text>
        {([C.border, C.amber1, C.amber2, C.amber3, C.amber4] as string[]).map((c, i) => (
          <View key={i} style={[hm.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={hm.legendTxt}>More</Text>
      </View>
    </View>
  );
}

const hm = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  gridSection: { flex: 1 },
  nav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 14, paddingTop: 10,
  },
  navBtn: { padding: 4 },
  navTxt: { fontSize: 22, color: C.amber4, fontWeight: '700' },
  quarterLabel: { fontSize: 11, color: C.textSecondary, letterSpacing: 2, fontWeight: '700' },
  wrap: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 14 },
  labels: { justifyContent: 'space-between', marginRight: 5 },
  label: { fontSize: 9, color: C.textDim, height: CELL + GAP, textAlignVertical: 'center' },
  scroll: { flexDirection: 'row' },
  col: { flexDirection: 'column', marginRight: GAP },
  cell: { width: CELL, height: CELL, borderRadius: 2, marginBottom: GAP },
  cellToday: { borderWidth: 2, borderColor: C.amber4 },
  streakBox: {
    alignItems: 'center', justifyContent: 'center',
    paddingRight: 16, paddingTop: 10, gap: 2, minWidth: 56,
  },
  streakNum: { fontFamily: FONTS.display, fontSize: 28, color: C.amber4, fontWeight: '700', lineHeight: 32 },
  streakFire: { fontSize: 18 },
  streakLabel: { fontSize: 8, color: C.textMuted, letterSpacing: 1.5, fontWeight: '700' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingBottom: 12 },
  legendTxt: { fontSize: 9, color: C.textDim, marginHorizontal: 2 },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
});

// ── Main ──────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Sessions>({});
  const [todaySession, setTodaySession] = useState<Session | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const allSessions = await getAllSessions();
        setSessions(allSessions);
        setTodaySession(await getTodaySession());
      })();
    }, [])
  );

  const density = todaySession ? calcDensity(todaySession) : 0;
  const pct = Math.round(density * 100);
  const totalSets = todaySession?.exercises.reduce((s, e) => s + e.sets, 0) ?? 0;
  const doneSets = todaySession?.exercises.reduce(
    (s, e) => s + e.setsData.filter((sd) => sd.done).length, 0
  ) ?? 0;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>GYMBOOK</Text>
          <Text style={s.subtitle}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        {/* Heatmap */}
        <Text style={s.sectionLabel}>CONSISTENCY</Text>
        <View style={s.card}>
          <Heatmap sessions={sessions} />
        </View>

        {/* Today snapshot */}
        <Text style={[s.sectionLabel, { marginTop: 24 }]}>TODAY</Text>
        <View style={s.card}>
          {!todaySession ? (
            <View style={s.emptyToday}>
              <Text style={s.emptyTitle}>No session yet</Text>
              <Text style={s.emptyText}>Go to the Session tab to add exercises and get started.</Text>
              <TouchableOpacity style={s.goBtn} onPress={() => router.push('/session')}>
                <Text style={s.goBtnText}>START SESSION →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={s.statsRow}>
                <View style={s.statBox}>
                  <Text style={s.statNum}>{doneSets}</Text>
                  <Text style={s.statLabel}>SETS DONE</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statBox}>
                  <Text style={s.statNum}>{totalSets}</Text>
                  <Text style={s.statLabel}>PLANNED</Text>
                </View>
                <View style={s.statDivider} />
                <View style={s.statBox}>
                  <Text style={[s.statNum, pct === 100 && { color: C.amber4 }]}>{pct}%</Text>
                  <Text style={s.statLabel}>COMPLETE</Text>
                </View>
              </View>

              <View style={s.progressBg}>
                <View style={[s.progressFill, { width: `${pct}%` as any }]} />
              </View>

              {!todaySession.locked ? (
                <TouchableOpacity style={s.continueBtn} onPress={() => router.push('/session')}>
                  <Text style={s.continueBtnText}>CONTINUE SESSION →</Text>
                </TouchableOpacity>
              ) : (
                <View style={s.lockedBanner}>
                  <Text style={s.lockedText}>✓ SESSION LOCKED</Text>
                </View>
              )}
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 20, paddingBottom: 40 },

  header: { marginBottom: 28 },
  title: { fontFamily: FONTS.display, fontSize: 30, letterSpacing: 8, color: C.amber4, fontWeight: '700' },
  subtitle: { fontSize: 11, color: C.textMuted, letterSpacing: 1.5, marginTop: 4, textTransform: 'uppercase' },

  sectionLabel: { fontSize: 10, letterSpacing: 3, color: C.textMuted, fontWeight: '700', marginBottom: 10 },

  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    marginBottom: 4,
  },

  emptyToday: { padding: 28, alignItems: 'center' },
  emptyTitle: { fontFamily: FONTS.display, fontSize: 17, color: C.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  goBtn: { backgroundColor: C.amber4, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  goBtnText: { color: '#000', fontWeight: '800', fontSize: 12, letterSpacing: 2 },

  statsRow: { flexDirection: 'row', padding: 20 },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontFamily: FONTS.display, fontSize: 28, color: C.textPrimary, fontWeight: '700' },
  statLabel: { fontSize: 9, color: C.textMuted, letterSpacing: 1.5, marginTop: 4 },
  statDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },

  progressBg: { height: 2, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: C.amber4 },

  continueBtn: {
    margin: 16, marginTop: 0, borderWidth: 1, borderColor: C.amber3,
    borderRadius: 10, paddingVertical: 12, alignItems: 'center',
  },
  continueBtnText: { color: C.amber3, fontSize: 11, letterSpacing: 2, fontWeight: '700' },

  lockedBanner: {
    margin: 16, marginTop: 0, backgroundColor: C.amber0,
    borderRadius: 10, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: C.amber2,
  },
  lockedText: { color: C.amber3, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
});