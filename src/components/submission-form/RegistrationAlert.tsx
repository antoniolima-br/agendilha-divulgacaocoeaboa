import { AlertCircle, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registrationMessages, type RegistrationCode } from "@/lib/eventRegistration";

export function RegistrationAlert({ code, onSponsored }: { code: RegistrationCode; onSponsored: () => void }) {
  return <div role="alert" className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
    <p className="flex items-start gap-2 text-sm"><AlertCircle className="h-5 w-5 shrink-0 text-primary" /><span><strong>Coezinho:</strong> {registrationMessages[code]}</span></p>
    {code === "FREE_DAILY_QUOTA" && <Button type="button" variant="outline" onClick={onSponsored} className="gap-2 whitespace-normal"><Megaphone className="h-4 w-4 shrink-0" />Escolher Divulgação Patrocinada</Button>}
  </div>;
}