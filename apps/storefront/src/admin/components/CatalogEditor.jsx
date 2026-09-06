import React, {useState} from "react";
import {api} from "../../api";
import {apiErrorMessage, slugify} from "../lib/helpers";
import Button from "./Button";
import Icon from "./Icon";

function CatalogEditor({kind, item, categories, onClose, onSaved, onDeleted}) {
  const isCategory = kind === "category";
  const label = isCategory ? "kategori" : "merek";
  const [form, setForm] = useState(() => ({
    id: item?.id || null,
    name: item?.name || "",
    slug: item?.slug || "",
    description: item?.description || "",
    parent_id: item?.parent_id ? String(item.parent_id) : "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = (key, value) =>
    setForm((previous) => ({...previous, [key]: value}));
  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      ...(isCategory
        ? {parent_id: form.parent_id ? Number(form.parent_id) : null}
        : {}),
    };
    try {
      const response = form.id
        ? isCategory
          ? await api.updateCategory(form.id, payload)
          : await api.updateBrand(form.id, payload)
        : isCategory
          ? await api.createCategory(payload)
          : await api.createBrand(payload);
      onSaved(
        response.data,
        `${isCategory ? "Kategori" : "Merek"} berhasil ${form.id ? "diperbarui" : "ditambahkan"}.`,
      );
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          `${isCategory ? "Kategori" : "Merek"} belum dapat disimpan.`,
        ),
      );
    } finally {
      setSaving(false);
    }
  };
  const destroy = async () => {
    if (!form.id || saving) return;
    setSaving(true);
    setError("");
    try {
      isCategory
        ? await api.deleteCategory(form.id)
        : await api.deleteBrand(form.id);
      onDeleted(`${isCategory ? "Kategori" : "Merek"} berhasil dihapus.`);
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          `${isCategory ? "Kategori" : "Merek"} belum dapat dihapus. Pastikan tidak sedang digunakan oleh produk.`,
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
      onKeyDown={(event) => event.key === "Escape" && onClose()}
    >
      <aside
        className="adm-drawer adm-editor adm-catalog-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-editor-title"
      >
        <header>
          <div>
            <small>
              {form.id ? "EDIT" : "TAMBAH"} {label.toUpperCase()}
            </small>
            <h2 id="catalog-editor-title">
              {form.id ? form.name || `Edit ${label}` : `Tambah ${label}`}
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
          <div className="adm-form-grid">
            <label>
              Nama {label}
              <input
                autoFocus
                required
                maxLength="255"
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value;
                  setForm((previous) => ({
                    ...previous,
                    name,
                    slug: previous.id ? previous.slug : slugify(name),
                  }));
                }}
              />
            </label>
            <label>
              Slug
              <input
                required
                maxLength="255"
                pattern="[a-z0-9-]+"
                value={form.slug}
                onChange={(event) =>
                  update("slug", slugify(event.target.value))
                }
              />
            </label>
            {isCategory && (
              <label className="wide">
                Kategori induk
                <select
                  value={form.parent_id}
                  onChange={(event) => update("parent_id", event.target.value)}
                >
                  <option value="">Tanpa kategori induk</option>
                  {categories
                    .filter((category) => category.id !== form.id)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <label className="wide">
              Deskripsi
              <textarea
                maxLength="2000"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                placeholder={`Deskripsi ${label} (opsional)`}
              />
            </label>
          </div>
          {confirmDelete && (
            <div className="adm-delete-confirm" role="alert">
              <div>
                <strong>Hapus {label} ini?</strong>
                <p>
                  Penghapusan akan ditolak bila {label} masih digunakan oleh
                  produk.
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
            {form.id && !confirmDelete && (
              <button
                className="adm-delete-link"
                type="button"
                onClick={() => setConfirmDelete(true)}
              >
                Hapus {label}
              </button>
            )}
            <Button kind="secondary" type="button" onClick={onClose}>
              Tutup
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : `Simpan ${label}`}
            </Button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

export default CatalogEditor;
