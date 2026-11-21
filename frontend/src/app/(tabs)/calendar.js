import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { EmptyState, SectionHeading, Surface } from '../../components/UI';
import { colors, radius } from '../../constants/theme';

export default function CalendarScreen() {
  return (
    <Screen>
      <Text style={styles.eyebrow}>YOUR TIME, IN VIEW</Text>
      <Text style={styles.title}>Calendar</Text>
      <Text style={styles.subtitle}>Bring your plans and important moments together.</Text>
      <Surface style={styles.monthCard}>
        <Text style={styles.month}>Your schedule</Text>
        <Text style={styles.monthHint}>A clear view of what's ahead.</Text>
        <View style={styles.week}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <View key={index} style={styles.day}><Text style={styles.dayText}>{day}</Text></View>
          ))}
        </View>
      </Surface>
      <SectionHeading title="Upcoming events" />
      <Surface><EmptyState title="No events planned" description="Your upcoming events and commitments will appear here." /></Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.8, marginTop: 7 },
  subtitle: { color: colors.secondary, fontSize: 13, lineHeight: 20, marginTop: 6, marginBottom: 22 },
  monthCard: { marginBottom: 27 },
  month: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  monthHint: { color: colors.secondary, fontSize: 12, marginTop: 5 },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22 },
  day: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  dayText: { color: colors.secondary, fontSize: 11, fontWeight: '700' },
});