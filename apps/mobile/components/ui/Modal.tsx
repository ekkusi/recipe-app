import { ReactNode, useMemo } from 'react';
import { Pressable, ScrollView, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RNModal, { ModalProps as RNModalProps } from 'react-native-modal';

export type ModalPlacement = 'top' | 'bottom' | 'center' | 'left' | 'right';

export interface ModalProps extends Partial<Omit<RNModalProps, 'isVisible' | 'onModalHide'>> {
  isOpen: boolean;
  placement?: ModalPlacement;
  title?: string | ReactNode;
  closeButton?: boolean | ReactNode;
  closeOnBackgroundPress?: boolean;
  onClose?: () => void;
  scrollable?: boolean;
  contentContainerStyle?: ViewStyle;
  children: ReactNode;
}

const outerViewStyle: ViewStyle = {
  margin: 0,
};

const innerViewStyle: ViewStyle = {
  width: '100%',
  maxHeight: '80%',
  backgroundColor: '#faf7f0',
  overflow: 'hidden',
};

const bodyStyle: ViewStyle = {
  paddingHorizontal: 16,
  paddingBottom: 16,
  paddingTop: 16,
};

export function Modal({
  placement = 'center',
  title,
  closeButton = true,
  closeOnBackgroundPress = true,
  isOpen,
  onClose,
  children,
  scrollable,
  contentContainerStyle,
  ...rest
}: ModalProps) {
  const insets = useSafeAreaInsets();

  const outerViewStyles: ViewStyle = useMemo(() => {
    let placementStyles: ViewStyle;
    switch (placement) {
      case 'top':
        placementStyles = { justifyContent: 'flex-start' };
        break;
      case 'bottom':
        placementStyles = { justifyContent: 'flex-end' };
        break;
      case 'left':
        placementStyles = { alignItems: 'flex-start' };
        break;
      case 'right':
        placementStyles = { alignItems: 'flex-end' };
        break;
      default:
        placementStyles = { alignItems: 'center', justifyContent: 'center' };
        break;
    }
    return { ...outerViewStyle, ...placementStyles };
  }, [placement]);

  const bodyStyles: ViewStyle = useMemo(() => {
    let placementStyles: ViewStyle = {};
    switch (placement) {
      case 'bottom':
        placementStyles = { paddingBottom: insets.bottom > 0 ? insets.bottom + 20 : 20 };
        break;
      case 'center':
        break;
      case 'left':
      case 'right':
        placementStyles = { paddingBottom: insets.bottom, paddingTop: insets.top };
        break;
      default:
        placementStyles = { paddingTop: insets.top > 0 ? insets.top : 20 };
        break;
    }
    return { ...bodyStyle, ...placementStyles };
  }, [insets.bottom, insets.top, placement]);

  const innerViewStyles: ViewStyle = useMemo(() => {
    let placementStyles: ViewStyle;
    switch (placement) {
      case 'top':
        placementStyles = { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 };
        break;
      case 'bottom':
        placementStyles = { borderTopLeftRadius: 20, borderTopRightRadius: 20 };
        break;
      case 'left':
      case 'right':
        placementStyles = {
          maxHeight: '100%',
          height: '100%',
          width: '80%',
        };
        break;
      default:
        placementStyles = { borderRadius: 12, width: '90%' };
        break;
    }
    return {
      ...innerViewStyle,
      ...placementStyles,
      ...(!scrollable ? bodyStyles : {}),
    };
  }, [bodyStyles, insets.bottom, placement, scrollable]);

  const animationIn = useMemo(() => {
    switch (placement) {
      case 'top':
        return 'slideInDown';
      case 'bottom':
        return 'slideInUp';
      case 'left':
        return 'slideInLeft';
      case 'right':
        return 'slideInRight';
      default:
        return 'zoomIn';
    }
  }, [placement]);

  const animationOut = useMemo(() => {
    switch (placement) {
      case 'top':
        return 'slideOutUp';
      case 'bottom':
        return 'slideOutDown';
      case 'left':
        return 'slideOutLeft';
      case 'right':
        return 'slideOutRight';
      default:
        return 'zoomOut';
    }
  }, [placement]);

  const content = (
    <>
      {(title || closeButton) && (
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: title ? 'space-between' : 'flex-end',
            alignItems: 'center',
            marginBottom: title ? 16 : 0,
          }}
        >
          {typeof title === 'string' ? (

            <Text className="font-bold text-lg text-foreground">
              {title}</Text>
          ) : (
            title
          )}
          {typeof closeButton === 'boolean' ? (
            closeButton && (
              <TouchableOpacity onPress={onClose} hitSlop={8} className="active:opacity-75">
                <MaterialCommunityIcons name="close" size={24} color="#5c4f44" />
              </TouchableOpacity>
            )
          ) : (
            closeButton
          )}
        </View>
      )}
      {children}
    </>
  );

  const body = scrollable ? (
    <ScrollView
      contentContainerStyle={{ ...bodyStyles, ...contentContainerStyle }}
      scrollEnabled={true}
    >
      <Pressable onStartShouldSetResponder={() => true}>
        {content}
      </Pressable>
    </ScrollView>
  ) : (
    content
  );

  return (
    <RNModal
      isVisible={isOpen}
      onModalHide={onClose}
      animationIn={animationIn}
      animationOut={animationOut}
      animationInTiming={350}
      animationOutTiming={250}
      backdropOpacity={0.4}
      backdropTransitionInTiming={350}
      backdropTransitionOutTiming={250}
      onBackdropPress={closeOnBackgroundPress ? onClose : undefined}
      style={outerViewStyles}
      {...rest}
    >
      <View style={innerViewStyles}>
        <Pressable onStartShouldSetResponder={() => true}>{body}</Pressable>
      </View>
    </RNModal>
  );
}
