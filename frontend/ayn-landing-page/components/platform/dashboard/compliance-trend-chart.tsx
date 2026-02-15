"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface TrendDataPoint {
    date: string
    score: number
}

interface ComplianceTrendChartProps {
    data: TrendDataPoint[]
    title?: string
    className?: string
}

export function ComplianceTrendChart({ data, title = "Compliance Trajectory", className }: ComplianceTrendChartProps) {
    const chartData = useMemo(() => {
        return data.length > 0 ? data : [
            { date: "Jan", score: 65 },
            { date: "Feb", score: 68 },
            { date: "Mar", score: 72 },
            { date: "Apr", score: 75 },
            { date: "May", score: 82 },
            { date: "Jun", score: 85 },
        ]
    }, [data])

    const currentScore = chartData[chartData.length - 1].score
    const previousScore = chartData[chartData.length - 2]?.score || 0
    const trend = currentScore >= previousScore ? "up" : "down"

    return (
        <div className={cn("glass-panel p-6 rounded-3xl flex flex-col", className)}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-zinc-800">{title}</h3>
                    <p className="text-xs text-zinc-500 font-medium mt-1">6-Month Historical Analysis</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-black text-primary">{currentScore}%</div>
                    <div className={cn("text-xs font-bold uppercase", trend === "up" ? "text-emerald-600" : "text-rose-600")}>
                        {trend === "up" ? "+" : ""}{currentScore - previousScore}% vs last month
                    </div>
                </div>
            </div>

            <div className="h-[200px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#71717a', fontWeight: 600 }}
                            dy={10}
                        />
                        <YAxis
                            hide
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}
                            cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="var(--primary)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorScore)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
