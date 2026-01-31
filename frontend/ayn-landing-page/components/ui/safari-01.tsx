"use client"

import Image, { StaticImageData } from "next/image"
import React from "react"
import { cn } from "@/lib/utils"

interface Safari_01Props {
    image?: StaticImageData | string
    className?: string
    children?: React.ReactNode
}

const Safari_01: React.FC<Safari_01Props> = ({ image, className, children }) => {
    return (
        <div
            className={cn(
                "relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden group",
                className
            )}
        >
            {/* Browser top bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 bg-red-500/50 rounded-full" />
                    <span className="w-2.5 h-2.5 bg-yellow-500/50 rounded-full" />
                    <span className="w-2.5 h-2.5 bg-green-500/50 rounded-full" />
                </div>
                <div className="flex-1 mx-4 bg-background/50 border border-border/50 rounded-md h-6 max-w-sm flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground/60 font-mono">platform.ayn.edu</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-sm border border-border/50" />
                    <div className="w-3 h-3 rounded-sm border border-border/50" />
                </div>
            </div>

            {/* Preview area */}
            <div className="relative bg-background/20 aspect-[16/10] overflow-hidden">
                {image ? (
                    <Image
                        src={image}
                        alt="Ayn Platform Preview"
                        fill
                        className="object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                        {/* Skeleton placeholder if no image */}
                        <div className="w-full h-full p-6 space-y-6">
                            <div className="flex justify-between">
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-muted rounded shadow-sm" />
                                    <div className="h-3 w-48 bg-muted/60 rounded" />
                                </div>
                                <div className="h-8 w-24 bg-primary/20 rounded-lg" />
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted/40 rounded-xl border border-border/50" />)}
                            </div>
                            <div className="h-48 bg-muted/30 rounded-2xl border border-border/50" />
                        </div>
                    </div>
                )}

                {/* Children for overlays (Unlock, Beta, etc.) */}
                {children}
            </div>
        </div>
    )
}

export default Safari_01
