import React, {useState} from "react";
import {api} from "../../api";
import Button from "./Button";

export default function WarehouseForm({warehouse, reload}) {
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await api.updateAdminWarehouse(values);
      setNotice("Alamat asal pengiriman tersimpan.");
      reload();
    } catch (error) {
      setNotice(error.message || "Alamat gudang gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };
  return <form className="adm-settings" onSubmit={submit}>
    <section className="adm-card">
      <h2>Asal pengiriman</h2>
      <p>Data ini dipakai untuk tarif dan pemrosesan logistik.</p>
      <div className="adm-form-grid">
        {["name","phone","address_line","district","city","province","postal_code","provider_area_id"].map((key) =>
          <label key={key}>{key.replaceAll("_", " ")}<input name={key} defaultValue={warehouse[key] || ""} required={key !== "phone"} /></label>
        )}
      </div>
    </section>
    <div className="adm-sticky-save"><span role="status">{notice}</span><Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan asal pengiriman"}</Button></div>
  </form>;
}
