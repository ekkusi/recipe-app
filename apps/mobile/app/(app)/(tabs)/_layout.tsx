import { Ionicons } from '@expo/vector-icons';
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
      <Tabs.Screen
        name="index"
        options={{
          title: t('nav.recipes'),
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{
          title: t('nav.shopping'),
          tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: t('nav.collections'),
          tabBarIcon: ({ color, size }) => <Ionicons name="folder-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
