import 'fake-indexeddb/auto';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { db } from './lib/db';

beforeEach(async () => {
  await db.notes.clear();
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

  it('arranca en Pendientes con el composer y las dos pestañas', async () => {
    render(<App />);

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
});
