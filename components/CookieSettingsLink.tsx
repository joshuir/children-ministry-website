"use client";

import { openConsentSettings } from "@/lib/consent";

export function CookieSettingsLink() {
  return <button type="button" onClick={openConsentSettings} className="link-draw inline-flex min-h-[36px] items-center text-white/60 hover:text-white">Cookie settings</button>;
}
