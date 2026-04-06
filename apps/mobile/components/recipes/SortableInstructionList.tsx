import { Controller } from 'react-hook-form';
import type { Control, FieldErrors } from 'react-hook-form';
import type { RecipeFormSchema } from '@recipe-app/shared';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Sortable from 'react-native-sortables';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

interface Props {
  fields: { id: string }[];
  control: Control<RecipeFormSchema>;
  errors: FieldErrors<RecipeFormSchema>;
  instructionRefs: React.MutableRefObject<(TextInput | null)[]>;
  onMove: (from: number, to: number) => void;
  onRemove: (i: number) => void;
  onAppend: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

export function SortableInstructionList({
  fields,
  control,
  errors,
  instructionRefs,
  onMove,
  onRemove,
  onAppend,
}: Props) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 mb-6 w-full">
      <Text className="text-sm font-semibold text-foreground mb-1.5">
        {t('recipes.instructions')} *
      </Text>

      <Sortable.Flex
        customHandle
        flexDirection="column"
        width="fill"
        gap={8}
        onDragEnd={({ fromIndex, toIndex }) => {
          if (fromIndex !== toIndex) onMove(fromIndex, toIndex);
        }}
      >
        {fields.map((field, i) => (
          <View key={field.id} className="flex-row items-stretch" style={{ width: screenWidth - 32 }}>
            <Sortable.Handle>
              <View style={{ width: 40, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 }}>
                <Text className="text-xs font-bold text-primary/60" style={{ lineHeight: 14 }}>
                  {i + 1}
                </Text>
                <Ionicons name="reorder-three-outline" size={20} color="#b06060" style={{ marginTop: 1 }} />
              </View>
            </Sortable.Handle>
            <View className="flex-1 py-0.5">
              <Controller
                control={control}
                name={`instructions.${i}.content`}
                render={({ field: f }) => (
                  <View className="flex-row gap-2 items-start flex-1 pr-2">
                    <TextInput
                      ref={(r) => { instructionRefs.current[i] = r; }}
                      className="flex-1 bg-input border border-border rounded-xl px-3 py-2.5 text-foreground text-sm"
                      placeholder={t('recipes.form_stepPlaceholder', { step: i + 1 })}
                      placeholderTextColor="#8a7a68"
                      multiline
                      style={{ textAlignVertical: 'top', minHeight: 64 }}
                      value={f.value}
                      onChangeText={f.onChange}
                    />

                    {fields.length > 1 && (
                      <TouchableOpacity onPress={() => onRemove(i)} hitSlop={8} className="mt-2">
                        <Text className="text-muted-foreground text-xl px-1">×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              />
            </View>
          </View>
        ))}
      </Sortable.Flex>
      {errors.instructions?.root && (
        <Text className="text-destructive text-sm mt-1">{errors.instructions.root.message}</Text>
      )}
      {errors.instructions &&
        !errors.instructions.root &&
        fields.map((_, i) =>
          errors.instructions?.[i]?.content ? (
            <Text key={i} className="text-destructive text-sm mt-1">
              {t('recipes.form_stepPlaceholder', { step: i + 1 })}: {errors.instructions[i]?.content?.message}
            </Text>
          ) : null
        )}

      <TouchableOpacity
        onPress={() => {
          const newIndex = fields.length;
          onAppend();
          setTimeout(() => instructionRefs.current[newIndex]?.focus(), 50);
        }}
        className="mt-2 self-start"
      >
        <Text className="text-primary text-sm font-semibold">{t('recipes.form_addStep')}</Text>
      </TouchableOpacity>
    </View>
  );
}
