import { Ionicons } from '@expo/vector-icons';
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
import { useTheme } from '../../constants/ThemeContext';
import { FONTS } from '../../constants/theme';
import { calcDensity, getAllSessions, getTodaySession, Session, Sessions } from '../../store/storage';

const CELL = 13;
const GAP = 3;

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function getQuarterInfo(quarterIndex: number): { label: string; startMonth: number; year: number } {
  const year = 2026 + Math.floor(quarterIndex / 4);
  const quarter = (quarterIndex % 4) + 1;
  const startMonth = (quarter - 1) * 3;
  return { label: `Q${quarter} ${year}`, startMonth, year };
}

function currentQuarterIndex(): number {
  const now = today();
  const yearDiff = now.getFullYear() - 2026;
  const quarter = Math.floor(now.getMonth() / 3);
  return yearDiff * 4 + quarter;
}

type GridCell = {
  dateKey: string;
  density: number | null;
  isToday: boolean;
  isEmpty: boolean;
};

function buildQuarterGrid(sessions: Sessions, quarterIndex: number): GridCell[][] {
  const { startMonth, year } = getQuarterInfo(quarterIndex);
  const todayStr = toDateKey(today());
  const todayDate = today();

  const quarterStart = new Date(year, startMonth, 1);
  const quarterEnd = new Date(year, startMonth + 3, 0);

  const gridStart = new Date(quarterStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const gridEnd = new Date(quarterEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

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
      continue;
    } else {
      break;
    }
  }
  return streak;
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function Heatmap({ sessions }: { sessions: Sessions }) {
  const { C } = useTheme();
  const maxQ = currentQuarterIndex();
  const [quarterIndex, setQuarterIndex] = useState(maxQ);
  const grid = buildQuarterGrid(sessions, quarterIndex);
  const streak = calcStreak(sessions);
  const { label } = getQuarterInfo(quarterIndex);

  function densityColor(d: number | null, isEmpty: boolean): string {
    if (isEmpty) return C.bg;
    if (d === null) return C.surface2;
    if (d === 0) return C.surface2;
    if (d < 0.25) return C.green1;
    if (d < 0.5) return C.green2;
    if (d < 0.75) return C.green3;
    return C.green4;
  }

  return (
    <View>
      <View style={hm.topRow}>
        <View style={hm.gridSection}>
          <View style={hm.nav}>
            <TouchableOpacity onPress={() => setQuarterIndex(q => q - 1)} style={hm.navBtn} disabled={quarterIndex <= 0}>
              <Text style={[hm.navTxt, { color: quarterIndex <= 0 ? C.textDim : C.green4 }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[hm.quarterLabel, { color: C.textSecondary }]}>{label}</Text>
            <TouchableOpacity onPress={() => setQuarterIndex(q => q + 1)} style={hm.navBtn} disabled={quarterIndex >= maxQ}>
              <Text style={[hm.navTxt, { color: quarterIndex >= maxQ ? C.textDim : C.green4 }]}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={hm.wrap}>
            <View style={hm.labels}>
              {DAY_LABELS.map((l, i) => (
                <Text key={i} style={[hm.label, { color: C.textDim }]}>{l}</Text>
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
                        cell.isToday && { borderWidth: 2, borderColor: C.green4 },
                      ]}
                    />
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={hm.streakBox}>
          <Text style={[hm.streakNum, { color: C.green4 }]}>{streak}</Text>
          <Text style={hm.streakFire}>🔥</Text>
          <Text style={[hm.streakLabel, { color: C.textMuted }]}>STREAK</Text>
        </View>
      </View>

      <View style={hm.legend}>
        <Text style={[hm.legendTxt, { color: C.textDim }]}>Less</Text>
        {([C.surface2, C.green1, C.green2, C.green3, C.green4] as string[]).map((c, i) => (
          <View key={i} style={[hm.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={[hm.legendTxt, { color: C.textDim }]}>More</Text>
      </View>
    </View>
  );
}

const hm = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center' },
  gridSection: { flex: 1 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingTop: 10 },
  navBtn: { padding: 4 },
  navTxt: { fontSize: 22, fontWeight: '700' },
  quarterLabel: { fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  wrap: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 14 },
  labels: { justifyContent: 'space-between', marginRight: 5 },
  label: { fontSize: 9, height: CELL + GAP, textAlignVertical: 'center' },
  scroll: { flexDirection: 'row' },
  col: { flexDirection: 'column', marginRight: GAP },
  cell: { width: CELL, height: CELL, borderRadius: 2, marginBottom: GAP },
  streakBox: { alignItems: 'center', justifyContent: 'center', paddingRight: 16, paddingTop: 10, gap: 2, minWidth: 56 },
  streakNum: { fontFamily: FONTS.display, fontSize: 28, fontWeight: '700', lineHeight: 32 },
  streakFire: { fontSize: 18 },
  streakLabel: { fontSize: 8, letterSpacing: 1.5, fontWeight: '700' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingBottom: 12 },
  legendTxt: { fontSize: 9, marginHorizontal: 2 },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
});

export default function HomeScreen() {
  const router = useRouter();
  const { C, isDark, toggleTheme } = useTheme();
  const [sessions, setSessions] = useState<Sessions>({});
  const [todaySession, setTodaySession] = useState<Session | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setSessions(await getAllSessions());
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
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={[s.title, { color: C.green4 }]}>GYMBOOK</Text>
            <Text style={[s.subtitle, { color: C.textMuted }]}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity onPress={toggleTheme} style={[s.themeBtn, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={C.green4} />
          </TouchableOpacity>
        </View>

        {/* Heatmap */}
        <Text style={[s.sectionLabel, { color: C.textMuted }]}>CONSISTENCY</Text>
        <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Heatmap sessions={sessions} />
        </View>

        {/* Today */}
        <Text style={[s.sectionLabel, { color: C.textMuted, marginTop: 24 }]}>TODAY</Text>
        <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          {!todaySession ? (
            <View style={s.emptyToday}>
              <Text style={[s.emptyTitle, { color: C.textPrimary }]}>No session yet</Text>
              <Text style={[s.emptyText, { color: C.textMuted }]}>Go to the Session tab to add exercises and get started.</Text>
              <TouchableOpacity style={[s.goBtn, { backgroundColor: C.green4 }]} onPress={() => router.push('/session')}>
                <Text style={[s.goBtnText, { color: isDark ? '#000' : '#fff' }]}>START SESSION →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={s.statsRow}>
                <View style={s.statBox}>
                  <Text style={[s.statNum, { color: C.textPrimary }]}>{doneSets}</Text>
                  <Text style={[s.statLabel, { color: C.textMuted }]}>SETS DONE</Text>
                </View>
                <View style={[s.statDivider, { backgroundColor: C.border }]} />
                <View style={s.statBox}>
                  <Text style={[s.statNum, { color: C.textPrimary }]}>{totalSets}</Text>
                  <Text style={[s.statLabel, { color: C.textMuted }]}>PLANNED</Text>
                </View>
                <View style={[s.statDivider, { backgroundColor: C.border }]} />
                <View style={s.statBox}>
                  <Text style={[s.statNum, { color: pct === 100 ? C.green4 : C.textPrimary }]}>{pct}%</Text>
                  <Text style={[s.statLabel, { color: C.textMuted }]}>COMPLETE</Text>
                </View>
              </View>

              <View style={[s.progressBg, { backgroundColor: C.border }]}>
                <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: C.green4 }]} />
              </View>

              {!todaySession.locked ? (
                <TouchableOpacity style={[s.continueBtn, { borderColor: C.green3 }]} onPress={() => router.push('/session')}>
                  <Text style={[s.continueBtnText, { color: C.green3 }]}>CONTINUE SESSION →</Text>
                </TouchableOpacity>
              ) : (
                <View style={[s.lockedBanner, { backgroundColor: C.green0, borderColor: C.green2 }]}>
                  <Text style={[s.lockedText, { color: C.green3 }]}>✓ SESSION LOCKED</Text>
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
  safe: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontFamily: FONTS.display, fontSize: 30, letterSpacing: 8, fontWeight: '700' },
  subtitle: { fontSize: 11, letterSpacing: 1.5, marginTop: 4, textTransform: 'uppercase' },
  themeBtn: { padding: 8, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  sectionLabel: { fontSize: 10, letterSpacing: 3, fontWeight: '700', marginBottom: 10 },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', marginBottom: 4 },
  emptyToday: { padding: 28, alignItems: 'center' },
  emptyTitle: { fontFamily: FONTS.display, fontSize: 17, marginBottom: 8 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  goBtn: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  goBtnText: { fontWeight: '800', fontSize: 12, letterSpacing: 2 },
  statsRow: { flexDirection: 'row', padding: 20 },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontFamily: FONTS.display, fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 9, letterSpacing: 1.5, marginTop: 4 },
  statDivider: { width: 1, marginVertical: 4 },
  progressBg: { height: 2, marginHorizontal: 20, marginBottom: 16 },
  progressFill: { height: '100%' },
  continueBtn: { margin: 16, marginTop: 0, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  continueBtnText: { fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  lockedBanner: { margin: 16, marginTop: 0, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  lockedText: { fontSize: 11, letterSpacing: 2, fontWeight: '700' },
});
