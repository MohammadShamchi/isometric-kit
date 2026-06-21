# Isometric Kit — Next.js example

A minimal Next.js 15 (App Router) app that demonstrates consuming `@isometric-design/react`.

## What it shows

- Importing the design tokens once in the root layout (`app/layout.tsx`) via `@isometric-design/react/tokens.css`
- Rendering `<ArchitectureGraph>` inside a `'use client'` page with a coordinate-less graph
- Auto-layout: no node carries explicit `u`/`v` — the engine places everything

## How to run

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

> **Note:** This folder is intentionally standalone and is **not** part of the monorepo workspace install. `@isometric-design/react` must be available on npm, or linked locally via `npm link` / a path override before running `npm install`.
