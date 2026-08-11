import { supabase } from '../../lib/supabase';

describe('Setup - Conexão com Supabase', () => {
  it('deve conseguir conectar ao Supabase e executar uma consulta simples', async () => {
    const { data, error } = await supabase
      .from('Produto')
      .select('count')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('deve ter as tabelas principais disponíveis', async () => {
    const tabelas = ['Cliente', 'Produto', 'Estoque', 'Animal', 'Venda', 'ItemVenda', 'Movimentacao', 'Usuario'];
    for (const tabela of tabelas) {
      const { error } = await supabase.from(tabela).select('count').limit(0);
      // Se der erro, a tabela não existe
      expect(error).toBeNull();
    }
  });
});