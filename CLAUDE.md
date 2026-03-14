# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**tae-atlas** is a travel organization site. The intended stack (from .gitignore) is Next.js + TypeScript, deployed to Vercel.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Build for production
npm run lint     # Run ESLint
```

Node.js must be on PATH — on Windows, add `C:\Program Files\nodejs` if needed.

## Architecture

Next.js 15 App Router with TypeScript and Tailwind CSS, deployed to Vercel.

- `src/app/` — App Router pages and layouts (`page.tsx`, `layout.tsx`)
- `src/app/globals.css` — Global styles (Tailwind imports)
- `public/` — Static assets
- `next.config.ts` — Next.js configuration
