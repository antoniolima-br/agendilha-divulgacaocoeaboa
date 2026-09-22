import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, MapPin, Pencil, Trash2, Loader2 } from "lucide-react";
import { LoadingState } from "@/components/ui/LoadingState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SuggestInput } from "@/components/ui/SuggestInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { handleError } from "@/lib/error-handler";
import { SectionErrorBoundary } from "@/components/errors/SectionErrorBoundary";
import { PromotorBadge } from "@/components/promotor/PromotorBadge";
import { useProfile } from "@/hooks/useProfile";
import { PhotoGallery } from "@/components/media/PhotoGallery";
import { ROUTES } from "@/routes/config";
import {
  useMyEstabelecimentos,
  useUpsertEstabelecimento,
  useDeleteEstabelecimento,
  type EstabelecimentoRow,
} from "@/data/useEstabelecimentos";

type Estab = EstabelecimentoRow;

const TIPOS_ESTAB = [
  "Bar", "Restaurante", "Casa de show", "Quiosque",
  "Centro cultural", "Igreja", "Praça", "Clube", "Outro",
];

const empty = {
  nome: "",
  endereco: "",
  bairro: "",
  tipo: "",
  contato: "",
  tipos: [] as string[],
  anotacoes: "",
  temCnpj: false,
  cnpj: "",
  responsavel_nome: "",
  responsavel_telefone: "",
  responsavel_email: "",
  responsavel_redes: "",
  fotos: [] as string[],
};

export default function PromotorEstabelecimentos() {
  return (
    <SectionErrorBoundary context="PromotorEstabelecimentos">
      <PromotorEstabelecimentosInner />
    </SectionErrorBoundary>
  );
}

function PromotorEstabelecimentosInner() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { data: items = [], isLoading: loading } = useMyEstabelecimentos(user?.id);
  const upsert = useUpsertEstabelecimento();
  const remove_ = useDeleteEstabelecimento();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...empty });
  const saving = upsert.isPending;

  const reset = () => {
    setEditing(null);
    setForm({
      ...empty,
      responsavel_nome: profile?.responsible_name || "",
      responsavel_telefone: profile?.phone || "",
      responsavel_email: profile?.email || "",
    });
  };

  const startEdit = (e: Estab) => {
    setEditing(e.id);
    setForm({
      nome: e.nome ?? "",
      endereco: e.endereco ?? "",
      bairro: e.bairro ?? "",
      tipo: e.tipo ?? "",
      contato: e.contato ?? "",
      tipos: e.tipos ?? [],
      anotacoes: e.anotacoes ?? "",
      temCnpj: !!e.cnpj,
      cnpj: e.cnpj ?? "",
      responsavel_nome: e.responsavel_nome ?? "",
      responsavel_telefone: e.responsavel_telefone ?? "",
      responsavel_email: e.responsavel_email ?? "",
      responsavel_redes: e.responsavel_redes ?? "",
      fotos: e.fotos ?? [],
    });
  };

  const save = async () => {
    if (!user) return;
    if (!form.nome.trim()) {
      toast.error("Informe o nome do estabelecimento.");
      return;
    }
    try {
      const commonPatch = {
        tipos: form.tipos.length ? form.tipos : null,
        anotacoes: form.anotacoes || null,
        cnpj: form.temCnpj && form.cnpj ? form.cnpj : null,
        responsavel_nome: form.responsavel_nome || null,
        responsavel_telefone: form.responsavel_telefone || null,
        responsavel_email: form.responsavel_email || null,
        responsavel_redes: form.responsavel_redes || null,
        fotos: form.fotos,
      };
      if (editing) {
        await upsert.mutateAsync({
          id: editing,
          payload: {
            nome: form.nome.trim(),
            endereco: form.endereco || null,
            bairro: form.bairro || null,
            tipo: form.tipo || null,
            contato: form.contato || null,
            ...commonPatch,
          },
        });
        toast.success("Estabelecimento atualizado.");
      } else {
        await upsert.mutateAsync({
          payload: {
            nome: form.nome.trim(),
            endereco: form.endereco || null,
            bairro: form.bairro || null,
            tipo: form.tipo || null,
            contato: form.contato || null,
            responsavel_id: user.id,
            created_by: user.id,
            ...commonPatch,
          },
        });
        toast.success("Estabelecimento cadastrado.");
      }
      reset();
    } catch (err) {
      handleError(err, "Não foi possível salvar");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este estabelecimento?")) return;
    try {
      await remove_.mutateAsync(id);
      toast.success("Removido.");
    } catch (err) {
      handleError(err, "Erro ao remover");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-12 sm:space-y-6">
      <div>
        <PromotorBadge />
        <SectionHeader
          className="mt-2 mb-0"
          title="Meus estabelecimentos"
          subtitle="Somente você pode editar os estabelecimentos cadastrados aqui."
          rightElement={
            <Link to={ROUTES.PROMOTOR_ATRATIVOS} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">Ir para Atrativos</Button>
            </Link>
          }
        />
      </div>

      <Card className="space-y-4 p-4 sm:p-5">
        <h2 className="font-bold text-lg">
          {editing ? "Editar estabelecimento" : "Novo estabelecimento"}
        </h2>

        {/* Bloco: Básico */}
        <div className="space-y-3">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Informações básicas</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Nome*"
              value={form.nome}
              onChange={(v) => setForm({ ...form, nome: v })}
              suggestFrom="estabelecimentos_public"
              suggestColumn="nome"
            />
            <Field
              label="Endereço"
              value={form.endereco}
              onChange={(v) => setForm({ ...form, endereco: v })}
              suggestFrom="estabelecimentos_public"
              suggestColumn="endereco"
              autoComplete="street-address"
            />
            <Field label="Bairro" value={form.bairro} onChange={(v) => setForm({ ...form, bairro: v })} autoComplete="address-level3" />
            <Field label="Contato do local (opcional)" value={form.contato} onChange={(v) => setForm({ ...form, contato: v })} placeholder="WhatsApp ou e-mail" autoComplete="off" />
          </div>
        </div>

        {/* Bloco: Tipos (multi) */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Tipo de estabelecimento</Label>
          <p className="text-xs text-muted-foreground">Toque em quantos combinarem.</p>
          <div className="flex flex-wrap gap-2">
            {TIPOS_ESTAB.map((t) => {
              const on = form.tipos.includes(t);
              return (
                <Badge
                  key={t}
                  variant="outline"
                  className={cn(
                    "inline-flex min-h-11 cursor-pointer items-center rounded-full px-3 py-2 transition-all md:min-h-0 md:py-1",
                    on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-primary/10"
                  )}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      tipos: on ? f.tipos.filter((x) => x !== t) : [...f.tipos, t],
                    }))
                  }
                >
                  {t}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Bloco: Responsável pelos contatos */}
        <div className="space-y-3">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Responsável pelos contatos</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nome" value={form.responsavel_nome} onChange={(v) => setForm({ ...form, responsavel_nome: v })} />
            <Field label="Telefone / WhatsApp (opcional)" value={form.responsavel_telefone} onChange={(v) => setForm({ ...form, responsavel_telefone: v })} />
            <Field label="E-mail" value={form.responsavel_email} onChange={(v) => setForm({ ...form, responsavel_email: v })} />
            <Field label="Redes sociais" value={form.responsavel_redes} onChange={(v) => setForm({ ...form, responsavel_redes: v })} placeholder="@instagram, Facebook…" />
          </div>
        </div>

        {/* Bloco: Extras */}
        <div className="space-y-3">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Extras (opcional)</p>
          <div className="flex min-h-11 items-center gap-3">
            <input
              id="temCnpj"
              type="checkbox"
              checked={form.temCnpj}
              onChange={(e) => setForm({ ...form, temCnpj: e.target.checked })}
              className="relative h-5 w-5 after:absolute after:-inset-3 after:content-['']"
            />
            <Label htmlFor="temCnpj" className="text-sm cursor-pointer">Tem CNPJ (pessoa jurídica)</Label>
          </div>
          {form.temCnpj && (
            <Field label="CNPJ" value={form.cnpj} onChange={(v) => setForm({ ...form, cnpj: v })} placeholder="00.000.000/0000-00" />
          )}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Anotações</Label>
            <Textarea
              value={form.anotacoes}
              onChange={(e) => setForm({ ...form, anotacoes: e.target.value })}
              placeholder="Observações internas sobre o lugar."
              rows={3}
            />
          </div>
        </div>

        {user && (
          <div className="space-y-3">
            <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider">Fotos</p>
            <PhotoGallery
              urls={form.fotos}
              onChange={(next) => setForm({ ...form, fotos: next })}
              kind="estabelecimentos"
              ownerUserId={user.id}
              targetId={editing}
              label="Fachada, logo e outras fotos"
              helper="Envie até 8 imagens. Elas aparecem na página do estabelecimento."
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 xs:grid-cols-2 sm:flex">
          <Button className="w-full sm:w-auto" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Salvar alterações" : (<><Plus className="h-4 w-4 mr-1" /> Cadastrar</>)}
          </Button>
          {editing && (
            <Button variant="ghost" className="w-full sm:w-auto" onClick={reset}>
              Cancelar
            </Button>
          )}
        </div>
      </Card>

      <div className="max-h-[65dvh] space-y-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-gutter:stable] md:max-h-[calc(100dvh-12rem)]">
        {loading ? (
          <LoadingState message="Carregando estabelecimentos..." />
        ) : items.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            Você ainda não cadastrou nenhum estabelecimento.
          </Card>
        ) : (
          items.map((e) => (
            <Card key={e.id} className="flex items-start gap-2 p-3 sm:gap-3 sm:p-4">
              <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{e.nome}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {[e.tipo, e.bairro, e.endereco].filter(Boolean).join(" · ") || "Sem detalhes"}
                </p>
                <div className="mt-1">
                  {e.is_approved ? (
                    <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-700">Aprovado</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-700">Aguardando aprovação</Badge>
                  )}
                </div>
              </div>
               <div className="flex shrink-0 flex-col gap-1 xs:flex-row">
                <Button size="icon" variant="ghost" onClick={() => startEdit(e)} aria-label="Editar">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(e.id)} aria-label="Remover">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  suggestFrom,
  suggestColumn,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suggestFrom?: string;
  suggestColumn?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold">{label}</Label>
      {suggestFrom && suggestColumn ? (
        <SuggestInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          suggestFrom={suggestFrom}
          suggestColumn={suggestColumn}
          autoComplete={autoComplete}
        />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} />
      )}
    </div>
  );
}