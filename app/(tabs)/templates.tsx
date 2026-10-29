// app/(tabs)/templates.tsx
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
import { Exercise, getExercises } from '../../store/exerciseStore';
import { newId } from '../../store/sessionStore';
import {
  deleteTemplate,
  getTemplates,
  saveTemplate,
  Template,
  TemplateExercise,
} from '../../store/templateStore';

export default function TemplatesScreen() {
  const { C } = useTheme();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [tName, setTName] = useState('');
  const [tExercises, setTExercises] = useState<TemplateExercise[]>([]);

  // Add exercise picker state
  const [addMode, setAddMode] = useState(false);
  const [exName, setExName] = useState('');
  const [exSets, setExSets] = useState('3');
  const [exReps, setExReps] = useState('10');

  const loadData = useCallback(() => {
    setTemplates(getTemplates());
    setLibrary(getExercises());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  function openCreate() {
    setTName('');
    setTExercises([]);
    setAddMode(false);
    setModalVisible(true);
  }

  function handleSaveTemplate() {
    if (!tName.trim() || !tExercises.length) return;
    const template: Template = {
      id: newId(),
      name: tName.trim(),
      exercises: tExercises,
    };
    saveTemplate(template);
    setModalVisible(false);
    loadData();
  }

  function handleDelete(id: string) {
    deleteTemplate(id);
    loadData();
  }

  function addFromLibrary(ex: Exercise) {
    setTExercises((prev) => [...prev, { name: ex.name, sets: ex.sets, reps: ex.reps }]);
    setAddMode(false);
  }

  function addManual() {
    if (!exName.trim()) return;
    setTExercises((prev) => [
      ...prev,
      { name: exName.trim(), sets: parseInt(exSets, 10) || 1, reps: parseInt(exReps, 10) || 1 },
    ]);
    setExName('');
    setExSets('3');
    setExReps('10');
    setAddMode(false);
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: C.green4 }]}>TEMPLATES</Text>
        <Text style={[s.subtitle, { color: C.textMuted }]}>
          {templates.length} SAVED TEMPLATES
        </Text>
      </View>

      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {templates.map((tpl) => (
          <View key={tpl.id} style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={s.cardLeft}>
              <Text style={[s.tplName, { color: C.textPrimary }]}>{tpl.name}</Text>
              <Text style={[s.tplCount, { color: C.green4 }]}>
                {tpl.exercises.length} EXERCISES
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(tpl.id)} style={s.iconBtn}>
              <Ionicons name="trash-outline" size={18} color="#f85149" />
            </TouchableOpacity>
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
                <Text style={[s.modalTitle, { color: C.textPrimary }]}>NEW TEMPLATE</Text>

                <TextInput
                  style={[s.input, { backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary }]}
                  placeholder="Template Name (e.g. Push Day)"
                  placeholderTextColor={C.textMuted}
                  value={tName}
                  onChangeText={setTName}
                  autoFocus
                />

                {/* Added exercises list */}
                <View style={s.exList}>
                  {tExercises.map((ex, idx) => (
                    <View key={idx} style={[s.exRow, { backgroundColor: C.bg, borderColor: C.border }]}>
                      <Text style={[s.exRowTxt, { color: C.textPrimary }]}>
                        {ex.name} ({ex.sets}×{ex.reps})
                      </Text>
                      <TouchableOpacity onPress={() => setTExercises(tExercises.filter((_, i) => i !== idx))}>
                        <Ionicons name="close-circle" size={16} color={C.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                {!addMode ? (
                  <TouchableOpacity style={[s.addBtn, { borderColor: C.green3 }]} onPress={() => setAddMode(true)}>
                    <Text style={[s.addBtnTxt, { color: C.green3 }]}>+ ADD EXERCISE</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[s.addBox, { backgroundColor: C.bg, borderColor: C.border }]}>
                    <Text style={[s.addBoxTitle, { color: C.textMuted }]}>PICK FROM LIBRARY</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.libScroll}>
                      {library.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[s.chip, { backgroundColor: C.surface, borderColor: C.border }]}
                          onPress={() => addFromLibrary(item)}
                        >
                          <Text style={[s.chipTxt, { color: C.textPrimary }]}>{item.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={[s.addBoxTitle, { color: C.textMuted, marginTop: 8 }]}>OR MANUAL</Text>
                    <TextInput
                      style={[s.input, { backgroundColor: C.surface, borderColor: C.border, color: C.textPrimary }]}
                      placeholder="Name"
                      placeholderTextColor={C.textMuted}
                      value={exName}
                      onChangeText={setExName}
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        style={[s.input, { flex: 1, backgroundColor: C.surface, borderColor: C.border, color: C.textPrimary }]}
                        keyboardType="number-pad"
                        placeholder="Sets"
                        placeholderTextColor={C.textMuted}
                        value={exSets}
                        onChangeText={setExSets}
                      />
                      <TextInput
                        style={[s.input, { flex: 1, backgroundColor: C.surface, borderColor: C.border, color: C.textPrimary }]}
                        keyboardType="number-pad"
                        placeholder="Reps"
                        placeholderTextColor={C.textMuted}
                        value={exReps}
                        onChangeText={setExReps}
                      />
                    </View>
                    <TouchableOpacity style={[s.btnSave, { backgroundColor: C.green4 }]} onPress={addManual}>
                      <Text style={s.btnSaveTxt}>ADD TO TEMPLATE</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={s.modalActions}>
                  <TouchableOpacity style={[s.btnCancel, { borderColor: C.border }]} onPress={() => setModalVisible(false)}>
                    <Text style={[s.btnCancelTxt, { color: C.textMuted }]}>CANCEL</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.btnSave, { backgroundColor: C.green4 }]} onPress={handleSaveTemplate}>
                    <Text style={s.btnSaveTxt}>SAVE TEMPLATE</Text>
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
  cardLeft: { flex: 1 },
  tplName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  tplCount: { fontSize: 11, letterSpacing: 1, fontWeight: '700' },
  iconBtn: { padding: 6 },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-start' },
  modalContent: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderWidth: 1, padding: 20, gap: 12 },
  modalTitle: { fontFamily: FONTS.display, fontSize: 18, letterSpacing: 2, marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14 },
  exList: { gap: 6, maxHeight: 120 },
  exRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderRadius: 6, borderWidth: 1 },
  exRowTxt: { fontSize: 12, fontWeight: '600' },
  addBtn: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  addBtnTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  addBox: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 },
  addBoxTitle: { fontSize: 9, letterSpacing: 1, fontWeight: '700' },
  libScroll: { flexDirection: 'row', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 6 },
  chipTxt: { fontSize: 11, fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnCancel: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnCancelTxt: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  btnSave: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnSaveTxt: { color: '#000', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
});