import { supabase } from '../../lib/supabase';

describe('Testes de Vendas (Integração)', () => {
  let clienteId: number | null = null;
  let produtoId: number | null = null;
  let vendaId: number | null = null;

  beforeAll(async () => {
    // Criar cliente e produto para os testes
    const { data: cliente, error: clienteError } = await supabase
      .from('Cliente')
      .insert([{ nome: 'Cliente Venda Teste', telefone: '(11) 99999-9999' }])
      .select()
      .single();
    expect(clienteError).toBeNull();
    clienteId = cliente?.idCliente as number;

    const { data: produto, error: produtoError } = await supabase
      .from('Produto')
      .insert([{ nome: 'Produto Venda Teste', unidadeMedida: 'un', precoBase: 10 }])
      .select()
      .single();
    expect(produtoError).toBeNull();
    produtoId = produto?.idProduto as number;

    // Criar estoque para o produto
    await supabase.from('Estoque').insert([{ idProduto: produtoId, quantidadeAtual: 100 }]);
  });

  afterAll(async () => {
    // Limpar dados criados
    if (vendaId) {
      // Deletar itens e movimentações associadas
      await supabase.from('ItemVenda').delete().eq('idVenda', vendaId);
      await supabase.from('Movimentacao').delete().eq('idVenda', vendaId);
      await supabase.from('Venda').delete().eq('idVenda', vendaId);
    }
    if (clienteId) {
      await supabase.from('Cliente').delete().eq('idCliente', clienteId);
    }
    if (produtoId) {
      await supabase.from('Estoque').delete().eq('idProduto', produtoId);
      await supabase.from('Produto').delete().eq('idProduto', produtoId);
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
      .from('Venda')
      .insert([
        {
          idCliente: clienteId,
          idUsuario: userId,
          dataVenda: new Date().toISOString(),
          statusPagamento: 'Pendente',
          valorTotal: 20,
        },
      ])
      .select()
      .single();

    expect(vendaError).toBeNull();
    expect(venda).not.toBeNull();
    vendaId = venda?.idVenda as number;

    // 2. Inserir item
    const { error: itemError } = await supabase.from('ItemVenda').insert([
      {
        idVenda: vendaId,
        idProduto: produtoId,
        quantidade: 2,
        valorUnitario: 10,
        valorTotal: 20,
      },
    ]);

    expect(itemError).toBeNull();

    // 3. Atualizar estoque (diminuir)
    const { data: estoqueAtual, error: buscaEstoque } = await supabase
      .from('Estoque')
      .select('quantidadeAtual')
      .eq('idProduto', produtoId)
      .single();

    expect(buscaEstoque).toBeNull();
    expect(estoqueAtual).not.toBeNull();

    const novaQtd = (estoqueAtual?.quantidadeAtual || 0) - 2;
    const { error: updateEstoque } = await supabase
      .from('Estoque')
      .update({ quantidadeAtual: novaQtd })
      .eq('idProduto', produtoId);

    expect(updateEstoque).toBeNull();

    // 4. Registrar movimentação de saída
    const { error: movError } = await supabase.from('Movimentacao').insert([
      {
        idProduto: produtoId,
        idVenda: vendaId,
        quantidade: 2,
        tipoMovimentacao: 'saida',
        observacoes: `Venda #${vendaId}`,
        dataMovimentacao: new Date().toISOString(),
      },
    ]);

    expect(movError).toBeNull();

    // Verificar estoque final
    const { data: estoqueFinal, error: finalError } = await supabase
      .from('Estoque')
      .select('quantidadeAtual')
      .eq('idProduto', produtoId)
      .single();

    expect(finalError).toBeNull();
    expect(estoqueFinal?.quantidadeAtual).toBe(98);
  });

  it('deve listar vendas', async () => {
    const { data, error } = await supabase
      .from('Venda')
      .select('*, Cliente(nome), Usuario(nome)')
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.length).toBeGreaterThanOrEqual(1);
  });
});