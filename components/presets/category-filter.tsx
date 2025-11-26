'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Category {
    id: string;
    title: string;
}

interface CategoryFilterProps {
    categories: Category[];
    selectedCategory: string | null;
    onSelectCategory: (categoryId: string | null) => void;
    presetCounts?: Record<string, number>;
}

export function CategoryFilter({
    categories,
    selectedCategory,
    onSelectCategory,
    presetCounts = {},
}: CategoryFilterProps) {
    return (
        <div className="space-y-4">
            <div>
                <h3 className="font-semibold mb-3">Categories</h3>
                <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                        <Button
                            variant={selectedCategory === null ? 'default' : 'ghost'}
                            className="w-full justify-between"
                            onClick={() => onSelectCategory(null)}
                        >
                            <span>All Presets</span>
                            {presetCounts['all'] && (
                                <Badge variant="secondary">{presetCounts['all']}</Badge>
                            )}
                        </Button>
                        <Separator />
                        {categories.map((category) => (
                            <Button
                                key={category.id}
                                variant={selectedCategory === category.id ? 'default' : 'ghost'}
                                className="w-full justify-between"
                                onClick={() => onSelectCategory(category.id)}
                            >
                                <span>{category.title}</span>
                                {presetCounts[category.id] && (
                                    <Badge variant="secondary">{presetCounts[category.id]}</Badge>
                                )}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
