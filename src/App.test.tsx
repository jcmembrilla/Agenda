import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { db } from './lib/db';

beforeEach(async () => {
  await db.notes.clear();
  await db.personalNotes.clear();
  await db.routines.clear();
  await db.routineOccurrences.clear();
  await db.eisenhowerTasks.clear();
  await db.economyEntries.clear();
  window.localStorage.removeItem('anotador:eisenhower-tool-added');
  window.localStorage.removeItem('anotador:economy-tool-added');
  window.history.replaceState(null, '', '/');
});

describe('App', () => {
  it('oculta la marca SA y explica la instalación manual desde otras herramientas', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole('heading', { name: 'SA' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Otras herramientas' }));
    await user.click(screen.getByRole('button', { name: 'Instalar app' }));

    expect(screen.getByRole('dialog', { name: 'Instalar Simple Agenda' })).toBeInTheDocument();
    expect(screen.getByText(/Agregar a pantalla de inicio/)).toBeInTheDocument();
  });

  it('usa el prompt nativo de instalación y oculta el botón tras aceptar', async () => {
    const user = userEvent.setup();
    const prompt = vi.fn().mockResolvedValue(undefined);
    const installEvent = new Event('beforeinstallprompt', { cancelable: true });

    Object.defineProperties(installEvent, {
      prompt: { value: prompt },
      userChoice: { value: Promise.resolve({ outcome: 'accepted', platform: 'web' }) },
    });

    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Otras herramientas' }));
    fireEvent(window, installEvent);
    await user.click(screen.getByRole('button', { name: 'Instalar app' }));

    expect(prompt).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument();
    });
  });

  it('oculta el botón de instalación cuando la app ya está abierta como PWA', async () => {
    const originalMatchMedia = window.matchMedia.bind(window);
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
      const mediaQuery = originalMatchMedia(query);
      if (query === '(display-mode: standalone)') {
        Object.defineProperty(mediaQuery, 'matches', { configurable: true, value: true });
      }
      return mediaQuery;
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument();
    });
  });

  it('arranca en Tareas y conserva el selector Pendientes/Realizadas', async () => {
    render(<App />);

    expect(screen.getByRole('tab', { name: 'Tareas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Notas' })).toHaveAttribute(
      'aria-controls',
      'panel-personal-notes',
    );
    expect(screen.getByRole('tab', { name: 'Rutina' })).toHaveAttribute(
      'aria-controls',
      'panel-routine',
    );
    expect(screen.getByRole('tab', { name: 'Almanaque' })).toHaveAttribute(
      'aria-controls',
      'panel-almanac',
    );
    expect(document.getElementById('panel-tasks')).toBeVisible();
    expect(document.getElementById('panel-routine')).not.toBeVisible();
    expect(document.getElementById('panel-almanac')).not.toBeVisible();
    expect(screen.getByRole('tab', { name: /pendientes/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(document.getElementById('panel-pending')).toBeVisible();
    expect(document.getElementById('panel-done')).not.toBeVisible();
    expect(screen.getByRole('tab', { name: /pendientes/i })).toHaveAttribute(
      'aria-controls',
      'panel-pending',
    );
    expect(screen.getByRole('tab', { name: /realizadas/i })).toHaveAttribute(
      'aria-controls',
      'panel-done',
    );
    expect(screen.getByLabelText('Nueva nota')).toBeInTheDocument();
    expect(await screen.findByText('Nada pendiente')).toBeInTheDocument();
  });

  it('agrega Pendientes al inicio y permite gestionar tareas en los cuatro cuadrantes', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Otras herramientas' }));
    await user.click(screen.getByRole('button', { name: 'Pendientes' }));

    expect(screen.getAllByRole('tab')[0]).toHaveAccessibleName('Pendientes');
    expect(screen.getByRole('tab', { name: 'Pendientes' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Organizá tus tareas según su urgencia e importancia.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Abrir Urgente e importante' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Abrir Importante, no urgente' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Abrir Urgente, no importante' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Abrir Ni urgente ni importante' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Abrir Urgente e importante' }));
    await user.type(
      screen.getByLabelText('Nueva tarea para Hacer de inmediato'),
      'Resolver entrega',
    );
    await user.click(screen.getByRole('button', { name: 'Agregar tarea' }));

    expect(await screen.findByRole('button', { name: 'Completar Resolver entrega' })).toBeVisible();
    expect(await db.eisenhowerTasks.count()).toBe(1);
    await user.click(screen.getByRole('button', { name: 'Completar Resolver entrega' }));
    expect(await screen.findByRole('button', { name: 'Reabrir Resolver entrega' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Eliminar Resolver entrega' }));
    await waitFor(async () => expect(await db.eisenhowerTasks.count()).toBe(0));
    await user.click(screen.getByRole('button', { name: 'Volver a los cuatro cuadrantes' }));
    expect(screen.getByRole('button', { name: 'Abrir Urgente e importante' })).toBeVisible();
  }, 15000);

  it('agrega Economía desde herramientas y calcula el presupuesto mensual', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Otras herramientas' }));
    await user.click(screen.getByRole('button', { name: 'Economía' }));

    expect(screen.getAllByRole('tab')[0]).toHaveAccessibleName('Economía');
    expect(screen.getByRole('tab', { name: 'Economía' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'Economía mensual' })).toBeVisible();

    const addEntry = async (
      sectionName: string,
      groupName: string,
      label: string,
      amount: string,
      frequency?: string,
    ) => {
      screen.getByRole('region', { name: sectionName });
      const group = screen.getByRole('heading', { name: groupName }).closest('section');
      if (!group) throw new Error(`No se encontró el grupo ${groupName}.`);
      await user.click(within(group).getByRole('button', { name: 'Agregar movimiento' }));
      await user.type(screen.getByLabelText('Nombre del movimiento'), label);
      await user.type(screen.getByLabelText('Importe en pesos'), amount);
      if (frequency) {
        await user.selectOptions(screen.getByLabelText('Frecuencia del gasto'), frequency);
      }
      await user.click(within(group).getByRole('button', { name: 'Agregar' }));
    };

    await addEntry('Ingresos', 'Ingresos fijos', 'Sueldo', '1200');
    await addEntry('Gastos', 'Gastos periódicos', 'Patente', '12000', 'yearly');
    await addEntry('Ahorro e inversión', 'Fondo de emergencia', 'Fondo de emergencia', '200');

    expect(await screen.findByText('Ingresos, gastos y ahorro están equilibrados.')).toBeVisible();
    expect(await db.economyEntries.count()).toBe(3);

    const monthPicker = screen.getByLabelText('Elegir mes del presupuesto');
    const [year, month] = (monthPicker as HTMLInputElement).value.split('-').map(Number);
    const nextMonthDate = new Date(year ?? 2000, month ?? 1, 1);
    const nextMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    await waitFor(() => expect(monthPicker).toHaveValue(nextMonth));
    const nextMonthGroup = screen
      .getByRole('heading', { name: 'Ingresos fijos' })
      .closest('section');
    if (!nextMonthGroup) throw new Error('No se encontró el grupo de ingresos fijos.');
    expect(
      await within(nextMonthGroup).findByText('Todavía no agregaste movimientos.'),
    ).toBeVisible();
  }, 15000);

  it('guarda, edita y permite recuperar notas personales', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Notas' }));
    await user.type(screen.getByLabelText('Escribir una nota nueva'), 'Una idea importante');
    await user.click(screen.getByRole('button', { name: 'Guardar nota' }));

    const editor = await screen.findByRole('textbox', { name: 'Editar nota' });
    expect(await db.personalNotes.count()).toBe(1);
    expect(editor).toHaveValue('Una idea importante');
    const title = screen.getByRole('textbox', { name: 'Título de la nota 1' });
    expect(title).toHaveValue('Nota 1');
    expect(document.querySelector('time')).toHaveTextContent(
      new Intl.DateTimeFormat('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      }).format(new Date((await db.personalNotes.toCollection().first())?.createdAt ?? 0)),
    );
    await user.clear(title);
    await user.type(title, 'Proyecto');
    await user.keyboard('{Enter}');
    await waitFor(async () => {
      expect((await db.personalNotes.toCollection().first())?.title).toBe('Proyecto');
    });
    await user.type(editor, '\ny con más detalle');

    await waitFor(async () => {
      const savedNote = await db.personalNotes.toCollection().first();
      expect(savedNote?.text).toBe('Una idea importante\ny con más detalle');
    });

    await user.click(screen.getByRole('button', { name: 'Eliminar nota: Proyecto' }));
    await user.click(await screen.findByRole('button', { name: 'Deshacer' }));
    expect(await screen.findByRole('button', { name: /Abrir y editar nota/ })).toBeVisible();
    expect(await db.personalNotes.count()).toBe(1);
  }, 10000);

  it('cambia a Rutina y Almanaque sin abandonar Tareas', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Rutina' }));
    expect(document.getElementById('panel-routine')).toBeVisible();
    expect(screen.getByText('Rutina semanal')).toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Almanaque' })).toHaveAttribute('aria-selected', 'true');
    expect(document.getElementById('panel-almanac')).toBeVisible();

    await user.click(screen.getByRole('tab', { name: 'Rutina' }));
    expect(document.getElementById('panel-routine')).toBeVisible();

    await user.click(screen.getByRole('tab', { name: 'Almanaque' }));
    expect(document.getElementById('panel-almanac')).toBeVisible();
    expect(screen.getByText('Tus planes en el año.')).toBeInTheDocument();
  });

  it('crea una actividad semanal fija que no se marca como tarea', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Rutina' }));
    await user.click(screen.getByRole('button', { name: 'Agregar rutina semanal' }));
    await user.type(screen.getByLabelText('Actividad que se repite'), 'Gimnasio');
    await user.click(screen.getByRole('button', { name: 'Guardar rutina' }));

    expect(await screen.findByText('Gimnasio')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Marcar Gimnasio/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Planear algo para este día/ }),
    ).not.toBeInTheDocument();
  });

  it('muestra los siete días más la celda de Semana N y permite editar una rutina', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Rutina' }));
    expect(screen.getAllByRole('article')).toHaveLength(8);
    expect(
      ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map((day) =>
        screen.getByRole('article', { name: day }),
      ),
    ).toHaveLength(7);
    expect(screen.getByRole('article', { name: /Semana \d+/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Planear algo para este día/ }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Agregar rutina semanal' }));
    await user.type(screen.getByLabelText('Actividad que se repite'), 'Lectura');
    await user.click(screen.getByRole('button', { name: 'Guardar rutina' }));

    await user.click(await screen.findByRole('button', { name: 'Editar rutina Lectura' }));
    const input = screen.getByLabelText('Editar actividad');
    await user.clear(input);
    await user.type(input, 'Lectura diaria');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(
      await screen.findByRole('button', { name: 'Editar rutina Lectura diaria' }),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Editar rutina Lectura' })).not.toBeInTheDocument();
  });

  it('agrega una tarea fechada desde el Almanaque', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Almanaque' }));
    await user.click(screen.getByRole('button', { name: '+ Agregar' }));
    await user.type(screen.getByLabelText('Nueva tarea para este día'), 'Pagar alquiler');
    await user.click(screen.getByRole('button', { name: 'Agregar tarea al día' }));

    expect(screen.getByRole('button', { name: 'Pagar alquiler' })).toBeVisible();
    expect(screen.queryByLabelText('Nueva nota')).not.toBeInTheDocument();
  });

  it('crea una nota desde el composer y la muestra como bloque', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Nueva nota'), 'comprar pan{Enter}');

    expect(await screen.findByRole('button', { name: 'comprar pan' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva nota')).toHaveValue('');
  });

  it('no permite guardar una nota vacía', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Nueva nota'), '    ');

    expect(screen.getByRole('button', { name: 'Guardar nota' })).toBeDisabled();
  });

  it('permite borrar todas las realizadas con confirmación y deshacer', async () => {
    await db.notes.add({
      id: 'done-note',
      text: 'nota realizada',
      status: 'done',
      createdAt: 1,
      updatedAt: 2,
      completedAt: 2,
      deleted: 0,
    });
    window.history.replaceState(null, '', '/#realizadas');

    const user = userEvent.setup();
    render(<App />);

    expect(
      await screen.findByRole('button', { name: 'Eliminar nota: nota realizada' }),
    ).toBeVisible();
    expect(screen.getByText('nota realizada')).not.toHaveClass('note-text');

    await user.click(screen.getByRole('button', { name: 'Borrar todas las realizadas' }));
    expect(
      screen.getByRole('group', { name: '¿Borrar todas las notas realizadas?' }),
    ).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Sí, borrar todas' }));
    expect(await screen.findByText('Todavía no completaste nada')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Deshacer' }));
    expect(await screen.findByText('nota realizada')).toBeVisible();
  });

  it('muestra la celebración a pantalla completa al completar una nota', async () => {
    await db.notes.add({
      id: 'pending-note',
      text: 'marcar como realizada',
      status: 'pending',
      createdAt: 1,
      updatedAt: 1,
      completedAt: 0,
      deleted: 0,
    });

    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Marcar como realizada' }));

    expect(screen.getByRole('status', { name: 'Nota realizada' })).toBeInTheDocument();
  });
});
