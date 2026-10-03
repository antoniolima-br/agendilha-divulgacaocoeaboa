import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCep } from "@/lib/autofillValidation";

type ViaCepAddress = {
  cep?: string;
  bairro?: string;
};

interface CepAddressSearchProps {
  onCepFound: (cep: string) => void;
}

export function CepAddressSearch({ onCepFound }: CepAddressSearchProps) {
  const id = useId().replace(/:/g, "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [address, setAddress] = useState({
    estado: "RJ",
    cidade: "Rio de Janeiro",
    bairro: "",
    rua: "",
  });

  async function search() {
    const estado = address.estado.trim().toUpperCase();
    const cidade = address.cidade.trim();
    const rua = address.rua.trim();
    const bairro = address.bairro.trim().toLocaleLowerCase("pt-BR");

    if (estado.length !== 2 || cidade.length < 3 || rua.length < 3) {
      setMessage("Preencha Estado, Cidade e Nome da Rua para buscar.");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${encodeURIComponent(estado)}/${encodeURIComponent(cidade)}/${encodeURIComponent(rua)}/json/`,
      );
      if (!response.ok) throw new Error("Não foi possível consultar o endereço");

      const results: ViaCepAddress[] = await response.json();
      const preferred = bairro
        ? results.find((result) => result.bairro?.trim().toLocaleLowerCase("pt-BR") === bairro)
        : results[0];
      const result = preferred ?? results[0];

      if (!result?.cep) {
        setMessage("Não encontramos um CEP. Confira os dados e tente novamente.");
        return;
      }

      onCepFound(formatCep(result.cep));
      setOpen(false);
      setMessage("");
    } catch {
      setMessage("Não rolou buscar agora. Tente novamente ou preencha o CEP manualmente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="link"
        className="h-auto px-0 py-0 text-sm"
        aria-expanded={open}
        aria-controls={`${id}-buscar-cep`}
        onClick={() => {
          setOpen((current) => !current);
          setMessage("");
        }}
      >
        Não sei o CEP
      </Button>

      {open && (
        <div id={`${id}-buscar-cep`} className="space-y-3 rounded-md border border-border bg-card p-3">
          <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-estado`}>Estado</Label>
              <Input
                id={`${id}-estado`}
                maxLength={2}
                autoComplete="address-level1"
                value={address.estado}
                onChange={(event) =>
                  setAddress((current) => ({ ...current, estado: event.target.value.toUpperCase() }))
                }
                placeholder="RJ"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-cidade`}>Cidade</Label>
              <Input
                id={`${id}-cidade`}
                autoComplete="address-level2"
                value={address.cidade}
                onChange={(event) => setAddress((current) => ({ ...current, cidade: event.target.value }))}
                placeholder="Rio de Janeiro"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-bairro`}>Bairro</Label>
            <Input
              id={`${id}-bairro`}
              autoComplete="address-level3"
              value={address.bairro}
              onChange={(event) => setAddress((current) => ({ ...current, bairro: event.target.value }))}
              placeholder="Ex.: Copacabana"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-rua`}>Nome da Rua</Label>
            <Input
              id={`${id}-rua`}
              autoComplete="address-line1"
              value={address.rua}
              onChange={(event) => setAddress((current) => ({ ...current, rua: event.target.value }))}
              placeholder="Ex.: Avenida Atlântica"
            />
          </div>
          {message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={() => void search()} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Buscando..." : "Buscar CEP"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}