export function formatPriceBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDurationDays(days: number): string {
  return days === 1 ? "1 dia" : `${days} dias`;
}