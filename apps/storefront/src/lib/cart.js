import {catalogImageUrl} from "./catalog";

export const cartKey = (item) =>
  String(item.backendItemId || `${item.product.id}-${item.size}`);

export const mapServerCart = (payload) =>
  (payload?.items || []).map((item) => {
    const variant = item.variant || {};
    const raw = variant.product || {};
    const size = variant.size?.label || variant.size?.value || "—";
    const available = (variant.inventories || []).reduce(
      (sum, row) => sum + Math.max(0, Number(row.on_hand) - Number(row.reserved)),
      0,
    );
    const image = raw.images?.find((entry) => entry.is_primary) || raw.images?.[0];
    const product = {
      id: raw.slug || raw.id || `server-${variant.product_id}`,
      slug: raw.slug,
      name: raw.name || variant.sku || "Produk GutShoes",
      brand: raw.brand?.name || "GutShoes",
      category: raw.categories?.[0]?.name || "Sepatu",
      image: catalogImageUrl(image?.path),
      variants: [],
      price: Number(variant.price || 0),
      stock: {[size]: Math.max(available, Number(item.quantity))},
    };
    return {
      product,
      size,
      qty: Number(item.quantity),
      backendItemId: item.id,
    };
  });
