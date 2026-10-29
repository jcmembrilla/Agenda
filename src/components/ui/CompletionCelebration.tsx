import { createPortal } from 'react-dom';
import { CheckSmallIcon } from './icons';

export function CompletionCelebration() {
  return createPortal(
    <div role="status" aria-label="Nota realizada" className="completion-celebration">
      <span className="completion-celebration__check">
        <CheckSmallIcon className="size-12" />
      </span>
    </div>,
    document.body,
  );
}
