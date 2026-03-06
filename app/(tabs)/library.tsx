import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, FONTS } from '../../constants/theme';
import { deleteExercise, Exercise, getExercises, newId, saveExercise } from '../../store/storage';

// ── Exercise Modal ────────────────────────────────────────

type ExerciseModalProps = {
  visible: boolean;
  initial: Exercise | null;
  onSave: (ex: Exercise) => void;
  onClose: () => void;
};

function ExerciseModal({ visible, initial, onSave, onClose }: ExerciseModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [sets, setSets] = useState(String(initial?.sets ?? 3));
  const [reps, setReps] = useState(String(initial?.reps ?? 10));
  const [notes, setNotes] = useState(initial?.notes ?? '');

  useFocusEffect(
    useCallback(() => {
      setName(initial?.name ?? '');
      setSets(String(initial?.sets ?? 3));
      setReps(String(initial?.reps ?? 10));
      setNotes(initial?.notes ?? '');
    }, [initial])
  );

  function close() {
    setName(initial?.name ?? ''); setSets(String(initial?.sets ?? 3));
    setReps(String(initial?.reps ?? 10)); setNotes(initial?.notes ?? '');
    onClose();
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      id: initial?.id ?? newId(),
      name: name.trim(),
      sets: parseInt(sets) || 3,
      reps: parseInt(reps) || 10,
      notes: notes.trim(),
    });
    close();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={m.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ width: '100%' }}
        >
          <View style={m.sheet}>
            <View style={m.handle} />
            <Text style={m.title}>{initial ? 'Edit Exercise' : 'New Exercise'}</Text>

            <Text style={m.label}>NAME</Text>
            <TextInput
              style={m.input} value={name} onChangeText={setName}
              placeholder="e.g. Bench Press" placeholderTextColor={C.textDim} selectionColor={C.amber4}
            />

            <View style={m.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={m.label}>DEFAULT SETS</Text>
                <TextInput style={m.input} value={sets} onChangeText={setSets} keyboardType="number-pad" selectionColor={C.amber4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={m.label}>DEFAULT REPS</Text>
                <TextInput style={m.input} value={reps} onChangeText={setReps} keyboardType="number-pad" selectionColor={C.amber4} />
              </View>
            </View>

            <Text style={m.label}>NOTES (optional)</Text>
            <TextInput
              style={[m.input, { height: 80, textAlignVertical: 'top' }]}
              value={notes} onChangeText={setNotes}
              placeholder="Form cues, weight targets..." placeholderTextColor={C.textDim}
              multiline selectionColor={C.amber4}
            />

            <View style={m.footer}>
              <TouchableOpacity style={m.cancel} onPress={close}>
                <Text style={m.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={m.save} onPress={handleSave}>
                <Text style={m.saveTxt}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderTopWidth: 1, borderColor: C.border, padding: 20, paddingBottom: 36,
  },
  handle: { width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontFamily: FONTS.display, fontSize: 20, color: C.textPrimary, fontWeight: '700', marginBottom: 18 },
  label: { fontSize: 10, color: C.textMuted, letterSpacing: 2, fontWeight: '700', marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    color: C.textPrimary, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12,
  },
  row: { flexDirection: 'row' },
  footer: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancel: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  cancelTxt: { color: C.textMuted, fontWeight: '600' },
  save: { flex: 1, backgroundColor: C.amber4, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveTxt: { color: '#000', fontWeight: '800', letterSpacing: 2 },
});

// ── Exercise Card ─────────────────────────────────────────

type ExerciseCardProps = {
  ex: Exercise;
  onEdit: (ex: Exercise) => void;
  onDelete: (id: string) => void;
};

function ExerciseCard({ ex, onEdit, onDelete }: ExerciseCardProps) {
  return (
    <View style={ec.wrap}>
      <View style={ec.main}>
        <Text style={ec.name}>{ex.name}</Text>
        <Text style={ec.meta}>{ex.sets} sets × {ex.reps} reps</Text>
        {ex.notes ? <Text style={ec.notes} numberOfLines={1}>{ex.notes}</Text> : null}
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
  wrap: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  main: { flex: 1 },
  name: { fontSize: 15, color: C.textPrimary, fontWeight: '600' },
  meta: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  notes: { fontSize: 11, color: C.textDim, marginTop: 3, fontStyle: 'italic' },
  iconBtn: { padding: 8 },
});

// ── Main ──────────────────────────────────────────────────

export default function LibraryScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => setExercises(await getExercises()))();
    }, [])
  );

  async function handleSave(ex: Exercise) {
    await saveExercise(ex);
    setExercises(await getExercises());
  }

  async function handleDelete(id: string) {
    await deleteExercise(id);
    setExercises(await getExercises());
  }

  function openNew() { setEditing(null); setShowModal(true); }
  function openEdit(ex: Exercise) { setEditing(ex); setShowModal(true); }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.title}>LIBRARY</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {exercises.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="barbell-outline" size={40} color={C.textDim} />
            <Text style={s.emptyTitle}>Empty Library</Text>
            <Text style={s.emptyText}>
              Add your go-to exercises here with default sets and reps.
              They'll be ready to pull into any session or template.
            </Text>
            <TouchableOpacity style={s.emptyBtn} onPress={openNew}>
              <Text style={s.emptyBtnTxt}>ADD EXERCISE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.card}>
            {exercises.map((ex) => (
              <ExerciseCard key={ex.id} ex={ex} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={openNew}>
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      <ExerciseModal
        visible={showModal}
        initial={editing}
        onSave={handleSave}
        onClose={() => setShowModal(false)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  topBar: { paddingHorizontal: 20, paddingTop: 25, paddingBottom: 12 },
  title: { fontFamily: FONTS.display, fontSize: 22, letterSpacing: 5, color: C.amber4, fontWeight: '700' },
  content: { padding: 20, paddingTop: 8 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontFamily: FONTS.display, fontSize: 20, color: C.textPrimary },
  emptyText: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
  emptyBtn: { marginTop: 8, backgroundColor: C.amber4, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnTxt: { color: '#000', fontWeight: '800', fontSize: 12, letterSpacing: 2 },
  card: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.amber4,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.amber4, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
});