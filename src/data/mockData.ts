import type { User, WhatsAppLine, Conversation, Message, Contact, DashboardMetrics } from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@empresa.com',
    name: 'Carlos Digital',
    role: 'digital',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'operador1@empresa.com',
    name: 'Maria Silva',
    role: 'operador',
    wallet: 'Cobrança',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'user-3',
    email: 'operador2@empresa.com',
    name: 'João Santos',
    role: 'operador',
    wallet: 'Vendas',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'user-4',
    email: 'operador3@empresa.com',
    name: 'Ana Costa',
    role: 'operador',
    wallet: 'Suporte',
    createdAt: '2024-02-15T00:00:00Z',
  },
  {
    id: 'user-5',
    email: 'operador4@empresa.com',
    name: 'Pedro Oliveira',
    role: 'operador',
    wallet: 'Cobrança',
    createdAt: '2024-03-01T00:00:00Z',
  },
];

// Mock WhatsApp Lines
export const mockLines: WhatsAppLine[] = [
  {
    id: 'line-1',
    instanceId: 'instance-abc123',
    phoneNumber: '+55 11 99999-1111',
    status: 'connected',
    operatorId: 'user-2',
    operatorName: 'Maria Silva',
    connectedAt: '2024-01-20T08:00:00Z',
    lastActivity: new Date().toISOString(),
  },
  {
    id: 'line-2',
    instanceId: 'instance-def456',
    phoneNumber: '+55 11 99999-2222',
    status: 'connected',
    operatorId: 'user-3',
    operatorName: 'João Santos',
    connectedAt: '2024-02-10T09:00:00Z',
    lastActivity: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: 'line-3',
    instanceId: 'instance-ghi789',
    phoneNumber: null,
    status: 'disconnected',
    operatorId: 'user-4',
    operatorName: 'Ana Costa',
    connectedAt: null,
    lastActivity: null,
  },
  {
    id: 'line-4',
    instanceId: 'instance-jkl012',
    phoneNumber: '+55 11 99999-4444',
    status: 'connected',
    operatorId: 'user-5',
    operatorName: 'Pedro Oliveira',
    connectedAt: '2024-03-05T10:00:00Z',
    lastActivity: new Date(Date.now() - 600000).toISOString(),
  },
];

// Mock Contacts - Contexto de Cobrança
export const mockContacts: Contact[] = [
  { id: 'contact-1', phoneNumber: '+55 11 98888-0001', name: 'Carlos Ferreira' },
  { id: 'contact-2', phoneNumber: '+55 11 98888-0002', name: 'Roberto Almeida' },
  { id: 'contact-3', phoneNumber: '+55 11 98888-0003', name: 'Marcela Santos' },
  { id: 'contact-4', phoneNumber: '+55 11 98888-0004', name: 'Fernanda Lima' },
  { id: 'contact-5', phoneNumber: '+55 11 98888-0005', name: 'José Oliveira' },
  { id: 'contact-6', phoneNumber: '+55 11 98888-0006', name: 'Lucas Martins' },
  { id: 'contact-7', phoneNumber: '+55 11 98888-0007', name: 'Juliana Rocha' },
  { id: 'contact-8', phoneNumber: '+55 11 98888-0008', name: 'Paulo Mendes' },
];

// Mock Messages - Contexto de Cobrança
export const mockMessages: Message[] = [
  // Conversation 1 - Negociação de dívida
  {
    id: 'msg-1',
    conversationId: 'conv-1',
    content: 'Boa tarde, estou entrando em contato referente ao débito em aberto no valor de R$ 2.450,00 vencido em 15/02.',
    type: 'text',
    direction: 'SENT',
    timestamp: '2024-03-10T10:00:00Z',
    status: 'READ',
  },
  {
    id: 'msg-2',
    conversationId: 'conv-1',
    content: 'Oi, sim eu sei que está atrasado. Tive problemas financeiros esse mês.',
    type: 'text',
    direction: 'RECEIVED',
    timestamp: '2024-03-10T10:01:00Z',
    status: 'READ',
  },
  {
    id: 'msg-3',
    conversationId: 'conv-1',
    content: 'Entendo perfeitamente. Podemos oferecer condições especiais para regularização. Você prefere parcelar ou tem possibilidade de pagar à vista com desconto?',
    type: 'text',
    direction: 'SENT',
    timestamp: '2024-03-10T10:02:00Z',
    status: 'READ',
  },
  {
    id: 'msg-4',
    conversationId: 'conv-1',
    content: 'Qual seria o desconto à vista?',
    type: 'text',
    direction: 'RECEIVED',
    timestamp: '2024-03-10T10:03:00Z',
    status: 'READ',
  },
  {
    id: 'msg-5',
    conversationId: 'conv-1',
    content: 'Para pagamento à vista, oferecemos 15% de desconto, ficando R$ 2.082,50. O boleto pode ser gerado para vencimento em até 5 dias úteis.',
    type: 'text',
    direction: 'SENT',
    timestamp: '2024-03-10T10:04:00Z',
    status: 'DELIVERED',
  },
  // Conversation 2 - Cliente difícil
  {
    id: 'msg-6',
    conversationId: 'conv-2',
    content: 'Sr. Roberto, identificamos uma pendência de R$ 890,00 referente à fatura de janeiro. Podemos conversar sobre isso?',
    type: 'text',
    direction: 'SENT',
    timestamp: '2024-03-10T09:30:00Z',
    status: 'READ',
  },
  {
    id: 'msg-7',
    conversationId: 'conv-2',
    content: 'Já falei que vou pagar quando puder. Parem de me ligar!',
    type: 'text',
    direction: 'RECEIVED',
    timestamp: '2024-03-10T09:31:00Z',
    status: 'READ',
  },
  {
    id: 'msg-8',
    conversationId: 'conv-2',
    content: 'Entendo sua situação, Sr. Roberto. Estou aqui para ajudar a encontrar uma solução que caiba no seu orçamento. Podemos parcelar em até 6x sem juros. Gostaria de conhecer essa opção?',
    type: 'text',
    direction: 'SENT',
    timestamp: '2024-03-10T09:32:00Z',
    status: 'READ',
  },
  // Conversation 3 - Acordo fechado
  {
    id: 'msg-9',
    conversationId: 'conv-3',
    content: 'Boa tarde, Marcela! Conforme combinado, segue o boleto para quitação do acordo: R$ 1.200,00 em 3x de R$ 400,00.',
    type: 'text',
    direction: 'SENT',
    timestamp: '2024-03-10T14:00:00Z',
    status: 'READ',
  },
  {
    id: 'msg-10',
    conversationId: 'conv-3',
    content: 'Recebi sim, obrigada! Já agendei o pagamento da primeira parcela.',
    type: 'text',
    direction: 'RECEIVED',
    timestamp: '2024-03-10T14:05:00Z',
    status: 'READ',
  },
  {
    id: 'msg-11',
    conversationId: 'conv-3',
    content: 'Perfeito! Após a confirmação do pagamento, enviarei o comprovante de quitação parcial. Qualquer dúvida, estou à disposição.',
    type: 'text',
    direction: 'SENT',
    timestamp: '2024-03-10T14:06:00Z',
    status: 'SENT',
  },
  // Conversation 4 - Confirmação de pagamento
  {
    id: 'msg-12',
    conversationId: 'conv-4',
    content: 'Olá! Confirmo o recebimento do seu pagamento de R$ 650,00. Sua situação está regularizada. Obrigado!',
    type: 'text',
    direction: 'SENT',
    timestamp: '2024-03-10T15:00:00Z',
    status: 'READ',
  },
  {
    id: 'msg-13',
    conversationId: 'conv-4',
    content: 'Que alívio! Obrigada pelo atendimento, vocês foram muito compreensivos.',
    type: 'text',
    direction: 'RECEIVED',
    timestamp: '2024-03-10T15:01:00Z',
    status: 'READ',
  },
  // Conversation 5 - Consulta de débito
  {
    id: 'msg-14',
    conversationId: 'conv-5',
    content: 'Boa tarde, recebi uma carta de cobrança. Podem me explicar do que se trata?',
    type: 'text',
    direction: 'RECEIVED',
    timestamp: '2024-03-10T11:00:00Z',
    status: 'READ',
  },
  {
    id: 'msg-15',
    conversationId: 'conv-5',
    content: 'Claro, Sr. José! Trata-se de uma fatura em aberto do contrato 45892, no valor de R$ 1.850,00, vencida em 28/01. Posso enviar o extrato detalhado?',
    type: 'text',
    direction: 'SENT',
    timestamp: '2024-03-10T11:02:00Z',
    status: 'READ',
  },
  {
    id: 'msg-16',
    conversationId: 'conv-5',
    content: 'Sim, por favor. Não lembro dessa cobrança.',
    type: 'text',
    direction: 'RECEIVED',
    timestamp: '2024-03-10T11:03:00Z',
    status: 'READ',
  },
];

// Mock Conversations
export const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    lineId: 'line-1',
    contact: mockContacts[0],
    lastMessage: mockMessages.find(m => m.id === 'msg-4') || null,
    unreadCount: 0,
    updatedAt: '2024-03-10T10:03:00Z',
  },
  {
    id: 'conv-2',
    lineId: 'line-1',
    contact: mockContacts[1],
    lastMessage: mockMessages.find(m => m.id === 'msg-6') || null,
    unreadCount: 2,
    updatedAt: '2024-03-10T09:31:00Z',
  },
  {
    id: 'conv-3',
    lineId: 'line-2',
    contact: mockContacts[2],
    lastMessage: mockMessages.find(m => m.id === 'msg-8') || null,
    unreadCount: 0,
    updatedAt: '2024-03-10T14:05:00Z',
  },
  {
    id: 'conv-4',
    lineId: 'line-2',
    contact: mockContacts[3],
    lastMessage: mockMessages.find(m => m.id === 'msg-9') || null,
    unreadCount: 1,
    updatedAt: '2024-03-10T15:00:00Z',
  },
  {
    id: 'conv-5',
    lineId: 'line-4',
    contact: mockContacts[4],
    lastMessage: mockMessages.find(m => m.id === 'msg-11') || null,
    unreadCount: 0,
    updatedAt: '2024-03-10T11:02:00Z',
  },
  {
    id: 'conv-6',
    lineId: 'line-4',
    contact: mockContacts[5],
    lastMessage: null,
    unreadCount: 3,
    updatedAt: '2024-03-10T08:00:00Z',
  },
];

// Dashboard Metrics
export const mockMetrics: DashboardMetrics = {
  totalOperators: mockUsers.filter(u => u.role === 'operador').length,
  operatorsOnline: mockLines.filter(l => l.status === 'connected').length,
  activeLines: mockLines.filter(l => l.status === 'connected').length,
  totalMessages: mockMessages.length,
};

// Helper functions
export function getUserByEmail(email: string): User | undefined {
  return mockUsers.find(u => u.email === email);
}

export function getLineByOperatorId(operatorId: string): WhatsAppLine | undefined {
  return mockLines.find(l => l.operatorId === operatorId);
}

export function getConversationsByLineId(lineId: string): Conversation[] {
  return mockConversations.filter(c => c.lineId === lineId);
}

export function getMessagesByConversationId(conversationId: string): Message[] {
  return mockMessages.filter(m => m.conversationId === conversationId);
}

export function getOperators(): User[] {
  return mockUsers.filter(u => u.role === 'operador');
}