import React, {useState} from "react";
import {api} from "../../api";
import {apiErrorMessage} from "../lib/helpers";
import useDialogFocus from "../hooks/useDialogFocus";
import Button from "./Button";
import Icon from "./Icon";

function SizeEditor({size, onClose, onSaved, onDeleted}) {
  const [form, setForm] = useState({
    id: size?.id || null,
    system: size?.system || "EU",
    value: size?.value || "",
    label: size?.label || "",
  });
  const [labelEdited, setLabelEdited] = useState(Boolean(size?.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dialogRef = useDialogFocus(onClose);
  const usageCount = Number(size?.product_variants_count || 0);
  const updateIdentity = (key, value) => {
    setForm((previous) => {
      const next = {...previous, [key]: value};
      if (!labelEdited) {
        next.label = [next.system.trim().toUpperCase(), next.value.trim()]
          .filter(Boolean)
          .join(" ");
      }
      return next;
    });
  };
  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    const payload = {
      system: form.system.trim().toUpperCase(),
      value: form.value.trim(),
      label: form.label.trim(),
    };
    try {
      const response = form.id
        ? await api.updateSize(form.id, payload)
        : await api.createSize(payload);
      onSaved(
        response.data,
        `Ukuran berhasil ${form.id ? "diperbarui" : "ditambahkan"}.`,
      );
    } catch (requestError) {
      setError(
        apiErrorMessage(requestError, "Ukuran belum dapat disimpan."),
      );
    } finally {
      setSaving(false);
    }
  };
  const destroy = async () => {
    if (!form.id || saving || usageCount > 0) return;
    setSaving(true);
    setError("");
    try {
      await api.deleteSize(form.id);
      onDeleted("Ukuran berhasil dihapus.");
    } catch (requestError) {
      setError(
        apiErrorMessage(
          requestError,
          "Ukuran belum dapat dihapus. Pastikan tidak sedang digunakan oleh varian produk.",
        ),
      );
      setConfirmDelete(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="adm-overlay"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside
        ref={dialogRef}
        className="adm-drawer adm-editor adm-size-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-editor-title"
      >
        <header>
          <div>
            <small>{form.id ? "EDIT UKURAN" : "TAMBAH UKURAN"}</small>
            <h2 id="size-editor-title">
              {form.id ? form.label || "Edit ukuran" : "Ukuran baru"}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Tutup editor">
            <Icon name="close" />
          </button>
        </header>
        <form onSubmit={save} aria-busy={saving}>
          {error && (
            <div className="adm-feedback error" role="alert">
              {error}
            </div>
          )}
          <div className="adm-size-guide">
            <Icon name="ruler" size={22} />
            <p>
              Sistem dan nilai menjadi identitas ukuran. Label adalah teks yang
              dilihat admin dan pelanggan.
            </p>
          </div>
          <div className="adm-form-grid">
            <label>
              Sistem ukuran
              <input
                autoFocus
                required
                maxLength="16"
                value={form.system}
                onChange={(event) =>
                  updateIdentity("system", event.target.value.toUpperCase())
                }
                placeholder="EU"
              />
            </label>
            <label>
              Nilai
              <input
                required
                maxLength="16"
                value={form.value}
                onChange={(event) =>
                  updateIdentity("value", event.target.value)
                }
                placeholder="42"
              />
            </label>
            <label className="wide">
              Label tampilan
              <input
                required
                maxLength="32"
                value={form.label}
                onChange={(event) => {
                  setLabelEdited(true);
                  setForm((previous) => ({
                    ...previous,
                    label: event.target.value,
                  }));
                }}
                placeholder="EU 42"
              />
              <small>Contoh: EU 42, UK 8.5, atau 27 CM.</small>
            </label>
          </div>
          {form.id && usageCount > 0 && (
            <div className="adm-size-usage" role="status">
              <strong>Ukuran ini sedang digunakan</strong>
              <span>
                {usageCount} varian produk memakai ukuran ini. Anda tetap dapat
                mengubah labelnya, tetapi ukuran tidak dapat dihapus.
              </span>
            </div>
          )}
          {confirmDelete && (
            <div className="adm-delete-confirm" role="alert">
              <div>
                <strong>Hapus ukuran ini?</strong>
                <p>
                  Ukuran akan hilang dari pilihan varian produk baru.
                </p>
              </div>
              <Button
                kind="secondary"
                type="button"
                onClick={() => setConfirmDelete(false)}
              >
                Batal
              </Button>
              <button
                className="adm-danger-button"
                type="button"
                onClick={destroy}
                disabled={saving}
              >
                Ya, hapus
              </button>
            </div>
          )}
          <footer>
            {form.id && usageCount === 0 && !confirmDelete && (
              <button
                className="adm-delete-link"
                type="button"
                onClick={() => setConfirmDelete(true)}
              >
                Hapus ukuran
              </button>
            )}
            <Button kind="secondary" type="button" onClick={onClose}>
              Tutup
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan ukuran"}
            </Button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

export default SizeEditor;
