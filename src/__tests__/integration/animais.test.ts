import { supabase } from '../../lib/supabase';

describe('Testes de Animais (Integração)', () => {
  let animalId: number | null = null;

  beforeAll(async () => {
    // Limpar qualquer animal de teste anterior
    await supabase.from('animal').delete().eq('especie', 'Animal Teste Integração');
  });

  afterAll(async () => {
    if (animalId) {
      await supabase.from('animal').delete().eq('idanimal', animalId);
    }
  });

  it('deve cadastrar um animal', async () => {
    const { data, error } = await supabase
      .from('animal')
      .insert([
        {
          especie: 'Animal Teste Integração',
          datanascimento: '2024-01-01',
          status: 'vivo',
          pesoatual: 10.5,
          observacoes: 'Teste integração',
        },
      ])
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.especie).toBe('Animal Teste Integração');
    expect(data?.status).toBe('vivo');
    expect(data?.pesoatual).toBe(10.5);

    animalId = data?.idanimal as number;
  });

  it('deve atualizar um animal', async () => {
    expect(animalId).not.toBeNull();

    const { data, error } = await supabase
      .from('animal')
      .update({ pesoatual: 12.3, status: 'vendido' })
      .eq('idanimal', animalId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.pesoatual).toBe(12.3);
    expect(data?.status).toBe('vendido');
  });

  it('deve registrar abate de animal (gerar movimentação)', async () => {
    // Criar um animal específico para o abate
    const { data: animal, error: createError } = await supabase
      .from('animal')
      .insert([
        {
          especie: 'Animal Abate Teste',
          datanascimento: '2024-01-01',
          status: 'vivo',
          pesoatual: 15.0,
        },
      ])
      .select()
      .single();

    expect(createError).toBeNull();
    expect(animal).not.toBeNull();
    expect(animal?.idanimal).toBeDefined();

    const idanimal = animal?.idanimal as number;

    // Registrar abate
    const { error: updateError } = await supabase
      .from('animal')
      .update({ status: 'abatido' })
      .eq('idanimal', idanimal);

    expect(updateError).toBeNull();

    // Registrar movimentação de abate
    const { error: movError } = await supabase.from('movimentacao').insert([
      {
        idanimal: idanimal,
        tipomovimentacao: 'abate',
        observacoes: 'Animal abatido em teste',
        datamovimentacao: new Date().toISOString(),
      },
    ]);

    expect(movError).toBeNull();

    // Verificar status do animal
    const { data: animalAtualizado, error: buscaError } = await supabase
      .from('animal')
      .select('status')
      .eq('idanimal', idanimal)
      .maybeSingle();

    expect(buscaError).toBeNull();
    expect(animalAtualizado?.status).toBe('abatido');

    // Limpar
    await supabase.from('animal').delete().eq('idanimal', idanimal);
    await supabase.from('movimentacao').delete().eq('idanimal', idanimal);
  });

  it('deve vender um animal (alterar status e criar movimentação)', async () => {
    // Criar animal
    const { data: animal, error: createError } = await supabase
      .from('animal')
      .insert([
        {
          especie: 'Animal Venda Teste',
          datanascimento: '2024-01-01',
          status: 'vivo',
          pesoatual: 20.0,
        },
      ])
      .select()
      .single();

    expect(createError).toBeNull();
    expect(animal).not.toBeNull();

    const idanimal = animal?.idanimal as number;

    // Atualizar status para vendido
    const { error: updateError } = await supabase
      .from('animal')
      .update({ status: 'vendido' })
      .eq('idanimal', idanimal);

    expect(updateError).toBeNull();

    // Registrar movimentação de venda de animal
    const { error: movError } = await supabase.from('movimentacao').insert([
      {
        idanimal: idanimal,
        tipomovimentacao: 'venda_animal',
        observacoes: 'Animal vendido em teste',
        datamovimentacao: new Date().toISOString(),
      },
    ]);

    expect(movError).toBeNull();

    // Limpar
    await supabase.from('animal').delete().eq('idanimal', idanimal);
    await supabase.from('movimentacao').delete().eq('idanimal', idanimal);
  });
});
