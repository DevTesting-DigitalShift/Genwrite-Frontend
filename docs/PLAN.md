# Optimisation & Cleanup Plan for GenWrite-Frontend

## 🎯 Objective

Drastically reduce bundle size from **>14MB (Gzipped)** to **1-3MB Target**. This requires
aggressive optimization, CDN usage, and strict asset management.

## 📊 Impact Analysis

- **Current State**: 🚨 CRITICAL BLOAT. Dist folder > 14MB (Gzipped). This implies massive inlined
  assets, duplicate dependencies, or accidental inclusion of heavy dev-tools in production.
- **Target State**: 1-3MB Bundle. Lightweight `shadcn/ui`, `zustand`, single editor, and CDN
  offloading.
- **Estimated Reduction**: ~80-90% reduction required.

---

## 📅 Roadmap & Phases

### 🕵️ Phase 0: The "Smoking Gun" Analysis (Immediate)

**Goal**: Identify exactly what is consuming 14MB compressed. 14MB Gzip usually implies inlined
assets (base64 images/PDFs) or massive accidental imports. **Action**:

1.  Install `rollup-plugin-visualizer`.
2.  Run generic build to generate `stats.html`.
3.  **Audit Assets**: Check for large files in `src/assets` or `public` being imported as data URLs.

### 🚀 Phase 1: Quick Wins & Detox (Urgent)

**Goal**: Remove unused code and replace heavy libraries. **Impact**: High.

1.  **Remove Cheerio**:
    - **Action**: Replace `cheerio` import with native `DOMParser` or
      `document.createElement('div')`.
    - **Status**: 🔴 Pending
2.  **Remove Unused Editors & Libs**:
    - **Action**:
      - Remove `lexical`, `codemirror`, `marked`, `showdown`, `turndown`.
      - Remove `gsap` (use existing `framer-motion`).
      - Remove `moment` (if present) and strictly use `dayjs` or `date-fns`.
    - **Status**: 🔴 Pending
3.  **Asset Check**:
    - **Action**: Ensure verify large images/fonts are in `public/` and referenced via URL, NOT
      imported in JS.

### ☁️ Phase 2: CDN & Externalization (Performance)

**Goal**: Offload heavy, static libraries to CDNs to keep the main bundle small. **Strategy**: Use
`vite-plugin-cdn-import` or manual `rollupOptions`.

1.  **Externalize Core Libs**:
    - `react`, `react-dom` -> CDN (esm.sh or unpkg)
    - `react-router-dom` -> CDN
    - `axios`, `socket.io-client` -> CDN
2.  **Externalize Heavy UI**:
    - `tiptap` packages (Generic editors) -> CDN (if possible, though versioning is tricky).
    - `chart.js` -> CDN.

### 🏗️ Phase 3: State Management Migration

**Goal**: Simplify state logic and improve data fetching caching.

1.  **Setup React Query**:
    - **Action**: Configure `QueryClientProvider` (main.jsx). Refactor `api/*.js` calls.
    - **Status**: 🟡 Partially Installed
2.  **Migrate Redux to Zustand**:
    - **Action**: Replace `useDispatch`/`useSelector` with `useAuthStore`. Uninstall
      `@reduxjs/toolkit`.
    - **Status**: 🔴 Pending

### 🎨 Phase 4: UI Architecture (The Big Shift)

**Goal**: Move to a unified, headless, Tailwind-based design system. **Impact**: Very High. Critical
for hitting the <3MB goal.

1.  **AntD Removal**:
    - **Strategy**: This is the heaviest dependency (~2MB+). Must be replaced by `shadcn/ui`
      components (radix primitives + tailwind).
    - **Action**: Identify and replace components one by one.
    - **Status**: 🔴 Pending

### 🖼️ Phase 5: Asset & Animation Optimization

**Goal**: Granular control over assets.

1.  **Icon Strategy**:
    - **Action**: Stop importing entire libraries (`react-icons`). Create `src/assets/icons` with
      raw SVGs. Use a sprite or direct import.
    - **Impact**: Potentially saves 1-2MB if tree-shaking is failing.
2.  **Animations**:
    - **Action**: Standardize on `framer-motion`. Remove `gsap`.

---

## 🛑 Priorities (Kanban)

| Task               | Priority    | Complexity | Est. Saving           |
| :----------------- | :---------- | :--------- | :-------------------- |
| **Analyze Bundle** | 🚨 Critical | Low        | N/A (Diagnostic)      |
| Remove `cheerio`   | 🚨 Urgent   | Low        | ~400KB                |
| Remove `lexical`   | 🚨 Urgent   | Low        | ~2MB                  |
| **CDN Core Libs**  | High        | Low        | ~300KB (Main Bundle)  |
| Redux -> Zustand   | Medium      | Medium     | ~40KB                 |
| **AntD -> Shadcn** | High        | Very High  | **~2-3MB**            |
| Asset/Icon Fix     | High        | Medium     | **~1-5MB** (Variable) |

## 🛠️ Execution Plan for "Orchestrator"

1.  **Phase 0**: Run `rollup-plugin-visualizer` to see the 14MB monster.
2.  **Phase 1**: Execute cleanup (Cheerio, Lexical, GSAP).
3.  **Phase 2**: Configure Vite for CDN (React, ReactDOM).
4.  **Phase 4**: Start AntD -> Shadcn migration (Long term).
