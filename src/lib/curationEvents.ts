export type CurationEventForm = {
  id: string | null;
  title: string;
  date: string;
  startTime: string;
  registrationUrl: string;
  flyerUrl: string;
};

export type CurationEventLink = {
  id: string;
  slug: string | null;
  event_title: string | null;
  date: string | null;
  start_time: string | null;
};

export const emptyCurationEventForm = (): CurationEventForm => ({
  id: null,
  title: "",
  date: "",
  startTime: "",
  registrationUrl: "",
  flyerUrl: "",
});

export function validateCurationEventForm(form: CurationEventForm): string | null {
  if (!form.title.trim() || !form.date || !form.startTime) return "Informe nome, data e horário do rolê.";
  if (form.registrationUrl && !isSafeHttpsUrl(form.registrationUrl)) return "O link de inscrição precisa começar com https://";
  if (form.flyerUrl && !isSafeHttpsUrl(form.flyerUrl)) return "O link do flyer precisa começar com https://";
  return null;
}

function isSafeHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function curationEventLink(event: Pick<CurationEventLink, "id" | "slug">, origin = window.location.origin): string {
  return `${origin}/evento/${event.slug || event.id}`;
}

export function curationEventInvite(event: CurationEventLink, link = curationEventLink(event)): string {
  const title = event.event_title?.trim() || "Rolê";
  const date = event.date ? `\n📅 ${formatShareDate(event.date)}` : "";
  const time = event.start_time ? ` às ${event.start_time.slice(0, 5)}` : "";
  return `Bora nesse rolê?\n\n*${title}*${date}${time}\n\nVeja os detalhes: ${link}`;
}

function formatShareDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}