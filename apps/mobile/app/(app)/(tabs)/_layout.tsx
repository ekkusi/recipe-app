import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#faf7f0',
          borderTopColor: '#e6e1da',
        },
        tabBarActiveTintColor: '#b06060',
        tabBarInactiveTintColor: '#8a7a68',
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('nav.recipes') }} />
      <Tabs.Screen name="shopping-list" options={{ title: t('nav.shopping') }} />
    </Tabs>
  );
}
