import { supabase } from '../../lib/supabase';

describe('Testes de Animais (Integração)', () => {
  let animalId: number;

  beforeAll(async () => {
    // Limpar qualquer animal de teste anterior
    await supabase.from('Animal').delete().eq('especie', 'Animal Teste Integração');
  });

  afterAll(async () => {
    // Limpar animal criado
    if (animalId) {
      await supabase.from('Animal').delete().eq('idAnimal', animalId);
    }
  });

  it('deve cadastrar um animal', async () => {
    const { data, error } = await supabase
      .from('Animal')
      .insert([
        {
          especie: 'Animal Teste Integração',
          dataNascimento: '2024-01-01',
          status: 'vivo',
          pesoAtual: 10.5,
          observacoes: 'Teste integração',
        },
      ])
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.especie).toBe('Animal Teste Integração');
    expect(data?.status).toBe('vivo');
    expect(data?.pesoAtual).toBe(10.5);

    animalId = data?.idAnimal || 0;
  });

  it('deve atualizar um animal', async () => {
    expect(animalId).toBeGreaterThan(0);

    const { data, error } = await supabase
      .from('Animal')
      .update({ pesoAtual: 12.3, status: 'vendido' })
      .eq('idAnimal', animalId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data?.pesoAtual).toBe(12.3);
    expect(data?.status).toBe('vendido');
  });

  it('deve registrar abate de animal (gerar movimentação)', async () => {
    // Criar um animal específico para o abate
    const { data: animal, error: createError } = await supabase
      .from('Animal')
      .insert([
        {
          especie: 'Animal Abate Teste',
          dataNascimento: '2024-01-01',
          status: 'vivo',
          pesoAtual: 15.0,
        },
      ])
      .select()
      .single();

    expect(createError).toBeNull();
    expect(animal).not.toBeNull();
    expect(animal?.idAnimal).toBeDefined();

    const idAnimal = animal?.idAnimal as number;

    // Registrar abate
    const { error: updateError } = await supabase
      .from('Animal')
      .update({ status: 'abatido' })
      .eq('idAnimal', idAnimal);

    expect(updateError).toBeNull();

    // Registrar movimentação de abate
    const { data: mov, error: movError } = await supabase
      .from('Movimentacao')
      .insert([
        {
          idAnimal: idAnimal,
          tipoMovimentacao: 'abate',
          observacoes: 'Animal abatido em teste',
          dataMovimentacao: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    expect(movError).toBeNull();
    expect(mov).not.toBeNull();
    expect(mov?.tipoMovimentacao).toBe('abate');
    expect(mov?.idAnimal).toBe(idAnimal);

    // Verificar status do animal
    const { data: animalAtualizado, error: buscaError } = await supabase
      .from('Animal')
      .select('status')
      .eq('idAnimal', idAnimal)
      .single();

    expect(buscaError).toBeNull();
    expect(animalAtualizado?.status).toBe('abatido');

    // Limpar
    await supabase.from('Animal').delete().eq('idAnimal', idAnimal);
    await supabase.from('Movimentacao').delete().eq('idAnimal', idAnimal);
  });

  it('deve vender um animal (alterar status e criar movimentação)', async () => {
    // Criar animal
    const { data: animal, error: createError } = await supabase
      .from('Animal')
      .insert([
        {
          especie: 'Animal Venda Teste',
          dataNascimento: '2024-01-01',
          status: 'vivo',
          pesoAtual: 20.0,
        },
      ])
      .select()
      .single();

    expect(createError).toBeNull();
    expect(animal).not.toBeNull();

    const idAnimal = animal?.idAnimal as number;

    // Atualizar status para vendido
    const { error: updateError } = await supabase
      .from('Animal')
      .update({ status: 'vendido' })
      .eq('idAnimal', idAnimal);

    expect(updateError).toBeNull();

    // Registrar movimentação de venda de animal
    const { data: mov, error: movError } = await supabase
      .from('Movimentacao')
      .insert([
        {
          idAnimal: idAnimal,
          tipoMovimentacao: 'venda_animal',
          observacoes: 'Animal vendido em teste',
          dataMovimentacao: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    expect(movError).toBeNull();
    expect(mov).not.toBeNull();
    expect(mov?.tipoMovimentacao).toBe('venda_animal');

    // Limpar
    await supabase.from('Animal').delete().eq('idAnimal', idAnimal);
    await supabase.from('Movimentacao').delete().eq('idAnimal', idAnimal);
  });
});