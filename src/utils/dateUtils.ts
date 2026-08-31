/**
 * Formata uma data para o padrão brasileiro (DD/MM/AAAA)
 * @param date - Data no formato Date, string ISO (YYYY-MM-DD) ou timestamp
 * @param showTime - Se true, inclui HH:mm
 * @returns String formatada (ex: 15/08/2025 ou 15/08/2025 14:30)
 */
export function formatDateBR(date: string | Date | null | undefined, showTime: boolean = false): string {
  if (!date) return '—';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Verifica se a data é válida
  if (isNaN(d.getTime())) return '—';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  if (showTime) {
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  
  return `${day}/${month}/${year}`;
}

/**
 * Converte uma string no formato DD/MM/AAAA para objeto Date
 * @param dateStr - String no formato DD/MM/AAAA
 * @returns Objeto Date ou null se inválido
 */
export function parseDateBR(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  const date = new Date(year, month, day);
  return date;
}

/**
 * Formata uma data para o formato ISO (YYYY-MM-DD) para enviar ao Supabase
 * @param date - Data no formato Date ou string DD/MM/AAAA
 * @returns String no formato YYYY-MM-DD
 */
export function formatDateISO(date: Date | string): string {
  if (typeof date === 'string') {
    const parsed = parseDateBR(date);
    if (!parsed) return '';
    date = parsed;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}