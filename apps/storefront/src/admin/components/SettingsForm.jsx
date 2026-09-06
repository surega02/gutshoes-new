import React, {useState} from "react";
import {api} from "../../api";
import Button from "./Button";

function SettingsForm({items, reload}) {
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      await Promise.all(
        items.map((item) =>
          api.updateConfiguration(item.key, {
            value: form.get(item.key),
            is_public: Boolean(item.is_public),
          }),
        ),
      );
      setNotice("Pengaturan tersimpan di server.");
      reload();
    } catch (error) {
      setNotice(error.message || "Pengaturan gagal disimpan.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <form className="adm-settings" onSubmit={submit}>
      <section className="adm-card">
        <h2>Konfigurasi operasional</h2>
        <p>Nilai berikut dibaca dan disimpan langsung ke database.</p>
        <div className="adm-form-grid">
          {items.map((item) => (
            <label key={item.key}>
              {item.key.replaceAll("_", " ")}
              <input
                name={item.key}
                defaultValue={String(item.value ?? "")}
                required
              />
            </label>
          ))}
        </div>
      </section>
      <div className="adm-sticky-save">
        <span role="status">{notice}</span>
        <Button type="submit" disabled={saving} aria-busy={saving}>
          {saving ? "Menyimpan…" : "Simpan pengaturan"}
        </Button>
      </div>
    </form>
  );
}

export default SettingsForm;
