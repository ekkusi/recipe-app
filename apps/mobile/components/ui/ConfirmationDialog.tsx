import { ReactNode } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Modal, type ModalProps } from './Modal';

export interface ConfirmationDialogProps extends Omit<ModalProps, 'children' | 'placement' | 'closeButton'> {
  title: string;
  message?: string | ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose?.();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      placement="center"
      title={title}
      closeButton={false}
    >
      {message && typeof message === "string" ? (
        <Text className="text-foreground mb-6 leading-relaxed">
          {message}
        </Text>) : message}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={handleCancel}
          disabled={isLoading}
          className="flex-1 border border-border rounded-xl py-3 items-center active:opacity-75"
          style={{ opacity: isLoading ? 0.5 : 1 }}
        >
          <Text className="text-foreground font-semibold">{cancelLabel}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleConfirm}
          disabled={isLoading}
          className={`flex-1 rounded-xl py-3 items-center active:opacity-75 ${isDestructive ? 'bg-destructive' : 'bg-primary'
            }`}
          style={{ opacity: isLoading ? 0.5 : 1 }}
        >
          <Text
            className={`font-semibold ${isDestructive ? 'text-white' : 'text-primary-foreground'
              }`}
          >
            {confirmLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
