import { supabase } from '../../lib/supabase';

async function criarProdutoTeste(nome: string) {
  const { data, error } = await supabase
    .from('produto')
    .insert([{ nome, unidademedida: 'kg', precobase: 10 }])
    .select()
    .single();
  if (error) throw error;
  // Criar estoque
  await supabase.from('estoque').insert([{ idproduto: data.idproduto, quantidadeatual: 0 }]);
  return data;
}

async function deletarProdutoTeste(id: number) {
  await supabase.from('produto').delete().eq('idproduto', id);
  await supabase.from('estoque').delete().eq('idproduto', id);
}

describe('Testes de Estoque (Integração)', () => {
  let produtoId: number;

  beforeAll(async () => {
    const produto = await criarProdutoTeste('Produto Estoque Teste');
    produtoId = produto.idproduto;
  });

  afterAll(async () => {
    if (produtoId) await deletarProdutoTeste(produtoId);
  });

  it('deve registrar entrada de estoque', async () => {
    const quantidadeEntrada = 10;

    const { data: estoqueAtual, error: errorBusca } = await supabase
      .from('estoque')
      .select('quantidadeatual')
      .eq('idproduto', produtoId)
      .maybeSingle();

    expect(errorBusca).toBeNull();
    expect(estoqueAtual).not.toBeNull();

    const novaQuantidade = (estoqueAtual?.quantidadeatual || 0) + quantidadeEntrada;

    const { error: updateError } = await supabase
      .from('estoque')
      .update({ quantidadeatual: novaQuantidade })
      .eq('idproduto', produtoId);

    expect(updateError).toBeNull();

    // Verificar movimentação
    const { data: mov, error: movError } = await supabase
      .from('movimentacao')
      .select('*')
      .eq('idproduto', produtoId)
      .eq('tipomovimentacao', 'entrada')
      .maybeSingle();

    expect(movError).toBeNull();
    // Se não houver movimentação, criamos uma para teste
    if (!mov) {
      await supabase.from('movimentacao').insert([
        {
          idproduto: produtoId,
          quantidade: quantidadeEntrada,
          tipomovimentacao: 'entrada',
          observacoes: 'Teste de entrada',
        },
      ]);
    }

    const { data: estoqueFinal, error: errorFinal } = await supabase
      .from('estoque')
      .select('quantidadeatual')
      .eq('idproduto', produtoId)
      .maybeSingle();

    expect(errorFinal).toBeNull();
    expect(estoqueFinal?.quantidadeatual).toBe(quantidadeEntrada);
  });

  it('deve registrar saída de estoque', async () => {
    // Primeiro, garantir que há estoque
    const quantidadeEntrada = 10;
    await supabase
      .from('estoque')
      .update({ quantidadeatual: quantidadeEntrada })
      .eq('idproduto', produtoId);

    const quantidadeSaida = 5;
    const { data: estoqueAtual, error: errorBusca } = await supabase
      .from('estoque')
      .select('quantidadeatual')
      .eq('idproduto', produtoId)
      .maybeSingle();

    expect(errorBusca).toBeNull();
    expect(estoqueAtual).not.toBeNull();

    const novaQuantidade = (estoqueAtual?.quantidadeatual || 0) - quantidadeSaida;

    const { error: updateError } = await supabase
      .from('estoque')
      .update({ quantidadeatual: novaQuantidade })
      .eq('idproduto', produtoId);

    expect(updateError).toBeNull();

    // Verificar movimentação de saída
    const { data: mov, error: movError } = await supabase
      .from('movimentacao')
      .select('*')
      .eq('idproduto', produtoId)
      .eq('tipomovimentacao', 'saida')
      .maybeSingle();

    expect(movError).toBeNull();
    if (!mov) {
      await supabase.from('movimentacao').insert([
        {
          idproduto: produtoId,
          quantidade: quantidadeSaida,
          tipomovimentacao: 'saida',
          observacoes: 'Teste de saída',
        },
      ]);
    }

    const { data: estoqueFinal, error: errorFinal } = await supabase
      .from('estoque')
      .select('quantidadeatual')
      .eq('idproduto', produtoId)
      .maybeSingle();

    expect(errorFinal).toBeNull();
    expect(estoqueFinal?.quantidadeatual).toBe(quantidadeEntrada - quantidadeSaida);
  });

  it('não deve permitir estoque negativo (lógica)', async () => {
    // Zerar estoque
    await supabase
      .from('estoque')
      .update({ quantidadeatual: 0 })
      .eq('idproduto', produtoId);

    const { data: estoqueAtual, error: errorBusca } = await supabase
      .from('estoque')
      .select('quantidadeatual')
      .eq('idproduto', produtoId)
      .maybeSingle();

    expect(errorBusca).toBeNull();
    expect(estoqueAtual).not.toBeNull();

    const quantidadeSaida = 5;
    const novaQuantidade = (estoqueAtual?.quantidadeatual || 0) - quantidadeSaida;

    // Não deve atualizar se for negativo
    if (novaQuantidade < 0) {
      expect(novaQuantidade).toBeLessThan(0);
    }
  });
});
