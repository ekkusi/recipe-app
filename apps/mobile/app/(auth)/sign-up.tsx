import { useSignUp } from '@clerk/clerk-expo';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState('');

  async function handleSignUp() {
    if (!isLoaded) return;
    setError('');
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign up failed';
      setError(msg);
    }
  }

  async function handleVerify() {
    if (!isLoaded) return;
    setError('');
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      setError(msg);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6 gap-4">
        {!pendingVerification ? (
          <>
            <Text className="text-3xl font-bold text-foreground">Create account</Text>

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
              onPress={handleSignUp}
            >
              <Text className="text-primary-foreground font-semibold text-base">Sign up</Text>
            </Pressable>

            <Link href="/(auth)/sign-in" className="text-center text-muted-foreground">
              Already have an account? <Text className="text-primary">Sign in</Text>
            </Link>
          </>
        ) : (
          <>
            <Text className="text-3xl font-bold text-foreground">Verify email</Text>
            <Text className="text-muted-foreground">Enter the code sent to {email}</Text>

            <TextInput
              className="bg-input border border-border rounded-2xl px-4 py-3 text-foreground"
              placeholder="Verification code"
              placeholderTextColor="#8a7a68"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
            />

            {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

            <Pressable
              className="bg-primary rounded-3xl py-4 items-center"
              onPress={handleVerify}
            >
              <Text className="text-primary-foreground font-semibold text-base">Verify</Text>
            </Pressable>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
