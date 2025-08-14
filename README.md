# Projeto NestJS — API CRUD (Usuários & Produtos)

Este projeto implementa uma API RESTful completa utilizando NestJS, focada no gerenciamento de usuários (com autenticação JWT) e produtos. Ele segue boas práticas de arquitetura, inclui testes (unitários e E2E), validação de dados, linting e automação de CI/CD.

## Funcionalidades

*   **Autenticação e Autorização:** Registro, Login (JWT), e controle de acesso baseado em papéis (RBAC) para `user` e `admin`.
*   **Gerenciamento de Usuários:** CRUD básico (listagem apenas para admin).
*   **Gerenciamento de Produtos:** CRUD completo, com verificação de posse (usuário só gerencia seus produtos) e permissão de admin para gerenciar todos os produtos.
*   **Banco de Dados:** PostgreSQL com TypeORM e migrações.
*   **Validação:** Validação de DTOs com `class-validator` e `ValidationPipe` global.
*   **Segurança:** `helmet` para cabeçalhos de segurança, `bcrypt` para hash de senhas, `ClassSerializerInterceptor` para ocultar campos sensíveis.
*   **Logging:** Logs estruturados com `nestjs-pino`.
*   **Documentação:** Documentação interativa da API com Swagger (OpenAPI).
*   **Testes:** Testes unitários para serviços e testes E2E para fluxos críticos.
*   **Qualidade de Código:** ESLint, Prettier, Husky e Lint-Staged para garantir padrões de código.
*   **CI/CD:** Workflow de GitHub Actions para automação de testes e build.
*   **Healthcheck:** Endpoint `/healthz` para verificar a saúde da aplicação e do banco de dados.

## Tecnologias Utilizadas

*   **Backend:** Node.js, NestJS
*   **Banco de Dados:** PostgreSQL
*   **ORM:** TypeORM
*   **Autenticação:** JWT, Passport.js, bcrypt
*   **Validação:** class-validator, class-transformer
*   **Logging:** nestjs-pino
*   **Documentação:** @nestjs/swagger
*   **Testes:** Jest, Supertest
*   **Qualidade:** ESLint, Prettier, Husky, Lint-Staged
*   **Containerização:** Docker, Docker Compose

## Pré-requisitos

*   Node.js (versão 20 ou superior)
*   npm (gerenciador de pacotes do Node.js)
*   Docker e Docker Compose (para o banco de dados)

## Configuração do Ambiente

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_SEU_REPOSITORIO>
    cd nestjs-crud-api
    ```
    *(Se você já está no diretório do projeto, ignore o `git clone` e `cd`)*

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do projeto (na mesma pasta que `package.json`) e preencha-o com as seguintes variáveis. Você pode copiar o conteúdo de `.env.example`.

    ```
    NODE_ENV=development
    PORT=3000

    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=postgres
    DB_PASSWORD=postgres
    DB_NAME=nest_crud
    DB_SSL=false

    JWT_SECRET=super-secret-change-me
    ACCESS_TOKEN_TTL=15m
    REFRESH_TOKEN_TTL=7d
    ```

4.  **Inicie o banco de dados PostgreSQL com Docker Compose:**
    ```bash
    docker-compose up -d
    ```
    Isso iniciará um container PostgreSQL.

5.  **Execute as migrações do banco de dados:**
    ```bash
    npm run migration:run
    ```
    Isso criará as tabelas `users` e `products` no seu banco de dados.

## Como Rodar a Aplicação

### Modo Desenvolvimento (com hot-reload)

```bash
npm run start:dev
```
A API estará disponível em `http://localhost:3000/v1`.

### Modo Produção

```bash
npm run build
npm run start:prod
```
A API estará disponível em `http://localhost:3000/v1`.

## Documentação da API (Swagger)

Após iniciar a aplicação, acesse a documentação interativa da API em:
`http://localhost:3000/docs`

## Testes

### Testes Unitários

```bash
npm run test
```

### Testes End-to-End (E2E)

Certifique-se de que o banco de dados Docker esteja rodando (`docker-compose up -d`) antes de executar os testes E2E.

```bash
npm run test:e2e
```

### Cobertura de Testes

```bash
npm run test:cov
```

## Gerenciamento de Migrações

*   **Gerar uma nova migração:**
    ```bash
    npm run migration:generate --name=NomeDaSuaMigracao
    ```
    (Substitua `NomeDaSuaMigracao` por um nome descritivo)

*   **Executar migrações pendentes:**
    ```bash
    npm run migration:run
    ```

*   **Reverter a última migração:**
    ```bash
    npm run migration:revert
    ```

## CI/CD (GitHub Actions)

O projeto inclui um workflow de CI/CD configurado em `.github/workflows/ci.yml`. Ele será executado automaticamente em cada `push` ou `pull_request` para as branches `main` e `develop`, realizando:
*   Instalação de dependências.
*   Verificação de lint.
*   Build do projeto.
*   Execução de testes unitários.
*   Execução de testes E2E (com um serviço PostgreSQL dedicado).

---