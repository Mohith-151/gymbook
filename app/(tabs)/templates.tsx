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
import {
  deleteTemplate, Exercise, getExercises, getTemplates, newId,
  saveTemplate, Template, TemplateExercise,
} from '../../store/storage';

// ── Template Card ─────────────────────────────────────────

type TemplateCardProps = {
  tmpl: Template;
  onEdit: (t: Template) => void;
  onDelete: (id: string) => void;
};

function TemplateCard({ tmpl, onEdit, onDelete }: TemplateCardProps) {
  const { C } = useTheme();
  return (
    <View style={[tc.wrap, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={tc.top}>
        <Text style={[tc.name, { color: C.textPrimary }]}>{tmpl.name}</Text>
        <View style={tc.actions}>
          <TouchableOpacity style={tc.iconBtn} onPress={() => onEdit(tmpl)}>
            <Ionicons name="pencil-outline" size={16} color={C.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={tc.iconBtn} onPress={() => onDelete(tmpl.id)}>
            <Ionicons name="trash-outline" size={16} color={C.textDim} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[tc.count, { color: C.textMuted }]}>
        {tmpl.exercises.length} {tmpl.exercises.length === 1 ? 'exercise' : 'exercises'}
      </Text>
    </View>
  );
}

const tc = StyleSheet.create({
  wrap: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  name: { fontFamily: FONTS.display, fontSize: 17, fontWeight: '700', flex: 1 },
  actions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },
  exRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, borderTopWidth: 1 },
  dot: { width: 4, height: 4, borderRadius: 2, marginRight: 10 },
  exName: { flex: 1, fontSize: 13 },
  exMeta: { fontSize: 12, fontFamily: FONTS.mono },
  empty: { fontSize: 12, paddingTop: 4 },
  count: { fontSize: 12, marginTop: 2 },
});

// ── Template Modal ────────────────────────────────────────

type TemplateModalProps = {
  visible: boolean;
  initial: Template | null;
  libraryExercises: Exercise[];
  onSave: (t: Template) => void;
  onClose: () => void;
};

type PickerTab = 'library' | 'manual';

function TemplateModal({ visible, initial, libraryExercises, onSave, onClose }: TemplateModalProps) {
  const { C } = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [exercises, setExercises] = useState<TemplateExercise[]>(initial?.exercises ?? []);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<PickerTab>('library');
  const [manName, setManName] = useState('');
  const [manSets, setManSets] = useState('3');
  const [manReps, setManReps] = useState('10');

  useFocusEffect(useCallback(() => {
    setName(initial?.name ?? '');
    setExercises(initial?.exercises ?? []);
  }, [initial]));

  function close() { setName(initial?.name ?? ''); setExercises(initial?.exercises ?? []); onClose(); }
  function addFromLib(ex: Exercise) { setExercises((prev) => [...prev, { name: ex.name, sets: ex.sets, reps: ex.reps }]); setShowPicker(false); }

  function addManual() {
    const n = manName.trim();
    if (!n) return;
    setExercises((prev) => [...prev, { name: n, sets: parseInt(manSets) || 3, reps: parseInt(manReps) || 10 }]);
    setManName(''); setManSets('3'); setManReps('10');
    setShowPicker(false);
  }

  function removeEx(i: number) { setExercises((prev) => prev.filter((_, idx) => idx !== i)); }
  function handleSave() { if (!name.trim()) return; onSave({ id: initial?.id ?? newId(), name: name.trim(), exercises }); close(); }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={tm.overlay}>
        <View style={[tm.sheet, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={tm.topSection}>
            <View style={[tm.handle, { backgroundColor: C.border }]} />
            <Text style={[tm.title, { color: C.textPrimary }]}>{initial ? 'Edit Template' : 'New Template'}</Text>
            <Text style={[tm.label, { color: C.textMuted }]}>TEMPLATE NAME</Text>
            <TextInput style={[tm.input, { backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary }]} value={name} onChangeText={setName} placeholder="e.g. Push Day" placeholderTextColor={C.textDim} selectionColor={C.green4} autoFocus />
            <Text style={[tm.label, { color: C.textMuted, marginTop: 18 }]}>EXERCISES</Text>
          </View>

          <ScrollView style={tm.exScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {exercises.length === 0
              ? <Text style={[tm.noEx, { color: C.textDim }]}>No exercises yet.</Text>
              : exercises.map((ex, i) => (
                <View key={i} style={[tm.exRow, { borderBottomColor: C.border }]}>
                  <View style={[tm.exDot, { backgroundColor: C.green3 }]} />
                  <Text style={[tm.exName, { color: C.textSecondary }]}>{ex.name}</Text>
                  <Text style={[tm.exMeta, { color: C.textMuted }]}>{ex.sets}×{ex.reps}</Text>
                  <TouchableOpacity onPress={() => removeEx(i)} style={{ padding: 6 }}>
                    <Ionicons name="close" size={14} color={C.textDim} />
                  </TouchableOpacity>
                </View>
              ))
            }
          </ScrollView>

          <TouchableOpacity style={[tm.addExBtn, { borderColor: C.green3 }]} onPress={() => setShowPicker(true)}>
            <Ionicons name="add" size={14} color={C.green3} />
            <Text style={[tm.addExTxt, { color: C.green3 }]}>ADD EXERCISE</Text>
          </TouchableOpacity>

          <View style={tm.footer}>
            <TouchableOpacity style={[tm.cancel, { borderColor: C.border }]} onPress={close}>
              <Text style={[tm.cancelTxt, { color: C.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[tm.save, { backgroundColor: C.green4 }]} onPress={handleSave}>
              <Text style={tm.saveTxt}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Modal visible={showPicker} animationType="slide" transparent>
        <View style={tm.overlay}>
          <View style={[tm.sheet, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={tm.topSection}>
              <View style={[tm.handle, { backgroundColor: C.border }]} />
              <Text style={[tm.title, { color: C.textPrimary }]}>Add to Template</Text>
              <View style={tm.tabs}>
                {(['library', 'manual'] as PickerTab[]).map((t) => (
                  <TouchableOpacity key={t} style={[tm.tab, { borderColor: C.border }, pickerTab === t && { backgroundColor: C.green0, borderColor: C.green2 }]} onPress={() => setPickerTab(t)}>
                    <Text style={[tm.tabTxt, { color: pickerTab === t ? C.green4 : C.textMuted }]}>{t.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {pickerTab === 'manual' && (
                <View style={{ paddingTop: 4 }}>
                  <Text style={[tm.label, { color: C.textMuted }]}>NAME</Text>
                  <TextInput style={[tm.input, { backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary }]} value={manName} onChangeText={setManName} placeholder="Exercise name" placeholderTextColor={C.textDim} selectionColor={C.green4} autoFocus />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[tm.label, { color: C.textMuted }]}>SETS</Text>
                      <TextInput style={[tm.input, { backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary }]} value={manSets} onChangeText={setManSets} keyboardType="number-pad" selectionColor={C.green4} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[tm.label, { color: C.textMuted }]}>REPS</Text>
                      <TextInput style={[tm.input, { backgroundColor: C.bg, borderColor: C.border, color: C.textPrimary }]} value={manReps} onChangeText={setManReps} keyboardType="number-pad" selectionColor={C.green4} />
                    </View>
                  </View>
                  <TouchableOpacity style={[tm.save, { marginTop: 16, backgroundColor: C.green4 }]} onPress={addManual}>
                    <Text style={tm.saveTxt}>ADD</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {pickerTab === 'library' && (
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {libraryExercises.length === 0
                  ? <Text style={[tm.noEx, { color: C.textDim }]}>No exercises in library.</Text>
                  : libraryExercises.map((ex) => (
                    <TouchableOpacity key={ex.id} style={[tm.pickItem, { borderBottomColor: C.border }]} onPress={() => addFromLib(ex)}>
                      <Text style={[tm.pickName, { color: C.textPrimary }]}>{ex.name}</Text>
                      <Text style={[tm.pickMeta, { color: C.textMuted }]}>{ex.sets} × {ex.reps}</Text>
                    </TouchableOpacity>
                  ))
                }
              </ScrollView>
            )}

            <TouchableOpacity style={[tm.cancel, { marginTop: 12, marginHorizontal: 20, borderColor: C.border }]} onPress={() => setShowPicker(false)}>
              <Text style={[tm.cancelTxt, { textAlign: 'center', color: C.textMuted }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const tm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-start' },
  sheet: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderBottomWidth: 1, paddingBottom: 20, maxHeight: '90%' },
  topSection: { padding: 20, paddingBottom: 8 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontFamily: FONTS.display, fontSize: 20, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 10, letterSpacing: 2, fontWeight: '700', marginBottom: 6 },
  input: { borderRadius: 10, borderWidth: 1, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  exScroll: { maxHeight: 180, marginBottom: 8, paddingHorizontal: 20 },
  noEx: { fontSize: 12, paddingVertical: 12 },
  exRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1 },
  exDot: { width: 4, height: 4, borderRadius: 2, marginRight: 10 },
  exName: { flex: 1, fontSize: 13 },
  exMeta: { fontSize: 12, fontFamily: FONTS.mono, marginRight: 6 },
  addExBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingVertical: 11, marginHorizontal: 20, marginBottom: 16 },
  addExTxt: { fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: 20 },
  cancel: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 13 },
  cancelTxt: { fontWeight: '600', textAlign: 'center' },
  save: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveTxt: { color: '#fff', fontWeight: '800', letterSpacing: 2 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1 },
  tabTxt: { fontSize: 10, letterSpacing: 1.5, fontWeight: '700' },
  pickItem: { paddingVertical: 13, borderBottomWidth: 1, paddingHorizontal: 20 },
  pickName: { fontSize: 15, fontWeight: '600' },
  pickMeta: { fontSize: 11, marginTop: 2 },
});

// ── Main ──────────────────────────────────────────────────

export default function TemplatesScreen() {
  const { C } = useTheme();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [libraryExercises, setLibraryExercises] = useState<Exercise[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);

  useFocusEffect(useCallback(() => {
    (async () => { setTemplates(await getTemplates()); setLibraryExercises(await getExercises()); })();
  }, []));

  async function handleSave(tmpl: Template) { await saveTemplate(tmpl); setTemplates(await getTemplates()); }
  async function handleDelete(id: string) { await deleteTemplate(id); setTemplates(await getTemplates()); }
  function openNew() { setEditing(null); setShowModal(true); }
  function openEdit(tmpl: Template) { setEditing(tmpl); setShowModal(true); }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]}>
      <View style={s.topBar}>
        <Text style={[s.title, { color: C.green4 }]}>TEMPLATES</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {templates.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="copy-outline" size={40} color={C.textDim} />
            <Text style={[s.emptyTitle, { color: C.textPrimary }]}>No templates yet</Text>
            <Text style={[s.emptyText, { color: C.textMuted }]}>Create a template like "Push Day" to quickly load all its exercises into a session.</Text>
            <TouchableOpacity style={[s.emptyBtn, { backgroundColor: C.green4 }]} onPress={openNew}>
              <Text style={s.emptyBtnTxt}>CREATE TEMPLATE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          templates.map((t) => <TemplateCard key={t.id} tmpl={t} onEdit={openEdit} onDelete={handleDelete} />)
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={[s.fab, { backgroundColor: C.green4, shadowColor: C.green4 }]} onPress={openNew}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <TemplateModal visible={showModal} initial={editing} libraryExercises={libraryExercises} onSave={handleSave} onClose={() => setShowModal(false)} />
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
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
});
