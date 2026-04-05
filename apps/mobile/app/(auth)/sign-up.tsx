import { useSignUp } from '@clerk/expo';
import { type Href, Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { Button } from '../../components/ui/Button';

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const pendingVerification =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

  async function handleSignUp() {
    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) return;
    await signUp.verifications.sendEmailCode();
  }

  async function handleVerify() {
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          router.replace(decorateUrl('/(app)') as Href);
        },
      });
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
            {errors?.fields.emailAddress && (
              <Text className="text-destructive text-sm -mt-2">{errors.fields.emailAddress.message}</Text>
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
              label="Sign up"
              onPress={handleSignUp}
              disabled={!email || !password || fetchStatus === 'fetching'}
            />

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
            {errors?.fields.code && (
              <Text className="text-destructive text-sm -mt-2">{errors.fields.code.message}</Text>
            )}

            <Button
              label="Verify"
              onPress={handleVerify}
              disabled={!code || fetchStatus === 'fetching'}
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
