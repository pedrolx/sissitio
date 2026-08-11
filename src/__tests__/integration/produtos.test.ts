import { supabase } from '../../lib/supabase';

describe('Testes de Produtos (Integração)', () => {
  let produtoId: number | null = null;

  afterAll(async () => {
    // Limpar produto criado
    if (produtoId) {
      await supabase.from('Produto').delete().eq('idProduto', produtoId);
      // Limpar estoque associado
      await supabase.from('Estoque').delete().eq('idProduto', produtoId);
    }
  });

  it('deve cadastrar um produto e criar estoque automaticamente', async () => {
    const { data, error } = await supabase
      .from('Produto')
      .insert([
        {
          nome: 'Produto Teste Integração',
          categoria: 'Teste',
          unidadeMedida: 'kg',
          precoBase: 15.90,
          precoSugerido: 18.50,
        },
      ])
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.nome).toBe('Produto Teste Integração');
    expect(data?.precoBase).toBe(15.90);

    produtoId = data?.idProduto as number;

    // Verificar se o estoque foi criado automaticamente
    const { data: estoque, error: estoqueError } = await supabase
      .from('Estoque')
      .select('quantidadeAtual')
      .eq('idProduto', produtoId)
      .single();

    expect(estoqueError).toBeNull();
    expect(estoque).not.toBeNull();
    expect(estoque?.quantidadeAtual).toBe(0);
  });

  it('deve atualizar um produto', async () => {
    expect(produtoId).not.toBeNull();

    const { data, error } = await supabase
      .from('Produto')
      .update({ precoBase: 16.50, precoSugerido: 19.00 })
      .eq('idProduto', produtoId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.precoBase).toBe(16.50);
    expect(data?.precoSugerido).toBe(19.00);
  });

  it('deve listar produtos', async () => {
    const { data, error } = await supabase
      .from('Produto')
      .select('*')
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.length).toBeGreaterThanOrEqual(1);
  });
});