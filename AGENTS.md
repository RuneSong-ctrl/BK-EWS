# BK-EWS Design & Engineering Guidelines

## UI/UX & Design System Standards
- **Framework**: React 19 + TypeScript + Inertia.js + Tailwind CSS v4 + Shadcn UI.
- **Visual Excellence**:
  - Always implement high-taste, modern, elegant user interfaces.
  - Utilize layered elevations, subtle borders (`border-border/70`), soft shadows, and clean typography (`Plus Jakarta Sans` / `JetBrains Mono`).
  - Use semantic risk indicators consistently: Critical (Rose/Red), High (Amber), Moderate (Sky/Blue), Low (Emerald/Green), AI/Advisor (Indigo/Violet).
- **Accessibility**:
  - Maintain WCAG AA+ contrast ratios.
  - Ensure all interactive elements have visible focus rings and accessible labels.
  - Human-in-the-Loop AI reviews must feature clear approval/rejection actions and transparent confidence indicators.
- **Component Architecture**:
  - Standardize on Shadcn UI primitives in `resources/js/components/ui/`.
  - Use `cn()` from `@/lib/utils` for conditional class joining.
