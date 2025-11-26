'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface CreditPackageFormData {
    id?: string;
    name: string;
    credits: number;
    price: number;
    discount_percentage: number;
    is_active: boolean;
    sort_order: number;
}

interface CreditPackageFormProps {
    pkg?: CreditPackageFormData;
    isEdit?: boolean;
}

export function CreditPackageForm({ pkg, isEdit = false }: CreditPackageFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<CreditPackageFormData>({
        id: pkg?.id,
        name: pkg?.name || '',
        credits: pkg?.credits ?? 0,
        price: pkg?.price ?? 0,
        discount_percentage: pkg?.discount_percentage ?? 0,
        is_active: pkg?.is_active ?? true,
        sort_order: pkg?.sort_order ?? 0,
    });

    const handleChange = (field: keyof CreditPackageFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = isEdit
                ? `/api/admin/credits/${formData.id}`
                : '/api/admin/credits';
            const method = isEdit ? 'PATCH' : 'POST';

            const payload: any = {
                name: formData.name,
                credits: Number(formData.credits),
                price: Number(formData.price),
                discount_percentage: Number(formData.discount_percentage),
                is_active: formData.is_active,
                sort_order: Number(formData.sort_order),
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save credit package');
            }

            toast({
                title: isEdit ? 'Credit package updated' : 'Credit package created',
                description: 'Credit package has been saved successfully',
            });

            router.push('/admin/credits');
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
                    <Label htmlFor="name">Package Name</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Mega Pack"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input
                        id="credits"
                        type="number"
                        min={0}
                        value={formData.credits}
                        onChange={(e) =>
                            handleChange('credits', parseInt(e.target.value || '0', 10))
                        }
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="price">Price (IDR)</Label>
                    <Input
                        id="price"
                        type="number"
                        min={0}
                        value={formData.price}
                        onChange={(e) =>
                            handleChange('price', parseInt(e.target.value || '0', 10))
                        }
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="discount_percentage">Discount (%)</Label>
                    <Input
                        id="discount_percentage"
                        type="number"
                        min={0}
                        max={100}
                        value={formData.discount_percentage}
                        onChange={(e) =>
                            handleChange(
                                'discount_percentage',
                                parseInt(e.target.value || '0', 10)
                            )
                        }
                    />
                    <p className="text-xs text-muted-foreground">
                        Optional discount compared to base pricing
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="sort_order">Sort Order</Label>
                    <Input
                        id="sort_order"
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) =>
                            handleChange('sort_order', parseInt(e.target.value || '0', 10))
                        }
                    />
                    <p className="text-xs text-muted-foreground">
                        Lower numbers appear first on the pricing page
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => handleChange('is_active', checked)}
                    />
                    <Label htmlFor="is_active">Active</Label>
                </div>
            </div>

            <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEdit ? 'Update Package' : 'Create Package'}
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                >
                    Cancel
                </Button>
            </div>
        </form>
    );
}