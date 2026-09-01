# 🌱 Sissitio

> **Sis**tema para **Sítio** – um aplicativo mobile feito com React Native (Expo) e Supabase para ajudar no gerenciamento de atividades e operações do dia a dia em um sítio.

---

## 📌 Sobre o Projeto

Este aplicativo foi desenvolvido como projeto de extensão para a faculdade, com o objetivo de digitalizar e facilitar o controle de tarefas, estoque, produção e finanças de um pequeno sítio. Ele permite que o usuário:

- Registre e acompanhe rotinas de venda.
- Controle o estoque de insumos.
- Visualize relatórios simples de produção e despesas.
- Sincronize dados offline para uso em áreas sem internet.

Tudo isso com uma interface intuitiva e pensada para o usuário rural, que muitas vezes não tem acesso a sistemas complexos.

---

## 🛠️ Tecnologias Utilizadas

- [React Native](https://reactnative.dev/) + [Expo](https://expo.dev/) – desenvolvimento mobile cross-platform.
- [Supabase](https://supabase.com/) – backend com banco de dados PostgreSQL, autenticação e storage.
- [TypeScript](https://www.typescriptlang.org/) – para tipagem segura e melhor manutenção.
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) – cache offline e sincronização.
- [EAS Build](https://docs.expo.dev/eas/) – builds automatizados para Android e iOS.

---

## 📱 Funcionalidades Principais

- ✅ Autenticação de usuários (login/registro) com Supabase Auth.
- ✅ CRUD de tarefas, insumos, e registros financeiros.
- ✅ Sincronização offline – as operações são enfileiradas e sincronizadas quando a internet retorna.
- ✅ Filtros e buscas por data, categoria e status.
- ✅ Visualização de resumos e gráficos simples.

*(Em constante evolução – novas funcionalidades são adicionadas conforme feedback dos usuários.)*

---

## 🚀 Como Rodar o Projeto Localmente

### Pré-requisitos

- Node.js (v18 ou superior)
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Um projeto no Supabase (gratuito) configurado com as tabelas e políticas RLS adequadas.

### Passos

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/pedrolx/sissitio.git
   cd sissitio
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto com as seguintes chaves (substitua pelos seus valores):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```

   > ⚠️ **Nunca commite o arquivo `.env`** – ele já está no `.gitignore`.

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npx expo start
   ```

5. **Teste no dispositivo/emulador:**
   - Escaneie o QR Code com o app Expo Go (Android/iOS).
   - Ou pressione `a` para abrir no emulador Android, `i` para iOS.

---

## 📦 Como Gerar um APK de Produção

Este projeto utiliza EAS Build. Para gerar um APK:

```bash
npx expo login
eas build -p android --profile production
```

O arquivo `.apk` será gerado e disponibilizado para download.

---

## 🛡️ Segurança e Privacidade

- As chaves do Supabase são armazenadas em variáveis de ambiente e **não** estão no repositório.
- As políticas RLS (Row Level Security) no Supabase garantem que cada usuário veja apenas seus próprios dados.
- O repositório é público para fins de avaliação acadêmica, mas **não há dados sensíveis expostos**.

---

## 🤝 Contribuições e Forks

Este é um projeto acadêmico e pessoal. Atualmente **não estou aceitando contribuições externas** nem incentivando forks, pois o foco é a avaliação do curso!

Se você deseja usar alguma parte do código, por favor, dê os devidos créditos e mantenha o aviso de licenciamento.

---

## 📄 Licença

Este projeto está licenciado sob a **Creative Commons Atribuição-NãoComercial 4.0 Internacional (CC BY-NC 4.0)** – o que significa que você pode usar, modificar e compartilhar o código, **desde que seja para fins não comerciais e com os devidos créditos**. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.

---

## ✉️ Contato

[**GitHub**](https://github.com/pedrolx)  
[**LinkedIn**](https://www.linkedin.com/in/pedro-lucas-xavier/) 

Projeto desenvolvido para a disciplina de Extensão – UniAmérica Descomplica / Análise e Desenvolvimento de Sistemas.

---

⭐ **Se você gostou ou achou útil, deixe uma estrela no repositório!**
