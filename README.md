# Presbyterian Children's Ministry

A responsive children's ministry website built with **Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, GSAP and Supabase**.

It runs out of the box on built-in sample content, then switches to live, admin-managed content as soon as Supabase is connected.

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
npm run build:static   # fully static export in /out (any static host)
npm run build          # server build (Vercel, Node) with image optimisation + security headers
```

Node 18.18+ is required. Pin TypeScript 5 (`typescript@5`) — Next 15 doesn't support TypeScript 7.

## Make it yours

| What | Where |
| --- | --- |
| Church name, contact details, service times, social accounts, app store links, **QR destination** | `content/site.ts` → `site` (or the `site_settings` row) |
| Homepage hero, welcome letter, stats | `content/site.ts` → `home` |
| Teachers, history timeline, vision & mission | `content/people.ts` |
| Class groups, classes, weekly Bible lessons | `content/classes.ts` |
| Events, gallery categories & items, feed posts | `content/community.ts` |
| Colours, fonts, radii, shadows | `tailwind.config.ts` |

Components never import content directly — every page reads through `lib/content.ts`, which uses Supabase when configured and falls back to these files otherwise.

### Photos

Every image slot accepts an uploaded photo (`media.src`). Until one is added, an illustrated scene is drawn instead (`components/Scene.tsx`), so the site never shows a broken image. Only upload group photos of children with written parental consent — the uploader and the database both require that confirmation.

## Connect Supabase

1. Create a project at supabase.com, then run `supabase/schema.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Sign up your first staff account, then in the SQL editor: `update profiles set role = 'admin' where id = '<user id>';`
4. Visit `/admin` to manage lessons, posts, moderation and site settings.

The service-role key is never used in the browser. All permissions are enforced by Row Level Security in the database.

## Structure

```
app/                     routes (home, about, classes/[slug]/lessons/[lesson], blog, gallery, contact, admin, legal)
components/
  Navbar  Footer  Hero  TeacherCard  ClassCard  BibleLesson  BlogPost  Feed
  CommentSection  ReactionBar  Gallery (+GalleryFilter, lightbox)  ContactForm
  Newsletter  SocialLinks  AppDownload  QRCode  Map  Scene  Motion  ui
content/                 seed content (replace with your own)
lib/                     types, content access layer, Supabase client, form validation
supabase/schema.sql      tables, RLS policies, rate limits, storage rules, feed view
```

## Safeguarding built in

- No child accounts, profiles or names anywhere; only staff post.
- Teacher posts are held for admin approval; parent comments are held for teacher approval.
- Comments with phone numbers, emails or addresses are blocked in the browser **and** by a database constraint.
- Reporting on every post and comment; suspended accounts can't post.
- Rate limits on comments, posts, contact form and newsletter (database-enforced), plus honeypot and timing checks in the browser.
- Uploads: staff only, type- and size-restricted, consent confirmation required.

## Accessibility & performance

Semantic landmarks, skip link, visible focus states, labelled forms with inline errors, 44 px touch targets, keyboard-operable menus, reaction picker and lightbox (focus-trapped, arrow keys, swipe). All motion is GSAP-driven and disabled for `prefers-reduced-motion`. Pages are statically generated, illustrations are inline SVG, and the Supabase client is only loaded when a form is submitted. Each page has its own title, description and canonical URL; `sitemap.xml`, `robots.txt` and JSON-LD (Church, LearningResource) are generated.
