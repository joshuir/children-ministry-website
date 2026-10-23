import type { PagesContent, Typography } from "@/lib/types";

/** Every headline and short line of copy on the site — all editable in the CMS under "Page text". */
export const pages: PagesContent = {
  heroes: {
    about: { eyebrow: "About us", title: "Small hands, big faith.", highlight: "big faith.", body: "Helping children in Accra discover the Bible since 2006.", media: { alt: "Children worshipping together", scene: "worship", tone: "blue" }, stickers: ["Love", "Faith", "Joy", "Since 2006"] },
    classes: { eyebrow: "Classes", title: "Find your child's class", highlight: "class", body: "Ages 3 to 13, grouped so every lesson fits.", media: { alt: "Children reading the Bible", scene: "bible", tone: "blue" }, stickers: ["Beginners", "Primary", "Juniors", "Seniors"] },
    events: { eyebrow: "Events", title: "What's on this season", highlight: "this season", body: "Tap a date. Add it to your calendar in one tap.", media: { alt: "Children's harvest celebration", scene: "harvest", tone: "sun" }, stickers: ["Harvest", "Camp", "Parents' Day", "Christmas"] },
    blog: { eyebrow: "Feed", title: "What's happening this week", highlight: "this week", body: "Photos, verses and news from our teachers.", media: { alt: "Children singing", scene: "music", tone: "coral" }, stickers: ["Verses", "Photos", "News"] },
    gallery: { eyebrow: "Gallery", title: "Moments of joy", highlight: "joy", body: "Group photos only — always shared with parental consent.", media: { alt: "Children at camp", scene: "camping", tone: "sun" }, stickers: ["Harvest", "Hosanna", "Camp", "Graduation"] },
    contact: { eyebrow: "Contact", title: "We'd love to meet you", highlight: "meet you", body: "A real person from our team will reply.", media: { alt: "Parents and children", scene: "parents", tone: "blue" }, stickers: ["Call", "WhatsApp", "Visit"] },
  },
  sections: {
    "home.about": { eyebrow: "Our children's service" },
    "home.classes": { eyebrow: "Classes", title: "A class for every age", body: "Four groups. Nine classes. One Bible story each week." },
    "home.events": { eyebrow: "Coming up", title: "Upcoming activities", body: "Tap a date to see what's on." },
    "home.lesson": { eyebrow: "Featured Bible lesson", title: "", body: "Every class explores this passage on Sunday. Keep the conversation going at home." },
    "home.posts": { eyebrow: "From the feed", title: "Latest from our classrooms" },
    "home.gallery": { eyebrow: "Gallery", title: "Moments worth remembering" },
    "home.teachers": { eyebrow: "Our teachers", title: "Caring people, trained and checked", body: "Every child known by name." },
    "home.app": { eyebrow: "Mobile app", title: "Sunday's lesson, all week long" },
    "home.social": { eyebrow: "Follow our journey", title: "Find us everywhere you are" },
    "about.teachers": { eyebrow: "Our team", title: "Meet the team behind every Sunday", body: "Trained, background-checked and known by name." },
    "about.history": { eyebrow: "Our history", title: "Twenty years of growing faith" },
    "classes.intro": { title: "Choose a group", body: "Not sure where your child fits? Our welcome team will help." },
    "blog.social": { title: "From our social channels", body: "The latest from our YouTube, Instagram, TikTok and Facebook." },
    "contact.cards": { title: "Reach us" },
    "contact.form": { title: "Send us a message", body: "We reply within two working days." },
    "contact.visit": { title: "Service times", body: "First visit? Arrive 15 minutes early." },
    "contact.social": { title: "Find us on social", body: "Videos, photos and reminders." },
    "contact.map": { title: "Find us" },
    "contact.app": { title: "Scan to download", body: "Point your phone camera at the code." },
    "footer.visit": { eyebrow: "Visit us", title: "Come as you are this Sunday." },
    "home.faq": { eyebrow: "FAQs", title: "Questions parents ask", body: "Still wondering about something? Send us a message — a real person will reply." },
    "contact.faq": { title: "Before you visit", body: "Quick answers to the questions we hear most." },
  },
  loader: { enabled: true, words: ["Helping Children", "Love", "Trust", "Live", "Appear with God"], tagline: "Children's Ministry", everyVisit: false },
  newsletter: { title: "Family updates, once a month", body: "Lessons, events and prayer points — straight to your inbox.", thanks: "Watch your inbox for the next family update.", button: "Subscribe" },
};

export const typography: Typography = {
  displayFont: "Bricolage Grotesque",
  bodyFont: "Nunito Sans",
  baseSize: 18,
  bodyWeight: 500,
  headingWeight: 800,
  headingScale: 1,
  headingCase: "none",
  letterSpacing: -0.02,
};

/** Fonts the CMS offers. The first two are bundled; the rest load from Google Fonts when chosen. */
export const FONT_CHOICES = [
  "Bricolage Grotesque", "Nunito Sans", "Baloo 2", "Fredoka", "Poppins", "Montserrat", "Inter", "Lexend",
  "Outfit", "Sora", "DM Sans", "Quicksand", "Plus Jakarta Sans", "Archivo", "Manrope", "Raleway",
];
export const BUNDLED_FONTS = new Set(["Bricolage Grotesque", "Nunito Sans"]);
