const guestOrdersKey = "gutshoes-guest-orders";
export const validGuestReference = (item) =>
  typeof item?.number === "string" &&
  typeof item?.accessToken === "string" &&
  item.accessToken.length >= 32;
export const sanitizeGuestReference = (item) => ({
  number: item.number,
  accessToken: item.accessToken,
  total: Number.isFinite(Number(item.total)) ? Number(item.total) : undefined,
  createdAt: item.createdAt,
  status: item.status,
  paymentStatus: item.paymentStatus,
  canPay: item.canPay,
  expiresAt: item.expiresAt,
});
const readGuestOrders = () => {
  try {
    const value = JSON.parse(localStorage.getItem(guestOrdersKey) || "[]");
    return Array.isArray(value)
      ? value
          .filter(validGuestReference)
          .slice(0, 10)
          .map(sanitizeGuestReference)
      : [];
  } catch {
    return [];
  }
};
export const writeGuestOrders = (items) => {
  try {
    localStorage.setItem(
      guestOrdersKey,
      JSON.stringify(
        items
          .filter(validGuestReference)
          .slice(0, 10)
          .map(sanitizeGuestReference),
      ),
    );
  } catch {
    /* Browser may block storage. */
  }
};
const consumeGuestRecoveryLink = () => {
  const url = new URL(window.location.href);
  const reference = {
    number: url.searchParams.get("guest_order") || "",
    accessToken: url.searchParams.get("token") || "",
    createdAt: new Date().toISOString(),
  };
  if (!validGuestReference(reference)) return null;
  url.searchParams.delete("guest_order");
  url.searchParams.delete("token");
  window.history.replaceState(
    null,
    "",
    url.pathname + url.search + (url.hash || "#tracking"),
  );
  return reference;
};
export const recoveryReference = consumeGuestRecoveryLink();
export const initialGuestOrders = (() => {
  const stored = readGuestOrders();
  if (!recoveryReference) return stored;
  const next = [
    recoveryReference,
    ...stored.filter((item) => item.number !== recoveryReference.number),
  ].slice(0, 10);
  writeGuestOrders(next);
  return next;
})();
