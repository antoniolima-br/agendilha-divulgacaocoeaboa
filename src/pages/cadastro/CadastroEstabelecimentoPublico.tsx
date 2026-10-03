import { useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Store } from "lucide-react";
import { toast } from "sonner";
import { IntlPhoneInput } from "@/components/ui/IntlPhoneInput";
import { toE164, validateIntlPhone } from "@/lib/intlPhone";
import { submitPublicCadastro } from "@/lib/publicCadastro";
import { handleError } from "@/lib/error-handler";
import { formatCep } from "@/lib/autofillValidation";
import { CepAddressSearch } from "@/components/estabelecimentos/CepAddressSearch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TIPOS = [
  { value: "Bar", label: "Bar" },
  { value: "Restaurante", label: "Restaurante" },
  { value: "Casa de eventos", label: "Casa de eventos" },
  { value: "Quiosque", label: "Quiosque" },
  { value: "Outro", label: "Outro tipo" },
];

/**
 * Formulário público de estabelecimento (link enviado pelo administrador).
 * Sem login: o cadastro entra como "aguardando análise" e não pode ser editado depois.
 */
export default function CadastroEstabelecimentoPublico() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepMessage, setCepMessage] = useState("");
  const cepRequest = useRef(0);
  const [form, setForm] = useState({
    nome: "",
    tipo: "",
    tipoOutro: "",
    endereco: "",
    numero: "",
    bairro: "",
    cep: "",
    responsavelNome: "",
    whatsapp: "",
    email: "",
    social: "",
    observacoes: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleCepChange = async (rawCep: string) => {
    const formatted = formatCep(rawCep);
    const digits = formatted.replace(/\D/g, "");
    set("cep", formatted);
    setCepMessage("");

    const requestId = ++cepRequest.current;
    if (digits.length !== 8) {
      setCepLoading(false);
      return;
    }

    setCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!response.ok) throw new Error("Não foi possível consultar o CEP");
      const data: { erro?: boolean; logradouro?: string; bairro?: string } = await response.json();
      if (requestId !== cepRequest.current) return;

      if (data.erro) {
        setCepMessage("CEP não encontrado. Você pode preencher o endereço manualmente.");
        return;
      }

      setForm((current) => ({
        ...current,
        cep: formatted,
        endereco: data.logradouro?.trim() || current.endereco,
        bairro: data.bairro?.trim() || current.bairro,
      }));
      setCepMessage("Endereço encontrado. Confira e complete os demais dados.");
    } catch {
      if (requestId === cepRequest.current) {
        setCepMessage("Não rolou buscar agora. Você pode preencher o endereço manualmente.");
      }
    } finally {
      if (requestId === cepRequest.current) setCepLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error("Informe o nome do estabelecimento.");
    if (!form.tipo) return toast.error("Escolha o tipo do estabelecimento.");
    if (form.tipo === "Outro" && !form.tipoOutro.trim()) return toast.error("Diga qual é o tipo.");
    if (!form.endereco.trim()) return toast.error("Informe o endereço.");
    const hasPhone = !!toE164(form.whatsapp);
    if (hasPhone && validateIntlPhone(form.whatsapp))
      return toast.error("Confira o WhatsApp ou deixe o campo vazio.");

    setLoading(true);
    try {
      await submitPublicCadastro("estabelecimento", {
        ...form,
        whatsapp: hasPhone ? toE164(form.whatsapp) ?? "" : "",
        tipo: form.tipo === "Outro" ? form.tipoOutro : form.tipo,
      });
      setSent(true);
      window.scrollTo(0, 0);
    } catch (err) {
      handleError(err, {
        context: "CadastroEstabelecimentoPublico",
        fallback: "Não deu pra enviar o cadastro.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full p-8 text-center space-y-4 rounded-3xl">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-bold">Cadastro enviado!</h1>
          <p className="text-muted-foreground text-sm">
            Recebemos os dados de <strong>{form.nome}</strong>. A equipe vai conferir tudo. Se precisar
            mudar alguma informação, fala com quem te mandou esse link.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 max-w-lg mx-auto [&_input::placeholder]:text-muted-foreground [&_textarea::placeholder]:text-muted-foreground">
      <Helmet>
        <title>Cadastro de estabelecimento | Coé a Boa?</title>
        <meta
          name="description"
          content="Cadastre seu bar, restaurante ou casa de eventos para entrar na agenda do Coé a Boa?."
        />
      </Helmet>

      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Store className="h-6 w-6" /> Cadastro de estabelecimento
        </h1>
        <p className="text-sm text-muted-foreground">
          Preencha só o essencial. É rapidinho e a equipe cuida do resto.
        </p>
      </header>

      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome do estabelecimento *</Label>
          <Input id="nome" className="h-12 text-base" value={form.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Bar do Zé" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cep">CEP</Label>
          <Input
            id="cep"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={9}
            className="h-12 text-base"
            value={form.cep}
            onChange={(e) => void handleCepChange(e.target.value)}
            placeholder="00000-000"
          />
          <CepAddressSearch
            onCepFound={(cep) => {
              set("cep", cep);
              setCepMessage("CEP encontrado. Confira antes de enviar.");
            }}
          />
          {(cepLoading || cepMessage) && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {cepLoading ? "Buscando endereço..." : cepMessage}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de estabelecimento *</Label>
          <Select value={form.tipo} onValueChange={(value) => set("tipo", value)}>
            <SelectTrigger id="tipo" className="h-12 text-base">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS.map((tipo) => (
                <SelectItem key={tipo.value} value={tipo.value} className="text-base">
                  {tipo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {form.tipo === "Outro" && (
          <div className="space-y-2">
            <Label htmlFor="tipoOutro">Qual tipo? *</Label>
            <Input id="tipoOutro" className="h-12 text-base" value={form.tipoOutro} onChange={(e) => set("tipoOutro", e.target.value)} placeholder="Ex.: Quiosque, Clube" />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="endereco">Endereço (rua) *</Label>
          <Input id="endereco" className="h-12 text-base" value={form.endereco} onChange={(e) => set("endereco", e.target.value)} placeholder="Rua / Avenida" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numero">Número</Label>
          <Input
            id="numero"
            className="h-12 text-base"
            value={form.numero}
            onChange={(e) => set("numero", e.target.value)}
            placeholder="Ex.: 120, sala 2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bairro">Bairro / região</Label>
          <Input id="bairro" className="h-12 text-base" value={form.bairro} onChange={(e) => set("bairro", e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsavelNome">Contato (nome do responsável) *</Label>
          <Input id="responsavelNome" name="name" autoComplete="name" className="h-12 text-base" value={form.responsavelNome} onChange={(e) => set("responsavelNome", e.target.value)} placeholder="Quem responde pelo local" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
          <IntlPhoneInput id="whatsapp" className="text-base" value={form.whatsapp} onChange={(v) => set("whatsapp", v)} />
          <p className="text-xs text-muted-foreground">Se informar, use DDD + número.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail (opcional)</Label>
          <Input id="email" name="email" autoComplete="email" type="email" className="h-12 text-base" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contato@exemplo.com" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="social">Instagram ou link (opcional)</Label>
          <Input id="social" className="h-12 text-base" value={form.social} onChange={(e) => set("social", e.target.value)} placeholder="@seuperfil" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Alguma observação (opcional)</Label>
          <Textarea id="observacoes" rows={3} value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} placeholder="Horário de funcionamento, dias de música ao vivo..." />
        </div>

        <Button type="submit" disabled={loading} className="w-full h-12 font-bold gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enviar cadastro
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Depois do envio, os dados ficam com a equipe para conferência.
        </p>
      </form>
    </main>
  );
}
