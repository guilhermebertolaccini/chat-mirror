// User roles
export type UserRole = 'operador' | 'digital';

// User
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  wallet?: string;
  avatarUrl?: string;
  createdAt: string;
}

// WhatsApp Line
export interface WhatsAppLine {
  id: string;
  instanceId: string;
  phoneNumber: string | null;
  status: 'connected' | 'disconnected' | 'connecting';
  operatorId: string | null;
  operatorName?: string;
  connectedAt: string | null;
  lastActivity: string | null;
}

// Contact
export interface Contact {
  id: string;
  phoneNumber: string;
  name: string;
  avatarUrl?: string;
}

// Message
export interface Message {
  id: string;
  conversationId: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'document';
  direction: 'sent' | 'received';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

// Conversation
export interface Conversation {
  id: string;
  lineId: string;
  contact: Contact;
  lastMessage: Message | null;
  unreadCount: number;
  updatedAt: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalOperators: number;
  operatorsOnline: number;
  activeLines: number;
  totalMessages: number;
}

// Auth context
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}