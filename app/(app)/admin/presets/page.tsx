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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface Category {
    id: string;
    title: string;
}

interface Preset {
    id: string;
    title: string;
    description: string | null;
    type: string;
    category_id: string | null;
    is_locked: boolean;
    status: number;
    template: string | null;
    image: string | null;
    color: string | null;
    category?: {
        id: string;
        title: string;
    } | null;
}

const PRESET_TYPES = [
    { value: 'writer', label: 'Writer' },
    { value: 'coder', label: 'Coder' },
    { value: 'image', label: 'Image' },
    { value: 'voiceover', label: 'Voiceover' },
    { value: 'transcription', label: 'Transcription' },
];

export default function AdminPresetsPage() {
    const { toast } = useToast();

    const [categories, setCategories] = useState<Category[]>([]);
    const [presets, setPresets] = useState<Preset[]>([]);
    const [loading, setLoading] = useState(false);

    // Category form state
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editCategoryTitle, setEditCategoryTitle] = useState('');

    // Preset form state
    const [newPreset, setNewPreset] = useState({
        title: '',
        description: '',
        type: 'writer',
        category_id: '',
        template: '',
        image: '',
        color: '',
        is_locked: false,
        status: true,
    });

    const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
    const [editPresetForm, setEditPresetForm] = useState({
        title: '',
        description: '',
        type: 'writer',
        category_id: '',
        template: '',
        image: '',
        color: '',
        is_locked: false,
        status: true,
    });

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/admin/categories');
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to load categories');
            }
            setCategories(data.categories || []);
        } catch (error: any) {
            console.error('Error loading categories:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load categories',
                variant: 'destructive',
            });
        }
    };

    const fetchPresets = async () => {
        try {
            const res = await fetch('/api/admin/presets?include_inactive=true');
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to load presets');
            }
            setPresets(data.presets || []);
        } catch (error: any) {
            console.error('Error loading presets:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load presets',
                variant: 'destructive',
            });
        }
    };

    const loadAll = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchCategories(), fetchPresets()]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreateCategory = async () => {
        if (!newCategoryTitle.trim()) {
            toast({
                title: 'Validation error',
                description: 'Category title is required',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/admin/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newCategoryTitle.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to create category');
            }

            toast({ title: 'Category created' });
            setNewCategoryTitle('');
            fetchCategories();
        } catch (error: any) {
            console.error('Error creating category:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create category',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const startEditCategory = (category: Category) => {
        setEditingCategory(category);
        setEditCategoryTitle(category.title);
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory) return;
        if (!editCategoryTitle.trim()) {
            toast({
                title: 'Validation error',
                description: 'Category title is required',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editCategoryTitle.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update category');
            }

            toast({ title: 'Category updated' });
            setEditingCategory(null);
            setEditCategoryTitle('');
            fetchCategories();
        } catch (error: any) {
            console.error('Error updating category:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update category',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (category: Category) => {
        if (!window.confirm(`Delete category "${category.title}"?`)) return;

        try {
            setLoading(true);
            const res = await fetch(`/api/admin/categories/${category.id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete category');
            }

            toast({ title: 'Category deleted' });
            fetchCategories();
            fetchPresets();
        } catch (error: any) {
            console.error('Error deleting category:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete category',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePreset = async () => {
        if (!newPreset.title.trim()) {
            toast({
                title: 'Validation error',
                description: 'Preset title is required',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/admin/presets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newPreset.title.trim(),
                    description: newPreset.description || null,
                    type: newPreset.type,
                    category_id: newPreset.category_id || null,
                    template: newPreset.template || null,
                    image: newPreset.image || null,
                    color: newPreset.color || null,
                    is_locked: newPreset.is_locked,
                    status: newPreset.status ? 1 : 0,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to create preset');
            }

            toast({ title: 'Preset created' });
            setNewPreset({
                title: '',
                description: '',
                type: 'writer',
                category_id: '',
                template: '',
                image: '',
                color: '',
                is_locked: false,
                status: true,
            });
            fetchPresets();
        } catch (error: any) {
            console.error('Error creating preset:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create preset',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const startEditPreset = (preset: Preset) => {
        setEditingPreset(preset);
        setEditPresetForm({
            title: preset.title,
            description: preset.description || '',
            type: preset.type,
            category_id: preset.category_id || '',
            template: preset.template || '',
            image: preset.image || '',
            color: preset.color || '',
            is_locked: preset.is_locked,
            status: preset.status === 1,
        });
    };

    const handleUpdatePreset = async () => {
        if (!editingPreset) return;

        if (!editPresetForm.title.trim()) {
            toast({
                title: 'Validation error',
                description: 'Preset title is required',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/admin/presets/${editingPreset.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editPresetForm.title.trim(),
                    description: editPresetForm.description || null,
                    type: editPresetForm.type,
                    category_id: editPresetForm.category_id || null,
                    template: editPresetForm.template || null,
                    image: editPresetForm.image || null,
                    color: editPresetForm.color || null,
                    is_locked: editPresetForm.is_locked,
                    status: editPresetForm.status ? 1 : 0,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update preset');
            }

            toast({ title: 'Preset updated' });
            setEditingPreset(null);
            fetchPresets();
        } catch (error: any) {
            console.error('Error updating preset:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update preset',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePresetStatus = async (preset: Preset) => {
        try {
            const res = await fetch(`/api/admin/presets/${preset.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: preset.status === 1 ? 0 : 1 }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update preset status');
            }
            fetchPresets();
        } catch (error: any) {
            console.error('Error toggling preset status:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update preset status',
                variant: 'destructive',
            });
        }
    };

    const handleDeletePreset = async (preset: Preset) => {
        if (!window.confirm(`Delete preset "${preset.title}"?`)) return;

        try {
            const res = await fetch(`/api/admin/presets/${preset.id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete preset');
            }
            toast({ title: 'Preset deleted' });
            fetchPresets();
        } catch (error: any) {
            console.error('Error deleting preset:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to delete preset',
                variant: 'destructive',
            });
        }
    };

    const statusBadge = (status: number) =>
        status === 1 ? (
            <Badge variant="default">Active</Badge>
        ) : (
            <Badge variant="outline">Inactive</Badge>
        );

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Presets &amp; Categories</h1>
                <p className="text-muted-foreground">
                    Manage AI presets and their categories.
                </p>
            </div>

            {/* Categories */}
            <Card>
                <CardHeader>
                    <CardTitle>Categories</CardTitle>
                    <CardDescription>
                        Organize presets into high-level groups.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="new-category">New Category</Label>
                            <Input
                                id="new-category"
                                placeholder="e.g. Copywriting"
                                value={newCategoryTitle}
                                onChange={(e) => setNewCategoryTitle(e.target.value)}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                onClick={handleCreateCategory}
                                disabled={loading}
                                className="w-full"
                            >
                                Add Category
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No categories defined yet.
                            </p>
                        ) : (
                            categories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-lg p-3 gap-3"
                                >
                                    <div className="flex-1">
                                        {editingCategory?.id === category.id ? (
                                            <Input
                                                value={editCategoryTitle}
                                                onChange={(e) =>
                                                    setEditCategoryTitle(e.target.value)
                                                }
                                            />
                                        ) : (
                                            <p className="font-medium">{category.title}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {editingCategory?.id === category.id ? (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={handleUpdateCategory}
                                                    disabled={loading}
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setEditingCategory(null);
                                                        setEditCategoryTitle('');
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => startEditCategory(category)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        handleDeleteCategory(category)
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Presets */}
            <Card>
                <CardHeader>
                    <CardTitle>Create Preset</CardTitle>
                    <CardDescription>
                        Define reusable AI templates for writer, coder, image, and more.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="preset-title">Title</Label>
                            <Input
                                id="preset-title"
                                value={newPreset.title}
                                onChange={(e) =>
                                    setNewPreset((p) => ({ ...p, title: e.target.value }))
                                }
                                placeholder="e.g. Blog Post Generator"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="preset-description">Description</Label>
                            <Textarea
                                id="preset-description"
                                value={newPreset.description}
                                onChange={(e) =>
                                    setNewPreset((p) => ({
                                        ...p,
                                        description: e.target.value,
                                    }))
                                }
                                placeholder="Short description shown on presets grid"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="preset-type">Type</Label>
                            <Select
                                value={newPreset.type}
                                onValueChange={(value) =>
                                    setNewPreset((p) => ({ ...p, type: value }))
                                }
                            >
                                <SelectTrigger id="preset-type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRESET_TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="preset-category">Category</Label>
                            <Select
                                value={newPreset.category_id}
                                onValueChange={(value) =>
                                    setNewPreset((p) => ({ ...p, category_id: value }))
                                }
                            >
                                <SelectTrigger id="preset-category">
                                    <SelectValue placeholder="Select category (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="preset-template">Prompt Template</Label>
                            <Textarea
                                id="preset-template"
                                value={newPreset.template}
                                onChange={(e) =>
                                    setNewPreset((p) => ({
                                        ...p,
                                        template: e.target.value,
                                    }))
                                }
                                placeholder="Prompt template used when starting from this preset"
                                className="min-h-[150px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="preset-image">Image/Icon URL</Label>
                            <Input
                                id="preset-image"
                                value={newPreset.image}
                                onChange={(e) =>
                                    setNewPreset((p) => ({ ...p, image: e.target.value }))
                                }
                                placeholder="Optional image or icon URL"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="preset-color">Color (Tailwind or HEX)</Label>
                            <Input
                                id="preset-color"
                                value={newPreset.color}
                                onChange={(e) =>
                                    setNewPreset((p) => ({ ...p, color: e.target.value }))
                                }
                                placeholder="e.g. bg-blue-500 or #4F46E5"
                            />
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="preset-active"
                                    checked={newPreset.status}
                                    onCheckedChange={(checked) =>
                                        setNewPreset((p) => ({ ...p, status: checked }))
                                    }
                                />
                                <Label htmlFor="preset-active">Active</Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="preset-locked"
                                    checked={newPreset.is_locked}
                                    onCheckedChange={(checked) =>
                                        setNewPreset((p) => ({ ...p, is_locked: checked }))
                                    }
                                />
                                <Label htmlFor="preset-locked">Locked (non-editable by users)</Label>
                            </div>
                        </div>
                        <Button
                            onClick={handleCreatePreset}
                            disabled={loading}
                            className="w-full"
                        >
                            Create Preset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Existing Presets</CardTitle>
                    <CardDescription>
                        Edit, activate/deactivate, or delete existing presets.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {presets.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No presets defined yet.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {presets.map((preset) => (
                                <div
                                    key={preset.id}
                                    className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-lg p-3 gap-3"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{preset.title}</p>
                                            {statusBadge(preset.status)}
                                            {preset.is_locked && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Locked
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Type: {preset.type} • Category:{' '}
                                            {preset.category?.title || 'None'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => startEditPreset(preset)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                handleTogglePresetStatus(preset)
                                            }
                                        >
                                            {preset.status === 1 ? 'Deactivate' : 'Activate'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeletePreset(preset)}
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

            {editingPreset && (
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Preset</CardTitle>
                        <CardDescription>
                            Update fields for {editingPreset.title}.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-preset-title">Title</Label>
                                <Input
                                    id="edit-preset-title"
                                    value={editPresetForm.title}
                                    onChange={(e) =>
                                        setEditPresetForm((p) => ({
                                            ...p,
                                            title: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-preset-description">
                                    Description
                                </Label>
                                <Textarea
                                    id="edit-preset-description"
                                    value={editPresetForm.description}
                                    onChange={(e) =>
                                        setEditPresetForm((p) => ({
                                            ...p,
                                            description: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-preset-type">Type</Label>
                                <Select
                                    value={editPresetForm.type}
                                    onValueChange={(value) =>
                                        setEditPresetForm((p) => ({ ...p, type: value }))
                                    }
                                >
                                    <SelectTrigger id="edit-preset-type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PRESET_TYPES.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-preset-category">Category</Label>
                                <Select
                                    value={editPresetForm.category_id}
                                    onValueChange={(value) =>
                                        setEditPresetForm((p) => ({
                                            ...p,
                                            category_id: value,
                                        }))
                                    }
                                >
                                    <SelectTrigger id="edit-preset-category">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">None</SelectItem>
                                        {categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                {category.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-preset-template">Prompt Template</Label>
                                <Textarea
                                    id="edit-preset-template"
                                    value={editPresetForm.template}
                                    onChange={(e) =>
                                        setEditPresetForm((p) => ({
                                            ...p,
                                            template: e.target.value,
                                        }))
                                    }
                                    className="min-h-[150px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-preset-image">Image/Icon URL</Label>
                                <Input
                                    id="edit-preset-image"
                                    value={editPresetForm.image}
                                    onChange={(e) =>
                                        setEditPresetForm((p) => ({
                                            ...p,
                                            image: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-preset-color">Color</Label>
                                <Input
                                    id="edit-preset-color"
                                    value={editPresetForm.color}
                                    onChange={(e) =>
                                        setEditPresetForm((p) => ({
                                            ...p,
                                            color: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="edit-preset-active"
                                        checked={editPresetForm.status}
                                        onCheckedChange={(checked) =>
                                            setEditPresetForm((p) => ({
                                                ...p,
                                                status: checked,
                                            }))
                                        }
                                    />
                                    <Label htmlFor="edit-preset-active">Active</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id="edit-preset-locked"
                                        checked={editPresetForm.is_locked}
                                        onCheckedChange={(checked) =>
                                            setEditPresetForm((p) => ({
                                                ...p,
                                                is_locked: checked,
                                            }))
                                        }
                                    />
                                    <Label htmlFor="edit-preset-locked">Locked</Label>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleUpdatePreset}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    Save Changes
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingPreset(null)}
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