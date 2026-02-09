"use client"

import React from "react"

interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n")
    const elements: React.ReactNode[] = []
    let inCodeBlock = false
    let codeContent: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <pre
              key={`code-${i}`}
              className="my-3 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs font-mono text-gray-800"
            >
              <code>{codeContent.join("\n")}</code>
            </pre>,
          )
          codeContent = []
          inCodeBlock = false
        } else {
          inCodeBlock = true
        }
        continue
      }

      if (inCodeBlock) {
        codeContent.push(line)
        continue
      }

      if (line.trim() === "") {
        elements.push(<div key={`br-${i}`} className="h-2" />)
        continue
      }

      if (line.startsWith("### ")) {
        elements.push(
          <h4
            key={`h3-${i}`}
            className="mb-1.5 mt-4 text-sm font-semibold text-gray-900"
          >
            {renderInline(line.slice(4))}
          </h4>,
        )
        continue
      }
      if (line.startsWith("## ")) {
        elements.push(
          <h3
            key={`h2-${i}`}
            className="mb-1.5 mt-5 text-base font-semibold text-gray-900"
          >
            {renderInline(line.slice(3))}
          </h3>,
        )
        continue
      }
      if (line.startsWith("# ")) {
        elements.push(
          <h2
            key={`h1-${i}`}
            className="mb-2 mt-5 text-lg font-bold text-gray-900"
          >
            {renderInline(line.slice(2))}
          </h2>,
        )
        continue
      }

      if (/^[-━─═]{3,}$/.test(line.trim())) {
        elements.push(
          <hr key={`hr-${i}`} className="my-4 border-gray-200" />,
        )
        continue
      }

      if (/^[\s]*[-•*]\s/.test(line)) {
        const indent = line.search(/\S/)
        const itemContent = line.replace(/^[\s]*[-•*]\s/, "")
        elements.push(
          <div
            key={`li-${i}`}
            className="my-1 flex items-start gap-2.5"
            style={{ paddingLeft: `${Math.min(indent, 4) * 8}px` }}
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
            <span className="leading-relaxed text-gray-700">{renderInline(itemContent)}</span>
          </div>,
        )
        continue
      }

      if (/^\s*\d+[.)]\s/.test(line)) {
        const match = line.match(/^(\s*)(\d+)[.)]\s(.*)$/)
        if (match) {
          const indent = match[1].length
          elements.push(
            <div
              key={`ol-${i}`}
              className="my-1 flex items-start gap-2.5"
              style={{ paddingLeft: `${Math.min(indent, 4) * 8}px` }}
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[10px] font-bold text-[var(--brand)]">
                {match[2]}
              </span>
              <span className="leading-relaxed text-gray-700">{renderInline(match[3])}</span>
            </div>,
          )
          continue
        }
      }

      elements.push(
        <p key={`p-${i}`} className="my-1 leading-relaxed text-gray-700">
          {renderInline(line)}
        </p>,
      )
    }

    if (inCodeBlock && codeContent.length > 0) {
      elements.push(
        <pre
          key="code-end"
          className="my-3 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs font-mono text-gray-800"
        >
          <code>{codeContent.join("\n")}</code>
        </pre>,
      )
    }

    return elements
  }

  const renderInline = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = []
    let remaining = text
    let key = 0

    while (remaining.length > 0) {
      const boldMatch = remaining.match(
        /^([\s\S]*?)\*\*(.+?)\*\*([\s\S]*)$/,
      )
      if (boldMatch) {
        if (boldMatch[1])
          parts.push(<span key={key++}>{boldMatch[1]}</span>)
        parts.push(
          <strong key={key++} className="font-semibold text-gray-900">
            {boldMatch[2]}
          </strong>,
        )
        remaining = boldMatch[3]
        continue
      }

      const codeMatch = remaining.match(/^([\s\S]*?)`(.+?)`([\s\S]*)$/)
      if (codeMatch) {
        if (codeMatch[1])
          parts.push(<span key={key++}>{codeMatch[1]}</span>)
        parts.push(
          <code
            key={key++}
            className="rounded-md bg-[var(--brand)]/10 px-1.5 py-0.5 text-xs font-mono text-[var(--brand)]"
          >
            {codeMatch[2]}
          </code>,
        )
        remaining = codeMatch[3]
        continue
      }

      parts.push(<span key={key++}>{remaining}</span>)
      break
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>
  }

  return (
    <div className="space-y-0 text-sm leading-relaxed text-gray-700">
      {renderMarkdown(content)}
    </div>
  )
}
