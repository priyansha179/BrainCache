import { Tabs, Redirect } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../constants/theme';

const tabItems = [
  { name: 'index', title: 'Home', glyph: '⌂' },
  { name: 'notes', title: 'Notes', glyph: '▤' },
  { name: 'tasks', title: 'Tasks', glyph: '✓' },
  { name: 'calendar', title: 'Calendar', glyph: '▦' },
  { name: 'ai', title: 'Ask AI', glyph: '✧' },
];

export default function TabLayout() {
  const { isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return <Tabs screenOptions={{
    headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted,
    tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 5 },
    tabBarStyle: { height: 70, paddingTop: 9, paddingBottom: 8, backgroundColor: colors.surface, borderTopColor: colors.border },
  }}>
    {tabItems.map((item) => <Tabs.Screen key={item.name} name={item.name} options={{
      title: item.title,
      tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 21, lineHeight: 24 }}>{item.glyph}</Text>,
    }} />)}
  </Tabs>;
}