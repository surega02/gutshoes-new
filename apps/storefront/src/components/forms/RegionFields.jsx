import React, {useEffect, useState} from "react";
import {api} from "../../api";
import SearchableCombobox from "./SearchableCombobox";

function RegionFields({initial = {}, searchable = false}) {
  const [lists, setLists] = useState({
      provinces: [],
      regencies: [],
      districts: [],
      villages: [],
    }),
    [value, setValue] = useState({
      provinceCode: initial.provinceCode || "",
      regencyCode: initial.regencyCode || "",
      districtCode: initial.districtCode || "",
      villageCode: initial.villageCode || "",
    }),
    [loading, setLoading] = useState("provinces"),
    [error, setError] = useState("");
  const load = async (key, fn) => {
    setLoading(key);
    setError("");
    try {
      const r = await fn();
      setLists((p) => ({...p, [key]: r.data}));
    } catch (e) {
      setError(e.message || "Master wilayah gagal dimuat.");
    } finally {
      setLoading("");
    }
  };
  useEffect(() => {
    load("provinces", api.provinces);
  }, []);
  useEffect(() => {
    if (value.provinceCode)
      load("regencies", () => api.regencies(value.provinceCode));
  }, [value.provinceCode]);
  useEffect(() => {
    if (value.regencyCode)
      load("districts", () => api.districts(value.regencyCode));
  }, [value.regencyCode]);
  useEffect(() => {
    if (value.districtCode)
      load("villages", () => api.villages(value.districtCode));
  }, [value.districtCode]);
  const choose = (key, code, resets) =>
      setValue((p) => ({
        ...p,
        [key]: code,
        ...Object.fromEntries(resets.map((x) => [x, ""])),
      })),
    village = lists.villages.find((x) => x.code === value.villageCode);
  const field = (label, name, key, items, disabled, resets) => {
    if (searchable)
      return (
        <SearchableCombobox
          label={label}
          name={name}
          items={items}
          value={value[key]}
          disabled={disabled}
          loading={loading === key}
          onSelect={(item) => choose(key, item.code, resets)}
        />
      );
    return (
      <label>
        {label}
        <select
          name={name}
          required
          value={value[key]}
          disabled={disabled || loading === key}
          onChange={(e) => choose(key, e.target.value, resets)}
        >
          <option value="">
            {loading === key ? "Memuat…" : `Pilih ${label.toLowerCase()}`}
          </option>
          {items.map((x) => (
            <option key={x.code} value={x.code}>
              {x.name}
            </option>
          ))}
        </select>
      </label>
    );
  };
  return (
    <>
      {field(
        "Provinsi",
        "province_code",
        "provinceCode",
        lists.provinces,
        false,
        ["regencyCode", "districtCode", "villageCode"],
      )}
      {field(
        "Kota/Kabupaten",
        "regency_code",
        "regencyCode",
        lists.regencies,
        !value.provinceCode,
        ["districtCode", "villageCode"],
      )}
      {field(
        "Kecamatan",
        "district_code",
        "districtCode",
        lists.districts,
        !value.regencyCode,
        ["villageCode"],
      )}
      {field(
        "Kelurahan/Desa",
        "village_code",
        "villageCode",
        lists.villages,
        !value.districtCode,
        [],
      )}
      <label>
        Kode pos
        <input
          name="postal"
          required
          readOnly
          value={village?.postal_code || initial.postal || ""}
        />
      </label>
      {error && (
        <p className="region-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

export default RegionFields;
