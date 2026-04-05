import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Tabs } from 'expo-router';

export default function AppLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (isLoaded && !isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#faf7f0',
          borderTopColor: '#e6e1da',
        },
        tabBarActiveTintColor: '#c27070',
        tabBarInactiveTintColor: '#8a7a68',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Recipes' }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{ title: 'Shopping' }}
      />
    </Tabs>
  );
}
