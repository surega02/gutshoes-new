import React, {useEffect, useMemo, useState} from "react";
import {api} from "../../api";
import useAdminResource from "../hooks/useAdminResource";
import {apiErrorMessage, serverList} from "../lib/helpers";
import Badge from "../components/Badge";
import Button from "../components/Button";
import DataToolbar from "../components/DataToolbar";
import Empty from "../components/Empty";
import Icon from "../components/Icon";
import PageHead from "../components/PageHead";
import ResourceState from "../components/ResourceState";

const emptyCreate = {warehouse_id: "", product_variant_id: "", initial_stock: "", reason: "Stok awal"};

function InventoryPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Semua stok");
  const [editor, setEditor] = useState(null);
  const [options, setOptions] = useState({warehouses: [], variants: []});
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [movements, setMovements] = useState([]);
  const [form, setForm] = useState(emptyCreate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const resource = useAdminResource(() => api.inventories({per_page: 100}));

  useEffect(() => {
    setOptionsLoading(true);
    api.inventoryOptions()
      .then((response) => {
        setOptions(response.data);
        setOptionsError("");
      })
      .catch((requestError) => {
        setOptions({warehouses: [], variants: []});
        setOptionsError(
          requestError.message || "Pilihan gudang dan varian belum dapat dimuat.",
        );
      })
      .finally(() => setOptionsLoading(false));
  }, []);

  const selectedWarehouse = options.warehouses.find((item) => String(item.id) === String(form.warehouse_id));
  const selectedVariant = options.variants.find((item) => String(item.id) === String(form.product_variant_id));

  const rows = useMemo(() => serverList(resource.data)
    .map((item) => ({
      ...item,
      sku: item.variant?.sku || "—",
      product: item.variant?.product?.name || "Produk",
      size: item.variant?.size?.label || item.variant?.size?.value || "—",
      available: Number(item.on_hand || 0) - Number(item.reserved || 0),
      warehouseName: item.warehouse?.name || "Gudang",
    }))
    .filter((item) => [item.product, item.sku, item.warehouseName].join(" ").toLowerCase().includes(query.toLowerCase()))
    .filter((item) =>
      filter === "Semua stok" ||
      (filter === "Stok rendah" && item.available > 0 && item.available <= 5) ||
      (filter === "Habis" && item.available === 0) ||
      (filter === "Tersedia" && item.available > 5),
    ), [resource.data, query, filter]);

  const openCreate = () => {
    setEditor({mode: "create"});
    setForm(emptyCreate);
    setMovements([]);
    setError("");
    setNotice("");
  };

  const openEdit = async (item) => {
    setEditor({mode: "edit", item});
    setForm({delta: "", reason: ""});
    setMovements([]);
    setError("");
    setNotice("");
    try {
      const response = await api.inventoryMovements(item.id);
      setMovements(response.data || []);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Riwayat movement belum dapat dimuat."));
    }
  };

  const close = () => {
    if (!saving) setEditor(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (editor.mode === "create") {
        await api.createInventory({
          warehouse_id: Number(form.warehouse_id),
          product_variant_id: Number(form.product_variant_id),
          initial_stock: Number(form.initial_stock),
          reason: form.reason.trim(),
        });
        setNotice("Stok varian berhasil didaftarkan.");
        setEditor(null);
      } else {
        await api.adjustInventory(editor.item.id, {
          delta: Number(form.delta),
          reason: form.reason.trim(),
        });
        setNotice("Perubahan stok berhasil disimpan dan dicatat.");
        setEditor(null);
      }
      resource.retry();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Perubahan stok belum dapat disimpan."));
    } finally {
      setSaving(false);
    }
  };

  const destroy = async () => {
    if (!editor?.item || saving) return;
    setSaving(true);
    setError("");
    try {
      await api.deleteInventory(editor.item.id);
      setEditor(null);
      resource.retry();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Record stok tidak dapat dihapus."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead section="inventory" action="Tambah stok" onAction={openCreate} />
      {notice && <div className="adm-feedback success" role="status"><Icon name="check" />{notice}</div>}
      <DataToolbar {...{query, setQuery, filter, setFilter}} options={["Semua stok", "Stok rendah", "Habis", "Tersedia"]} />
      <ResourceState {...resource} />
      {!resource.loading && !resource.error && (
        <section className="adm-card adm-table-card">
          {rows.length ? (
            <div className="adm-table-wrap">
              <table>
                <thead><tr><th>Varian</th><th>SKU</th><th>Gudang</th><th className="num">Fisik</th><th className="num">Tersedia</th><th className="num">Dicadangkan</th><th className="num">Terjual</th><th>Status</th><th><span className="sr-only">Aksi</span></th></tr></thead>
                <tbody>
                  {rows.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.product}</strong><small>Ukuran {item.size}</small></td>
                      <td><code>{item.sku}</code></td>
                      <td>{item.warehouseName}</td>
                      <td className="num"><strong>{item.on_hand}</strong></td>
                      <td className="num"><strong>{item.available}</strong></td>
                      <td className="num">{item.reserved}</td>
                      <td className="num">{item.sold}</td>
                      <td><Badge tone={item.available === 0 ? "danger" : item.available <= 5 ? "warning" : "success"}>{item.available === 0 ? "Habis" : item.available <= 5 ? "Stok rendah" : "Tersedia"}</Badge></td>
                      <td><button className="adm-row-action" onClick={() => openEdit(item)} aria-label={`Kelola stok ${item.sku}`}><Icon name="arrow" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty title="Varian tidak ditemukan" text="Coba ubah pencarian atau tambahkan kombinasi varian dan gudang." />}
        </section>
      )}
      {editor && (
        <div className="adm-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
          <aside className="adm-drawer adm-inventory-editor" role="dialog" aria-modal="true" aria-labelledby="inventory-editor-title">
            <header>
              <div><small>{editor.mode === "create" ? "STOK BARU" : "KELOLA STOK"}</small><h2 id="inventory-editor-title">{editor.mode === "create" ? "Daftarkan stok varian" : editor.item.sku}</h2></div>
              <button onClick={close} aria-label="Tutup editor"><Icon name="close" /></button>
            </header>
            <form onSubmit={submit} aria-busy={saving}>
              <div className="adm-inventory-form-body">
              {error && <div className="adm-feedback error" role="alert">{error}</div>}
              {editor.mode === "create" ? (
                <div className="adm-stock-create">
                  <section className="adm-stock-form-section" aria-labelledby="stock-location-title">
                    <div className="adm-stock-section-head">
                      <span aria-hidden="true"><Icon name="warehouse" /></span>
                      <div><h3 id="stock-location-title">Lokasi dan varian</h3><p>Tentukan tempat penyimpanan serta produk yang menerima stok.</p></div>
                    </div>
                    {optionsError && <div className="adm-feedback error" role="alert">{optionsError}</div>}
                    <div className="adm-stock-fields">
                      <label><span>Gudang</span><select required disabled={optionsLoading} value={form.warehouse_id} onChange={(event) => setForm({...form, warehouse_id: event.target.value})}><option value="">{optionsLoading ? "Memuat gudang…" : "Pilih gudang"}</option>{options.warehouses.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}</select><small>Lokasi fisik tempat stok disimpan.</small></label>
                      <label><span>Produk dan ukuran</span><select required disabled={optionsLoading} value={form.product_variant_id} onChange={(event) => setForm({...form, product_variant_id: event.target.value})}><option value="">{optionsLoading ? "Memuat varian…" : "Pilih produk dan ukuran"}</option>{options.variants.map((item) => <option key={item.id} value={item.id}>{item.product?.name} · Ukuran {item.size?.label || item.size?.value} · {item.sku}</option>)}</select><small>Setiap varian hanya dapat didaftarkan satu kali per gudang.</small></label>
                    </div>
                    {(selectedWarehouse || selectedVariant) && (
                      <div className="adm-stock-selection" aria-live="polite">
                        <div><small>Gudang</small><strong>{selectedWarehouse?.name || "Belum dipilih"}</strong><span>{selectedWarehouse?.code || "—"}</span></div>
                        <div><small>Varian</small><strong>{selectedVariant?.product?.name || "Belum dipilih"}</strong><span>{selectedVariant ? "Ukuran " + (selectedVariant.size?.label || selectedVariant.size?.value) + " · " + selectedVariant.sku : "—"}</span></div>
                      </div>
                    )}
                  </section>
                  <section className="adm-stock-form-section" aria-labelledby="stock-quantity-title">
                    <div className="adm-stock-section-head">
                      <span aria-hidden="true"><Icon name="plus" /></span>
                      <div><h3 id="stock-quantity-title">Jumlah dan pencatatan</h3><p>Masukkan jumlah fisik yang diterima dan alasan untuk jejak audit.</p></div>
                    </div>
                    <div className="adm-stock-fields adm-stock-fields--quantity">
                      <label><span>Stok awal</span><div className="adm-stock-number"><input required type="number" min="0" max="1000000" inputMode="numeric" placeholder="0" value={form.initial_stock} onChange={(event) => setForm({...form, initial_stock: event.target.value})} /><b>unit</b></div><small>Gunakan 0 bila hanya mendaftarkan lokasi stok.</small></label>
                      <label><span>Alasan pencatatan</span><textarea required maxLength="255" rows="3" placeholder="Contoh: penerimaan awal dari supplier" value={form.reason} onChange={(event) => setForm({...form, reason: event.target.value})} /><small>{form.reason.length}/255 karakter · akan tersimpan pada movement stok.</small></label>
                    </div>
                  </section>
                </div>
              ) : (
                <>
                  <div className="adm-stock-summary"><span>Fisik<strong>{editor.item.on_hand}</strong></span><span>Reserved<strong>{editor.item.reserved}</strong></span><span>Tersedia<strong>{editor.item.available}</strong></span><span>Terjual<strong>{editor.item.sold}</strong></span></div>
                  <div className="adm-form-grid">
                    <label>Perubahan jumlah<input required type="number" min={-Number(editor.item.available)} max="1000000" step="1" placeholder="+10 atau -3" value={form.delta} onChange={(event) => setForm({...form, delta: event.target.value})} /><small>Gunakan angka positif untuk menambah dan negatif untuk mengurangi.</small></label>
                    <label>Alasan perubahan<input required maxLength="255" placeholder="Contoh: penerimaan supplier atau stock opname" value={form.reason} onChange={(event) => setForm({...form, reason: event.target.value})} /></label>
                  </div>
                  <section className="adm-inventory-history"><h3>Riwayat movement</h3>{movements.length ? movements.map((movement) => <div key={movement.id}><span><strong>{movement.type}</strong><small>{movement.reason}</small></span><b className={movement.quantity_delta >= 0 ? "positive" : "negative"}>{movement.quantity_delta >= 0 ? "+" : ""}{movement.quantity_delta}</b><small>{new Intl.DateTimeFormat("id-ID", {dateStyle: "medium", timeStyle: "short"}).format(new Date(movement.created_at))}</small></div>) : <p className="adm-muted-copy">Belum ada movement tercatat.</p>}</section>
                </>
              )}
              </div>

              <footer>
                {editor.mode === "edit" && Number(editor.item.on_hand) === 0 && Number(editor.item.reserved) === 0 && Number(editor.item.sold) === 0 && movements.length === 0 && <button className="adm-delete-link" type="button" onClick={destroy}>Hapus record stok</button>}
                <Button kind="secondary" type="button" onClick={close}>Batal</Button>
                <Button type="submit" disabled={saving || optionsLoading || (editor.mode === "edit" && Number(form.delta) === 0)}>{saving ? "Menyimpan…" : editor.mode === "create" ? "Daftarkan stok" : "Simpan perubahan"}</Button>
              </footer>
            </form>
          </aside>
        </div>
      )}
    </>
  );
}

export default InventoryPage;

