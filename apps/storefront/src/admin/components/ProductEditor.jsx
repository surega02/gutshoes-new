import React, {useEffect, useRef, useState} from "react";
import {api} from "../../api";
import {apiErrorMessage, productDraft, slugify} from "../lib/helpers";
import {catalogImageUrl} from "../../lib/catalog";
import Badge from "./Badge";
import Button from "./Button";
import Icon from "./Icon";

function ProductEditor({
  product,
  brands,
  categories,
  sizes,
  onClose,
  onSaved,
  onDeleted,
}) {
  const [form, setForm] = useState(() => productDraft(product));
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const [categoryName, setCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const imageInputRef = useRef(null);
  const drawerRef = useRef(null);
  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);
  const chooseImage = (file) => {
    setError("");
    if (!file) {
      setImageFile(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageFile(null);
      setError("Format gambar harus JPEG, PNG, atau WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageFile(null);
      setError("Ukuran gambar maksimal 5 MB.");
      return;
    }
    setImageFile(file);
  };
  const uploadSelectedImage = async (productId, existingImages = []) => {
    if (!imageFile) return null;
    const data = new FormData();
    data.append("image", imageFile);
    data.append("alt_text", form.name.trim());
    data.append("is_primary", existingImages.length ? "0" : "1");
    return api.uploadProductImage(productId, data);
  };
  const update = (key, value) =>
    setForm((previous) => ({...previous, [key]: value}));
  const updateVariant = (index, key, value) =>
    setForm((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, i) =>
        i === index ? {...variant, [key]: value} : variant,
      ),
    }));
  const addVariant = () =>
    setForm((previous) => ({
      ...previous,
      variants: [
        ...previous.variants,
        {size_id: "", sku: "", price: "", weight_grams: "900", is_active: true},
      ],
    }));
  const removeVariant = (index) =>
    setForm((previous) => ({
      ...previous,
      variants:
        previous.variants.length === 1
          ? previous.variants
          : previous.variants.filter((_, i) => i !== index),
    }));
  const toggleCategory = (id) =>
    setForm((previous) => ({
      ...previous,
      category_ids: previous.category_ids.includes(id)
        ? previous.category_ids.filter((value) => value !== id)
        : [...previous.category_ids, id],
    }));
  const createCategory = async () => {
    const name = categoryName.trim();
    if (!name) return;
    setSaving(true);
    setError("");
    try {
      const response = await api.createCategory({
        name,
        slug: slugify(name),
        description: null,
        parent_id: null,
      });
      setCategoryOptions((previous) => [response.data, ...previous]);
      update("category_ids", [...form.category_ids, response.data.id]);
      setCategoryName("");
      setNotice("Kategori baru ditambahkan.");
    } catch (err) {
      setError(apiErrorMessage(err, "Kategori belum dapat dibuat."));
    } finally {
      setSaving(false);
    }
  };
  const payload = () => {
    const data = {
      brand_id: Number(form.brand_id),
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      category_ids: form.category_ids.map(Number),
      variants: form.variants.map((variant) => ({
        ...variant,
        id: variant.id || undefined,
        size_id: Number(variant.size_id),
        price: String(variant.price),
        weight_grams: Number(variant.weight_grams),
        currency: "IDR",
        is_active: Boolean(variant.is_active),
      })),
    };
    if (form.status !== "PUBLISHED") data.status = form.status;
    return data;
  };
  const save = async (event) => {
    event.preventDefault();
    if (saving || uploading) return;
    setSaving(true);
    setError("");
    setNotice("");
    const hadImage = Boolean(imageFile);
    try {
      const response = form.id
        ? await api.updateProduct(form.id, payload())
        : await api.createProduct(payload());
      let savedProduct = response.data;
      if (imageFile) {
        setUploading(true);
        try {
          const imageResponse = await uploadSelectedImage(
            savedProduct.id,
            savedProduct.images || [],
          );
          savedProduct = {
            ...savedProduct,
            images: [...(savedProduct.images || []), imageResponse.data],
          };
          setImageFile(null);
          if (imageInputRef.current) imageInputRef.current.value = "";
        } catch (uploadError) {
          setForm(productDraft(savedProduct));
          onSaved(savedProduct);
          setError(
            apiErrorMessage(
              uploadError,
              "Produk sudah tersimpan sebagai draf, tetapi gambar gagal diunggah. Pilih file lalu coba unggah lagi.",
            ),
          );
          return;
        }
      }
      setForm(productDraft(savedProduct));
      setNotice(
        form.id
          ? "Perubahan produk tersimpan."
          : hadImage
            ? "Produk dan gambar berhasil disimpan sebagai draf."
            : "Produk berhasil dibuat sebagai draf.",
      );
      onSaved(savedProduct);
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Produk atau gambar belum dapat disimpan. Data produk tetap dipertahankan; coba lagi.",
        ),
      );
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };
  const publish = async () => {
    if (!form.id || saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await api.publishProduct(form.id);
      setForm((previous) => ({
        ...previous,
        status: "PUBLISHED",
        published_at: response.data.published_at,
      }));
      setNotice("Produk berhasil dipublikasikan ke storefront.");
      onSaved(response.data);
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Produk belum dapat dipublikasikan. Pastikan ada varian aktif dan minimal satu gambar.",
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
      await api.deleteProduct(form.id);
      onDeleted(form.id);
    } catch (err) {
      setError(apiErrorMessage(err, "Produk belum dapat dihapus."));
    } finally {
      setSaving(false);
    }
  };
  const uploadImage = async (event) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!form.id || !imageFile || uploading) return;
    const scrollTop = drawerRef.current?.scrollTop || 0;
    setUploading(true);
    setError("");
    setNotice("");
    try {
      const response = await uploadSelectedImage(form.id, form.images || []);
      setForm((previous) => ({
        ...previous,
        images: [...(previous.images || []), response.data],
      }));
      setImageFile(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      setNotice("Gambar produk berhasil diunggah.");
      requestAnimationFrame(() => {
        if (drawerRef.current) drawerRef.current.scrollTop = scrollTop;
        imageInputRef.current?.focus();
      });
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Gambar belum dapat diunggah. Gunakan JPEG, PNG, atau WebP 300–4000 px, maksimal 5 MB.",
        ),
      );
    } finally {
      setUploading(false);
    }
  };
  const deleteImage = async (image) => {
    if (uploading) return;
    setUploading(true);
    setError("");
    try {
      await api.deleteProductImage(form.id, image.id);
      setForm((previous) => ({
        ...previous,
        images: previous.images.filter((item) => item.id !== image.id),
      }));
      setNotice("Gambar produk dihapus.");
    } catch (err) {
      setError(apiErrorMessage(err, "Gambar belum dapat dihapus."));
    } finally {
      setUploading(false);
    }
  };
  return (
    <div
      className="adm-overlay"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside
        ref={drawerRef}
        className="adm-drawer adm-product-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-editor-title"
      >
        <header>
          <div>
            <small>{form.id ? "EDIT PRODUK" : "PRODUK BARU"}</small>
            <h2 id="product-editor-title">
              {form.id ? form.name || "Produk" : "Tambah produk"}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Tutup editor">
            <Icon name="close" />
          </button>
        </header>
        <form onSubmit={save} aria-busy={saving || uploading}>
          {notice && (
            <div className="adm-feedback success" role="status">
              <Icon name="check" />
              {notice}
            </div>
          )}
          {error && (
            <div className="adm-feedback error" role="alert">
              {error}
            </div>
          )}
          <div className="adm-form-grid">
            <label>
              Nama produk
              <input
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
            <label>
              Merek
              <select
                required
                value={form.brand_id}
                onChange={(event) => update("brand_id", event.target.value)}
              >
                <option value="">Pilih merek</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(event) => update("status", event.target.value)}
              >
                <option value="DRAFT">Draf</option>
                {form.status === "PUBLISHED" && (
                  <option value="PUBLISHED">Dipublikasikan</option>
                )}
                <option value="ARCHIVED">Diarsipkan</option>
              </select>
            </label>
            <label className="wide">
              Deskripsi
              <textarea
                maxLength="10000"
                value={form.description || ""}
                onChange={(event) => update("description", event.target.value)}
                placeholder="Informasi bahan, penggunaan, dan detail produk yang terverifikasi."
              />
            </label>
          </div>
          <fieldset className="adm-choice-field">
            <legend>Kategori</legend>
            {categoryOptions.length ? (
              <div>
                {categoryOptions.map((category) => (
                  <label key={category.id}>
                    <input
                      type="checkbox"
                      checked={form.category_ids.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            ) : (
              <p>
                Belum ada kategori. Buat kategori pertama agar produk dapat
                disimpan.
              </p>
            )}
            <div className="adm-inline-create">
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Nama kategori baru"
                maxLength="255"
              />
              <Button
                kind="secondary"
                type="button"
                onClick={createCategory}
                disabled={saving || !categoryName.trim()}
              >
                Tambah kategori
              </Button>
            </div>
          </fieldset>
          <section className="adm-variant-section">
            <div className="adm-section-head">
              <div>
                <h3>Varian produk</h3>
                <p>Setiap ukuran harus memiliki SKU, harga, dan berat.</p>
              </div>
              <Button kind="secondary" type="button" onClick={addVariant}>
                <Icon name="plus" /> Tambah varian
              </Button>
            </div>
            {form.variants.map((variant, index) => (
              <div className="adm-variant-row" key={variant.id || index}>
                <label>
                  Ukuran
                  <select
                    required
                    value={variant.size_id}
                    onChange={(event) =>
                      updateVariant(index, "size_id", event.target.value)
                    }
                  >
                    <option value="">Pilih ukuran</option>
                    {sizes.map((size) => (
                      <option key={size.id} value={size.id}>
                        {size.label || size.value} ({size.system})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  SKU
                  <input
                    required
                    maxLength="100"
                    value={variant.sku}
                    onChange={(event) =>
                      updateVariant(
                        index,
                        "sku",
                        event.target.value.toUpperCase(),
                      )
                    }
                  />
                </label>
                <label>
                  Harga
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    inputMode="numeric"
                    value={variant.price}
                    onChange={(event) =>
                      updateVariant(index, "price", event.target.value)
                    }
                  />
                </label>
                <label>
                  Berat (gram)
                  <input
                    required
                    type="number"
                    min="1"
                    max="100000"
                    inputMode="numeric"
                    value={variant.weight_grams}
                    onChange={(event) =>
                      updateVariant(index, "weight_grams", event.target.value)
                    }
                  />
                </label>
                <label className="adm-check">
                  <input
                    type="checkbox"
                    checked={variant.is_active}
                    onChange={(event) =>
                      updateVariant(index, "is_active", event.target.checked)
                    }
                  />{" "}
                  Varian aktif
                </label>
                <button
                  className="adm-remove-variant"
                  type="button"
                  onClick={() => removeVariant(index)}
                  disabled={form.variants.length === 1}
                >
                  Hapus
                </button>
              </div>
            ))}
          </section>
          <section className="adm-image-section">
              <div className="adm-section-head">
                <div>
                  <h3>Gambar produk</h3>
                  <p id="product-image-help">JPEG, PNG, atau WebP, 300–4000 px, maksimal 5 MB. Produk baru akan mengunggah gambar saat disimpan.</p>
                </div>
              </div>
              {imagePreview && imageFile && (
                <div className="adm-image-preview"><img src={imagePreview} alt="Preview gambar yang dipilih" /><span><strong>{imageFile.name}</strong><small>Siap diunggah</small></span></div>
              )}
              {form.images?.length ? (
                <div className="adm-image-list">
                  {form.images.map((image) => (
                    <div key={image.id}>
                      <img src={catalogImageUrl(image.path)} alt="" />
                      <span>
                        <strong>{image.alt_text || form.name}</strong>
                        <small>{image.path}</small>
                      </span>
                      {image.is_primary && <Badge tone="success">Utama</Badge>}
                      <button
                        type="button"
                        onClick={() => deleteImage(image)}
                        disabled={uploading}
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="adm-muted-copy">Belum ada gambar tersimpan.</p>
              )}
              <div className="adm-upload-row" aria-live="polite">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-describedby="product-image-help"
                  onChange={(event) =>
                    chooseImage(event.target.files?.[0] || null)
                  }
                />
                {form.id && (
                  <Button
                    kind="secondary"
                    type="button"
                    onClick={uploadImage}
                    disabled={!imageFile || uploading || saving}
                    aria-busy={uploading}
                  >
                    {uploading ? "Mengunggah…" : "Unggah gambar"}
                  </Button>
                )}
              </div>
            </section>
          {confirmDelete && (
            <div className="adm-delete-confirm" role="alert">
              <div>
                <strong>Hapus produk ini?</strong>
                <p>
                  Tindakan ini menghapus produk dari pengelolaan katalog dan
                  tidak dapat dibatalkan dari panel.
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
                disabled={saving || uploading}
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
                Hapus produk
              </button>
            )}
            {form.id && form.status !== "PUBLISHED" && (
              <Button
                kind="secondary"
                type="button"
                onClick={publish}
                disabled={saving || uploading}
              >
                Publikasikan
              </Button>
            )}
            <Button kind="secondary" type="button" onClick={onClose}>
              Tutup
            </Button>
            <Button type="submit" disabled={saving}>
              {saving || uploading ? "Menyimpan…" : "Simpan produk"}
            </Button>
          </footer>
        </form>
      </aside>
    </div>
  );
}

export default ProductEditor;







