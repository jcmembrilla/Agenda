# Simple Agenda

Una agenda PWA offline-first minimalista hecha con React + Vite + Tailwind + Dexie.

Una agenda personal con tres áreas: **Tareas**, **Rutina** y **Almanaque**. Las notas rápidas conservan Pendientes/Realizadas; las rutinas son actividades fijas asociadas a los días elegidos, y las tareas fechadas se consultan en el Almanaque. No hay una sección separada de Trabajo.

## Características

- **Componer** notas desde la parte inferior; cada nota es un bloque de texto.
- **Rutina** muestra los siete días en una grilla semanal; permite editar y eliminar actividades recurrentes, sin checks ni tareas fechadas.
- **Almanaque** muestra los doce meses del año para crear y consultar tareas por fecha.
- Las fechas se guardan como `YYYY-MM-DD` local para evitar cambios de día por zona horaria.
- **Completar** → mueve la nota a _Realizadas_ con animación de check y colapso; el texto no queda tachado.
- **Deslizar hacia la derecha** en una pendiente (móvil o escritorio) para completarla; una barrida verde a pantalla completa muestra el check antes de guardarla. El botón con flecha también permite completarla con clic o teclado.
- **No se pueden reabrir** las completadas — solo borrar, y quedan en _Realizadas_ hasta que se eliminan.
- Límite **100 caracteres** por nota; los bloques se limitan a **máx. 2 líneas**; siguiente nota debajo.
- El compositore está **fijo en la parte inferior**.
- Estilo **papel cálido** con acentos teal para Tareas, cian para Rutina y violeta para Almanaque.
- **PWA ligera**: `registerType: 'prompt'` + `injectRegister: null`; SW desactivada en dev.
- **Instalable**: botón de instalación y guía para navegadores sin diálogo nativo.
- Sin router: tabs via `location.hash` (`#tareas` / `#rutina` / `#almanaque`) para el botón Atrás de Android. Los hashes antiguos se aceptan como entrada a Tareas.
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
- **Sin router**: hash de tres áreas para Android Back; Pendientes/Realizadas son pestañas internas de Tareas.
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
      notes.types.ts
      notes.repository.ts # notas rápidas y tareas fechadas
      hooks/     # useNotes, useNoteMutations, useCompleteAnimation, useHashTab
      components/
        MainTabs.tsx, TasksView.tsx, DatedNotes.tsx
    routine/
      routines.repository.ts
      RoutineView.tsx
    almanac/
      AlmanacView.tsx
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
pnpm test        # 27/27 passing

# Build
pnpm build       # 0; 110.32 kB gzip JS, 6.28 kB gzip CSS

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
