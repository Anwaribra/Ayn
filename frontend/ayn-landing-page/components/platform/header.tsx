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

export interface HeaderBreadcrumbItem {
  label: string
  href?: string
}

interface HeaderProps {
  title: string
  description?: string
  /** Optional inline breadcrumbs (auto-breadcrumbs are in the shell header bar). */
  breadcrumbs?: HeaderBreadcrumbItem[]
  actions?: React.ReactNode
}

/**
 * Page-level header for titles, descriptions, and actions.
 *
 * The shell top bar already provides auto-breadcrumbs and global controls
 * (search, notifications, user menu), so this component focuses on
 * page-specific context only. Breadcrumbs here are optional and
 * displayed only when explicitly provided for sub-page navigation.
 */
export function Header({ title, description, breadcrumbs, actions }: HeaderProps) {
  return (
    <header className="px-4 pb-2 pt-6 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb className="mb-1">
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
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
