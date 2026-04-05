import { useSignUp } from '@clerk/expo';
import { type Href, Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpSchema } from '@recipe-app/shared';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { Button } from '../../components/ui/Button';

export default function SignUpScreen() {
  const { signUp, errors: clerkErrors, fetchStatus } = useSignUp();
  const router = useRouter();

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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-3xl font-bold text-foreground">Create account</Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              className="bg-input border border-border rounded-2xl px-4 py-3 text-foreground"
              placeholder="Email"
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
              placeholder="Password"
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
          label="Sign up"
          onPress={handleSubmit(handleSignUp)}
          disabled={fetchStatus === 'fetching'}
        />

        <Link href="/(auth)/sign-in" className="text-center text-muted-foreground">
          Already have an account? <Text className="text-primary">Sign in</Text>
        </Link>
      </View>
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
  const { control, handleSubmit, formState: { errors } } = useForm<{ code: string }>({
    defaultValues: { code: '' },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center px-6 gap-4">
        <Text className="text-3xl font-bold text-foreground">Verify email</Text>
        <Text className="text-muted-foreground">Enter the code sent to {email}</Text>

        <Controller
          control={control}
          name="code"
          rules={{ required: 'Code is required' }}
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              className="bg-input border border-border rounded-2xl px-4 py-3 text-foreground"
              placeholder="Verification code"
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
          label="Verify"
          onPress={handleSubmit(({ code }) => onVerify(code))}
          disabled={fetchStatus === 'fetching'}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
