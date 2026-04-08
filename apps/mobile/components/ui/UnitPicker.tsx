import { UNITS } from '@recipe-app/shared';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface UnitPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export function UnitPicker({ value, onChange }: UnitPickerProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  function select(unit: string) {
    onChange(unit === value ? '' : unit);
    setOpen(false);
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="bg-input border border-border rounded-xl px-3 py-2.5 items-center justify-center active:opacity-75"
      >
        <Text className={`text-sm ${value ? 'text-foreground' : 'text-muted-foreground'}`} numberOfLines={1}>
          {value || t('units.placeholder')}
        </Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 bg-black/40 justify-end"
          onPress={() => setOpen(false)}
        >
          <Pressable onPress={() => { }}>
            <View className="bg-card rounded-t-3xl px-4 pt-4" style={{ paddingBottom: insets.bottom + 32 }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-base font-bold text-foreground">{t('units.selectTitle')}</Text>
                <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                  <Text className="text-muted-foreground text-xl">×</Text>
                </TouchableOpacity>
              </View>
              <ScrollView bounces={false}>
                {/* None option */}
                <TouchableOpacity
                  onPress={() => select('')}
                  className={`py-3 px-4 rounded-xl mb-1 active:opacity-75 ${!value ? 'bg-primary' : 'bg-muted'
                    }`}
                >
                  <Text className={`font-medium ${!value ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {t('units.none')}
                  </Text>
                </TouchableOpacity>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u.value}
                    onPress={() => select(u.value)}
                    className={`py-3 px-4 rounded-xl mb-1 active:opacity-75 ${value === u.value ? 'bg-primary' : 'bg-muted'
                      }`}
                  >
                    <Text
                      className={`font-medium ${value === u.value ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                    >
                      {u.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
