'use client';

import { useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RevenueData {
    date: string;
    amount: number;
}

interface RevenueChartProps {
    data: RevenueData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
    const chartData = useMemo(() => {
        return data.map((item) => ({
            ...item,
            date: new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            }),
        }));
    }, [data]);

    const totalRevenue = useMemo(() => {
        return data.reduce((sum, item) => sum + item.amount, 0);
    }, [data]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue (All Workspaces)</CardTitle>
                <CardDescription>
                    Last 30 days • Total: Rp {totalRevenue.toLocaleString('id-ID')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="date"
                            className="text-xs"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                            className="text-xs"
                            tickFormatter={(value) =>
                                value >= 1_000_000
                                    ? `${Math.round(value / 1_000_000)}M`
                                    : value >= 1_000
                                    ? `${Math.round(value / 1_000)}K`
                                    : value.toString()
                            }
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip
                            formatter={(value: any) =>
                                `Rp ${Number(value).toLocaleString('id-ID')}`
                            }
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="amount"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}