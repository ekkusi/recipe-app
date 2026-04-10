import { useAuth } from '@clerk/expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tag } from '@recipe-app/shared';
import type { RecipeFormSchema } from '@recipe-app/shared';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '../../../lib/api';
import { RecipeForm } from '../../../components/recipes/RecipeForm';

export default function NewRecipeScreen() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { data: tags = [], isLoading: tagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: () => apiFetch<Tag[]>('/api/tags', getToken),
  });

  const createMutation = useMutation({
    mutationFn: (values: RecipeFormSchema) =>
      apiFetch('/api/recipes', getToken, {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['recipes'] });
      router.back();
    },
  });

  if (tagsLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom }}
    >
      <View className="px-4 pb-4">
        <Text className="text-2xl font-bold text-foreground">{t('recipes.newRecipe')}</Text>
      </View>
      <RecipeForm
        tags={tags}
        onSubmit={(values) => {
          createMutation.mutate(values)
        }}
        submitLabel={t('recipes.createRecipe')}
        onCancel={() => router.back()}
        isSubmitting={createMutation.isPending}
      />
    </KeyboardAvoidingView>
  );
}
