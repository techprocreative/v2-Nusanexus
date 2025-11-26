'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CreateWorkspaceDialog } from './create-workspace-dialog';

interface Workspace {
    id: string;
    name: string;
}

interface WorkspaceSwitcherProps {
    workspaces: Workspace[];
    currentWorkspaceId: string;
}

export function WorkspaceSwitcher({
    workspaces,
    currentWorkspaceId,
}: WorkspaceSwitcherProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

    const handleSwitchWorkspace = async (workspaceId: string) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        await supabase
            .from('profiles')
            .update({ current_workspace_id: workspaceId })
            .eq('id', user.id);

        setOpen(false);
        router.refresh();
    };

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[200px] justify-between"
                    >
                        <span className="truncate">{currentWorkspace?.name || 'Select workspace'}</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]" align="start">
                    <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {workspaces.map((workspace) => (
                        <DropdownMenuItem
                            key={workspace.id}
                            onSelect={() => handleSwitchWorkspace(workspace.id)}
                        >
                            <Check
                                className={cn(
                                    'mr-2 h-4 w-4',
                                    currentWorkspaceId === workspace.id
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                )}
                            />
                            <span className="truncate">{workspace.name}</span>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create workspace
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CreateWorkspaceDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
            />
        </>
    );
}
