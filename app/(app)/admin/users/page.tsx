'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Search, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminUsersPage() {
    const { toast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<any>(null);

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(search && { search }),
            });

            const response = await fetch(`/api/admin/users?${params}`);
            const data = await response.json();

            if (response.ok) {
                setUsers(data.users || []);
                setPagination(data.pagination);
            } else {
                toast({
                    title: 'Error',
                    description: data.error || 'Failed to fetch users',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to fetch users',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const getFullName = (user: any) => {
        const first = user.first_name || '';
        const last = user.last_name || '';
        const full = `${first} ${last}`.trim();
        return full || 'No name';
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-muted-foreground">Manage all users in the system</p>
                </div>
            </div>

            {/* Search */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                        {pagination && `Showing ${users.length} of ${pagination.total} users`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : users.length > 0 ? (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Workspace</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{getFullName(user)}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        ID: {user.id}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {user.workspaces?.name || 'No workspace'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        user.status === 'active' ? 'default' : 'secondary'
                                                    }
                                                >
                                                    {user.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{user.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/admin/users/${user.id}`}>
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
                            <p>No users found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
