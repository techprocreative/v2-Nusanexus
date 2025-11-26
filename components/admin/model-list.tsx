'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Search } from 'lucide-react';

interface Model {
    id: string;
    provider_id: string;
    model_id: string;
    display_name: string;
    type: string;
    input_cost?: number;
    output_cost?: number;
    context_length?: number;
    status: number;
    provider?: {
        display_name: string;
    };
}

interface ModelListProps {
    models: Model[];
    type: string;
}

export function ModelList({ models, type }: ModelListProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState('');
    const [editingModel, setEditingModel] = useState<Model | null>(null);
    const [saving, setSaving] = useState(false);

    const filteredModels = models.filter(
        (model) =>
            model.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.model_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            model.provider?.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleUpdateModel = async () =&gt; {
        if (!editingModel) return;

        setSaving(true);
        try {
            const response = await fetch(`/api/admin/models`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingModel.id,
                    input_cost: editingModel.input_cost,
                    output_cost: editingModel.output_cost,
                    status: editingModel.status,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update model');
            }

            toast({
                title: 'Model updated',
                description: 'Model pricing has been updated successfully',
            });

            setEditingModel(null);
            router.refresh();
        } catch (error: any) {
            toast({
                title: 'Update failed',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const formatCost = (cost?: number) => {
        if (!cost) return 'N/A';
        return `$${cost.toFixed(6)}`;
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search models..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Badge variant="secondary">{filteredModels.length} models</Badge>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Model</TableHead>
                            <TableHead>Provider</TableHead>
                            {type === 'llm' && (
                                <>
                                    <TableHead>Input Cost</TableHead>
                                    <TableHead>Output Cost</TableHead>
                                    <TableHead>Context</TableHead>
                                </>
                            )}
                            {(type === 'image' || type === 'tts' || type === 'transcription') && (
                                <TableHead>Cost per Unit</TableHead>
                            )}
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredModels.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={type === 'llm' ? 7 : 5} className="text-center py-8 text-muted-foreground">
                                    No models found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredModels.map((model) => (
                                <TableRow key={model.id}>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{model.display_name}</div>
                                            <div className="text-xs text-muted-foreground">{model.model_id}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{model.provider?.display_name}</TableCell>
                                    {type === 'llm' && (
                                        <>
                                            <TableCell className="font-mono text-xs">
                                                {formatCost(model.input_cost)}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {formatCost(model.output_cost)}
                                            </TableCell>
                                            <TableCell>{model.context_length?.toLocaleString() || 'N/A'}</TableCell>
                                        </>
                                    )}
                                    {(type === 'image' || type === 'tts' || type === 'transcription') && (
                                        <TableCell className="font-mono text-xs">
                                            {formatCost(model.input_cost)}
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <Badge variant={model.status === 1 ? 'default' : 'secondary'}>
                                            {model.status === 1 ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingModel(model)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!editingModel} onOpenChange={() => setEditingModel(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Model Pricing</DialogTitle>
                    </DialogHeader>

                    {editingModel && (
                        <div className="space-y-4 py-4">
                            <div>
                                <p className="font-medium">{editingModel.display_name}</p>
                                <p className="text-sm text-muted-foreground">{editingModel.model_id}</p>
                            </div>

                            {type === 'llm' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Input Cost ($)</Label>
                                        <Input
                                            type="number"
                                            step="0.000001"
                                            value={editingModel.input_cost || 0}
                                            onChange={(e) =>
                                                setEditingModel({
                                                    ...editingModel,
                                                    input_cost: parseFloat(e.target.value),
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Output Cost ($)</Label>
                                        <Input
                                            type="number"
                                            step="0.000001"
                                            value={editingModel.output_cost || 0}
                                            onChange={(e) =>
                                                setEditingModel({
                                                    ...editingModel,
                                                    output_cost: parseFloat(e.target.value),
                                                })
                                            }
                                        />
                                    </div>
                                </>
                            )}

                            {(type === 'image' || type === 'tts' || type === 'transcription') && (
                                <div className="space-y-2">
                                    <Label>Cost per Unit ($)</Label>
                                    <Input
                                        type="number"
                                        step="0.000001"
                                        value={editingModel.input_cost || 0}
                                        onChange={(e) =>
                                            setEditingModel({
                                                ...editingModel,
                                                input_cost: parseFloat(e.target.value),
                                            })
                                        }
                                    />
                                </div>
                            )}

                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={editingModel.status === 1}
                                    onCheckedChange={(checked: boolean) =>
                                        setEditingModel({ ...editingModel, status: checked ? 1 : 0 })
                                    }
                                />
                                <Label>Active</Label>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingModel(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateModel} disabled={saving}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
