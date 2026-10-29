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

function renderBlock(
  onComplete = vi.fn().mockResolvedValue(undefined),
  onCompletionStart = vi.fn(),
) {
  render(
    <NoteBlock
      note={note}
      variant="pending"
      onCompletionStart={onCompletionStart}
      onComplete={onComplete}
      onUpdateText={vi.fn().mockResolvedValue(undefined)}
      onDelete={vi.fn()}
    />,
  );

  return { onComplete, onCompletionStart };
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
    expect(
      screen.getByRole('button', { name: 'Marcar como realizada' }).querySelector('svg'),
    ).toBeTruthy();
  });

  it('completa al deslizar una nota hacia la derecha con mouse o touch', async () => {
    vi.useFakeTimers();
    const { onComplete, onCompletionStart } = renderBlock();
    const textButton = screen.getByRole('button', { name: 'comprar pan' });
    const card = textButton.closest('article');

    expect(card).not.toBeNull();
    if (!card) throw new Error('No se encontró el bloque de la nota.');

    fireEvent.pointerDown(textButton, {
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      clientX: 10,
      clientY: 20,
    });
    fireEvent.pointerMove(card, {
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 110,
      clientY: 21,
    });
    fireEvent.pointerUp(card, {
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 110,
      clientY: 21,
    });

    expect(onCompletionStart).toHaveBeenCalledOnce();
    expect(onComplete).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    expect(onComplete).toHaveBeenCalledWith(note.id);
  });

  it('no completa si el arrastre hacia la derecha es corto', () => {
    const { onComplete, onCompletionStart } = renderBlock();
    const textButton = screen.getByRole('button', { name: 'comprar pan' });
    const card = textButton.closest('article');
    if (!card) throw new Error('No se encontró el bloque de la nota.');

    fireEvent.pointerDown(textButton, {
      pointerId: 1,
      pointerType: 'touch',
      button: 0,
      clientX: 10,
      clientY: 20,
    });
    fireEvent.pointerMove(card, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 40,
      clientY: 20,
    });
    fireEvent.pointerUp(card, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 40,
      clientY: 20,
    });

    expect(onCompletionStart).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
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
    const { onComplete, onCompletionStart } = renderBlock();

    fireEvent.click(screen.getByRole('button', { name: 'Marcar como realizada' }));

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
    expect(onCompletionStart).not.toHaveBeenCalled();
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
