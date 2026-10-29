// app/(tabs)/library.tsx
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
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../constants/ThemeContext';
import { FONTS } from '../../constants/theme';
import {
  deleteExercise,
  Exercise,
  getExercises,
  saveExercise,
} from '../../store/exerciseStore';
import { newId } from '../../store/sessionStore';

export default function LibraryScreen() {
  const { C } = useTheme();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [sets, setSets] = useState('3');
  const [reps, setReps] = useState('10');

  const loadExercises = useCallback(() => {
    setExercises(getExercises());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [loadExercises])
  );

  function openCreate() {
    setEditingId(null);
    setName('');
    setSets('3');
    setReps('10');
    setModalVisible(true);
  }

  function openEdit(ex: Exercise) {
    setEditingId(ex.id);
    setName(ex.name);
    setSets(String(ex.sets));
    setReps(String(ex.reps));
    setModalVisible(true);
  }

  function handleSave() {
    if (!name.trim()) return;
    const ex: Exercise = {
      id: editingId ?? newId(),
      name: name.trim(),
      sets: parseInt(sets, 10) || 1,
      reps: parseInt(reps, 10) || 1,
    };
    saveExercise(ex);
    setModalVisible(false);
    loadExercises();
  }

  function handleDelete(id: string) {
    deleteExercise(id);
    loadExercises();
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: C.green4 }]}>EXERCISES</Text>
        <Text style={[s.subtitle, { color: C.textMuted }]}>
          {exercises.length} EXERCISES IN LIBRARY
        </Text>
      </View>

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {exercises.map((ex) => (
          <View key={ex.id} style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={s.cardLeft}>
              <Text style={[s.exName, { color: C.textPrimary }]}>{ex.name}</Text>
              <Text style={[s.exMeta, { color: C.textMuted }]}>
                {ex.sets} SETS × {ex.reps} REPS
              </Text>
            </View>
            <View style={s.cardActions}>
              <TouchableOpacity onPress={() => openEdit(ex)} style={s.iconBtn}>
                <Ionicons name="pencil-outline" size={18} color={C.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(ex.id)} style={s.iconBtn}>
                <Ionicons name="trash-outline" size={18} color="#f85149" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[s.fab, { backgroundColor: C.green4 }]} onPress={openCreate}>
        <Ionicons name="add" size={28} color="#000" />
      </TouchableOpacity>

      {/* Slide-Down Top Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[s.modalContent, { backgroundColor: C.surface, borderColor: C.border, paddingTop: (StatusBar.currentHeight || 20) + 16 }]}>
                <Text style={[s.modalTitle, { color: C.textPrimary }]}>
                  {editingId ? 'EDIT EXERCISE' : 'NEW EXERCISE'}
                </Text>

                <TextInput
                  style={[s.input, { backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary }]}
                  placeholder="Exercise Name (e.g. Bench Press)"
                  placeholderTextColor={C.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />

                <View style={s.rowInputs}>
                  <View style={s.numCol}>
                    <Text style={[s.inputLabel, { color: C.textMuted }]}>SETS</Text>
                    <TextInput
                      style={[s.input, { backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary }]}
                      keyboardType="number-pad"
                      value={sets}
                      onChangeText={setSets}
                    />
                  </View>
                  <View style={s.numCol}>
                    <Text style={[s.inputLabel, { color: C.textMuted }]}>REPS</Text>
                    <TextInput
                      style={[s.input, { backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary }]}
                      keyboardType="number-pad"
                      value={reps}
                      onChangeText={setReps}
                    />
                  </View>
                </View>

                <View style={s.modalActions}>
                  <TouchableOpacity style={[s.btnCancel, { borderColor: C.border }]} onPress={() => setModalVisible(false)}>
                    <Text style={[s.btnCancelTxt, { color: C.textMuted }]}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.btnSave, { backgroundColor: C.green4 }]} onPress={handleSave}>
                    <Text style={s.btnSaveTxt}>SAVE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 20, paddingBottom: 10 },
  title: { fontFamily: FONTS.display, fontSize: 30, letterSpacing: 8, fontWeight: '700' },
  subtitle: { fontSize: 11, letterSpacing: 1.5, marginTop: 4 },
  list: { padding: 20, paddingBottom: 100, gap: 12 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
  cardLeft: { flex: 1, marginRight: 12 },
  exName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  exMeta: { fontSize: 12, letterSpacing: 1 },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-start' },
  modalContent: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderWidth: 1, padding: 20, gap: 14 },
  modalTitle: { fontFamily: FONTS.display, fontSize: 18, letterSpacing: 2, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  numCol: { flex: 1, gap: 4 },
  inputLabel: { fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnCancel: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnCancelTxt: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  btnSave: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnSaveTxt: { color: '#000', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
});