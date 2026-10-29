import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  label: string;
  children: ReactNode;
}

/**
 * 44×44 de área táctil siempre, aunque el ícono mida 20.
 * `label` es obligatorio: un ícono sin nombre accesible es un botón mudo.
 */
export function IconButton({ label, children, className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-full text-muted transition-colors',
        'hover:text-ink active:scale-95 disabled:pointer-events-none disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
