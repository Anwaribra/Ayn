import { GlassCard } from "@/components/ui/glass-card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ActivityChartProps {
    data?: { time: string; value: number }[]
}

export function ActivityChart({ data = [] }: ActivityChartProps) {
    const hasData = data && data.length > 0;

    return (
        <GlassCard variant={3} className="h-[300px] w-full p-6" shine>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold tracking-tight">Horus Activity</h3>
                    <p className="text-sm text-muted-foreground">Real-time analysis load</p>
                </div>
                <div className="flex gap-2">
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "var(--status-success)" }}></span>
                        <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: "var(--status-success)" }}></span>
                    </span>
                    <span className="text-xs font-medium" style={{ color: "var(--status-success)" }}>Live</span>
                </div>
            </div>

            <div className="h-[200px] w-full -ml-4">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                            <XAxis
                                dataKey="time"
                                stroke="var(--text-secondary)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="var(--text-secondary)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value: number) => `${value / 1000}k`}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--popover)',
                                    borderColor: 'var(--border)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '8px',
                                    color: 'var(--foreground)'
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
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground text-sm">No activity recorded</p>
                    </div>
                )}
            </div>
        </GlassCard>
    )
}
