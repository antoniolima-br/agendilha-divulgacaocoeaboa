import { useState, useEffect, memo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useProfile } from "@/hooks/useProfile";
import { Music, Bell, Check, ChevronsUpDown, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const genres = [
  { id: "Samba", label: "Samba / Pagode" },
  { id: "Rock", label: "Rock" },
  { id: "MPB", label: "MPB" },
  { id: "Eletrônica", label: "Eletrônica" },
  { id: "Funk", label: "Funk" },
  { id: "Sertanejo", label: "Sertanejo" },
  { id: "Jazz", label: "Jazz / Blues" },
  { id: "Pop", label: "Pop" },
];

const neighborhoods: string[] = [];

interface PersonalizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PersonalizationDialog = memo(function PersonalizationDialog({ open, onOpenChange }: PersonalizationDialogProps) {
  const { profile, saveProfile } = useProfile();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [homeLocation, setHomeLocation] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [frequency, setFrequency] = useState("weekly");
  const [genresOpen, setGenresOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setSelectedGenres(profile.musical_preferences || []);
      setHomeLocation(profile.home_location || "");
      setPushEnabled(profile.push_notifications_enabled || false);
      setEmailEnabled(profile.email_notifications_enabled || false);
      setFrequency(profile.notification_frequency || "weekly");
    }
  }, [profile]);

  const handleSave = async () => {
    await saveProfile({
      musical_preferences: selectedGenres,
      home_location: homeLocation,
      push_notifications_enabled: pushEnabled,
      email_notifications_enabled: emailEnabled,
      notification_frequency: frequency,
    });
    onOpenChange(false);
  };

  const toggleGenre = (id: string) => {
    setSelectedGenres(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-background/95 backdrop-blur-md">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-2xl font-black font-display text-primary flex items-center gap-2">
            <Settings2 className="h-6 w-6 text-secondary" />
            Personalizar Experiência
          </SheetTitle>
          <SheetDescription className="text-muted-foreground font-medium">
            Ajuste suas preferências para receber recomendações e notificações personalizadas.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-10 py-4">

          {/* Estilos Musicais */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-secondary flex items-center gap-2">
              <Music className="h-4 w-4" />
              Estilos Musicais
            </h3>
            <div className="rounded-lg border border-border/80 bg-card p-3 shadow-card transition-[border-color,box-shadow] duration-200 focus-within:border-primary/40 focus-within:shadow-elevated">
              <Popover open={genresOpen} onOpenChange={setGenresOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={genresOpen}
                    className="h-11 w-full justify-between border-0 bg-transparent px-3 font-medium shadow-none hover:bg-muted/50"
                  >
                    <span className={cn("truncate", selectedGenres.length === 0 && "text-muted-foreground")}>
                      {selectedGenres.length === 0
                        ? "Escolha seus estilos"
                        : `${selectedGenres.length} ${selectedGenres.length === 1 ? "estilo selecionado" : "estilos selecionados"}`}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={8}>
                  <Command>
                    <CommandInput placeholder="Buscar estilo..." />
                    <CommandList>
                      <CommandEmpty>Nenhum estilo encontrado.</CommandEmpty>
                      <CommandGroup className="p-2">
                        {genres.map((genre) => {
                          const selected = selectedGenres.includes(genre.id);
                          return (
                            <CommandItem
                              key={genre.id}
                              value={genre.label}
                              onSelect={() => toggleGenre(genre.id)}
                              className="mb-1 min-h-10 cursor-pointer rounded-md px-3 transition-colors last:mb-0"
                            >
                              <span className={cn(
                                "mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                                selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                              )}>
                                {selected && <Check className="h-3.5 w-3.5" />}
                              </span>
                              <span className="flex-1">{genre.label}</span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

            </div>
          </div>

          {/* Notificações */}
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-secondary flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações Inteligentes
            </h3>
            
            <div className="space-y-4 rounded-lg border border-border/70 bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">Alertas diretos no celular</p>
                </div>
                <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
              </div>
              
              <div className="flex items-center justify-between border-t border-border/50 pt-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Resumo por WhatsApp</Label>
                  <p className="text-xs text-muted-foreground">Agenda completa no seu WhatsApp</p>
                </div>
                <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
              </div>

              <div className="space-y-2 border-t border-border/50 pt-4">
                <Label className="text-sm font-bold">Frequência</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="h-10 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diária</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-10 sm:justify-start">
          <Button 
            className="h-12 w-full font-bold shadow-elevated"
            onClick={handleSave}
          >
            Salvar Preferências
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});