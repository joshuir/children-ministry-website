// Shared content types. These mirror the Supabase tables in supabase/schema.sql,
// so the seed content in /content and the database are interchangeable.

/** Artwork keys for the built-in illustrated scenes (used until real photos are uploaded). */
export type SceneKey =
  | "worship" | "bible" | "harvest" | "parents" | "graduation" | "hosanna"
  | "evangelism" | "excursion" | "camping" | "craft" | "prayer" | "music" | "app" | "sunrise";

/** Any image slot: a real uploaded photo wins; otherwise the illustrated scene is drawn. */
export interface Media {
  src?: string;          // uploaded photo/video URL (Supabase Storage)
  alt: string;
  scene?: SceneKey;      // fallback illustration
  tone?: Tone;
}

export type Tone = "blue" | "sun" | "coral" | "mint" | "lilac" | "ink";

export interface SocialLink {
  platform: "facebook" | "instagram" | "youtube" | "tiktok" | "x" | "whatsapp";
  label: string;
  url: string;
  handle: string;
}

export interface SiteSettings {
  name: string;
  shortName: string;
  church: string;
  tagline: string;
  description: string;
  url: string;
  serviceTimes: { label: string; time: string }[];
  contact: {
    phone: string;
    whatsapp: string;          // digits only, international format
    email: string;
    address: string[];
    mapQuery: string;          // used for embed + directions
    mapZoom?: number;
    /** Optional: paste a Google Maps "Embed a map" link or the whole <iframe> code. */
    mapEmbed?: string;
    mapLabel?: string;
    hours?: string;
  };
  socials: SocialLink[];
  app: {
    name: string;
    blurb: string;
    playStoreUrl: string;
    appStoreUrl: string;
    /** Where the QR code points. A smart link that redirects per-device is ideal. */
    qrUrl: string;
    /** Optional uploaded QR image — used instead of the generated code. */
    qrImage?: string;
    qrCaption?: string;
  };
  cta: { label: string; href: string };
}

export interface HomeContent {
  hero: { eyebrow: string; headline: string; highlight: string; body: string; image: Media; /** Words typed in and out one after another between the headline and the highlight. */ rotate?: string[] };
  welcome: { title: string; body: string; signature: string; role: string };
  about: { title: string; body: string; points: { title: string; body: string }[]; image: Media };
  stats: { value: string; label: string }[];
}

export interface Teacher {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo?: string;
  tone: Tone;
  classIds: string[];
  email?: string;
  /** Year they started serving, e.g. "2014". */
  since?: string;
  favouriteVerse?: { text: string; reference: string };
  funFact?: string;
  /** Show as the highlighted leader on the About page. */
  featured?: boolean;
  /** Safeguarding training + background check complete. */
  checked?: boolean;
  /** Short credential lines shown under the portrait, e.g. "B.Ed, University of Cape Coast". */
  credentials?: string[];
}

export type ClassGroup = "beginners" | "primary" | "juniors" | "seniors";

export interface GroupInfo {
  id: ClassGroup;
  name: string;
  ages: string;
  blurb: string;
  tone: Tone;
  scene: SceneKey;
}

export interface ClassInfo {
  id: string;            // slug, e.g. "primary-2"
  name: string;
  group: ClassGroup;
  ages: string;
  room: string;
  teacherIds: string[];
  description: string;
}

export interface Resource { label: string; type: "pdf" | "image" | "audio" | "video"; url: string; size?: string }

export interface BibleLesson {
  id: string;            // slug
  classId: string;
  date: string;          // ISO date the lesson is taught
  title: string;
  reference: string;
  memoryVerse: { text: string; reference: string };
  topic: string;
  objective: string;
  story: string[];       // paragraphs
  questions: string[];
  activity: { title: string; steps: string[] };
  prayer: string;
  resources: Resource[];
  /** A picture or video that goes with the lesson. */
  media?: Media;
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  time: string;
  location: string;
  summary: string;
  tone: Tone;
  scene: SceneKey;
  category?: "service" | "special" | "family" | "outreach" | "camp" | "training";
  image?: Media;
  rsvpUrl?: string;
}

export interface HistoryItem { year: string; title: string; body: string; image: Media }

export type Reaction = "love" | "laugh" | "wow" | "pray" | "like";

export interface PostComment {
  id: string;
  author: string;
  authorRole?: "teacher" | "admin" | "parent";
  body: string;
  createdAt: string;
  likes: number;
  replies?: PostComment[];
}

export interface Post {
  id: string;
  kind: "image" | "video" | "text" | "verse" | "announcement" | "event" | "article";
  /** Articles only: the headline. The body holds the full text, with blank lines between paragraphs. */
  title?: string;
  authorId: string;      // teachers only — children never post
  createdAt: string;
  body: string;
  media?: Media & { poster?: string; duration?: string };
  verse?: { text: string; reference: string };
  event?: { title: string; date: string; time: string; location: string };
  reactions: Record<Reaction, number>;
  comments: PostComment[];
  pinned?: boolean;
  status?: "published" | "draft";
}

/** A post from the ministry's own social accounts, embedded on the blog. */
export interface SocialEmbed {
  id: string;
  platform: "youtube" | "instagram" | "tiktok" | "facebook" | "x" | "link";
  url: string;
  caption: string;
  date: string;
}

export interface AboutContent {
  history: HistoryItem[];
  /** Downloadable history document (PDF, Word…). */
  historyDoc?: { label: string; url: string; note?: string };
  vision: { title: string; statement: string };
  mission: { title: string; intro: string; pillars: { title: string; body: string }[] };
}

export type GalleryCategory =
  | "children-harvest" | "parents-day" | "graduation" | "hosanna" | "evangelism" | "excursion" | "camping";

export interface GalleryItem {
  id: string;
  category: GalleryCategory;
  type: "image" | "video";
  event: string;
  caption: string;
  date: string;
  media: Media;
  aspect: "tall" | "wide" | "square";
}

/* ---------------- Editable page text & typography ---------------- */

export type PageKey = "about" | "classes" | "events" | "blog" | "gallery" | "contact";

export interface PageHeroContent {
  eyebrow: string;
  title: string;
  /** Words from the title shown in colour. */
  highlight?: string;
  body?: string;
  media?: Media;
  /** Floating words that drift around the hero and react to the cursor. */
  stickers?: string[];
}

/** A frequently asked question (CMS → "FAQs"). */
export interface Faq { id: string; question: string; answer: string; category?: string; hidden?: boolean }

export interface SectionText { eyebrow?: string; title?: string; body?: string }

export interface PagesContent {
  heroes: Record<PageKey, PageHeroContent>;
  sections: Record<string, SectionText>;
  loader: { enabled: boolean; words: string[]; tagline: string; everyVisit: boolean };
  newsletter: { title: string; body: string; thanks: string; button: string };
}

export interface Typography {
  displayFont: string;
  bodyFont: string;
  /** Body text size in px. */
  baseSize: number;
  bodyWeight: number;
  headingWeight: number;
  /** Multiplier for big headlines (1 = default). */
  headingScale: number;
  headingCase: "none" | "uppercase";
  letterSpacing: number; // em, headings
}

/* ------------------------------------------------------------ Bible learning games */

/** A game category id (managed in the content manager). */
export type QuizTrack = string;
/** Difficulty 1 (ages 3–6) … 5 (confident 12–13 year olds). Journey sections follow difficulty. */
export type QuizLevel = 1 | 2 | 3 | 4 | 5;
/**
 * choice    pick the right answer (answer + options as distractors)
 * truefalse answer is "true" or "false"
 * fill      complete the sentence: prompt contains "___"; options are distractor words
 * order     tap the words of `answer` in the right order (verse builder)
 * scramble  word puzzle: rebuild `answer` from its shuffled letters
 * spell     spelling challenge: type `answer` into letter boxes from the clue in `prompt`
 * match     match each left item to its partner (`pairs`)
 * sequence  put story events (`items`, listed in the right order) into order
 * write     type the answer; `answer` may list alternatives separated by "|"
 * reflect   open writing prompt — any thoughtful answer is welcome (nothing is stored)
 */
export type QuizKind = "choice" | "truefalse" | "fill" | "order" | "scramble" | "spell" | "match" | "sequence" | "write" | "reflect";

export interface QuizQuestion {
  id: string;
  /** Category id. */
  track: QuizTrack;
  /** Difficulty 1–5. */
  level: QuizLevel;
  kind: QuizKind;
  prompt: string;
  answer: string;
  options?: string[];
  pairs?: { a: string; b: string }[];
  items?: string[];
  reference?: string;
  /** The verse text, shown with memory-verse and scripture questions. */
  scripture?: string;
  explain?: string;
  hidden?: boolean;
}

export type LearnTone = "blue" | "sun" | "coral" | "mint" | "lilac";
export type LearnIcon = "book" | "sparkles" | "users" | "map" | "pen" | "puzzle" | "spell" | "link" | "clock" | "blank";

export interface LearnCategory {
  id: string;
  title: string;
  blurb: string;
  tone: LearnTone;
  icon: LearnIcon;
  hidden?: boolean;
}

/** One stop on the learning journey. Sections run 1–5 and match question difficulty. */
export interface LearnLesson {
  id: string;
  title: string;
  section: QuizLevel;
  /** Category id, or "mixed" for a checkpoint that reviews the whole section. */
  category: string;
  /** Questions per play-through. */
  size: number;
  hidden?: boolean;
}

export interface LearnChallenge {
  id: string;
  title: string;
  /** What counts: XP earned, correct answers, lessons finished, perfect lessons, or answers in one category. */
  metric: "xp" | "correct" | "lessons" | "perfect" | "category";
  target: number;
  category?: string;
  reward: number;
  hidden?: boolean;
}

/** Site-wide animation settings, edited in the content manager (Animations). */
export interface MotionSettings {
  /** auto = follow each visitor's device setting; full = always animate; calm = gentle fades only. */
  mode: "auto" | "full" | "calm";
}
