"use client"

import React from "react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

/** Left offset on mobile to clear the fixed sidebar menu button (3rem = 48px) */
const SIDEBAR_MOBILE_OFFSET = "ml-12 md:ml-0"

export interface HeaderBreadcrumbItem {
  label: string
  href?: string
}

interface HeaderProps {
  title: string
  description?: string
  breadcrumbs?: HeaderBreadcrumbItem[]
}

export function Header({ title, description, breadcrumbs }: HeaderProps) {
  return (
    <header className={SIDEBAR_MOBILE_OFFSET + " py-6 px-4 md:px-[var(--spacing-content)] border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-30"}>
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              {breadcrumbs.map((item, i) => (
                <React.Fragment key={i}>
                  <BreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                  {i < breadcrumbs.length - 1 && (
                    <BreadcrumbSeparator>
                      <ChevronRight className="h-4 w-4" />
                    </BreadcrumbSeparator>
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <h1 className="text-2xl font-bold text-foreground truncate">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
    </header>
  )
}
