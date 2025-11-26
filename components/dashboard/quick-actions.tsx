'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Image, Mic, Code, Library, Users } from 'lucide-react';

const actions = [
    {
        title: 'Generate Text',
        description: 'Create AI-powered content',
        icon: FileText,
        href: '/writer',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
    },
    {
        title: 'Generate Image',
        description: 'Create stunning visuals',
        icon: Image,
        href: '/image',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
    },
    {
        title: 'Text to Speech',
        description: 'Convert text to audio',
        icon: Mic,
        href: '/voice',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
    },
    {
        title: 'Generate Code',
        description: 'AI-powered coding',
        icon: Code,
        href: '/code',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
    },
    {
        title: 'View Library',
        description: 'Browse your creations',
        icon: Library,
        href: '/library',
        color: 'text-pink-600',
        bgColor: 'bg-pink-100',
    },
    {
        title: 'Manage Team',
        description: 'Workspace members',
        icon: Users,
        href: '/workspace',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
    },
];

export function QuickActions() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={action.href}
                                href={action.href}
                                className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
                            >
                                <div className={`p-3 rounded-full ${action.bgColor}`}>
                                    <Icon className={`h-6 w-6 ${action.color}`} />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-sm">{action.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {action.description}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
