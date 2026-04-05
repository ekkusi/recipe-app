import { Pressable, Text, type PressableProps } from 'react-native';

type ButtonProps = PressableProps & {
  label: string;
};

export function Button({ label, ...props }: ButtonProps) {
  return (
    <Pressable
      {...props}
      className={`bg-primary rounded-3xl py-4 items-center active:opacity-75 ${props.disabled ? 'opacity-50' : ''}`}
    >
      <Text className="text-primary-foreground font-semibold text-base">{label}</Text>
    </Pressable>
  );
}
