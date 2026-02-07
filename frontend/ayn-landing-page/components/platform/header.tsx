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
  actions?: React.ReactNode
}

export function Header({ title, description, breadcrumbs, actions }: HeaderProps) {
  return (
    <header
      className={
        SIDEBAR_MOBILE_OFFSET +
        " sticky top-0 z-30 border-b border-border/60 bg-background/95 px-4 py-6 backdrop-blur md:px-[var(--spacing-content)]"
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb>
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
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-foreground truncate">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
