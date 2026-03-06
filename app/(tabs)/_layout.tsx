import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { C } from '../../constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor={C.bg} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: C.surface,
            borderTopColor: C.border,
            borderTopWidth: 1,
            paddingBottom: 24,
            paddingTop: 8,
            height: 80,
          },
          tabBarActiveTintColor: C.amber4,
          tabBarInactiveTintColor: C.textMuted,
          tabBarLabelStyle: {
            fontSize: 10,
            letterSpacing: 1.5,
            fontWeight: '700',
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'HOME',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name={'flame-outline' as IoniconsName} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="session"
          options={{
            title: 'SESSION',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name={'barbell-outline' as IoniconsName} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="templates"
          options={{
            title: 'TEMPLATES',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name={'copy-outline' as IoniconsName} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'LIBRARY',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <Ionicons name={'list-outline' as IoniconsName} size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
