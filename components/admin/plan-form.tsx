'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface PlanFormData {
    id?: string;
    name: string;
    display_name: string;
    monthly_credits: number;
    price: number;
    features: string[];
    is_active: boolean;
    sort_order: number;
}

interface PlanFormProps {
    plan?: PlanFormData;
    isEdit?: boolean;
}

export function PlanForm({ plan, isEdit = false }: PlanFormProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<PlanFormData>({
        id: plan?.id,
        name: plan?.name || '',
        display_name: plan?.display_name || '',
        monthly_credits: plan?.monthly_credits ?? 0,
        price: plan?.price ?? 0,
        features: Array.isArray(plan?.features) ? plan!.features : [],
        is_active: plan?.is_active ?? true,
        sort_order: plan?.sort_order ?? 0,
    });

    const handleChange = (field: keyof PlanFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFeaturesChange = (value: string) => {
        const lines = value
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        setFormData((prev) => ({ ...prev, features: lines }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = isEdit
                ? `/api/admin/plans/${formData.id}`
                : '/api/admin/plans';
            const method = isEdit ? 'PATCH' : 'POST';

            const payload: any = {
                name: formData.name,
                display_name: formData.display_name,
                monthly_credits: Number(formData.monthly_credits),
                price: Number(formData.price),
                features: formData.features,
                is_active: formData.is_active,
                sort_order: Number(formData.sort_order),
            };

            if (isEdit) {
                // Do not send immutable name on edit
                delete payload.name;
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save plan');
            }

            toast({
                title: isEdit ? 'Plan updated' : 'Plan created',
                description: 'Subscription plan has been saved successfully',
            });

            router.push('/admin/plans');
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
                {!isEdit && (
                    <div className="space-y-2">
                        <Label htmlFor="name">Plan Name (Internal)</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="pro"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Unique identifier (used in code & logic)
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                        id="display_name"
                        value={formData.display_name}
                        onChange={(e) => handleChange('display_name', e.target.value)}
                        placeholder="Pro"
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Name shown on pricing page
                    </p>
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
                    <p className="text-xs text-muted-foreground">
                        Monthly price in Rupiah (0 for free plan)
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="monthly_credits">Monthly Credits</Label>
                    <Input
                        id="monthly_credits"
                        type="number"
                        min={0}
                        value={formData.monthly_credits}
                        onChange={(e) =>
                            handleChange(
                                'monthly_credits',
                                parseInt(e.target.value || '0', 10)
                            )
                        }
                        required
                    />
                    <p className="text-xs text-muted-foreground">
                        Number of credits allocated per month
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

            <div className="space-y-2">
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea
                    id="features"
                    value={formData.features.join('\n')}
                    onChange={(e) => handleFeaturesChange(e.target.value)}
                    rows={6}
                    placeholder="Example:\nAll AI models access\n5,000 credits/month\nPriority support"
                />
                <p className="text-xs text-muted-foreground">
                    These features will be shown as bullet points on the pricing page
                </p>
            </div>

            <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEdit ? 'Update Plan' : 'Create Plan'}
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