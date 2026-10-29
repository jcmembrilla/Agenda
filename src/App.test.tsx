import 'fake-indexeddb/auto';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { db } from './lib/db';

beforeEach(async () => {
  await db.notes.clear();
});

describe('App', () => {
  it('arranca en Pendientes con el composer y las dos pestañas', async () => {
    render(<App />);

    expect(screen.getByRole('tab', { name: /pendientes/i })).toHaveAttribute(
      'aria-selected',
      'true',
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
});
