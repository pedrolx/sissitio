import { supabase } from '../../lib/supabase';

describe('Testes de Movimentações (Integração)', () => {
  let produtoId: number | null = null;
  let movimentacaoId: number | null = null;

  beforeAll(async () => {
    // Criar produto para os testes
    const { data: produto, error: produtoError } = await supabase
      .from('Produto')
      .insert([{ nome: 'Produto Mov Teste', unidadeMedida: 'kg', precoBase: 5 }])
      .select()
      .single();

    expect(produtoError).toBeNull();
    produtoId = produto?.idProduto as number;

    // Criar estoque
    await supabase.from('Estoque').insert([{ idProduto: produtoId, quantidadeAtual: 50 }]);
  });

  afterAll(async () => {
    if (produtoId) {
      await supabase.from('Estoque').delete().eq('idProduto', produtoId);
      await supabase.from('Produto').delete().eq('idProduto', produtoId);
    }
    if (movimentacaoId) {
      await supabase.from('Movimentacao').delete().eq('idMovimentacao', movimentacaoId);
    }
  });

  it('deve registrar uma movimentação de entrada', async () => {
    expect(produtoId).not.toBeNull();

    const quantidade = 10;
    const { data: mov, error: movError } = await supabase
      .from('Movimentacao')
      .insert([
        {
          idProduto: produtoId,
          quantidade: quantidade,
          tipoMovimentacao: 'entrada',
          observacoes: 'Teste de entrada',
          dataMovimentacao: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    expect(movError).toBeNull();
    expect(mov).not.toBeNull();
    movimentacaoId = mov?.idMovimentacao as number;

    // Verificar se o estoque foi atualizado (entrada)
    const { data: estoqueAtual, error: buscaEstoque } = await supabase
      .from('Estoque')
      .select('quantidadeAtual')
      .eq('idProduto', produtoId)
      .single();

    expect(buscaEstoque).toBeNull();
    expect(estoqueAtual?.quantidadeAtual).toBe(60); // 50 + 10
  });

  it('deve registrar uma movimentação de saída', async () => {
    expect(produtoId).not.toBeNull();

    const quantidade = 5;
    const { data: mov, error: movError } = await supabase
      .from('Movimentacao')
      .insert([
        {
          idProduto: produtoId,
          quantidade: quantidade,
          tipoMovimentacao: 'saida',
          observacoes: 'Teste de saída',
          dataMovimentacao: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    expect(movError).toBeNull();
    expect(mov).not.toBeNull();

    // Verificar estoque
    const { data: estoqueAtual, error: buscaEstoque } = await supabase
      .from('Estoque')
      .select('quantidadeAtual')
      .eq('idProduto', produtoId)
      .single();

    expect(buscaEstoque).toBeNull();
    expect(estoqueAtual?.quantidadeAtual).toBe(55); // 60 - 5
  });

  it('deve listar movimentações', async () => {
    const { data, error } = await supabase
      .from('Movimentacao')
      .select('*, Produto(nome)')
      .order('dataMovimentacao', { ascending: false })
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.length).toBeGreaterThanOrEqual(2);
  });
});