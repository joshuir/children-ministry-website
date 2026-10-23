import type { HomeContent, SiteSettings } from "@/lib/types";

/**
 * Central site settings. Everything an administrator might change —
 * contact details, social accounts, app links and the QR destination —
 * lives here (or in the `site_settings` table once Supabase is connected).
 * Replace the placeholder values below with the church's real details.
 */
export const site: SiteSettings = {
  name: "Presbyterian Children's Ministry",
  shortName: "Children's Ministry",
  church: "Presbyterian Church, Accra",
  tagline: "Helping children know, love and live God's Word",
  description:
    "The children's ministry of Presbyterian Church, Accra — Bible-centred Sunday classes for ages 3 to 13, led by trained, safeguarding-checked teachers.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pcm-kids.example.org",
  serviceTimes: [
    { label: "Sunday Children's Service", time: "9:00 – 10:45 am" },
    { label: "Midweek Bible Club", time: "Wed 5:30 – 6:30 pm" },
  ],
  contact: {
    phone: "+233 30 000 0000",
    whatsapp: "233200000000",
    email: "children@pcm-kids.example.org",
    address: ["Presbyterian Church, Accra", "12 Ring Road Central", "Accra, Ghana"],
    mapQuery: "Ring Road Central, Accra, Ghana",
    mapZoom: 15,
  },
  socials: [
    { platform: "facebook", label: "Facebook", url: "https://facebook.com/", handle: "@pcm.kids" },
    { platform: "instagram", label: "Instagram", url: "https://instagram.com/", handle: "@pcm.kids" },
    { platform: "youtube", label: "YouTube", url: "https://youtube.com/", handle: "Children's Ministry TV" },
    { platform: "tiktok", label: "TikTok", url: "https://tiktok.com/", handle: "@pcm.kids" },
    { platform: "x", label: "X", url: "https://x.com/", handle: "@pcm.kids" },
    { platform: "whatsapp", label: "WhatsApp", url: "https://wa.me/233200000000", handle: "Parents' channel" },
  ],
  app: {
    name: "Children's Ministry App",
    blurb:
      "This week's lesson, memory-verse audio and event reminders. No ads.",
    playStoreUrl: "https://play.google.com/store",
    appStoreUrl: "https://apps.apple.com/",
    qrUrl: "https://pcm-kids.example.org/app",
  },
  cta: { label: "Join Our Service", href: "/contact#visit" },
};

export const home: HomeContent = {
  hero: {
    eyebrow: "Sundays · 9:00 am · Ages 3–13",
    headline: "Helping Children",
    rotate: ["Know", "Love", "Live"],
    highlight: "God's Word",
    body:
      "Bible stories, songs and prayer in age-based classes — safe, joyful and led by trained teachers.",
    image: { alt: "Children sitting in a circle reading an open Bible together", scene: "bible", tone: "blue" },
  },
  welcome: {
    title: "You're so welcome here",
    body:
      "Whether your child is three or thirteen, there's a seat with their name on it. Come early on your first Sunday — we'd love to say hello.",
    signature: "Deaconess Abena Owusu",
    role: "Children's Ministry Director",
  },
  about: {
    title: "What happens on a Sunday?",
    body:
      "Worship together, then age-based classes on the same Bible passage — so families can talk about it over lunch.",
    points: [
      { title: "Worship together", body: "Songs, actions and prayer to open the morning." },
      { title: "Learn the Word", body: "An age-appropriate Bible lesson with a memory verse." },
      { title: "Make & play", body: "Crafts, games and activities that help it stick." },
      { title: "Safe hand-over", body: "Secure check-in and check-out for every child." },
    ],
    image: { alt: "Children singing with their hands raised in worship", scene: "worship", tone: "sun" },
  },
  stats: [
    { value: "9", label: "age-based classes" },
    { value: "24", label: "trained teachers" },
    { value: "180+", label: "children each Sunday" },
    { value: "2006", label: "serving families since" },
  ],
};
