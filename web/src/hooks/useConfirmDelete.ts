import { useCallback, useState } from "react";

export interface UseConfirmDeleteArgs<TId> {
  onDelete: (id: TId) => Promise<void>;
}

export interface UseConfirmDeleteReturn<TId> {
  readonly cancel: () => void;
  readonly confirm: () => Promise<void>;
  readonly isDeleting: boolean;
  readonly isOpen: boolean;
  readonly pendingId: TId | null;
  readonly requestDelete: (id: TId) => void;
}

export function useConfirmDelete<TId>({
  onDelete,
}: UseConfirmDeleteArgs<TId>): UseConfirmDeleteReturn<TId> {
  const [pendingId, setPendingId] = useState<TId | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const requestDelete = useCallback((id: TId) => {
    setPendingId(id);
  }, []);

  const cancel = useCallback(() => {
    if (isDeleting) return;
    setPendingId(null);
  }, [isDeleting]);

  const confirm = useCallback(async () => {
    if (pendingId === null || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(pendingId);
      setPendingId(null);
    } finally {
      setIsDeleting(false);
    }
  }, [pendingId, isDeleting, onDelete]);

  return {
    cancel,
    confirm,
    isDeleting,
    isOpen: pendingId !== null,
    pendingId,
    requestDelete,
  };
}
