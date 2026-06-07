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
import { cn } from "@/lib/utils"
import { useUiLanguage } from "@/lib/ui-language-context"

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
  const { isArabic } = useUiLanguage()
  return (
    <header className="px-4 pb-2 pt-6 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" dir={isArabic ? "rtl" : "ltr"}>
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
                      <ChevronRight className={cn("h-4 w-4", isArabic && "rotate-180")} />
                    </BreadcrumbSeparator>
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <div className={cn("min-w-0 flex-1", isArabic && "font-arabic")}>
          <h1 className="truncate text-3xl font-black tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-1 text-base text-foreground/80">{description}</p>}
        </div>
        {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}
