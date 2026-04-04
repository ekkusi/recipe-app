export const UNITS = [
  { value: "g", label: "g (grams)" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "L", label: "L (litres)" },
  { value: "tsp", label: "tsp" },
  { value: "tbsp", label: "tbsp" },
  { value: "cup", label: "cup" },
  { value: "oz", label: "oz" },
  { value: "lb", label: "lb" },
  { value: "piece", label: "piece(s)" },
] as const;

export type Unit = (typeof UNITS)[number]["value"];
