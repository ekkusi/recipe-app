import { useSignIn } from '@clerk/expo';
import { type Href, Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { Button } from '../../components/ui/Button';

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const pendingMfa =
    signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust';

  async function finalize() {
    await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        router.replace(decorateUrl('/(app)') as Href);
      },
    });
  }

  async function handleSignIn() {
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;

    if (signIn.status === 'complete') {
      await finalize();
    } else if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
      await signIn.mfa.sendEmailCode();
    }
  }

  async function handleVerify() {
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === 'complete') {
      await finalize();
    }
  }

  if (pendingMfa) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background"
      >
        <View className="flex-1 justify-center px-6 gap-4">
          <Text className="text-3xl font-bold text-foreground">Verify your account</Text>
          <Text className="text-muted-foreground">Enter the code sent to {email}</Text>

          <TextInput
            className="bg-input border border-border rounded-2xl px-4 py-3 text-foreground"
            placeholder="Verification code"
            placeholderTextColor="#8a7a68"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />
          {errors?.fields.code && (
            <Text className="text-destructive text-sm -mt-2">{errors.fields.code.message}</Text>
          )}

          <Button
            label="Verify"
            onPress={handleVerify}
            disabled={!code || fetchStatus === 'fetching'}
          />
          <Button
            label="Resend code"
            onPress={() => signIn.mfa.sendEmailCode()}
            disabled={fetchStatus === 'fetching'}
          />
        </View>
      </KeyboardAvoidingView>
    );
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
        {errors?.fields.identifier && (
          <Text className="text-destructive text-sm -mt-2">{errors.fields.identifier.message}</Text>
        )}

        <TextInput
          className="bg-input border border-border rounded-2xl px-4 py-3 text-foreground"
          placeholder="Password"
          placeholderTextColor="#8a7a68"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {errors?.fields.password && (
          <Text className="text-destructive text-sm -mt-2">{errors.fields.password.message}</Text>
        )}

        <Button
          label="Sign in"
          onPress={handleSignIn}
          disabled={!email || !password || fetchStatus === 'fetching'}
        />

        <Link href="/(auth)/sign-up" className="text-center text-muted-foreground">
          Don't have an account? <Text className="text-primary">Sign up</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}
