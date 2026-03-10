import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ActivityChartProps {
    data?: { time: string; value: number }[]
}

export function ActivityChart({ data = [] }: ActivityChartProps) {
    const hasData = data && data.length > 0;

    return (
        <div className="glass-card h-[300px] w-full p-6 rounded-3xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">Horus Activity</h3>
                    <p className="text-sm text-muted-foreground">Real-time analysis load</p>
                </div>
                <div className="flex items-center gap-2">
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
                                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} opacity={0.5} />
                            <XAxis
                                dataKey="time"
                                stroke="var(--text-secondary)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                            />
                            <YAxis
                                stroke="var(--text-secondary)"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value: number) => `${value / 1000}k`}
                            />
                            <Tooltip
                                cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(5, 8, 16, 0.8)',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(12px)',
                                    WebkitBackdropFilter: 'blur(12px)',
                                    borderRadius: '12px',
                                    color: '#f5f5f3',
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                                    padding: '12px',
                                    fontSize: '12px',
                                    fontWeight: '600'
                                }}
                                itemStyle={{ color: '#fff', fontSize: '14px', fontWeight: '800' }}
                                labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="var(--primary)"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                animationDuration={2500}
                                animationEasing="ease-in-out"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground text-sm">No activity recorded</p>
                    </div>
                )}
            </div>
        </div>
    )
}
