import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  MessageSquare,
  LogOut,
  Users,
  Wifi,
  WifiOff,
  MessageCircle,
  Search,
  Settings,
  ChevronRight,
  Phone,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User } from '@/types';

export default function DigitalDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');

  // Real Data State
  const [metrics, setMetrics] = useState({
    totalOperators: 0,
    operatorsOnline: 0,
    activeLines: 0,
    totalMessages: 0,
  });

  // Operators with enriched status and currentLine info from API
  const [operators, setOperators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsData, operatorsData] = await Promise.all([
          dashboardApi.getMetrics(),
          dashboardApi.getOperators(),
        ]);
        setMetrics(metricsData);
        setOperators(operatorsData);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Polling every 5 seconds for real-time updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get unique wallets
  // operators might be empty initially, so safe check
  const wallets = Array.from(new Set(operators.map(op => op.wallet).filter(Boolean))) as string[];

  // Filter operators
  const filteredOperators = operators.filter(op => {
    // Search by name, email or phone number
    const searchLower = searchTerm.toLowerCase();
    const phoneMatch = op.currentLine?.phoneNumber?.includes(searchTerm) || false;
    const matchesSearch = op.name.toLowerCase().includes(searchLower) ||
      op.email.toLowerCase().includes(searchLower) ||
      phoneMatch;

    const opStatus = op.status || 'offline';
    // Status filter
    if (statusFilter === 'online' && opStatus !== 'online') return false;
    if (statusFilter === 'offline' && opStatus !== 'offline') return false;

    // Wallet filter
    if (walletFilter !== 'all' && op.wallet !== walletFilter) return false;

    return matchesSearch;
  });

  const handleOperatorClick = (operator: any) => {
    // 1. Try pre-calculated currentLine (online)
    if (operator.currentLine?.id) {
      navigate(`/conversations/${operator.currentLine.id}`);
      return;
    }

    // 2. Fallback: Check lines array directly (offline but has history)
    const lines = operator.lines || [];
    const anyLine = lines.find((l: any) => l.status === 'connected') || lines[0];

    if (anyLine?.id) {
      navigate(`/conversations/${anyLine.id}`);
    } else {
      alert("Este operador não possui linhas vinculadas.");
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">WhatsApp Mirror</h1>
              <p className="text-xs text-muted-foreground">Painel Digital</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/management')}>
              <Settings className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 px-4">
        <div className="space-y-6">
          {/* Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Operadores</p>
                    <div className="text-2xl font-bold">{metrics.totalOperators}</div>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Online Agora</p>
                    <div className="text-2xl font-bold text-primary">{metrics.operatorsOnline}</div>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                    <Wifi className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Linhas Ativas</p>
                    <div className="text-2xl font-bold">{metrics.activeLines}</div>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Mensagens</p>
                    <div className="text-2xl font-bold">{metrics.totalMessages}</div>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operators List */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Operadores</CardTitle>
                  <CardDescription>
                    Clique em um operador para ver suas conversas
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
                <Select value={walletFilter} onValueChange={setWalletFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por carteira" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as carteiras</SelectItem>
                    {wallets.map(wallet => (
                      <SelectItem key={wallet} value={wallet}>{wallet}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={statusFilter === 'online' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('online')}
                  >
                    Online
                  </Button>
                  <Button
                    variant={statusFilter === 'offline' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('offline')}
                  >
                    Offline
                  </Button>
                </div>
              </div>

              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar operador..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Carregando dados...</div>
                ) : filteredOperators.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum operador encontrado
                  </p>
                ) : (
                  filteredOperators.map(operator => {
                    const status = operator.status || 'offline';
                    const isOnline = status === 'online';
                    const phoneNumber = operator.currentLine?.phoneNumber || 'Sem linha vinculada';

                    return (
                      <button
                        key={operator.id}
                        onClick={() => handleOperatorClick(operator)}
                        className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-accent/50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarFallback className="bg-secondary">
                                {getInitials(operator.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${isOnline ? 'bg-emerald-500' : 'bg-muted-foreground'
                                }`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{operator.name}</p>
                              {operator.wallet && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                                  {operator.wallet}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {operator.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              {isOnline ? (
                                <Wifi className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <WifiOff className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className={isOnline ? "text-emerald-500 font-medium" : "text-muted-foreground"}>
                                {isOnline ? 'Online' : 'Offline'}
                              </span>
                            </div>
                            {isOnline && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {phoneNumber}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main >
    </div >
  );
}