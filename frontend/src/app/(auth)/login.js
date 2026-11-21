import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Screen } from '../../components/Screen';
import { useAuth } from '../../context/AuthContext';
import { colors, radius } from '../../constants/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  async function handleLogin() {
    if (!email.trim() || !password) return Alert.alert('Missing details', 'Enter your email and password.');
    setBusy(true);
    try { await signIn(email, password); router.replace('/(tabs)'); }
    catch (error) { Alert.alert('Unable to sign in', error.message || 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <Screen scroll={false} contentStyle={styles.page}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.fill}>
      <View style={styles.brandMark}><Text style={styles.mark}>B</Text></View>
      <Text style={styles.eyebrow}>WELCOME BACK</Text>
      <Text style={styles.title}>Your mind, in one place.</Text>
      <Text style={styles.subtitle}>Sign in to return to your notes, plans, and ideas.</Text>
      <View style={styles.form}>
        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" autoComplete="email" style={styles.input} />
        <Text style={styles.label}>PASSWORD</Text>
        <TextInput value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor={colors.muted} secureTextEntry autoComplete="password" style={styles.input} />
        <Pressable style={[styles.button, busy && styles.disabled]} onPress={handleLogin} disabled={busy}>{busy ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Sign in</Text>}</Pressable>
      </View>
      <View style={styles.bottom}><Text style={styles.bottomText}>New to BrainCache? </Text><Link href="/(auth)/register" style={styles.link}>Create an account</Link></View>
    </KeyboardAvoidingView>
  </Screen>;
}
const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center', paddingTop: 10 }, fill: { flex: 1, justifyContent: 'center' },
  brandMark: { width: 52, height: 52, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
  mark: { color: '#FFF', fontSize: 25, fontWeight: '800' }, eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.7 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '800', letterSpacing: -1, marginTop: 9 }, subtitle: { color: colors.secondary, fontSize: 14, lineHeight: 21, marginTop: 8, maxWidth: 310 },
  form: { marginTop: 34 }, label: { color: colors.secondary, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, height: 52, paddingHorizontal: 15, color: colors.ink, fontSize: 14 },
  button: { backgroundColor: colors.primary, height: 53, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 25 }, buttonText: { color: '#FFF', fontSize: 14, fontWeight: '800' }, disabled: { opacity: 0.65 },
  bottom: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 }, bottomText: { color: colors.secondary, fontSize: 12 }, link: { color: colors.primary, fontSize: 12, fontWeight: '800' },
});