import React, {useState} from "react";
import {api} from "../../api";
import AccountShell from "../../components/layout/AccountShell";
import RegionFields from "../../components/forms/RegionFields";
import Button from "../../components/ui/Button";
import Feedback from "../../components/ui/Feedback";
import Icon from "../../components/ui/Icon";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

function AddressesV2({user, addresses, setAddresses, navigate, onLogout}) {
  const blank = {
    id: null,
    label: "Rumah",
    recipient: user.name,
    phone: user.phone,
    address: "",
    city: "Jakarta Selatan",
    province: "DKI Jakarta",
    postal: "",
    isDefault: false,
  };
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [removeId, setRemoveId] = useState(null);
  const save = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (
      !data.province_code ||
      !data.regency_code ||
      !data.district_code ||
      !data.village_code
    ) {
      setNotice(
        "Pilih provinsi, kota/kabupaten, kecamatan, dan kelurahan/desa.",
      );
      return;
    }
    const payload = {
      label: data.label,
      recipient_name: data.recipient,
      phone: data.phone,
      address_line: data.address,
      province_code: data.province_code,
      regency_code: data.regency_code,
      district_code: data.district_code,
      village_code: data.village_code,
      postal_code: data.postal,
      is_default: editing?.isDefault || addresses.length === 0,
    };
    try {
      const response = editing?.id
        ? await api.updateAddress(editing.id, payload)
        : await api.createAddress(payload);
      const a = response.data,
        next = {
          id: a.id,
          label: a.label,
          recipient: a.recipient_name,
          phone: a.phone,
          address: a.address_line,
          city: a.city,
          province: a.province,
          district: a.district,
          provinceCode: a.province_code,
          regencyCode: a.regency_code,
          districtCode: a.district_code,
          villageCode: a.village_code,
          postal: a.postal_code,
          isDefault: a.is_default,
        };
      setAddresses((previous) =>
        editing?.id
          ? previous.map((x) => (x.id === editing.id ? next : x))
          : [...previous, next],
      );
      setEditing(null);
      setNotice("Alamat tersimpan di server.");
    } catch (e) {
      setNotice(e.message || "Alamat belum dapat disimpan.");
    }
  };
  const remove = async () => {
    try {
      await api.deleteAddress(removeId);
      setAddresses((previous) =>
        previous.filter((address) => address.id !== removeId),
      );
      setNotice("Alamat dihapus dari server.");
    } catch (e) {
      setNotice(e.message || "Alamat belum dapat dihapus.");
    } finally {
      setRemoveId(null);
    }
  };
  const makeDefault = async (id) => {
    const address = addresses.find((x) => x.id === id);
    if (!address) return;
    try {
      await api.updateAddress(id, {
        label: address.label,
        recipient_name: address.recipient,
        phone: address.phone,
        address_line: address.address,
        province_code: address.provinceCode,
        regency_code: address.regencyCode,
        district_code: address.districtCode,
        village_code: address.villageCode,
        postal_code: address.postal,
        is_default: true,
      });
      setAddresses((previous) =>
        previous.map((x) => ({...x, isDefault: x.id === id})),
      );
      setNotice("Alamat utama diperbarui di server.");
    } catch (e) {
      setNotice(e.message || "Alamat utama belum dapat diperbarui.");
    }
  };
  const formValue = editing || blank;
  return (
    <AccountShell
      active="addresses"
      navigate={navigate}
      user={user}
      onLogout={onLogout}
    >
      <ConfirmDialog
        open={Boolean(removeId)}
        title="Hapus alamat ini?"
        description="Alamat yang sudah tersalin ke pesanan lama tidak ikut berubah."
        confirmLabel="Hapus"
        onCancel={() => setRemoveId(null)}
        onConfirm={remove}
      />
      <div className="account-title">
        <div>
          <h2>Alamat</h2>
          <p>Simpan beberapa tujuan pengiriman dan tentukan alamat utama.</p>
        </div>
        <Button onClick={() => setEditing(blank)}>Tambah alamat</Button>
      </div>
      <Feedback type="success">{notice}</Feedback>
      {editing && (
        <form className="address-form" onSubmit={save}>
          <div className="address-form-head">
            <h3>{editing.id ? "Edit alamat" : "Alamat baru"}</h3>
            <button
              type="button"
              onClick={() => setEditing(null)}
              aria-label="Tutup formulir"
            >
              <Icon name="close" />
            </button>
          </div>
          <div className="form-grid">
            <label>
              Label alamat
              <input
                name="label"
                required
                maxLength="24"
                defaultValue={formValue.label}
              />
            </label>
            <label>
              Nama penerima
              <input
                name="recipient"
                required
                maxLength="100"
                autoComplete="name"
                defaultValue={formValue.recipient}
              />
            </label>
            <label>
              Nomor telepon
              <input
                name="phone"
                required
                inputMode="tel"
                autoComplete="tel"
                pattern="[0-9+ -]{8,20}"
                defaultValue={formValue.phone}
              />
            </label>
            <label className="span-2">
              Alamat lengkap
              <textarea
                name="address"
                required
                maxLength="300"
                autoComplete="street-address"
                defaultValue={formValue.address}
              />
            </label>
            <RegionFields initial={formValue} searchable />
          </div>
          <div className="form-actions">
            <Button
              variant="ghost"
              type="button"
              onClick={() => setEditing(null)}
            >
              Batal
            </Button>
            <Button type="submit">Simpan alamat</Button>
          </div>
        </form>
      )}
      <div className="address-list">
        {addresses.length ? (
          addresses.map((address) => (
            <article className="address-item" key={address.id}>
              <div className="address-item-head">
                <h3>{address.label}</h3>
                {address.isDefault && <span>Utama</span>}
              </div>
              <strong>
                {address.recipient} · {address.phone}
              </strong>
              <p>
                {address.address}
                <br />
                {address.city}, {address.province} {address.postal}
              </p>
              <div>
                <button
                  className="text-link"
                  onClick={() => setEditing(address)}
                >
                  Edit
                </button>
                {!address.isDefault && (
                  <button
                    className="text-link"
                    onClick={() => makeDefault(address.id)}
                  >
                    Jadikan utama
                  </button>
                )}
                <button
                  className="text-link danger-link"
                  onClick={() => setRemoveId(address.id)}
                >
                  Hapus
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty">
            <Icon name="locate" size={34} />
            <h3>Belum ada alamat tersimpan</h3>
            <p>Tambahkan alamat agar checkout berikutnya lebih cepat.</p>
            <Button onClick={() => setEditing(blank)}>
              Tambah alamat pertama
            </Button>
          </div>
        )}
      </div>
    </AccountShell>
  );
}

export default AddressesV2;
