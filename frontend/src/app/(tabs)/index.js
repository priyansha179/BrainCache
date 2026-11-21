import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/Screen';
import { EmptyState, SectionHeading, Surface } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, notesApi, tasksApi } from '../../services/api';
import { colors, radius } from '../../constants/theme';

export default function HomeScreen() {
  const { token, user, signOut } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadDashboard = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [counts, notes, tasks] = await Promise.all([dashboardApi.summary(token), notesApi.list(token), tasksApi.list(token)]);
      setSummary(counts); setRecentNotes(notes.slice(0, 2)); setRecentTasks(tasks.slice(0, 3));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  function askSignOut() {
    Alert.alert('Sign out?', 'You can sign back in whenever you need.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }
  const taskCounts = summary?.tasks || {};
  return <Screen>
    <View style={styles.topRow}><View><Text style={styles.eyebrow}>YOUR PERSONAL SPACE</Text><Text style={styles.brand}>BrainCache<Text style={styles.brandDot}>.</Text></Text></View>
      <Pressable style={styles.avatar} onPress={askSignOut} accessibilityRole="button"><Text style={styles.avatarText}>{(user?.email || 'B').slice(0, 1).toUpperCase()}</Text></Pressable>
    </View>
    <View style={styles.greeting}><Text style={styles.greetingTitle}>Welcome back</Text><Text style={styles.greetingSub}>{user?.email || 'Your thoughts and plans, together in one place.'}</Text></View>
    <Pressable style={styles.search} onPress={() => router.push('/ai')}><Text style={styles.searchGlyph}>⌕</Text><Text style={styles.searchText}>Search your knowledge or ask AI...</Text></Pressable>
    {error ? <Surface><Text style={styles.error}>{error}</Text><Pressable onPress={loadDashboard}><Text style={styles.link}>Retry loading dashboard</Text></Pressable></Surface> : null}
    <SectionHeading title="Your overview" action="Refresh" onAction={loadDashboard} />
    {loading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 25 }} /> : <View style={styles.statsRow}>
      <Stat label="Notes" value={summary?.notes ?? 0} tint={colors.primarySoft} accent={colors.primaryDark} />
      <Stat label="To do" value={taskCounts.Pending ?? 0} tint={colors.blueSoft} accent={colors.blue} />
      <Stat label="Reminders" value={summary?.upcoming_reminders ?? 0} tint={colors.warningSoft} accent={colors.warning} />
    </View>}
    <SectionHeading title="Quick capture" />
    <View style={styles.captureRow}><CaptureButton glyph="＋" title="New note" subtitle="Save an idea" onPress={() => router.push('/notes')} /><CaptureButton glyph="✓" title="Add task" subtitle="Plan a next step" onPress={() => router.push('/tasks')} /></View>
    <SectionHeading title="Your tasks" action="See all" onAction={() => router.push('/tasks')} />
    {recentTasks.length ? recentTasks.map((task) => <Surface key={task.id} style={styles.recentCard}><Text style={styles.recentTitle}>{task.title}</Text><Text style={styles.recentMeta}>{task.status}{task.due_date ? ` · Due ${new Date(task.due_date).toLocaleDateString()}` : ''}</Text></Surface>) : <Surface><EmptyState title="No tasks yet" description="Add one small next step to get started." /></Surface>}
    <SectionHeading title="Recently captured" action="Open notes" onAction={() => router.push('/notes')} />
    {recentNotes.length ? recentNotes.map((note) => <Surface key={note.id} style={styles.recentCard}><Text style={styles.recentTitle}>{note.title}</Text><Text style={styles.recentMeta} numberOfLines={2}>{note.content || 'No additional details.'}</Text></Surface>) : <Surface><EmptyState title="Your knowledge space starts here" description="New notes and ideas will appear here as you capture them." /></Surface>}
    <Text style={styles.footer}>A calmer place for a clearer mind.</Text>
  </Screen>;
}
function Stat({ label, value, tint, accent }) {
  return <View style={[styles.statCard, { backgroundColor: tint }]}><Text style={[styles.statValue, { color: accent }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}
function CaptureButton({ glyph, title, subtitle, onPress }) {
  return <Pressable style={styles.captureCard} onPress={onPress}><Text style={styles.captureGlyph}>{glyph}</Text><Text style={styles.captureTitle}>{title}</Text><Text style={styles.captureSub}>{subtitle}</Text></Pressable>;
}
const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.7, marginBottom: 5 },
  brand: { color: colors.ink, fontSize: 25, fontWeight: '800', letterSpacing: -1.1 }, brandDot: { color: colors.primary },
  avatar: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: colors.primaryDark, fontWeight: '800', fontSize: 16 },
  greeting: { marginTop: 28, marginBottom: 18 }, greetingTitle: { color: colors.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.8 }, greetingSub: { color: colors.secondary, fontSize: 12, marginTop: 6 },
  search: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, height: 52, flexDirection: 'row', alignItems: 'center', marginBottom: 27 },
  searchGlyph: { color: colors.primary, fontSize: 25, marginRight: 10 }, searchText: { color: colors.muted, fontSize: 12, flex: 1 },
  statsRow: { flexDirection: 'row', gap: 9, marginBottom: 27 }, statCard: { flex: 1, minHeight: 95, borderRadius: radius.md, padding: 13, justifyContent: 'center' },
  statValue: { fontSize: 24, fontWeight: '800' }, statLabel: { color: colors.ink, fontSize: 11, fontWeight: '700', marginTop: 5 },
  captureRow: { flexDirection: 'row', gap: 12, marginBottom: 27 }, captureCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 15, minHeight: 105 },
  captureGlyph: { color: colors.primary, fontSize: 23, marginBottom: 8 }, captureTitle: { color: colors.ink, fontWeight: '700', fontSize: 13 }, captureSub: { color: colors.secondary, fontSize: 11, marginTop: 4 },
  recentCard: { padding: 15, marginBottom: 9 }, recentTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' }, recentMeta: { color: colors.secondary, fontSize: 11, marginTop: 5 },
  error: { color: colors.danger, fontSize: 12, marginBottom: 8 }, link: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 10, marginTop: 18, marginBottom: 4 },
});