import { supabase } from '../../lib/supabase';

describe('Testes de Clientes (Integração)', () => {
  let clienteId: number | null = null;

  afterAll(async () => {
    if (clienteId) {
      await supabase.from('cliente').delete().eq('idcliente', clienteId);
    }
  });

  it('deve cadastrar um cliente', async () => {
    const { data, error } = await supabase
      .from('cliente')
      .insert([
        {
          nome: 'Cliente Teste Integração',
          telefone: '(11) 99999-9999',
          observacoes: 'Cliente criado para teste',
        },
      ])
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.nome).toBe('Cliente Teste Integração');
    expect(data?.telefone).toBe('(11) 99999-9999');

    clienteId = data?.idcliente as number;
  });

  it('deve atualizar um cliente', async () => {
    expect(clienteId).not.toBeNull();

    const { data, error } = await supabase
      .from('cliente')
      .update({ telefone: '(11) 88888-8888' })
      .eq('idcliente', clienteId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.telefone).toBe('(11) 88888-8888');
  });

  it('deve listar clientes', async () => {
    const { data, error } = await supabase
      .from('cliente')
      .select('*')
      .limit(10);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.length).toBeGreaterThanOrEqual(1);
  });
});