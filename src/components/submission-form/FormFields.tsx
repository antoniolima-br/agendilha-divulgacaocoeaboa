import { fetchCepAddress, type ViaCepData } from "@/data/cep";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useRef, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";


export function CepField({ control, onCepFound }: { control: any; onCepFound: (data: ViaCepData) => void }) {
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const onFound = useRef(onCepFound);
  onFound.current = onCepFound;
  useEffect(() => () => request.current?.abort(), []);

  const fetchCep = useCallback(async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    request.current?.abort();
    request.current = null;
    setLookupError(null);
    if (clean.length !== 8) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    try {
      const data = await fetchCepAddress(clean, { signal: controller.signal });
      if (controller.signal.aborted || request.current !== controller) return;
      if (data.erro) setLookupError("CEP não encontrado. Confira o número ou preencha o endereço.");
      else onFound.current(data);
    } catch {
      if (!controller.signal.aborted && request.current === controller) {
        setLookupError("Não consegui buscar o CEP. Você pode preencher o endereço.");
      }
    } finally {
      if (!controller.signal.aborted && request.current === controller) setLoading(false);
    }
  }, []);

  return (
    <FormField
      control={control}
      name="addressZip"
      render={({ field }) => (
        <FormItem>
          <FormLabel>CEP</FormLabel>
          <FormControl>
            <Input
              {...field}
              inputMode="numeric"
              placeholder="00000-000"
              className="h-12 text-base"
              onChange={(e) => {
                field.onChange(e);
                fetchCep(e.target.value);
              }}
            />
          </FormControl>
          {loading && <p className="text-xs text-muted-foreground">Buscando endereço...</p>}
          {lookupError && <p role="status" className="text-xs text-muted-foreground">{lookupError}</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface FileUploadProps {
  label: string;
  accept: string;
  file: File | string | null;
  onFileChange: (file: File | null) => void;
  required?: boolean;
}

export function FileUpload({ label, accept, file, onFileChange, required }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileName = file instanceof File ? file.name : (typeof file === 'string' ? 'Arquivo enviado' : null);

  return (
    <div className="space-y-2">
      <Label className="font-medium text-foreground">
        {label} {required && <span className="text-accent">*</span>}
      </Label>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-3 sm:px-4 py-6 sm:py-8 cursor-pointer transition-all hover:border-primary/60 hover:bg-primary/10 active:scale-[0.98] min-h-[72px]"
      >
        <Upload className="h-6 w-6 text-primary/60" />
        {file ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate max-w-[200px]">{fileName}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remover arquivo"
              onClick={(e) => { e.stopPropagation(); if (inputRef.current) inputRef.current.value = ""; onFileChange(null); }}
              className="rounded-full p-1.5 hover:bg-muted active:bg-muted/80 min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground text-center">Toque para enviar ({accept})</span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
              e.target.value = "";
              toast.error("Arquivo muito grande", { description: "O limite é de 5MB" });
              return;
            }
            onFileChange(selectedFile || null);
          }}

        />
      </div>
    </div>
  );
}
