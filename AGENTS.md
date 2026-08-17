# E-Jurnal STIKMAS Design & Engineering Guidelines

## UI/UX & Design System Standards
- **Framework & Libraries**: React 19 + TypeScript + Inertia.js + Tailwind CSS v4 + Shadcn UI + Lucide Icons.
- **Gold Standard Reference**: All pages and forms MUST follow the layout, proportions, and aesthetic established in `GuruKelas.tsx`.
- **Branding & Assets**:
  - Application Name: **E-Jurnal STIKMAS** (Sistem Jurnal Observasi & Early Warning System AI).
  - Official Logo: `/storage/stikmas.png` (from `public/storage/stikmas.png`).
- **Single-Page / Sub-Feature Architecture**:
  - Embedded layout: No vertical sidebar navigation. Use sticky Top Navigation Header (`AppLayout.tsx`).
  - Container width: `max-w-7xl 2xl:max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8`.
  - Generous top margin & spacing: `pt-8 sm:pt-10 pb-14 sm:pb-20 space-y-8`.
- **Anti-Stretch & Ergonomics**:
  - Never allow forms to stretch 100% full-width horizontally on large screens.
  - Form layouts MUST use a balanced 2-Column Desktop Grid (`grid grid-cols-1 lg:grid-cols-12 gap-6`):
    - Left Column (7 cols): Student Autocomplete + Narrative Textarea.
    - Right Column (5 cols): Linear Scales + Save Action Button.
- **Visual Excellence & Zero AI Slop**:
  - Clean, soft, eye-friendly palette (`#EEF2F7` background, white cards, subtle border `border-slate-200/80`, natural diffuse shadows).
  - NO tacky colored border bars on top of stat cards.
  - NO noisy decorative badges or emojis.
  - Standard typography letter-spacing (`letter-spacing: normal`, using `Plus Jakarta Sans` / `Inter` and `JetBrains Mono`).
- **Bento Stat Cards & Ambient Silhouette Rules**:
  - Card base stays clean `#EEF2F7` (soft neumorphic slate) with crisp `border-white/80`.
  - Accent colors MUST ONLY appear as **ultra-subtle ambient silhouette glows** (`radial-gradient` with opacity $\le 0.08$ and radius $\le 48\%$).
  - Never fill or saturate the whole card body with solid/heavy color gradients.
  - Gradient directional origin MUST vary across cards (e.g. top-right, right-center behind gauge, top-right, top-left, bottom-right).
- **Top Quick Journaling / Shortcut Placement**:
  - Quick journaling action bars MUST be placed at the very top of the page (below page header) for immediate 1-click access.
  - Use soft blue/slate styling (`border-blue-200/60`, `bg-blue-50/40`), NEVER use solid dark purple/neon blocks.
- **Stat Cards Standard**:
  - Sizing: `p-6 sm:p-8 rounded-3xl neo-card flex flex-col justify-between min-h-[155px] space-y-4` with `gap-5 sm:gap-6`.
  - Uppercase sub-header, bold mono metric number, contextual subtext.
- **Component Architecture**:
  - Standardize on Shadcn UI primitives in `resources/js/components/ui/`.
  - Use `cn()` from `@/lib/utils` for conditional class joining.

