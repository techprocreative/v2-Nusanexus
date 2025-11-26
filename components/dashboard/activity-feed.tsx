'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import {
    FileText,
    Image,
    Users,
    Trash2,
    UserPlus,
    UserX,
    Settings,
} from 'lucide-react';

interface Activity {
    id: string;
    action: string;
    metadata: any;
    created_at: string;
    profiles: {
        first_name: string;
        last_name: string;
    } | null;
}

interface ActivityFeedProps {
    activities: Activity[];
}

const getActivityIcon = (action: string) => {
    switch (action) {
        case 'created_workspace':
            return Settings;
        case 'invited_member':
            return UserPlus;
        case 'removed_member':
            return UserX;
        case 'transferred_ownership':
            return Users;
        case 'created_item':
            return FileText;
        case 'deleted_item':
            return Trash2;
        case 'generated_image':
            return Image;
        default:
            return FileText;
    }
};

const getActivityMessage = (activity: Activity) => {
    const userName = activity.profiles
        ? `${activity.profiles.first_name} ${activity.profiles.last_name}`
        : 'Someone';

    switch (activity.action) {
        case 'created_workspace':
            return `${userName} created workspace "${activity.metadata?.workspace_name}"`;
        case 'invited_member':
            return `${userName} invited ${activity.metadata?.email}`;
        case 'removed_member':
            return `${userName} removed a member`;
        case 'transferred_ownership':
            return `${userName} transferred workspace ownership`;
        case 'created_item':
            return `${userName} created a new ${activity.metadata?.type || 'item'}`;
        case 'deleted_item':
            return `${userName} deleted an item`;
        case 'generated_image':
            return `${userName} generated an image`;
        default:
            return `${userName} performed an action`;
    }
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
    if (activities.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>No recent activity</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Activity will appear here as you and your team use the workspace.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Last {activities.length} activities</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {activities.map((activity) => {
                        const Icon = getActivityIcon(activity.action);
                        return (
                            <div key={activity.id} className="flex items-start gap-3">
                                <div className="mt-1 rounded-full bg-muted p-2">
                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm">{getActivityMessage(activity)}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(activity.created_at), {
                                            addSuffix: true,
                                        })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
