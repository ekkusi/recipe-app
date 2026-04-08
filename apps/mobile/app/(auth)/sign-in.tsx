import { useSignIn, useSSO } from '@clerk/expo';
import { type Href, Link, useRouter } from 'expo-router';
import * as Linking from "expo-linking";
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInSchema } from '@recipe-app/shared';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '../../components/ui/Button';

function GoogleSvg() {
  return (
    <Svg viewBox="0 0 48 48" width={20} height={20}>
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917"
      />
      <Path
        fill="#FF3D00"
        d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.9 11.9 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917"
      />
    </Svg>
  );
}

export default function SignInScreen() {
  const { signIn, errors: clerkErrors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO()
  const router = useRouter();
  const { t } = useTranslation();

  const { control, handleSubmit, getValues, formState: { errors } } = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const pendingMfa =
    signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust';

  async function finalize() {
    await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        router.replace(decorateUrl('/(app)') as Href);
      },
    });
  }

  async function handleSignIn({ email, password }: SignInSchema) {
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;

    if (signIn.status === 'complete') {
      await finalize();
    } else if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
      await signIn.mfa.sendEmailCode();
    }
  }

  async function handleVerify(code: string) {
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === 'complete') {
      await finalize();
    }
  }

  async function handleGoogleSignIn() {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: Linking.createURL('/(app)', { scheme: 'reseptimania' }),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch {
    }
  }

  if (pendingMfa) {
    return (
      <MfaScreen
        email={getValues('email')}
        fetchStatus={fetchStatus}
        clerkErrors={clerkErrors}
        onVerify={handleVerify}
        onResend={() => signIn.mfa.sendEmailCode()}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-3xl font-bold text-foreground">{t('auth.signIn.title')}</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              className="bg-input border border-border rounded-2xl px-4 py-3 text-foreground"
              placeholder={t('auth.signIn.email')}
              placeholderTextColor="#8a7a68"
              autoCapitalize="none"
              keyboardType="email-address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        {errors.email && (
          <Text className="text-destructive text-sm -mt-2">{errors.email.message}</Text>
        )}

        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              className="bg-input border border-border rounded-2xl px-4 py-3 text-foreground"
              placeholder={t('auth.signIn.password')}
              placeholderTextColor="#8a7a68"
              secureTextEntry
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        {errors.password && (
          <Text className="text-destructive text-sm -mt-2">{errors.password.message}</Text>
        )}
        {clerkErrors?.fields.password && (
          <Text className="text-destructive text-sm -mt-2">{clerkErrors.fields.password.message}</Text>
        )}

        <Button
          label={t('auth.signIn.submit')}
          onPress={handleSubmit(handleSignIn)}
          disabled={fetchStatus === 'fetching'}
        />

        <View className="flex-row items-center gap-3">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-muted-foreground text-sm">{t('auth.google.or')}</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        <Pressable
          onPress={handleGoogleSignIn}
          className="flex-row items-center justify-center gap-3 border border-border rounded-3xl py-4 bg-white active:opacity-75"
        >
          <GoogleSvg />
          <Text className="text-foreground font-semibold text-base">{t('auth.google.signIn')}</Text>
        </Pressable>

        <Link href="/(auth)/sign-up" className="text-center text-muted-foreground">
          {t('auth.signIn.noAccount')}<Text className="text-primary">{t('auth.signIn.signUpLink')}</Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

function MfaScreen({
  email,
  fetchStatus,
  clerkErrors,
  onVerify,
  onResend,
}: {
  email: string;
  fetchStatus: string;
  clerkErrors: ReturnType<typeof useSignIn>['errors'];
  onVerify: (code: string) => Promise<void>;
  onResend: () => void;
}) {
  const { t } = useTranslation();
  const { control, handleSubmit, formState: { errors } } = useForm<{ code: string }>({
    defaultValues: { code: '' },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-3xl font-bold text-foreground">{t('auth.mfa.title')}</Text>
        <Text className="text-muted-foreground">{t('auth.mfa.instruction')}</Text>

        <Controller
          control={control}
          name="code"
          rules={{ required: t('auth.verify.codeRequired') }}
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              className="bg-input border border-border rounded-2xl px-4 py-3 text-foreground"
              placeholder={t('auth.verify.code')}
              placeholderTextColor="#8a7a68"
              keyboardType="number-pad"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        {(errors.code || clerkErrors?.fields.code) && (
          <Text className="text-destructive text-sm -mt-2">
            {errors.code?.message ?? clerkErrors?.fields.code?.message}
          </Text>
        )}

        <Button
          label={t('auth.verify.submit')}
          onPress={handleSubmit(({ code }) => onVerify(code))}
          disabled={fetchStatus === 'fetching'}
        />
        <Button
          label={t('auth.verify.resend')}
          onPress={onResend}
          disabled={fetchStatus === 'fetching'}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
