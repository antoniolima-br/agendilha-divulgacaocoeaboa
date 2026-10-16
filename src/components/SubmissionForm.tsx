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
import { Save, CheckCircle2, RotateCcw, Check } from "lucide-react";
import { supabase as supabaseClient } from "@/integrations/supabase/client";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "./submission-form/StepIndicator";
import { ConfirmationStage } from "./submission-form/ConfirmationStage";
import { EventDetailsStage } from "./submission-form/EventDetailsStage";
import { FormNavigation } from "./submission-form/FormNavigation";
import { SubmitReviewDialog } from "./submission-form/SubmitReviewDialog";
import { DestaquePremiumSection } from "./submission-form/DestaquePremiumSection";
import { validateBrazilianMobile, formatPhoneDisplay } from "@/lib/whatsapp";
import { prepareSponsoredFlyers, uploadSponsoredFlyer } from "@/lib/sponsoredFlyer";
import { emitEntityCreated } from "@/lib/entityEvents";
import { usePromotorProfile, useUpsertPromotorProfile } from "@/data/usePromotorProfile";
import { measureFlowOperation, startFlowMeasure } from "@/lib/flow-performance";
import { checkAttractionSchedule, useAttractionSchedule } from "@/data/useAttractionSchedule";
import { AttractionScheduleNotice } from "./submission-form/AttractionScheduleNotice";
import { submissionFormSchema, type SubmissionFormData } from "./submission-form/schema";
import { findDuplicateEventStart } from "./submission-form/eventBatchValidation";
import { uploadFlyerImage } from "@/lib/flyerImages";
import { checkEventRegistration, flyerFingerprint, registrationCode, registrationMessages, type RegistrationCode, type RegistrationEvent } from "@/lib/eventRegistration";
import { RegistrationAlert } from "./submission-form/RegistrationAlert";
import {
  SUBMISSION_DRAFT_KEY,
  SUBMISSION_ERROR_STEPS,
  SUBMISSION_FIELD_LABELS,
  SUBMISSION_STEPS,
  cleanOptional,
  fieldsForSubmissionStep,
  resolveAtrativoCategory,
  toEventDateOnly,
  suggestedSubmissionDate,
} from "./submission-form/formConfig";

const formSchema = submissionFormSchema;
type FormData = SubmissionFormData;

export default function SubmissionForm({ initialValues }: { initialValues?: Partial<SubmissionFormData> } = {}) {
  const [eventImage, setEventImage] = useState<File | string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const reviewConfirmedRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  const { addSubmissionBatch } = useSubmissions();
  const [registrationIssue, setRegistrationIssue] = useState<RegistrationCode | null>(null);
  const submittingRef = useRef(false);
  const { user } = useAuth();
  const { isCollaborator, isPromoter } = useAppPermissions();
  const { profile, loaded } = useProfile();
  const { data: promotorProfile, isLoading: promotorLoading } = usePromotorProfile(user?.id);
  const { mutateAsync: upsertPromotorProfile } = useUpsertPromotorProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);
  const draftLoadedRef = useRef(false);
  const flyerPreserveDateRef = useRef(false);
  const stepTimerRef = useRef<ReturnType<typeof startFlowMeasure> | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickName: "", basicPhone: "", companyName: "", email: "",
      category: "", eventTitle: "", date: suggestedSubmissionDate(), startTime: "",
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
        const saved = localStorage.getItem(SUBMISSION_DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.data) {
            parsed.data.nickName = profile.responsible_name || parsed.data.nickName || "";
            parsed.data.basicPhone = profile.phone || "";
            parsed.data.companyName = profile.company_name || profile.responsible_name || parsed.data.companyName || "";
            parsed.data.email = profile.email || "";
            localStorage.setItem(SUBMISSION_DRAFT_KEY, JSON.stringify(parsed));
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
    if (initialValues) {
      flyerPreserveDateRef.current = Boolean(initialValues.date);
      form.reset({ ...form.getValues(), ...initialValues, date: suggestedSubmissionDate(initialValues.date) });
      setCurrentStep(1);
      draftLoadedRef.current = true;
      return;
    }
    const saved = localStorage.getItem(SUBMISSION_DRAFT_KEY);
    if (saved) {
      try {
        const { data, step, savedAt } = JSON.parse(saved);
        flyerPreserveDateRef.current = Boolean(data?.date);
        form.reset({ ...data, date: suggestedSubmissionDate(data?.date) });
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
          localStorage.setItem(SUBMISSION_DRAFT_KEY, JSON.stringify({
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

  const steps = SUBMISSION_STEPS;

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


  const nextStep = async () => {
    const fields = fieldsForSubmissionStep(currentStep);
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
      const label = SUBMISSION_FIELD_LABELS[firstInvalid] ?? firstInvalid;
      const msg = errors[firstInvalid]?.message || "Preencha esse campo pra continuar.";
      toast.error(`Falta preencher: ${label}`, { description: String(msg) });
      form.setFocus(firstInvalid as any);
    } else {
      toast.error("Alguns campos precisam de ajuste antes de continuar.");
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
    // Antes de mandar pra curadoria, mostra o resumo e espera a confirmação.
    if (!reviewConfirmedRef.current) {
      setReviewOpen(true);
      return;
    }
    reviewConfirmedRef.current = false;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setRegistrationIssue(null);
    setSubmitting(true);
    const submissionTimer = startFlowMeasure("event-submission", "complete-submission", currentStep);
    try {
      const fingerprint = eventImage instanceof File ? await flyerFingerprint(eventImage) : null;
      const registrationEvents: RegistrationEvent[] = [values, ...values.additionalEvents].map((event, index) => ({
        date: toEventDateOnly(event.date), start_time: event.startTime,
        event_title: event.eventTitle, atrativo_name: event.atrativoName,
        location: values.locationName, estabelecimento_id: values.estabelecimentoId || null,
        address_neighborhood: values.addressNeighborhood,
        atrativo_id: index === 0 && values.atrativoSourceType === "atrativo" ? values.atrativoSourceId || null : null,
        artist_id: index === 0 && values.atrativoSourceType === "artist" ? values.atrativoSourceId || null : null,
        image_url: index === 0 ? values.eventImageUrl : null,
        flyer_fingerprint: index === 0 ? fingerprint : null,
        promotion_choice: values.promotionChoice,
      }));
      const issue = await checkEventRegistration(registrationEvents);
      if (issue) {
        setRegistrationIssue(issue);
        submissionTimer.finish({ outcome: "blocked" });
        return;
      }
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

      const clean = cleanOptional;

      const eventTitle = values.eventTitle?.trim() || null;

      let imageUrl = values.eventImageUrl;
      
      if (eventImage instanceof File) {
        const file = eventImage;
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${user?.id}/${fileName}`;

        imageUrl = await measureFlowOperation(
          "event-submission",
          "flyer-upload",
          () => uploadFlyerImage(file, filePath),
          currentStep,
        );
      }

      // Envio gratuito: não gera flyer automático. O flyer profissional é
      // benefício exclusivo do Evento em Destaque (pago).
      const IS_FREE_SUBMISSION = values.promotionChoice === "free";
      const flyerUrls = await measureFlowOperation(
          "event-submission",
          "fallback-flyer",
          () => prepareSponsoredFlyers(values.promotionChoice, [{ imageUrl, data: {
            title: clean(values.eventTitle) || clean(values.atrativoName) || "Evento",
            date: toEventDateOnly(values.date),
            startTime: clean(values.startTime),
            location: clean(values.locationName) || clean(values.eventAddress),
            category: resolveAtrativoCategory(values) || clean(values.category),
          } }, ...values.additionalEvents.map((event) => ({ data: {
            title: clean(event.eventTitle) || clean(event.atrativoName) || "Evento",
            date: toEventDateOnly(event.date),
            startTime: clean(event.startTime),
            location: clean(values.locationName) || clean(values.eventAddress),
            category: clean(event.category) || resolveAtrativoCategory(values) || clean(values.category),
          } }))], (data) => uploadSponsoredFlyer(data, user?.id || "")),
          currentStep,
        );
      imageUrl = flyerUrls[0] || undefined;

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
        flyer_fingerprint: fingerprint,
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
      const batch = [payload, ...values.additionalEvents.map((event, index) => {
        const additionalImageUrl = flyerUrls[index + 1];
        return {
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
          flyer_fingerprint: null,
          image_url_story: null,
          image_url_whatsapp: null,
        };
      })];
      const results = await addSubmissionBatch(batch);
      submissionInsertTimer.finish({ outcome: "success" });
      const result = results[0];
      if (!result) throw new Error("Não deu pra confirmar o evento enviado.");
      const insertedSubmissionIds = results.map(row => row.id);

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

      localStorage.removeItem(SUBMISSION_DRAFT_KEY);
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
      const issue = registrationCode(error);
      if (issue) {
        setRegistrationIssue(issue);
        toast.error(registrationMessages[issue]);
        submissionTimer.finish({ outcome: "blocked" });
        return;
      }
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
      submittingRef.current = false;
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
    const target = SUBMISSION_ERROR_STEPS[firstKey];
    if (target) setCurrentStep(target);
  };

  const resetDraft = () => {
    flyerPreserveDateRef.current = false;
    localStorage.removeItem(SUBMISSION_DRAFT_KEY);
    form.reset({
      nickName: profile?.responsible_name || "",
      basicPhone: profile?.phone || "",
      companyName: profile?.company_name || profile?.responsible_name || "",
      email: profile?.email || "",
      date: suggestedSubmissionDate(),
    });
    setCurrentStep(1);
    setDraftSavedAt(null);
    setEventImage(null);
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
            <EventDetailsStage
              form={form}
              eventImage={eventImage}
              onImage={setEventImage}
              preserveDate={flyerPreserveDateRef.current}
              schedule={attractionSchedule}
            />
          )}

          {/* ETAPA 2 — conferência e aceite */}
          {currentStep === 2 && (
            <ConfirmationStage
              form={form}
              goToStep={setCurrentStep}
              onRestoreFromProfile={restoreContactFromProfile}
              hasProfile={!!(profile?.phone || profile?.responsible_name || profile?.email)}
            />
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
                onChange={(value) => { setRegistrationIssue(null); form.setValue("promotionChoice", value, { shouldDirty: true, shouldValidate: true }); }}
              />
              {registrationIssue && <RegistrationAlert code={registrationIssue} onSponsored={() => {
                form.setValue("promotionChoice", "highlight", { shouldDirty: true, shouldValidate: true });
                setRegistrationIssue(null);
              }} />}
              {form.watch("promotionChoice") === "highlight" && !eventImage && !form.watch("eventImageUrl") && (
                <p className="text-sm text-muted-foreground">Ao finalizar, seu flyer será preparado com os dados revisados para baixar e divulgar no Instagram ou WhatsApp. O evento continua sujeito à revisão da equipe.</p>
              )}
            </div>
          )}

          <FormNavigation
            isFirst={currentStep === 1}
            isLast={currentStep >= steps.length}
            submitting={submitting}
            blocked={attractionSchedule.hasConflict}
            multiple={form.watch("additionalEvents").length > 0}
            onBack={() => { setCurrentStep(prev => Math.max(prev - 1, 1)); window.scrollTo(0, 0); }}
            onNext={nextStep}
          />
        </form>
      </Form>
      <SubmitReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        image={eventImage ?? (typeof form.watch("eventImageUrl") === "string" ? (form.watch("eventImageUrl") as string) : null) ?? null}
        events={[form.watch(), ...form.watch("additionalEvents")].map((ev) => ({ title: ev.eventTitle || "", date: String(ev.date || ""), startTime: ev.startTime || "", endTime: ev.endTime || "" }))}
        location={form.watch("locationName") || ""}
        neighborhood={form.watch("addressNeighborhood") || ""}
        submitting={submitting}
        onConfirm={() => {
          reviewConfirmedRef.current = true;
          setReviewOpen(false);
          void form.handleSubmit(onSubmit, onInvalid)();
        }}
      />
    </div>
  );
}
