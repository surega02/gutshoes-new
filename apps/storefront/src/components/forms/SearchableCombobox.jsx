import React, {useState} from "react";
import * as Popover from "@radix-ui/react-popover";
import {Command} from "cmdk";
import {Check, ChevronsUpDown, Search} from "lucide-react";

function SearchableCombobox({
  label,
  name,
  items,
  value,
  disabled,
  loading,
  onSelect,
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find((item) => item.code === value);
  const unavailable = disabled || loading;

  return (
    <label className="region-combobox-label">
      <span>{label}</span>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="region-combobox-trigger"
            role="combobox"
            aria-expanded={open}
            aria-controls={`region-options-${name}`}
            aria-label={`Pilih ${label}`}
            aria-required="true"
            disabled={unavailable}
          >
            <span className={selected ? "" : "is-placeholder"}>
              {loading
                ? "Memuat…"
                : selected?.name || `Pilih ${label.toLowerCase()}`}
            </span>
            <ChevronsUpDown size={17} aria-hidden="true" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="region-combobox-content"
            sideOffset={6}
            align="start"
            collisionPadding={12}
          >
            <Command label={`Cari ${label}`}>
              <div className="region-combobox-search">
                <Search size={16} aria-hidden="true" />
                <Command.Input
                  placeholder={`Cari ${label.toLowerCase()}…`}
                  autoFocus
                />
              </div>
              <Command.List id={`region-options-${name}`}>
                <Command.Empty>Wilayah tidak ditemukan.</Command.Empty>
                <Command.Group>
                  {items.map((item) => (
                    <Command.Item
                      key={item.code}
                      value={item.name}
                      keywords={[item.code]}
                      onSelect={() => {
                        onSelect(item);
                        setOpen(false);
                      }}
                    >
                      <Check
                        size={16}
                        className={item.code === value ? "is-selected" : ""}
                        aria-hidden="true"
                      />
                      <span>{item.name}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <input type="hidden" name={name} value={value} />
    </label>
  );
}

export default SearchableCombobox;
