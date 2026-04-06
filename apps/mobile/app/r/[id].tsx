import { useAuth } from '@clerk/expo';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

// Handles deep links from https://yourdomain.com/r/[id]
// Redirects to the in-app recipe detail screen.
export default function RecipeDeepLink() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      router.replace(`/(app)/recipes/${id}`);
    } else {
      router.replace(`/(auth)/sign-in`);
    }
  }, [isLoaded, isSignedIn, id]);

  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-muted-foreground">Ladataan…</Text>
    </View>
  );
}
