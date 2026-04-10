export const UNITS = [
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "dl", label: "dl" },
  { value: "l", label: "l" },
  { value: "tsp", label: "tl (teelusikka)" },
  { value: "tbsp", label: "rkl (ruokalusikka)" },
  { value: "cup", label: "kuppi" },
  { value: "oz", label: "oz" },
  { value: "lb", label: "lb" },
  { value: "piece", label: "kpl" },
  { value: "jar", label: "prk" },
  { value: "cm", label: "cm" }
] as const;

export type Unit = (typeof UNITS)[number]["value"];

export function getUnitLabel(value: string | null | undefined): string {
  if (!value) return '';
  return UNITS.find((u) => u.value === value)?.label ?? value;
}
