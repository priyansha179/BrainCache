import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { SectionHeading, Surface } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { tasksApi } from '../../services/api';
import { colors, radius } from '../../constants/theme';
const statuses = ['Pending', 'In Progress', 'Completed'];

export default function TasksScreen() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState([]); const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [error, setError] = useState(''); const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null); const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); const [dueDate, setDueDate] = useState('');
  const loadTasks = useCallback(async () => {
    setLoading(true); setError('');
    try { setTasks(await tasksApi.list(token)); } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [token]);
  useEffect(() => { loadTasks(); }, [loadTasks]);
  const visibleTasks = filter === 'All' ? tasks : tasks.filter((task) => task.status === filter);
  const counts = Object.fromEntries(statuses.map((s) => [s, tasks.filter((t) => t.status === s).length]));
  function openEditor(task = null) {
    setEditing(task); setTitle(task?.title || ''); setDescription(task?.description || '');
    setDueDate(task?.due_date ? task.due_date.slice(0, 10) : ''); setModalVisible(true);
  }
  async function saveTask() {
    if (!title.trim()) return Alert.alert('Title required', 'Give your task a short title.');
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return Alert.alert('Invalid date', 'Use YYYY-MM-DD for the due date.');
    setSaving(true);
    try {
      const data = { title: title.trim(), description, due_date: dueDate ? `${dueDate}T23:59:00` : null };
      if (editing) await tasksApi.update(token, editing.id, data); else await tasksApi.create(token, data);
      setModalVisible(false); await loadTasks();
    } catch (e) { Alert.alert('Could not save task', e.message); } finally { setSaving(false); }
  }
  async function changeStatus(task) {
    const next = statuses[(statuses.indexOf(task.status) + 1) % statuses.length];
    try { await tasksApi.setStatus(token, task.id, next); await loadTasks(); } catch (e) { Alert.alert('Could not update task', e.message); }
  }
  function confirmDelete(task) {
    Alert.alert('Delete task?', `“${task.title}” will be permanently deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await tasksApi.remove(token, task.id); await loadTasks(); } catch (e) { Alert.alert('Could not delete task', e.message); }
      }},
    ]);
  }
  return <Screen>
    <View style={styles.pageHeader}>
      <View style={styles.pageHeaderText}>
        <Text style={styles.eyebrow}>MAKE IT HAPPEN</Text>
        <Text style={styles.title}>Tasks</Text>
        <Text style={styles.subtitle}>Turn intentions into small, achievable steps.</Text>
      </View>
      <View style={styles.countBadge}>
        <Text style={styles.countNumber}>{counts.Pending}</Text>
        <Text style={styles.countLabel}>TO DO</Text>
      </View>
    </View>
    <View style={styles.summary}>{statuses.map((s) => <View key={s} style={styles.summaryItem}><Text style={styles.number}>{counts[s]}</Text><Text style={styles.caption}>{s === 'Pending' ? 'To do' : s}</Text></View>)}</View>
    <Pressable onPress={() => openEditor()} style={styles.addButton}><Text style={styles.addText}>＋  Add a task</Text></Pressable>
    <View style={styles.filters}>{['All', ...statuses].map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</View>
    <SectionHeading title="Your tasks" action={`${visibleTasks.length} shown`} />
    {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} /> : error ? <Surface><Text style={styles.error}>{error}</Text><Pressable onPress={loadTasks}><Text style={styles.link}>Try again</Text></Pressable></Surface> : visibleTasks.length === 0 ? <Surface><Text style={styles.emptyTitle}>Nothing on this list</Text><Text style={styles.emptyBody}>Add a task or choose another filter.</Text></Surface> : visibleTasks.map((task) => <View key={task.id} style={styles.taskCard}>
      <Pressable style={styles.taskMain} onPress={() => openEditor(task)}><Text style={styles.taskTitle}>{task.title}</Text>{!!task.description && <Text style={styles.taskDescription} numberOfLines={2}>{task.description}</Text>}{!!task.due_date && <Text style={styles.due}>Due {new Date(task.due_date).toLocaleDateString()}</Text>}</Pressable>
      <View style={styles.taskActions}><Pressable onPress={() => changeStatus(task)} style={[styles.status, task.status === 'Completed' && styles.statusDone]}><Text style={[styles.statusText, task.status === 'Completed' && styles.statusDoneText]}>{task.status} · tap to change</Text></Pressable><Pressable onPress={() => confirmDelete(task)} hitSlop={8}><Text style={styles.delete}>Delete</Text></Pressable></View>
    </View>)}
    <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}><View style={styles.overlay}><View style={styles.modal}>
      <View style={styles.modalHeader}><Text style={styles.modalTitle}>{editing ? 'Edit task' : 'New task'}</Text><Pressable onPress={() => setModalVisible(false)}><Text style={styles.close}>✕</Text></Pressable></View>
      <TextInput value={title} onChangeText={setTitle} placeholder="Task title" placeholderTextColor={colors.muted} style={styles.field} maxLength={200} />
      <TextInput value={description} onChangeText={setDescription} placeholder="Add details (optional)" placeholderTextColor={colors.muted} style={[styles.field, styles.multiline]} multiline textAlignVertical="top" />
      <Text style={styles.dateHint}>DUE DATE (OPTIONAL) · YYYY-MM-DD</Text>
      <TextInput value={dueDate} onChangeText={setDueDate} placeholder="2026-12-31" placeholderTextColor={colors.muted} style={styles.field} />
      <Pressable style={styles.saveButton} onPress={saveTask} disabled={saving}>{saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Save task</Text>}</Pressable>
    </View></View></Modal>
  </Screen>;
}
const styles = StyleSheet.create({
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  pageHeaderText: { flex: 1, paddingRight: 12 },
  countBadge: { minWidth: 62, height: 62, borderRadius: 19, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  countNumber: { color: colors.blue, fontSize: 20, fontWeight: '900' },
  countLabel: { color: colors.blue, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  eyebrow: { color: colors.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 }, title: { color: colors.ink, fontSize: 29, fontWeight: '900', marginTop: 7, letterSpacing: -0.8 },
  subtitle: { color: colors.secondary, fontSize: 12, lineHeight: 19, marginTop: 6, marginBottom: 13 },
  summary: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: 17, marginBottom: 15, shadowColor: '#29213F', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.035, shadowRadius: 9, elevation: 1 },
  summaryItem: { alignItems: 'center', flex: 1 }, number: { color: colors.ink, fontSize: 21, fontWeight: '800' }, caption: { color: colors.secondary, fontSize: 9, marginTop: 4 },
  addButton: { height: 49, backgroundColor: colors.primary, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 17, shadowColor: colors.primaryDark, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.16, shadowRadius: 10, elevation: 3 }, addText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 23 }, filter: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted },
  filterActive: { backgroundColor: colors.primarySoft }, filterText: { color: colors.secondary, fontSize: 10, fontWeight: '700' }, filterTextActive: { color: colors.primaryDark },
  taskCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, marginBottom: 11, shadowColor: '#29213F', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.035, shadowRadius: 9, elevation: 1 },
  taskMain: { paddingBottom: 10 }, taskTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' }, taskDescription: { color: colors.secondary, fontSize: 11, lineHeight: 17, marginTop: 5 }, due: { color: colors.muted, fontSize: 10, marginTop: 7 },
  taskActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  status: { backgroundColor: colors.warningSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 }, statusText: { color: colors.warning, fontSize: 9, fontWeight: '800' },
  statusDone: { backgroundColor: colors.successSoft }, statusDoneText: { color: colors.success }, delete: { color: colors.danger, fontSize: 11, fontWeight: '700' },
  emptyTitle: { color: colors.ink, textAlign: 'center', fontWeight: '800' }, emptyBody: { color: colors.secondary, fontSize: 12, textAlign: 'center', marginTop: 6 }, error: { color: colors.danger, fontSize: 12, marginBottom: 10 }, link: { color: colors.primary, fontWeight: '700' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,18,32,0.35)' }, modal: { backgroundColor: colors.background, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 22, paddingBottom: 34 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, modalTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' }, close: { color: colors.secondary, fontSize: 18, padding: 4 },
  field: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, color: colors.ink, marginBottom: 12, fontSize: 13 }, multiline: { minHeight: 100 },
  dateHint: { color: colors.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 7 }, saveButton: { height: 50, backgroundColor: colors.primary, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 5 }, saveText: { color: '#FFF', fontWeight: '800' },
});