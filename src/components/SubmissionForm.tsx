import { logRuntimeError } from "@/lib/runtimeDiagnostics";
import { toE164 } from "@/lib/intlPhone";
import { FinalReviewStep, missingFinalFields } from "./submission-form/steps/FinalReviewStep";
import { useState, useEffect, useRef } from "react";
import { handleError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSubmissions } from "@/contexts/SubmissionContext";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useAppPermissions } from "@/hooks/useAppPermissions";
import { Send, Loader2, Save, ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Check } from "lucide-react";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "./submission-form/StepIndicator";
import { PublishChecklist } from "./submission-form/PublishChecklist";
import { Step1Summary } from "./submission-form/Step1Summary";
import { DestaquePremiumSection } from "./submission-form/DestaquePremiumSection";
import { DuvidasWhatsappField } from "./submission-form/DuvidasWhatsappField";
import { 
  ContactStep, EventStep, AtrativoStep, 
  LocationStep, MediaStep, LegalStep 
} from "./submission-form/steps";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { validateBrazilianMobile, formatPhoneDisplay } from "@/lib/whatsapp";
import { generateFallbackFlyer } from "@/lib/generateFallbackFlyer";
import { emitEntityCreated } from "@/lib/entityEvents";
import { usePromotorProfile, useUpsertPromotorProfile } from "@/data/usePromotorProfile";
import { measureFlowOperation, startFlowMeasure } from "@/lib/flow-performance";
import { checkAttractionSchedule, useAttractionSchedule } from "@/data/useAttractionSchedule";
import { AttractionScheduleNotice } from "./submission-form/AttractionScheduleNotice";
import { submissionFormSchema, type SubmissionFormData } from "./submission-form/schema";
import { AdditionalEventsSection } from "./submission-form/AdditionalEventsSection";
import { findDuplicateEventStart } from "./submission-form/eventBatchValidation";

const formSchema = submissionFormSchema;
type FormData = SubmissionFormData;

const DRAFT_KEY = "agendilha_event_submission_draft";

export default function SubmissionForm() {
  const [eventImage, setEventImage] = useState<File | string | null>(null);
  const [imageSource, setImageSource] = useState<"upload" | "ai" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { addSubmission } = useSubmissions();
  const { user } = useAuth();
  const { isCollaborator, isPromoter } = useAppPermissions();
  const { profile, loaded } = useProfile();
  const { data: promotorProfile, isLoading: promotorLoading } = usePromotorProfile(user?.id);
  const { mutateAsync: upsertPromotorProfile } = useUpsertPromotorProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const draftLoadedRef = useRef(false);
  const stepTimerRef = useRef<ReturnType<typeof startFlowMeasure> | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickName: "", basicPhone: "", companyName: "", email: "",
      category: "", eventTitle: "", date: "", startTime: "",
      ageRating: "Livre", isSuitableForMinors: true,
      atrativoName: "", atrativoType: "", atrativoContact: "", atrativoEmail: "", atrativoCategory: undefined as any, atrativoOpeningHours: "",
      locationName: "", estabelecimentoId: "", eventAddress: "", locationType: "commercial" as const, locationCep: "",
      fotos: [],
      additionalEvents: [],
      promotionChoice: "free",
      duvidasSource: "promotor",
      duvidasWhatsapp: "",
      responsavelNome: "",
      legalAcceptance: false as any,
      duvidasAuthorized: false,
      usarMeuWhatsapp: false,
      duvidasWhatsappOutro: "",
    },
    mode: "onChange",
  });

  const watchedAttractionId = form.watch("atrativoSourceId");
  const watchedAttractionType = form.watch("atrativoSourceType");
  const watchedAttractionName = form.watch("atrativoName");
  const watchedDate = form.watch("date");
  const watchedStartTime = form.watch("startTime");
  const watchedEndTime = form.watch("endTime");
  const attractionSchedule = useAttractionSchedule({
    attractionId: watchedAttractionId,
    attractionType: watchedAttractionType,
    attractionName: watchedAttractionName,
    date: watchedDate,
    startTime: watchedStartTime,
    endTime: watchedEndTime,
  });
  const attractionScheduleRef = useRef(attractionSchedule);
  attractionScheduleRef.current = attractionSchedule;
  /** Espera a conferência da agenda terminar (até ~8s) em vez de bloquear o avanço. */
  const waitForAttractionSchedule = async () => {
    const started = Date.now();
    while (attractionScheduleRef.current.loading && Date.now() - started < 8000) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return attractionScheduleRef.current;
  };

  // Load profile data into form when ready + limpa rascunho stale de contato.
  useEffect(() => {
    if (loaded && profile) {
      const currentValues = form.getValues();
      // Contato: o perfil é a fonte da verdade. Sobrescreve o rascunho
      // pra evitar que um telefone/e-mail antigo salvo no navegador continue vencendo.
      if (profile.responsible_name) form.setValue("nickName", profile.responsible_name, { shouldDirty: false });
      if (profile.phone) form.setValue("basicPhone", profile.phone, { shouldDirty: false, shouldValidate: true });
      // Cadastro base → pré-preenche o "Responsável" da Fase 7.
      if (profile.responsible_name && !currentValues.responsavelNome) {
        form.setValue("responsavelNome", profile.responsible_name, { shouldDirty: false });
      }
      if (profile.phone && !currentValues.duvidasWhatsapp) {
        form.setValue("duvidasWhatsapp", formatPhoneDisplay(profile.phone), { shouldDirty: false });
      }
      if (profile.company_name || profile.responsible_name) {
        form.setValue("companyName", profile.company_name || profile.responsible_name || "", { shouldDirty: false });
      }
      if (profile.email) form.setValue("email", profile.email, { shouldDirty: false });
      // Endereço do local NUNCA vem do perfil: cada evento/estabelecimento tem o seu.

      // Limpa do localStorage os campos de contato salvos no rascunho —
      // assim, se o usuário atualizar o perfil, o rascunho não sobrescreve com dado velho.
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.data) {
            parsed.data.nickName = profile.responsible_name || parsed.data.nickName || "";
            parsed.data.basicPhone = profile.phone || "";
            parsed.data.companyName = profile.company_name || profile.responsible_name || parsed.data.companyName || "";
            parsed.data.email = profile.email || "";
            localStorage.setItem(DRAFT_KEY, JSON.stringify(parsed));
          }
        }
      } catch (e) {
        logger.warn("[SubmissionForm] não deu pra sincronizar o rascunho com o perfil", e);
      }
    }
  }, [loaded, profile, form]);

  // Perfil de Promotor/Divulgador (por usuário) tem prioridade sobre o cadastro base
  // pra reaproveitar nome/WhatsApp/tipo em divulgações futuras.
  useEffect(() => {
    if (promotorLoading || !promotorProfile) return;
    const current = form.getValues();
    if (promotorProfile.promotor_nome) {
      form.setValue("responsavelNome", promotorProfile.promotor_nome, { shouldDirty: false });
    }
    if (promotorProfile.promotor_whatsapp) {
      form.setValue("usarMeuWhatsapp", false, { shouldDirty: false });
      form.setValue("duvidasWhatsapp", formatPhoneDisplay(promotorProfile.promotor_whatsapp), { shouldDirty: false });
    }
    if (promotorProfile.tipo_promotor && !current.tipoResponsavel) {
      form.setValue("tipoResponsavel", promotorProfile.tipo_promotor as any, { shouldDirty: false });
    }
  }, [promotorLoading, promotorProfile, form]);

  // Restaura a etapa 1 com os dados mais recentes do perfil (sobrepondo o rascunho).
  const restoreContactFromProfile = () => {
    if (!profile) return;
    form.setValue("nickName", profile.responsible_name || "", { shouldDirty: true, shouldValidate: true });
    form.setValue("basicPhone", profile.phone || "", { shouldDirty: true, shouldValidate: true });
    form.setValue("companyName", profile.company_name || profile.responsible_name || "", { shouldDirty: true, shouldValidate: true });
    form.setValue("email", profile.email || "", { shouldDirty: true, shouldValidate: true });
    toast.success("Etapa 1 atualizada com os dados do seu perfil.");
  };

  // Handle draft loading
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const { data, step, savedAt } = JSON.parse(saved);
        form.reset(data);
        setCurrentStep(step === 2 ? 2 : 1);
        if (savedAt) setDraftSavedAt(new Date(savedAt));
        toast.info("Rascunho do evento recuperado.");
      } catch (e) {
        logger.warn("[SubmissionForm] rascunho inválido, começando do zero", e);
      }
    }
    draftLoadedRef.current = true;
  }, []);

  // Save draft on change (debounced, only after initial load)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const subscription = form.watch((value) => {
      if (!draftLoadedRef.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const now = new Date();
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({
            data: value,
            step: currentStep,
            savedAt: now.toISOString(),
          }));
          setDraftSavedAt(now);
        } catch (e) {
          logger.warn("[SubmissionForm] não deu pra salvar o rascunho", e);
        }
      }, 600);
    });
    return () => {
      if (timer) clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [form.watch, currentStep]);

  const steps = [
    { id: 1, title: "Informações do evento" },
    { id: 2, title: "Termos e contato" },
    { id: 3, title: "Revisão" },
  ];

  useEffect(() => {
    stepTimerRef.current?.finish({ outcome: "success" });
    stepTimerRef.current = startFlowMeasure("event-submission", "step-visible", currentStep);
  }, [currentStep]);

  useEffect(() => {
    return () => {
      stepTimerRef.current?.finish({ outcome: "cancelled" });
      stepTimerRef.current = null;
    };
  }, []);


  const FIELD_LABELS: Record<string, string> = {
    nickName: "Seu nome",
    basicPhone: "WhatsApp para contato",
    companyName: "Nome completo / Empresa",
    email: "E-mail",
    date: "Data do evento",
    startTime: "Horário de início",
    ageRating: "Classificação",
    eventTitle: "Nome do evento",
    endTime: "Horário previsto para término",
    atrativoName: "Nome do atrativo",
    atrativoContact: "WhatsApp do atrativo",
    atrativoEmail: "E-mail do atrativo",
    atrativoCategory: "Categoria do atrativo",
    locationName: "Nome do local/estabelecimento",
    eventAddress: "Endereço resumido do local",
    locationType: "Categoria do espaço",
    locationContact: "Contato do local/estabelecimento",
    locationCep: "CEP do local",
    localTipo: "Tipo de local",
    addressNeighborhood: "Bairro do local",
    legalAcceptance: "Aceite dos termos",
    duvidasWhatsapp: "WhatsApp do responsável pelas informações",
    duvidasAuthorized: "Autorização de uso do WhatsApp",
  };

  const nextStep = async () => {
    const fields = getFieldsForStep(currentStep);
    const validationTimer = startFlowMeasure("event-submission", "step-validation", currentStep);
    let isValid = false;
    try {
      isValid = await form.trigger(fields as any, { shouldFocus: true });
      validationTimer.finish({
        outcome: isValid ? "success" : "blocked",
        fieldCount: fields.length,
      });
    } catch (error) {
      validationTimer.finish({ outcome: "failure", fieldCount: fields.length, error });
      throw error;
    }
    if (isValid && currentStep === 1) {
      const schedule = await waitForAttractionSchedule();
      if (schedule.loading) {
        toast.info("Só um instante", { description: "Ainda estamos conferindo a agenda do atrativo. Toca em continuar de novo." });
        return;
      }
      if (schedule.hasConflict) {
        toast.error("Horário indisponível para este atrativo", {
          description: "Ajuste os horários para manter pelo menos 2 horas entre as apresentações.",
        });
        return;
      }
    }
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
      window.scrollTo(0, 0);
      return;
    }
    // Foca no primeiro campo inválido e mostra qual é.
    const errors = form.formState.errors as any;
    const firstInvalid = (fields as string[]).find((f) => errors?.[f]);
    if (firstInvalid) {
      const label = FIELD_LABELS[firstInvalid] ?? firstInvalid;
      const msg = errors[firstInvalid]?.message || "Preencha esse campo pra continuar.";
      toast.error(`Falta preencher: ${label}`, { description: String(msg) });
      form.setFocus(firstInvalid as any);
    } else {
      toast.error("Alguns campos precisam de ajuste antes de continuar.");
    }
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      // Etapa 1 — só nome/data/horário bloqueiam o avanço; o restante é complementar.
      case 1: return [
        "date", "startTime",
        "atrativoName",
        "additionalEvents",
      ];
      // Etapa 2 — apenas o aceite legal continua obrigatório no envio final.
      case 2: return [
        "legalAcceptance",
      ];
      default: return [];
    }
  };


  /** Gera e sobe um flyer automático; retorna a URL pública ou null (nunca bloqueia o envio). */
  const uploadFallbackFlyer = async (input: Parameters<typeof generateFallbackFlyer>[0]): Promise<string | null> => {
    try {
      const dataUrl = await generateFallbackFlyer(input);
      const blob = await (await fetch(dataUrl)).blob();
      const filePath = `${user?.id ?? "anon"}/fallback-${crypto.randomUUID()}.jpg`;
      const { error } = await supabaseClient.storage
        .from("event-flyers")
        .upload(filePath, blob, { contentType: "image/jpeg", upsert: false });
      if (error) return null;
      return supabaseClient.storage.from("event-flyers").getPublicUrl(filePath).data.publicUrl;
    } catch (e) {
      logger.warn("[fallback flyer] falhou, seguindo sem imagem", e);
      return null;
    }
  };

  const onSubmit = async (values: FormData) => {
    // Só publica a partir da etapa de Revisão; Enter ou cliques fora dela apenas avançam.
    if (currentStep < steps.length) {
      logger.info("[EventForm] submit ignorado fora da revisão", { currentStep });
      void nextStep();
      return;
    }
    const missing = missingFinalFields(values);
    if (missing.length > 0) {
      toast.error("Faltam informações obrigatórias", {
        description: "Confira data, horário de início, atração e o aceite dos termos antes de enviar.",
      });
      setCurrentStep(missing.includes("legalAcceptance") && missing.length === 1 ? 2 : 1);
      return;
    }
    setSubmitting(true);
    const submissionTimer = startFlowMeasure("event-submission", "complete-submission", currentStep);
    try {
      const duplicateStarts = findDuplicateEventStart([
        { date: values.date, startTime: values.startTime },
        ...values.additionalEvents.map((event) => ({ date: event.date, startTime: event.startTime })),
      ]);
      if (duplicateStarts.length > 0) {
        duplicateStarts.forEach((eventIndex) => {
          const path = eventIndex === 0 ? "startTime" : `additionalEvents.${eventIndex - 1}.startTime`;
          form.setError(path as any, {
            type: "manual",
            message: "Use um horário de início diferente para cada evento nesta data",
          });
        });
        toast.error("Tem eventos com o mesmo horário", {
          description: "Na mesma data, informe um horário de início diferente para cada evento.",
        });
        setCurrentStep(1);
        window.scrollTo(0, 0);
        submissionTimer.finish({ outcome: "blocked" });
        return;
      }

      const latestSchedule = await checkAttractionSchedule({
        attractionId: values.atrativoSourceId,
        attractionType: values.atrativoSourceType,
        attractionName: values.atrativoName,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
      });
      if (latestSchedule.some((entry) => entry.assessment === "conflict")) {
        toast.error("Horário indisponível para este atrativo", {
          description: "Outro evento foi cadastrado nesse intervalo. Ajuste os horários para manter pelo menos 2 horas livres.",
        });
        setCurrentStep(1);
        window.scrollTo(0, 0);
        submissionTimer.finish({ outcome: "blocked" });
        return;
      }

      for (let index = 0; index < values.additionalEvents.length; index += 1) {
        const event = values.additionalEvents[index];
        const schedule = await checkAttractionSchedule({
          attractionName: event.atrativoName,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
        });
        if (schedule.some((entry) => entry.assessment === "conflict")) {
          toast.error(`Horário indisponível no evento ${index + 2}`, {
            description: "Ajuste os horários para manter pelo menos 2 horas livres.",
          });
          setCurrentStep(1);
          window.scrollTo(0, 0);
          submissionTimer.finish({ outcome: "blocked" });
          return;
        }
      }

      const clean = (v?: string | null) => {
        if (v == null) return null;
        const s = String(v).trim();
        if (!s) return null;
        if (/^não informado$/i.test(s)) return null;
        return s;
      };

      const eventTitle = values.eventTitle?.trim() || null;

      let imageUrl = values.eventImageUrl;
      
      if (eventImage instanceof File) {
        const fileExt = eventImage.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        const { error: uploadError } = await measureFlowOperation(
          "event-submission",
          "flyer-upload",
          () => supabaseClient.storage.from('event-flyers').upload(filePath, eventImage),
          currentStep,
        );

        if (uploadError) {
          handleError(uploadError, { context: "SubmissionForm.uploadFlyer", fallback: "Erro ao subir o flyer." });
          throw uploadError;
        }

        const { data: { publicUrl } } = supabaseClient.storage
          .from('event-flyers')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      // Envio gratuito: não gera flyer automático. O flyer profissional é
      // benefício exclusivo do Evento em Destaque (pago).
      const IS_FREE_SUBMISSION = values.promotionChoice === "free";
      if (!imageUrl && !IS_FREE_SUBMISSION) {
        imageUrl = (await measureFlowOperation(
          "event-submission",
          "fallback-flyer",
          () => uploadFallbackFlyer({
            title: clean(values.eventTitle) || clean(values.atrativoName) || "Evento",
            date: toEventDateOnly(values.date),
            startTime: clean(values.startTime),
            location: clean(values.locationName),
            category: resolveAtrativoCategory(values) || clean(values.category),
          }),
          currentStep,
        )) ?? imageUrl;
      }

      // Map camelCase form fields → snake_case DB columns
      const payload: any = {
        is_free: IS_FREE_SUBMISSION,
        promotion_choice: values.promotionChoice,
        company_name: clean(values.companyName) || clean(values.nickName) || clean(profile?.responsible_name) || null,
        // responsible_name é preenchido abaixo com o nome do responsável (Fase 7).
        email: clean(values.email),
        phone: toE164(values.basicPhone),
        event_title: eventTitle,
        date: toEventDateOnly(values.date),
        start_time: clean(values.startTime),
        end_time: clean(values.endTime),
        location: clean(values.locationName),
        address_street: clean(values.addressStreet),
        address_number: clean(values.addressNumber),
        address_neighborhood: clean(values.addressNeighborhood),
        address_city: clean(values.addressCity),
        address_state: clean(values.addressState),
        address_zip: clean(values.addressZip),
        description: clean(values.description),
        video_link: clean(values.videoLink),
        category: resolveAtrativoCategory(values) || clean(values.category),
        contact_social: clean(values.contactSocial),
        additional_details: clean(values.additionalDetails),
        stage: clean(values.stage) || 'submitted',
        responsible_person: clean(values.responsiblePerson),
        atrativo_name: clean(values.atrativoName),
        atrativo_type: clean(values.atrativoType),
        atrativo_style: clean(values.atrativoStyle),
        atrativo_contact: toE164(values.atrativoContact),
        location_type: values.locationType,
        location_contact: clean(values.locationContact),
        local_tipo: clean((values as any).localTipo),
        legal_acceptance: values.legalAcceptance,
        legal_acceptance_date: values.legalAcceptance ? new Date().toISOString() : null,
        terms_accepted: values.legalAcceptance,
        terms_accepted_at: values.legalAcceptance ? new Date().toISOString() : null,
        age_rating: values.ageRating,
        is_suitable_for_minors: values.isSuitableForMinors,
        duvidas_source: 'promotor',
        responsavel_duvidas_whatsapp: clean(values.duvidasWhatsapp),
        // Responsável pelo evento (nova Fase 7). O nome do responsável
        // sobrescreve `responsible_name` no registro do evento.
        responsible_name: clean(values.responsavelNome) || clean(values.nickName),
        responsavel_tipo: values.tipoResponsavel || null,
        responsavel_perfil: {
          nome_artistico: clean(values.perfilNomeArtistico),
          estilo_musical: clean(values.perfilEstiloMusical),
          link_principal: clean(values.perfilLinkPrincipal),
          nome_estabelecimento: clean(values.perfilNomeEstabelecimento),
          categoria_local: clean(values.perfilCategoriaLocal),
          endereco_resumido: clean(values.perfilEnderecoResumido),
        },
        image_url: imageUrl || null,
        image_url_story: values.eventImageUrlStory || null,
        image_url_whatsapp: values.eventImageUrlWhatsapp || null,
        fotos: values.fotos || [],
        status: 'pendente',
      };

      if (values.atrativoSourceId && values.atrativoSourceType === "atrativo") {
        payload.atrativo_id = values.atrativoSourceId;
      }
      if (values.atrativoSourceId && values.atrativoSourceType === "artist") {
        payload.artist_id = values.atrativoSourceId;
      }

      // Vincula Local/Estabelecimento existente (se o usuário selecionou pelo autocomplete).
      const selectedEstabId = values.estabelecimentoId || null;
      if (selectedEstabId) payload.estabelecimento_id = selectedEstabId;

      const submissionInsertTimer = startFlowMeasure("event-submission", "submission-insert", currentStep);
      const result = await addSubmission(payload as any);
      submissionInsertTimer.finish({ outcome: result ? "success" : "failure" });

      if (!result) {
        submissionTimer.finish({ outcome: "failure" });
        return; // toast already shown by ctx
      }

      const insertedSubmissionIds = [result.id];
      for (let index = 0; index < values.additionalEvents.length; index += 1) {
        const event = values.additionalEvents[index];
        const additionalImageUrl = IS_FREE_SUBMISSION ? null : await uploadFallbackFlyer({
          title: clean(event.eventTitle) || clean(event.atrativoName) || "Evento",
          date: toEventDateOnly(event.date),
          startTime: clean(event.startTime),
          location: clean(values.locationName),
          category: clean(event.category) || payload.category,
        });
        const additionalPayload = {
          ...payload,
          event_title: clean(event.eventTitle),
          date: toEventDateOnly(event.date),
          start_time: clean(event.startTime),
          end_time: clean(event.endTime),
          atrativo_name: clean(event.atrativoName),
          atrativo_id: null,
          artist_id: null,
          category: clean(event.category) || payload.category,
          age_rating: event.ageRating,
          is_suitable_for_minors: event.ageRating === "Livre",
          description: clean(event.description),
          image_url: additionalImageUrl,
          image_url_story: null,
          image_url_whatsapp: null,
        };
        const additionalResult = await addSubmission(additionalPayload as any);
        if (!additionalResult) {
          toast.error(`O evento ${index + 2} não foi enviado`, {
            description: `${insertedSubmissionIds.length} evento(s) foram enviados. Remova os já enviados antes de tentar novamente.`,
          });
          submissionTimer.finish({ outcome: "failure" });
          return;
        }
        insertedSubmissionIds.push(additionalResult.id);
      }

      // Atrativos do evento: o principal + os incluídos pelo botão "Incluir atrativo".
      try {
        const extras = (values.extraAtrativos || []).filter((a) => clean(a?.name));
        if (extras.length) {
          const rows = [
            {
              submission_id: result.id,
              name: clean(values.atrativoName)!,
              category: resolveAtrativoCategory(values),
              whatsapp: toE164(values.atrativoContact),
              display_order: 0,
            },
            ...extras.map((a, i) => ({
              submission_id: result.id,
              name: clean(a.name)!,
              category: clean(a.category),
              whatsapp: toE164(a.whatsapp),
              display_order: i + 1,
            })),
          ];
          await measureFlowOperation(
            "event-submission",
            "additional-attractions-insert",
            async () => supabaseClient.from("submission_atrativos").insert(rows).then((response) => {
              if (response.error) throw response.error;
              return response;
            }),
            currentStep,
          );
        }
      } catch (e) {
        logger.warn("[SubmissionForm] atrativos adicionais falharam", e);
      }


      // "Primeira vez grava, próximas vezes reaproveita".
      // Cria Local/Estabelecimento e Atrativo quando o usuário digitou nomes novos,
      // pra que apareçam no autocomplete em divulgações futuras (após aprovação).
      try {
        if (!selectedEstabId && user?.id && clean(values.locationName)) {
          const { data: novoLocal } = await supabaseClient
            .from("estabelecimentos")
            .insert({
              nome: clean(values.locationName)!,
              tipo: clean((values as any).localTipo),
              bairro: clean(values.addressNeighborhood),
              endereco: clean(values.eventAddress),
              cep: clean((values as any).locationCep),
              contato: clean(values.locationContact),
              listing_kind: "event_venue",
              responsavel_id: user.id,
              created_by: user.id,
            })
            .select("id")
            .maybeSingle();
          if (novoLocal?.id) {
            await supabaseClient
              .from("submissions")
              .update({ estabelecimento_id: novoLocal.id })
              .in("id", insertedSubmissionIds);
            emitEntityCreated("estabelecimento");
          }
        }

        const atrativoLinkedType = (values as any).atrativoSourceType;
        const atrativoLinkedId = (values as any).atrativoSourceId;
        
        if (!atrativoLinkedId && user?.id && clean(values.atrativoName)) {
          await supabaseClient.from("atrativos").insert({
            name: clean(values.atrativoName)!,
            tipo_atrativo: resolveAtrativoCategory(values),
            category_other: values.atrativoCategory === "Outros" ? clean(values.atrativoCategoryOther) : null,
            type: clean(values.atrativoType),
            style: clean(values.atrativoStyle),
            contact_whatsapp: toE164(values.atrativoContact),
            contact_info: toE164(values.atrativoContact),
            description: clean(values.atrativoDescription),
            created_by: user.id,
            responsavel_id: user.id
          });
          emitEntityCreated("atrativo");
        }
      } catch (e) {
        // Não bloqueia o envio se o reuso falhar (ex.: nome duplicado).
        logger.warn("[SubmissionForm] auto-create local/atrativo falhou", e);
      }

      // Atualiza/cria o perfil de Promotor/Divulgador do usuário logado,
      // pra pré-preencher os campos nas próximas divulgações.
      try {
        if (user?.id && clean(values.responsavelNome)) {
          await upsertPromotorProfile({
            user_id: user.id,
            promotor_nome: clean(values.responsavelNome)!,
            promotor_whatsapp: clean(values.duvidasWhatsapp),
            tipo_promotor: values.tipoResponsavel || null,
          });
        }
      } catch (e) {
        logger.warn("[SubmissionForm] upsert promotor_profile falhou", e);
      }

      localStorage.removeItem(DRAFT_KEY);
      submissionTimer.finish({ outcome: "success" });
      toast.success(
        insertedSubmissionIds.length > 1 ? `${insertedSubmissionIds.length} eventos enviados!` : "Evento enviado!",
        { description: "Agora é com a gente: a equipe vai revisar e te avisa." },
      );
      navigate(
        values.promotionChoice === "highlight"
          ? `/evento-enviado/${result.id}/contratar-destaque`
          : `/evento-enviado/${result.id}`,
        { replace: true },
      );
    } catch (error) {
      submissionTimer.finish({ outcome: "failure", error });
      logRuntimeError("EventForm.submit", error, { step: currentStep, detail: { promotionChoice: values.promotionChoice, extraEvents: values.additionalEvents.length } });
      const detail = error instanceof Error ? error.message : (error as { message?: string })?.message;
      const dbError = error as { code?: string; details?: string; hint?: string } | null;
      console.error("EVENT_SUBMISSION_ERROR", {
        error,
        currentStep,
        formData: { ...values, basicPhone: values.basicPhone ? "[redacted]" : "", duvidasWhatsapp: values.duvidasWhatsapp ? "[redacted]" : "", email: values.email ? "[redacted]" : "" },
      });
      console.error("[EventForm.submit] Falha no envio do evento", {
        message: detail,
        code: dbError?.code,
        details: dbError?.details,
        hint: dbError?.hint,
        step: currentStep,
        extraEvents: values.additionalEvents.length,
        error,
      });
      toast.error("Não deu pra enviar o evento", {
        description: detail?.includes("DUPLICATE_EVENT_START")
          ? "Já existe um evento seu nesse local, data e horário. Escolhe outro horário de início."
          : detail || "Algo falhou ao salvar. Confere os dados e tenta de novo em instantes.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onInvalid = (errors: any) => {
    const firstKey = Object.keys(errors)[0];
    const invalidTimer = startFlowMeasure("event-submission", "final-validation", currentStep);
    invalidTimer.finish({ outcome: "blocked", fieldCount: Object.keys(errors).length });
    const firstMsg = errors[firstKey]?.message || "Verifique os campos obrigatórios";
    toast.error("Não foi possível finalizar o envio", { description: String(firstMsg) });
    // Jump to the first step that has an error
    const stepMap: Record<string, number> = {
      date: 1, startTime: 1, endTime: 1, eventTitle: 1, description: 1,
      atrativoSourceId: 1, atrativoName: 1, atrativoType: 1, atrativoStyle: 1, atrativoDescription: 1, atrativoContact: 1, atrativoEmail: 1,
      locationName: 1, eventAddress: 1, locationCep: 1, addressNeighborhood: 1,
      category: 1, ageRating: 1, atrativoCategory: 1, localTipo: 1,
      locationType: 1, locationContact: 1, duvidasWhatsapp: 1,
      nickName: 2, basicPhone: 2, companyName: 2, email: 2,
      addressZip: 2, addressStreet: 2, addressNumber: 2,
      legalAcceptance: 2, responsavelNome: 2,
      duvidasAuthorized: 2,
      additionalEvents: 1,
    };

    const target = stepMap[firstKey];
    if (target) setCurrentStep(target);
  };

  const resetDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    form.reset({
      nickName: profile?.responsible_name || "",
      basicPhone: profile?.phone || "",
      companyName: profile?.company_name || profile?.responsible_name || "",
      email: profile?.email || "",
    });
    setCurrentStep(1);
    setDraftSavedAt(null);
    toast.success("Rascunho limpo.");
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 animate-in zoom-in-95 duration-500">
        <CheckCircle2 className="h-20 w-20 text-green-500" />
        <h1 className="text-2xl font-bold sm:text-3xl">Sucesso!</h1>
        <p className="text-muted-foreground">Seu evento foi enviado para moderação.</p>
        <Button onClick={() => navigate("/agenda")}>Voltar para a Agenda</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-lg min-w-0 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
            Etapa {currentStep} de {steps.length} · {steps[currentStep - 1]?.title}
          </span>
          <div className="flex items-center gap-2">
            {draftSavedAt && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-emerald-600">
                <Check className="h-3 w-3" />
                Rascunho salvo {draftSavedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetDraft}
              className="text-muted-foreground hover:text-destructive gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Limpar</span>
            </Button>
          </div>
        </div>
        <StepIndicator steps={steps} currentStep={currentStep} />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8">
          {/* ETAPA 1 — informações principais do evento */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">Divulgar um rolê</h1>
                <p className="text-sm text-muted-foreground">
                  Comece pelo essencial: nome, data e horário. O resto pode ficar pra depois.
                </p>
              </div>

              <div className="border rounded-2xl px-4 py-5 bg-card/30">
                <EventStep form={form} section="core" />
              </div>

              <div className="border rounded-2xl px-4 py-5 bg-card/30">
                <AtrativoStep form={form} />
                <div className="mt-4">
                  <AttractionScheduleNotice
                    entries={attractionSchedule.entries}
                    loading={attractionSchedule.loading}
                    failed={attractionSchedule.failed}
                  />
                </div>
              </div>

              <div className="border rounded-2xl px-4 py-5 bg-card/30">
                <LocationStep form={form} />
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


              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="extras" className="border rounded-2xl px-4 bg-muted/20">
                  <AccordionTrigger className="hover:no-underline font-semibold">
                    Complementos opcionais
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      título, término, flyer e descrição
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 space-y-6">
                    <EventStep form={form} section="optional" />
                    <MediaStep
                      form={form}
                      imageSource={imageSource}
                      setImageSource={setImageSource}
                      eventImage={eventImage}
                      setEventImage={setEventImage}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {/* ETAPA 2 — conferência e aceite */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">Falta pouco</h1>
                <p className="text-sm text-muted-foreground">
                  Confira o resumo e aceite os termos. Contatos e demais detalhes são opcionais.
                </p>
              </div>

              <Step1Summary form={form} onEdit={() => { setCurrentStep(1); window.scrollTo(0, 0); }} />

              <PublishChecklist form={form} goToStep={setCurrentStep} variant="compact" />

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="contato" className="border rounded-2xl px-4 bg-muted/20">
                  <AccordionTrigger className="hover:no-underline font-semibold">
                    Contato oficial do rolê
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6 space-y-6">
                    <ContactStep
                      form={form}
                      onRestoreFromProfile={restoreContactFromProfile}
                      hasProfile={!!(profile?.phone || profile?.responsible_name || profile?.email)}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="border rounded-2xl px-4 py-5 bg-card/30">
                <LegalStep form={form} />
              </div>


            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <FinalReviewStep form={form} goToStep={(st) => { setCurrentStep(st); window.scrollTo(0, 0); }} />
              <AttractionScheduleNotice
                entries={attractionSchedule.entries}
                loading={attractionSchedule.loading}
                failed={attractionSchedule.failed}
              />
              <DestaquePremiumSection
                submitting={submitting}
                value={form.watch("promotionChoice")}
                onChange={(value) => form.setValue("promotionChoice", value, { shouldDirty: true, shouldValidate: true })}
              />
            </div>
          )}

          <div className="flex justify-between items-center pt-8 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setCurrentStep(prev => Math.max(prev - 1, 1)); window.scrollTo(0, 0); }}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>

            {currentStep < steps.length ? (
              // `key` distinto impede o React de reaproveitar o mesmo botão: sem isso, o clique em
              // "Continuar" virava "Publicar" no meio do evento e enviava o formulário sem passar pela Revisão.
              <Button key="next-step" type="button" onClick={nextStep} className="gap-2 h-12 px-6 font-bold">
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button key="publish" type="submit" disabled={submitting || attractionSchedule.loading || attractionSchedule.hasConflict || missingFinalFields(form.watch()).length > 0} className="gap-2 h-12 px-6 gradient-sunset font-bold">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {form.watch("additionalEvents").length > 0 ? "Publicar eventos" : "Publicar evento"}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}


/** Categoria final do atrativo: usa o texto digitado quando a opção é "Outra categoria". */
function resolveAtrativoCategory(values: { atrativoCategory?: string; atrativoCategoryOther?: string }) {
  const cat = (values.atrativoCategory ?? "").trim();
  if (cat === "Outros") return (values.atrativoCategoryOther ?? "").trim() || "Outros";
  return cat || null;
}

/** Grava sempre a data do evento como "yyyy-MM-dd" (dia de São Paulo), mesmo vinda de rascunho antigo em ISO. */
function toEventDateOnly(value?: string | null): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
