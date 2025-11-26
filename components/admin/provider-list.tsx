'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, RefreshCw, TestTube } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Provider {
    id: string;
    name: string;
    display_name: string;
    type: string;
    base_url: string;
    status: number;
    priority: number;
    has_api_key?: boolean;
}

interface ProviderListProps {
    providers: Provider[];
}

export function ProviderList({ providers }: ProviderListProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [syncing, setSyncing] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleSyncModels = async (providerId: string) => {
        setSyncing(providerId);
        try {
            const response = await fetch(`/api/admin/providers/${providerId}/sync-models`, {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to sync models');
            }

            toast({
                title: 'Models synced',
                description: `Synced ${data.synced_count} models from provider`,
            });

            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Sync failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSyncing(null);
        }
    };

    const handleDelete = async (providerId: string) => {
        if (!confirm('Are you sure you want to delete this provider? This will also delete all associated models.')) {
            return;
        }

        setDeleting(providerId);
        try {
            const response = await fetch(`/api/admin/providers/${providerId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete provider');
            }

            toast({
                title: 'Provider deleted',
                description: 'Provider has been removed successfully',
            });

            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Delete failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setDeleting(null);
        }
    };

    if (providers.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                    No providers configured yet
                </p>
                <Button asChild>
                    <Link href="/admin/providers/new">Add your first provider</Link>
                </Button>
            </div>
        );
    }

    const groupedProviders = providers.reduce((acc, provider) => {
        if (!acc[provider.type]) {
            acc[provider.type] = [];
        }
        acc[provider.type].push(provider);
        return acc;
    }, {} as Record<string, Provider[]>);

    return (
        <div className="space-y-6">
            {Object.entries(groupedProviders).map(([type, typeProviders]) => (
                <div key={type}>
                    <h3 className="text-sm font-medium mb-3 capitalize">{type}</h3>
                    <div className="space-y-2">
                        {typeProviders.map((provider) => (
                            <div
                                key={provider.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium">{provider.display_name}</h4>
                                        <Badge variant={provider.status === 1 ? 'default' : 'secondary'}>
                                            {provider.status === 1 ? 'Active' : 'Inactive'}
                                        </Badge>
                                        {!provider.has_api_key && (
                                            <Badge variant="destructive">No API Key</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {provider.base_url} • Priority: {provider.priority}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSyncModels(provider.id)}
                                        disabled={syncing === provider.id}
                                    >
                                        <RefreshCw className={`h-4 w-4 mr-2 ${syncing === provider.id ? 'animate-spin' : ''}`} />
                                        Sync Models
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem asChild>
                                                <Link href={`/admin/providers/${provider.id}`}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => handleDelete(provider.id)}
                                                disabled={deleting === provider.id}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
