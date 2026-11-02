// app/(tabs)/library.tsx
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
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
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

  // Full Screen Image Preview State
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const loadExercises = useCallback(() => {
    setExercises(getExercises());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [loadExercises])
  );

  async function persistImageToSandbox(tempUri: string): Promise<string> {
    try {
      const docDir = FileSystem.documentDirectory;
      if (!docDir) return tempUri;
      const fileName = `gymbook_ex_${Date.now()}.jpg`;
      const permanentUri = `${docDir}${fileName}`;
      await FileSystem.copyAsync({
        from: tempUri,
        to: permanentUri,
      });
      return permanentUri;
    } catch (error) {
      console.error('Failed to save permanent image copy:', error);
      return tempUri;
    }
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Turned off to prevent cropping button bugs
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].uri) {
      const permanentPath = await persistImageToSandbox(result.assets[0].uri);
      setImageUri(permanentPath);
    }
  }

  function openCreate() {
    setEditingId(null);
    setName('');
    setSets('3');
    setReps('10');
    setImageUri(undefined);
    setModalVisible(true);
  }

  function openEdit(ex: Exercise) {
    setEditingId(ex.id);
    setName(ex.name);
    setSets(String(ex.sets));
    setReps(String(ex.reps));
    setImageUri(ex.imageUri);
    setModalVisible(true);
  }

  function handleSave() {
    if (!name.trim()) return;
    const ex: Exercise = {
      id: editingId ?? newId(),
      name: name.trim(),
      sets: parseInt(sets, 10) || 1,
      reps: parseInt(reps, 10) || 1,
      imageUri: imageUri,
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
              <TouchableOpacity
                onPress={() => ex.imageUri && setPreviewUri(ex.imageUri)}
                disabled={!ex.imageUri}
              >
                {ex.imageUri ? (
                  <Image source={{ uri: ex.imageUri }} style={s.exThumb} />
                ) : (
                  <View style={[s.exThumbPlaceholder, { backgroundColor: C.bg, borderColor: C.border }]}>
                    <Ionicons name="barbell-outline" size={18} color={C.green3} />
                  </View>
                )}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={[s.exName, { color: C.textPrimary }]}>{ex.name}</Text>
                <Text style={[s.exMeta, { color: C.textMuted }]}>
                  {ex.sets} SETS × {ex.reps} REPS
                </Text>
              </View>
            </View>
            <View style={s.cardActions}>
              <TouchableOpacity onPress={() => openEdit(ex)} style={s.iconBtn}>
                <Ionicons name="pencil-outline" size={18} color={C.green3} />
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

      {/* Full Screen Image Viewer Modal */}
      <Modal visible={!!previewUri} transparent animationType="fade">
        <View style={s.fullImageViewerOverlay}>
          <TouchableOpacity style={s.closeImageBtn} onPress={() => setPreviewUri(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {previewUri && (
            <Image source={{ uri: previewUri }} style={s.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* Slide-Down Top Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={s.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[s.modalContent, { backgroundColor: C.surface, borderColor: C.border, paddingTop: (StatusBar.currentHeight || 20) + 16 }]}>
                <Text style={[s.modalTitle, { color: C.textPrimary }]}>
                  {editingId ? 'EDIT EXERCISE' : 'NEW EXERCISE'}
                </Text>

                <TouchableOpacity
                  style={[s.imgPickBtn, { backgroundColor: C.bg, borderColor: C.border }]}
                  onPress={pickImage}
                >
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={s.pickerPreview} />
                  ) : (
                    <View style={s.pickerPlaceholder}>
                      <Ionicons name="image-outline" size={20} color={C.green3} />
                      <Text style={[s.pickerTxt, { color: C.green3 }]}>ATTACH IMAGE</Text>
                    </View>
                  )}
                </TouchableOpacity>

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
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, marginRight: 12 },
  exThumb: { width: 40, height: 40, borderRadius: 8 },
  exThumbPlaceholder: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  exName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  exMeta: { fontSize: 12, letterSpacing: 1 },
  cardActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 6 },
  fab: { position: 'absolute', right: 20, bottom: 30, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-start' },
  modalContent: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderWidth: 1, padding: 20, gap: 14 },
  modalTitle: { fontFamily: FONTS.display, fontSize: 18, letterSpacing: 2, marginBottom: 4 },
  imgPickBtn: { height: 70, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  pickerPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickerTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  pickerPreview: { width: 60, height: 60, borderRadius: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14 },
  rowInputs: { flexDirection: 'row', gap: 12 },
  numCol: { flex: 1, gap: 4 },
  inputLabel: { fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnCancel: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnCancelTxt: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  btnSave: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnSaveTxt: { color: '#000', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  fullImageViewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  closeImageBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  fullImage: { width: '90%', height: '70%' },
});