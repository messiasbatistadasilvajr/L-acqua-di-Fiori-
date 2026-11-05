# L'acqua di Fiori — Ecossistema Digital de Comércio e Vendas pelo WhatsApp

Plataforma profissional de comércio eletrônico conversacional e gestão multiunidade da perfumaria **L'acqua di Fiori**, combinando loja virtual de luxo mobile-first, assistente de inteligência artificial comercial para consultoria olfativa, fechamento de pedidos com registro prévio em banco de dados e despacho estruturado para o WhatsApp da filial escolhida, além de um painel administrativo completo (RBAC) com controle rigoroso de estoque e indicadores de vendas.

---

## Decisões Confirmadas com o Usuário

> [!IMPORTANT]
> **Definições alinhadas na Etapa 1:**
> - **IA Comercial**: Consultora olfativa virtual integrada ao catálogo (recomendações por notas, ocasião, presentes e perfil sensorial) + gerador de mensagens estruturadas para WhatsApp.
> - **Arquitetura de Dados**: Backend Express Full-Stack com persistência robusta, schemas relacionais completos (compatíveis com Prisma ORM / PostgreSQL) e validações seguras.
> - **Dados Iniciais de Demonstração**: 3 filiais ativas pré-configuradas (Matriz Jardins SP, Filial Savassi BH e Filial Leblon RJ) com estoque individualizado e catálogo de fragrâncias clássicas da L'acqua di Fiori (Ladro, Vezzo, Ototemo, Piercing, H2O, Cupidon, etc.).

---

## 1. Arquitetura Geral do Sistema

O sistema é desenhado em uma arquitetura moderna e escalável, unindo o catálogo de alta performance (Vite + React 19 + Tailwind CSS) a um servidor Node.js/Express com API REST tipada, isolamento multitenant por filial, integração com Gemini 3.8 Flash para consultoria de fragrâncias e PWA instalável.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENTE / NAVEGADOR                                  │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │   Loja PWA / Catálogo  │  │ Consultora Virtual IA  │  │   Painel Administrativo  │  │
│  │  - Vitrine & Filtros   │  │ - Recomendações Notas  │  │  - Dashboard & Relatórios│  │
│  │  - Seletor de Filial   │  │ - Sugestões de Presente│  │  - Gestão de Estoque     │  │
│  │  - Carrinho & Checkout │  │ - Transição WhatsApp   │  │  - Pedidos & Filiais     │  │
│  └───────────┬────────────┘  └───────────┬────────────┘  └────────────┬─────────────┘  │
└──────────────┼───────────────────────────┼────────────────────────────┼────────────────┘
               │                           │                            │
               ▼                           ▼                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND FULL-STACK (NODE.JS + EXPRESS)                      │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Middlewares: CORS, Rate Limiting, Helmet Headers, Auth JWT, RBAC & Branch Guard  │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌──────────────────────────┐  │
│  │   Módulo Catálogo      │  │    Módulo IA Comercial │  │   Módulo Administrativo  │  │
│  │ - Produtos & Variações │  │ - Google GenAI SDK     │  │ - Estoque & Transferência│  │
│  │ - Estoque por Filial   │  │ - Gemini 3.8 Flash     │  │ - Pedidos & Histórico    │  │
│  │ - Cupons & Promoções   │  │ - Grounding de Catálogo│  │ - Multi-Filiais & Audit  │  │
│  └───────────┬────────────┘  └───────────┬────────────┘  └────────────┬─────────────┘  │
│              │                           │                            │                │
│              ▼                           ▼                            ▼                │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Camada de Dados: Relacional / Prisma Schema & Repositório com Transações Atômicas│  │
│  │ (Reserva de estoque, baixa idempotente, logs de auditoria e conformidade LGPD)    │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬────────────────────────────┬────────────────────────────┘
                               │                            │
                               ▼                            ▼
                 ┌──────────────────────────┐ ┌──────────────────────────┐
                 │ WhatsApp Business API /  │ │  Google GenAI Platform   │
                 │ Links Click-to-Chat      │ │     (Gemini 3.8 Flash)   │
                 │ Formatados com Pedido    │ │                          │
                 └──────────────────────────┘ └──────────────────────────┘
```

### Fluxo de Fechamento de Venda no WhatsApp:
1. O cliente escolhe os produtos e seleciona a filial mais próxima ou de sua preferência.
2. No Checkout, preenche nome, telefone, endereço/retirada e forma de pagamento.
3. O frontend envia `POST /api/orders` para o backend Express.
4. O backend valida a disponibilidade de estoque real da filial escolhida, registra o pedido com status `NOVO_PEDIDO`, deduz/reserva o estoque temporariamente e retorna o `id` e o `código legível` do pedido (ex: `#LDF-2026-0042`).
5. O sistema gera uma mensagem profissional formatada com quebra de linhas, resumo de itens, filial, valores e link de acompanhamento, abrindo a conversa oficial no WhatsApp da filial.
6. O status do pedido só avança para `CONFIRMADO` no painel administrativo quando o atendente/gerente validar o pagamento com o cliente.

---

## 2. Estrutura de Pastas Profissional

```
/
├── index.html                  # Entrypoint com PWA meta tags e tipografia de luxo
├── metadata.json               # Configurações do AI Studio Build e Capabilities
├── package.json                # Dependências frontend e backend
├── tsconfig.json               # Configuração TypeScript
├── vite.config.ts              # Vite com PWA Plugin e aliases
│
├── server/                     # BACKEND FULL-STACK (Express + TypeScript)
│   ├── index.ts                # Inicialização do servidor Express na porta 3000
│   ├── routes/                 # Rotas da API REST
│   │   ├── auth.routes.ts      # Login, logout, perfil, recuperação de senha
│   │   ├── products.routes.ts  # CRUD produtos, variações, filtros
│   │   ├── branches.routes.ts  # Gestão de filiais e horários
│   │   ├── inventory.routes.ts # Estoque multiunidade, entradas, transferências
│   │   ├── orders.routes.ts    # Criação de pedidos, status, cancelamentos
│   │   ├── ai.routes.ts        # Consultoria olfativa via Gemini 3.8 Flash
│   │   ├── coupons.routes.ts   # Cupons e campanhas promocionais
│   │   └── reports.routes.ts   # Relatórios de vendas e exportações CSV
│   ├── middleware/             # Middlewares de segurança
│   │   ├── auth.middleware.ts  # Validação de token JWT
│   │   ├── rbac.middleware.ts  # Controle de acesso por perfil
│   │   └── branch.guard.ts     # Isolamento de dados entre filiais
│   ├── services/               # Lógica de negócio e integrações
│   │   ├── gemini.service.ts   # Integração segura com @google/genai
│   │   ├── whatsapp.service.ts # Geração de links e mensagens estruturadas
│   │   └── order.service.ts    # Transações de estoque e regras de pedido
│   ├── db/                     # Banco de dados
│   │   ├── schema.prisma       # Definição canônica do modelo relacional
│   │   ├── db.ts               # Conexão e repositório com integridade transacional
│   │   └── seeds.ts            # Dados de demonstração (3 filiais + perfumes clássicos)
│   └── types/                  # Tipos TypeScript compartilhados
│
└── src/                        # FRONTEND (React 19 + Tailwind CSS)
    ├── main.tsx                # Bootstrap da aplicação
    ├── App.tsx                 # Roteador principal (Loja Pública vs Admin)
    ├── index.css               # Design System (Preto, Dourado Champagne, Bege)
    │
    ├── components/             # Componentes de UI
    │   ├── layout/             # Header com Top Bar Contract, Footer e Top Banner
    │   ├── storefront/         # Vitrine de produtos, carrossel e hero
    │   ├── product/            # Card de perfume, modal de detalhes olfativos
    │   ├── cart/               # Drawer do carrinho e cálculo de frete
    │   ├── checkout/           # Formulário de checkout e integração WhatsApp
    │   ├── ai/                 # Assistente Olfativo L'acqua di Fiori (Chat Flutuante)
    │   ├── pwa/                # Botão de instalação PWA e status offline
    │   └── admin/              # Componentes do Dashboard Administrativo
    │       ├── DashboardStats.tsx   # Faturamento, pedidos e alertas
    │       ├── ProductManager.tsx   # Cadastro e edição de produtos
    │       ├── InventoryManager.tsx # Controle de estoque por filial
    │       ├── OrderKanban.tsx      # Gestão de pedidos e fluxo WhatsApp
    │       ├── BranchManager.tsx    # Gestão de unidades e filiais
    │       └── ReportExporter.tsx   # Relatórios e exportação CSV
    │
    ├── context/                # Estados globais
    │   ├── CartContext.tsx     # Itens, filial selecionada, cupons
    │   ├── BranchContext.tsx   # Filial ativa e endereços
    │   └── AuthContext.tsx     # Sessão administrativa e permissões RBAC
    │
    └── services/               # Clientes HTTP para comunicação com /api
        └── api.ts
```

---

## 3. Modelo Inicial do Banco de Dados (Schema Relacional)

Definição em formato relacional / Prisma Schema:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN_GERAL
  GERENTE_FILIAL
  FUNCIONARIO
  ESTOQUISTA
  ATENDENTE
}

enum OrderStatus {
  NOVO_PEDIDO
  AGUARDANDO_CONFIRMACAO
  CONFIRMADO
  EM_PREPARACAO
  PRONTO_RETIRADA
  SAIU_ENTREGA
  CONCLUIDO
  CANCELADO
}

enum DeliveryType {
  ENTREGA_DELIVERY
  RETIRADA_LOJA
}

model Branch {
  id          String   @id @default(uuid())
  name        String   // Ex: L'acqua di Fiori - Jardins SP
  code        String   @unique // JARDINS_SP
  address     String
  city        String
  state       String
  phone       String
  whatsapp    String   // Número com DDI e DDD (ex: 5511999999999)
  openingHours String  // Ex: Seg-Sáb 10h às 22h, Dom 14h às 20h
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  inventories Inventory[]
  orders      Order[]
  users       User[]
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role     @default(ATENDENTE)
  branchId     String?
  branch       Branch?  @relation(fields: [branchId], references: [id])
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())

  auditLogs    AuditLog[]
}

model Category {
  id          String    @id @default(uuid())
  name        String    @unique // Perfumes Femininos, Masculinos, etc.
  slug        String    @unique
  description String?
  products    Product[]
}

model Product {
  id              String      @id @default(uuid())
  sku             String      @unique // Ex: LDF-LAD-100
  name            String      // Ex: Ladro Desodorante Colônia
  brand           String      @default("L'acqua di Fiori")
  categoryId      String
  category        Category    @relation(fields: [categoryId], references: [id])
  description     String
  olfactoryFamily String      // Ex: Amadeirado Especiado, Floral Frutal
  topNotes        String      // Notas de topo/saída
  heartNotes      String      // Notas de corpo/coração
  baseNotes       String      // Notas de fundo
  volume          String      // Ex: 100ml, 50ml
  originalPrice   Decimal     @db.Decimal(10, 2)
  promotionalPrice Decimal?   @db.Decimal(10, 2)
  imageUrl        String
  isFeatured      Boolean     @default(false)
  isBestSeller    Boolean     @default(false)
  isLaunch        Boolean     @default(false)
  isActive        Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  inventories     Inventory[]
  orderItems      OrderItem[]
}

model Inventory {
  id          String   @id @default(uuid())
  branchId    String
  branch      Branch   @relation(fields: [branchId], references: [id])
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  quantity    Int      @default(0)
  minAlert    Int      @default(5) // Alerta de estoque baixo
  updatedAt   DateTime @updatedAt

  movements   StockMovement[]

  @@unique([branchId, productId])
}

model StockMovement {
  id          String   @id @default(uuid())
  inventoryId String
  inventory   Inventory @relation(fields: [inventoryId], references: [id])
  type        String   // ENTRADA, SAIDA_VENDA, AJUSTE, TRANSFERENCIA
  quantity    Int
  notes       String?
  createdAt   DateTime @default(now())
}

model Customer {
  id           String   @id @default(uuid())
  name         String
  phone        String   @unique
  email        String?
  address      String?
  city         String?
  state        String?
  lgpdConsent  Boolean  @default(true)
  totalSpent   Decimal  @default(0) @db.Decimal(10, 2)
  ordersCount  Int      @default(0)
  lastOrderAt  DateTime?
  createdAt    DateTime @default(now())

  orders       Order[]
}

model Order {
  id           String       @id @default(uuid())
  orderNumber  String       @unique // Ex: LDF-2026-0001
  branchId     String
  branch       Branch       @relation(fields: [branchId], references: [id])
  customerId   String
  customer     Customer     @relation(fields: [customerId], references: [id])
  status       OrderStatus  @default(NOVO_PEDIDO)
  deliveryType DeliveryType @default(RETIRADA_LOJA)
  deliveryAddress String?
  subtotal     Decimal      @db.Decimal(10, 2)
  discount     Decimal      @default(0) @db.Decimal(10, 2)
  deliveryFee  Decimal      @default(0) @db.Decimal(10, 2)
  total        Decimal      @db.Decimal(10, 2)
  paymentMethod String      // PIX, CARTAO_CREDITO, CARTAO_DEBITO, DINHEIRO
  couponCode   String?
  notes        String?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  items        OrderItem[]
}

model OrderItem {
  id        String   @id @default(uuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  quantity  Int
  unitPrice Decimal  @db.Decimal(10, 2)
  total     Decimal  @db.Decimal(10, 2)
}

model Coupon {
  id          String   @id @default(uuid())
  code        String   @unique // Ex: BEMVINDO10
  discountType String  // PERCENTUAL, FIXO
  value       Decimal  @db.Decimal(10, 2)
  minOrder    Decimal  @default(0) @db.Decimal(10, 2)
  validUntil  DateTime
  usageLimit  Int?
  usageCount  Int      @default(0)
  isActive    Boolean  @default(true)
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String   // Ex: ATUALIZOU_ESTOQUE, ALTEROU_PRECO
  details   String
  createdAt DateTime @default(now())
}
```

---

## 4. Mapa de Navegação

### Visão do Cliente (Loja Pública Mobile & Desktop)
- **Topo**: Barra de anúncio de frete grátis/promoção + Top Bar elegante (Logo L'acqua di Fiori, links: *Fragrâncias, Cuidados, Presentes, Nossas Lojas*, Seletor de Filial Ativa, Busca Rápida, Carrinho com contador e Botão PWA).
- **Home**:
  - Hero Banner de alta perfumaria com CTA *"Explorar Coleção"*.
  - Filtro interativo por Família Olfativa e Categorias.
  - Vitrine *"Mais Vendidos & Clássicos"* (Ladro, Vezzo, Ototemo, etc.).
  - Banner especial *"Presentes & Kits Exclusivos"*.
  - Seção de Procedência & Avaliações de Clientes.
- **Catálogo & Busca**:
  - Filtros laterais (Preço, Família Olfativa, Gênero, Filial, Disponibilidade imediata).
  - Ordenação por relevância, menor/maior preço e lançamentos.
- **Página de Detalhe do Produto (PDP)**:
  - Galeria de imagens, pirâmide olfativa (Notas de Topo, Coração e Fundo), volume, preço e parcelamento.
  - Indicador de estoque na filial selecionada.
  - Botão *"Adicionar à Sacola"* e botão rápido *"Comprar pelo WhatsApp"*.
- **Sacola de Compras & Checkout**:
  - Drawer deslizante com itens, cálculo de subtotal, campo de cupom e seletor de filial.
  - Checkout em 2 passos (Dados de contato / Endereço / Pagamento).
  - Confirmação com número do pedido e botão de despacho para WhatsApp.
- **Assistente Olfativo IA (Flutuante)**:
  - Janela de chat elegante para consultoria de aromas, busca por humor/ocasião e presentes, com link direto para colocar o perfume na sacola.

### Visão Administrativa (Painel de Controle RBAC)
- **Autenticação**: Login seguro com seleção de filial (se aplicável ao perfil).
- **Dashboard Geral**:
  - Indicadores em tempo real: Vendas do dia, ticket médio, pedidos pendentes e estoque crítico.
  - Comparativo de vendas entre filiais.
- **Gestão de Produtos**:
  - Cadastro de perfumes com pirâmide olfativa, variações de volume e fotos.
  - Ativação/desativação e edição rápida de preços.
- **Gestão de Estoque Multiunidade**:
  - Visão matricial (Produto x Filial).
  - Entradas, saídas manuais e transferências entre lojas.
  - Alertas visuais de estoque baixo.
- **Gestão de Pedidos (Kanban & Lista)**:
  - Colunas: *Novo Pedido $\to$ Aguardando Confirmação $\to$ Em Preparação $\to$ Pronto/Enviado $\to$ Concluído*.
  - Acesso direto ao histórico e botão para abrir conversa com o cliente no WhatsApp com mensagem de status pré-formatada.
- **Clientes & Fidelidade**:
  - Lista de clientes, histórico de compras, consentimento LGPD e botão de contato comercial.
- **Cupons & Promoções**:
  - Criação de cupons percentuais ou de valor fixo com validade.
- **Filiais & Equipe**:
  - Gestão dos dados das lojas e usuários com seus perfis (Admin, Gerente, Atendente).
- **Relatórios**:
  - Desempenho por período, curva ABC de produtos e exportação em CSV.

---

## 5. Desenho das Telas Principais (Wireframes Conceituais)

### A. Loja Virtual — Vitrine & Topo (Aparência Preto, Dourado Champagne & Bege)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Frete Grátis acima de R$ 199 | Compre e receba hoje na sua região via WhatsApp]  [✕] │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  L'ACQUA DI FIORI        Perfumes Femininos   Perfumes Masculinos   Presentes   Lojas  │
│  [Ícone Elegante]        [Buscar fragrâncias...]   [📍 Filial: Jardins SP]  [🛍️ Sacola (2)]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│     A ESSÊNCIA DA ALTA PERFUMARIA BRASILEIRA                                           │
│     Clássicos atemporais, fragrâncias marcantes e momentos inesquecíveis.              │
│                                                                                        │
│     [ Explorar Catálogo ]       [ 💬 Consultora Olfativa IA ]                          │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  FAMÍLIAS:  [Todos]  [Florais]  [Amadeirados]  [Orientais]  [Cítricos]  [Kits Presente]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌────────────────────────┐      │
│  │ [Foto Studio 4:3]     │  │ [Foto Studio 4:3]     │  │ [Foto Studio 4:3]      │      │
│  │ L'ACQUA DI FIORI      │  │ L'ACQUA DI FIORI      │  │ L'ACQUA DI FIORI       │      │
│  │ Ladro Colônia 100ml   │  │ Vezzo Colônia 100ml   │  │ Ototemo Deep 100ml     │      │
│  │ Amadeirado Especiado  │  │ Amadeirado Aromático  │  │ Floral Oriental        │      │
│  │ R$ 179,90             │  │ R$ 189,90             │  │ R$ 169,90              │      │
│  │ [📍 Em estoque Jardins]│  │ [📍 Em estoque Jardins]│  │ [📍 Em estoque Jardins] │      │
│  │ [ + Adicionar ] [ 💬 ]│  │ [ + Adicionar ] [ 💬 ]│  │ [ + Adicionar ] [ 💬 ] │      │
│  └───────────────────────┘  └───────────────────────┘  └────────────────────────┘      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### B. Checkout com Fechamento pelo WhatsApp

```
┌────────────────────────────────────────────────────────────────────────┐
│  FINALIZAÇÃO DO PEDIDO — L'ACQUA DI FIORI                              │
├────────────────────────────────────────────────────────────────────────┤
│  1. Filial de Atendimento:                                             │
│     (●) Filial Jardins SP — Rua Oscar Freire, 1200                     │
│     ( ) Filial Savassi BH — Rua Tomé de Souza, 800                     │
│     ( ) Filial Leblon RJ — Av. Ataulfo de Paiva, 400                   │
│                                                                        │
│  2. Seus Dados:                                                        │
│     Nome Completo: [ Mariana Silveira             ]                    │
│     WhatsApp:      [ (11) 98765-4321              ]                    │
│     Entrega:       [●] Retirada na Loja   [ ] Envio Delivery           │
│     Pagamento:     [●] PIX   [ ] Cartão de Crédito   [ ] Na Entrega    │
│                                                                        │
│  3. Resumo da Sacola:                                                  │
│     - 1x Ladro Desodorante Colônia 100ml ........ R$ 179,90            │
│     - 1x Hidratante Corporal Vezzo 200ml ........ R$  69,90            │
│     Cupom: [ BEMVINDO10 ] (-R$ 24,98)                                  │
│     TOTAL A PAGAR: R$ 224,82                                           │
│                                                                        │
│  [  CONFIRMAR PEDIDO E ENVIAR PARA O WHATSAPP DA LOJA  ]              │
│  (O pedido será gerado em nosso sistema antes do encaminhamento)       │
└────────────────────────────────────────────────────────────────────────┘
```

### C. Painel Administrativo — Dashboard e Gestão de Pedidos

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ L'ACQUA DI FIORI | PAINEL ADMINISTRATIVO                    [Filial: Todas] [Admin] 👤 │
├──────────────┬─────────────────────────────────────────────────────────────────────────┤
│ 📊 Dashboard │  FATURAMENTO HOJE      PEDIDOS HOJE     ESTOQUE CRÍTICO   TICKET MÉDIO  │
│ 🧴 Produtos   │  R$ 4.890,00           23 pedidos       4 itens           R$ 212,60     │
│ 📦 Estoque    ├─────────────────────────────────────────────────────────────────────────┤
│ 📋 Pedidos   │  FLUXO DE PEDIDOS (KANBAN)                                              │
│ 🏬 Filiais    │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌──────────────┐│
│ 👥 Clientes   │  │ NOVOS (3)     │ │ CONFIRMADOS(5)│ │ PREPARANDO(4) │ │ PRONTO (6)   ││
│ 🏷️ Cupons     │  │ #LDF-0042     │ │ #LDF-0039     │ │ #LDF-0038     │ │ #LDF-0035    ││
│ 📈 Relatórios │  │ Mariana Silv. │ │ Carlos Eduardo│ │ Juliana Costa │ │ Rodrigo Dias ││
│              │  │ R$ 224,82     │ │ R$ 189,90     │ │ R$ 349,80     │ │ R$ 179,90    ││
│              │  │ [WhatsApp] 💬  │ │ [WhatsApp] 💬  │ │ [WhatsApp] 💬  │ │ [WhatsApp] 💬 ││
│              │  └───────────────┘ └───────────────┘ └───────────────┘ └──────────────┘│
└──────────────┴─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Plano de Desenvolvimento do MVP (Etapa por Etapa)

O desenvolvimento será executado de forma modular, permitindo testes rigorosos e compilação a cada avanço:

- **ETAPA 1 — Arquitetura e Configuração Base**:
  - Configuração do Vite com PWA (`vite-plugin-pwa`) e Tailwind CSS v4.
  - Setup do servidor Express com roteador REST, rotas `/api/*` e proxy integrado.
  - Tipagem completa TypeScript para produtos, estoque, pedidos e filiais.
  
- **ETAPA 2 — Design System e Identidade Visual L'acqua di Fiori**:
  - Paleta de cores de luxo: Preto nobre (`#121212`, `#18181b`), Dourado Champagne (`#c5a059`, `#dfba73`), Bege/Nude suave (`#fbf9f5`, `#f5f0e8`) e Branco puro.
  - Tipografia de alta perfumaria (Serif display refinado + sans-serif legível).
  - Componentes de Top Bar Contract, Footer institucional e banners promocionais.

- **ETAPA 3 — Catálogo de Produtos e Pirâmide Olfativa**:
  - Cadastro das fragrâncias icônicas (Ladro, Vezzo, Ototemo, H2O, Cupidon, Hit, Evolution).
  - Filtros por família olfativa, notas, gênero, faixa de preço e busca em tempo real.
  - Modal e página de detalhes do produto com pirâmide olfativa completa e imagens geradas em estúdio de luxo.

- **ETAPA 4 — Carrinho, Multiunidade e Checkout com WhatsApp**:
  - Contexto de carrinho com adição, remoção, alteração de quantidade e cálculo automático de descontos por cupom.
  - Seletor inteligente de filial (Jardins SP, Savassi BH, Leblon RJ) com cálculo de frete ou retirada presencial.
  - Checkout validado com persistência prévia do pedido no backend antes do despacho.
  - Formatação precisa da mensagem comercial para envio ao WhatsApp da filial.

- **ETAPA 5 — Backend REST e Repositório Transacional**:
  - Endpoints REST para autenticação, catálogo, inventário e pedidos.
  - Validação de estoque atômico para impedir vendas sem disponibilidade.
  - Armazenamento em memória estruturado com persistência em arquivo/JSON e schema canônico Prisma para transição PostgreSQL.

- **ETAPA 6 — Painel Administrativo Completo com RBAC**:
  - Autenticação com perfis: Administrador Geral, Gerente de Filial e Atendente.
  - Dashboard interativo com gráficos e KPIs comerciais.
  - Gestão de produtos, controle de estoque com transferências entre filiais e gestão de pedidos em Kanban.
  - Exportação de relatórios em CSV.

- **ETAPA 7 — Consultora Olfativa Virtual IA (Gemini 3.8 Flash)**:
  - Assistente comercial no catálogo que analisa o gosto do cliente e sugere perfumes com base nas notas olfativas reais dos produtos cadastrados.
  - Recomendações de presentes por perfil e ocasião.
  - Botão de transferência da consultoria diretamente para o WhatsApp de um atendente humano.

- **ETAPA 8 — PWA e Polimento Final**:
  - Web App Manifest configurado, service worker para funcionamento offline, botões de instalação para Android e iOS Safari.
  - Auditoria de acessibilidade, responsividade mobile-first e testes ponta a ponta.

---

## 7. Plano de Evolução para a Versão Completa

1. **WhatsApp Cloud API Oficial**:
   - Transição do modelo Click-to-Chat para a WhatsApp Business Platform oficial da Meta, recebendo webhooks de status de entrega (`sent`, `delivered`, `read`) e mensagens de confirmação automática.
2. **Cloud SQL PostgreSQL + Prisma Migrations**:
   - Provisionamento e execução de migrações em banco de dados relacional Cloud SQL PostgreSQL em nuvem para alta escala e milhares de filiais simultâneas.
3. **Gateway de Pagamento Integrado (PIX Copia e Cola / Cartão)**:
   - Integração com gateways (Mercado Pago, Asaas ou Pagar.me) para confirmação de pagamento instantânea via Webhook antes do despacho.
4. **Programa de Fidelidade e Cashback**:
   - Pontuação por compra realizada e acúmulo de créditos na filial preferida do cliente.
5. **Rastreamento de Entregas em Tempo Real**:
   - Módulo para motoboys e entregadores locais com assinatura digital e envio de link de rastreamento no WhatsApp do cliente.

---

## 8. Status de Publicação e Prontidão de Lançamento (Produção Imediata)

✅ **Prontidão de Lançamento Concluída com Sucesso:**
1. **Infraestrutura Gratuita Ativa**: Execução em container Node.js/Express + Vite com custo zero.
2. **Persistência de Dados em Disco**: Banco de dados estruturado em `./data/store.json` com escrita atômica garantindo que produtos, pedidos, cupons e clientes permaneçam salvos após qualquer reinicialização.
3. **Autenticação Criptografada no Backend**:
   - Senhas protegidas com PBKDF2 (SHA-512, 100.000 iterações e salt criptográfico).
   - Sessões autenticadas por HMAC-SHA256 Bearer tokens.
   - Rotas administrativas e mutações protegidas por middleware `requireAuth` e RBAC (`requireRole`).
4. **Proteção Contra Fórmulas Maliciosas em CSV**: Sanitização estrita de caracteres (`=`, `+`, `-`, `@`, `\t`, `\r`) na exportação de pedidos.
5. **Rate Limiting em Memória**: Proteção ativa contra abuso de requisições na IA Gemini, criação de pedidos e login.
6. **Experiência do Cliente & Estoque**:
   - Horário oficial atualizado: **Segunda a Sábado das 08:00 às 17:00**.
   - Notação de estoque substituída por *"Disponibilidade confirmada pela loja"*, respeitando o sistema de controle físico existente.
   - WhatsApp oficial de Fortaleza: `(85) 99660-5034` com mensagens formatadas com quebras de linha e dados completos do pedido.
   - Consultora olfativa com direcionamento automático para a vitrine e WhatsApp, mantendo fallback de alta perfumaria caso o modelo Gemini não responda.

