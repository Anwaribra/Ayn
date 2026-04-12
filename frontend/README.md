# Ayn Landing Website

Modern landing website for the Ayn SaaS platform built with React, TailwindCSS, shadcn/ui, and full RTL/Arabic support.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **React Router** - Routing
- **react-i18next** - Internationalization
- **Framer Motion** - Animations
- **Zod** - Form validation
- **React Hook Form** - Form management

## Features

- ✅ 4 pages: Home, What is Ayn, Contact, About
- ✅ Full RTL/Arabic support with language switching
- ✅ Responsive design
- ✅ Modern animations with Framer Motion
- ✅ Form validation with Zod
- ✅ Enterprise-grade design
- ✅ shadcn/ui components

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── Navbar.tsx   # Navigation bar
│   │   └── Footer.tsx    # Footer component
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── WhatIsAyn.tsx
│   │   ├── Contact.tsx
│   │   └── About.tsx
│   ├── i18n/
│   │   ├── config.ts
│   │   └── locales/
│   │       ├── en.json
│   │       └── ar.json
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## Pages

### Home
- Hero section with animation placeholder
- Partners strip
- Why Ayn section
- Horus Engine capabilities
- CTA footer

### What is Ayn
- Platform description
- Features grid
- Horus Engine section
- How it works (3 steps)
- CTA section

### Contact
- Contact form with validation
- Contact information
- Map placeholder

### About
- Who we are
- Mission
- Why education needs digital quality systems
- Horus Engine overview
- Values section
- Team placeholder

## Internationalization

The site supports English and Arabic with automatic RTL switching. Language preference is stored in localStorage.

## Styling

Uses TailwindCSS with custom design tokens matching shadcn/ui. The design is inspired by synapse-analytics.io with an enterprise, government-grade aesthetic.

## Development

- Language switcher in navbar
- All text is translatable via i18n
- RTL layout automatically applied for Arabic
- Responsive breakpoints: sm, md, lg, xl
















