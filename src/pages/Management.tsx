import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi, linesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  ArrowLeft,
  Search,
  QrCode,
  UserMinus,
  UserPlus,
  Phone,
  RefreshCw,
  Eye,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, WhatsAppLine } from '@/types';

export default function Management() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // State
  const [operators, setOperators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'operador' as 'operador' | 'digital',
    wallet: '',
    password: '',
  });

  const fetchOperators = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.findAll();
      // Filter only operators for this view if needed, or show all
      // For now show all users so we can see admins too
      setOperators(data);
    } catch (error) {
      console.error("Failed to fetch operators", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  const filteredOperators = operators.filter(op =>
    op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleOpenQR = (operator: User) => {
    setSelectedOperator(operator);
    setQrDialogOpen(true);
  };

  const handleViewConversations = (lineId: string) => {
    navigate(`/conversations/${lineId}`);
  };

  const handleCreateUser = async () => {
    if (formData.role === 'digital' && !formData.password) {
      alert("Para usuários Digital, a senha é obrigatória.");
      return;
    }

    try {
      setIsLoading(true);
      // 1. Create User
      const newUser = await usersApi.create({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        wallet: formData.wallet,
        password: formData.password
      });

      // 2. Create Line if requested (default true for operators)
      if (formData.role === 'operador' && (formData as any).createLine !== false) {
        const instanceName = `user-${newUser.id.slice(0, 8)}`; // shorter name
        try {
          // Dynamic import to avoid circular dependencies if any, or just standard import usage
          await import("@/lib/api").then(m => m.linesApi.create({
            operatorId: newUser.id,
            instanceName
          }));
        } catch (lineError) {
          console.error("User created but Line failed", lineError);
          alert(`Usuário criado, mas erro ao criar linha: ${(lineError as any).message}`);
        }
      }

      setCreateDialogOpen(false);
      setFormData({ name: '', email: '', role: 'operador', wallet: '', password: '', createLine: true } as any);
      fetchOperators(); // Refresh list
    } catch (error) {
      console.error("Failed to create user", error);
      alert("Erro ao criar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    try {
      await usersApi.delete(id);
      fetchOperators();
    } catch (error) {
      console.error("Failed to delete user", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Gestão de Usuários</h1>
              <p className="text-xs text-muted-foreground">Gerenciar Equipe (Digital e Operadores)</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 px-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Membros da Equipe</CardTitle>
                <CardDescription>
                  Gerencie as linhas WhatsApp de cada operador e crie novos usuários
                </CardDescription>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </div>
            <div className="relative mt-4 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Carteira</TableHead>
                    <TableHead>Linha</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                    </TableRow>
                  ) : filteredOperators.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOperators.map(operator => {
                      // Backend check logic: User -> lines (array)
                      const lines = (operator as any).lines || [];
                      // Find active line or fallback to first
                      const activeLine = lines.find((l: any) => l.status === 'connected') || lines[0];
                      const isConnected = !!lines.find((l: any) => l.status === 'connected');

                      return (
                        <TableRow key={operator.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-secondary text-xs">
                                  {getInitials(operator.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className="cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors group"
                                onClick={() => {
                                  if (activeLine) {
                                    navigate(`/conversations/${activeLine.id}`);
                                  } else {
                                    alert("Este operador não possui linhas vinculadas.");
                                  }
                                }}
                              >
                                <span className="font-medium block group-hover:text-primary transition-colors">{operator.name}</span>
                                <span className="text-xs text-muted-foreground capitalize">{operator.role}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {operator.email}
                          </TableCell>
                          <TableCell>
                            {operator.wallet || '-'}
                          </TableCell>
                          <TableCell>
                            {activeLine?.phoneNumber ? (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {activeLine.phoneNumber}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={isConnected ? 'default' : 'secondary'}
                              className={isConnected ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                            >
                              {isConnected ? 'Conectado' : 'Desconectado'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {/* Chat Button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (activeLine) {
                                    navigate(`/conversations/${activeLine.id}`);
                                  } else {
                                    alert("Sem linhas vinculadas");
                                  }
                                }}
                                title="Ver Conversas"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>

                              {/* Sync Button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                  if (activeLine) {
                                    try {
                                      await linesApi.sync(activeLine.id);
                                      alert("Sincronização realizada com sucesso! Atualizando...");
                                      window.location.reload();
                                    } catch (e) {
                                      alert("Erro ao sincronizar: " + (e as any).message);
                                    }
                                  } else {
                                    alert("Sem linha para sincronizar");
                                  }
                                }}
                                title="Sincronizar Status/Número"
                                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              {/* QR Code functionality usually resides in Operator Panel, but admin might need to see it too */}
                              {/* QR Code / Lines Management Dialog */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenQR(operator)}
                                title="Gerenciar Linhas / QR Code"
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(operator.id)}
                                title="Excluir usuário"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Crie um novo membro da equipe (Operador ou Digital).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Senha {formData.role === 'digital' && <span className="text-red-500">*</span>}</Label>
              <Input
                id="password"
                type="password"
                placeholder={formData.role === 'digital' ? "Obrigatório para login" : "Opcional"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v: any) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operador">Operador (Chat e QR)</SelectItem>
                    <SelectItem value="digital">Digital (Admin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wallet">Carteira (Opcional)</Label>
                <Input
                  id="wallet"
                  value={formData.wallet}
                  onChange={(e) => setFormData({ ...formData, wallet: e.target.value })}
                />
              </div>
            </div>

            {formData.role === 'operador' && (
              <div className="flex items-center space-x-2 bg-secondary/20 p-3 rounded-md border">
                <input
                  type="checkbox"
                  id="create-line"
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  checked={(formData as any).createLine !== false}
                  onChange={(e) => setFormData({ ...formData, createLine: e.target.checked } as any)}
                />
                <Label htmlFor="create-line" className="text-sm font-medium cursor-pointer">
                  Criar Instância WhatsApp automaticamente
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code / Lines Management Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerenciar Linhas WhatsApp</DialogTitle>
            <DialogDescription>
              Vincule novas linhas e veja o status das conexões.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6 py-4">
            {selectedOperator && (() => {
              const lines = (selectedOperator as any).lines || [];

              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Linhas Ativas ({lines.length})</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          setIsLoading(true);
                          const instanceName = `user-${selectedOperator.id.slice(0, 4)}-${Date.now().toString().slice(-4)}`;
                          await import("@/lib/api").then(m => m.linesApi.create({
                            operatorId: selectedOperator.id,
                            instanceName
                          }));
                          await fetchOperators(); // Refresh to show new line
                          // Re-find the updated operator to update local state passed to this render?
                          // Actually fetchOperators updates `operators`. We need to update `selectedOperator` too or just close/reopen?
                          // Better: Find updated operator in new list
                          const updatedOps = await usersApi.findAll();
                          setOperators(updatedOps);
                          const updatedSel = updatedOps.find(o => o.id === selectedOperator.id);
                          if (updatedSel) setSelectedOperator(updatedSel);

                        } catch (e) {
                          console.error(e);
                          alert("Erro ao criar nova linha");
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Nova Linha
                    </Button>
                  </div>

                  {lines.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground mb-2">Nenhuma linha vinculada.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 max-h-[60vh] overflow-y-auto">
                      {lines.map((line: any) => (
                        <div key={line.id} className="border rounded-lg p-4 bg-card">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="font-medium text-sm">{line.instanceName}</p>
                              <p className="text-xs text-muted-foreground">{line.phoneNumber || "Sem número"}</p>
                            </div>
                            <Badge variant={line.status === 'connected' ? 'default' : 'secondary'}
                              className={line.status === 'connected' ? 'bg-emerald-500' : ''}>
                              {line.status === 'connected' ? 'Conectado' : 'Desconectado'}
                            </Badge>
                          </div>

                          <QRCodeViewer lineId={line.id} instanceName={line.instanceName} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}

// Sub-component for QR Code viewing
function QRCodeViewer({ lineId, instanceName }: { lineId: string, instanceName: string }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const fetchQR = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const data = await import("@/lib/api").then(m => m.linesApi.getQrCode(lineId));

      const code = data.base64 || data.qrcode?.base64 || (typeof data === 'string' && data.startsWith('data:') ? data : null);

      if (code) {
        setQrCode(code);
        setIsConnected(false);
      } else {
        if (data.status === 'open' || data.state === 'open' || data.status === 'connected') {
          setQrCode(null);
          setIsConnected(true);
          setError("");
        } else {
          setError("QR Code não disponível (Verifique se já está conectado)");
        }
      }
    } catch (e) {
      console.error(e);
      // Don't clear QR code on transient error if we already have one
      if (!silent) setError("Erro ao carregar QR Code");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchQR();
    // Poll every 3 seconds to check if connected
    const interval = setInterval(() => {
      fetchQR(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [lineId]);

  if (isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800 w-full animate-in fade-in zoom-in duration-300">
        <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mb-1">Linha Conectada!</h3>
        <p className="text-emerald-600/80 dark:text-emerald-400/80 text-sm mb-4">O WhatsApp foi vinculado com sucesso.</p>
        <p className="text-xs text-muted-foreground">Instância: {instanceName}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center w-full">
      {loading && !qrCode ? (
        <div className="w-64 h-64 flex items-center justify-center bg-secondary/20 rounded-lg">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : qrCode ? (
        <div className="space-y-4 text-center">
          <img src={qrCode} alt="QR Code" className="w-64 h-64 border rounded-lg shadow-sm" />
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md text-sm font-medium animate-pulse">
            Aguardando leitura do QR Code...
          </div>
        </div>
      ) : (
        <div className="w-64 h-64 flex items-center justify-center bg-secondary/20 rounded-lg border-2 border-dashed">
          <div className="text-center p-4">
            <QrCode className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">{error || "Aguardando..."}</p>
          </div>
        </div>
      )}

      <Button variant="outline" size="sm" onClick={() => fetchQR(false)} className="mt-4" disabled={loading}>
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Verificar Status Agora
      </Button>

      <p className="text-xs text-muted-foreground mt-2">Instância: {instanceName}</p>
    </div>
  );
}