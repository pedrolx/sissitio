import { supabase } from '../../lib/supabase';

describe('Testes de Vendas (Integração)', () => {
  let clienteId: number | null = null;
  let produtoId: number | null = null;
  let vendaId: number | null = null;

  beforeAll(async () => {
    // Criar cliente para os testes
    const { data: cliente, error: clienteError } = await supabase
      .from('cliente')
      .insert([{ nome: 'Cliente Venda Teste', telefone: '(11) 99999-9999' }])
      .select()
      .single();

    expect(clienteError).toBeNull();
    clienteId = cliente?.idcliente as number;

    // Criar produto para os testes
    const { data: produto, error: produtoError } = await supabase
      .from('produto')
      .insert([{ nome: 'Produto Venda Teste', unidademedida: 'un', precobase: 10 }])
      .select()
      .single();

    expect(produtoError).toBeNull();
    produtoId = produto?.idproduto as number;

    // Criar estoque para o produto
    await supabase.from('estoque').insert([{ idproduto: produtoId, quantidadeatual: 100 }]);
  });

  afterAll(async () => {
    // Limpar dados criados (ordem correta)
    if (vendaId) {
      // Deletar itens, movimentações e venda
      await supabase.from('itemvenda').delete().eq('idvenda', vendaId);
      await supabase.from('movimentacao').delete().eq('idvenda', vendaId);
      await supabase.from('venda').delete().eq('idvenda', vendaId);
    }
    if (produtoId) {
      await supabase.from('estoque').delete().eq('idproduto', produtoId);
      await supabase.from('produto').delete().eq('idproduto', produtoId);
    }
    if (clienteId) {
      await supabase.from('cliente').delete().eq('idcliente', clienteId);
    }
  });

  it('deve criar uma venda com itens e atualizar estoque', async () => {
    expect(clienteId).not.toBeNull();
    expect(produtoId).not.toBeNull();

    // Buscar usuário autenticado (ou usar um fixo se tiver)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // 1. Criar venda
    const { data: venda, error: vendaError } = await supabase
      .from('venda')
      .insert([
        {
          idcliente: clienteId,
          idusuario: userId,
          datavenda: new Date().toISOString(),
          statuspagamento: 'Pendente',
          valortotal: 20,
        },
      ])
      .select()
      .single();

    expect(vendaError).toBeNull();
    expect(venda).not.toBeNull();
    vendaId = venda?.idvenda as number;

    // 2. Inserir item
    const { error: itemError } = await supabase.from('itemvenda').insert([
      {
        idvenda: vendaId,
        idproduto: produtoId,
        quantidade: 2,
        valorunitario: 10,
        valortotal: 20,
      },
    ]);

    expect(itemError).toBeNull();

    // 3. Atualizar estoque (diminuir)
    const { data: estoqueAtual, error: buscaEstoque } = await supabase
      .from('estoque')
      .select('quantidadeatual')
      .eq('idproduto', produtoId)
      .single();

    expect(buscaEstoque).toBeNull();
    expect(estoqueAtual).not.toBeNull();

    const novaQtd = (estoqueAtual?.quantidadeatual as number) - 2;
    const { error: updateEstoque } = await supabase
      .from('estoque')
      .update({ quantidadeatual: novaQtd })
      .eq('idproduto', produtoId);

    expect(updateEstoque).toBeNull();

    // 4. Registrar movimentação de saída
    const { error: movError } = await supabase.from('movimentacao').insert([
      {
        idproduto: produtoId,
        idvenda: vendaId,
        quantidade: 2,
        tipomovimentacao: 'saida',
        observacoes: `Venda #${vendaId}`,
        datamovimentacao: new Date().toISOString(),
      },
    ]);

    expect(movError).toBeNull();

    // Verificar estoque final
    const { data: estoqueFinal, error: finalError } = await supabase
      .from('estoque')
      .select('quantidadeatual')
      .eq('idproduto', produtoId)
      .single();

    expect(finalError).toBeNull();
    expect(estoqueFinal?.quantidadeatual).toBe(98);
  });

  it('deve listar vendas', async () => {
    const { data, error } = await supabase
      .from('venda')
      .select('*, cliente(nome), usuario(nome)')
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.length).toBeGreaterThanOrEqual(1);
  });
});
