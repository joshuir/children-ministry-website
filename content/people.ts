import type { HistoryItem, Teacher } from "@/lib/types";

// Placeholder teachers — replace with real staff (photo uploads go to Supabase Storage).
export const teachers: Teacher[] = [
  { id: "abena-owusu", name: "Abena Owusu", role: "Children's Ministry Director", tone: "blue", classIds: [], since: "2014", favouriteVerse: { text: "I can do all this through him who gives me strength.", reference: "Philippians 4:13" }, funFact: "Has taught every single class at least once — including a very noisy Beginners Christmas.", checked: true, featured: true, bio: "Abena has led Children's Ministry for twelve years. She trains our teachers, writes the lesson plans and still can't resist teaching Seniors once a month." },
  { id: "kwame-mensah", name: "Kwame Mensah", role: "Senior Class Teacher", tone: "ink", classIds: ["seniors-1", "seniors-2"], since: "2017", favouriteVerse: { text: "The heavens declare the glory of God.", reference: "Psalm 19:1" }, funFact: "Keeps a telescope in his car for surprise stargazing at camp.", checked: true, bio: "A secondary-school science teacher by week, Kwame loves the big questions older children ask — and helping them find answers in Scripture." },
  { id: "esi-boateng", name: "Esi Boateng", role: "Beginners Lead Teacher", tone: "sun", classIds: ["beginners-1", "beginners-2"], since: "2015", favouriteVerse: { text: "The Lord is my shepherd, I lack nothing.", reference: "Psalm 23:1" }, funFact: "Lulu the puppet lamb has her own Sunday name badge.", checked: true, bio: "Esi brings Bible stories to life with puppets, songs and a very patient lamb named Lulu. Our youngest friends adore her." },
  { id: "daniel-asante", name: "Daniel Asante", role: "Primary Class Teacher", tone: "mint", classIds: ["primary-1", "primary-2"], since: "2018", favouriteVerse: { text: "Sing to the Lord a new song.", reference: "Psalm 96:1" }, funFact: "Has written over 40 memory-verse songs (and counting).", checked: true, bio: "Daniel plays guitar for worship and turns every memory verse into a song children are still humming on Wednesday." },
  { id: "grace-adjei", name: "Grace Adjei", role: "Primary Class Teacher", tone: "sun", classIds: ["primary-3"], since: "2019", favouriteVerse: { text: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" }, funFact: "Knows every child’s favourite biscuit for snack time.", checked: true, bio: "Grace is a nurse and a mum of three. She makes sure every child feels noticed, prayed for and safe." },
  { id: "samuel-ofori", name: "Samuel Ofori", role: "Juniors Class Teacher", tone: "lilac", classIds: ["juniors-1", "juniors-2"], since: "2016", favouriteVerse: { text: "Whatever you do, work at it with all your heart.", reference: "Colossians 3:23" }, funFact: "Once refereed a football match in a Christmas jumper — in July.", checked: true, bio: "Samuel coaches the church football team and helps Juniors build real friendships around God's Word." },
  { id: "akosua-darko", name: "Akosua Darko", role: "Beginners Assistant", tone: "mint", classIds: ["beginners-2"], since: "2021", favouriteVerse: { text: "Let your light shine before others.", reference: "Matthew 5:16" }, funFact: "Glitter expert. Has never met a craft she couldn’t rescue.", checked: true, bio: "Akosua leads crafts and snack time, and keeps our Beginners classroom the brightest room in the building." },
  { id: "yaw-amponsah", name: "Yaw Amponsah", role: "Safeguarding Lead", tone: "blue", classIds: ["juniors-2"], since: "2012", favouriteVerse: { text: "Be strong and courageous.", reference: "Joshua 1:9" }, funFact: "Our longest-serving teacher — he taught some of today’s parents.", checked: true, bio: "Yaw oversees check-in, teacher vetting and our safeguarding training, so parents can relax every Sunday." },
];

export const history: HistoryItem[] = [
  { year: "2006", title: "Twelve children, one room", body: "Our children's ministry began in the church vestry with twelve children, two volunteer teachers and a borrowed flannel board.", image: { alt: "A small group of children around a flannel board", scene: "bible", tone: "sun" } },
  { year: "2011", title: "Classes by age", body: "As numbers grew past sixty, we split into Beginners, Primary and Juniors so every child could learn at the right level.", image: { alt: "Classroom signs for Beginners, Primary and Juniors", scene: "craft", tone: "mint" } },
  { year: "2015", title: "Our first children's harvest", body: "Children led their own harvest service, raising food and school supplies for two partner schools in the Central Region.", image: { alt: "Baskets of produce at the children's harvest", scene: "harvest", tone: "sun" } },
  { year: "2019", title: "Seniors and safer check-in", body: "We launched Seniors classes for ages 11–13 and introduced secure check-in, safeguarding training and police background checks for all teachers.", image: { alt: "Teachers at a safeguarding training session", scene: "prayer", tone: "lilac" } },
  { year: "2023", title: "A new children's wing", body: "Nine bright classrooms opened, each designed around how children of that age learn, play and pray.", image: { alt: "A bright new children's classroom", scene: "sunrise", tone: "blue" } },
  { year: "2026", title: "Our ministry goes digital", body: "Families can now follow each week's lesson at home through this website and the Children's Ministry app.", image: { alt: "A phone showing the Children's Ministry app", scene: "app", tone: "sun" } },
];

export const vision = {
  title: "Our vision",
  statement: "A generation of children who know God, love His Word and shine His light in their homes, schools and communities.",
};

export const mission = {
  title: "Our mission",
  intro: "We pursue that vision through four everyday commitments:",
  pillars: [
    { title: "Teach the whole Bible", body: "A three-year teaching plan that walks children through the big story of Scripture, from Creation to the New Creation." },
    { title: "Partner with parents", body: "Weekly take-home guides and app content so faith conversations continue around the dinner table." },
    { title: "Train and care for teachers", body: "Ongoing training in Bible teaching, child development and safeguarding for every volunteer." },
    { title: "Serve our city", body: "Harvests, outreaches and evangelism days where children learn that faith is something you live out." },
  ],
};
