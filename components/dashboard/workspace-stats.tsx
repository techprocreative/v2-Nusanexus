'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CreditCard, Users, TrendingUp } from 'lucide-react';

interface WorkspaceStatsProps {
    stats: {
        totalItems: number;
        creditsUsedThisMonth: number;
        memberCount: number;
        itemsThisMonth: number;
    };
}

export function WorkspaceStats({ stats }: WorkspaceStatsProps) {
    const statCards = [
        {
            title: 'Total Generations',
            value: stats.totalItems.toLocaleString(),
            icon: FileText,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100',
        },
        {
            title: 'Credits This Month',
            value: stats.creditsUsedThisMonth.toLocaleString(),
            icon: CreditCard,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100',
        },
        {
            title: 'Team Members',
            value: stats.memberCount.toString(),
            icon: Users,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            title: 'This Month',
            value: stats.itemsThisMonth.toLocaleString(),
            icon: TrendingUp,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <div className={`p-2 rounded-full ${stat.bgColor}`}>
                                <Icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
