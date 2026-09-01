// 1 = 100% para Jane, 0.5 = 50% para cada
const CATEGORIAS_RATEIO: Record<string, number> = {
  'hortaliça': 1,
  'legume': 1,
  'frango': 1,
  'peixe': 1,
  'ovos': 1,
  // para as demais, o padrão é 0.5 (50%)
};

// Função para obter o percentual de Jane para uma categoria
export function getPercentualJane(categoria: string | null): number {
  if (!categoria) return 0.5; // padrão 50%
  const categoriaLower = categoria.toLowerCase();
  return CATEGORIAS_RATEIO[categoriaLower] ?? 0.5;
}

// Função para calcular rateio de uma venda (lista de itens com produto)
export function calcularRateio(itens: any[]): { jane: number; tia: number } {
  let totalJane = 0;
  let totalTia = 0;

  for (const item of itens) {
    const produto = item.produto?.[0];
    const categoria = produto?.categoria || '';
    const percentualJane = getPercentualJane(categoria);
    const valorItem = item.valortotal || 0;

    totalJane += valorItem * percentualJane;
    totalTia += valorItem * (1 - percentualJane);
  }

  return {
    jane: Math.round(totalJane * 100) / 100,
    tia: Math.round(totalTia * 100) / 100,
  };
}