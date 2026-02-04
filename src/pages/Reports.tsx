import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi, linesApi } from '@/lib/api';
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronLeft, Download, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';

export default function Reports() {
    const navigate = useNavigate();
    const [messagesByLine, setMessagesByLine] = useState<any[]>([]);
    const [messagesByOperator, setMessagesByOperator] = useState<any[]>([]);
    const [linesStatus, setLinesStatus] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true); // set loading true on manual refresh too
        try {
            const [byLine, byOp, status] = await Promise.all([
                reportsApi.getMessagesByLine(),
                reportsApi.getMessagesByOperator(),
                reportsApi.getLinesStatus(),
            ]);
            setMessagesByLine(byLine);
            setMessagesByOperator(byOp);
            setLinesStatus(status);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSync = async () => {
        try {
            setLoading(true);
            await linesApi.syncAll();
            await fetchData();
        } catch (error) {
            console.error("Sync failed", error);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = (data: any[], filename: string) => {
        if (!data.length) return;

        // Extract headers
        const headers = Object.keys(data[0]);

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => {
                // Handle dates or specific formatting if needed, and escape commas
                const value = row[header];
                return `"${String(value).replace(/"/g, '""')}"`;
            }).join(','))
        ].join('\n');

        // Trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Relatórios</h1>
                            <p className="text-muted-foreground">Estatísticas detalhadas e exportação</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={handleSync} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Sincronizar Dados
                    </Button>
                </div>

                {/* Content */}
                <Tabs defaultValue="lines" className="w-full">
                    <TabsList>
                        <TabsTrigger value="lines">Mensagens por Linha</TabsTrigger>
                        <TabsTrigger value="operators">Mensagens por Operador</TabsTrigger>
                        <TabsTrigger value="status">Status das Linhas</TabsTrigger>
                    </TabsList>

                    {/* Messages By Line Tab */}
                    <TabsContent value="lines">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Mensagens por Linha</CardTitle>
                                    <CardDescription>Volume de mensagens por instância do WhatsApp.</CardDescription>
                                </div>
                                <Button variant="outline" onClick={() => downloadCSV(messagesByLine, 'mensagens_por_linha')}>
                                    <Download className="mr-2 h-4 w-4" /> Exportar CSV
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Instância</TableHead>
                                                <TableHead>Telefone</TableHead>
                                                <TableHead className="text-right">Enviadas</TableHead>
                                                <TableHead className="text-right">Recebidas</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow><TableCell colSpan={5} className="text-center h-24">Carregando...</TableCell></TableRow>
                                            ) : messagesByLine.map((item: any) => (
                                                <TableRow key={item.lineId}>
                                                    <TableCell className="font-medium">{item.instanceName}</TableCell>
                                                    <TableCell>{item.phoneNumber}</TableCell>
                                                    <TableCell className="text-right text-emerald-600">{item.sent}</TableCell>
                                                    <TableCell className="text-right text-blue-600">{item.received}</TableCell>
                                                    <TableCell className="text-right font-bold">{item.total}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Messages By Operator Tab */}
                    <TabsContent value="operators">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Mensagens por Operador</CardTitle>
                                    <CardDescription>Produtividade por operador.</CardDescription>
                                </div>
                                <Button variant="outline" onClick={() => downloadCSV(messagesByOperator, 'mensagens_por_operador')}>
                                    <Download className="mr-2 h-4 w-4" /> Exportar CSV
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nome</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead className="text-right">Enviadas</TableHead>
                                                <TableHead className="text-right">Recebidas</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow><TableCell colSpan={5} className="text-center h-24">Carregando...</TableCell></TableRow>
                                            ) : messagesByOperator.map((item: any) => (
                                                <TableRow key={item.operatorId}>
                                                    <TableCell className="font-medium">{item.name}</TableCell>
                                                    <TableCell>{item.email}</TableCell>
                                                    <TableCell className="text-right text-emerald-600">{item.sent}</TableCell>
                                                    <TableCell className="text-right text-blue-600">{item.received}</TableCell>
                                                    <TableCell className="text-right font-bold">{item.total}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Lines Status Tab */}
                    <TabsContent value="status">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Status das Linhas</CardTitle>
                                    <CardDescription>Visão geral de conectividade e histórico.</CardDescription>
                                </div>
                                <Button variant="outline" onClick={() => downloadCSV(linesStatus, 'status_linhas')}>
                                    <Download className="mr-2 h-4 w-4" /> Exportar CSV
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Instância</TableHead>
                                                <TableHead>Telefone</TableHead>
                                                <TableHead>Operador Responsável</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Criado Em</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {loading ? (
                                                <TableRow><TableCell colSpan={5} className="text-center h-24">Carregando...</TableCell></TableRow>
                                            ) : linesStatus.map((item: any) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.instanceName}</TableCell>
                                                    <TableCell>{item.phoneNumber || '-'}</TableCell>
                                                    <TableCell>{item.operatorName}</TableCell>
                                                    <TableCell>
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {item.status === 'connected' ? 'Conectado' : 'Desconectado'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>{format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm')}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    );
}
