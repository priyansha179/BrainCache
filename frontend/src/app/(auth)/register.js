import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { colors, radius } from '../../constants/theme';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  async function handleRegister() {
    if (!email.trim() || !password || !confirm) return Alert.alert('Missing details', 'Complete all fields to create your account.');
    if (password.length < 8) return Alert.alert('Password too short', 'Use at least 8 characters.');
    if (password !== confirm) return Alert.alert('Passwords do not match', 'Check both password fields.');
    setBusy(true);
    try { await signUp(email, password); router.replace('/(tabs)'); }
    catch (error) { Alert.alert('Unable to create account', error.message || 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <Screen scroll={false} contentStyle={styles.page}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
      <View style={styles.brandMark}><Text style={styles.mark}>B</Text></View>
      <Text style={styles.eyebrow}>START WITH A CLEARER MIND</Text>
      <Text style={styles.title}>Create your space.</Text>
      <Text style={styles.subtitle}>One home for the thoughts and plans you want to keep.</Text>
      <View style={styles.form}>
        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={styles.input} />
        <Text style={styles.label}>PASSWORD</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="At least 8 characters" placeholderTextColor={colors.muted} secureTextEntry autoComplete="new-password" style={styles.input} />
        <Text style={styles.label}>CONFIRM PASSWORD</Text>
        <TextInput value={confirm} onChangeText={setConfirm} placeholder="Enter your password again" placeholderTextColor={colors.muted} secureTextEntry autoComplete="new-password" style={styles.input} />
        <Pressable style={[styles.button, busy && styles.disabled]} onPress={handleRegister} disabled={busy}>{busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Create account</Text>}</Pressable>
      </View>
      <View style={styles.bottom}><Text style={styles.bottomText}>Already have an account? </Text><Link href="/(auth)/login" style={styles.link}>Sign in</Link></View>
    </KeyboardAvoidingView>
  </Screen>;
}
const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', paddingTop: 8 }, fill: { flex: 1, justifyContent: 'center' },
  brandMark: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  mark: { color: '#FFF', fontSize: 23, fontWeight: '800' }, eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.9, marginTop: 8 }, subtitle: { color: colors.secondary, fontSize: 13, lineHeight: 20, marginTop: 7 },
  form: { marginTop: 21 }, label: { color: colors.secondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 7, marginTop: 12 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, height: 49, paddingHorizontal: 14, color: colors.ink, fontSize: 13 },
  button: { backgroundColor: colors.primary, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 22 }, buttonText: { color: '#FFF', fontSize: 14, fontWeight: '800' }, disabled: { opacity: 0.65 },
  bottom: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 }, bottomText: { color: colors.secondary, fontSize: 12 }, link: { color: colors.primary, fontSize: 12, fontWeight: '800' },
});