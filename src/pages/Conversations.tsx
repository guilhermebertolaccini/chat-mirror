import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { conversationsApi, linesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  ArrowLeft,
  Search,
  FileDown,
  Phone,
  Check,
  CheckCheck,
  Send,
} from 'lucide-react';
import type { Conversation, Message } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useLocation } from 'react-router-dom';

export default function Conversations() {
  const { lineId } = useParams<{ lineId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [conversations, setConversations] = useState<any[]>([]); // Using any to handle mapping diffs
  const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [line, setLine] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Line Details
  useEffect(() => {
    if (lineId) {
      linesApi.getLine(lineId)
        .then(setLine)
        .catch(console.error);
    }
  }, [lineId]);

  // Fetch Conversations List (Polling)
  useEffect(() => {
    if (!lineId) return;

    const fetchConversations = async () => {
      try {
        const data = await conversationsApi.findAll(lineId);
        setConversations(data);

        // Auto-select conversation from router state if available
        if (location.state?.conversationId && data.length > 0) {
          const target = data.find((c: any) => c.id === location.state.conversationId);
          if (target) {
            setSelectedConversation(target);
            // Clear state to prevent re-selection on reload if desired, or keep it.
            // navigate(location.pathname, { replace: true, state: {} });
          }
        }
      } catch (error) {
        console.error("Failed to fetch conversations", error);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [lineId]); // Remove location.state dependency to avoid loops, handle carefully

  // Fetch Full Conversation Details (Messages) when selected + Real-time polling
  useEffect(() => {
    if (!selectedConversation?.id) return;

    const fetchMessages = async () => {
      try {
        const data = await conversationsApi.findOne(selectedConversation.id);
        const newMessages = data.messages || [];

        // Update messages
        setMessages(newMessages);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch messages", error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    setIsLoading(true);
    fetchMessages();

    // Poll every 2.5 seconds for real-time updates
    const interval = setInterval(fetchMessages, 2500);

    return () => clearInterval(interval);
  }, [selectedConversation?.id]);

  const filteredConversations = conversations.filter(conv => {
    const contactName = conv.contactName || conv.remoteJid || 'Desconhecido';
    return contactName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getInitials = (name: string) => {
    return (name || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm', { locale: ptBR });
  };

  const formatDate = (timestamp: string) => {
    return format(new Date(timestamp), "dd 'de' MMMM", { locale: ptBR });
  };

  const handleExportPDF = () => {
    if (!selectedConversation) return;

    // Gerar HTML do PDF mockado (mas com dados reais)
    const contactName = selectedConversation.contactName || selectedConversation.remoteJid;

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Histórico de Conversa - ${contactName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { border-bottom: 2px solid #25D366; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { color: #075E54; margin: 0 0 10px 0; font-size: 24px; }
          .header p { color: #666; margin: 5px 0; font-size: 14px; }
          .message { margin: 15px 0; padding: 12px 16px; border-radius: 8px; max-width: 75%; }
          .message.sent { background: #DCF8C6; margin-left: auto; text-align: right; }
          .message.received { background: #FFFFFF; border: 1px solid #E5E5E5; }
          .message .content { font-size: 14px; color: #333; }
          .message .time { font-size: 11px; color: #999; margin-top: 5px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; text-align: center; }
          .logo { color: #25D366; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📱 Histórico de Conversa</h1>
          <p><strong>Contato:</strong> ${contactName}</p>
          <p><strong>Telefone:</strong> ${selectedConversation.remoteJid}</p>
          <p><strong>Operador:</strong> ${line?.operator?.name || 'N/A'}</p>
          <p><strong>Linha:</strong> ${line?.phoneNumber || 'N/A'}</p>
          <p><strong>Data de exportação:</strong> ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
        </div>
        
        <div class="messages">
          ${messages.map(msg => `
            <div class="message ${msg.direction === 'SENT' ? 'sent' : 'received'}">
              <div class="content">${msg.content}</div>
              <div class="time">${format(new Date(msg.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="footer">
          <p>Documento gerado automaticamente pelo sistema <span class="logo">WhatsApp Mirror</span></p>
          <p>Este relatório contém ${messages.length} mensagem(s) da conversa.</p>
        </div>
      </body>
      </html>
    `;

    // Abrir em nova aba como preview do PDF
    const pdfWindow = window.open('', '_blank');
    if (pdfWindow) {
      pdfWindow.document.write(pdfContent);
      pdfWindow.document.close();
      // Trigger print dialog for PDF save
      setTimeout(() => {
        pdfWindow.print();
      }, 500);
    }
  };

  const MessageStatus = ({ status }: { status: string }) => {
    // Mapping backend status to UI
    // Backend: SENT, DELIVERED, READ (usually uppercase from evolution default)
    // Frontend: sent, delivered, read
    const s = status.toLowerCase();

    if (s === 'sent') return <Check className="h-3 w-3 text-muted-foreground" />;
    if (s === 'delivered') return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    return <CheckCheck className="h-3 w-3 text-primary" />;
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card shrink-0">
        <div className="flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">{line?.operator?.name || 'Carregando...'}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {line?.phoneNumber || 'Sem número'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Conversations List */}
        <div className="w-80 border-r bg-card flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversa..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma conversa encontrada
                </p>
              ) : (
                filteredConversations.map(conv => {
                  const contactName = conv.contactName || conv.remoteJid;
                  const lastMsg = conv.messages && conv.messages[0];

                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${selectedConversation?.id === conv.id
                        ? 'bg-accent'
                        : 'hover:bg-accent/50'
                        }`}
                    >
                      <Avatar className="mt-0.5">
                        <AvatarFallback className="bg-secondary text-sm">
                          {getInitials(contactName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium truncate">{contactName}</p>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {lastMsg && formatTime(lastMsg.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-sm text-muted-foreground truncate">
                            {lastMsg?.content || 'Sem mensagens'}
                          </p>
                          {/* Unread count not yet implemented in backend */}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b bg-card flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-secondary">
                      {getInitials(selectedConversation.contactName || selectedConversation.remoteJid)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedConversation.contactName || selectedConversation.remoteJid}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConversation.remoteJid}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar PDF
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {isLoading ? (
                    <div className="text-center py-4">Carregando mensagens...</div>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma mensagem nesta conversa
                    </p>
                  ) : (
                    messages.map((msg, idx) => {
                      const showDate = idx === 0 ||
                        formatDate(messages[idx - 1].timestamp) !== formatDate(msg.timestamp);
                      const isSent = msg.direction === 'SENT';

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                                {formatDate(msg.timestamp)}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${isSent
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 rounded-br-none'
                                : 'bg-secondary rounded-bl-none'
                                }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <div className={`flex items-center gap-1 mt-1 ${isSent ? 'justify-end' : 'justify-start'
                                }`}>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(msg.timestamp)}
                                </span>
                                {isSent && <MessageStatus status={msg.status} />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {/* Input (disabled - view only) */}
              <div className="p-4 border-t bg-card shrink-0">
                <div className="flex items-center gap-2 max-w-3xl mx-auto">
                  <Input
                    placeholder="Modo de visualização apenas"
                    disabled
                    className="bg-muted"
                  />
                  <Button disabled size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Esta é uma visualização de espelhamento. Envio de mensagens não disponível.
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Selecione uma conversa para visualizar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}