import { supabase } from '../../lib/supabase';

describe('Testes de Movimentações (Integração)', () => {
  let produtoId: number | null = null;
  let movimentacaoId: number | null = null;

  beforeAll(async () => {
    // Criar produto para os testes
    const { data: produto, error: produtoError } = await supabase
      .from('produto')
      .insert([{ nome: 'Produto Mov Teste', unidademedida: 'kg', precobase: 5 }])
      .select()
      .single();

    expect(produtoError).toBeNull();
    produtoId = produto?.idproduto as number;

    // Criar estoque
    await supabase.from('estoque').insert([{ idproduto: produtoId, quantidadeatual: 50 }]);
  });

  afterAll(async () => {
    if (produtoId) {
      await supabase.from('estoque').delete().eq('idproduto', produtoId);
      await supabase.from('produto').delete().eq('idproduto', produtoId);
    }
    if (movimentacaoId) {
      await supabase.from('movimentacao').delete().eq('idmovimentacao', movimentacaoId);
    }
  });

  it('deve registrar uma movimentação de entrada', async () => {
    expect(produtoId).not.toBeNull();

    const quantidade = 10;
    const { data: mov, error: movError } = await supabase
      .from('movimentacao')
      .insert([
        {
          idproduto: produtoId,
          quantidade: quantidade,
          tipomovimentacao: 'entrada',
          observacoes: 'Teste de entrada',
          datamovimentacao: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    expect(movError).toBeNull();
    expect(mov).not.toBeNull();
    movimentacaoId = mov?.idmovimentacao as number;

    // Atualizar estoque (somar a quantidade)
    const { data: estoqueAtual, error: buscaEstoque } = await supabase
      .from('estoque')
      .select('quantidadeatual')
      .eq('idproduto', produtoId)
      .single();

    expect(buscaEstoque).toBeNull();
    expect(estoqueAtual).not.toBeNull();

    const novaQuantidade = (estoqueAtual?.quantidadeatual || 0) + quantidade;
    const { error: updateError } = await supabase
      .from('estoque')
      .update({ quantidadeatual: novaQuantidade })
      .eq('idproduto', produtoId);

    expect(updateError).toBeNull();

    // Verificar estoque final
    const { data: estoqueFinal, error: finalError } = await supabase
      .from('estoque')
      .select('quantidadeatual')
      .eq('idproduto', produtoId)
      .single();

    expect(finalError).toBeNull();
    expect(estoqueFinal?.quantidadeatual).toBe(60); // 50 + 10
  });

  it('deve registrar uma movimentação de saída', async () => {
    expect(produtoId).not.toBeNull();

    const quantidade = 5;
    const { data: mov, error: movError } = await supabase
      .from('movimentacao')
      .insert([
        {
          idproduto: produtoId,
          quantidade: quantidade,
          tipomovimentacao: 'saida',
          observacoes: 'Teste de saída',
          datamovimentacao: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    expect(movError).toBeNull();
    expect(mov).not.toBeNull();

    // Atualizar estoque (subtrair a quantidade)
    const { data: estoqueAtual, error: buscaEstoque } = await supabase
      .from('estoque')
      .select('quantidadeatual')
      .eq('idproduto', produtoId)
      .single();

    expect(buscaEstoque).toBeNull();
    expect(estoqueAtual).not.toBeNull();

    const novaQuantidade = (estoqueAtual?.quantidadeatual || 0) - quantidade;
    const { error: updateError } = await supabase
      .from('estoque')
      .update({ quantidadeatual: novaQuantidade })
      .eq('idproduto', produtoId);

    expect(updateError).toBeNull();

    // Verificar estoque final
    const { data: estoqueFinal, error: finalError } = await supabase
      .from('estoque')
      .select('quantidadeatual')
      .eq('idproduto', produtoId)
      .single();

    expect(finalError).toBeNull();
    expect(estoqueFinal?.quantidadeatual).toBe(55); // 60 - 5
  });

  it('deve listar movimentações', async () => {
    const { data, error } = await supabase
      .from('movimentacao')
      .select('*, produto(nome)')
      .order('datamovimentacao', { ascending: false })
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.length).toBeGreaterThanOrEqual(2);
  });
});