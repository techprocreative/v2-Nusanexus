'use client';

import { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface Assistant {
    id: string;
    name: string;
    expertise: string | null;
    description: string | null;
    instructions: string | null;
    avatar_url: string | null;
    model: string;
    status: number;
}

export default function AdminAssistantsPage() {
    const { toast } = useToast();

    const [assistants, setAssistants] = useState<Assistant[]>([]);
    const [loading, setLoading] = useState(false);

    const [newAssistant, setNewAssistant] = useState({
        name: '',
        expertise: '',
        description: '',
        instructions: '',
        avatar_url: '',
        model: 'gpt-4',
        active: true,
    });

    const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
    const [editAssistantForm, setEditAssistantForm] = useState({
        name: '',
        expertise: '',
        description: '',
        instructions: '',
        avatar_url: '',
        model: 'gpt-4',
        active: true,
    });

    const fetchAssistants = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/assistants');
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to load assistants');
            }
            setAssistants(data.assistants || []);
        } catch (error: any) {
            console.error('Error loading assistants:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load assistants',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssistants();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreateAssistant = async () => {
        if (!newAssistant.name.trim()) {
            toast({
                title: 'Validation error',
                description: 'Name is required',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/admin/assistants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newAssistant.name.trim(),
                    expertise: newAssistant.expertise || null,
                    description: newAssistant.description || null,
                    instructions: newAssistant.instructions || null,
                    avatar_url: newAssistant.avatar_url || null,
                    model: newAssistant.model || 'gpt-4',
                    status: newAssistant.active ? 1 : 0,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to create assistant');
            }
            toast({ title: 'Assistant created' });
            setNewAssistant({
                name: '',
                expertise: '',
                description: '',
                instructions: '',
                avatar_url: '',
                model: 'gpt-4',
                active: true,
            });
            fetchAssistants();
        } catch (error: any) {
            console.error('Error creating assistant:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create assistant',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const startEditAssistant = (assistant: Assistant) => {
        setEditingAssistant(assistant);
        setEditAssistantForm({
            name: assistant.name,
            expertise: assistant.expertise || '',
            description: assistant.description || '',
            instructions: assistant.instructions || '',
            avatar_url: assistant.avatar_url || '',
            model: assistant.model || 'gpt-4',
            active: assistant.status === 1,
        });
    };

    const handleUpdateAssistant = async () => {
        if (!editingAssistant) return;

        if (!editAssistantForm.name.trim()) {
            toast({
                title: 'Validation error',
                description: 'Name is required',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/admin/assistants/${editingAssistant.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editAssistantForm.name.trim(),
                    expertise: editAssistantForm.expertise || null,
                    description: editAssistantForm.description || null,
                    instructions: editAssistantForm.instructions || null,
                    avatar_url: editAssistantForm.avatar_url || null,
                    model: editAssistantForm.model || 'gpt-4',
                    status: editAssistantForm.active ? 1 : 0,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update assistant');
            }
            toast({ title: 'Assistant updated' });
            setEditingAssistant(null);
            fetchAssistants();
        } catch (error: any) {
            console.error('Error updating assistant:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update assistant',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAssistant = async (assistant: Assistant) => {
        try {
            const res = await fetch(`/api/admin/assistants/${assistant.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: assistant.status === 1 ? 0 : 1,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update assistant status');
            }
            fetchAssistants();
        } catch (error: any) {
            console.error('Error toggling assistant:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update assistant status',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteAssistant = async (assistant: Assistant) => {
        if (!window.confirm(`Delete assistant "${assistant.name}"?`)) return;

        try {
            const res = await fetch(`/api/admin/assistants/${assistant.id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete assistant');
            }
            toast({ title: 'Assistant deleted' });
            fetchAssistants();
        } catch (error: any) {
            console.error('Error deleting assistant:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete assistant',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Assistants</h1>
                <p className="text-muted-foreground">
                    Manage AI assistants and their configuration.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Create Assistant</CardTitle>
                    <CardDescription>
                        Define a new AI persona with custom instructions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="assistant-name">Name</Label>
                            <Input
                                id="assistant-name"
                                value={newAssistant.name}
                                onChange={(e) =>
                                    setNewAssistant((p) => ({ ...p, name: e.target.value }))
                                }
                                placeholder="e.g. Marketing Expert"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assistant-expertise">Expertise</Label>
                            <Input
                                id="assistant-expertise"
                                value={newAssistant.expertise}
                                onChange={(e) =>
                                    setNewAssistant((p) => ({
                                        ...p,
                                        expertise: e.target.value,
                                    }))
                                }
                                placeholder="e.g. Copywriting, SaaS Growth"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assistant-description">Short Description</Label>
                            <Textarea
                                id="assistant-description"
                                value={newAssistant.description}
                                onChange={(e) =>
                                    setNewAssistant((p) => ({
                                        ...p,
                                        description: e.target.value,
                                    }))
                                }
                                placeholder="How would you describe this assistant?"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assistant-avatar">Avatar URL</Label>
                            <Input
                                id="assistant-avatar"
                                value={newAssistant.avatar_url}
                                onChange={(e) =>
                                    setNewAssistant((p) => ({
                                        ...p,
                                        avatar_url: e.target.value,
                                    }))
                                }
                                placeholder="Optional image URL"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="assistant-instructions">System Instructions</Label>
                            <Textarea
                                id="assistant-instructions"
                                value={newAssistant.instructions}
                                onChange={(e) =>
                                    setNewAssistant((p) => ({
                                        ...p,
                                        instructions: e.target.value,
                                    }))
                                }
                                placeholder="Describe how the assistant should behave..."
                                className="min-h-[180px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assistant-model">Model</Label>
                            <Input
                                id="assistant-model"
                                value={newAssistant.model}
                                onChange={(e) =>
                                    setNewAssistant((p) => ({ ...p, model: e.target.value }))
                                }
                                placeholder="e.g. gpt-4, gpt-4o, claude-3-opus"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Switch
                                id="assistant-active"
                                checked={newAssistant.active}
                                onCheckedChange={(checked) =>
                                    setNewAssistant((p) => ({ ...p, active: checked }))
                                }
                            />
                            <Label htmlFor="assistant-active">Active</Label>
                        </div>
                        <Button
                            onClick={handleCreateAssistant}
                            disabled={loading}
                            className="w-full"
                        >
                            Create Assistant
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Existing Assistants</CardTitle>
                    <CardDescription>
                        Edit, activate/deactivate or remove assistants.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {assistants.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No assistants defined yet.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {assistants.map((assistant) => (
                                <div
                                    key={assistant.id}
                                    className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-lg p-3 gap-3"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{assistant.name}</p>
                                            <Badge
                                                variant={
                                                    assistant.status === 1
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                            >
                                                {assistant.status === 1
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {assistant.expertise || 'Generalist'} •{' '}
                                            {assistant.model}
                                        </p>
                                        {assistant.description && (
                                            <p className="text-xs text-muted-foreground">
                                                {assistant.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => startEditAssistant(assistant)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleToggleAssistant(assistant)}
                                        >
                                            {assistant.status === 1 ? 'Deactivate' : 'Activate'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteAssistant(assistant)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {editingAssistant && (
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Assistant</CardTitle>
                        <CardDescription>
                            Update fields for {editingAssistant.name}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-assistant-name">Name</Label>
                                <Input
                                    id="edit-assistant-name"
                                    value={editAssistantForm.name}
                                    onChange={(e) =>
                                        setEditAssistantForm((p) => ({
                                            ...p,
                                            name: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-assistant-expertise">Expertise</Label>
                                <Input
                                    id="edit-assistant-expertise"
                                    value={editAssistantForm.expertise}
                                    onChange={(e) =>
                                        setEditAssistantForm((p) => ({
                                            ...p,
                                            expertise: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-assistant-description">
                                    Description
                                </Label>
                                <Textarea
                                    id="edit-assistant-description"
                                    value={editAssistantForm.description}
                                    onChange={(e) =>
                                        setEditAssistantForm((p) => ({
                                            ...p,
                                            description: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-assistant-avatar">Avatar URL</Label>
                                <Input
                                    id="edit-assistant-avatar"
                                    value={editAssistantForm.avatar_url}
                                    onChange={(e) =>
                                        setEditAssistantForm((p) => ({
                                            ...p,
                                            avatar_url: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-assistant-instructions">
                                    System Instructions
                                </Label>
                                <Textarea
                                    id="edit-assistant-instructions"
                                    value={editAssistantForm.instructions}
                                    onChange={(e) =>
                                        setEditAssistantForm((p) => ({
                                            ...p,
                                            instructions: e.target.value,
                                        }))
                                    }
                                    className="min-h-[180px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-assistant-model">Model</Label>
                                <Input
                                    id="edit-assistant-model"
                                    value={editAssistantForm.model}
                                    onChange={(e) =>
                                        setEditAssistantForm((p) => ({
                                            ...p,
                                            model: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <Switch
                                    id="edit-assistant-active"
                                    checked={editAssistantForm.active}
                                    onCheckedChange={(checked) =>
                                        setEditAssistantForm((p) => ({
                                            ...p,
                                            active: checked,
                                        }))
                                    }
                                />
                                <Label htmlFor="edit-assistant-active">Active</Label>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleUpdateAssistant}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    Save Changes
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingAssistant(null)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}