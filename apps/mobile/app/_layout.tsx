// @ts-ignore 
import '../global.css';
import '../i18n';

import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { KeyboardProvider } from "react-native-keyboard-controller";
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Redirect, Slot, useSegments } from 'expo-router';

import { queryClient } from '../lib/query-client';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

function AuthGuard() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();

  // 1. IMPORTANT: If Clerk is still hydrating, show NOTHING (or a splash screen).
  // This prevents the "isSignedIn: false" logic from running too early.
  if (!isLoaded) {
    return null; // Or <ActivityIndicator />
  }

  const inAuthGroup = segments[0] === '(auth)';

  // 2. Instead of router.replace, we use conditional logic.
  // This is much more stable during Dev Reloads.
  if (!isSignedIn && !inAuthGroup) {
    // We are not signed in and not in the auth folder? 
    // This is the only time we force a redirect.
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (isSignedIn && inAuthGroup) {
    return <Redirect href="/(app)" />;
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <QueryClientProvider client={queryClient}>
            <KeyboardProvider>
              <AuthGuard />
            </KeyboardProvider>
          </QueryClientProvider>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
