import type { LucideIcon } from "lucide-react";
import {
  BookOpen, CalendarDays, Contact, GraduationCap, Home, Images, Info, LayoutDashboard, MessageSquareText, Inbox,
  Newspaper, Share2, Smartphone, Users, History, FolderOpen, Rss, Layers, Type, PanelsTopLeft, HelpCircle, KeyRound, Gamepad2, Sparkles, Target,
} from "lucide-react";
import { SECTIONS as JOURNEY } from "@/content/learn";
import { FONT_CHOICES } from "@/content/pages";
import { FAQ_CATEGORIES } from "@/content/faqs";
import type { CmsContent } from "@/lib/cms/schema";
import { EVENT_CATEGORIES } from "@/lib/calendar";
import { SCENE_OPTS, TONES, type Field, type Opt } from "./fields";
import { slugify } from "./upload";

const teacherOpts = (c: CmsContent): Opt[] => c.teachers.map((t) => ({ value: t.id, label: t.name }));
const classOpts = (c: CmsContent): Opt[] => c.classes.map((t) => ({ value: t.id, label: t.name }));
const groupOpts = (c: CmsContent): Opt[] => c.groups.map((t) => ({ value: t.id, label: t.name }));
const catOpts = (c: CmsContent): Opt[] => c.galleryCategories.map((t) => ({ value: t.id, label: t.label }));
const today = () => new Date().toISOString().slice(0, 10);
const QUIZ_KINDS: Opt[] = [
  { value: "choice", label: "Multiple choice" }, { value: "truefalse", label: "True or false" }, { value: "fill", label: "Fill the gap" },
  { value: "order", label: "Build the verse" }, { value: "scramble", label: "Word puzzle (unscramble)" }, { value: "spell", label: "Spelling" },
  { value: "match", label: "Match up" }, { value: "sequence", label: "Story order" }, { value: "write", label: "Type the answer" }, { value: "reflect", label: "Open writing" },
];
const SECTION_OPTS: Opt[] = JOURNEY.map((s) => ({ value: String(s.id), label: `${s.id} · ${s.title}` }));
const SECTION_LABEL = (n: unknown) => { const s = JOURNEY.find((x) => x.id === Number(n)); return s ? `${s.id} · ${s.title}` : String(n); };

const verse: Field = { k: "memoryVerse", label: "Memory verse", type: "group", fields: [{ k: "text", label: "Verse", type: "textarea", rows: 2, wide: true }, { k: "reference", label: "Reference", type: "text" }] };

const heroFields: Field[] = [
  { k: "eyebrow", label: "Small label", type: "text" }, { k: "highlight", label: "Coloured words", type: "text", help: "Must appear in the title." },
  { k: "title", label: "Title", type: "text", wide: true }, { k: "body", label: "One-line intro", type: "text", wide: true },
  { k: "media", label: "Picture or video", type: "media", folder: "pages", wide: true },
  { k: "stickers", label: "Floating stickers", type: "strings", itemLabel: "Sticker", help: "Short words visitors can drag around (up to 6)." },
];
const secFields: Field[] = [
  { k: "eyebrow", label: "Small label", type: "text" }, { k: "title", label: "Title", type: "text" }, { k: "body", label: "Line of text", type: "text", wide: true },
];

/** A collection = an editable list of records (add, edit, reorder, duplicate, delete, export). */
export interface Collection {
  kind: "collection";
  id: string;
  label: string;
  icon: LucideIcon;
  path: keyof CmsContent;
  blurb: string;
  fields: Field[];
  itemTitle: (v: any) => string;
  itemSub?: (v: any, c: CmsContent) => string;
  thumb?: (v: any) => { src?: string; scene?: string; tone?: string } | undefined;
  newItem: (c: CmsContent) => any;
  idFrom?: string;            // slug the id from this field when the id is empty
  uniqueBy?: (v: any) => string;
  fixed?: boolean;            // edit only — no add/delete
  filter?: { label: string; options: (c: CmsContent) => Opt[]; match: (v: any, val: string) => boolean };
  sort?: (a: any, b: any) => number;
  bulkUpload?: (url: string, type: "image" | "video", name: string) => any;
}

/** A form = one object in the content (settings, home page…). */
export interface Form {
  kind: "form";
  id: string;
  label: string;
  icon: LucideIcon;
  blurb: string;
  get: (c: CmsContent) => any;
  set: (c: CmsContent, v: any) => CmsContent;
  fields: Field[];
  preview?: "qr" | "type" | "map";
}

export interface Panel { kind: "panel"; id: "dashboard" | "media" | "comments" | "inbox" | "versions" | "staff"; label: string; icon: LucideIcon; blurb: string }

export type Section = Collection | Form | Panel;

export const SECTIONS: { title: string; items: Section[] }[] = [
  { title: "", items: [{ kind: "panel", id: "dashboard", label: "Dashboard", icon: LayoutDashboard, blurb: "Overview and quick actions." }] },
  {
    title: "Teaching",
    items: [
      {
        kind: "collection", id: "lessons", label: "Bible lessons", icon: BookOpen, path: "lessons",
        blurb: "Weekly lessons for each class. Upload take-home sheets, colouring pages and audio as resources.",
        itemTitle: (v) => v.title, itemSub: (v, c) => `${c.classes.find((x) => x.id === v.classId)?.name ?? v.classId} · ${v.date}`,
        uniqueBy: (v) => `${v.classId}/${v.id}`, idFrom: "title",
        sort: (a, b) => b.date.localeCompare(a.date),
        filter: { label: "Class", options: classOpts, match: (v, val) => v.classId === val },
        newItem: (c) => ({ id: "", classId: c.classes[0]?.id, date: today(), title: "", reference: "", topic: "", memoryVerse: { text: "", reference: "" }, objective: "", story: [""], questions: [""], activity: { title: "", steps: [""] }, prayer: "", resources: [] }),
        fields: [
          { k: "title", label: "Lesson title", type: "text", required: true },
          { k: "id", label: "URL slug", type: "text", help: "Used in the web address. Changing it breaks old links." },
          { k: "classId", label: "Class", type: "select", options: classOpts, required: true },
          { k: "date", label: "Date taught", type: "date", required: true },
          { k: "media", label: "Lesson picture or video", type: "media", folder: "lessons", wide: true, help: "Shown at the top of the lesson. Upload a photo or video, or paste a YouTube link." },
          { k: "reference", label: "Bible passage", type: "text", placeholder: "Luke 10:25–37" },
          { k: "topic", label: "Topic", type: "text" },
          verse,
          { k: "objective", label: "Learning objective", type: "textarea", rows: 2 },
          { k: "story", label: "Story", type: "paragraphs", help: "Leave a blank line between paragraphs." },
          { k: "questions", label: "Discussion questions", type: "strings", itemLabel: "Question" },
          { k: "activity", label: "Activity", type: "group", fields: [{ k: "title", label: "Title", type: "text", wide: true }, { k: "steps", label: "Steps", type: "strings", itemLabel: "Step" }] },
          { k: "prayer", label: "Closing prayer", type: "textarea", rows: 3 },
          { k: "resources", label: "Resources (downloads)", type: "list", itemTitle: (r) => r.label, newItem: () => ({ label: "", type: "pdf", url: "" }), fields: [
            { k: "label", label: "Label", type: "text" },
            { k: "type", label: "Type", type: "select", options: [{ value: "pdf", label: "PDF" }, { value: "image", label: "Image" }, { value: "audio", label: "Audio" }, { value: "video", label: "Video" }] },
            { k: "url", label: "File", type: "file", folder: "lessons" },
            { k: "size", label: "Size / length", type: "text", placeholder: "420 KB or 2:14" },
          ] },
        ],
      },
      {
        kind: "collection", id: "classes", label: "Classes", icon: GraduationCap, path: "classes",
        blurb: "Class names, rooms, ages and teachers.", itemTitle: (v) => v.name, itemSub: (v) => `${v.ages} · ${v.room}`, idFrom: "name",
        uniqueBy: (v) => v.id,
        filter: { label: "Group", options: groupOpts, match: (v, val) => v.group === val },
        newItem: (c) => ({ id: "", name: "", group: c.groups[0]?.id, ages: "", room: "", teacherIds: [], description: "" }),
        fields: [
          { k: "name", label: "Class name", type: "text", required: true },
          { k: "id", label: "URL slug", type: "text" },
          { k: "group", label: "Group", type: "select", options: groupOpts, required: true },
          { k: "ages", label: "Ages", type: "text" },
          { k: "room", label: "Room", type: "text" },
          { k: "teacherIds", label: "Teachers", type: "multiselect", options: teacherOpts },
          { k: "description", label: "Description", type: "textarea", rows: 3 },
        ],
      },
      {
        kind: "collection", id: "groups", label: "Class groups", icon: Layers, path: "groups", fixed: true,
        blurb: "The four age groups shown on the home and classes pages.", itemTitle: (v) => v.name, itemSub: (v) => v.ages,
        thumb: (v) => ({ scene: v.scene, tone: v.tone }), newItem: () => ({}),
        fields: [
          { k: "name", label: "Name", type: "text" }, { k: "ages", label: "Ages", type: "text" },
          { k: "tone", label: "Colour", type: "select", options: TONES }, { k: "scene", label: "Illustration", type: "select", options: SCENE_OPTS },
          { k: "blurb", label: "Blurb", type: "textarea", rows: 2 },
        ],
      },
      {
        kind: "collection", id: "teachers", label: "Teachers", icon: Users, path: "teachers",
        blurb: "Profiles, photos and the classes each teacher leads.", itemTitle: (v) => v.name, itemSub: (v) => v.role, idFrom: "name",
        uniqueBy: (v) => v.id, thumb: (v) => (v.photo ? { src: v.photo } : { tone: v.tone }),
        newItem: () => ({ id: "", name: "", role: "Teacher", bio: "", tone: "blue", classIds: [], checked: true, since: String(new Date().getFullYear()) }),
        fields: [
          { k: "name", label: "Full name", type: "text", required: true },
          { k: "role", label: "Role", type: "text" },
          { k: "photo", label: "Photo", type: "image", folder: "teachers", help: "A friendly head-and-shoulders photo works best (portrait, 4:5)." },
          { k: "bio", label: "Short bio", type: "textarea", rows: 4 },
          { k: "classIds", label: "Classes", type: "multiselect", options: classOpts },
          { k: "tone", label: "Card colour", type: "select", options: TONES },
          { k: "since", label: "Serving since (year)", type: "text" },
          { k: "credentials", label: "Credentials", type: "strings", itemLabel: "Line", help: "Shown under the portrait, e.g. “B.Ed, University of Cape Coast”." },
          { k: "favouriteVerse", label: "Favourite verse", type: "group", fields: [{ k: "text", label: "Verse", type: "textarea", rows: 2, wide: true }, { k: "reference", label: "Reference", type: "text" }] },
          { k: "funFact", label: "Fun fact", type: "text", wide: true },
          { k: "checked", label: "Safeguarding checked", type: "checkbox", help: "Training and background check complete" },
          { k: "featured", label: "Feature as ministry leader", type: "checkbox" },
          { k: "id", label: "ID", type: "text", help: "Internal reference. Changing it unlinks their posts and classes." },
        ],
      },
    ],
  },
  {
    title: "Community",
    items: [
      {
        kind: "collection", id: "events", label: "Events & calendar", icon: CalendarDays, path: "events",
        blurb: "Everything on the events calendar. Families can add events to their own calendars.", itemTitle: (v) => v.title,
        itemSub: (v) => `${v.date}${v.endDate && v.endDate !== v.date ? ` → ${v.endDate}` : ""} · ${v.time}`, idFrom: "title",
        uniqueBy: (v) => v.id, sort: (a, b) => a.date.localeCompare(b.date), thumb: (v) => v.image?.src ? { src: v.image.src } : { scene: v.scene, tone: v.tone },
        filter: { label: "Type", options: () => EVENT_CATEGORIES.map((c) => ({ value: c.id, label: c.label })), match: (v, val) => (v.category || "special") === val },
        newItem: () => ({ id: "", title: "", date: today(), time: "9:00 am", location: "Main Auditorium", summary: "", tone: "blue", scene: "worship", category: "special" }),
        fields: [
          { k: "title", label: "Event name", type: "text", required: true, wide: true },
          { k: "date", label: "Start date", type: "date", required: true },
          { k: "endDate", label: "End date", type: "date", help: "For multi-day events like camp." },
          { k: "time", label: "Time", type: "text", placeholder: "9:00 am or 2:00 – 5:00 pm" },
          { k: "location", label: "Location", type: "text" },
          { k: "category", label: "Type", type: "select", options: EVENT_CATEGORIES.map((c) => ({ value: c.id, label: c.label })) },
          { k: "rsvpUrl", label: "RSVP / sign-up link", type: "url" },
          { k: "summary", label: "Description", type: "textarea", rows: 3 },
          { k: "tone", label: "Colour", type: "select", options: TONES },
          { k: "scene", label: "Illustration", type: "select", options: SCENE_OPTS },
          { k: "image", label: "Photo (optional)", type: "media", accept: "image", folder: "events" },
          { k: "id", label: "ID", type: "text" },
        ],
      },
      {
        kind: "collection", id: "posts", label: "Feed posts", icon: Newspaper, path: "posts",
        blurb: "Posts appear live on the blog feed within seconds of saving. Set a future time to schedule one.", itemTitle: (v) => v.body?.slice(0, 70) || "(empty post)",
        itemSub: (v, c) => `${v.status === "draft" ? "Draft · " : ""}${v.pinned ? "📌 " : ""}${c.teachers.find((t) => t.id === v.authorId)?.name ?? ""} · ${v.createdAt?.slice(0, 16).replace("T", " ")}`,
        uniqueBy: (v) => v.id, sort: (a, b) => b.createdAt.localeCompare(a.createdAt), thumb: (v) => v.media && (v.media.src ? { src: v.media.src } : { scene: v.media.scene, tone: v.media.tone }),
        filter: { label: "Type", options: () => ["text", "article", "image", "video", "verse", "event", "announcement"].map((k) => ({ value: k, label: k[0].toUpperCase() + k.slice(1) })), match: (v, val) => v.kind === val },
        newItem: (c) => ({ id: "p" + Date.now().toString(36), kind: "text", authorId: c.teachers[0]?.id, createdAt: new Date().toISOString(), body: "", reactions: { love: 0, laugh: 0, wow: 0, pray: 0, like: 0 }, comments: [], status: "published" }),
        bulkUpload: (url, type) => ({ id: "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), kind: type, authorId: "", createdAt: new Date().toISOString(), body: "", media: { src: url, alt: "" }, reactions: { love: 0, laugh: 0, wow: 0, pray: 0, like: 0 }, comments: [], status: "draft" }),
        fields: [
          { k: "kind", label: "Post type", type: "select", options: ["text", "article", "image", "video", "verse", "event", "announcement"].map((k) => ({ value: k, label: k[0].toUpperCase() + k.slice(1) })), required: true },
          { k: "authorId", label: "Posted by", type: "select", options: teacherOpts, required: true },
          { k: "title", label: "Headline (for articles)", type: "text", wide: true },
          { k: "body", label: "Message", type: "textarea", rows: 6, required: true, help: "For articles, write the full piece and leave a blank line between paragraphs — the feed shows the start with a “Read more” button." },
          { k: "status", label: "Status", type: "select", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft (hidden)" }] },
          { k: "createdAt", label: "Post time", type: "datetime", help: "A future time schedules the post." },
          { k: "pinned", label: "Pin to top of feed", type: "checkbox" },
          { k: "media", label: "Photo or video", type: "media", folder: "posts" },
          { k: "verse", label: "Verse (for verse posts)", type: "group", fields: [{ k: "text", label: "Verse", type: "textarea", rows: 2, wide: true }, { k: "reference", label: "Reference", type: "text" }] },
          { k: "event", label: "Event (for event posts)", type: "group", fields: [{ k: "title", label: "Title", type: "text", wide: true }, { k: "date", label: "Date", type: "date" }, { k: "time", label: "Time", type: "text" }, { k: "location", label: "Location", type: "text" }] },
          { k: "reactions", label: "Starting reaction counts", type: "group", fields: (["love", "like", "laugh", "wow", "pray"] as const).map((r) => ({ k: r, label: r, type: "number" as const })) },
          { k: "comments", label: "Teacher-added comments", type: "list", itemTitle: (c) => `${c.author}: ${c.body?.slice(0, 40)}`, newItem: () => ({ id: "c" + Date.now().toString(36), author: "", authorRole: "teacher", body: "", createdAt: new Date().toISOString(), likes: 0 }), fields: [
            { k: "author", label: "Name", type: "text" }, { k: "authorRole", label: "Role", type: "select", options: [{ value: "teacher", label: "Teacher" }, { value: "admin", label: "Admin" }, { value: "parent", label: "Parent" }] },
            { k: "body", label: "Comment", type: "textarea", rows: 2 },
          ] },
        ],
      },
      {
        kind: "collection", id: "socialEmbeds", label: "Social posts", icon: Rss, path: "socialEmbeds",
        blurb: "Paste links to posts from your YouTube, Instagram, TikTok or Facebook — they're embedded on the blog.", itemTitle: (v) => v.caption || v.url,
        itemSub: (v) => `${v.platform} · ${v.date}`, uniqueBy: (v) => v.id, sort: (a, b) => b.date.localeCompare(a.date),
        newItem: () => ({ id: "se" + Date.now().toString(36), platform: "youtube", url: "", caption: "", date: today() }),
        fields: [
          { k: "platform", label: "Platform", type: "select", options: [{ value: "youtube", label: "YouTube" }, { value: "instagram", label: "Instagram" }, { value: "tiktok", label: "TikTok" }, { value: "facebook", label: "Facebook" }, { value: "x", label: "X (link card)" }, { value: "link", label: "Other link" }] },
          { k: "date", label: "Date", type: "date" },
          { k: "url", label: "Post URL", type: "url", wide: true, required: true, help: "e.g. https://www.instagram.com/p/ABC123/ or a YouTube video link" },
          { k: "caption", label: "Caption", type: "text", wide: true },
        ],
      },
      {
        kind: "collection", id: "faqs", label: "FAQs", icon: HelpCircle, path: "faqs",
        blurb: "Questions and answers shown on the home and contact pages. Drag to reorder — the first ones show first.",
        itemTitle: (v) => v.question || "New question", itemSub: (v) => `${FAQ_CATEGORIES.find((c) => c.value === v.category)?.label ?? "General"}${v.hidden ? " · hidden" : ""}`,
        uniqueBy: (v) => v.id,
        newItem: () => ({ id: "faq" + Date.now().toString(36), category: "visiting", question: "", answer: "" }),
        filter: { label: "Topic", options: () => FAQ_CATEGORIES, match: (v, val) => v.category === val },
        fields: [
          { k: "question", label: "Question", type: "text", wide: true, required: true },
          { k: "answer", label: "Answer", type: "textarea", rows: 4, wide: true, required: true, help: "Keep it short and friendly — two or three sentences." },
          { k: "category", label: "Topic", type: "select", options: FAQ_CATEGORIES },
          { k: "hidden", label: "Hide from the website", type: "checkbox" },
        ],
      },
      {
        kind: "collection", id: "quiz", label: "Bible games · questions", icon: Gamepad2, path: "quiz",
        blurb: "Questions for the Bible games. Each child sees every question once before anything repeats, so the more you add, the longer the journey lasts. A question that repeats another's wording is skipped automatically.",
        itemTitle: (v) => v.prompt || "New question",
        itemSub: (v, c) => `${c.learnCategories?.find((t) => t.id === v.track)?.title ?? v.track} · ${SECTION_LABEL(v.level)} · ${QUIZ_KINDS.find((k) => k.value === v.kind)?.label ?? v.kind}${v.hidden ? " · hidden" : ""}`,
        uniqueBy: (v) => v.id,
        newItem: () => ({ id: "q" + Date.now().toString(36), track: "scripture", level: 1, kind: "choice", prompt: "", answer: "", options: ["", "", ""], reference: "" }),
        filter: { label: "Game", options: (c) => (c.learnCategories || []).map((t) => ({ value: t.id, label: t.title })), match: (v, val) => v.track === val },
        fields: [
          { k: "prompt", label: "Question or clue", type: "textarea", rows: 2, wide: true, required: true, help: "Fill the gap: write ___ where the missing word goes. Word puzzle / Spelling: write the clue. Match up / Story order: write the instruction, e.g. “Put Noah's story in order.”" },
          { k: "track", label: "Game category", type: "select", options: (c) => (c.learnCategories || []).map((t) => ({ value: t.id, label: t.title })) },
          { k: "level", label: "Difficulty (journey section)", type: "select", options: SECTION_OPTS },
          { k: "kind", label: "Question type", type: "select", options: () => QUIZ_KINDS },
          { k: "answer", label: "Correct answer", type: "text", wide: true, help: "Multiple choice / fill the gap: the right answer. True or false: true or false. Build the verse: the whole verse. Word puzzle / Spelling: the word. Type the answer: separate other accepted answers with | (e.g. 12|twelve). Leave empty for Match up, Story order and Open writing." },
          { k: "options", label: "Wrong answers", type: "strings", itemLabel: "Wrong answer", help: "Multiple choice and fill the gap — up to three believable wrong answers." },
          { k: "pairs", label: "Pairs (Match up)", type: "list", itemTitle: (r) => `${r.a || "…"} → ${r.b || "…"}`, newItem: () => ({ a: "", b: "" }), fields: [{ k: "a", label: "Left", type: "text" }, { k: "b", label: "Its partner", type: "text" }] },
          { k: "items", label: "Events in the right order (Story order)", type: "strings", itemLabel: "Event", help: "List them first to last — children see them shuffled." },
          { k: "scripture", label: "Scripture text (optional)", type: "textarea", rows: 2, wide: true, help: "Shown with the question, e.g. the verse being learned." },
          { k: "reference", label: "Bible reference", type: "text", placeholder: "Luke 10:27" },
          { k: "explain", label: "Shown after answering (optional)", type: "textarea", rows: 2, wide: true },
          { k: "id", label: "ID", type: "text", help: "Must be unique. Changing it makes children see the question again." },
          { k: "hidden", label: "Hide this question", type: "checkbox" },
        ],
      },
      {
        kind: "collection", id: "learnCategories", label: "Bible games · categories", icon: Layers, path: "learnCategories",
        blurb: "The kinds of game on the journey (Scripture quiz, Word puzzles…). Hiding one hides its lessons and questions.",
        itemTitle: (v) => v.title || "New category", itemSub: (v) => `${v.id}${v.hidden ? " · hidden" : ""}`, uniqueBy: (v) => v.id,
        newItem: () => ({ id: "cat" + Date.now().toString(36), title: "", blurb: "", tone: "blue", icon: "book" }),
        fields: [
          { k: "title", label: "Name", type: "text", required: true },
          { k: "blurb", label: "Short description", type: "text", wide: true },
          { k: "tone", label: "Colour", type: "select", options: [{ value: "blue", label: "Blue" }, { value: "sun", label: "Yellow" }, { value: "coral", label: "Coral" }, { value: "mint", label: "Sky" }, { value: "lilac", label: "Navy" }] },
          { k: "icon", label: "Icon", type: "select", options: [["book", "Book"], ["sparkles", "Sparkles"], ["users", "People"], ["map", "Map"], ["blank", "Gap"], ["puzzle", "Puzzle"], ["spell", "Spelling"], ["link", "Link"], ["clock", "Clock"], ["pen", "Pen"]].map(([value, label]) => ({ value, label })) },
          { k: "id", label: "ID", type: "text", help: "Questions and lessons point to this. Change with care." },
          { k: "hidden", label: "Hide this category", type: "checkbox" },
        ],
      },
      {
        kind: "collection", id: "learnLessons", label: "Bible games · journey lessons", icon: GraduationCap, path: "learnLessons",
        blurb: "The stops on the learning journey, in order. Each lesson draws new questions from its category at its section's difficulty. A “Checkpoint” mixes every game.",
        itemTitle: (v) => v.title || "New lesson", itemSub: (v, c) => `${SECTION_LABEL(v.section)} · ${v.category === "mixed" ? "Checkpoint (all games)" : c.learnCategories?.find((t) => t.id === v.category)?.title ?? v.category} · ${v.size} questions${v.hidden ? " · hidden" : ""}`,
        uniqueBy: (v) => v.id,
        newItem: () => ({ id: "lesson" + Date.now().toString(36), title: "", section: 1, category: "scripture", size: 6 }),
        filter: { label: "Section", options: () => SECTION_OPTS, match: (v, val) => String(v.section) === val },
        fields: [
          { k: "title", label: "Title", type: "text", required: true },
          { k: "section", label: "Journey section", type: "select", options: SECTION_OPTS },
          { k: "category", label: "Game", type: "select", options: (c) => [{ value: "mixed", label: "Checkpoint — all games" }, ...(c.learnCategories || []).map((t) => ({ value: t.id, label: t.title }))] },
          { k: "size", label: "Questions per lesson", type: "number", help: "Between 3 and 12." },
          { k: "id", label: "ID", type: "text", help: "Used in the lesson's web address and to remember who finished it." },
          { k: "hidden", label: "Hide this lesson", type: "checkbox" },
        ],
      },
      {
        kind: "collection", id: "learnChallenges", label: "Bible games · daily challenges", icon: Target, path: "learnChallenges",
        blurb: "Three of these are picked each day for everyone. Finishing one gives bonus XP.",
        itemTitle: (v) => v.title || "New challenge", itemSub: (v) => `${v.metric} · ${v.target} · +${v.reward} XP${v.hidden ? " · hidden" : ""}`, uniqueBy: (v) => v.id,
        newItem: () => ({ id: "ch" + Date.now().toString(36), title: "", metric: "correct", target: 10, reward: 10 }),
        fields: [
          { k: "title", label: "Shown to children", type: "text", wide: true, required: true, placeholder: "Get 10 answers right" },
          { k: "metric", label: "What counts", type: "select", options: [{ value: "xp", label: "XP earned today" }, { value: "correct", label: "Right answers today" }, { value: "lessons", label: "Lessons finished today" }, { value: "perfect", label: "Perfect lessons today" }, { value: "category", label: "Answers in one game today" }] },
          { k: "category", label: "Game (for “Answers in one game”)", type: "select", options: (c) => (c.learnCategories || []).map((t) => ({ value: t.id, label: t.title })) },
          { k: "target", label: "Target", type: "number" },
          { k: "reward", label: "Bonus XP", type: "number" },
          { k: "id", label: "ID", type: "text" },
          { k: "hidden", label: "Hide this challenge", type: "checkbox" },
        ],
      },
      {
        kind: "collection", id: "gallery", label: "Gallery", icon: Images, path: "gallery",
        blurb: "Photos and videos by album. Drop several files at once to add them in one go.", itemTitle: (v) => v.caption || v.event, itemSub: (v, c) => `${c.galleryCategories.find((x) => x.id === v.category)?.label ?? v.category} · ${v.type} · ${v.date}`,
        uniqueBy: (v) => v.id, sort: (a, b) => b.date.localeCompare(a.date), thumb: (v) => (v.media?.src ? { src: v.media.src } : { scene: v.media?.scene, tone: v.media?.tone }),
        filter: { label: "Album", options: catOpts, match: (v, val) => v.category === val },
        newItem: (c) => ({ id: "g" + Date.now().toString(36), category: c.galleryCategories[0]?.id, type: "image", event: "", caption: "", date: today(), aspect: "square", media: { alt: "" } }),
        bulkUpload: (url, type, name) => ({ id: "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), category: "", type, event: "", caption: name.replace(/\.\w+$/, "").replace(/[-_]+/g, " "), date: today(), aspect: "square", media: { src: url, alt: "" } }),
        fields: [
          { k: "media", label: "Photo or video", type: "media", folder: "gallery", required: true },
          { k: "type", label: "Type", type: "select", options: [{ value: "image", label: "Photo" }, { value: "video", label: "Video" }] },
          { k: "category", label: "Album", type: "select", options: catOpts, required: true },
          { k: "event", label: "Event", type: "text" },
          { k: "date", label: "Date", type: "date" },
          { k: "caption", label: "Caption", type: "textarea", rows: 2 },
          { k: "aspect", label: "Shape in grid", type: "select", options: [{ value: "square", label: "Square" }, { value: "tall", label: "Tall" }, { value: "wide", label: "Wide" }] },
        ],
      },
      {
        kind: "collection", id: "galleryCategories", label: "Gallery albums", icon: FolderOpen, path: "galleryCategories",
        blurb: "Album names used as gallery filters.", itemTitle: (v) => v.label, itemSub: (v) => v.id, idFrom: "label", uniqueBy: (v) => v.id,
        newItem: () => ({ id: "", label: "" }),
        fields: [{ k: "label", label: "Album name", type: "text", required: true }, { k: "id", label: "ID", type: "text" }],
      },
      { kind: "panel", id: "comments", label: "Comments", icon: MessageSquareText, blurb: "Approve or remove parent comments before they appear." },
      { kind: "panel", id: "inbox", label: "Inbox", icon: Inbox, blurb: "Contact form messages, reports and newsletter subscribers." },
    ],
  },
  {
    title: "Pages & settings",
    items: [
      {
        kind: "form", id: "home", label: "Home page", icon: Home, blurb: "Hero, welcome letter, Sunday overview and stats.",
        get: (c) => c.home, set: (c, v) => ({ ...c, home: v }),
        fields: [
          { k: "hero", label: "Hero", type: "group", fields: [
            { k: "eyebrow", label: "Small label", type: "text", wide: true }, { k: "headline", label: "Headline (first line)", type: "text", placeholder: "Helping Children" }, { k: "highlight", label: "Highlighted words (last line)", type: "text", placeholder: "God's Word" },
            { k: "rotate", label: "Words that type in and out", type: "strings", itemLabel: "Word", help: "Shown one after another between the headline and the highlighted words, e.g. Know → Love → Live. Leave empty for a still headline." },
            { k: "body", label: "Intro", type: "textarea", rows: 3 }, { k: "image", label: "Hero image", type: "media", folder: "home" },
          ] },
          { k: "welcome", label: "Welcome letter", type: "group", fields: [
            { k: "title", label: "Title", type: "text", wide: true }, { k: "body", label: "Letter", type: "textarea", rows: 5 },
            { k: "signature", label: "Signed by", type: "text" }, { k: "role", label: "Their role", type: "text" },
          ] },
          { k: "stats", label: "Stats", type: "list", max: 4, itemTitle: (s) => `${s.value} ${s.label}`, newItem: () => ({ value: "", label: "" }), fields: [{ k: "value", label: "Number", type: "text" }, { k: "label", label: "Label", type: "text" }] },
          { k: "about", label: "What happens on a Sunday", type: "group", fields: [
            { k: "title", label: "Title", type: "text", wide: true }, { k: "body", label: "Text", type: "textarea", rows: 3 },
            { k: "points", label: "Points", type: "list", itemTitle: (p) => p.title, newItem: () => ({ title: "", body: "" }), fields: [{ k: "title", label: "Title", type: "text" }, { k: "body", label: "Text", type: "text" }] },
            { k: "image", label: "Image", type: "media", folder: "home" },
          ] },
        ],
      },
      {
        kind: "form", id: "about", label: "About page", icon: Info, blurb: "Vision, mission and the history timeline.",
        get: (c) => c.about, set: (c, v) => ({ ...c, about: v }),
        fields: [
          { k: "vision", label: "Vision", type: "group", fields: [{ k: "title", label: "Title", type: "text", wide: true }, { k: "statement", label: "Statement", type: "textarea", rows: 2 }] },
          { k: "mission", label: "Mission", type: "group", fields: [
            { k: "title", label: "Title", type: "text" }, { k: "intro", label: "Intro", type: "text" },
            { k: "pillars", label: "Pillars", type: "list", itemTitle: (p) => p.title, newItem: () => ({ title: "", body: "" }), fields: [{ k: "title", label: "Title", type: "text" }, { k: "body", label: "Text", type: "textarea", rows: 2 }] },
          ] },
          { k: "historyDoc", label: "History document (download)", type: "group", fields: [
            { k: "label", label: "Button text", type: "text", placeholder: "Download our full history" },
            { k: "note", label: "Small note", type: "text", placeholder: "PDF · 12 pages" },
            { k: "url", label: "Document", type: "file", folder: "documents", wide: true },
          ] },
          { k: "history", label: "History timeline", type: "list", itemTitle: (h) => `${h.year} — ${h.title}`, newItem: () => ({ year: String(new Date().getFullYear()), title: "", body: "", image: { alt: "", scene: "sunrise", tone: "blue" } }), fields: [
            { k: "year", label: "Year", type: "text" }, { k: "title", label: "Title", type: "text" }, { k: "body", label: "Text", type: "textarea", rows: 3 }, { k: "image", label: "Image", type: "media", folder: "history" },
          ] },
        ],
      },
      {
        kind: "form", id: "contact", label: "Contact & map", icon: Contact, blurb: "Phone, email, address, the map, service times and the main button.", preview: "map",
        get: (c) => c.site, set: (c, v) => ({ ...c, site: v }),
        fields: [
          { k: "name", label: "Ministry name", type: "text" }, { k: "shortName", label: "Short name", type: "text" },
          { k: "church", label: "Church", type: "text" }, { k: "tagline", label: "Tagline", type: "text" },
          { k: "description", label: "Search engine description", type: "textarea", rows: 2 },
          { k: "url", label: "Website address", type: "url" },
          { k: "contact", label: "Contact details", type: "group", fields: [
            { k: "phone", label: "Phone", type: "text" }, { k: "whatsapp", label: "WhatsApp number", type: "text", help: "Digits only, with country code (233…)" },
            { k: "email", label: "Email", type: "email" }, { k: "hours", label: "Office hours", type: "text", placeholder: "Mon–Fri 9am–4pm" },
            { k: "mapQuery", label: "Map location", type: "text", help: "Type the address or place name — the map preview updates as you type. Also used for “Get directions”." },
            { k: "mapLabel", label: "Map card title", type: "text", placeholder: "Presbyterian Church, Accra" },
            { k: "mapZoom", label: "Map zoom", type: "select", options: [[12, "Wide — whole area"], [14, "Neighbourhood"], [15, "Streets (default)"], [17, "Close — the building"], [19, "Very close"]].map(([v, l]) => ({ value: String(v), label: String(l) })) },
            { k: "mapEmbed", label: "Exact map pin (optional)", type: "textarea", rows: 3, wide: true, help: "For a precise pin, paste ONE of: a Google Maps link from your browser's address bar, the code from Google Maps → Share → Embed a map, or coordinates like 5.5600, -0.2050. Leave empty to use the location above." },
            { k: "address", label: "Address lines", type: "strings", itemLabel: "Line" },
          ] },
          { k: "serviceTimes", label: "Service times", type: "list", itemTitle: (s) => `${s.label} — ${s.time}`, newItem: () => ({ label: "", time: "" }), fields: [{ k: "label", label: "Service", type: "text" }, { k: "time", label: "Time", type: "text" }] },
          { k: "cta", label: "Main call-to-action button", type: "group", fields: [{ k: "label", label: "Button text", type: "text" }, { k: "href", label: "Link", type: "text" }] },
        ],
      },
      {
        kind: "form", id: "socials", label: "Social handles", icon: Share2, blurb: "Your social accounts, shown in the footer, home page and contact page.",
        get: (c) => ({ socials: c.site.socials }), set: (c, v) => ({ ...c, site: { ...c.site, socials: v.socials } }),
        fields: [
          { k: "socials", label: "Accounts", type: "list", itemTitle: (s) => `${s.label} — ${s.handle}`, newItem: () => ({ platform: "instagram", label: "Instagram", handle: "@", url: "https://" }), fields: [
            { k: "platform", label: "Platform", type: "select", options: ["facebook", "instagram", "youtube", "tiktok", "x", "whatsapp"].map((p) => ({ value: p, label: p === "x" ? "X" : p[0].toUpperCase() + p.slice(1) })) },
            { k: "label", label: "Display name", type: "text" }, { k: "handle", label: "Handle", type: "text", placeholder: "@pcm.kids" }, { k: "url", label: "Profile link", type: "url" },
          ] },
        ],
      },
      {
        kind: "form", id: "app", label: "App & QR code", icon: Smartphone, blurb: "Upload your QR code, or let the site generate one from a link.", preview: "qr",
        get: (c) => c.site.app, set: (c, v) => ({ ...c, site: { ...c.site, app: v } }),
        fields: [
          { k: "qrImage", label: "Your QR code image", type: "image", folder: "qr", wide: true, help: "Upload your real QR code (PNG or SVG). It replaces the generated one everywhere on the site." },
          { k: "qrCaption", label: "Text under the QR code", type: "text", wide: true, placeholder: "Point your phone camera here." },
          { k: "name", label: "App name", type: "text" }, { k: "qrUrl", label: "QR code link (used if no image)", type: "url", help: "Where the generated QR code sends people." },
          { k: "playStoreUrl", label: "Google Play link", type: "url" }, { k: "appStoreUrl", label: "App Store link", type: "url" },
          { k: "blurb", label: "Description", type: "textarea", rows: 3 },
        ],
      },
      {
        kind: "form", id: "pages", label: "Page text", icon: PanelsTopLeft, blurb: "Every headline, hero and short line of text on the site, plus the intro screen.",
        get: (c) => c.pages, set: (c, v) => ({ ...c, pages: v }),
        fields: [
          { k: "heroes", label: "Page heroes", type: "group", fields: [
              { k: "about", label: "About", type: "group", fields: heroFields },
              { k: "classes", label: "Classes", type: "group", fields: heroFields },
              { k: "events", label: "Events", type: "group", fields: heroFields },
              { k: "blog", label: "Blog / feed", type: "group", fields: heroFields },
              { k: "gallery", label: "Gallery", type: "group", fields: heroFields },
              { k: "contact", label: "Contact", type: "group", fields: heroFields }
          ] },
          { k: "sections", label: "Section headings", type: "group", fields: [
              { k: "home.about", label: "Home · Sunday overview", type: "group", fields: secFields },
              { k: "home.classes", label: "Home · Classes", type: "group", fields: secFields },
              { k: "home.events", label: "Home · Events", type: "group", fields: secFields },
              { k: "home.lesson", label: "Home · Featured lesson", type: "group", fields: secFields },
              { k: "home.posts", label: "Home · Feed", type: "group", fields: secFields },
              { k: "home.gallery", label: "Home · Gallery", type: "group", fields: secFields },
              { k: "home.teachers", label: "Home · Teachers", type: "group", fields: secFields },
              { k: "home.app", label: "Home · App", type: "group", fields: secFields },
              { k: "home.social", label: "Home · Social", type: "group", fields: secFields },
              { k: "about.teachers", label: "About · Team", type: "group", fields: secFields },
              { k: "about.history", label: "About · History", type: "group", fields: secFields },
              { k: "blog.social", label: "Blog · Social posts", type: "group", fields: secFields },
              { k: "contact.cards", label: "Contact · Cards", type: "group", fields: secFields },
              { k: "contact.form", label: "Contact · Form", type: "group", fields: secFields },
              { k: "contact.visit", label: "Contact · Service times", type: "group", fields: secFields },
              { k: "contact.social", label: "Contact · Social", type: "group", fields: secFields },
              { k: "contact.map", label: "Contact · Map", type: "group", fields: secFields },
              { k: "contact.app", label: "Contact · QR code", type: "group", fields: secFields },
              { k: "footer.visit", label: "Footer · Invitation", type: "group", fields: secFields },
              { k: "home.faq", label: "Home · FAQs", type: "group", fields: secFields },
              { k: "contact.faq", label: "Contact · FAQs", type: "group", fields: secFields }
          ] },
          { k: "newsletter", label: "Newsletter sign-up", type: "group", fields: [
            { k: "title", label: "Title", type: "text", wide: true }, { k: "body", label: "Text", type: "text", wide: true },
            { k: "button", label: "Button", type: "text" }, { k: "thanks", label: "Thank-you message", type: "text", wide: true },
          ] },
        ],
      },
      {
        kind: "form", id: "motion", label: "Animations", icon: Sparkles,
        blurb: "How much the site moves. Calm keeps gentle fades and button feedback but removes parallax, scrolling effects and large movement.",
        get: (c) => c.motion, set: (c, v) => ({ ...c, motion: v }),
        fields: [
          { k: "mode", label: "Animation style", type: "select", wide: true, options: [
            { value: "auto", label: "Automatic — follow each visitor's device setting (recommended)" },
            { value: "full", label: "Full animations for everyone" },
            { value: "calm", label: "Calm for everyone — gentle fades only" },
          ], help: "Automatic respects people who turn animations off on their phone or computer (on Windows: Settings → Accessibility → Visual effects)." },
        ],
      },
      {
        kind: "form", id: "typography", label: "Typography", icon: Type, blurb: "Fonts, sizes and weights for the whole site.", preview: "type",
        get: (c) => c.typography, set: (c, v) => ({ ...c, typography: v }),
        fields: [
          { k: "displayFont", label: "Headline font", type: "select", options: FONT_CHOICES.map((f) => ({ value: f, label: f })) },
          { k: "bodyFont", label: "Body font", type: "select", options: FONT_CHOICES.map((f) => ({ value: f, label: f })) },
          { k: "headingWeight", label: "Headline weight", type: "select", options: [500, 600, 700, 800, 900].map((w) => ({ value: String(w), label: { 500: "Medium", 600: "Semi-bold", 700: "Bold", 800: "Extra-bold", 900: "Black" }[w]! })) },
          { k: "bodyWeight", label: "Body weight", type: "select", options: [400, 500, 600, 700].map((w) => ({ value: String(w), label: { 400: "Regular", 500: "Medium", 600: "Semi-bold", 700: "Bold" }[w]! })) },
          { k: "baseSize", label: "Text size", type: "select", options: [15, 16, 17, 18, 19, 20, 22].map((n) => ({ value: String(n), label: `${n}px${n === 18 ? " (default)" : ""}` })) },
          { k: "headingScale", label: "Headline size", type: "select", options: [0.8, 0.9, 1, 1.1, 1.2, 1.3].map((n) => ({ value: String(n), label: n === 1 ? "Default" : `${Math.round(n * 100)}%` })) },
          { k: "headingCase", label: "Headline case", type: "select", options: [{ value: "none", label: "As typed" }, { value: "uppercase", label: "UPPERCASE" }] },
          { k: "letterSpacing", label: "Headline spacing", type: "select", options: [-0.04, -0.03, -0.02, -0.01, 0, 0.02].map((n) => ({ value: String(n), label: n === -0.02 ? "Default" : n < 0 ? `Tighter (${n})` : n === 0 ? "Normal" : "Wider" })) },
        ],
      },
      { kind: "panel", id: "media", label: "Media library", icon: FolderOpen, blurb: "Every uploaded photo, video and file." },
      { kind: "panel", id: "versions", label: "Versions & backup", icon: History, blurb: "Restore an earlier version, or download / import a full backup." },
      { kind: "panel", id: "staff", label: "Staff accounts", icon: KeyRound, blurb: "Who can sign in to the content manager, and their passwords." },
    ],
  },
];

export const ALL_SECTIONS = SECTIONS.flatMap((g) => g.items);

export function fillId(sec: Collection, item: any, list: any[]): any {
  if (!sec.idFrom || item.id) return item;
  const base = slugify(String(item[sec.idFrom] || "")) || "item";
  let id = base, n = 2;
  const taken = new Set(list.filter((x) => x !== item && (!sec.uniqueBy || sec.id !== "lessons" || x.classId === item.classId)).map((x) => x.id));
  while (taken.has(id)) id = `${base}-${n++}`;
  return { ...item, id };
}
