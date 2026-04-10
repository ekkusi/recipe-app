import { ReactNode } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export interface DropdownMenuOption {
  id: string;
  label: string;
  icon?: string;
  iconType?: 'ionicons' | 'material-community';
  iconSize?: number;
  iconColor?: string;
  destructive?: boolean;
  onPress: () => void;
}

interface DropdownMenuProps {
  visible: boolean;
  onClose: () => void;
  options: DropdownMenuOption[];
  position?: {
    top?: number;
    right?: number;
    left?: number;
    bottom?: number;
  };
}

export function DropdownMenu({
  visible,
  onClose,
  options,
  position = { top: 108, right: 12 },
}: DropdownMenuProps) {
  const menuStyle: ViewStyle = {
    position: 'absolute',
    minWidth: 200,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    ...position,
  };

  const renderIcon = (option: DropdownMenuOption) => {
    if (!option.icon) return null;

    const iconProps = {
      size: option.iconSize ?? 18,
      color: option.iconColor ?? (option.destructive ? '#dc2626' : '#5c4f44'),
    };

    const IconComponent = option.iconType === 'material-community' ? MaterialCommunityIcons : Ionicons;

    return <IconComponent name={option.icon as any} {...iconProps} />;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1" onPress={onClose}>
        <View style={menuStyle} className="bg-background border border-border rounded-2xl overflow-hidden">
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.id}
              onPress={() => {
                onClose();
                option.onPress();
              }}
              className={`px-4 py-3.5 flex-row items-center gap-3 active:bg-muted/50 ${
                index < options.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              {renderIcon(option)}
              <Text
                className={option.destructive ? 'text-destructive text-base font-semibold' : 'text-foreground text-base font-semibold'}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}
