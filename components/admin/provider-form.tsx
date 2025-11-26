'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, TestTube } from 'lucide-react';

interface ProviderFormData {
    name: string;
    display_name: string;
    type: string;
    base_url: string;
    api_key: string;
    status: number;
    priority: number;
}

interface ProviderFormProps {
    provider?: ProviderFormData & { id: string };
    isEdit?: boolean;
}

export function ProviderForm({ provider, isEdit = false }: ProviderFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);

    const [formData, setFormData] = useState<ProviderFormData>({
        name: provider?.name || '',
        display_name: provider?.display_name || '',
        type: provider?.type || 'llm',
        base_url: provider?.base_url || '',
        api_key: provider?.api_key || '',
        status: provider?.status ?? 1,
        priority: provider?.priority ?? 0,
    });

    const handleChange = (field: keyof ProviderFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleTestConnection = async () => {
        if (!formData.api_key || !formData.base_url) {
            toast({
                title: 'Missing information',
                description: 'Please provide API key and base URL',
                variant: 'destructive',
            });
            return;
        }

        setTesting(true);
        try {
            const response = await fetch('/api/admin/providers/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    base_url: formData.base_url,
                    api_key: formData.api_key,
                    type: formData.type,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Connection test failed');
            }

            toast({
                title: 'Connection successful',
                description: 'Provider connection is working correctly',
            });
        } catch (error: any) {
            toast({
                title: 'Connection failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = isEdit
                ? `/api/admin/providers/${provider?.id}`
                : '/api/admin/providers';
            const method = isEdit ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save provider');
            }

            toast({
                title: isEdit ? 'Provider updated' : 'Provider created',
                description: 'Provider has been saved successfully',
            });

            router.push('/admin/providers');
            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Save failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Provider Name (Internal)</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="openrouter-main"
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Unique identifier for this provider
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => handleChange('display_name', e.target.value)}
                        placeholder="OpenRouter"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="type">Provider Type</Label>
                    <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="llm">LLM (Text Generation)</SelectItem>
                            <SelectItem value="image">Image Generation</SelectItem>
                            <SelectItem value="tts">Text-to-Speech</SelectItem>
                            <SelectItem value="transcription">Transcription</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                        id="priority"
                        type="number"
                        value={formData.priority}
                        onChange={(e) => handleChange('priority', parseInt(e.target.value))}
                        min="0"
                    />
                    <p className="text-xs text-muted-foreground">
                        Lower number = higher priority (0 is highest)
                    </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="base_url">Base URL</Label>
                    <Input
                        id="base_url"
                        value={formData.base_url}
                        onChange={(e) => handleChange('base_url', e.target.value)}
                        placeholder="https://openrouter.ai/api/v1"
                        required
                    />
                </div>

                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="api_key">API Key</Label>
                    <Input
                        id="api_key"
                        type="password"
                        value={formData.api_key}
                        onChange={(e) => handleChange('api_key', e.target.value)}
                        placeholder={isEdit ? '••••••••••••••••' : 'sk-...'}
                        required={!isEdit}
                    />
                    {isEdit && (
                        <p className="text-xs text-muted-foreground">
                            Leave empty to keep existing API key
                        </p>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="status"
                        checked={formData.status === 1}
                        onCheckedChange={(checked: boolean) => handleChange('status', checked ? 1 : 0)}
                    />
                    <Label htmlFor="status">Active</Label>
                </div>
            </div>

            <div className="flex gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testing || loading}
                >
                    {testing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <TestTube className="mr-2 h-4 w-4" />
                    )}
                    Test Connection
                </Button>

                <Button type="submit" disabled={loading || testing}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEdit ? 'Update Provider' : 'Create Provider'}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading || testing}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}
