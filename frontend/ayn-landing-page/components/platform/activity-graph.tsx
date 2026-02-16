"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
    { time: '00:00', value: 2400 },
    { time: '04:00', value: 1398 },
    { time: '08:00', value: 9800 },
    { time: '12:00', value: 3908 },
    { time: '16:00', value: 4800 },
    { time: '20:00', value: 3800 },
    { time: '24:00', value: 4300 },
]

export function ActivityChart() {
    return (
        <GlassCard variant={3} className="h-[300px] w-full p-6" shine>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold tracking-tight">Horus Activity</h3>
                    <p className="text-sm text-muted-foreground">Real-time analysis load</p>
                </div>
                <div className="flex gap-2">
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-medium text-emerald-500">Live</span>
                </div>
            </div>

            <div className="h-[200px] w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="rgba(255,255,255,0.2)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.2)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value: number) => `${value / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                borderColor: 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="var(--brand)"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </GlassCard>
    )
}
