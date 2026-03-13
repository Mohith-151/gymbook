import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, FONTS } from '../../constants/theme';
import {
  Exercise,
  getExercises, getTemplates,
  getTodaySession,
  newId,
  saveSession,
  Session, SessionExercise,
  sortExercises,
  Template,
  todayKey,
} from '../../store/storage';

// ── Exercise Row ──────────────────────────────────────────

type ExerciseRowProps = {
  ex: SessionExercise;
  locked: boolean;
  onToggle: (id: string, idx: number) => void;
  onDelete: (id: string) => void;
};

function ExerciseRow({ ex, locked, onToggle, onDelete }: ExerciseRowProps) {
  const doneCnt = ex.setsData.filter((s) => s.done).length;
  const complete = doneCnt >= ex.sets;

  return (
    <View style={[row.wrap, complete && row.wrapDone]}>
      <View style={row.left}>
        <Text style={[row.name, complete && row.nameDone]} numberOfLines={1}>{ex.name}</Text>
        <Text style={row.meta}>{doneCnt}/{ex.sets} sets · {ex.reps} reps</Text>
      </View>
      <View style={row.sets}>
        {ex.setsData.map((sd, i) => (
          <TouchableOpacity
            key={i}
            disabled={locked}
            onPress={() => onToggle(ex.id, i)}
            style={[row.box, sd.done && row.boxDone]}
          >
            {sd.done && <Text style={row.check}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>
      {!locked && (
        <TouchableOpacity onPress={() => onDelete(ex.id)} style={row.del}>
          <Ionicons name="trash-outline" size={15} color={C.textDim} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const row = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  wrapDone: { opacity: 0.4 },
  left: { flex: 1, marginRight: 8 },
  name: { fontSize: 14, color: C.textPrimary, fontWeight: '600' },
  nameDone: { textDecorationLine: 'line-through', color: C.textMuted },
  meta: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  sets: { flexDirection: 'row', gap: 5, marginRight: 8 },
  box: {
    width: 24, height: 24, borderRadius: 5,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.bg,
  },
  boxDone: { backgroundColor: C.amber4, borderColor: C.amber4 },
  check: { fontSize: 12, color: '#000', fontWeight: '900' },
  del: { padding: 4 },
});

// ── Add Exercise Modal ────────────────────────────────────

type AddModalProps = {
  visible: boolean;
  onClose: () => void;
  onAdd: (items: SessionExercise[]) => void;
  exercises: Exercise[];
  templates: Template[];
};

type AddTab = 'library' | 'template' | 'manual';

function AddModal({ visible, onClose, onAdd, exercises, templates }: AddModalProps) {
  const [tab, setTab] = useState<AddTab>('library');
  const [manualName, setManualName] = useState('');
  const [manualSets, setManualSets] = useState('3');
  const [manualReps, setManualReps] = useState('10');

  function makeSessionEx(name: string, sets: number, reps: number): SessionExercise {
    return {
      id: newId(), name, sets, reps,
      setsData: Array(sets).fill(null).map(() => ({ done: false })),
    };
  }

  function addFromLibrary(ex: Exercise) {
    onAdd([makeSessionEx(ex.name, ex.sets, ex.reps)]);
    onClose();
  }

  function addFromTemplate(tmpl: Template) {
    onAdd(tmpl.exercises.map((ex) => makeSessionEx(ex.name, ex.sets, ex.reps)));
    onClose();
  }

  function addManual() {
    const name = manualName.trim();
    if (!name) return;
    const s = parseInt(manualSets) || 3;
    const r = parseInt(manualReps) || 10;
    onAdd([makeSessionEx(name, s, r)]);
    setManualName(''); setManualSets('3'); setManualReps('10');
    onClose();
  }

  const TABS: AddTab[] = ['library', 'template', 'manual'];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={m.overlay}>
        <View style={m.sheet}>
          {/* ── Header + Tabs pinned at TOP ── */}
          <View style={m.topSection}>
            <View style={m.handle} />
            <Text style={m.title}>Add Exercise</Text>
            <View style={m.tabs}>
              {TABS.map((t) => (
                <TouchableOpacity key={t} style={[m.tab, tab === t && m.tabActive]} onPress={() => setTab(t)}>
                  <Text style={[m.tabTxt, tab === t && m.tabTxtActive]}>{t.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Manual input fields pinned at top when manual tab active */}
            {tab === 'manual' && (
              <View style={m.manual}>
                <Text style={m.fieldLabel}>EXERCISE NAME</Text>
                <TextInput
                  style={m.input}
                  value={manualName}
                  onChangeText={setManualName}
                  placeholder="e.g. Bench Press"
                  placeholderTextColor={C.textDim}
                  selectionColor={C.amber4}
                  autoFocus
                />
                <View style={m.row2}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={m.fieldLabel}>SETS</Text>
                    <TextInput style={m.input} value={manualSets} onChangeText={setManualSets} keyboardType="number-pad" selectionColor={C.amber4} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={m.fieldLabel}>REPS</Text>
                    <TextInput style={m.input} value={manualReps} onChangeText={setManualReps} keyboardType="number-pad" selectionColor={C.amber4} />
                  </View>
                </View>
                <TouchableOpacity style={m.addBtn} onPress={addManual}>
                  <Text style={m.addBtnTxt}>ADD</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Scrollable list (library / template) ── */}
          {tab !== 'manual' && (
            <ScrollView style={m.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {tab === 'library' && (
                exercises.length === 0
                  ? <Text style={m.empty}>No exercises in library yet. Go to the Library tab to add some.</Text>
                  : exercises.map((ex) => (
                    <TouchableOpacity key={ex.id} style={m.item} onPress={() => addFromLibrary(ex)}>
                      <Text style={m.itemName}>{ex.name}</Text>
                      <Text style={m.itemMeta}>{ex.sets} sets × {ex.reps} reps</Text>
                    </TouchableOpacity>
                  ))
              )}
              {tab === 'template' && (
                templates.length === 0
                  ? <Text style={m.empty}>No templates yet. Go to the Templates tab to create one.</Text>
                  : templates.map((tmpl) => (
                    <TouchableOpacity key={tmpl.id} style={m.item} onPress={() => addFromTemplate(tmpl)}>
                      <Text style={m.itemName}>{tmpl.name}</Text>
                      <Text style={m.itemMeta}>{tmpl.exercises.length} exercises</Text>
                    </TouchableOpacity>
                  ))
              )}
            </ScrollView>
          )}

          <TouchableOpacity style={m.closeBtn} onPress={onClose}>
            <Text style={m.closeTxt}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-start' },
  sheet: {
    backgroundColor: C.surface,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    borderBottomWidth: 1, borderColor: C.border,
    paddingBottom: 16, maxHeight: '85%',
  },
  topSection: { paddingHorizontal: 20, paddingTop: 12 },
  handle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontFamily: FONTS.display, fontSize: 20, color: C.textPrimary, fontWeight: '700', marginBottom: 16 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  tabActive: { backgroundColor: C.amber1, borderColor: C.amber3 },
  tabTxt: { fontSize: 10, color: C.textMuted, letterSpacing: 1.5, fontWeight: '700' },
  tabTxtActive: { color: C.amber4 },
  scroll: { maxHeight: 340, paddingHorizontal: 20 },
  empty: { color: C.textMuted, fontSize: 13, textAlign: 'center', padding: 32, lineHeight: 20 },
  item: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  itemName: { fontSize: 15, color: C.textPrimary, fontWeight: '600' },
  itemMeta: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  manual: { paddingTop: 4, paddingBottom: 8 },
  fieldLabel: { fontSize: 10, color: C.textMuted, letterSpacing: 2, fontWeight: '700', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    color: C.textPrimary, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12,
  },
  row2: { flexDirection: 'row' },
  addBtn: { backgroundColor: C.amber4, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  addBtnTxt: { color: '#000', fontWeight: '800', letterSpacing: 2 },
  closeBtn: { marginTop: 8, paddingVertical: 14, alignItems: 'center' },
  closeTxt: { color: C.textMuted, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
});

// ── Confirm Modal ─────────────────────────────────────────

type ConfirmModalProps = {
  visible: boolean;
  pct: number;
  doneSets: number;
  totalSets: number;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmModal({ visible, pct, doneSets, totalSets, onCancel, onConfirm }: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={cf.overlay}>
        <View style={cf.box}>
          <Text style={cf.title}>Wrap up session?</Text>
          <Text style={cf.sub}>{doneSets}/{totalSets} sets completed ({pct}%).{'\n'}This cannot be undone.</Text>
          <View style={cf.actions}>
            <TouchableOpacity style={cf.cancel} onPress={onCancel}>
              <Text style={cf.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={cf.confirm} onPress={onConfirm}>
              <Text style={cf.confirmTxt}>Lock it in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const cf = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  box: { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.amber2, padding: 24, width: '100%' },
  title: { fontFamily: FONTS.display, fontSize: 20, color: C.textPrimary, fontWeight: '700', marginBottom: 10 },
  sub: { fontSize: 13, color: C.textMuted, lineHeight: 22, marginBottom: 24 },
  actions: { flexDirection: 'row', gap: 12 },
  cancel: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  cancelTxt: { color: C.textMuted, fontWeight: '600' },
  confirm: { flex: 1, backgroundColor: C.amber4, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  confirmTxt: { color: '#000', fontWeight: '800', letterSpacing: 1 },
});

// ── Main Screen ───────────────────────────────────────────

export default function SessionScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [libExercises, setLibExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const s = await getTodaySession();
        setSession(s ?? { date: todayKey(), locked: false, exercises: [] });
        setLibExercises(await getExercises());
        setTemplates(await getTemplates());
      })();
    }, [])
  );

  async function persist(updated: Session) {
    setSession(updated);
    await saveSession(updated);
  }

  function handleToggle(exId: string, setIdx: number) {
    if (!session || session.locked) return;
    const updated: Session = {
      ...session,
      exercises: sortExercises(
        session.exercises.map((ex) => {
          if (ex.id !== exId) return ex;
          const setsData = ex.setsData.map((sd, i) => {
            if (i === setIdx) return { done: !sd.done };
            if (!ex.setsData[setIdx].done && i > setIdx) return { done: false };
            return sd;
          });
          return { ...ex, setsData };
        })
      ),
    };
    persist(updated);
  }

  function handleDelete(exId: string) {
    if (!session || session.locked) return;
    persist({ ...session, exercises: session.exercises.filter((e) => e.id !== exId) });
  }

  function handleAdd(items: SessionExercise[]) {
    if (!session) return;
    persist({ ...session, exercises: sortExercises([...session.exercises, ...items]) });
  }

  async function handleConfirmDone() {
    if (!session) return;
    await persist({ ...session, locked: true });
    setShowConfirm(false);
  }

  const exercises = session?.exercises ?? [];
  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  const doneSets = exercises.reduce((s, e) => s + e.setsData.filter((sd) => sd.done).length, 0);
  const pct = totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <View>
          <Text style={s.topTitle}>GYMBOOK</Text>
          <Text style={s.topDate}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        {session?.locked ? (
          <View style={s.lockedBadge}><Text style={s.lockedBadgeTxt}>LOCKED</Text></View>
        ) : (
          <Text style={s.pct}>{pct}%</Text>
        )}
      </View>

      <View style={s.progressBg}>
        <View style={[s.progressFill, { width: `${pct}%` as any }]} />
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.card}>
          {exercises.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>No exercises yet</Text>
              <Text style={s.emptyText}>Tap "+ Add Exercise" below to get started, or load a template.</Text>
            </View>
          ) : (
            exercises.map((ex) => (
              <ExerciseRow
                key={ex.id}
                ex={ex}
                locked={session?.locked ?? false}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))
          )}
        </View>

        {!session?.locked && (
          <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={16} color={C.amber3} />
            <Text style={s.addBtnTxt}>ADD EXERCISE</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {!session?.locked && exercises.length > 0 && (
        <View style={s.doneWrap}>
          <TouchableOpacity style={s.doneBtn} onPress={() => setShowConfirm(true)}>
            <Text style={s.doneBtnTxt}>DONE FOR TODAY</Text>
          </TouchableOpacity>
        </View>
      )}

      <AddModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAdd}
        exercises={libExercises}
        templates={templates}
      />
      <ConfirmModal
        visible={showConfirm}
        pct={pct}
        doneSets={doneSets}
        totalSets={totalSets}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleConfirmDone}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: (StatusBar.currentHeight ?? 0) + 16,
    paddingBottom: 12,
  },
  topTitle: { fontFamily: FONTS.display, fontSize: 22, letterSpacing: 5, color: C.amber4, fontWeight: '700' },
  topDate: { fontSize: 11, color: C.textMuted, letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' },
  pct: { fontSize: 13, color: C.amber3, fontWeight: '700', letterSpacing: 1 },
  lockedBadge: { backgroundColor: C.amber1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: C.amber2 },
  lockedBadgeTxt: { fontSize: 10, color: C.amber4, letterSpacing: 2, fontWeight: '700' },
  progressBg: { height: 2, backgroundColor: C.border, marginHorizontal: 20, marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: C.amber4 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 12 },
  empty: { padding: 32, alignItems: 'center' },
  emptyTitle: { fontFamily: FONTS.display, fontSize: 17, color: C.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: C.amber3, borderRadius: 10, paddingVertical: 12, marginBottom: 12,
  },
  addBtnTxt: { color: C.amber3, fontSize: 12, letterSpacing: 2, fontWeight: '700' },
  doneWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, paddingBottom: 28, backgroundColor: C.bg,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  doneBtn: { backgroundColor: C.amber4, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  doneBtnTxt: { color: '#000', fontSize: 13, fontWeight: '900', letterSpacing: 3 },
});
