import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../../components/Screen';
import { EmptyState, SectionHeading, Surface } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, notesApi, tasksApi } from '../../services/api';
import { colors, radius, shadow } from '../../constants/theme';

export default function HomeScreen() {
  const { token, user, signOut } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentNotes, setRecentNotes] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [counts, notes, tasks] = await Promise.all([
        dashboardApi.summary(token),
        notesApi.list(token),
        tasksApi.list(token),
      ]);
      setSummary(counts);
      setRecentNotes(notes.slice(0, 3));
      setRecentTasks(tasks.slice(0, 3));
    } catch (e) {
      setError(e.message || 'Unable to load your dashboard.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function askSignOut() {
    Alert.alert('Sign out?', 'You can sign back in whenever you need.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  const taskCounts = summary?.tasks || {};
  const firstName = user?.email ? user.email.split('@')[0] : 'there';

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>BrainCache<Text style={styles.brandDot}>.</Text></Text>
          <Text style={styles.brandCaption}>YOUR PERSONAL SPACE</Text>
        </View>
        <Pressable style={styles.avatar} onPress={askSignOut} accessibilityRole="button" accessibilityLabel="Account and sign out">
          <Text style={styles.avatarText}>{(user?.email || 'B').slice(0, 1).toUpperCase()}</Text>
        </Pressable>
      </View>

      <View style={styles.welcome}>
        <Text style={styles.eyebrow}>A FRESH SPACE TO THINK</Text>
        <Text style={styles.greeting}>Good to see you, {firstName}.</Text>
        <Text style={styles.subtitle}>Keep your thoughts clear and your next steps close.</Text>
      </View>

      <Pressable style={styles.search} onPress={() => router.push('/ai')} accessibilityRole="button">
        <Text style={styles.searchIcon}>⌕</Text>
        <Text style={styles.searchText}>Search your space or ask AI...</Text>
        <Text style={styles.searchArrow}>›</Text>
      </Pressable>

      {error ? (
        <Surface style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={loadDashboard}><Text style={styles.retryText}>Try loading again</Text></Pressable>
        </Surface>
      ) : null}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Your overview</Text>
          <Text style={styles.sectionSubtitle}>A snapshot of what you have saved</Text>
        </View>
        <Pressable onPress={loadDashboard} hitSlop={10}><Text style={styles.actionText}>Refresh</Text></Pressable>
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.loadingText}>Gathering your space...</Text></View>
      ) : (
        <View style={styles.statsRow}>
          <StatCard label="Notes" value={summary?.notes ?? 0} tone="lavender" symbol="▤" />
          <StatCard label="To do" value={taskCounts.Pending ?? 0} tone="blue" symbol="✓" />
          <StatCard label="Reminders" value={summary?.upcoming_reminders ?? 0} tone="peach" symbol="◷" />
        </View>
      )}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Make a little progress</Text>
          <Text style={styles.sectionSubtitle}>Capture something before you forget</Text>
        </View>
      </View>
      <View style={styles.quickRow}>
        <QuickAction symbol="＋" title="New note" detail="Save a thought" onPress={() => router.push('/notes')} />
        <QuickAction symbol="✓" title="Add a task" detail="Plan a next step" onPress={() => router.push('/tasks')} />
      </View>

      <SectionHeading title="Your tasks" action="View all" onAction={() => router.push('/tasks')} />
      {recentTasks.length ? recentTasks.map((task) => (
        <Pressable key={task.id} onPress={() => router.push('/tasks')} style={styles.listCard}>
          <View style={styles.listIcon}><Text style={styles.listIconText}>✓</Text></View>
          <View style={styles.listBody}>
            <Text style={styles.itemTitle} numberOfLines={1}>{task.title}</Text>
            <Text style={styles.itemMeta}>{task.status}{task.due_date ? '  ·  Due ' + new Date(task.due_date).toLocaleDateString() : ''}</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      )) : <Surface><EmptyState title="No tasks yet" description="Add one small next step to get started." /></Surface>}

      <SectionHeading title="Recently captured" action="View all" onAction={() => router.push('/notes')} />
      {recentNotes.length ? recentNotes.map((note) => (
        <Pressable key={note.id} onPress={() => router.push('/notes')} style={styles.noteCard}>
          <View style={styles.noteCardTop}><Text style={styles.noteTag}>NOTE</Text><Text style={styles.chevron}>›</Text></View>
          <Text style={styles.itemTitle} numberOfLines={1}>{note.title}</Text>
          <Text style={styles.notePreview} numberOfLines={2}>{note.content || 'No additional details.'}</Text>
        </Pressable>
      )) : <Surface><EmptyState title="Your ideas start here" description="Create a note to keep useful thoughts in one place." /></Surface>}

      <Text style={styles.footer}>A calmer place for a clearer mind.</Text>
    </Screen>
  );
}

function StatCard({ label, value, tone, symbol }) {
  const toneStyle = tone === 'blue' ? styles.blueTone : tone === 'peach' ? styles.peachTone : styles.lavenderTone;
  return (
    <View style={[styles.statCard, toneStyle]}>
      <Text style={styles.statSymbol}>{symbol}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ symbol, title, detail, onPress }) {
  return (
    <Pressable style={styles.quickCard} onPress={onPress} accessibilityRole="button">
      <View style={styles.quickIcon}><Text style={styles.quickSymbol}>{symbol}</Text></View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickDetail}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  brand: { color: colors.ink, fontSize: 25, fontWeight: '900', letterSpacing: -1.1 },
  brandDot: { color: colors.primary },
  brandCaption: { color: colors.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.6, marginTop: 3 },
  avatar: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  avatarText: { color: colors.primaryDark, fontSize: 16, fontWeight: '900' },
  welcome: { marginBottom: 19 },
  eyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
  greeting: { color: colors.ink, fontSize: 26, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: colors.secondary, fontSize: 12, lineHeight: 19, marginTop: 7 },
  search: { height: 54, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 27, ...shadow.card },
  searchIcon: { color: colors.primary, fontSize: 25, marginRight: 10 },
  searchText: { color: colors.muted, fontSize: 12, flex: 1 },
  searchArrow: { color: colors.primary, fontSize: 24 },
  errorCard: { marginBottom: 18 },
  errorText: { color: colors.danger, fontSize: 12, marginBottom: 8 },
  retryText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  sectionSubtitle: { color: colors.secondary, fontSize: 10, marginTop: 4 },
  actionText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  loading: { minHeight: 112, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: colors.secondary, fontSize: 11 },
  statsRow: { flexDirection: 'row', gap: 9, marginBottom: 28 },
  statCard: { flex: 1, minHeight: 112, borderRadius: radius.lg, padding: 12, justifyContent: 'center' },
  lavenderTone: { backgroundColor: colors.primarySoft },
  blueTone: { backgroundColor: colors.blueSoft },
  peachTone: { backgroundColor: colors.warningSoft },
  statSymbol: { color: colors.primaryDark, fontSize: 16, fontWeight: '900', marginBottom: 8 },
  statValue: { color: colors.ink, fontSize: 25, fontWeight: '900' },
  statLabel: { color: colors.secondary, fontSize: 10, fontWeight: '700', marginTop: 3 },
  quickRow: { flexDirection: 'row', gap: 11, marginBottom: 27 },
  quickCard: { flex: 1, minHeight: 112, padding: 14, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  quickIcon: { width: 33, height: 33, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  quickSymbol: { color: colors.primaryDark, fontSize: 20, fontWeight: '800' },
  quickTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  quickDetail: { color: colors.secondary, fontSize: 10, marginTop: 4 },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 13, marginBottom: 9 },
  listIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.successSoft, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  listIconText: { color: colors.success, fontSize: 14, fontWeight: '900' },
  listBody: { flex: 1 },
  itemTitle: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  itemMeta: { color: colors.secondary, fontSize: 10, marginTop: 4 },
  chevron: { color: colors.muted, fontSize: 22, marginLeft: 8 },
  noteCard: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 15, marginBottom: 9 },
  noteCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  noteTag: { color: colors.primary, backgroundColor: colors.primarySoft, overflow: 'hidden', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  notePreview: { color: colors.secondary, fontSize: 10, lineHeight: 16, marginTop: 5 },
  footer: { color: colors.muted, textAlign: 'center', fontSize: 10, marginTop: 18, marginBottom: 6 },
});
