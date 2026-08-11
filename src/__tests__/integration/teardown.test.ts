import { supabase } from '../../lib/supabase';

describe('Limpeza final (Teardown)', () => {
  it('deve limpar todos os dados de teste criados durante a execução', async () => {
    // Remover animais de teste
    const { error: deleteAnimais } = await supabase
      .from('Animal')
      .delete()
      .in('especie', ['Animal Teste Integração', 'Animal Abate Teste', 'Animal Venda Teste']);

    expect(deleteAnimais).toBeNull();

    // Remover produtos de teste
    const { error: deleteProdutos } = await supabase
      .from('Produto')
      .delete()
      .like('nome', '%Teste%');

    expect(deleteProdutos).toBeNull();

    // Remover movimentações de teste (não associadas a vendas reais)
    const { error: deleteMovimentacoes } = await supabase
      .from('Movimentacao')
      .delete()
      .like('observacoes', '%teste%')
      .or('observacoes.ilike.%Teste%');

    // Não é crítico se falhar, pois pode ter movimentações associadas a vendas
    // que queremos preservar. Mas para os testes, removemos as que criamos.
    // Se falhar, apenas logamos.
    if (deleteMovimentacoes) {
      console.warn('Não foi possível remover todas as movimentações de teste:', deleteMovimentacoes.message);
    }

    // Verificar se a limpeza foi bem-sucedida
    const { count: animaisCount, error: countAnimais } = await supabase
      .from('Animal')
      .select('*', { count: 'exact', head: true })
      .in('especie', ['Animal Teste Integração', 'Animal Abate Teste', 'Animal Venda Teste']);

    expect(countAnimais).toBe(0);

    const { count: produtosCount, error: countProdutos } = await supabase
      .from('Produto')
      .select('*', { count: 'exact', head: true })
      .like('nome', '%Teste%');

    expect(countProdutos).toBe(0);
  });
});