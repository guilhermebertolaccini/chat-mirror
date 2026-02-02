import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { linesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  LogOut,
  QrCode,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { WhatsAppLine } from '@/types';

export default function OperatorPanel() {
  const { user, logout } = useAuth();
  const [line, setLine] = useState<WhatsAppLine | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null); // Base64 or URL
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'waiting' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, we should fetch the line status from the backend
    // For now we rely on what was returned during creation or login
    // setLine(user?.line); // If we had it in user context
  }, [user]);

  const handleGenerateQR = useCallback(async () => {
    if (!user) return;

    setIsGenerating(true);
    setShowQR(true);
    setConnectionStatus('idle');
    setError(null);

    try {
      const instanceName = `op_${user.name.toLowerCase().replace(/\\s+/g, '_')}_${user.id.substring(0, 4)}`;

      // Call Backend to Create Instance
      const response = await linesApi.create({
        operatorId: user.id,
        instanceName: instanceName
      });

      // Response structure depends on backend mapping
      // Backend returns: { line, qrcode: { base64: ... } } (Assuming Evolution structure)

      if (response.qrcode && response.qrcode.base64) {
        setQrCodeData(response.qrcode.base64);
        setConnectionStatus('waiting');
        setLine(response.line); // Update local line state (status: disconnected initially)
      } else if (response.instance && response.instance.qrcode) {
        // Evolution sometimes returns flat instance
        setQrCodeData(response.instance.qrcode.base64);
      } else {
        // If already connected or no QR returned
        setError("Instância criada, mas QR Code não recebido. Tente atualizar.");
      }

      // Poll for status change (to success)
      // This simulates listening to the webhook 'connection.update'

    } catch (err: any) {
      console.error("Failed to create line", err);
      setError("Erro ao gerar QR Code. " + (err.response?.data?.message || err.message));
      setShowQR(false);
    } finally {
      setIsGenerating(false);
    }
  }, [user]);

  const handleDisconnect = async () => {
    // Implement disconnect logic
    alert("Função de desconectar será implementada em breve via API");
  };

  const isConnected = line?.status === 'connected';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">WhatsApp Mirror</h1>
              <p className="text-xs text-muted-foreground">Painel do Operador</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl py-8 px-4">
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Status da Linha</CardTitle>
                  <CardDescription>
                    Gerencie sua conexão WhatsApp
                  </CardDescription>
                </div>
                <Badge
                  variant={isConnected ? "default" : "secondary"}
                  className={isConnected ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                >
                  {isConnected ? (
                    <>
                      <Wifi className="h-3 w-3 mr-1" />
                      Conectado
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 mr-1" />
                      Desconectado
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isConnected && line?.phoneNumber && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-accent/50 mb-4">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{line.phoneNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Conectado
                    </p>
                  </div>
                </div>
              )}

              {isConnected ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDisconnect}
                >
                  <WifiOff className="h-4 w-4 mr-2" />
                  Desconectar Linha
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={handleGenerateQR}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Gerando QR Code...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Gerar QR Code
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* QR Code Card */}
          {showQR && !error && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Escanear QR Code</CardTitle>
                    <CardDescription>
                      Abra o WhatsApp no seu celular e escaneie o código abaixo
                    </CardDescription>
                  </div>
                  {connectionStatus === 'waiting' && (
                    <Badge variant="outline" className="animate-pulse">
                      Aguardando leitura...
                    </Badge>
                  )}
                  {connectionStatus === 'success' && (
                    <Badge className="bg-success hover:bg-success">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Conectado!
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  {/* QR Code Display */}
                  <div className="w-64 h-64 bg-white rounded-lg flex items-center justify-center border overflow-hidden">
                    {isGenerating ? (
                      <div className="text-center">
                        <RefreshCw className="h-10 w-10 text-primary animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                      </div>
                    ) : connectionStatus === 'success' ? (
                      <div className="text-center">
                        <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-2" />
                        <p className="text-sm font-medium text-success">Conexão estabelecida!</p>
                      </div>
                    ) : qrCodeData ? (
                      <img
                        src={qrCodeData}
                        alt="QR Code para conectar WhatsApp"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <QrCode className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Clique para gerar o QR Code
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium">Como conectar:</p>
                    <ol className="text-sm text-muted-foreground text-left space-y-1">
                      <li>1. Abra o WhatsApp no seu celular</li>
                      <li>2. Toque em Menu ou Configurações</li>
                      <li>3. Selecione "Aparelhos conectados"</li>
                      <li>4. Toque em "Conectar aparelho"</li>
                      <li>5. Escaneie o código QR acima</li>
                    </ol>
                  </div>

                  {connectionStatus !== 'success' && (
                    <Button
                      variant="outline"
                      onClick={handleGenerateQR}
                      disabled={isGenerating}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                      {qrCodeData ? 'Gerar Novo Código' : 'Gerar QR Code'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}