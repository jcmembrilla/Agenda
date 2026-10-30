import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { db } from './lib/db';

beforeEach(async () => {
  await db.notes.clear();
  await db.routines.clear();
  await db.routineOccurrences.clear();
  window.history.replaceState(null, '', '/');
});

describe('App', () => {
  it('muestra Simple Agenda y explica la instalación manual cuando el navegador no ofrece prompt', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Simple Agenda' })).toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: '+ Agregar rutina semanal' }));
    await user.type(screen.getByLabelText('Actividad que se repite'), 'Gimnasio');
    await user.click(screen.getByRole('button', { name: 'Guardar rutina' }));

    expect(await screen.findByText('Gimnasio')).toBeVisible();
    expect(screen.queryByRole('button', { name: /Marcar Gimnasio/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Planear algo para este día/ })).not.toBeInTheDocument();
  });

  it('muestra solo los nombres de los siete días y permite editar una rutina', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: 'Rutina' }));
    expect(screen.getAllByRole('article')).toHaveLength(7);
    expect(
      ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map((day) =>
        screen.getByRole('article', { name: day }),
      ),
    ).toHaveLength(7);
    expect(screen.queryByRole('button', { name: /Planear algo para este día/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '+ Agregar rutina semanal' }));
    await user.type(screen.getByLabelText('Actividad que se repite'), 'Lectura');
    await user.click(screen.getByRole('button', { name: 'Guardar rutina' }));

    await user.click(await screen.findByRole('button', { name: 'Editar rutina Lectura' }));
    const input = screen.getByLabelText('Editar actividad');
    await user.clear(input);
    await user.type(input, 'Lectura diaria');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('button', { name: 'Editar rutina Lectura diaria' })).toBeVisible();
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
