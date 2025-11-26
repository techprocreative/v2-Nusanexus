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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

interface Voice {
    id: string;
    provider: string;
    model: string;
    external_id: string;
    name: string;
    status: number;
    gender: string | null;
    accent: string | null;
    age: string | null;
    tone: string | null;
    use_case: string | null;
    sample_url: string | null;
    supported_languages: string[] | null;
}

const GENDERS = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'neutral', label: 'Neutral' },
];

const AGES = [
    { value: 'young', label: 'Young' },
    { value: 'middle_aged', label: 'Middle aged' },
    { value: 'old', label: 'Old' },
];

export default function AdminVoicesPage() {
    const { toast } = useToast();

    const [voices, setVoices] = useState<Voice[]>([]);
    const [loading, setLoading] = useState(false);

    const [newVoice, setNewVoice] = useState({
        provider: '',
        model: '',
        external_id: '',
        name: '',
        gender: '',
        accent: '',
        age: '',
        tone: '',
        use_case: '',
        sample_url: '',
        languagesText: '',
        active: true,
    });

    const [editingVoice, setEditingVoice] = useState<Voice | null>(null);
    const [editVoiceForm, setEditVoiceForm] = useState({
        provider: '',
        model: '',
        external_id: '',
        name: '',
        gender: '',
        accent: '',
        age: '',
        tone: '',
        use_case: '',
        sample_url: '',
        languagesText: '',
        active: true,
    });

    const fetchVoices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/voices');
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to load voices');
            }
            setVoices(data.voices || []);
        } catch (error: any) {
            console.error('Error loading voices:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load voices',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVoices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const parseLanguages = (text: string): string[] =>
        text
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

    const handleCreateVoice = async () => {
        if (!newVoice.provider || !newVoice.model || !newVoice.external_id || !newVoice.name) {
            toast({
                title: 'Validation error',
                description: 'Provider, model, external id and name are required',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/admin/voices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: newVoice.provider,
                    model: newVoice.model,
                    external_id: newVoice.external_id,
                    name: newVoice.name,
                    gender: newVoice.gender || null,
                    accent: newVoice.accent || null,
                    age: newVoice.age || null,
                    tone: newVoice.tone || null,
                    use_case: newVoice.use_case || null,
                    sample_url: newVoice.sample_url || null,
                    status: newVoice.active ? 1 : 0,
                    supported_languages: parseLanguages(newVoice.languagesText),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to create voice');
            }
            toast({ title: 'Voice created' });
            setNewVoice({
                provider: '',
                model: '',
                external_id: '',
                name: '',
                gender: '',
                accent: '',
                age: '',
                tone: '',
                use_case: '',
                sample_url: '',
                languagesText: '',
                active: true,
            });
            fetchVoices();
        } catch (error: any) {
            console.error('Error creating voice:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create voice',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const startEditVoice = (voice: Voice) => {
        setEditingVoice(voice);
        setEditVoiceForm({
            provider: voice.provider,
            model: voice.model,
            external_id: voice.external_id,
            name: voice.name,
            gender: voice.gender || '',
            accent: voice.accent || '',
            age: voice.age || '',
            tone: voice.tone || '',
            use_case: voice.use_case || '',
            sample_url: voice.sample_url || '',
            languagesText: (voice.supported_languages || []).join(', '),
            active: voice.status === 1,
        });
    };

    const handleUpdateVoice = async () => {
        if (!editingVoice) return;

        if (!editVoiceForm.provider || !editVoiceForm.model || !editVoiceForm.name) {
            toast({
                title: 'Validation error',
                description: 'Provider, model and name are required',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/admin/voices/${editingVoice.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: editVoiceForm.provider,
                    model: editVoiceForm.model,
                    external_id: editVoiceForm.external_id,
                    name: editVoiceForm.name,
                    gender: editVoiceForm.gender || null,
                    accent: editVoiceForm.accent || null,
                    age: editVoiceForm.age || null,
                    tone: editVoiceForm.tone || null,
                    use_case: editVoiceForm.use_case || null,
                    sample_url: editVoiceForm.sample_url || null,
                    status: editVoiceForm.active ? 1 : 0,
                    supported_languages: parseLanguages(editVoiceForm.languagesText),
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update voice');
            }
            toast({ title: 'Voice updated' });
            setEditingVoice(null);
            fetchVoices();
        } catch (error: any) {
            console.error('Error updating voice:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update voice',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVoice = async (voice: Voice) => {
        try {
            const res = await fetch(`/api/admin/voices/${voice.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: voice.status === 1 ? 0 : 1 }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update voice status');
            }
            fetchVoices();
        } catch (error: any) {
            console.error('Error toggling voice:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update voice status',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Voices</h1>
                <p className="text-muted-foreground">
                    Manage text-to-speech voices available in the app.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Create Voice</CardTitle>
                    <CardDescription>
                        Register a new provider voice for TTS usage.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="voice-provider">Provider</Label>
                            <Input
                                id="voice-provider"
                                value={newVoice.provider}
                                onChange={(e) =>
                                    setNewVoice((p) => ({ ...p, provider: e.target.value }))
                                }
                                placeholder="e.g. openai, elevenlabs"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="voice-model">Model</Label>
                            <Input
                                id="voice-model"
                                value={newVoice.model}
                                onChange={(e) =>
                                    setNewVoice((p) => ({ ...p, model: e.target.value }))
                                }
                                placeholder="e.g. tts-1"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="voice-external-id">External Voice ID</Label>
                            <Input
                                id="voice-external-id"
                                value={newVoice.external_id}
                                onChange={(e) =>
                                    setNewVoice((p) => ({
                                        ...p,
                                        external_id: e.target.value,
                                    }))
                                }
                                placeholder="Provider-specific voice id"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="voice-name">Display Name</Label>
                            <Input
                                id="voice-name"
                                value={newVoice.name}
                                onChange={(e) =>
                                    setNewVoice((p) => ({ ...p, name: e.target.value }))
                                }
                                placeholder="e.g. Warm Female Narrator"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Gender</Label>
                                <Select
                                    value={newVoice.gender}
                                    onValueChange={(value) =>
                                        setNewVoice((p) => ({ ...p, gender: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Unspecified</SelectItem>
                                        {GENDERS.map((g) => (
                                            <SelectItem key={g.value} value={g.value}>
                                                {g.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Age</Label>
                                <Select
                                    value={newVoice.age}
                                    onValueChange={(value) =>
                                        setNewVoice((p) => ({ ...p, age: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select age" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Unspecified</SelectItem>
                                        {AGES.map((a) => (
                                            <SelectItem key={a.value} value={a.value}>
                                                {a.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="voice-accent">Accent</Label>
                            <Input
                                id="voice-accent"
                                value={newVoice.accent}
                                onChange={(e) =>
                                    setNewVoice((p) => ({ ...p, accent: e.target.value }))
                                }
                                placeholder="e.g. US English"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="voice-tone">Tone</Label>
                            <Input
                                id="voice-tone"
                                value={newVoice.tone}
                                onChange={(e) =>
                                    setNewVoice((p) => ({ ...p, tone: e.target.value }))
                                }
                                placeholder="e.g. Friendly, Professional"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="voice-usecase">Use case</Label>
                            <Input
                                id="voice-usecase"
                                value={newVoice.use_case}
                                onChange={(e) =>
                                    setNewVoice((p) => ({ ...p, use_case: e.target.value }))
                                }
                                placeholder="e.g. Audiobooks, Marketing"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="voice-sample">Sample URL</Label>
                            <Input
                                id="voice-sample"
                                value={newVoice.sample_url}
                                onChange={(e) =>
                                    setNewVoice((p) => ({
                                        ...p,
                                        sample_url: e.target.value,
                                    }))
                                }
                                placeholder="Optional audio sample link"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="voice-languages">
                                Supported Languages (comma separated)
                            </Label>
                            <Input
                                id="voice-languages"
                                value={newVoice.languagesText}
                                onChange={(e) =>
                                    setNewVoice((p) => ({
                                        ...p,
                                        languagesText: e.target.value,
                                    }))
                                }
                                placeholder="e.g. en, id, es"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <Switch
                                id="voice-active"
                                checked={newVoice.active}
                                onCheckedChange={(checked) =>
                                    setNewVoice((p) => ({ ...p, active: checked }))
                                }
                            />
                            <Label htmlFor="voice-active">Active</Label>
                        </div>
                        <Button
                            onClick={handleCreateVoice}
                            disabled={loading}
                            className="w-full"
                        >
                            Create Voice
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Existing Voices</CardTitle>
                    <CardDescription>
                        Edit, enable or disable existing provider voices.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {voices.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No voices configured yet.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {voices.map((voice) => (
                                <div
                                    key={voice.id}
                                    className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-lg p-3 gap-3"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{voice.name}</p>
                                            <Badge
                                                variant={voice.status === 1 ? 'default' : 'outline'}
                                            >
                                                {voice.status === 1 ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {voice.provider} • {voice.model}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {voice.gender || 'Unknown'} • {voice.accent || 'Accent N/A'}
                                        </p>
                                        {voice.supported_languages &&
                                            voice.supported_languages.length > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    Languages:{' '}
                                                    {voice.supported_languages.join(', ')}
                                                </p>
                                            )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => startEditVoice(voice)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleToggleVoice(voice)}
                                        >
                                            {voice.status === 1 ? 'Deactivate' : 'Activate'}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {editingVoice && (
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Voice</CardTitle>
                        <CardDescription>
                            Update fields for {editingVoice.name}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-voice-provider">Provider</Label>
                                <Input
                                    id="edit-voice-provider"
                                    value={editVoiceForm.provider}
                                    onChange={(e) =>
                                        setEditVoiceForm((p) => ({
                                            ...p,
                                            provider: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-voice-model">Model</Label>
                                <Input
                                    id="edit-voice-model"
                                    value={editVoiceForm.model}
                                    onChange={(e) =>
                                        setEditVoiceForm((p) => ({
                                            ...p,
                                            model: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-voice-external-id">
                                    External Voice ID
                                </Label>
                                <Input
                                    id="edit-voice-external-id"
                                    value={editVoiceForm.external_id}
                                    onChange={(e) =>
                                        setEditVoiceForm((p) => ({
                                            ...p,
                                            external_id: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-voice-name">Display Name</Label>
                                <Input
                                    id="edit-voice-name"
                                    value={editVoiceForm.name}
                                    onChange={(e) =>
                                        setEditVoiceForm((p) => ({
                                            ...p,
                                            name: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <Select
                                        value={editVoiceForm.gender}
                                        onValueChange={(value) =>
                                            setEditVoiceForm((p) => ({
                                                ...p,
                                                gender: value,
                                            }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Unspecified</SelectItem>
                                            {GENDERS.map((g) => (
                                                <SelectItem key={g.value} value={g.value}>
                                                    {g.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Age</Label>
                                    <Select
                                        value={editVoiceForm.age}
                                        onValueChange={(value) =>
                                            setEditVoiceForm((p) => ({ ...p, age: value }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Unspecified</SelectItem>
                                            {AGES.map((a) => (
                                                <SelectItem key={a.value} value={a.value}>
                                                    {a.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-voice-accent">Accent</Label>
                                <Input
                                    id="edit-voice-accent"
                                    value={editVoiceForm.accent}
                                    onChange={(e) =>
                                        setEditVoiceForm((p) => ({
                                            ...p,
                                            accent: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-voice-tone">Tone</Label>
                                <Input
                                    id="edit-voice-tone"
                                    value={editVoiceForm.tone}
                                    onChange={(e) =>
                                        setEditVoiceForm((p) => ({
                                            ...p,
                                            tone: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-voice-usecase">Use case</Label>
                                <Input
                                    id="edit-voice-usecase"
                                    value={editVoiceForm.use_case}
                                    onChange={(e) =>
                                        setEditVoiceForm((p) => ({
                                            ...p,
                                            use_case: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-voice-sample">Sample URL</Label>
                                <Input
                                    id="edit-voice-sample"
                                    value={editVoiceForm.sample_url}
                                    onChange={(e) =>
                                        setEditVoiceForm((p) => ({
                                            ...p,
                                            sample_url: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-voice-languages">
                                    Supported Languages
                                </Label>
                                <Input
                                    id="edit-voice-languages"
                                    value={editVoiceForm.languagesText}
                                    onChange={(e) =>
                                        setEditVoiceForm((p) => ({
                                            ...p,
                                            languagesText: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <Switch
                                    id="edit-voice-active"
                                    checked={editVoiceForm.active}
                                    onCheckedChange={(checked) =>
                                        setEditVoiceForm((p) => ({
                                            ...p,
                                            active: checked,
                                        }))
                                    }
                                />
                                <Label htmlFor="edit-voice-active">Active</Label>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleUpdateVoice}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    Save Changes
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingVoice(null)}
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