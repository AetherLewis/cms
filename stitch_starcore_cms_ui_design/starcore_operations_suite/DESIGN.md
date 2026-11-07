---
name: StarCore Operations Suite
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#464554'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#777586'
  outline-variant: '#c7c4d7'
  surface-tint: '#5148d7'
  primary: '#2a14b4'
  on-primary: '#ffffff'
  primary-container: '#4338ca'
  on-primary-container: '#c1beff'
  inverse-primary: '#c3c0ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#00423c'
  on-tertiary: '#ffffff'
  tertiary-container: '#005c54'
  on-tertiary-container: '#69d6c9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#100069'
  on-primary-fixed-variant: '#372abf'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Hanken Grotesk
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system targets high-growth enterprise operators, CFOs, revenue operations teams, and client partners requiring absolute precision across contractual cycles, billing infrastructure, and client interactions. The aesthetic balances the razor-sharp functional authority of Stripe Billing with the modular refinement of modern UI systems like shadcn/ui and Tailwind UI.

### Personality & Emotional Response
- **Authority & Reliability:** Interfaces convey institutional-grade confidence and operational clarity. Users handle high-stakes multi-currency accounts and legal SLAs; the UI must never feel frivolous or ambiguous.
- **Architectural Calm:** Generous whitespace, precise micro-borders, and calculated structural rhythm mitigate data fatigue across complex data grids and multi-tier analytics.
- **Precision Craft:** Monospaced numerical values, micro-interactions, and refined focus rings create a sense of tactile software engineered for speed.

### Design Movement: Modern Technical Precision
A hybrid of high-end corporate SaaS and technical minimalism:
- Cool-tinted slate neutral canvases (`#090D15` text over `#F8FAFC` base).
- Strict 1px hairline borders (`#E2E8F0`) defining cards, nested panels, and data surfaces.
- Subtle inner glows and ultra-soft, diffused drops on elevation layers to emulate physical cardstock resting on a frosted baseline.

## Colors

The palette leverages a structural foundation of slate neutrals offset by an authoritative indigo primary, deep obsidian secondary, and targeted emerald/teal accents for positive fiscal balances.

### Roles & Application
- **Primary (`#4338CA` - Indigo 700):** Reserved for core transactional actions, key interactive states, active navigation indicators, and primary CTAs. It pairs with `#EEF2FF` for subtle interactive hover backings and high-visibility status pill containers.
- **Secondary (`#0F172A` - Slate 900):** Applied to top-level text headings, high-contrast dark badges, master action buttons (e.g., "Create Contract", "Execute Payout"), and active tab indicators.
- **Tertiary (`#0D9488` - Teal 600):** Denotes positive financial trends, cleared invoice reconciliations, and verified contract compliance statuses.
- **Neutral Canvas (`#F8FAFC` to `#FFFFFF`):** Surfaces are tiered: `#F8FAFC` for global workspace backgrounds, `#FFFFFF` for primary container cards and data tables, and `#F1F5F9` for secondary table headers and nested metadata containers.
- **Critical Statuses:** Negative variances and delinquent accounts map to `#DC2626` (Red 600) with `#FEF2F2` (Red 50) containers; pending/in-review states use `#D97706` (Amber 600) with `#FFFBEB` (Amber 50).

## Typography

The type scale integrates the sharp grotesque geometry of **Hanken Grotesk** for semantic hierarchy with the technical precision of **JetBrains Mono** for contract IDs, ledger entries, currency values, and operational metadata.

### Typographic Hierarchy & Rules
- **Numerical Dominance:** All tabular monetary figures, invoice identifiers, and operational telemetry must use `label-md` or `label-sm` (JetBrains Mono) with tabular numbers enabled (`font-variant-numeric: tabular-nums`) to preserve column alignment across real-time streaming updates.
- **Heading Restraint:** Display headings feature tight negative tracking (`-0.025em` to `-0.01em`) to create a compact, executive aesthetic.
- **Body Hierarchy:** Text blocks strictly default to `body-md` in `#334155` for high-density legibility, while `body-sm` in `#64748B` anchors supplementary metadata, tooltips, and table captions.

## Layout & Spacing

The layout is built on a responsive 12-column fluid grid locked inside an enterprise-standard max width of `1600px` to maintain scannability on ultra-wide displays.

### Layout Philosophy
- **Three-Tier Shell Architecture:** 
  1. Primary navigation rail (collapsible 64px to 256px) locked to the viewport left.
  2. Contextual secondary sidebar (320px fixed) for contract filters, client directory trees, or ledger drilldowns.
  3. Dynamic content canvas expanding fluidly across remaining viewport space.
- **Desktop Grid:** 12 columns with `1.5rem` (`24px`) gutters and `2rem` (`32px`) canvas margin.
- **Tablet Grid (768px - 1024px):** 8 columns with `1rem` gutters; secondary sidebar collapses into an overlay drawer.
- **Mobile Grid (< 768px):** 4 columns with `1rem` gutters and margins; data tables switch from tabular layout to structured metric cards.
- **Rhythm & Nesting:** Element gap scaling enforces internal container padding to match `space-md` (`16px`) or `space-lg` (`24px`), while micro-elements (icon-to-text, chip gaps) use `space-xs` (`4px`) and `space-sm` (`8px`).

## Elevation & Depth

This design system avoids heavy shadows, instead using **flat, low-contrast structural outlines combined with ambient micro-diffusion**.

### Depth Layers
- **Surface 0 (Canvas Base):** `#F8FAFC`. Completely flat with zero elevation.
- **Surface 1 (Card & Content Blocks):** `#FFFFFF` background bound by a 1px solid border in `#E2E8F0`. Shadow is an ultra-subtle ambient drop: `box-shadow: 0 1px 2px 0 rgba(15, 23, 42, 0.04)`.
- **Surface 2 (Interactive Hover & Flyouts):** Used when hovering over KPI cards or expanding accordions: `box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)`.
- **Surface 3 (Dropdowns & Popovers):** Float over the workspace with `#FFFFFF`, an explicit border of `#CBD5E1`, and `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)`.
- **Surface 4 (Modals & Sheet Drawers):** High-level operational sheets use an overlay of `#0F172A` at 40% opacity with a `4px` backdrop blur, casting a deep enterprise shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.12)`.

## Shapes

The design uses a **Soft (`1`)** shape language (`0.25rem` / `4px` base radius), delivering the crisp, structured silhouette characteristic of professional developer tools, Stripe Dashboard, and shadcn/ui.

### Application Standards
- **Buttons, Text Inputs, and Form Controls:** Form components use `rounded` (`0.25rem` / `4px`) for compact operational density.
- **Cards, Tables, and Content Panels:** Bound with `rounded-lg` (`0.5rem` / `8px`) to distinguish layout containers from clickable inputs.
- **Modals and Command Palettes:** Retain `rounded-xl` (`0.75rem` / `12px`) outer shells with inner elements aligned to `0.25rem`.
- **Badges and Status Indicators:** System pills use full roundedness (`rounded-full` / `9999px`) to create an immediate optical contrast against rectangular metric cards and inputs.

## Components

### Buttons
- **Primary:** Background `#0F172A` (Slate 900) or `#4338CA` (Indigo 700), text `#FFFFFF`, 1px hairline border matching background. Hover triggers `brightness(1.1)`. Height: 36px (standard), 32px (compact data-table row action).
- **Secondary / Outline:** Background `#FFFFFF`, text `#0F172A`, 1px solid `#E2E8F0`. Hover triggers background `#F8FAFC` and border `#CBD5E1`.
- **Ghost:** Background transparent, text `#64748B`, hover background `#F1F5F9` with text `#0F172A`.

### Interactive Stat Cards
- Container built on `#FFFFFF` with `rounded-lg` and 1px border `#E2E8F0`.
- Upper section features an icon badge, title in `body-sm` (`#64748B`), and a context menu trigger.
- Center displays high-contrast monetary value in `headline-xl` (Hanken Grotesk Semibold) with `JetBrains Mono` currency symbols.
- Lower footer contains a sparkline preview and a percentage chip (`tertiary` for growth, `danger` for churn) with subtle background tinting (`#F0FDFA` or `#FEF2F2`).

### Data Tables
- **Header:** Sticky `#F8FAFC` header with 1px bottom border `#E2E8F0`. Column titles rendered in `label-sm` (uppercase, letter-spacing `0.05em`, color `#64748B`).
- **Rows:** Alternating rows default to `#FFFFFF` with a subtle hover transition to `#F8FAFC`. 1px horizontal dividers between rows.
- **Cells:** Vertical padding strictly `12px` (compact) or `16px` (standard). Aligned data types: strings left-aligned, numerical/fiscal data right-aligned in `JetBrains Mono`.

### Input Fields & Controls
- **Text Inputs:** Height 36px, `#FFFFFF` background, 1px border `#E2E8F0`, typography in `body-md`. Focus state uses an outline ring: `2px solid #4338CA` with a `2px` offset.
- **Checkboxes & Radios:** 16px square/circle with 1px border `#CBD5E1`. Checked state fills `#4338CA` with an inset white micro-check.
- **Chips & Status Badges:** Compact height (20px-22px), `rounded-full`, padding `2px 8px`. Typography strictly `label-sm`. Positive: `#ECFDF5` background, `#059669` text. Warning: `#FFFBEB` background, `#D97706` text. Neutral: `#F1F5F9` background, `#475569` text.

### Additional Specialized Components
- **Contract Timeline / Milestone Tracker:** Vertical or horizontal linear node tree featuring 2px connecting lines (`#E2E8F0`) with 12px pill nodes indicating approval stages (Drafting, Internal Review, Legal Clearing, Signed).
- **Command Palette (`Cmd+K`):** Floating modal centered on viewport, `#FFFFFF` surface, containing instant search over clients, recurring invoices, and contract clauses with keyboard navigation shortcuts in `JetBrains Mono`.