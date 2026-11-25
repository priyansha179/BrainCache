import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { SectionHeading, Surface } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { notesApi } from '../../services/api';
import { colors, radius } from '../../constants/theme';

export default function NotesScreen() {
  const { token } = useAuth();
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const loadNotes = useCallback(async () => {
    setLoading(true); setError('');
    try { setNotes(await notesApi.list(token, query.trim())); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token, query]);
  useEffect(() => { loadNotes(); }, [loadNotes]);
  function openEditor(note = null) {
    setEditing(note); setTitle(note?.title || ''); setContent(note?.content || ''); setModalVisible(true);
  }
  async function saveNote() {
    if (!title.trim()) return Alert.alert('Title required', 'Give your note a short title.');
    setSaving(true);
    try {
      if (editing) await notesApi.update(token, editing.id, { title: title.trim(), content });
      else await notesApi.create(token, { title: title.trim(), content });
      setModalVisible(false); await loadNotes();
    } catch (e) { Alert.alert('Could not save note', e.message); }
    finally { setSaving(false); }
  }
  function confirmDelete(note) {
    Alert.alert('Delete note?', `“${note.title}” will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await notesApi.remove(token, note.id); await loadNotes(); }
        catch (e) { Alert.alert('Could not delete note', e.message); }
      }},
    ]);
  }
  return <Screen>
    <View style={styles.pageHeader}>
      <View style={styles.pageHeaderText}>
        <Text style={styles.eyebrow}>YOUR KNOWLEDGE LIBRARY</Text>
        <Text style={styles.title}>Notes</Text>
        <Text style={styles.subtitle}>Keep useful thoughts, discoveries, and ideas close.</Text>
      </View>
      <View style={styles.countBadge}>
        <Text style={styles.countNumber}>{notes.length}</Text>
        <Text style={styles.countLabel}>SAVED</Text>
      </View>
    </View>
    <TextInput value={query} onChangeText={setQuery} placeholder="⌕  Search your notes..." placeholderTextColor={colors.muted} style={styles.search} />
    <Pressable onPress={() => openEditor()} style={styles.addButton}><Text style={styles.addText}>＋  Create a note</Text></Pressable>
    <SectionHeading title="All notes" action={`${notes.length} saved`} />
    {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} /> : error ? <Surface><Text style={styles.error}>{error}</Text><Pressable onPress={loadNotes}><Text style={styles.link}>Try again</Text></Pressable></Surface> : notes.length === 0 ? (
      <Surface><View style={styles.emptyIcon}><Text style={styles.emptyGlyph}>▤</Text></View><Text style={styles.emptyTitle}>Nothing saved yet</Text><Text style={styles.emptyBody}>Capture an idea whenever inspiration strikes.</Text></Surface>
    ) : notes.map((note) => <Pressable key={note.id} onPress={() => openEditor(note)} onLongPress={() => confirmDelete(note)} style={styles.noteCard}>
      <View style={styles.noteTop}><Text style={styles.noteTitle} numberOfLines={1}>{note.title}</Text><Pressable onPress={() => confirmDelete(note)} hitSlop={10}><Text style={styles.delete}>Delete</Text></Pressable></View>
      <Text style={styles.noteContent} numberOfLines={3}>{note.content || 'No additional details.'}</Text>
      <Text style={styles.date}>{new Date(note.updated_at).toLocaleDateString()}</Text>
    </Pressable>)}
    <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
      <View style={styles.overlay}><View style={styles.modal}>
        <View style={styles.modalHeader}><Text style={styles.modalTitle}>{editing ? 'Edit note' : 'New note'}</Text><Pressable onPress={() => setModalVisible(false)}><Text style={styles.close}>✕</Text></Pressable></View>
        <TextInput value={title} onChangeText={setTitle} placeholder="Note title" placeholderTextColor={colors.muted} style={styles.field} maxLength={200} />
        <TextInput value={content} onChangeText={setContent} placeholder="Write down your thoughts..." placeholderTextColor={colors.muted} style={[styles.field, styles.multiline]} multiline textAlignVertical="top" />
        <Pressable style={styles.saveButton} onPress={saveNote} disabled={saving}>{saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Save note</Text>}</Pressable>
      </View></View>
    </Modal>
  </Screen>;
}
const styles = StyleSheet.create({
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  pageHeaderText: { flex: 1, paddingRight: 12 },
  countBadge: { minWidth: 62, height: 62, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  countNumber: { color: colors.primaryDark, fontSize: 20, fontWeight: '900' },
  countLabel: { color: colors.primaryDark, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  eyebrow: { color: colors.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }, title: { color: colors.ink, fontSize: 29, fontWeight: '900', marginTop: 7, letterSpacing: -0.8 },
  subtitle: { color: colors.secondary, fontSize: 12, lineHeight: 19, marginTop: 6, marginBottom: 13 },
  search: { height: 50, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, color: colors.ink, marginBottom: 11 },
  addButton: { height: 49, backgroundColor: colors.primary, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 25, shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.16, shadowRadius: 10, elevation: 3 }, addText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  noteCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 3, borderLeftColor: colors.primarySoft, borderRadius: radius.lg, padding: 17, marginBottom: 11, shadowColor: '#29213F', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.035, shadowRadius: 9, elevation: 1 },
  noteTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, noteTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', flex: 1, marginRight: 12 },
  delete: { color: colors.danger, fontWeight: '700', fontSize: 11 }, noteContent: { color: colors.secondary, fontSize: 12, lineHeight: 18, marginTop: 8 }, date: { color: colors.muted, fontSize: 10, marginTop: 12 },
  emptyIcon: { alignSelf: 'center', width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyGlyph: { color: colors.primary, fontSize: 22 }, emptyTitle: { color: colors.ink, textAlign: 'center', fontWeight: '800', marginTop: 14 }, emptyBody: { color: colors.secondary, fontSize: 12, textAlign: 'center', marginTop: 5 },
  error: { color: colors.danger, fontSize: 12, marginBottom: 10 }, link: { color: colors.primary, fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,18,32,0.35)' }, modal: { backgroundColor: colors.background, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 22, paddingBottom: 34 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, modalTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  close: { color: colors.secondary, fontSize: 18, padding: 4 }, field: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, color: colors.ink, marginBottom: 12, fontSize: 13 },
  multiline: { minHeight: 145 }, saveButton: { height: 50, backgroundColor: colors.primary, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 5 }, saveText: { color: '#FFF', fontWeight: '800' },
});