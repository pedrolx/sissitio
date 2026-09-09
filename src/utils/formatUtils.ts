export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00';
  const num = Number(value);
  if (isNaN(num)) return 'R$ 0,00';
  const fixed = num.toFixed(2);
  const parts = fixed.split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${integerPart},${parts[1]}`;
}