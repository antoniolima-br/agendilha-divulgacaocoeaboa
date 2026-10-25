import { formatEventAddress, ShareableEvent, buildEventShareText } from "./event-utils";

export type Event = ShareableEvent;

export function buildFullAddress(ev: ShareableEvent): string {
  return formatEventAddress(ev);
}

export const getShareUrl = (eventId?: string) => {
  const base = `${window.location.origin}/agenda`;
  return eventId ? `${base}?event=${eventId}` : base;
};

export const getEventOgShareUrl = (slug: string) => {
  const projectRef = import.meta.env?.VITE_SUPABASE_PROJECT_ID || "xwuyzqahfoyhdbmtspwf";
  return `https://${projectRef}.supabase.co/functions/v1/evento-og?slug=${encodeURIComponent(slug)}`;
};

export const getShareData = (ev?: ShareableEvent) => {
  const isAgenda = !ev;
  const eventTitle = ev?.event_title || "Evento";
  const title = isAgenda ? "Agenda Cultural do Rio" : `Evento: ${eventTitle}`;
  const url = getShareUrl(ev?.id);
  
  if (!ev) {
    return {
      title,
      text: "🌴 *Confira a Agenda Cultural do Rio de Janeiro!* 🌴\n\nVeja a programação completa e atualizada em:",
      url
    };
  }

  const text = buildEventShareText(ev, { 
    url: "Veja os detalhes no Coé a Boa?:",
  });

  return { title, text, url };
};
