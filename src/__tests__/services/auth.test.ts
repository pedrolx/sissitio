import { signIn } from '../../services/auth';
import { supabase } from '../../lib/supabase';

// Mock do módulo supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve chamar signInWithPassword com email e senha corretos', async () => {
    const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
    mockSignIn.mockResolvedValue({
      data: { session: { user: { id: '123' } } },
      error: null,
    });

    const email = 'teste@email.com';
    const password = '123456';
    const result = await signIn(email, password);

    expect(mockSignIn).toHaveBeenCalledWith({ email, password });
    expect(result.data.session).toBeDefined();
    expect(result.error).toBeNull();
  });

  it('deve retornar erro se as credenciais forem inválidas', async () => {
    const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;
    mockSignIn.mockResolvedValue({
      data: null,
      error: { message: 'Credenciais inválidas' },
    });

    const result = await signIn('errado@email.com', 'senhaerrada');
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Credenciais inválidas');
  });
});
