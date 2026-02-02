

## 📱 WhatsApp Mirror - Plataforma de Espelhamento

Uma plataforma web para monitoramento e gestão de linhas WhatsApp de operadores, com integração via Evolution API.

---

### 🎯 Visão Geral

Sistema de espelhamento que permite ao time Digital monitorar todas as conversas de WhatsApp dos operadores em tempo real, com controle total sobre atribuição de linhas e exportação de históricos.

---

### 👥 Estrutura de Usuários

**Dois níveis de acesso:**
- **Operador**: Acessa a plataforma, escaneia QR code para vincular sua linha
- **Digital (Admin)**: Controle total - visualiza todos os operadores, conversas e gerencia atribuições

---

### 📄 Páginas e Funcionalidades

#### 1. Tela de Login
- Login com email/senha
- Design minimalista e limpo
- Redirecionamento automático baseado no papel (Operador ou Digital)

#### 2. Painel do Operador
- Exibe QR code para escanear e vincular linha WhatsApp
- Status da conexão (conectado/desconectado)
- Informações básicas da linha vinculada
- Botão para desconectar linha (se permitido)

#### 3. Dashboard Digital (Admin)
- **Visão geral**: Cards com métricas (operadores online, linhas ativas, total de mensagens)
- **Lista de operadores**: Todos os operadores com status de conexão
- **Filtros**: Por status (online/offline), por nome
- **Ação rápida**: Clicar em operador abre suas conversas

#### 4. Visualização de Conversas
- Lista de conversas do operador selecionado (estilo WhatsApp)
- Pré-visualização da última mensagem de cada conversa
- Ao clicar, abre o histórico completo do chat
- **Exportar PDF**: Botão para gerar PDF do histórico da conversa
- Busca por contato ou conteúdo de mensagem

#### 5. Painel de Gestão (Admin)
- Tabela com todos os operadores
- Atribuir/remover linhas
- Abrir QR code para vincular linha a um operador
- Desativar/ativar operadores
- Visualizar status de cada linha

---

### 🔧 Recursos Técnicos

- **Backend**:apenas mocado aqui para a primeira apresentação, depois vou usar meu backend node.js
- **Integração**: Evolution API para conexão com WhatsApp
- **Tempo real**: Webhooks da Evolution API para receber mensagens instantaneamente
- **Exportação**: Geração de PDF com html2pdf ou biblioteca similar
- **Segurança**: RLS para isolamento de dados, roles em tabela separada

---

### 🗄️ Estrutura de Dados

- **Usuários**: mocado agora
- **Roles**: Tabela separada (operador/digital)
- **Linhas**: Dados das sessões WhatsApp (instance_id, status, telefone)
- **Mensagens**: Histórico de mensagens com referência à linha
- **Conversas**: Agrupamento de mensagens por contato

---

### 🎨 Design

- **Estilo**: Minimalista e limpo
- **Cores**: Tons neutros com acentos sutis
- **Layout**: Sidebar para navegação, área principal para conteúdo
- **Responsivo**: Funciona bem em desktop (foco principal) e tablets

---

### 📋 Ordem de Implementação

1. **Fase 1**: Setup inicial, autenticação e sistema de roles
2. **Fase 2**: Painel do Operador com QR code (mockup inicial)
3. **Fase 3**: Dashboard Digital e lista de operadores
4. **Fase 4**: Visualização de conversas e chats
5. **Fase 5**: Painel de gestão de operadores e linhas
6. **Fase 6**: Exportação de PDF
7. **Fase 7**: Integração com Evolution API (webhooks e sessões)