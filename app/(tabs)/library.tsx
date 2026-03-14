import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/ThemeContext';
import { FONTS } from '../../constants/theme';
import { deleteExercise, Exercise, getExercises, newId, saveExercise } from '../../store/storage';

// ── Exercise Modal ────────────────────────────────────────

type ExerciseModalProps = {
  visible: boolean;
  initial: Exercise | null;
  onSave: (ex: Exercise) => void;
  onClose: () => void;
};

function ExerciseModal({ visible, initial, onSave, onClose }: ExerciseModalProps) {
  const { C } = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [sets, setSets] = useState(String(initial?.sets ?? 3));
  const [reps, setReps] = useState(String(initial?.reps ?? 10));
  const [notes, setNotes] = useState(initial?.notes ?? '');

  useFocusEffect(useCallback(() => {
    setName(initial?.name ?? '');
    setSets(String(initial?.sets ?? 3));
    setReps(String(initial?.reps ?? 10));
    setNotes(initial?.notes ?? '');
  }, [initial]));

  function close() {
    setName(initial?.name ?? ''); setSets(String(initial?.sets ?? 3));
    setReps(String(initial?.reps ?? 10)); setNotes(initial?.notes ?? '');
    onClose();
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({ id: initial?.id ?? newId(), name: name.trim(), sets: parseInt(sets) || 3, reps: parseInt(reps) || 10, notes: notes.trim() });
    close();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={m.overlay}>
        <View style={[m.sheet, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={m.topSection}>
            <View style={[m.handle, { backgroundColor: C.border }]} />
            <Text style={[m.title, { color: C.textPrimary }]}>{initial ? 'Edit Exercise' : 'New Exercise'}</Text>

            <Text style={[m.label, { color: C.textMuted }]}>NAME</Text>
            <TextInput style={[m.input, { backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary }]} value={name} onChangeText={setName} placeholder="e.g. Bench Press" placeholderTextColor={C.textDim} selectionColor={C.green4} autoFocus />

            <View style={m.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[m.label, { color: C.textMuted }]}>DEFAULT SETS</Text>
                <TextInput style={[m.input, { backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary }]} value={sets} onChangeText={setSets} keyboardType="number-pad" selectionColor={C.green4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[m.label, { color: C.textMuted }]}>DEFAULT REPS</Text>
                <TextInput style={[m.input, { backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary }]} value={reps} onChangeText={setReps} keyboardType="number-pad" selectionColor={C.green4} />
              </View>
            </View>

            <Text style={[m.label, { color: C.textMuted }]}>NOTES (optional)</Text>
            <TextInput style={[m.input, { backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary, height: 80, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Form cues, weight targets..." placeholderTextColor={C.textDim} multiline selectionColor={C.green4} />
          </View>

          <View style={m.footer}>
            <TouchableOpacity style={[m.cancel, { borderColor: C.border }]} onPress={close}>
              <Text style={[m.cancelTxt, { color: C.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[m.save, { backgroundColor: C.green4 }]} onPress={handleSave}>
              <Text style={m.saveTxt}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-start' },
  sheet: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderBottomWidth: 1, paddingBottom: 20 },
  topSection: { padding: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontFamily: FONTS.display, fontSize: 20, fontWeight: '700', marginBottom: 18 },
  label: { fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 6, marginTop: 14 },
  input: { borderRadius: 10, borderWidth: 1, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12 },
  row: { flexDirection: 'row' },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 8 },
  cancel: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  cancelTxt: { fontWeight: '600' },
  save: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveTxt: { color: '#fff', fontWeight: '800', letterSpacing: 2 },
});

// ── Exercise Card ─────────────────────────────────────────

type ExerciseCardProps = {
  ex: Exercise;
  onEdit: (ex: Exercise) => void;
  onDelete: (id: string) => void;
};

function ExerciseCard({ ex, onEdit, onDelete }: ExerciseCardProps) {
  const { C } = useTheme();
  return (
    <View style={[ec.wrap, { borderBottomColor: C.border }]}>
      <View style={ec.main}>
        <Text style={[ec.name, { color: C.textPrimary }]}>{ex.name}</Text>
        <Text style={[ec.meta, { color: C.textMuted }]}>{ex.sets} sets × {ex.reps} reps</Text>
        {ex.notes ? <Text style={[ec.notes, { color: C.textDim }]} numberOfLines={1}>{ex.notes}</Text> : null}
      </View>
      <TouchableOpacity style={ec.iconBtn} onPress={() => onEdit(ex)}>
        <Ionicons name="pencil-outline" size={15} color={C.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity style={ec.iconBtn} onPress={() => onDelete(ex.id)}>
        <Ionicons name="trash-outline" size={15} color={C.textDim} />
      </TouchableOpacity>
    </View>
  );
}

const ec = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1 },
  main: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12, marginTop: 2 },
  notes: { fontSize: 11, marginTop: 3, fontStyle: 'italic' },
  iconBtn: { padding: 8 },
});

// ── Main ──────────────────────────────────────────────────

export default function LibraryScreen() {
  const { C } = useTheme();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => setExercises(await getExercises()))();
  }, []));

  async function handleSave(ex: Exercise) { await saveExercise(ex); setExercises(await getExercises()); }
  async function handleDelete(id: string) { await deleteExercise(id); setExercises(await getExercises()); }
  function openNew() { setEditing(null); setShowModal(true); }
  function openEdit(ex: Exercise) { setEditing(ex); setShowModal(true); }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]}>
      <View style={s.topBar}>
        <Text style={[s.title, { color: C.green4 }]}>LIBRARY</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="barbell-outline" size={40} color={C.textDim} />
            <Text style={[s.emptyTitle, { color: C.textPrimary }]}>Empty Library</Text>
            <Text style={[s.emptyText, { color: C.textMuted }]}>Add your go-to exercises here with default sets and reps. They'll be ready to pull into any session or template.</Text>
            <TouchableOpacity style={[s.emptyBtn, { backgroundColor: C.green4 }]} onPress={openNew}>
              <Text style={s.emptyBtnTxt}>ADD EXERCISE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            {exercises.map((ex) => <ExerciseCard key={ex.id} ex={ex} onEdit={openEdit} onDelete={handleDelete} />)}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={[s.fab, { backgroundColor: C.green4, shadowColor: C.green4 }]} onPress={openNew}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <ExerciseModal visible={showModal} initial={editing} onSave={handleSave} onClose={() => setShowModal(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 12 },
  title: { fontFamily: FONTS.display, fontSize: 22, letterSpacing: 5, fontWeight: '700' },
  content: { padding: 20, paddingTop: 8 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontFamily: FONTS.display, fontSize: 20 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { marginTop: 8, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 2 },
  card: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
});
