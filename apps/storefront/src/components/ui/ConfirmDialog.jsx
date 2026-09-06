import React, {useEffect, useRef} from "react";
import Button from "./Button";

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      aria-labelledby="confirm-title"
    >
      <strong id="confirm-title">{title}</strong>
      <p>{description}</p>
      <div>
        <Button variant="ghost" onClick={onCancel}>
          Batal
        </Button>
        <Button variant="secondary" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
