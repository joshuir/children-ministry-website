"use client";

import type { ReactNode } from "react";
import { useConsent } from "@/lib/consent";
import { ConsentPlaceholder } from "./CookieConsent";

/** Renders third-party content only once the visitor allows maps, videos and social posts. */
export function ConsentGate({ children, label, href, className }: { children: ReactNode; label: string; href?: string; className?: string }) {
  const c = useConsent();
  if (c === null) return <div className={className} aria-hidden />; // before mount: render nothing third-party
  return c.media ? <>{children}</> : <ConsentPlaceholder label={label} href={href} className={className} />;
}
