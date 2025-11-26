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

interface CreditUsageData {
    date: string;
    credits: number;
}

interface CreditUsageChartProps {
    data: CreditUsageData[];
}

export function CreditUsageChart({ data }: CreditUsageChartProps) {
    const chartData = useMemo(() => {
        return data.map((item) => ({
            ...item,
            date: new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            }),
        }));
    }, [data]);

    const totalCredits = useMemo(() => {
        return data.reduce((sum, item) => sum + item.credits, 0);
    }, [data]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Credit Usage</CardTitle>
                <CardDescription>
                    Last 30 days • Total: {totalCredits.toLocaleString()} credits
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
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="credits"
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
