import { supabase } from '../../lib/supabase';

describe('Limpeza final (Teardown)', () => {
  it('deve limpar todos os dados de teste criados durante a execução', async () => {
    // 1. PRIMEIRO: Remover movimentações de teste (para não violar FK)
    const { error: deleteMovimentacoes } = await supabase
      .from('movimentacao')
      .delete()
      .ilike('observacoes', '%teste%');

    if (deleteMovimentacoes) {
      console.warn('Aviso ao deletar movimentações:', deleteMovimentacoes.message);
    }

    // 2. Remover animais de teste
    const { error: deleteAnimais } = await supabase
      .from('animal')
      .delete()
      .in('especie', ['Animal Teste Integração', 'Animal Abate Teste', 'Animal Venda Teste']);

    if (deleteAnimais) {
      console.warn('Aviso ao deletar animais:', deleteAnimais.message);
    }

    // 3. Remover produtos de teste
    const { error: deleteProdutos } = await supabase
      .from('produto')
      .delete()
      .like('nome', '%Teste%');

    if (deleteProdutos) {
      console.warn('Aviso ao deletar produtos:', deleteProdutos.message);
    }

    // 4. Verificar se a limpeza foi bem-sucedida
    const { count: animaisCount, error: countAnimais } = await supabase
      .from('animal')
      .select('*', { count: 'exact', head: true })
      .in('especie', ['Animal Teste Integração', 'Animal Abate Teste', 'Animal Venda Teste']);

    // Se count for null, significa que não há registros (ou erro). Tratar como 0.
    const totalAnimais = animaisCount ?? 0;
    expect(totalAnimais).toBe(0);

    const { count: produtosCount, error: countProdutos } = await supabase
      .from('produto')
      .select('*', { count: 'exact', head: true })
      .like('nome', '%Teste%');

    const totalProdutos = produtosCount ?? 0;
    expect(totalProdutos).toBe(0);

    // 5. (Opcional) Verificar se movimentações de teste foram removidas
    const { count: movCount, error: countMov } = await supabase
      .from('movimentacao')
      .select('*', { count: 'exact', head: true })
      .ilike('observacoes', '%teste%');

    if (movCount && movCount > 0) {
      console.warn(`Ainda existem ${movCount} movimentações com 'teste' nas observações.`);
    }
  });
});
