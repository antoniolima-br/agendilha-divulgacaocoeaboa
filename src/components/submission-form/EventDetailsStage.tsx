import type { UseFormReturn } from "react-hook-form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AdditionalEventsSection } from "./AdditionalEventsSection";
import { AttractionScheduleNotice } from "./AttractionScheduleNotice";
import { DuvidasWhatsappField } from "./DuvidasWhatsappField";
import { FlyerUpload } from "./FlyerUpload";
import { AtrativoStep, EventStep, LocationStep, MediaStep } from "./steps";

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  eventImage: File | null;
  onImage: (file: File | null) => void;
  preserveDate: boolean;
  schedule: { entries: Parameters<typeof AttractionScheduleNotice>[0]["entries"]; loading: boolean; failed: boolean };
};

/** Etapa 1 do cadastro de rolê: flyer, dados principais, local, atração e complementos. */
export function EventDetailsStage({ form, eventImage, onImage, preserveDate, schedule }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Divulgar um rolê</h1>
        <p className="text-sm text-muted-foreground">
          Seu rolê, do seu jeito.
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8">
        <FlyerUpload image={eventImage || form.watch("eventImageUrl") || null} onImage={onImage} form={form} preserveDate={preserveDate} />
        <div id="manual-event-fields" className="min-w-0 space-y-6">
          <EventStep form={form} section="core" />
          <LocationStep form={form} />
        </div>
      </div>

      <div className="border rounded-2xl px-4 py-5 bg-card/30">
        <AtrativoStep form={form} />
        <div className="mt-4">
          <AttractionScheduleNotice
            entries={schedule.entries}
            loading={schedule.loading}
            failed={schedule.failed}
          />
        </div>
      </div>

      <div className="border rounded-2xl px-4 py-5 bg-card/30">
        <AdditionalEventsSection form={form} />
      </div>

      <div className="border rounded-2xl px-4 py-5 bg-card/30">
        <EventStep form={form} section="selections" />
      </div>

      <div className="border rounded-2xl px-4 py-5 bg-card/30">
        <DuvidasWhatsappField form={form} />
      </div>


      <Accordion type="single" collapsible defaultValue="extras" className="w-full">
        <AccordionItem value="extras" className="border rounded-2xl px-4 bg-muted/20">
          <AccordionTrigger className="hover:no-underline font-semibold">
            Complementos opcionais
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              término, flyer e descrição
            </span>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-6 space-y-6">
            <EventStep form={form} section="optional" />
            <MediaStep
              form={form}
              eventImage={eventImage}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
