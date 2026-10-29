import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Note } from '../notes.types';
import { NoteBlock } from './NoteBlock';

const note: Note = {
  id: 'note-1',
  text: 'comprar pan',
  status: 'pending',
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
  completedAt: 0,
  deleted: 0,
};

function renderBlock(onComplete = vi.fn().mockResolvedValue(undefined)) {
  render(
    <NoteBlock
      note={note}
      variant="pending"
      onComplete={onComplete}
      onUpdateText={vi.fn().mockResolvedValue(undefined)}
      onDelete={vi.fn()}
    />,
  );

  return { onComplete };
}

function setReducedMotion(reduced: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: reduced && query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  });
}

afterEach(() => {
  vi.useRealTimers();
  setReducedMotion(false);
});

describe('NoteBlock', () => {
  it('muestra el texto como bloque', () => {
    renderBlock();

    expect(screen.getByText('comprar pan')).toBeInTheDocument();
  });

  it('no persiste al tocar el check: espera a que termine la animación', async () => {
    vi.useFakeTimers();
    const { onComplete } = renderBlock();

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como realizada' }));

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Marcar como realizada' })).toHaveAttribute(
      'aria-busy',
      'true',
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(note.id);
  });

  it('ignora taps repetidos mientras se está completando', async () => {
    vi.useFakeTimers();
    const { onComplete } = renderBlock();
    const button = screen.getByRole('button', { name: 'Marcar como realizada' });

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('con movimiento reducido persiste sin esperar animación', async () => {
    setReducedMotion(true);
    const { onComplete } = renderBlock();

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como realizada' }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('vuelve al estado pendiente si la escritura falla', async () => {
    vi.useFakeTimers();
    const onComplete = vi.fn().mockRejectedValue(new Error('cuota llena'));
    renderBlock(onComplete);

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como realizada' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    expect(screen.getByRole('button', { name: 'Marcar como realizada' })).toHaveAttribute(
      'aria-busy',
      'false',
    );
  });
});
