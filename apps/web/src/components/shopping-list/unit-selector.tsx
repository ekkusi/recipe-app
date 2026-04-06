"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNITS } from "@/lib/units";

export function UnitSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTranslations("shopping");
  return (
    <Select value={value || "__none__"} onValueChange={(v) => onChange(!v || v === "__none__" ? "" : v)}>
      <SelectTrigger className="flex-1 rounded-xl">
        <SelectValue placeholder={t("unitOptional")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none__">{t("noUnit")}</SelectItem>
        {UNITS.map((u) => (
          <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
