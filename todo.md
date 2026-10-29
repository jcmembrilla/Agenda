# TODO · Anotador

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
- [x] 19 tests Vitest pasando (typecheck 0, lint 0, build 0)
- [x] `pnpm build` → 107.89 kB gzip JS, 5.17 kB gzip CSS
- [x] Capturas visuales (Edge headless 390×844): light/dark, pendientes/realizadas, animation frames, geometría (check 44px, gap 7px, sin clipping)

## Pendientes (Sprint 3)

- [ ] **Almanaque calendario**: tareas asignadas por día, vista día/semana/mes.
- [ ] **Preferencias de tema**: forzar claro/oscuro persistido.
- [ ] Tests de integración E2E con `userEvent` completos (crear, editar, completar, borrar, undo).
- [ ] Deploy a Netlify/Vercel con headers de compresión gzip/brotli.
- [ ] Configurar `workbox-build` para runtime caching de assets y fallback page.
- [ ] Añadir atajos de teclado (Cmd/Ctrl + Enter para guardar, Escape para cancelar).
- [ ] Validación de duplicados por texto idéntico.

## En el roadmap (fuera de este proyecto)

- [ ] Sincronización entre dispositivos (Firebase/Supabase).
- [ ] Export/Import JSON de notas.
- ] Widget home / atajo rápido.