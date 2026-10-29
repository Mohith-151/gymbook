// app/(tabs)/session.tsx
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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/ThemeContext';
import { FONTS } from '../../constants/theme';
import { Exercise, getExercises } from '../../store/exerciseStore';
import {
  calcDensity,
  getTodaySession,
  newId,
  saveSession,
  Session,
  SessionExercise,
  sortExercises,
  todayKey,
} from '../../store/sessionStore';
import { getTemplates, Template } from '../../store/templateStore';

export default function SessionScreen() {
  const { C } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmLockVisible, setConfirmLockVisible] = useState(false);

  const [activeTab, setActiveTab] = useState<'library' | 'templates' | 'manual'>('library');
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  const [mName, setMName] = useState('');
  const [mSets, setMSets] = useState('3');
  const [mReps, setMReps] = useState('10');

  const loadSession = useCallback(() => {
    const s = getTodaySession();
    if (s) {
      setSession({ ...s, exercises: sortExercises(s.exercises) });
    } else {
      setSession(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSession();
    }, [loadSession])
  );

  function startOrGetSession(): Session {
    if (session) return session;
    const ns: Session = { date: todayKey(), locked: false, exercises: [] };
    return ns;
  }

  function toggleSet(exId: string, setIdx: number) {
    if (!session || session.locked) return;
    const updatedExercises = session.exercises.map((ex) => {
      if (ex.id !== exId) return ex;
      const newSetsData = [...ex.setsData];
      newSetsData[setIdx] = { done: !newSetsData[setIdx]?.done };
      return { ...ex, setsData: newSetsData };
    });

    const updated = { ...session, exercises: sortExercises(updatedExercises) };
    setSession(updated);
    saveSession(updated);
  }

  function openAddModal() {
    setLibrary(getExercises());
    setTemplates(getTemplates());
    setMName('');
    setMSets('3');
    setMReps('10');
    setModalVisible(true);
  }

  function addExerciseFromLib(ex: Exercise) {
    const cur = startOrGetSession();
    const newEx: SessionExercise = {
      id: newId(),
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      setsData: Array(ex.sets).fill({ done: false }),
    };
    const updated = { ...cur, exercises: sortExercises([...cur.exercises, newEx]) };
    setSession(updated);
    saveSession(updated);
    setModalVisible(false);
  }

  function addTemplate(tpl: Template) {
    const cur = startOrGetSession();
    const newExs: SessionExercise[] = tpl.exercises.map((te) => ({
      id: newId(),
      name: te.name,
      sets: te.sets,
      reps: te.reps,
      setsData: Array(te.sets).fill({ done: false }),
    }));
    const updated = { ...cur, exercises: sortExercises([...cur.exercises, ...newExs]) };
    setSession(updated);
    saveSession(updated);
    setModalVisible(false);
  }

  function addManual() {
    if (!mName.trim()) return;
    const cur = startOrGetSession();
    const numSets = parseInt(mSets, 10) || 1;
    const numReps = parseInt(mReps, 10) || 1;
    const newEx: SessionExercise = {
      id: newId(),
      name: mName.trim(),
      sets: numSets,
      reps: numReps,
      setsData: Array(numSets).fill({ done: false }),
    };
    const updated = { ...cur, exercises: sortExercises([...cur.exercises, newEx]) };
    setSession(updated);
    saveSession(updated);
    setModalVisible(false);
  }

  function handleLock() {
    if (!session) return;
    const lockedSession = { ...session, locked: true };
    setSession(lockedSession);
    saveSession(lockedSession);
    setConfirmLockVisible(false);
  }

  const density = session ? calcDensity(session) : 0;
  const pct = Math.round(density * 100);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: C.green4 }]}>TODAY'S SESSION</Text>
        <Text style={[s.subtitle, { color: C.textMuted }]}>{todayKey()}</Text>
      </View>

      {session && (
        <View style={s.progressContainer}>
          <View style={[s.progressBg, { backgroundColor: C.border }]}>
            <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: C.green4 }]} />
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {(!session || session.exercises.length === 0) ? (
          <View style={s.emptyBox}>
            <Text style={[s.emptyTxt, { color: C.textMuted }]}>No exercises added for today yet.</Text>
          </View>
        ) : (
          session.exercises.map((ex) => {
            const isAllDone = ex.setsData.every((st) => st.done);
            return (
              <View
                key={ex.id}
                style={[
                  s.exCard,
                  { backgroundColor: C.surface, borderColor: isAllDone ? C.green2 : C.border },
                ]}
              >
                <View style={s.exHeader}>
                  <Text style={[s.exName, { color: C.textPrimary }]}>{ex.name}</Text>
                  <Text style={[s.exMeta, { color: C.textMuted }]}>
                    {ex.sets} SETS × {ex.reps} REPS
                  </Text>
                </View>

                <View style={s.setsRow}>
                  {ex.setsData.map((st, sIdx) => (
                    <TouchableOpacity
                      key={sIdx}
                      disabled={session.locked}
                      style={[
                        s.setChip,
                        {
                          backgroundColor: st.done ? C.green4 : C.bg,
                          borderColor: st.done ? C.green4 : C.border,
                        },
                      ]}
                      onPress={() => toggleSet(ex.id, sIdx)}
                    >
                      <Text style={[s.setChipTxt, { color: st.done ? '#000' : C.textSecondary }]}>
                        {st.done ? '✓' : sIdx + 1}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })
        )}

        {session && !session.locked && (
          <TouchableOpacity style={[s.addExBtn, { borderColor: C.green3 }]} onPress={openAddModal}>
            <Text style={[s.addExTxt, { color: C.green3 }]}>+ ADD EXERCISE</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Lock session bottom bar */}
      {session && !session.locked && session.exercises.length > 0 && (
        <View style={[s.bottomBar, { backgroundColor: C.surface, borderColor: C.border }]}>
          <TouchableOpacity style={[s.lockBtn, { backgroundColor: C.green4 }]} onPress={() => setConfirmLockVisible(true)}>
            <Text style={s.lockBtnTxt}>DONE FOR TODAY</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Slide-down Add Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[s.modalContent, { backgroundColor: C.surface, borderColor: C.border, paddingTop: (StatusBar.currentHeight || 20) + 16 }]}>
                <View style={s.tabHeader}>
                  {(['library', 'templates', 'manual'] as const).map((tab) => (
                    <TouchableOpacity
                      key={tab}
                      style={[s.tabBtn, activeTab === tab && { borderBottomColor: C.green4, borderBottomWidth: 2 }]}
                      onPress={() => setActiveTab(tab)}
                    >
                      <Text style={[s.tabTxt, { color: activeTab === tab ? C.green4 : C.textMuted }]}>
                        {tab.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {activeTab === 'library' && (
                  <ScrollView style={{ maxHeight: 250 }}>
                    {library.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[s.pickRow, { borderColor: C.border }]}
                        onPress={() => addExerciseFromLib(item)}
                      >
                        <Text style={[s.pickName, { color: C.textPrimary }]}>{item.name}</Text>
                        <Text style={[s.pickMeta, { color: C.textMuted }]}>{item.sets}×{item.reps}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {activeTab === 'templates' && (
                  <ScrollView style={{ maxHeight: 250 }}>
                    {templates.map((tpl) => (
                      <TouchableOpacity
                        key={tpl.id}
                        style={[s.pickRow, { borderColor: C.border }]}
                        onPress={() => addTemplate(tpl)}
                      >
                        <Text style={[s.pickName, { color: C.textPrimary }]}>{tpl.name}</Text>
                        <Text style={[s.pickMeta, { color: C.green4 }]}>{tpl.exercises.length} EXERCISES</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {activeTab === 'manual' && (
                  <View style={{ gap: 10 }}>
                    <TextInput
                      style={[s.input, { backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary }]}
                      placeholder="Exercise Name"
                      placeholderTextColor={C.textMuted}
                      value={mName}
                      onChangeText={setMName}
                      autoFocus
                    />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TextInput
                        style={[s.input, { flex: 1, backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary }]}
                        keyboardType="number-pad"
                        placeholder="Sets"
                        placeholderTextColor={C.textMuted}
                        value={mSets}
                        onChangeText={setMSets}
                      />
                      <TextInput
                        style={[s.input, { flex: 1, backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary }]}
                        keyboardType="number-pad"
                        placeholder="Reps"
                        placeholderTextColor={C.textMuted}
                        value={mReps}
                        onChangeText={setMReps}
                      />
                    </View>
                    <TouchableOpacity style={[s.btnSave, { backgroundColor: C.green4 }]} onPress={addManual}>
                      <Text style={s.btnSaveTxt}>ADD TO SESSION</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Lock Confirmation Modal */}
      <Modal visible={confirmLockVisible} animationType="fade" transparent>
        <View style={s.centerModalOverlay}>
          <View style={[s.confirmBox, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[s.confirmTitle, { color: C.textPrimary }]}>LOCK SESSION?</Text>
            <Text style={[s.confirmTxt, { color: C.textMuted }]}>
              Once locked, your workout for today will be saved and recorded to your heatmap.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity style={[s.btnCancel, { flex: 1, borderColor: C.border }]} onPress={() => setConfirmLockVisible(false)}>
                <Text style={[s.btnCancelTxt, { color: C.textMuted }]}>NOT YET</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnSave, { flex: 1, backgroundColor: C.green4 }]} onPress={handleLock}>
                <Text style={s.btnSaveTxt}>LOCK IT IN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontFamily: FONTS.display, fontSize: 30, letterSpacing: 8, fontWeight: '700' },
  subtitle: { fontSize: 11, letterSpacing: 1.5, marginTop: 4 },
  progressContainer: { paddingHorizontal: 20, marginBottom: 10 },
  progressBg: { height: 3, borderRadius: 2 },
  progressFill: { height: '100%', borderRadius: 2 },
  list: { padding: 20, paddingBottom: 100, gap: 12 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyTxt: { fontSize: 13, textAlign: 'center' },
  exCard: { padding: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exName: { fontSize: 16, fontWeight: '700' },
  exMeta: { fontSize: 11, letterSpacing: 1 },
  setsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  setChip: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  setChipTxt: { fontSize: 12, fontWeight: '800' },
  addExBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  addExTxt: { fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  bottomBar: { padding: 16, borderTopWidth: 1 },
  lockBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  lockBtnTxt: { color: '#000', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-start' },
  modalContent: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderWidth: 1, padding: 20, gap: 14 },
  tabHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#333', marginBottom: 10 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center' },
  tabTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  pickRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  pickName: { fontSize: 14, fontWeight: '600' },
  pickMeta: { fontSize: 12, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14 },
  btnSave: { borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnSaveTxt: { color: '#000', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  centerModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  confirmBox: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 12 },
  confirmTitle: { fontFamily: FONTS.display, fontSize: 18, letterSpacing: 2 },
  confirmTxt: { fontSize: 13, lineHeight: 18 },
  btnCancel: { borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnCancelTxt: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
});