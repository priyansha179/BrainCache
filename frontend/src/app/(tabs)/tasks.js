import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { EmptyState, Pill, SectionHeading, Surface } from '../../components/UI';
import { colors, radius } from '../../constants/theme';

export default function TasksScreen() {
  return (
    <Screen>
      <Text style={styles.eyebrow}>MAKE IT HAPPEN</Text>
      <Text style={styles.title}>Tasks</Text>
      <Text style={styles.subtitle}>Turn intentions into small, achievable steps.</Text>
      <View style={styles.summary}>
        <View><Text style={styles.number}>0</Text><Text style={styles.caption}>To do</Text></View>
        <View style={styles.divider} />
        <View><Text style={styles.number}>0</Text><Text style={styles.caption}>In progress</Text></View>
        <View style={styles.divider} />
        <View><Text style={styles.number}>0</Text><Text style={styles.caption}>Completed</Text></View>
      </View>
      <SectionHeading title="Your tasks" action="All statuses" />
      <Surface>
        <View style={styles.top}><Pill label="GET STARTED" tone="purple" /></View>
        <EmptyState title="Your task list is clear" description="Add your first task and give your next step a place to live." />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.8, marginTop: 7 },
  subtitle: { color: colors.secondary, fontSize: 13, lineHeight: 20, marginTop: 6, marginBottom: 22 },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: 17, marginBottom: 27 },
  number: { color: colors.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  caption: { color: colors.secondary, fontSize: 10, marginTop: 3 },
  divider: { width: 1, height: 30, backgroundColor: colors.border },
  top: { alignItems: 'flex-start' },
});