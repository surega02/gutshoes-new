export const statusTone = (s) =>
  s.includes("diperlukan") || s.includes("Refund")
    ? "danger"
    : s.includes("Lunas") || s.includes("Dikirim") || s.includes("Aktif")
      ? "success"
      : s.includes("Menunggu")
        ? "warning"
        : "info";
export const serverList = (data) => (Array.isArray(data) ? data : data?.data || []);
export function productDraft(product) {
  return product
    ? {
        ...product,
        brand_id: String(product.brand_id || product.brand?.id || ""),
        category_ids: (product.categories || []).map((item) => Number(item.id)),
        variants: (product.variants || []).map((variant) => ({
          id: variant.id,
          size_id: String(variant.size_id || variant.size?.id || ""),
          sku: variant.sku,
          price: String(variant.price),
          weight_grams: String(variant.weight_grams),
          is_active: Boolean(variant.is_active),
        })),
      }
    : {
        id: null,
        name: "",
        slug: "",
        brand_id: "",
        description: "",
        status: "DRAFT",
        category_ids: [],
        variants: [
          {
            size_id: "",
            sku: "",
            price: "",
            weight_grams: "900",
            is_active: true,
          },
        ],
        images: [],
      };
}
export const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const apiErrorMessage = (error, fallback) =>
  Object.values(error?.errors || {}).flat()[0] || error?.message || fallback;
