# Simple Agenda

Una agenda PWA offline-first minimalista hecha con React + Vite + Tailwind + Dexie.

Un bloc de notas simple donde anotar pendientes y marcarlas como realizadas con un check. Las completadas pasan a la pestaña _Realizadas_ sin quedar tachadas. Se pueden borrar individualmente o en conjunto, con opción para deshacer.

## Características

- **Componer** notas desde la parte inferior; cada nota es un bloque de texto.
- **Completar** → mueve la nota a _Realizadas_ con animación de check y colapso; el texto no queda tachado.
- **No se pueden reabrir** las completadas — solo borrar, y quedan en _Realizadas_ hasta que se eliminan.
- Límite **100 caracteres** por nota; los bloques se limitan a **máx. 2 líneas**; siguiente nota debajo.
- El compositore está **fijo en la parte inferior**.
- Estilo **papel cálido + teal**: `#FAF9F7` / `#0D9488`.
- **PWA ligera**: `registerType: 'prompt'` + `injectRegister: null`; SW desactivada en dev.
- **Instalable**: botón de instalación y guía para navegadores sin diálogo nativo.
- Sin router: tabs via `location.hash` (`#pendientes` / `#realizadas`) para el botón Atrás de Android.
- Íconos generados por script propio (sin dependencias).

## Pila tecnológica (bloqueado)

| Capa            | Versión                              |
| --------------- | ------------------------------------ |
| TypeScript      | `6.0.3` (typescript-eslint `<6.1.0`) |
| ESLint          | `9.39.5` (jsx-a11y `^9`)             |
| Vite            | `8.3.5`                              |
| React           | `19.3.1`                             |
| Dexie           | `4.4.7`                              |
| Tailwind CSS    | `4.3.3`                              |
| vite-plugin-pwa | `2.0.0`                              |
| Vitest          | `5.0.5`                              |

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

| Script           | Descripción                       |
| ---------------- | --------------------------------- |
| `pnpm dev`       | Vite en desarrollo                |
| `pnpm build`     | `tsc --noEmit && vite build`      |
| `pnpm preview`   | `vite preview`                    |
| `pnpm typecheck` | `tsc --noEmit`                    |
| `pnpm lint`      | `eslint .`                        |
| `pnpm format`    | `prettier --write .`              |
| `pnpm test`      | `vitest run`                      |
| `pnpm icons`     | `node scripts/generate-icons.mjs` |

## Estructura de carpetas (resumida)

```
src/
  lib/          # id, cn, dates, motion, scroll, useAutosize
  styles/       # tokens, keyframes, dark override
  features/
    notes/
      types.ts   # Note, NoteInput, NoteStatus, NoteCounts, NoteValidationError, NoteNotFoundError
      repository.ts # createNotesRepository, normalizeNoteText, complete, softDelete, restore
      hooks/     # useNotes, useNoteMutations, useCompleteAnimation, useHashTab
      components/
        NoteBlock.tsx     # pending/done rendering, inline edit, delete, animation container
        NoteComposer.tsx  # bottom composer, 100-char limit, autosize
        CheckButton.tsx   # 28px circle dentro de 44px hit area
        NoteList.tsx
        NotesTabs.tsx
  components/  # ui/ (IconButton, Toaster, EmptyState, CheckButton, TrashIcon)
  pwa/         # OfflineBanner, UpdateBanner
  App.tsx      # shell, hash tab, undo toast flow
  main.tsx
```

## Desarrollo

```bash
# Instalar dependencias
pnpm install

# Desarrollo
pnpm dev

# Typecheck
pnpm typecheck   # 0 errores

# Lint
pnpm lint        # 0 errores

# Test
pnpm test        # 24/24 passing

# Build
pnpm build       # 0; 109.58 kB gzip JS, 5.70 kB gzip CSS

# Íconos
pnpm icons       # genera public/icons/
```

## Capturas (Edge headless 390×844)

- **Light, Pendientes**: nota vacía, composer activo, check 28px dentro de 44px.
- **Light, Realizadas**: notas sin tachado persistente, con check verde.
- **Dark, Realizadas**: modo oscuro con tokens invertidos.
- **Dark, Pendientes**: mismo esquema, colores de canvas oscuro.
- **Toast "Deshacer"**: aparece al borrar, con botón de undo de 5 s.

La vista Realizadas permite borrar una nota individual o todas juntas (con confirmación y opción para deshacer).

## Licencia

MIT — © 2026 Comercio Local.
