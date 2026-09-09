// 1 = 100% para Jane, 0.5 = 50% para cada
const CATEGORIAS_RATEIO: Record<string, number> = {
  'hortaliça': 1,
  'hortalicas': 1,      // sem acento
  'legume': 1,
  'legumes': 1,
  'frango': 1,
  'frangos': 1,
  'peixe': 1,
  'peixes': 1,
  'ovos': 1,
  // default 0.5
};

// Normaliza a categoria: minúscula, sem acentos, e trata plurais comuns
function normalizeCategory(categoria: string): string {
  let cat = categoria
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  // Se terminar com 's' e tiver mais de 1 caractere, tenta remover o 's' para ver se existe no mapa
  if (cat.endsWith('s') && cat.length > 1) {
    const singular = cat.slice(0, -1);
    if (CATEGORIAS_RATEIO[singular] !== undefined) {
      return singular;
    }
  }
  return cat;
}

export function getPercentualJane(categoria: string | null): number {
  if (!categoria) return 0.5;
  const normalized = normalizeCategory(categoria);
  return CATEGORIAS_RATEIO[normalized] ?? 0.5;
}

export function calcularRateio(itens: any[]): { jane: number; viviane: number } {
  let totalJane = 0;
  let totalViviane = 0;

  for (const item of itens) {
    let produto = item.produto;
    if (Array.isArray(produto)) {
      produto = produto[0];
    }
    const categoria = produto?.categoria || '';
    const percentualJane = getPercentualJane(categoria);
    const valorItem = item.valortotal || 0;

    totalJane += valorItem * percentualJane;
    totalViviane += valorItem * (1 - percentualJane);
  }

  return {
    jane: Math.round(totalJane * 100) / 100,
    viviane: Math.round(totalViviane * 100) / 100,
  };
}