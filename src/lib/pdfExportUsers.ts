import { formatPhoneDisplay } from "@/lib/whatsapp";
import { INSTITUTIONAL } from "./institutional";

export interface UserPdfRow {
  responsible_name: string | null;
  email: string | null;
  phone: string | null;
  user_type?: string | null;
  status?: string | null;
  created_at: string;
}

function formatPhone(phone: string | null): string {
  if (!phone) return "Não informado";
  return formatPhoneDisplay(phone);
}

/** Exporta relatório de usuários em PDF com import dinâmico de jspdf. */
export async function exportUsersToPdf(users: UserPdfRow[]): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  const columns = ["Nome", "Email", "Telefone", "Tipo", "Status", "Criado em"];
  const rows = users.map((u) => [
    u.responsible_name || "N/A",
    u.email || "N/A",
    formatPhone(u.phone),
    u.user_type || "usuario",
    u.status || "user",
    new Date(u.created_at).toLocaleDateString("pt-BR"),
  ]);

  doc.text("Relatório de Usuários - Coé a Boa?", 14, 15);
  autoTable(doc, { head: [columns], body: rows, startY: 20, margin: { bottom: 20 }, didDrawPage: () => {
    doc.setFontSize(6);
    doc.text(`${INSTITUTIONAL.ownership} ${INSTITUTIONAL.creation}`, 14, doc.internal.pageSize.getHeight() - 9, { maxWidth: 182 });
  } });
  doc.save(`usuarios_agendilha_${new Date().toISOString().split("T")[0]}.pdf`);
}