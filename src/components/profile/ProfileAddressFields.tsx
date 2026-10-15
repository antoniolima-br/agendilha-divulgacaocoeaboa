import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface ProfileAddressForm {
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  country: string;
}

interface ProfileAddressFieldsProps {
  value: ProfileAddressForm;
  onChange: (field: keyof ProfileAddressForm, value: string) => void;
}

export function ProfileAddressFields({ value, onChange }: ProfileAddressFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-2">
          <Label>Rua / Avenida</Label>
          <Input name="address-line1" autoComplete="address-line1" value={value.address_street} onChange={(event) => onChange("address_street", event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Número</Label>
          <Input name="address-line2" autoComplete="address-line2" value={value.address_number} onChange={(event) => onChange("address_number", event.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Complemento (opcional)</Label>
        <Input name="address-line3" autoComplete="address-line3" value={value.address_complement} onChange={(event) => onChange("address_complement", event.target.value)} placeholder="Bloco, apto…" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Bairro</Label>
          <Input name="address-level3" autoComplete="address-level3" value={value.address_neighborhood} onChange={(event) => onChange("address_neighborhood", event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Cidade</Label>
          <Input name="city" autoComplete="address-level2" value={value.address_city} onChange={(event) => onChange("address_city", event.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Estado (UF)</Label>
          <Input name="state" autoComplete="address-level1" value={value.address_state} onChange={(event) => onChange("address_state", event.target.value)} placeholder="RJ" />
        </div>
        <div className="space-y-2">
          <Label>País</Label>
          <Input name="country" autoComplete="country-name" value={value.country} onChange={(event) => onChange("country", event.target.value)} />
        </div>
      </div>
    </>
  );
}