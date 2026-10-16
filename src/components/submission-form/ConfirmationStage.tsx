import type { UseFormReturn } from "react-hook-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PublishChecklist } from "./PublishChecklist";
import { Step1Summary } from "./Step1Summary";
import { ContactStep, LegalStep } from "./steps";

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  goToStep: (step: number) => void;
  onRestoreFromProfile: () => void;
  hasProfile: boolean;
};

/** Etapa 2 do cadastro de rolê: resumo, contato oficial e aceite dos termos. */
export function ConfirmationStage({ form, goToStep, onRestoreFromProfile, hasProfile }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Falta pouco</h1>
        <p className="text-sm text-muted-foreground">
          Confira o resumo e aceite os termos. Contatos e demais detalhes são opcionais.
        </p>
      </div>

      <Step1Summary form={form} onEdit={() => { goToStep(1); window.scrollTo(0, 0); }} />

      <PublishChecklist form={form} goToStep={goToStep} variant="compact" />

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="contato" className="border rounded-2xl px-4 bg-muted/20">
          <AccordionTrigger className="hover:no-underline font-semibold">
            Contato oficial do rolê
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-6 space-y-6">
            <ContactStep form={form} onRestoreFromProfile={onRestoreFromProfile} hasProfile={hasProfile} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="border rounded-2xl px-4 py-5 bg-card/30">
        <LegalStep form={form} />
      </div>
    </div>
  );
}
