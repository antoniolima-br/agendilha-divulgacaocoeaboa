import { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DDIS, composePhone, findDdi, maskNational, splitPhone } from "@/lib/intlPhone";
import { cn } from "@/lib/utils";

interface Props {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  className?: string;
  id?: string;
}

export const IntlPhoneInput = forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onBlur, className, id }, ref) => {
    const { ddi, national } = splitPhone(value);
    const info = findDdi(ddi);
    const placeholder = ddi === "55" ? "(21) 98765-4321" : ddi === "351" ? "932 495 293" : "Número";

    return (
      <div className="flex w-full min-w-0 gap-2">
        <Select value={ddi} onValueChange={(code) => onChange(composePhone(code, national))}>
          <SelectTrigger className="h-12 w-[108px] shrink-0" aria-label="Código do país (DDI)">
            <SelectValue>{`${info.flag} +${ddi}`}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DDIS.map((d) => (
              <SelectItem key={d.code} value={d.code}>
                {d.flag} +{d.code} · {d.country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          ref={ref}
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={placeholder}
          className={cn("h-12 min-w-0 flex-1", className)}
          value={maskNational(ddi, national)}
          onChange={(e) => onChange(composePhone(ddi, e.target.value))}
          onBlur={onBlur}
        />
      </div>
    );
  },
);
IntlPhoneInput.displayName = "IntlPhoneInput";
