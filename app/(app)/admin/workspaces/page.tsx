'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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

export default function AdminWorkspacesPage() {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchWorkspaces();
  }, [search]);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/workspaces?${params}`);
      const data = await response.json();

      if (response.ok) {
        setWorkspaces(data.workspaces || []);
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
    fetchWorkspaces();
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Workspace Management</h1>
          <p className="text-muted-foreground">Monitor and manage all workspaces</p>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or owner..."
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
          <CardDescription>All workspaces in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : workspaces.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspaces.map((ws) => (
                  <TableRow key={ws.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ws.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{ws.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ws.owner_profile
                        ? `${ws.owner_profile.first_name ?? ''} ${ws.owner_profile.last_name ?? ''}`.trim() ||
                          ws.owner_profile.id
                        : 'Unknown'}
                    </TableCell>
                    <TableCell>{(ws.credit_count ?? 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={ws.is_active ? 'default' : 'secondary'}>
                        {ws.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(ws.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/workspaces/${ws.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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