import { supabase } from '../../lib/supabase';

// Helper para criar um produto de teste e limpar depois
async function criarProdutoTeste(nome: string) {
  const { data, error } = await supabase
    .from('Produto')
    .insert([{ nome, unidadeMedida: 'kg', precoBase: 10 }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deletarProdutoTeste(id: number) {
  await supabase.from('Produto').delete().eq('idProduto', id);
}

describe('Testes de Estoque (Integração)', () => {
  let produtoId: number;

  beforeAll(async () => {
    // Criar produto para os testes
    const produto = await criarProdutoTeste('Produto Estoque Teste');
    produtoId = produto.idProduto;
  });

  afterAll(async () => {
    // Limpar produto criado
    if (produtoId) await deletarProdutoTeste(produtoId);
  });

  it('deve criar estoque automaticamente ao criar produto', async () => {
    // Já foi criado no beforeAll, mas vamos verificar se o estoque existe
    const { data, error } = await supabase
      .from('Estoque')
      .select('quantidadeAtual')
      .eq('idProduto', produtoId)
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.quantidadeAtual).toBeDefined();
    expect(data?.quantidadeAtual).toBe(0);
  });

  it('deve registrar entrada de estoque', async () => {
    const quantidadeInicial = 0;
    const quantidadeEntrada = 10;

    // Registrar entrada
    const { data: estoqueAtual, error: errorBusca } = await supabase
      .from('Estoque')
      .select('quantidadeAtual')
      .eq('idProduto', produtoId)
      .single();

    expect(errorBusca).toBeNull();
    expect(estoqueAtual).not.toBeNull();

    const novaQuantidade = (estoqueAtual?.quantidadeAtual || 0) + quantidadeEntrada;

    const { error: updateError } = await supabase
      .from('Estoque')
      .update({ quantidadeAtual: novaQuantidade })
      .eq('idProduto', produtoId);

    expect(updateError).toBeNull();

    // Verificar se a movimentação foi criada
    const { data: mov, error: movError } = await supabase
      .from('Movimentacao')
      .select('*')
      .eq('idProduto', produtoId)
      .eq('tipoMovimentacao', 'entrada')
      .maybeSingle();

    expect(movError).toBeNull();
    expect(mov).not.toBeNull();

    // Verificar estoque final
    const { data: estoqueFinal, error: errorFinal } = await supabase
      .from('Estoque')
      .select('quantidadeAtual')
      .eq('idProduto', produtoId)
      .single();

    expect(errorFinal).toBeNull();
    expect(estoqueFinal?.quantidadeAtual).toBe(quantidadeEntrada);
  });

  it('deve registrar saída de estoque', async () => {
    // Primeiro, garantir que há estoque
    const quantidadeEntrada = 10;
    const { error: entradaError } = await supabase
      .from('Estoque')
      .update({ quantidadeAtual: quantidadeEntrada })
      .eq('idProduto', produtoId);

    expect(entradaError).toBeNull();

    // Registrar saída
    const quantidadeSaida = 5;
    const { data: estoqueAtual, error: errorBusca } = await supabase
      .from('Estoque')
      .select('quantidadeAtual')
      .eq('idProduto', produtoId)
      .single();

    expect(errorBusca).toBeNull();
    expect(estoqueAtual).not.toBeNull();

    const novaQuantidade = (estoqueAtual?.quantidadeAtual || 0) - quantidadeSaida;

    const { error: updateError } = await supabase
      .from('Estoque')
      .update({ quantidadeAtual: novaQuantidade })
      .eq('idProduto', produtoId);

    expect(updateError).toBeNull();

    // Verificar movimentação
    const { data: mov, error: movError } = await supabase
      .from('Movimentacao')
      .select('*')
      .eq('idProduto', produtoId)
      .eq('tipoMovimentacao', 'saida')
      .maybeSingle();

    expect(movError).toBeNull();
    expect(mov).not.toBeNull();

    // Verificar estoque final
    const { data: estoqueFinal, error: errorFinal } = await supabase
      .from('Estoque')
      .select('quantidadeAtual')
      .eq('idProduto', produtoId)
      .single();

    expect(errorFinal).toBeNull();
    expect(estoqueFinal?.quantidadeAtual).toBe(quantidadeEntrada - quantidadeSaida);
  });

  it('não deve permitir estoque negativo', async () => {
    // Zerar estoque
    await supabase
      .from('Estoque')
      .update({ quantidadeAtual: 0 })
      .eq('idProduto', produtoId);

    // Tentar registrar saída maior que o estoque
    const { data: estoqueAtual, error: errorBusca } = await supabase
      .from('Estoque')
      .select('quantidadeAtual')
      .eq('idProduto', produtoId)
      .single();

    expect(errorBusca).toBeNull();
    expect(estoqueAtual).not.toBeNull();

    const quantidadeSaida = 5;
    const novaQuantidade = (estoqueAtual?.quantidadeAtual || 0) - quantidadeSaida;

    // Deve dar erro (negativo)
    if (novaQuantidade < 0) {
      // Não deve permitir atualizar
      const { error: updateError } = await supabase
        .from('Estoque')
        .update({ quantidadeAtual: novaQuantidade })
        .eq('idProduto', produtoId);

      // Pode dar erro de constraint ou esperamos que a aplicação impeça
      // Aqui apenas verificamos que a lógica de validação funciona
      expect(updateError).not.toBeNull();
    }
  });
});