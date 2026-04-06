import { useSignIn } from '@clerk/expo';
import { type Href, Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInSchema } from '@recipe-app/shared';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { Button } from '../../components/ui/Button';

export default function SignInScreen() {
  const { signIn, errors: clerkErrors, fetchStatus } = useSignIn();
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
