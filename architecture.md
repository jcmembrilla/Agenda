# Anotador

**Comercio Local / Anotador**: un PWA offline-first minimalista hecho con React + Vite + Tailwind + Dexie.

## Uno a uno

- **Home** = compositore de notas; cada nota es un bloque de texto.
- **Completar** mueve la nota a la pestaña *Realizadas* con animación de check (no borra).
- Las notas completadas **no se reabren** — solo se pueden borrar y quedan en *Realizadas* hasta que se eliminan.
- Máx. **100 caracteres** por nota; los bloques se limitan a **máx. 2 líneas**; siguiente nota abajo.
- El compositore está **fijo en la parte inferior**.
- Estilo: **papel cálido + teal**: `#FAF9F7` / `#0D9488`.
- PWA ligera: `registerType: 'prompt'` + `injectRegister: null`; SW desactivada en dev.
- Sin router: tabs via `location.hash` (`#pendientes` / `#realizadas`) para el botón Atrás de Android.
- Íconos generados por script propio (sin dependencias).

## Pila tecnológica (bloqueado)

| Capa | Versión |
|------|---------|
| TypeScript | `6.0.3` (typescript-eslint `<6.1.0`) |
| ESLint | `9.39.5` (jsx-a11y `^9`) |
| Vite | `8.3.5` |
| React | `19.3.1` |
| Dexie | `4.4.7` |
| Tailwind CSS | `4.3.3` |
| vite-plugin-pwa | `2.0.0` |
| Vitest | `5.0.5` |

## Principios clave

- **IndexedDB es la única fuente de verdad**; `liveQuery` de `dexie-react-hooks` es el motor de estado (no Redux/Zustand/router).
- **Animación antes de persistir** (`ADR-05`): si se escribe antes, `liveQuery` desenmonta el bloque al instante. Se usa `Promise.race([animationend, timeout(900ms)])`.
- `completedAt: 0` como centinela (IndexedDB no indexa `null`).
- `deleted: 0|1` tombstone; sin `reopen()`.
- **Sin librerías de animación**: keyframes puras CSS; strike-through animado vía `text-decoration-color` transition.
- **Colapso por grid**: `grid-template-rows: 1fr → 0fr` sin medir altura.
- **Iconos**: generados por `scripts/generate-icons.mjs` (script PNG a mano, supersampling 4×4).
- **Sin router**: 30 líneas, 0 KB; hash `#pendientes` / `#realizadas` para Android Back.
- **Reducida**: `prefers-reduced-motion` salta animación y persiste al instante.

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Vite en desarrollo |
| `pnpm build` | `tsc --noEmit && vite build` |
| `pnpm preview` | `vite preview` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | `eslint .` |
| `pnpm format` | `prettier --write .` |
| `pnpm test` | `vitest run` |
| `pnpm icons` | `node scripts/generate-icons.mjs` |

## Estructura de carpetas (resumida)

```
src/
  lib/          # id, cn, dates, motion, scroll, useAutosize
  styles/       # tokens, keyframes, dark override
  features/
    notes/
      types.ts   # Note, NoteInput, NoteStatus, NoteCounts
      repository.ts # createNotesRepository, normalizeNoteText, complete, softDelete, restore
      hooks/     # useNotes, useNoteMutations, useCompleteAnimation, useHashTab
      components/
        NoteBlock.tsx     # pending/done rendering, inline edit, delete, animation container
        NoteComposer.tsx  # bottom composer, 100-char limit, autosize
        CheckButton.tsx   # 28px circle dentro de 44px hit area
        NoteList.tsx
        NotesTabs.tsx
  components/  # ui/ (IconButton, Toaster, EmptyState, EmptyState, CheckButton, TrashIcon)
  pwa/         # OfflineBanner, UpdateBanner
  App.tsx      # shell, hash tab, undo toast flow
  main.tsx
```

## APIs menores

- `useCompleteAnimation(onComplete)`: máquina `idle → completing → commit`. El commit se ejecuta **después** de la animación (ADR-05).
- `useNotes(status)`: proyección reactiva; devuelve `{notes, counts}`.
- `useHashTab()`: `[status, setStatus]` desde `location.hash`.
- `scrollToTop(element, behavior)`: tolerant al `scrollTo` que falta en jsdom.
- `showToast({message, action, duration})`: toast con acción "Deshacer" (5 s).

## Tickets pendientes (Sprint 3)

- [ ] Añadir almanaque calendario (tareas por día).
- [ ] Persistencia de preferencias de tema.
- [ ] Tests de integración con `userEvent` completos.
- [ ] Deploy a Netlify/Vercel con compresión gzip.
- [ ] Configurar `workbox-build` para precache agresivo.