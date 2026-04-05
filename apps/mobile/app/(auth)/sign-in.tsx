import { useSignIn } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSignIn() {
    if (!isLoaded) return;
    setError('');
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      setError(msg);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-3xl font-bold text-foreground">Welcome back</Text>

        <TextInput
          className="bg-input border border-border rounded-2xl px-4 py-3 text-foreground"
          placeholder="Email"
          placeholderTextColor="#8a7a68"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          className="bg-input border border-border rounded-2xl px-4 py-3 text-foreground"
          placeholder="Password"
          placeholderTextColor="#8a7a68"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

        <Pressable
          className="bg-primary rounded-3xl py-4 items-center"
          onPress={handleSignIn}
        >
          <Text className="text-primary-foreground font-semibold text-base">Sign in</Text>
        </Pressable>

        <Link href="/(auth)/sign-up" className="text-center text-muted-foreground">
          Don't have an account? <Text className="text-primary">Sign up</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
