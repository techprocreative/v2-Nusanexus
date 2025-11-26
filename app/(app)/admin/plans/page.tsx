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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

interface SubscriptionPlan {
    id: string;
    name: string;
    display_name: string;
    monthly_credits: number;
    price: number;
    features: string[] | null;
    is_active: boolean | null;
    sort_order: number | null;
}

interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    price: number;
    discount_percentage: number | null;
    is_active: boolean | null;
    sort_order: number | null;
}

export default function AdminPlansPage() {
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [packages, setPackages] = useState<CreditPackage[]>([]);

    // Create plan form
    const [newPlan, setNewPlan] = useState({
        name: '',
        display_name: '',
        monthly_credits: '',
        price: '',
        featuresText: '',
        is_active: true,
        sort_order: '',
    });

    // Edit plan
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [editPlanForm, setEditPlanForm] = useState({
        name: '',
        display_name: '',
        monthly_credits: '',
        price: '',
        featuresText: '',
        is_active: true,
        sort_order: '',
    });

    // Create package form
    const [newPackage, setNewPackage] = useState({
        name: '',
        credits: '',
        price: '',
        discount_percentage: '',
        is_active: true,
        sort_order: '',
    });

    // Edit package
    const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
    const [editPackageForm, setEditPackageForm] = useState({
        name: '',
        credits: '',
        price: '',
        discount_percentage: '',
        is_active: true,
        sort_order: '',
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [plansRes, packagesRes] = await Promise.all([
                fetch('/api/admin/subscription-plans'),
                fetch('/api/admin/credit-packages'),
            ]);

            const plansData = await plansRes.json();
            const packagesData = await packagesRes.json();

            if (!plansRes.ok) {
                throw new Error(plansData.error || 'Failed to load plans');
            }
            if (!packagesRes.ok) {
                throw new Error(packagesData.error || 'Failed to load credit packages');
            }

            setPlans(plansData.plans || []);
            setPackages(packagesData.packages || []);
        } catch (error: any) {
            console.error('Error loading plans data:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load plans data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const parseFeatures = (text: string): string[] => {
        return text
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    };

    const handleCreatePlan = async () => {
        if (!newPlan.name || !newPlan.display_name) {
            toast({
                title: 'Validation error',
                description: 'Name and display name are required',
                variant: 'destructive',
            });
            return;
        }

        const monthlyCredits = Number(newPlan.monthly_credits);
        const price = Number(newPlan.price);
        const sortOrder = newPlan.sort_order ? Number(newPlan.sort_order) : 0;

        if (Number.isNaN(monthlyCredits) || Number.isNaN(price)) {
            toast({
                title: 'Validation error',
                description: 'Monthly credits and price must be numbers',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/admin/subscription-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newPlan.name,
                    display_name: newPlan.display_name,
                    monthly_credits: monthlyCredits,
                    price,
                    features: parseFeatures(newPlan.featuresText),
                    is_active: newPlan.is_active,
                    sort_order: sortOrder,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to create plan');
            }

            toast({ title: 'Plan created', description: 'Subscription plan has been created.' });
            setNewPlan({
                name: '',
                display_name: '',
                monthly_credits: '',
                price: '',
                featuresText: '',
                is_active: true,
                sort_order: '',
            });
            fetchData();
        } catch (error: any) {
            console.error('Error creating plan:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create plan',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const startEditPlan = (plan: SubscriptionPlan) => {
        setEditingPlan(plan);
        setEditPlanForm({
            name: plan.name,
            display_name: plan.display_name,
            monthly_credits: String(plan.monthly_credits),
            price: String(plan.price),
            featuresText: Array.isArray(plan.features) ? plan.features.join('\n') : '',
            is_active: plan.is_active ?? true,
            sort_order: plan.sort_order != null ? String(plan.sort_order) : '',
        });
    };

    const handleUpdatePlan = async () => {
        if (!editingPlan) return;

        const monthlyCredits = Number(editPlanForm.monthly_credits);
        const price = Number(editPlanForm.price);
        const sortOrder = editPlanForm.sort_order ? Number(editPlanForm.sort_order) : 0;

        if (Number.isNaN(monthlyCredits) || Number.isNaN(price)) {
            toast({
                title: 'Validation error',
                description: 'Monthly credits and price must be numbers',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/admin/subscription-plans/${editingPlan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editPlanForm.name,
                    display_name: editPlanForm.display_name,
                    monthly_credits: monthlyCredits,
                    price,
                    features: parseFeatures(editPlanForm.featuresText),
                    is_active: editPlanForm.is_active,
                    sort_order: sortOrder,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update plan');
            }

            toast({ title: 'Plan updated', description: 'Subscription plan has been updated.' });
            setEditingPlan(null);
            fetchData();
        } catch (error: any) {
            console.error('Error updating plan:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update plan',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePlanActive = async (plan: SubscriptionPlan) => {
        try {
            const res = await fetch(`/api/admin/subscription-plans/${plan.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !plan.is_active }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update plan status');
            }
            fetchData();
        } catch (error: any) {
            console.error('Error toggling plan status:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update plan status',
                variant: 'destructive',
            });
        }
    };

    const handleCreatePackage = async () => {
        if (!newPackage.name) {
            toast({
                title: 'Validation error',
                description: 'Name is required',
                variant: 'destructive',
            });
            return;
        }

        const credits = Number(newPackage.credits);
        const price = Number(newPackage.price);
        const discount = newPackage.discount_percentage
            ? Number(newPackage.discount_percentage)
            : 0;
        const sortOrder = newPackage.sort_order ? Number(newPackage.sort_order) : 0;

        if (Number.isNaN(credits) || Number.isNaN(price)) {
            toast({
                title: 'Validation error',
                description: 'Credits and price must be numbers',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/admin/credit-packages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newPackage.name,
                    credits,
                    price,
                    discount_percentage: discount,
                    is_active: newPackage.is_active,
                    sort_order: sortOrder,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to create credit package');
            }

            toast({
                title: 'Credit package created',
                description: 'Credit package has been created.',
            });
            setNewPackage({
                name: '',
                credits: '',
                price: '',
                discount_percentage: '',
                is_active: true,
                sort_order: '',
            });
            fetchData();
        } catch (error: any) {
            console.error('Error creating credit package:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to create credit package',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const startEditPackage = (pkg: CreditPackage) => {
        setEditingPackage(pkg);
        setEditPackageForm({
            name: pkg.name,
            credits: String(pkg.credits),
            price: String(pkg.price),
            discount_percentage:
                pkg.discount_percentage != null ? String(pkg.discount_percentage) : '',
            is_active: pkg.is_active ?? true,
            sort_order: pkg.sort_order != null ? String(pkg.sort_order) : '',
        });
    };

    const handleUpdatePackage = async () => {
        if (!editingPackage) return;

        const credits = Number(editPackageForm.credits);
        const price = Number(editPackageForm.price);
        const discount = editPackageForm.discount_percentage
            ? Number(editPackageForm.discount_percentage)
            : 0;
        const sortOrder = editPackageForm.sort_order ? Number(editPackageForm.sort_order) : 0;

        if (Number.isNaN(credits) || Number.isNaN(price)) {
            toast({
                title: 'Validation error',
                description: 'Credits and price must be numbers',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(`/api/admin/credit-packages/${editingPackage.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editPackageForm.name,
                    credits,
                    price,
                    discount_percentage: discount,
                    is_active: editPackageForm.is_active,
                    sort_order: sortOrder,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update credit package');
            }

            toast({
                title: 'Credit package updated',
                description: 'Credit package has been updated.',
            });
            setEditingPackage(null);
            fetchData();
        } catch (error: any) {
            console.error('Error updating credit package:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update credit package',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePackageActive = async (pkg: CreditPackage) => {
        try {
            const res = await fetch(`/api/admin/credit-packages/${pkg.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_active: !pkg.is_active }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to update package status');
            }
            fetchData();
        } catch (error: any) {
            console.error('Error toggling package status:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update package status',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Plans &amp; Credits</h1>
                <p className="text-muted-foreground">
                    Manage subscription plans and one-time credit packages
                </p>
            </div>

            <Tabs defaultValue="plans" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
                    <TabsTrigger value="credits">Credit Packages</TabsTrigger>
                </TabsList>

                <TabsContent value="plans" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Plan</CardTitle>
                            <CardDescription>
                                Define a new subscription tier for your customers.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="plan-name">Internal Name</Label>
                                    <Input
                                        id="plan-name"
                                        value={newPlan.name}
                                        onChange={(e) =>
                                            setNewPlan((p) => ({ ...p, name: e.target.value }))
                                        }
                                        placeholder="e.g. pro"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plan-display-name">Display Name</Label>
                                    <Input
                                        id="plan-display-name"
                                        value={newPlan.display_name}
                                        onChange={(e) =>
                                            setNewPlan((p) => ({
                                                ...p,
                                                display_name: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. Pro"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plan-credits">Monthly Credits</Label>
                                    <Input
                                        id="plan-credits"
                                        type="number"
                                        value={newPlan.monthly_credits}
                                        onChange={(e) =>
                                            setNewPlan((p) => ({
                                                ...p,
                                                monthly_credits: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. 5000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plan-price">Price (IDR/month)</Label>
                                    <Input
                                        id="plan-price"
                                        type="number"
                                        value={newPlan.price}
                                        onChange={(e) =>
                                            setNewPlan((p) => ({
                                                ...p,
                                                price: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. 399000"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="plan-features">
                                        Features (one per line)
                                    </Label>
                                    <Textarea
                                        id="plan-features"
                                        value={newPlan.featuresText}
                                        onChange={(e) =>
                                            setNewPlan((p) => ({
                                                ...p,
                                                featuresText: e.target.value,
                                            }))
                                        }
                                        placeholder="- All AI models access
- 5,000 credits/month
- Priority support"
                                        className="min-h-[160px]"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="plan-active">Active</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Inactive plans are hidden from pricing page.
                                        </p>
                                    </div>
                                    <Switch
                                        id="plan-active"
                                        checked={newPlan.is_active}
                                        onCheckedChange={(checked) =>
                                            setNewPlan((p) => ({ ...p, is_active: checked }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plan-sort-order">Sort Order</Label>
                                    <Input
                                        id="plan-sort-order"
                                        type="number"
                                        value={newPlan.sort_order}
                                        onChange={(e) =>
                                            setNewPlan((p) => ({
                                                ...p,
                                                sort_order: e.target.value,
                                            }))
                                        }
                                        placeholder="1 = top"
                                    />
                                </div>
                                <Button
                                    onClick={handleCreatePlan}
                                    disabled={loading}
                                    className="w-full"
                                >
                                    Create Plan
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Existing Plans</CardTitle>
                            <CardDescription>
                                Edit or disable existing subscription plans.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {plans.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No subscription plans defined yet.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {plans.map((plan) => (
                                        <div
                                            key={plan.id}
                                            className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-lg p-3 gap-3"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">
                                                        {plan.display_name}
                                                    </p>
                                                    {!plan.is_active && (
                                                        <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {plan.name} •{' '}
                                                    {plan.monthly_credits.toLocaleString()} credits • Rp{' '}
                                                    {plan.price.toLocaleString('id-ID')}/month
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => startEditPlan(plan)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleTogglePlanActive(plan)}
                                                >
                                                    {plan.is_active ? 'Disable' : 'Enable'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {editingPlan && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Edit Plan</CardTitle>
                                <CardDescription>
                                    Update fields for {editingPlan.display_name}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-plan-name">Internal Name</Label>
                                        <Input
                                            id="edit-plan-name"
                                            value={editPlanForm.name}
                                            onChange={(e) =>
                                                setEditPlanForm((p) => ({
                                                    ...p,
                                                    name: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-plan-display-name">
                                            Display Name
                                        </Label>
                                        <Input
                                            id="edit-plan-display-name"
                                            value={editPlanForm.display_name}
                                            onChange={(e) =>
                                                setEditPlanForm((p) => ({
                                                    ...p,
                                                    display_name: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-plan-credits">Monthly Credits</Label>
                                        <Input
                                            id="edit-plan-credits"
                                            type="number"
                                            value={editPlanForm.monthly_credits}
                                            onChange={(e) =>
                                                setEditPlanForm((p) => ({
                                                    ...p,
                                                    monthly_credits: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-plan-price">Price (IDR/month)</Label>
                                        <Input
                                            id="edit-plan-price"
                                            type="number"
                                            value={editPlanForm.price}
                                            onChange={(e) =>
                                                setEditPlanForm((p) => ({
                                                    ...p,
                                                    price: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-plan-features">
                                            Features (one per line)
                                        </Label>
                                        <Textarea
                                            id="edit-plan-features"
                                            value={editPlanForm.featuresText}
                                            onChange={(e) =>
                                                setEditPlanForm((p) => ({
                                                    ...p,
                                                    featuresText: e.target.value,
                                                }))
                                            }
                                            className="min-h-[160px]"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="edit-plan-active">Active</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Inactive plans are hidden from pricing page.
                                            </p>
                                        </div>
                                        <Switch
                                            id="edit-plan-active"
                                            checked={editPlanForm.is_active}
                                            onCheckedChange={(checked) =>
                                                setEditPlanForm((p) => ({
                                                    ...p,
                                                    is_active: checked,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-plan-sort-order">Sort Order</Label>
                                        <Input
                                            id="edit-plan-sort-order"
                                            type="number"
                                            value={editPlanForm.sort_order}
                                            onChange={(e) =>
                                                setEditPlanForm((p) => ({
                                                    ...p,
                                                    sort_order: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleUpdatePlan}
                                            disabled={loading}
                                            className="flex-1"
                                        >
                                            Save Changes
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditingPlan(null)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="credits" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Credit Package</CardTitle>
                            <CardDescription>
                                Define one-time credit bundles for users to purchase.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pkg-name">Name</Label>
                                    <Input
                                        id="pkg-name"
                                        value={newPackage.name}
                                        onChange={(e) =>
                                            setNewPackage((p) => ({ ...p, name: e.target.value }))
                                        }
                                        placeholder="e.g. Small Pack"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pkg-credits">Credits</Label>
                                    <Input
                                        id="pkg-credits"
                                        type="number"
                                        value={newPackage.credits}
                                        onChange={(e) =>
                                            setNewPackage((p) => ({
                                                ...p,
                                                credits: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. 500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pkg-price">Price (IDR)</Label>
                                    <Input
                                        id="pkg-price"
                                        type="number"
                                        value={newPackage.price}
                                        onChange={(e) =>
                                            setNewPackage((p) => ({
                                                ...p,
                                                price: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. 59000"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="pkg-discount">Discount (%)</Label>
                                    <Input
                                        id="pkg-discount"
                                        type="number"
                                        value={newPackage.discount_percentage}
                                        onChange={(e) =>
                                            setNewPackage((p) => ({
                                                ...p,
                                                discount_percentage: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. 10"
                                    />
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="space-y-1">
                                        <Label htmlFor="pkg-active">Active</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Inactive packages are hidden from pricing page.
                                        </p>
                                    </div>
                                    <Switch
                                        id="pkg-active"
                                        checked={newPackage.is_active}
                                        onCheckedChange={(checked) =>
                                            setNewPackage((p) => ({
                                                ...p,
                                                is_active: checked,
                                            }))
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pkg-sort-order">Sort Order</Label>
                                    <Input
                                        id="pkg-sort-order"
                                        type="number"
                                        value={newPackage.sort_order}
                                        onChange={(e) =>
                                            setNewPackage((p) => ({
                                                ...p,
                                                sort_order: e.target.value,
                                            }))
                                        }
                                        placeholder="1 = top"
                                    />
                                </div>
                                <Button
                                    onClick={handleCreatePackage}
                                    disabled={loading}
                                    className="w-full"
                                >
                                    Create Package
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Existing Credit Packages</CardTitle>
                            <CardDescription>
                                Edit or disable existing credit bundles.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {packages.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No credit packages defined yet.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {packages.map((pkg) => (
                                        <div
                                            key={pkg.id}
                                            className="flex flex-col md:flex-row md:items-center md:justify-between border rounded-lg p-3 gap-3"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold">{pkg.name}</p>
                                                    {!pkg.is_active && (
                                                        <span className="text-xs px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {pkg.credits.toLocaleString()} credits • Rp{' '}
                                                    {pkg.price.toLocaleString('id-ID')}
                                                </p>
                                                {pkg.discount_percentage != null &&
                                                    pkg.discount_percentage > 0 && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Discount: {pkg.discount_percentage}%
                                                        </p>
                                                    )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => startEditPackage(pkg)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleTogglePackageActive(pkg)}
                                                >
                                                    {pkg.is_active ? 'Disable' : 'Enable'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {editingPackage && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Edit Credit Package</CardTitle>
                                <CardDescription>
                                    Update fields for {editingPackage.name}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-pkg-name">Name</Label>
                                        <Input
                                            id="edit-pkg-name"
                                            value={editPackageForm.name}
                                            onChange={(e) =>
                                                setEditPackageForm((p) => ({
                                                    ...p,
                                                    name: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-pkg-credits">Credits</Label>
                                        <Input
                                            id="edit-pkg-credits"
                                            type="number"
                                            value={editPackageForm.credits}
                                            onChange={(e) =>
                                                setEditPackageForm((p) => ({
                                                    ...p,
                                                    credits: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-pkg-price">Price (IDR)</Label>
                                        <Input
                                            id="edit-pkg-price"
                                            type="number"
                                            value={editPackageForm.price}
                                            onChange={(e) =>
                                                setEditPackageForm((p) => ({
                                                    ...p,
                                                    price: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-pkg-discount">
                                            Discount Percentage
                                        </Label>
                                        <Input
                                            id="edit-pkg-discount"
                                            type="number"
                                            value={editPackageForm.discount_percentage}
                                            onChange={(e) =>
                                                setEditPackageForm((p) => ({
                                                    ...p,
                                                    discount_percentage: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="edit-pkg-active">Active</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Inactive packages are hidden from pricing page.
                                            </p>
                                        </div>
                                        <Switch
                                            id="edit-pkg-active"
                                            checked={editPackageForm.is_active}
                                            onCheckedChange={(checked) =>
                                                setEditPackageForm((p) => ({
                                                    ...p,
                                                    is_active: checked,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-pkg-sort-order">Sort Order</Label>
                                        <Input
                                            id="edit-pkg-sort-order"
                                            type="number"
                                            value={editPackageForm.sort_order}
                                            onChange={(e) =>
                                                setEditPackageForm((p) => ({
                                                    ...p,
                                                    sort_order: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleUpdatePackage}
                                            disabled={loading}
                                            className="flex-1"
                                        >
                                            Save Changes
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditingPackage(null)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}