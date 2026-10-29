# TODO · Simple Agenda

## Hecho (Sprint 0‑2)

- [x] Scaffold Vite + React + Tailwind + Dexie + typescript 6.0.3 / eslint 9.39.5
- [x] PWA config: `registerType: 'prompt'`, `injectRegister: null`, icons generados
- [x] Esquema IndexedDB v1 con Dexie (completo: `notes` con índices compuestos)
- [x] Tipado completo: `Note`, `NoteInput`, `NotePatch`, `NoteStatus`, `NoteCounts`, `NoteValidationError`, `NoteNotFoundError`
- [x] `useLiveQuery` como motor de estado (única fuente de verdad)
- [x] `useNotes(status)` → `{notes, counts}` reactiva
- [x] `useNoteMutations()` → `{create, updateText, complete, remove, undoRemove}`
- [x] `useCompleteAnimation()`: `idle → completing → commit` con `waitForMotionEnd` + timeout 900ms
- [x] `useHashTab()`: tabs via `location.hash` (`#pendientes` / `#realizadas`)
- [x] Composer bottom: 100‑char limit, `maxLength`, autosize, `Enter ⏎ para guardar`
- [x] `NoteBlock`: pending/done rendering, inline edit, delete, check animation, collapse via grid-rows
- [x] `CheckButton`: 28px círculo dentro de 44px área táctil, SVG `stroke-dashoffset` animation
- [x] `NoteComposer`: hint “Enter para guardar” oculto en touch via `[@media(hover:hover)]:inline`
- [x] Muted `--color-muted: #6b6360` para AA contrast mejorado
- [x] `NoteSkeleton` y `EmptyState` para estados vacíos
- [x] `ErrorBoundary` raíz con recovery por reload
- [x] `OfflineBanner` + `UpdateBanner` PWA
- [x] `Toaster` con acción “Deshacer” (5 s, undo toast)
- [x] `scrollToTop` tolerant a jsdom
- [x] Paneles de pestañas persistentes con asociación ARIA correcta
- [x] Borrado masivo de realizadas con confirmación y acción “Deshacer”
- [x] Panel Realizadas sin tachado persistente; contenido y navegación centrados
- [x] Workbox precarga assets del build y usa `index.html` como fallback de navegación
- [x] Nombre de producto Simple Agenda y botón/guía de instalación PWA
- [x] Completar pendientes arrastrando a la derecha y animación verde de confirmación a pantalla completa
- [x] Completar pendientes arrastrando a la derecha y animación verde de confirmación a pantalla completa
- [x] 27 tests Vitest pasando (typecheck 0, lint 0, build 0)
- [x] `pnpm build` → 110.32 kB gzip JS, 6.28 kB gzip CSS
- [x] Capturas visuales (Edge headless 390×844): light/dark, pendientes/realizadas, animation frames, geometría (check 44px, gap 7px, sin clipping)

## Pendientes (Sprint 3)

- [ ] **Almanaque calendario**: tareas asignadas por día, vista día/semana/mes.
- [ ] **Preferencias de tema**: forzar claro/oscuro persistido.
- [ ] Tests de integración E2E con `userEvent` completos (crear, editar, completar, borrar, undo).
- [ ] Deploy a Netlify/Vercel con headers de compresión gzip/brotli.
- [ ] Añadir atajo Cmd/Ctrl + Enter para guardar (Escape ya cancela la edición).
- [ ] Validación de duplicados por texto idéntico.

## En el roadmap (fuera de este proyecto)

- [ ] Sincronización entre dispositivos (Firebase/Supabase).
- [ ] Export/Import JSON de notas.
- [ ] Widget home / atajo rápido.
