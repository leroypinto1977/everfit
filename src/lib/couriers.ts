/** Supported couriers and their public tracking-URL templates. */

export const COURIERS = [
  { key: "delhivery", name: "Delhivery", url: "https://www.delhivery.com/track-v2/package/{t}" },
  { key: "bluedart", name: "Blue Dart", url: "https://www.bluedart.com/trackdartresultthirdparty?trackFor=0&trackNo={t}" },
  { key: "dtdc", name: "DTDC", url: "https://www.dtdc.in/trace.asp?strCnno={t}" },
  { key: "indiapost", name: "India Post", url: "https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx" },
  { key: "ekart", name: "Ekart", url: "https://ekartlogistics.com/shipmenttrack/{t}" },
  { key: "other", name: "Other", url: "" },
] as const;

export function courierName(key: string | undefined) {
  return COURIERS.find((c) => c.key === key)?.name ?? key ?? "";
}

/** Public tracking link for a shipment, or null if we can't build one. */
export function trackingUrl(courier: string | undefined, tracking: string | undefined) {
  if (!tracking) return null;
  const c = COURIERS.find((c) => c.key === courier);
  if (!c?.url) return null;
  return c.url.replace("{t}", encodeURIComponent(tracking));
}
