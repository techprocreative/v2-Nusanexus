'use client';

import { useState, useEffect } from 'react';
import { PresetCard } from '@/components/presets/preset-card';
import { SearchBar } from '@/components/presets/search-bar';
import { CategoryFilter } from '@/components/presets/category-filter';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Preset {
    id: string;
    title: string;
    description: string;
    type: string;
    image?: string;
    color?: string;
    category?: {
        id: string;
        title: string;
    };
}

interface Category {
    id: string;
    title: string;
}

export default function PresetsPage() {
    const { toast } = useToast();
    const [presets, setPresets] = useState<Preset[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCategories();
        fetchPresets();
    }, []);

    useEffect(() => {
        fetchPresets();
    }, [selectedCategory, searchQuery]);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch categories');
            }

            setCategories(data.categories || []);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const fetchPresets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCategory) {
                params.append('category_id', selectedCategory);
            }
            if (searchQuery) {
                params.append('search', searchQuery);
            }

            const response = await fetch(`/api/presets?${params.toString()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch presets');
            }

            setPresets(data.presets || []);
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

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleCategorySelect = (categoryId: string | null) => {
        setSelectedCategory(categoryId);
    };

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">AI Presets</h1>
                <p className="text-muted-foreground">
                    Browse and use pre-built AI templates for various tasks
                </p>
            </div>

            <div className="flex gap-6">
                {/* Sidebar */}
                <aside className="w-64 flex-shrink-0">
                    <div className="sticky top-4">
                        <CategoryFilter
                            categories={categories}
                            selectedCategory={selectedCategory}
                            onSelectCategory={handleCategorySelect}
                        />
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="mb-6">
                        <SearchBar onSearch={handleSearch} />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : presets.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                No presets found. Try adjusting your filters.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {presets.map((preset) => (
                                <PresetCard key={preset.id} preset={preset} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
