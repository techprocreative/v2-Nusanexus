'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Settings, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminPaymentGatewaysPage() {
    const { toast } = useToast();
    const [gateways, setGateways] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        isSandbox: true,
        credentials: {} as any,
    });

    useEffect(() => {
        fetchGateways();
    }, []);

    const fetchGateways = async () => {
        try {
            const response = await fetch('/api/admin/payment-gateways');
            const data = await response.json();
            if (response.ok) {
                setGateways(data.gateways || []);
            }
        } catch (error) {
            console.error('Error fetching gateways:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/admin/payment-gateways', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create gateway');
            }

            toast({
                title: 'Success',
                description: 'Payment gateway created successfully',
            });

            setShowForm(false);
            fetchGateways();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async (gatewayId: string) => {
        try {
            const response = await fetch(`/api/admin/payment-gateways/${gatewayId}/test`, {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: 'Connection Successful',
                    description: 'Payment gateway is working correctly',
                });
            } else {
                throw new Error(data.message);
            }
        } catch (error: any) {
            toast({
                title: 'Connection Failed',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const handleToggle = async (gatewayId: string, isActive: boolean) => {
        try {
            const response = await fetch(`/api/admin/payment-gateways/${gatewayId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isActive }),
            });

            if (response.ok) {
                fetchGateways();
                toast({
                    title: 'Updated',
                    description: `Gateway ${!isActive ? 'activated' : 'deactivated'}`,
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update gateway',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Payment Gateways</h1>
                    <p className="text-muted-foreground">Manage Tripay and Midtrans configurations</p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Gateway
                </Button>
            </div>

            {showForm && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Add Payment Gateway</CardTitle>
                        <CardDescription>Configure a new payment gateway</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Gateway Type</Label>
                                    <Select
                                        value={formData.name}
                                        onValueChange={(value) => setFormData({ ...formData, name: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select gateway" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tripay">Tripay</SelectItem>
                                            <SelectItem value="midtrans">Midtrans</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <Input
                                        id="displayName"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                        placeholder="e.g., Tripay Production"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={formData.isSandbox}
                                    onCheckedChange={(checked) => setFormData({ ...formData, isSandbox: checked })}
                                />
                                <Label>Sandbox Mode</Label>
                            </div>

                            {formData.name === 'tripay' && (
                                <div className="space-y-4 p-4 border rounded-lg">
                                    <h3 className="font-medium">Tripay Credentials</h3>
                                    <div className="space-y-2">
                                        <Label>API Key</Label>
                                        <Input
                                            type="password"
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                credentials: { ...formData.credentials, apiKey: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Private Key</Label>
                                        <Input
                                            type="password"
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                credentials: { ...formData.credentials, privateKey: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Merchant Code</Label>
                                        <Input
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                credentials: { ...formData.credentials, merchantCode: e.target.value }
                                            })}
                                        />
                                    </div>
                                </div>
                            )}

                            {formData.name === 'midtrans' && (
                                <div className="space-y-4 p-4 border rounded-lg">
                                    <h3 className="font-medium">Midtrans Credentials</h3>
                                    <div className="space-y-2">
                                        <Label>Server Key</Label>
                                        <Input
                                            type="password"
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                credentials: { ...formData.credentials, serverKey: e.target.value }
                                            })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Client Key</Label>
                                        <Input
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                credentials: { ...formData.credentials, clientKey: e.target.value }
                                            })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button type="submit" disabled={loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Create Gateway
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gateways.map((gateway) => (
                    <Card key={gateway.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{gateway.display_name}</CardTitle>
                                <Badge variant={gateway.is_active ? 'default' : 'secondary'}>
                                    {gateway.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <CardDescription className="capitalize">{gateway.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Mode:</span>
                                <Badge variant="outline">{gateway.is_sandbox ? 'Sandbox' : 'Production'}</Badge>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleTest(gateway.id)}
                                    className="flex-1"
                                >
                                    <Settings className="mr-2 h-4 w-4" />
                                    Test
                                </Button>
                                <Button
                                    size="sm"
                                    variant={gateway.is_active ? 'destructive' : 'default'}
                                    onClick={() => handleToggle(gateway.id, gateway.is_active)}
                                    className="flex-1"
                                >
                                    {gateway.is_active ? 'Deactivate' : 'Activate'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {gateways.length === 0 && !loading && (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <p>No payment gateways configured yet</p>
                        <p className="text-sm mt-2">Click "Add Gateway" to get started</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
