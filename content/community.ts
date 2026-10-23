import type { EventItem, GalleryCategory, GalleryItem, Post } from "@/lib/types";

export const events: EventItem[] = [
  { id: "children-harvest-2026", title: "Children's Harvest Thanksgiving", date: "2026-10-25", time: "9:00 am", location: "Main Auditorium", tone: "sun", scene: "harvest", summary: "Children lead worship, recite memory verses and bring gifts for our partner schools. Families warmly invited." },
  { id: "parents-coffee", title: "Parents' Coffee Morning", date: "2026-11-08", time: "11:00 am", location: "Fellowship Hall", tone: "sun", scene: "parents", summary: "Meet your child's teachers, see this term's lesson plan and ask anything about safeguarding and check-in." },
  { id: "nativity", title: "Nativity Rehearsals Begin", date: "2026-11-15", time: "After service", location: "Children's Wing", tone: "lilac", scene: "music", summary: "Every child gets a part — shepherds, sheep, stars and singers. Costume list sent home the week before." },
  { id: "christmas-party", title: "Christmas Party & Carols", date: "2026-12-19", time: "2:00 – 5:00 pm", location: "Church Grounds", tone: "mint", scene: "worship", summary: "Games, carols, a short nativity and a gift for every child. Volunteers needed — sign up at the welcome desk." },
];

export const galleryCategories: { id: GalleryCategory; label: string }[] = [
  { id: "children-harvest", label: "Children Harvest" },
  { id: "parents-day", label: "Parents Day" },
  { id: "graduation", label: "Graduation" },
  { id: "hosanna", label: "Hosanna" },
  { id: "evangelism", label: "Evangelism" },
  { id: "excursion", label: "Excursion" },
  { id: "camping", label: "Camping" },
];

const g = (
  id: string, category: GalleryCategory, event: string, caption: string, date: string,
  scene: GalleryItem["media"]["scene"], tone: GalleryItem["media"]["tone"], aspect: GalleryItem["aspect"], type: GalleryItem["type"] = "image",
): GalleryItem => ({ id, category, event, caption, date, type, aspect, media: { alt: caption, scene, tone } });

// Photos of children: only group shots, no names, and only with written parental consent (see /safeguarding).
export const gallery: GalleryItem[] = [
  g("g1", "children-harvest", "Children's Harvest 2025", "Baskets of yams, plantain and school supplies ready for our partner schools.", "2025-10-26", "harvest", "sun", "tall"),
  g("g2", "hosanna", "Palm Sunday 2026", "Waving palm branches on the Hosanna procession around the church grounds.", "2026-03-29", "hosanna", "mint", "wide"),
  g("g3", "graduation", "Seniors Graduation 2026", "Seniors moving up to youth church, certificates in hand.", "2026-07-12", "graduation", "blue", "square"),
  g("g4", "camping", "Children's Ministry Camp 2026", "Campfire worship on the last night of camp at Aburi.", "2026-08-14", "camping", "ink", "tall", "video"),
  g("g5", "parents-day", "Parents Day 2026", "Children serving breakfast to their parents and guardians.", "2026-05-10", "parents", "sun", "square"),
  g("g6", "excursion", "Trip to the Botanical Gardens", "Juniors exploring God's creation at Aburi Botanical Gardens.", "2026-06-20", "excursion", "mint", "wide"),
  g("g7", "evangelism", "Neighbourhood Outreach", "Handing out tracts and invitations to the Christmas party.", "2025-12-06", "evangelism", "blue", "tall"),
  g("g8", "children-harvest", "Children's Harvest 2025", "The Beginners' harvest song — with actions, of course.", "2025-10-26", "music", "sun", "square", "video"),
  g("g9", "hosanna", "Palm Sunday 2026", "Primary classes leading 'Hosanna in the Highest'.", "2026-03-29", "worship", "sun", "square"),
  g("g10", "camping", "Children's Ministry Camp 2026", "Tents up, ready for three days of games and Bible teaching.", "2026-08-12", "camping", "ink", "wide"),
  g("g11", "graduation", "Seniors Graduation 2026", "Teachers praying over the graduating Seniors.", "2026-07-12", "prayer", "ink", "tall"),
  g("g12", "parents-day", "Parents Day 2026", "Handmade cards — every one a masterpiece.", "2026-05-10", "craft", "sun", "wide"),
  g("g13", "excursion", "Trip to the Botanical Gardens", "Picnic lunch under the big trees.", "2026-06-20", "sunrise", "sun", "square"),
  g("g14", "evangelism", "Neighbourhood Outreach", "Singing on the church steps for passers-by.", "2025-12-06", "music", "mint", "square"),
];

/** Authors are teachers (by id). Children never post and are never named or tagged. */
export const posts: Post[] = [
  {
    id: "p1", kind: "verse", authorId: "abena-owusu", createdAt: "2026-10-07T07:30:00Z", pinned: true,
    body: "This Sunday every class is learning the parable of the Good Samaritan. Here's the verse to practise at home this week 👇",
    verse: { text: "Love your neighbour as yourself.", reference: "Luke 10:27" },
    reactions: { love: 64, laugh: 0, wow: 3, pray: 41, like: 22 },
    comments: [
      { id: "c1", author: "Ama (parent)", authorRole: "parent", body: "We've stuck it on the fridge! My son is saying it at breakfast every morning 😄", createdAt: "2026-10-07T09:12:00Z", likes: 12,
        replies: [{ id: "c1r1", author: "Abena Owusu", authorRole: "teacher", body: "Love that! Tell him we'll be asking on Sunday 🙌", createdAt: "2026-10-07T10:01:00Z", likes: 5 }] },
    ],
  },
  {
    id: "p2", kind: "video", authorId: "daniel-asante", createdAt: "2026-10-05T16:20:00Z",
    body: "Primary 2 learned this week's memory verse as a song. Play it on the way to school and see if it sticks! 🎶",
    media: { alt: "Teacher with a guitar leading a memory verse song", scene: "music", tone: "mint", duration: "0:48" },
    reactions: { love: 88, laugh: 14, wow: 9, pray: 6, like: 37 },
    comments: [
      { id: "c2", author: "Kofi (parent)", authorRole: "parent", body: "Stuck in my head now too. Thank you Bro Daniel!", createdAt: "2026-10-05T18:40:00Z", likes: 8 },
      { id: "c3", author: "Efua (parent)", authorRole: "parent", body: "Could we get the chords for home?", createdAt: "2026-10-05T19:02:00Z", likes: 3,
        replies: [{ id: "c3r1", author: "Daniel Asante", authorRole: "teacher", body: "Yes — added to the Primary 2 resources page 🎸", createdAt: "2026-10-05T20:15:00Z", likes: 4 }] },
    ],
  },
  {
    id: "p3", kind: "event", authorId: "yaw-amponsah", createdAt: "2026-10-03T11:00:00Z",
    body: "Save the date! Our Children's Harvest is coming up. Children can bring a gift of food or school supplies for our partner schools 🧺",
    event: { title: "Children's Harvest Thanksgiving", date: "2026-10-25", time: "9:00 am", location: "Main Auditorium" },
    reactions: { love: 52, laugh: 0, wow: 11, pray: 18, like: 40 },
    comments: [],
  },
  {
    id: "p4", kind: "image", authorId: "esi-boateng", createdAt: "2026-09-28T13:45:00Z",
    body: "Beginners built Zacchaeus' tree today — and every single leaf has a name on it, because Jesus knows each of us by name 🌳💛",
    media: { alt: "A paper tree on the classroom wall covered in leaves", scene: "craft", tone: "sun" },
    reactions: { love: 120, laugh: 6, wow: 15, pray: 12, like: 44 },
    comments: [
      { id: "c4", author: "Adwoa (parent)", authorRole: "parent", body: "She came home so proud of her leaf ❤️", createdAt: "2026-09-28T15:10:00Z", likes: 9 },
    ],
  },
  {
    id: "p5", kind: "announcement", authorId: "abena-owusu", createdAt: "2026-09-24T08:00:00Z",
    body: "📣 New check-in from this Sunday: please collect your family QR card at the welcome desk. Only the adults listed on the card can collect children after service. Thank you for helping us keep everyone safe!",
    reactions: { love: 30, laugh: 0, wow: 2, pray: 9, like: 71 },
    comments: [],
  },
  {
    id: "p6", kind: "text", authorId: "kwame-mensah", createdAt: "2026-09-21T17:30:00Z",
    body: "Seniors asked brilliant questions today about Daniel and standing firm when friends don't share your faith. Parents — ask them what they'd do in Daniel's shoes. You might be surprised 🦁",
    reactions: { love: 41, laugh: 2, wow: 7, pray: 19, like: 26 },
    comments: [],
  },
];
