import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { EmptyState, Surface } from '../../components/UI';
import { colors, radius } from '../../constants/theme';

const suggestions = ['Summarize my recent notes', 'What should I focus on today?', 'Find an idea I saved'];

export default function AIScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.spark}><Text style={styles.sparkText}>✧</Text></View>
      <Text style={styles.eyebrow}>YOUR PERSONAL KNOWLEDGE COMPANION</Text>
      <Text style={styles.title}>Ask BrainCache</Text>
      <Text style={styles.subtitle}>Explore your notes, connect ideas, and find the context you need.</Text>
      <Surface style={styles.welcome}>
        <EmptyState title="A little more clarity, one question at a time." description="Ask about information you've saved. BrainCache AI will use your relevant notes as context." />
      </Surface>
      <Text style={styles.label}>TRY ASKING</Text>
      {suggestions.map((suggestion) => (
        <View key={suggestion} style={styles.suggestion}><Text style={styles.suggestionText}>{suggestion}</Text><Text style={styles.arrow}>↗</Text></View>
      ))}
      <View style={styles.input}><Text style={styles.inputHint}>Ask a question about your knowledge...</Text><Text style={styles.send}>↑</Text></View>
      <Text style={styles.disclaimer}>AI responses can make mistakes. Check important details against your sources.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  spark: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  sparkText: { color: colors.primary, fontSize: 26 },
  eyebrow: { color: colors.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.8, marginTop: 8 },
  subtitle: { color: colors.secondary, fontSize: 13, lineHeight: 20, marginTop: 7, marginBottom: 24 },
  welcome: { paddingVertical: 13, marginBottom: 25 },
  label: { color: colors.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1.4, marginBottom: 11 },
  suggestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, marginBottom: 9 },
  suggestionText: { color: colors.ink, fontSize: 12, fontWeight: '600' },
  arrow: { color: colors.primary, fontSize: 16 },
  input: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 13, marginTop: 20 },
  inputHint: { color: colors.muted, fontSize: 11 },
  send: { color: colors.surface, backgroundColor: colors.primary, width: 29, height: 29, borderRadius: 10, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden', fontSize: 18 },
  disclaimer: { color: colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 12 },
});