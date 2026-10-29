# Simple Agenda

PWA offline-first minimalista hecha con React + Vite + Tailwind + Dexie.

## Uno a uno

- **Home** = compositore de notas; cada nota es un bloque de texto.
- **Completar** mueve la nota a la pestaña _Realizadas_ con animación de check (no borra).
- Las notas completadas **no se reabren** — solo se pueden borrar y quedan en _Realizadas_ hasta que se eliminan.
- Máx. **100 caracteres** por nota; los bloques se limitan a **máx. 2 líneas**; siguiente nota abajo.
- El compositore está **fijo en la parte inferior**.
- Estilo: **papel cálido + teal**: `#FAF9F7` / `#0D9488`.
- PWA ligera: `registerType: 'prompt'` + `injectRegister: null`; SW desactivada en dev.
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

## Dirección de producto y diseño

- La interfaz debe sentirse **simple, limpia, fluida, moderna y minimalista**; cada elemento visual debe ayudar a anotar o revisar tareas, sin decoración innecesaria.
- Mantener la paleta de papel cálido y teal. El tema oscuro sigue los colores del sistema hasta que exista una preferencia persistida.
- El nombre de producto visible y de instalación es **Simple Agenda** y su URL pública es `https://simple-agenda.netlify.app/`.
- Ofrecer instalar la PWA mientras no esté ejecutándose en modo instalado: usar el prompt del navegador si está disponible y mostrar instrucciones de menú para instalación manual si no. En iOS, comprobar también `navigator.standalone`.
- Centrar el conjunto en pantallas amplias, con encabezado y navegación centrados y una columna de contenido acotada; conservar la alineación izquierda del texto de las notas para facilitar su lectura.
- Usar iconos SVG lineales coherentes, etiquetas accesibles y controles táctiles claros. Evitar sumar una biblioteca de iconos o animaciones para elementos puntuales.
- Una nota realizada se distingue por su pestaña y su marca de verificación, **no por texto tachado persistente**. El tachado puede aparecer solo durante la animación de completado.
- Completar una nota pendiente debe aceptar un deslizamiento horizontal hacia la derecha con touch, mouse o lápiz; el affordance visible es una flecha hacia la derecha. Al completar, una barrida verde a pantalla completa con un check central confirma la acción, y el guardado ocurre después de la animación.
- Las acciones destructivas masivas requieren confirmación; conservar el borrado individual y ofrecer Deshacer cuando la operación lo permita.

## Alcance actual y siguientes pasos

- El calendario, la preferencia de tema persistida, Cmd/Ctrl+Enter, la detección de duplicados, el despliegue y la sincronización son funcionalidades pendientes o futuras; no deben adelantarse sin definir su comportamiento.
- El service worker ya se genera con Workbox: precarga los archivos de build y usa `index.html` como fallback de navegación. Revisar la estrategia de caché al incorporar APIs o recursos externos.
- Proceder por incrementos pequeños: acordar primero el comportamiento de cada funcionalidad, implementarla con pruebas de repositorio e interfaz, validar accesibilidad y diseño responsive, y después desplegar.

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
- [ ] Añadir atajo Cmd/Ctrl + Enter para guardar (Escape ya cancela la edición).
- [ ] Validación de duplicados por texto idéntico.
