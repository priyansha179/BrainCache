import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../constants/theme';

export function SectionHeading({ title, action, onAction }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button">
          <Text style={styles.action}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Surface({ children, style }) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function Pill({ label, tone = 'purple' }) {
  const tones = {
    purple: [colors.primarySoft, colors.primaryDark],
    green: [colors.successSoft, colors.success],
    orange: [colors.warningSoft, colors.warning],
    blue: [colors.blueSoft, colors.blue],
  };
  const [backgroundColor, color] = tones[tone] || tones.purple;
  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, description }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  action: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  surface: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  pill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  pillText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 26, paddingHorizontal: 18 },
  emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  emptyDescription: { color: colors.secondary, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});