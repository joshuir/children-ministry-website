"use client";

import { useEffect, useState } from "react";

/**
 * Cookie consent (UK GDPR / PECR, Ghana Data Protection Act 2012).
 *
 * Essential storage needs no consent and is always on: the content-manager login cookie, and
 * on-device preferences such as Bible game progress, your comment name and reactions.
 *
 * Optional categories, off until the visitor agrees:
 *  - media: embedded content from other sites that may set their own cookies — Google Maps,
 *           YouTube videos, and Facebook / Instagram / TikTok posts.
 *
 * The site uses no analytics or advertising cookies. If any are added later, add a category here.
 */
export type ConsentCategory = "media";
export interface Consent { v: 1; decided: boolean; at: string; media: boolean }

const KEY = "cm-consent";
const EVENT = "cm:consent";
export const CONSENT_VERSION = 1;
const undecided: Consent = { v: 1, decided: false, at: "", media: false };

export function readConsent(): Consent {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && raw.v === CONSENT_VERSION) return { ...undecided, ...raw };
  } catch { /* blocked storage: treat as undecided */ }
  return undecided;
}

export function saveConsent(c: Omit<Consent, "v" | "at" | "decided">) {
  const next: Consent = { v: 1, decided: true, at: new Date().toISOString(), ...c };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* choice lasts this visit */ }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  return next;
}

/** Re-opens the preferences panel (used by the footer "Cookie settings" link). */
export const openConsentSettings = () => window.dispatchEvent(new Event("cm:consent-open"));

/** Current consent, updating live when the visitor changes their choice. `null` until mounted. */
export function useConsent(): Consent | null {
  const [c, setC] = useState<Consent | null>(null);
  useEffect(() => {
    setC(readConsent());
    const on = (e: Event) => setC((e as CustomEvent<Consent>).detail);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return c;
}
