# Configuração do Supabase — GC Semijoias 💎

Este guia descreve os passos simples para ativar o banco de dados e o armazenamento de fotos no Supabase para o Catálogo Digital da GC Semijoias.

---

## 1. Executar o Script SQL no Painel Supabase

1. Acesse o painel do seu projeto no [Supabase](https://supabase.com/dashboard).
2. No menu lateral esquerdo, clique no ícone **SQL Editor** (`>_`).
3. Clique em **New Query** (Nova Consulta).
4. Copie todo o conteúdo do arquivo [`supabase/schema.sql`](./schema.sql) e cole no editor.
5. Clique no botão **Run** (Executar).

### O que o script realiza automaticamente:
- ✅ Habilita a extensão de geração de UUIDs (`uuid-ossp`).
- ✅ Cria a tabela `produtos` com as colunas: `id`, `nome`, `categoria`, `imagem_url`, `preco`, `preco_promocional`, `ativo` e `criado_em`.
- ✅ Cria índices de alta velocidade para busca, categorias e status de estoque.
- ✅ Cria o bucket de armazenamento público **`produtos-gc`** para guardar as fotos das semijoias.
- ✅ Configura todas as políticas de segurança (**RLS**) liberando leitura pública para a vitrine e permissões de escrita/atualização para as Server Actions do painel administrativo.
- ✅ Insere os produtos iniciais reais do catálogo para você testar imediatamente.

---

## 2. Configurar as Variáveis de Ambiente no Projeto

Crie um arquivo `.env` na raiz do projeto (copie o modelo de `.env.example`) com as seguintes chaves obtidas em **Project Settings > API**:

```env
# URL do projeto Supabase (Project URL)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_URL=https://seu-projeto.supabase.co

# Chave Anônima Pública (Anon / Public Key)
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Senha Mestra do Painel Administrativo /admin
VITE_ADMIN_PASSWORD=gcsemijoias2025
ADMIN_PASSWORD=gcsemijoias2025
```

---

## 3. Acessar o Painel Administrativo

- Abra no navegador ou celular: `http://localhost:3000/admin` (ou `https://seu-dominio.vercel.app/admin`).
- Digite a senha configurada (padrão: `gcsemijoias2025`).
- A autorização será salva localmente no seu dispositivo móvel para acesso direto e ágil!
