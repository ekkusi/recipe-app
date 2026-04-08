import { useSignUp } from '@clerk/expo';
import { type Href, Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpSchema } from '@recipe-app/shared';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Text, TextInput, View, Pressable } from 'react-native';
import { useState } from 'react';
import Constants from 'expo-constants';

import { Button } from '../../components/ui/Button';
import { PrivacyModal } from '../../components/ui/PrivacyModal';

export default function SignUpScreen() {
  const { signUp, errors: clerkErrors, fetchStatus } = useSignUp();
  const router = useRouter();
  const { t } = useTranslation();
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

  // Get web app URL from environment or use default
  const webUrl =
    Constants.expoConfig?.extra?.webUrl ||
    process.env.EXPO_PUBLIC_WEB_URL ||
    'http://localhost:3000';
  const privacyUrl = `${webUrl}/privacy`;

  const { control, handleSubmit, getValues, formState: { errors } } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  });

  const pendingVerification =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

  async function handleSignUp({ email, password }: SignUpSchema) {
    const { error } = await signUp.password({ emailAddress: email, password });
    if (error) return;
    await signUp.verifications.sendEmailCode();
  }

  async function handleVerify(code: string) {
    await signUp.verifications.verifyEmailCode({ code });
    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ decorateUrl }) => {
          router.replace(decorateUrl('/(app)') as Href);
        },
      });
    }
  }

  if (pendingVerification) {
    return (
      <VerifyScreen
        email={getValues('email')}
        fetchStatus={fetchStatus}
        clerkErrors={clerkErrors}
        onVerify={handleVerify}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-3xl font-bold text-foreground">{t('auth.signUp.title')}</Text>

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
        {clerkErrors?.fields.emailAddress && (
          <Text className="text-destructive text-sm -mt-2">{clerkErrors.fields.emailAddress.message}</Text>
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

        <Pressable
          onPress={() => setPrivacyAgreed(!privacyAgreed)}
          className="flex-row items-center gap-3 py-3 px-4 bg-muted/50 rounded-2xl border border-border"
        >
          <View
            className={`w-5 h-5 rounded border-2 items-center justify-center ${
              privacyAgreed ? 'bg-primary border-primary' : 'border-border'
            }`}
          >
            {privacyAgreed && <Text className="text-white text-xs font-bold">✓</Text>}
          </View>
          <Text className="flex-1 text-sm text-foreground">
            {t('auth.signUp.agreePrefix')}{' '}
            <Text
              className="text-primary font-semibold underline"
              onPress={() => setPrivacyModalVisible(true)}
            >
              {t('auth.signUp.privacyPolicy')}
            </Text>
          </Text>
        </Pressable>

        <Button
          label={t('auth.signUp.submit')}
          onPress={handleSubmit(handleSignUp)}
          disabled={fetchStatus === 'fetching' || !privacyAgreed}
        />

        <Link href="/(auth)/sign-in" className="text-center text-muted-foreground">
          {t('auth.signUp.hasAccount')}<Text className="text-primary">{t('auth.signUp.signInLink')}</Text>
        </Link>
      </View>

      <PrivacyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
        webUrl={privacyUrl}
      />
    </KeyboardAvoidingView>
  );
}

function VerifyScreen({
  email,
  fetchStatus,
  clerkErrors,
  onVerify,
}: {
  email: string;
  fetchStatus: string;
  clerkErrors: ReturnType<typeof useSignUp>['errors'];
  onVerify: (code: string) => Promise<void>;
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
        <Text className="text-3xl font-bold text-foreground">{t('auth.verify.title')}</Text>
        <Text className="text-muted-foreground">{t('auth.verify.instruction', { email })}</Text>

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
      </View>
    </KeyboardAvoidingView>
  );
}
