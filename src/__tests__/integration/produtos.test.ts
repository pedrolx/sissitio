import { supabase } from '../../lib/supabase';

describe('Testes de Produtos (Integração)', () => {
    let produtoId: number | null = null;

    afterAll(async () => {
        if (produtoId) {
            await supabase.from('produto').delete().eq('idproduto', produtoId);
            await supabase.from('estoque').delete().eq('idproduto', produtoId);
        }
    });

    it('deve cadastrar um produto (sem estoque automático via API)', async () => {
        const { data, error } = await supabase
            .from('produto')
            .insert([
                {
                    nome: 'Produto Teste Integração',
                    categoria: 'Teste',
                    unidademedida: 'kg',
                    precobase: 15.90,
                    precosugerido: 18.50,
                },
            ])
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data?.nome).toBe('Produto Teste Integração');
        expect(data?.precobase).toBe(15.90);

        produtoId = data?.idproduto as number;

        // Criar estoque manualmente
        const { error: insertEstoque } = await supabase
            .from('estoque')
            .insert([{ idproduto: produtoId, quantidadeatual: 0 }]);

        expect(insertEstoque).toBeNull();

        // Verificar se o estoque foi criado
        const { data: estoque, error: estoqueError } = await supabase
            .from('estoque')
            .select('quantidadeatual')
            .eq('idproduto', produtoId)
            .maybeSingle();

        expect(estoqueError).toBeNull();
        expect(estoque).not.toBeNull();
        expect(estoque?.quantidadeatual).toBe(0);
    });

    it('deve atualizar um produto', async () => {
        expect(produtoId).not.toBeNull();

        const { data, error } = await supabase
            .from('produto')
            .update({ precobase: 16.50, precosugerido: 19.00 })
            .eq('idproduto', produtoId)
            .select()
            .single();

        expect(error).toBeNull();
        expect(data).not.toBeNull();
        expect(data?.precobase).toBe(16.50);
        expect(data?.precosugerido).toBe(19.00);
    });

    it('deve listar produtos', async () => {
        const { data, error } = await supabase
            .from('produto')
            .select('*')
            .limit(10);

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data?.length).toBeGreaterThanOrEqual(1);
    });
});
