export type GuideEvent = {
  id: string | null;
  event_title: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address_street: string | null;
  address_number: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string | null;
  description: string | null;
  slug: string | null;
  is_highlight: boolean | null;
};

export type GuideEstablishment = {
  nome: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cep: string | null;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizePlaceKey(value: unknown): string {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

export function resolveEstablishment(
  event: GuideEvent,
  establishments: GuideEstablishment[],
): GuideEstablishment | undefined {
  const locationKey = normalizePlaceKey(event.location);
  if (!locationKey) return undefined;
  return establishments.find((place) => normalizePlaceKey(place.nome) === locationKey);
}

export function buildGuideAddress(event: GuideEvent, establishment?: GuideEstablishment): string {
  const street = clean(establishment?.endereco) || clean(event.address_street);
  const number = clean(establishment?.numero) || clean(event.address_number);
  const neighborhood = clean(establishment?.bairro) || clean(event.address_neighborhood);
  const city = clean(event.address_city) || "Rio de Janeiro";
  const state = clean(event.address_state) || "RJ";
  const zip = clean(establishment?.cep) || clean(event.address_zip);
  const streetWithNumber = [street, number].filter(Boolean).join(", ");
  return [streetWithNumber, neighborhood, city, state, zip].filter(Boolean).join(" - ");
}

export function buildGuideUberLink(event: GuideEvent, address: string): string {
  const params = new URLSearchParams({ action: "setPickup", pickup: "my_location" });
  const location = clean(event.location) || clean(event.event_title) || "Evento";
  params.set("dropoff[nickname]", location);
  params.set("dropoff[formatted_address]", address || location);
  if (typeof event.latitude === "number" && typeof event.longitude === "number") {
    params.set("dropoff[latitude]", String(event.latitude));
    params.set("dropoff[longitude]", String(event.longitude));
  }
  return `https://m.uber.com/ul/?${params.toString()}`;
}

export function buildGuideAgenda(events: GuideEvent[], establishments: GuideEstablishment[]): string {
  return events
    .map((event) => {
      const establishment = resolveEstablishment(event, establishments);
      const placeName = clean(establishment?.nome) || clean(event.location) || "Local a confirmar";
      const address = buildGuideAddress(event, establishment);
      const uberLink = buildGuideUberLink(event, address);
      const eventLink = `/evento/${clean(event.slug) || clean(event.id)}`;
      const time = clean(event.start_time).slice(0, 5);
      const endTime = clean(event.end_time).slice(0, 5);
      const timeLabel = [time, endTime].filter(Boolean).join("–");

      return [
        event.is_highlight ? "⭐ DESTAQUE" : "",
        clean(event.event_title) || "Rolê sem título",
        [clean(event.date).slice(0, 10), timeLabel].filter(Boolean).join(" "),
        placeName,
        address,
        clean(event.category),
        `ver rolê: ${eventLink}`,
        `Vá de Uber: ${uberLink}`,
        clean(event.description).slice(0, 160),
      ].filter(Boolean).join(" | ");
    })
    .join("\n");
}