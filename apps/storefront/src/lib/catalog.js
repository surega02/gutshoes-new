import {googleLoginUrl} from "../api";

const backendBase = googleLoginUrl.replace(/\/api\/v1\/auth\/google$/, "");

export function catalogImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${backendBase}/storage/${String(path).replace(/^\/+/, "")}`;
}

export function mapCatalogProduct(item) {
  const variants = Array.isArray(item?.variants) ? item.variants : [];
  const mappedVariants = variants.map((variant) => ({
    id: variant.id,
    size: variant.size,
    sku: variant.sku,
    price: Number(variant.price),
    weight: variant.weight_grams,
    stock: Number(variant.available_stock) || 0,
  }));
  const prices = mappedVariants.map((variant) => variant.price).filter(Number.isFinite);
  const images = (Array.isArray(item?.images) ? item.images : [])
    .map((image) => ({
      id: image.id,
      src: catalogImageUrl(image.path),
      alt: image.alt_text || item.name,
      isPrimary: Boolean(image.is_primary),
      position: Number(image.position) || 0,
    }))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position);
  const primaryImage = images[0];

  return {
    id: item.slug,
    slug: item.slug,
    name: item.name,
    description: item.description || "",
    category: item.categories?.[0]?.name || "Sepatu",
    categories: item.categories || [],
    brand: item.brand?.name || "GutShoes",
    price: prices.length ? Math.min(...prices) : 0,
    image: primaryImage?.src || "",
    imageAlt: primaryImage?.alt || item.name,
    images,
    sizes: mappedVariants.map((variant) => variant.size),
    stock: Object.fromEntries(mappedVariants.map((variant) => [variant.size, variant.stock])),
    variants: mappedVariants,
  };
}


