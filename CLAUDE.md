# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000 (uses Turbopack)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Stack

- **Next.js 16** with App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**

## Structure

- `app/layout.tsx` — root layout with Geist fonts applied globally
- `app/page.tsx` — home page (route `/`)
- `app/globals.css` — global styles
- `public/` — static assets

## Project Rules

- NEVER restore previous versions without explicit confirmation
- NEVER commit `config.json`, `.env` files, or any credentials — always check `git status` before committing
- ALWAYS create descriptive commit messages; main branch is `main`
- NEVER delete any file without asking first

## Notes

- Uses App Router (not Pages Router) — new routes go in `app/` as `page.tsx` files
- Path alias `@/*` maps to the project root
- Run all commands from `c:\AI Cloude\Projects\first_project\`
- On Windows: if `node`/`npm` not found in VSCode terminal, restart VSCode to refresh PATH
