import { Modal, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

interface PrivacyModalProps {
  visible: boolean;
  onClose: () => void;
  webUrl: string;
}

export function PrivacyModal({ visible, onClose, webUrl }: PrivacyModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-end px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={28} color="#b06060" />
          </TouchableOpacity>
        </View>

        {/* WebView */}
        <WebView
          source={{ uri: webUrl }}
          scalesPageToFit
          showsVerticalScrollIndicator={true}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    </Modal>
  );
}
