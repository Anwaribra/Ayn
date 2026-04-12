# Ayn

**Ayn** is an AI-native quality assurance and accreditation platform for educational institutions.  
It brings standards, evidence, gap analysis, analytics, workflows, and institutional AI assistance into one product, with **Horus** as the platform intelligence layer.

This repository contains the full product stack for Ayn: the marketing site, the authenticated platform, the Horus AI experience, and the FastAPI backend that powers institutional workflows and compliance operations.

## What Ayn Solves

Educational quality and accreditation teams usually work across scattered files, disconnected spreadsheets, manual review loops, and late-stage audit preparation. Ayn is built to replace that fragmentation with a single operating system for readiness.

With Ayn, an institution can:

- organize accreditation evidence in one place
- map evidence against standards and criteria
- detect gaps before an external review happens
- track compliance posture over time
- generate remediation guidance and draft follow-up material
- use Horus to analyze files, explain status, and orchestrate compliance actions

## Product Overview

The product is centered around two ideas:

1. **A platform system of record** for standards, evidence, analyses, notifications, and institutional state
2. **An AI operating layer** that understands that state and helps users work through it naturally

### Main Product Areas

- **Horus AI**
  - conversational institutional assistant
  - supports direct answers, guided reasoning, and agent-style execution
  - file-aware chat for documents and images
  - tool-calling backend with approval gates for sensitive actions

- **Evidence Vault**
  - upload and manage institutional evidence
  - AI-assisted analysis and metadata extraction
  - linking evidence to criteria and gaps
  - search, filtering, and editing flows

- **Standards Hub**
  - manage accreditation and quality frameworks
  - criteria hierarchy and coverage tracking
  - support for imported and manually managed standards

- **Gap Analysis**
  - compare evidence against standards
  - identify weak coverage and missing controls
  - generate reports, severity signals, and remediation direction

- **Dashboard and Analytics**
  - readiness metrics
  - institution-level activity and compliance summaries
  - KPI cards, trends, breakdowns, and operational visibility

- **Platform Operations**
  - notifications
  - workflows
  - calendar and milestones
  - settings and preferences
  - mock audit experiences

## Horus

Horus is not treated as a generic chatbot inside Ayn. It is designed as a product-native compliance assistant.

Horus can:

- answer questions about platform state
- analyze uploaded files and screenshots
- summarize documents in Arabic and English
- explain standards and readiness gaps
- run multi-step compliance workflows
- request confirmation before mutating operations

The chat experience supports multiple interaction modes:

- **Ask** for direct answers
- **Think** for more visible reasoning and deeper explanation
- **Agent** for tool-backed, multi-step execution

## System Design

At a high level, Ayn is a modern web platform with a Next.js frontend and a FastAPI backend.

### Frontend

The frontend is responsible for:

- the public-facing product experience
- the authenticated platform shell
- all dashboard, evidence, standards, analytics, and settings interfaces
- the Horus chat UI and agent experience

Core frontend characteristics:

- Next.js App Router architecture
- React + TypeScript codebase
- Tailwind-based design system with custom product styling
- SWR-driven data fetching and cache refresh flows
- rich client-side UX for streaming AI responses and file workflows

### Backend

The backend is responsible for:

- authentication and user/session flows
- institution and standards data management
- evidence upload and analysis orchestration
- gap analysis generation and report handling
- Horus chat, planning, tool execution, and streaming responses
- metrics, notifications, drafts, workflows, and platform state

Core backend characteristics:

- FastAPI application structure
- modular service layout by domain
- AI provider abstraction and provider fallback support
- SSE/streaming support for Horus responses
- ORM-backed persistence and file storage integration

### Data Layer

The platform relies on a relational core with platform state and AI-retrieval-oriented extensions.

The system includes concepts such as:

- users and institutions
- standards and criteria
- evidence and evidence-to-criterion mappings
- gap analyses and remediation records
- chats and messages
- activities, notifications, and metrics
- vectorized document state for retrieval workflows

## Repository Structure

```text
Ayn/
├── backend/                      # FastAPI backend and domain services
│   ├── app/
│   │   ├── auth/
│   │   ├── evidence/
│   │   ├── standards/
│   │   ├── gap_analysis/
│   │   ├── horus/
│   │   ├── analytics/
│   │   ├── dashboard/
│   │   └── ...
│   ├── prisma/
│   └── tests/
├── frontend/
│   └── ayn-landing-page/         # Next.js site + platform UI
│       ├── app/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── public/
├── docs/                         # integration notes and supporting docs
└── README.md
```

## Current Technical Direction

The repository is evolving toward a product that is:

- **AI-first**, but not AI-only
- **workflow-oriented**, not just chat-oriented
- **institution-aware**, not generic SaaS
- **Arabic-capable**, while still supporting English-first product flows
- **operator-friendly**, with strong emphasis on status clarity and reviewability

A major focus of current work has been:

- stabilizing authenticated platform rendering
- improving platform reliability across dashboard and settings pages
- refining Horus UX so agent flows feel intentional and trustworthy
- making file analysis and multi-step AI behavior clearer in the interface

## Key Strengths Of The Project

- strong product ambition with a distinct point of view
- full-stack ownership across AI, compliance workflows, and institutional UX
- meaningful domain specificity rather than a generic AI wrapper
- modern frontend architecture with custom interface work
- backend built around real product modules, not a single monolith file

## What Makes Ayn Different

Many “AI for compliance” products stop at document chat or static reporting. Ayn is aiming for a deeper operating model:

- compliance work is tied to actual platform records
- AI is grounded in institutional state
- recommendations can connect to next actions
- evidence, standards, gaps, and readiness live in one loop

That makes Ayn closer to a compliance operating system than a standalone assistant.

## Supported Domains And Frameworks

The platform is designed for institutional quality and accreditation use cases, including frameworks such as:

- ISO 21001
- ISO 9001
- NAQAAE
- institution-specific internal standards

## Engineering Notes

This repository contains both product-facing and infrastructure-facing work. The codebase includes:

- streaming AI interfaces
- file analysis paths
- approval-aware tool execution
- analytics and reporting surfaces
- product shell and protected-route handling
- a growing set of smoke tests and frontend reliability improvements

The codebase is under active iteration, with ongoing work around platform hardening, AI workflow polish, and UI consistency.

## Status

This is an active product repository, not a static showcase.

The project already includes:

- a substantial multi-page platform
- authenticated product flows
- evidence and standards management
- AI-assisted gap analysis and reporting
- a dedicated Horus experience with multiple operational modes

Current development is focused on:

- frontend reliability and loading-state consistency
- stronger agent UX and clearer execution feedback
- better structured results from Horus
- improved platform-wide polish for production readiness

## Closing

Ayn is being built as a serious institutional product: one that treats accreditation and quality assurance as an operational problem, not just a document problem.

The goal is simple: help institutions move from scattered evidence and reactive audits to continuous visibility, faster remediation, and a much more intelligent way of working.
