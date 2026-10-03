export type RoutableEvent = {
  location?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function eventLocationLabel(event: RoutableEvent): string {
  return [event.location, event.address_neighborhood].filter(Boolean).join(" · ") || "Local a confirmar";
}

export function eventMapsUrl(event: RoutableEvent): string | null {
  if (event.latitude != null && event.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`;
  }

  const address = [
    event.location,
    event.address_street,
    event.address_number,
    event.address_neighborhood,
    event.address_city,
    event.address_state,
  ].filter((part): part is string => typeof part === "string" && part.trim().length > 0);

  return address.length > 0
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.join(", "))}`
    : null;
}