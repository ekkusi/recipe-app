import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Tag } from '@recipe-app/shared';
import { recipeFormSchema, type RecipeFormSchema } from '@recipe-app/shared';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { UnitPicker } from '../ui/UnitPicker';

interface RecipeFormProps {
  initialValues?: Partial<RecipeFormSchema>;
  tags: Tag[];
  onSubmit: (values: RecipeFormSchema) => Promise<void> | void;
  submitLabel?: string;
  onCancel: () => void;
}

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const emptyIngredient = () => ({ name: '', quantity: '', unit: '' });

export function RecipeForm({
  initialValues,
  tags,
  onSubmit,
  submitLabel,
  onCancel,
}: RecipeFormProps) {
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormSchema>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      difficulty: initialValues?.difficulty ?? null,
      time_minutes: initialValues?.time_minutes ?? '',
      ingredients: initialValues?.ingredients?.length
        ? initialValues.ingredients
        : [emptyIngredient()],
      instructions: initialValues?.instructions?.length
        ? initialValues.instructions
        : [{ content: '' }],
      tag_ids: initialValues?.tag_ids ?? [],
    },
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({ control, name: 'ingredients' });

  const {
    fields: instructionFields,
    append: appendInstruction,
    remove: removeInstruction,
  } = useFieldArray({ control, name: 'instructions' });

  const difficulty = watch('difficulty');
  const tag_ids = watch('tag_ids');

  function toggleTag(tagId: string) {
    const next = tag_ids.includes(tagId)
      ? tag_ids.filter((id) => id !== tagId)
      : [...tag_ids, tagId];
    setValue('tag_ids', next);
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-foreground mb-1.5">{t('recipes.form_name')}</Text>
        <Controller
          control={control}
          name="title"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder={t('recipes.form_namePlaceholder')}
              placeholderTextColor="#8a7a68"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        {errors.title && (
          <Text className="text-destructive text-sm mt-1">{errors.title.message}</Text>
        )}
      </View>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-foreground mb-1.5">{t('recipes.form_description')}</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder={t('recipes.form_descriptionPlaceholder')}
              placeholderTextColor="#8a7a68"
              multiline
              numberOfLines={3}
              style={{ textAlignVertical: 'top', minHeight: 80 }}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
      </View>

      {/* Difficulty + Time */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground mb-1.5">{t('recipes.form_difficulty')}</Text>
          <View className="flex-row gap-1">
            {DIFFICULTIES.map((d) => (
              <Pressable
                key={d}
                onPress={() => setValue('difficulty', difficulty === d ? null : d)}
                className={`flex-1 rounded-xl py-2.5 items-center active:opacity-75 ${difficulty === d ? 'bg-primary' : 'bg-input border border-border'
                  }`}
              >
                <Text
                  className={`text-xs font-semibold ${difficulty === d ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                >
                  {t(`recipes.difficulty_${d}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View className="w-28">
          <Text className="text-sm font-semibold text-foreground mb-1.5">{t('recipes.form_time')}</Text>
          <Controller
            control={control}
            name="time_minutes"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
                placeholder="30"
                placeholderTextColor="#8a7a68"
                keyboardType="numeric"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        </View>
      </View>

      {/* Tags */}
      {tags.length > 0 && (
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-1.5">{t('recipes.form_tags')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = tag_ids.includes(tag.id);
              return (
                <Pressable
                  key={tag.id}
                  onPress={() => toggleTag(tag.id)}
                  className={`rounded-full px-3 py-1 active:opacity-75 ${selected ? 'bg-primary' : 'bg-muted border border-border'
                    }`}
                >
                  <Text
                    className={`text-sm capitalize ${selected ? 'text-primary-foreground font-semibold' : 'text-muted-foreground'
                      }`}
                  >
                    {tag.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Ingredients */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-foreground mb-1.5">{t('recipes.form_ingredients')}</Text>
        <View className="gap-2">
          {ingredientFields.map((field, i) => (
            <Controller
              key={field.id}
              control={control}
              name={`ingredients.${i}`}
              render={({ field: f }) => (
                <View className="flex-row gap-2 items-center">
                  <TextInput
                    className="flex-1 bg-input border border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                    placeholder={t('recipes.form_ingredient')}
                    placeholderTextColor="#8a7a68"
                    value={f.value.name}
                    onChangeText={(v) => f.onChange({ ...f.value, name: v })}
                  />
                  <TextInput
                    className="w-16 bg-input border border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                    placeholder={t('recipes.form_qty')}
                    placeholderTextColor="#8a7a68"
                    keyboardType="numeric"
                    value={f.value.quantity}
                    onChangeText={(v) => f.onChange({ ...f.value, quantity: v })}
                  />
                  <View className="w-16">
                    <UnitPicker
                      value={f.value.unit}
                      onChange={(v) => f.onChange({ ...f.value, unit: v })}
                    />
                  </View>
                  {ingredientFields.length > 1 && (
                    <TouchableOpacity onPress={() => removeIngredient(i)} hitSlop={8}>
                      <Text className="text-muted-foreground text-xl px-1">×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          ))}
        </View>
        {errors.ingredients?.root && (
          <Text className="text-destructive text-sm mt-1">{errors.ingredients.root.message}</Text>
        )}
        <TouchableOpacity
          onPress={() => appendIngredient(emptyIngredient())}
          className="mt-2 self-start"
        >
          <Text className="text-primary text-sm font-semibold">{t('recipes.form_addIngredient')}</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View className="mb-6">
        <Text className="text-sm font-semibold text-foreground mb-1.5">{t('recipes.instructions')} *</Text>
        <View className="gap-2">
          {instructionFields.map((field, i) => (
            <Controller
              key={field.id}
              control={control}
              name={`instructions.${i}.content`}
              render={({ field: f }) => (
                <View className="flex-row gap-2 items-start">
                  <Text className="text-sm font-bold text-muted-foreground mt-3 w-5 text-right">
                    {i + 1}.
                  </Text>
                  <TextInput
                    className="flex-1 bg-input border border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                    placeholder={t('recipes.form_stepPlaceholder', { step: i + 1 })}
                    placeholderTextColor="#8a7a68"
                    multiline
                    style={{ textAlignVertical: 'top', minHeight: 64 }}
                    value={f.value}
                    onChangeText={f.onChange}
                  />
                  {instructionFields.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeInstruction(i)}
                      hitSlop={8}
                      className="mt-2"
                    >
                      <Text className="text-muted-foreground text-xl px-1">×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          ))}
        </View>
        {errors.instructions?.root && (
          <Text className="text-destructive text-sm mt-1">{errors.instructions.root.message}</Text>
        )}
        <TouchableOpacity
          onPress={() => appendInstruction({ content: '' })}
          className="mt-2 self-start"
        >
          <Text className="text-primary text-sm font-semibold">{t('recipes.form_addStep')}</Text>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onCancel}
          className="flex-1 border border-border rounded-2xl py-4 items-center active:opacity-75"
        >
          <Text className="text-foreground font-semibold">{t('common.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="flex-1 bg-primary rounded-2xl py-4 items-center active:opacity-75"
          style={{ opacity: isSubmitting ? 0.5 : 1 }}
        >
          <Text className="text-primary-foreground font-semibold">
            {isSubmitting ? t('common.saving') : (submitLabel ?? t('recipes.saveRecipe'))}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
