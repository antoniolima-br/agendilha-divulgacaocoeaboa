import { z } from "zod";
import { validateIntlPhone, toE164 } from "@/lib/intlPhone";
import { validateBrazilianMobile } from "@/lib/whatsapp";
import { findDuplicateEventStart } from "./eventBatchValidation";

export const additionalEventSchema = z.object({
  eventTitle: z.string().trim().max(120).optional().or(z.literal("")),
  date: z.string().trim().min(1, "Selecione a data"),
  startTime: z.string().trim().min(1, "Informe o horário de início"),
  endTime: z.string().trim().optional(),
  atrativoName: z.string().trim().min(1, "Informe a atração"),
  category: z.string().trim().max(80).optional(),
  ageRating: z.enum(["Livre", "10+", "12+", "14+", "16+", "18+"]).default("Livre"),
  description: z.string().trim().max(500).optional(),
});

export const submissionFormSchema = z.object({
  promotionChoice: z.enum(["free", "highlight"], {
    required_error: "Escolha como você quer divulgar o evento",
  }),
  imageSource: z.enum(["upload", "ai"]).optional(),
  selectedTemplate: z.string().optional(),
  aiTitle: z.string().optional(),
  aiSubtitle: z.string().optional(),
  aiVariant: z.enum(["modern", "vibrant", "elegant"]).optional(),
  eventImageUrl: z.string().optional(),
  eventImageUrlStory: z.string().optional(),
  eventImageUrlWhatsapp: z.string().optional(),
  fotos: z.array(z.string().url()).default([]),
  // Atrativos adicionais do mesmo evento (o principal continua nos campos atrativo*).
  extraAtrativos: z
    .array(
      z.object({
        name: z.string().trim().max(120).default(""),
        category: z.string().trim().max(80).optional(),
        whatsapp: z.string().trim().max(20).optional(),
      }),
    )
    .default([]),
  additionalEvents: z.array(additionalEventSchema).max(10, "Você pode enviar até 10 eventos por vez").default([]),
  
  nickName: z.string().trim().max(50).optional().or(z.literal("")),
  basicPhone: z.string().trim().optional().superRefine((val, ctx) => {
    if (!val) return;
    const reason = validateIntlPhone(val);
    if (reason) ctx.addIssue({ code: z.ZodIssueCode.custom, message: reason });
  }),

  companyName: z.string().trim().max(100).optional(),
  email: z.string().trim().email("E-mail inválido").max(255).optional().or(z.literal("")),
  addressZip: z.string().trim().optional(),
  addressStreet: z.string().trim().optional(),
  addressNumber: z.string().trim().optional(),

  legalAcceptance: z.literal(true, {
    errorMap: () => ({ message: "Você precisa aceitar os termos para continuar" }),
  }),
  // Novo modelo (Fase 7): "Responsável pelo evento".
  // Substitui o antigo seletor promotor/atrativo/estabelecimento.
  responsavelNome: z.string().trim().max(100).optional().or(z.literal("")),
  usarMeuWhatsapp: z.boolean().default(true),
  // duvidasWhatsapp = WhatsApp do responsável (mantivemos o nome do campo p/ compat com backend).
  duvidasWhatsapp: z.string().trim().optional().superRefine((val, ctx) => {
    if (!val) return;
    const v = validateBrazilianMobile(val);
    if (v.valid === false) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: v.reason });
    }
  }).default(""),
  // Campo legado — mantido em 'promotor' pra compat com telas antigas.
  duvidasSource: z.enum(["promotor", "atrativo", "estabelecimento"]).default("promotor"),
  duvidasAuthorized: z.boolean().default(false),
  // Caracterização opcional do responsável (reaproveitada em divulgações futuras).
  tipoResponsavel: z.enum(["artista", "estabelecimento", "produtor", "outro"]).optional(),
  perfilNomeArtistico: z.string().trim().max(120).optional(),
  perfilEstiloMusical: z.string().trim().max(120).optional(),
  perfilLinkPrincipal: z.string().trim().max(300).optional(),
  perfilNomeEstabelecimento: z.string().trim().max(120).optional(),
  perfilCategoriaLocal: z.string().trim().max(80).optional(),
  perfilEnderecoResumido: z.string().trim().max(200).optional(),
  duvidasWhatsappOutro: z.string().trim().optional(),

  category: z.string().trim().optional(),
  eventTitle: z.string().trim().optional().or(z.literal("")).or(z.null()),
  date: z.string().trim().min(1, "Selecione a data"),
  startTime: z.string().trim().min(1, "Campo obrigatório"),
  endTime: z.string().trim().optional(),
  
  atrativoName: z.string().trim().min(1, "Atrativo é obrigatório"),
  atrativoType: z.string().trim().optional(),
  atrativoStyle: z.string().trim().optional(),
  atrativoDescription: z.string().trim().max(500).optional(),
  atrativoOpeningHours: z.string().trim().max(300).optional(),
  atrativoContact: z.string().trim().optional().superRefine((val, ctx) => {
    if (!val || !toE164(val)) return;
    const err = validateIntlPhone(val);
    if (err) ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
  }),
  atrativoEmail: z.string().trim().email("E-mail inválido").optional().or(z.literal("")).or(z.null()),
  atrativoCategory: z.string().trim().optional().or(z.literal("")),
  atrativoCategoryOther: z.string().trim().optional(),
  // Vínculo com cadastro externo (snapshot: draft NÃO segue mudanças posteriores do perfil)
  atrativoSourceId: z.string().uuid("Selecione um atrativo da lista").optional().or(z.literal("")),
  atrativoSourceType: z.enum(["artist", "atrativo"]).optional(),
  atrativoLinkedAt: z.string().optional(),
  atrativoLinkedName: z.string().optional(),

  locationName: z.string().trim().optional().or(z.literal("")),
  estabelecimentoId: z.string().uuid().optional().or(z.literal("")),
  eventAddress: z.string().trim().optional().or(z.literal("")),
  locationType: z.enum(["public", "commercial"]).optional(),
  locationContact: z.string().trim().optional().superRefine((val, ctx) => {
    if (!val) return;
    const v = validateBrazilianMobile(val);
    if (v.valid === false) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: v.reason });
    }
  }),
  locationCep: z.string().trim().optional().superRefine((val, ctx) => {
    if (!val) return;
    const d = val.replace(/\D/g, "");
    if (d.length !== 8) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CEP precisa ter 8 dígitos" });
    }
  }),
  localTipo: z.string().trim().optional(),

  description: z.string().trim().max(500).optional(),
  contactSocial: z.string().trim().max(300).optional(),
  videoLink: z.string().url("URL inválida").optional().or(z.literal("")),
  additionalDetails: z.string().trim().optional(),
  stage: z.string().optional(),
  responsiblePerson: z.string().trim().optional(),
  addressNeighborhood: z.string().trim().max(100).optional().or(z.literal("")),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  ageRating: z.enum(["Livre", "10+", "12+", "14+", "16+", "18+"]).default("Livre"),
  isSuitableForMinors: z.boolean().default(true),
}).superRefine((data, ctx) => {
  // Se "Outro" for selecionado em tipoResponsavel, o telefone deve estar no formato correto.
  // A validação padrão do campo já cobre o fluxo normal; aqui tratamos apenas o caso especial.
  if (data.tipoResponsavel === "outro" && data.duvidasWhatsapp?.trim()) {
    const outroPhone = (data.duvidasWhatsapp as string || "").trim();
    if (outroPhone) {
      // Validação não-estrita para o modo "Outro"
      const vOutro = validateBrazilianMobile(outroPhone, false);
      if (vOutro.valid === false) {
        ctx.addIssue({ 
          code: z.ZodIssueCode.custom, 
          path: ["duvidasWhatsapp"], 
          message: vOutro.reason
        });
      }
    }
  }

  const duplicateStarts = findDuplicateEventStart([
    { date: data.date, startTime: data.startTime },
    ...data.additionalEvents.map((event) => ({ date: event.date, startTime: event.startTime })),
  ]);
  duplicateStarts.forEach((eventIndex) => {
    if (eventIndex === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startTime"],
        message: "Use um horário de início diferente para cada evento nesta data",
      });
      return;
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["additionalEvents", eventIndex - 1, "startTime"],
      message: "Use um horário de início diferente para cada evento nesta data",
    });
  });
});

export type SubmissionFormData = z.infer<typeof submissionFormSchema>;

