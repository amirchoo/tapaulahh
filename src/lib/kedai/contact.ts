/**
 * "012-345 6789", "+60 12 345 6789", "60123456789" → "60123456789" (what
 * wa.me links need). Empty → null; anything else → "invalid".
 */
export function normalizeWhatsapp(input: string): string | null | "invalid" {
  let digits = input.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (digits.startsWith("0"))
    digits = `6${digits}`; // 012… → 6012…
  else if (digits.startsWith("1")) digits = `60${digits}`; // 12… → 6012…
  return /^[0-9]{10,15}$/.test(digits) ? digits : "invalid";
}

/** "@kekmakton", "instagram.com/kekmakton/", "kekmakton" → "kekmakton". */
export function normalizeInstagram(input: string): string | null | "invalid" {
  const handle = input
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
  if (!handle) return null;
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? handle : "invalid";
}

/** Opens a WhatsApp chat, with a first message filled in. */
export function whatsappUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle}`;
}

/** 60123456789 → "+60 12-345 6789" (roughly how Malaysians write it). */
export function formatWhatsapp(number: string): string {
  const m = number.match(/^60(\d{2})(\d{3,4})(\d{4})$/);
  return m ? `+60 ${m[1]}-${m[2]} ${m[3]}` : `+${number}`;
}
