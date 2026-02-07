"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Link, Zap, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimelineItem {
    id: number;
    title: string;
    date: string;
    content: string;
    category: string;
    icon: React.ElementType;
    relatedIds: number[];
    status: "completed" | "in-progress" | "pending";
    energy: number;
}

interface RadialOrbitalTimelineProps {
    timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
    timelineData,
}: RadialOrbitalTimelineProps) {
    const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>(
        {}
    );
    const viewMode = "orbital" as const;
    const [rotationAngle, setRotationAngle] = useState<number>(0);
    const [autoRotate, setAutoRotate] = useState<boolean>(true);
    const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
    const centerOffset = { x: 0, y: 0 };
    const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const orbitRef = useRef<HTMLDivElement>(null);
    const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

    const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === containerRef.current || e.target === orbitRef.current) {
            setExpandedItems({});
            setActiveNodeId(null);
            setPulseEffect({});
            setAutoRotate(true);
        }
    };

    const toggleItem = (id: number) => {
        setExpandedItems((prev) => {
            const newState = { ...prev };
            Object.keys(newState).forEach((key) => {
                if (parseInt(key) !== id) {
                    newState[parseInt(key)] = false;
                }
            });

            newState[id] = !prev[id];

            if (!prev[id]) {
                setActiveNodeId(id);
                setAutoRotate(false);

                const relatedItems = getRelatedItems(id);
                const newPulseEffect: Record<number, boolean> = {};
                relatedItems.forEach((relId) => {
                    newPulseEffect[relId] = true;
                });
                setPulseEffect(newPulseEffect);

                centerViewOnNode(id);
            } else {
                setActiveNodeId(null);
                setAutoRotate(true);
                setPulseEffect({});
            }

            return newState;
        });
    };

    useEffect(() => {
        let rotationTimer: NodeJS.Timeout;

        if (autoRotate && viewMode === "orbital") {
            rotationTimer = setInterval(() => {
                setRotationAngle((prev) => {
                    const newAngle = (prev + 0.3) % 360;
                    return Number(newAngle.toFixed(3));
                });
            }, 50);
        }

        return () => {
            if (rotationTimer) {
                clearInterval(rotationTimer);
            }
        };
    }, [autoRotate, viewMode]);

    const centerViewOnNode = (nodeId: number) => {
        if (viewMode !== "orbital" || !nodeRefs.current[nodeId]) return;

        const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
        const totalNodes = timelineData.length;
        const targetAngle = (nodeIndex / totalNodes) * 360;

        setRotationAngle(270 - targetAngle);
    };

    const calculateNodePosition = (index: number, total: number) => {
        const angle = ((index / total) * 360 + rotationAngle) % 360;
        const radius = 160; // Slightly reduced radius for tighter fit
        const radian = (angle * Math.PI) / 180;

        const x = radius * Math.cos(radian) + centerOffset.x;
        const y = radius * Math.sin(radian) + centerOffset.y;

        const zIndex = Math.round(100 + 50 * Math.cos(radian));
        const opacity = Math.max(
            0.4,
            Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2))
        );

        return { x, y, angle, zIndex, opacity };
    };

    const getRelatedItems = (itemId: number): number[] => {
        const currentItem = timelineData.find((item) => item.id === itemId);
        return currentItem ? currentItem.relatedIds : [];
    };

    const isRelatedToActive = (itemId: number): boolean => {
        if (!activeNodeId) return false;
        const relatedItems = getRelatedItems(activeNodeId);
        return relatedItems.includes(itemId);
    };

    const getStatusStyles = (status: TimelineItem["status"]): string => {
        switch (status) {
            case "completed":
                return "text-white bg-primary border-primary";
            case "in-progress":
                return "text-foreground bg-accent border-border";
            case "pending":
                return "text-muted-foreground bg-muted/40 border-border";
            default:
                return "text-muted-foreground bg-muted/40 border-border";
        }
    };

    return (
        <div
            className="w-full h-full flex flex-col items-center justify-center bg-transparent overflow-hidden"
            ref={containerRef}
            onClick={handleContainerClick}
        >
            <div className="relative w-full max-w-2xl h-[500px] flex items-center justify-center">
                <div
                    className="absolute w-full h-full flex items-center justify-center"
                    ref={orbitRef}
                    style={{
                        perspective: "1000px",
                        transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
                    }}
                >
                    {/* Central Logo/Node */}
                    <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/40 animate-pulse flex items-center justify-center z-10 shadow-2xl shadow-primary/20">
                        <div className="absolute w-20 h-20 rounded-full border border-primary/20 animate-ping opacity-70"></div>
                        <div
                            className="absolute w-24 h-24 rounded-full border border-primary/10 animate-ping opacity-50"
                            style={{ animationDelay: "0.5s" }}
                        ></div>
                        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                        </div>
                    </div>

                    {/* Orbit Line */}
                    <div className="absolute w-[320px] h-[320px] rounded-full border border-primary/10"></div>

                    {timelineData.map((item, index) => {
                        const position = calculateNodePosition(index, timelineData.length);
                        const isExpanded = expandedItems[item.id];
                        const isRelated = isRelatedToActive(item.id);
                        const isPulsing = pulseEffect[item.id];
                        const Icon = item.icon;

                        const nodeStyle = {
                            transform: `translate(${position.x}px, ${position.y}px)`,
                            zIndex: isExpanded ? 200 : position.zIndex,
                            opacity: isExpanded ? 1 : position.opacity,
                        };

                        return (
                            <div
                                key={item.id}
                                ref={(el) => (nodeRefs.current[item.id] = el)}
                                className="absolute transition-all duration-700 cursor-pointer"
                                style={nodeStyle}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleItem(item.id);
                                }}
                            >
                                <div
                                    className={`absolute rounded-full -inset-1 ${isPulsing ? "animate-pulse duration-1000" : ""
                                        }`}
                                    style={{
                                        background: `radial-gradient(circle, rgba(var(--primary),0.15) 0%, rgba(var(--primary),0) 70%)`,
                                        width: `${item.energy * 0.4 + 40}px`,
                                        height: `${item.energy * 0.4 + 40}px`,
                                        left: `-${(item.energy * 0.4 + 40 - 40) / 2}px`,
                                        top: `-${(item.energy * 0.4 + 40 - 40) / 2}px`,
                                    }}
                                ></div>

                                <div
                                    className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${isExpanded
                                            ? "bg-primary text-primary-foreground"
                                            : isRelated
                                                ? "bg-primary/20 text-primary"
                                                : "bg-muted text-muted-foreground"
                                        }
                  border-2 
                  ${isExpanded
                                            ? "border-primary shadow-lg shadow-primary/30"
                                            : isRelated
                                                ? "border-primary animate-pulse"
                                                : "border-border"
                                        }
                  transition-all duration-300 transform
                  ${isExpanded ? "scale-150" : ""}
                `}
                                >
                                    <Icon size={16} />
                                </div>

                                <div
                                    className={`
                  absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap
                  text-[10px] font-bold tracking-wider uppercase
                  transition-all duration-300
                  ${isExpanded ? "text-foreground scale-110" : "text-muted-foreground"}
                `}
                                >
                                    {item.title}
                                </div>

                                {isExpanded && (
                                    <Card className="absolute top-20 left-1/2 -translate-x-1/2 w-60 bg-card/95 backdrop-blur-lg border-primary/20 shadow-2xl overflow-visible z-[300]">
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-primary/50"></div>
                                        <CardHeader className="p-3 pb-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <Badge
                                                    className={`px-1.5 py-0 text-[9px] uppercase font-bold tracking-tighter ${getStatusStyles(
                                                        item.status
                                                    )}`}
                                                >
                                                    {item.status.replace('-', ' ')}
                                                </Badge>
                                                <span className="text-[9px] font-mono text-muted-foreground">
                                                    {item.date}
                                                </span>
                                            </div>
                                            <CardTitle className="text-xs font-bold">
                                                {item.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-0 text-[10px] text-muted-foreground">
                                            <p className="leading-relaxed">{item.content}</p>

                                            <div className="mt-3 pt-2 border-t border-border">
                                                <div className="flex justify-between items-center text-[9px] mb-1">
                                                    <span className="flex items-center uppercase font-medium">
                                                        <Zap size={10} className="mr-1 text-primary" />
                                                        Readiness
                                                    </span>
                                                    <span className="font-mono">{item.energy}%</span>
                                                </div>
                                                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{ width: `${item.energy}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {item.relatedIds.length > 0 && (
                                                <div className="mt-3 pt-2 border-t border-border">
                                                    <div className="flex items-center mb-1.5">
                                                        <Link size={10} className="text-primary mr-1" />
                                                        <h4 className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">
                                                            Connected Features
                                                        </h4>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.relatedIds.map((relatedId) => {
                                                            const relatedItem = timelineData.find(
                                                                (i) => i.id === relatedId
                                                            );
                                                            return (
                                                                <button
                                                                    key={relatedId}
                                                                    className="flex items-center h-5 px-1.5 text-[8px] font-bold rounded bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all border border-border"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleItem(relatedId);
                                                                    }}
                                                                >
                                                                    {relatedItem?.title}
                                                                    <ArrowRight
                                                                        size={8}
                                                                        className="ml-1 opacity-50"
                                                                    />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
