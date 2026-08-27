export type PayloadType =
  | "url"
  | "wifi"
  | "vcard"
  | "whatsapp"
  | "sms"
  | "email"
  | "phone"
  | "text"
  | "crypto"
  | "event";

export interface WifiPayload {
  ssid: string;
  password?: string;
  authType: "WPA" | "WEP" | "nopass";
  hidden?: boolean;
}

export interface VCardPayload {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  company?: string;
  title?: string;
  url?: string;
  address?: string;
}

export interface WhatsAppPayload {
  phone: string;
  message?: string;
}

export interface SmsPayload {
  phone: string;
  message?: string;
}

export interface EmailPayload {
  email: string;
  subject?: string;
  body?: string;
}

export interface CryptoPayload {
  coin: "bitcoin" | "ethereum" | "solana";
  address: string;
  amount?: string;
}

export interface EventPayload {
  title: string;
  location?: string;
  startDateTime?: string;
  endDateTime?: string;
  description?: string;
}

export function formatUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "https://xzyqrn.com";
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function formatWifi(data: WifiPayload): string {
  const ssid = (data.ssid || "").replace(/([\\;,:"])/g, "\\$1");
  const pass = (data.password || "").replace(/([\\;,:"])/g, "\\$1");
  const auth = data.authType || "WPA";
  const hidden = data.hidden ? "H:true;" : "";
  if (auth === "nopass") {
    return `WIFI:S:${ssid};T:nopass;${hidden};`;
  }
  return `WIFI:S:${ssid};T:${auth};P:${pass};${hidden};`;
}

export function formatVCard(data: VCardPayload): string {
  const lines: string[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${data.lastName || ""};${data.firstName || ""};;;`,
    `FN:${[data.firstName, data.lastName].filter(Boolean).join(" ")}`,
  ];
  if (data.company) lines.push(`ORG:${data.company}`);
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.phone) lines.push(`TEL;TYPE=CELL:${data.phone}`);
  if (data.email) lines.push(`EMAIL;TYPE=INTERNET:${data.email}`);
  if (data.url) lines.push(`URL:${formatUrl(data.url)}`);
  if (data.address) lines.push(`ADR;TYPE=WORK:;;${data.address};;;;`);
  lines.push("END:VCARD");
  return lines.join("\n");
}

export function formatWhatsApp(data: WhatsAppPayload): string {
  const cleanPhone = (data.phone || "").replace(/[^0-9]/g, "");
  const text = encodeURIComponent(data.message || "");
  if (!cleanPhone && !text) return "https://wa.me";
  if (!text) return `https://wa.me/${cleanPhone}`;
  return `https://wa.me/${cleanPhone}?text=${text}`;
}

export function formatSms(data: SmsPayload): string {
  const cleanPhone = (data.phone || "").trim();
  const body = encodeURIComponent(data.message || "");
  if (!body) return `sms:${cleanPhone}`;
  return `sms:${cleanPhone}?body=${body}`;
}

export function formatEmail(data: EmailPayload): string {
  const email = (data.email || "").trim();
  const params: string[] = [];
  if (data.subject) params.push(`subject=${encodeURIComponent(data.subject)}`);
  if (data.body) params.push(`body=${encodeURIComponent(data.body)}`);
  const query = params.length ? `?${params.join("&")}` : "";
  return `mailto:${email}${query}`;
}

export function formatPhone(phone: string): string {
  return `tel:${phone.trim()}`;
}

export function formatCrypto(data: CryptoPayload): string {
  const address = (data.address || "").trim();
  const amount = data.amount ? encodeURIComponent(data.amount) : "";
  if (data.coin === "bitcoin") {
    return amount ? `bitcoin:${address}?amount=${amount}` : `bitcoin:${address}`;
  }
  if (data.coin === "ethereum") {
    return amount ? `ethereum:${address}?value=${amount}` : `ethereum:${address}`;
  }
  return `solana:${address}`;
}

export function formatEvent(data: EventPayload): string {
  const formatUtc = (dtStr?: string) => {
    if (!dtStr) return "";
    const d = new Date(dtStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };
  const start = formatUtc(data.startDateTime);
  const end = formatUtc(data.endDateTime);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${data.title || "Event"}`,
  ];
  if (start) lines.push(`DTSTART:${start}`);
  if (end) lines.push(`DTEND:${end}`);
  if (data.location) lines.push(`LOCATION:${data.location}`);
  if (data.description) lines.push(`DESCRIPTION:${data.description}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\n");
}

export function parseWifi(raw: string): WifiPayload | null {
  if (!raw.toUpperCase().startsWith("WIFI:")) return null;
  const body = raw.slice(5).replace(/;;\s*$/, "");
  const fields: Record<string, string> = {};
  let i = 0;
  while (i < body.length) {
    const keyMatch = body.slice(i).match(/^([A-Za-z]):/);
    if (!keyMatch) {
      i += 1;
      continue;
    }
    i += keyMatch[0].length;
    let val = "";
    while (i < body.length) {
      const c = body[i];
      if (c === "\\") {
        val += body[i + 1] ?? "";
        i += 2;
        continue;
      }
      if (c === ";") {
        i += 1;
        break;
      }
      val += c;
      i += 1;
    }
    fields[keyMatch[1].toUpperCase()] = val;
  }
  const auth = fields.T === "WEP" || fields.T === "nopass" ? fields.T : "WPA";
  return {
    ssid: fields.S || "",
    password: fields.P,
    authType: auth,
    hidden: /^true$/i.test(fields.H || ""),
  };
}

export function parseVCard(raw: string): VCardPayload | null {
  if (!/BEGIN:VCARD/i.test(raw)) return null;
  const get = (key: string) => {
    const re = new RegExp(`^${key}(?:;[^:]*)?:(.*)$`, "im");
    return raw.match(re)?.[1]?.trim() ?? "";
  };
  const n = get("N").split(";");
  const fn = get("FN");
  const first = n[1] || fn.split(/\s+/)[0] || "";
  const last = n[0] || fn.split(/\s+/).slice(1).join(" ") || "";
  const adr = get("ADR")
    .split(";")
    .filter(Boolean)
    .join(", ");
  return {
    firstName: first,
    lastName: last,
    phone: get("TEL"),
    email: get("EMAIL"),
    company: get("ORG"),
    title: get("TITLE"),
    url: get("URL"),
    address: adr,
  };
}

export function parseWhatsApp(raw: string): WhatsAppPayload | null {
  try {
    const url = new URL(raw);
    if (!/(^|\.)wa\.me$/i.test(url.hostname) && !/whatsapp/i.test(url.hostname)) {
      return null;
    }
    const phone = url.pathname.replace(/^\//, "");
    return { phone, message: url.searchParams.get("text") || "" };
  } catch {
    return null;
  }
}

export function parseSms(raw: string): SmsPayload | null {
  if (!/^sms:/i.test(raw)) return null;
  const without = raw.replace(/^sms:/i, "");
  const [phonePart, query = ""] = without.split("?");
  const params = new URLSearchParams(query);
  return {
    phone: decodeURIComponent(phonePart || ""),
    message: params.get("body") || params.get("sms_body") || "",
  };
}

export function parseEmail(raw: string): EmailPayload | null {
  if (!/^mailto:/i.test(raw)) return null;
  const without = raw.replace(/^mailto:/i, "");
  const [emailPart, query = ""] = without.split("?");
  const params = new URLSearchParams(query);
  return {
    email: decodeURIComponent(emailPart || ""),
    subject: params.get("subject") || "",
    body: params.get("body") || "",
  };
}

export function parseCrypto(raw: string): CryptoPayload | null {
  const m = raw.match(/^(bitcoin|ethereum|solana):([^?]+)(?:\?(.*))?/i);
  if (!m) return null;
  const coin = m[1].toLowerCase() as CryptoPayload["coin"];
  const params = new URLSearchParams(m[3] || "");
  return {
    coin,
    address: m[2],
    amount: params.get("amount") || params.get("value") || "",
  };
}

export function parseEvent(raw: string): EventPayload | null {
  if (!/BEGIN:VEVENT/i.test(raw)) return null;
  const get = (key: string) => {
    const re = new RegExp(`^${key}(?:;[^:]*)?:(.*)$`, "im");
    return raw.match(re)?.[1]?.trim() ?? "";
  };
  const fromUtc = (value: string) => {
    if (!value) return "";
    const compact = value.replace(/Z$/i, "");
    const m = compact.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
    if (!m) return "";
    return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
  };
  return {
    title: get("SUMMARY"),
    location: get("LOCATION"),
    startDateTime: fromUtc(get("DTSTART")),
    endDateTime: fromUtc(get("DTEND")),
    description: get("DESCRIPTION"),
  };
}

export function detectPayloadType(raw: string): PayloadType {
  const t = raw.trim();
  if (/^WIFI:/i.test(t)) return "wifi";
  if (/BEGIN:VCARD/i.test(t)) return "vcard";
  if (/BEGIN:VCALENDAR|BEGIN:VEVENT/i.test(t)) return "event";
  if (/^sms:/i.test(t)) return "sms";
  if (/^mailto:/i.test(t)) return "email";
  if (/^tel:/i.test(t)) return "phone";
  if (/^(bitcoin|ethereum|solana):/i.test(t)) return "crypto";
  if (/wa\.me|whatsapp/i.test(t)) return "whatsapp";
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(t) || /^[\w.-]+\.[a-z]{2,}/i.test(t)) return "url";
  return "text";
}
