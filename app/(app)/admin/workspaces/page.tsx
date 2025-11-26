'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function AdminWorkspacesPage() {
    const { toast } = useToast();
    const [workspaces, setWorkspaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);

    useEffect(() => {
        fetchWorkspaces();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search]);

    const fetchWorkspaces = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(search && { search }),
            });

            const response = await fetch(`/api/admin/workspaces?${params}`);
            const data = await response.json();

            if (response.ok) {
                setWorkspaces(data.workspaces || []);
                setPagination(data.pagination);
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to fetch workspaces',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch workspaces',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchWorkspaces();
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Workspace Management</h1>
                    <p className="text-muted-foreground">
                        View and manage all workspaces in the system
                    </p>
                </div>
            </div>

            {/* Search */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by workspace name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Workspaces Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Workspaces</CardTitle>
                    <CardDescription>
                        {pagination && `Showing ${workspaces.length} of ${pagination.total} workspaces`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : workspaces.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Workspace ID</TableHead>
                                        <TableHead>Credits</TableHead>
                                        <TableHead>Trial</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {workspaces.map((ws) => (
                                        <TableRow key={ws.id}>
                                            <TableCell className="font-medium">{ws.name}</TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {ws.id.substring(0, 8)}...
                                            </TableCell>
                                            <TableCell>
                                                {Number(ws.credit_count ?? 0).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={ws.is_trialed ? 'secondary' : 'outline'}
                                                >
                                                    {ws.is_trialed ? 'Trial' : 'Regular'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {ws.created_at
                                                    ? new Date(ws.created_at).toLocaleDateString()
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/admin/workspaces/${ws.id}`}>
                                                    <Button size="sm" variant="outline">
                                                        View Details
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {pagination && pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page - 1)}
                                            disabled={page === 1}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(page + 1)}
                                            disabled={page === pagination.totalPages}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No workspaces found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}