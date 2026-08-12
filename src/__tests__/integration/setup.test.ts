import { supabase } from '../../lib/supabase';

describe('Setup - Conexão com Supabase', () => {
  it('deve conseguir conectar ao Supabase e executar uma consulta simples', async () => {
    const { data, error } = await supabase
      .from('produto')
      .select('count')
      .limit(1);

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('deve ter as tabelas principais disponíveis', async () => {
    const tabelas = ['cliente', 'produto', 'estoque', 'animal', 'venda', 'itemvenda', 'movimentacao', 'usuario'];
    for (const tabela of tabelas) {
      const { error } = await supabase.from(tabela).select('count').limit(0);
      expect(error).toBeNull();
    }
  });
});
