import type { BibleLesson, ClassGroup, ClassInfo, GroupInfo } from "@/lib/types";

export const groups: GroupInfo[] = [
  { id: "beginners", name: "Beginners", ages: "Ages 3–5", tone: "sun", scene: "craft", blurb: "Short stories, songs with actions and hands-on play for our youngest learners." },
  { id: "primary", name: "Primary", ages: "Ages 6–8", tone: "blue", scene: "bible", blurb: "Bible stories told with drama and crafts, plus first steps in finding verses." },
  { id: "juniors", name: "Juniors", ages: "Ages 9–10", tone: "mint", scene: "music", blurb: "Exploring the big story of the Bible, learning to pray aloud and serve others." },
  { id: "seniors", name: "Seniors", ages: "Ages 11–13", tone: "lilac", scene: "prayer", blurb: "Discussion, real questions and building a faith that's ready for secondary school." },
];

export const classes: ClassInfo[] = [
  { id: "beginners-1", name: "Beginners 1", group: "beginners", ages: "Age 3–4", room: "Sunshine Room", teacherIds: ["esi-boateng"], description: "A gentle first classroom: we sit on the story mat, sing, pray and learn one big truth each week through play." },
  { id: "beginners-2", name: "Beginners 2", group: "beginners", ages: "Age 4–5", room: "Rainbow Room", teacherIds: ["esi-boateng", "akosua-darko"], description: "Story, song and craft, with simple memory verses and lots of practice saying thank you to God." },
  { id: "primary-1", name: "Primary 1", group: "primary", ages: "Age 6", room: "Olive Room", teacherIds: ["daniel-asante"], description: "Children learn to retell Bible stories in order and start reading short verses for themselves." },
  { id: "primary-2", name: "Primary 2", group: "primary", ages: "Age 7", room: "Cedar Room", teacherIds: ["daniel-asante"], description: "Drama, music and craft help children see how each story shows who God is." },
  { id: "primary-3", name: "Primary 3", group: "primary", ages: "Age 8", room: "Palm Room", teacherIds: ["grace-adjei"], description: "Children use their own Bibles each week, learning the books of the Bible and how to find a verse." },
  { id: "juniors-1", name: "Juniors 1", group: "juniors", ages: "Age 9", room: "Harbour Room", teacherIds: ["samuel-ofori"], description: "Small-group discussion, Bible detective work and practical ways to live out each lesson at school." },
  { id: "juniors-2", name: "Juniors 2", group: "juniors", ages: "Age 10", room: "Lighthouse Room", teacherIds: ["samuel-ofori", "yaw-amponsah"], description: "Juniors start leading prayer and reading aloud, and plan one service project each term." },
  { id: "seniors-1", name: "Seniors 1", group: "seniors", ages: "Age 11–12", room: "Summit Room", teacherIds: ["kwame-mensah"], description: "Honest questions welcome. Seniors dig into context, apply Scripture to real life and practise sharing their faith." },
  { id: "seniors-2", name: "Seniors 2", group: "seniors", ages: "Age 12–13", room: "Horizon Room", teacherIds: ["kwame-mensah"], description: "Preparing for the move to youth church with deeper study, mentoring and leadership opportunities." },
];

/* ------------------------------------------------------------------ */
/* Lessons. Every class studies the same passage each week, pitched   */
/* at its own level. Teachers edit these in the admin dashboard; this */
/* file is the seed data used when no database is connected.          */
/* ------------------------------------------------------------------ */

type Level = Pick<BibleLesson, "objective" | "questions" | "activity" | "memoryVerse">;

interface WeeklyPassage {
  slug: string;
  date: string;
  title: string;
  reference: string;
  topic: string;
  story: string[];
  prayer: string;
  levels: Record<ClassGroup, Level>;
}

const passages: WeeklyPassage[] = [
  {
    slug: "the-good-samaritan",
    date: "2026-10-11",
    title: "The Good Samaritan",
    reference: "Luke 10:25–37",
    topic: "Loving our neighbour",
    story: [
      "One day a man who knew a lot about God's law asked Jesus a question: \"What must I do to have eternal life?\" Jesus asked what the law said, and the man answered: love God with everything you have, and love your neighbour as yourself. \"Then who is my neighbour?\" the man asked.",
      "Jesus told a story. A man was walking from Jerusalem down to Jericho when robbers attacked him. They took his clothes, hurt him badly and left him lying by the road.",
      "A priest came along the road. He saw the man — and crossed to the other side. Then a Levite, who helped in the temple, came by. He looked — and he crossed to the other side too.",
      "Then a Samaritan came. Samaritans and Jews did not get along, but when this Samaritan saw the hurt man, he felt sorry for him. He bandaged his wounds, lifted him onto his own donkey and took him to an inn. He even paid the innkeeper to look after him until he came back.",
      "\"Which of these three was a neighbour to the man?\" Jesus asked. \"The one who showed mercy,\" came the answer. Jesus said, \"Go and do the same.\"",
    ],
    prayer: "Dear God, thank You for loving us first. Help us to notice people who are hurting, and give us brave, kind hearts to help them — even when it's hard. In Jesus' name, Amen.",
    levels: {
      beginners: {
        memoryVerse: { text: "Love each other.", reference: "John 15:12" },
        objective: "Children will know that God wants us to be kind and help people who are hurt.",
        questions: ["Who was hurt in the story?", "Who stopped to help?", "How can you be kind to a friend this week?"],
        activity: { title: "Bandage helpers", steps: ["Give each child a paper figure and some plaster stickers.", "Retell the story while children 'bandage' the hurt man.", "Pray together for someone who is poorly."] },
      },
      primary: {
        memoryVerse: { text: "Love your neighbour as yourself.", reference: "Luke 10:27" },
        objective: "Children will be able to retell the parable and name one practical way to show kindness to someone different from them.",
        questions: ["Why do you think the priest and Levite walked past?", "What three things did the Samaritan do to help?", "Who is someone at school who might need a kind friend?"],
        activity: { title: "Kindness map", steps: ["Draw the road from Jerusalem to Jericho on a long sheet.", "Children add the three travellers and colour the Samaritan's donkey.", "On the back, each child writes or draws one kind thing they'll do this week."] },
      },
      juniors: {
        memoryVerse: { text: "You shall love the Lord your God with all your heart… and your neighbour as yourself.", reference: "Luke 10:27" },
        objective: "Children will understand that Jesus redefined 'neighbour' to include anyone in need, and plan a real act of mercy.",
        questions: ["Why was it surprising that the hero was a Samaritan?", "What did helping cost the Samaritan — time, money, comfort?", "What makes it hard for us to stop and help?", "How is Jesus like the Good Samaritan to us?"],
        activity: { title: "Mercy mission", steps: ["In groups, list people in your school or street who might be 'by the road'.", "Choose one realistic act of mercy for the group.", "Report back next Sunday on what happened."] },
      },
      seniors: {
        memoryVerse: { text: "You shall love the Lord your God with all your heart, with all your soul, with all your strength, and with all your mind; and your neighbour as yourself.", reference: "Luke 10:27" },
        objective: "Students will examine the historical tension between Jews and Samaritans and wrestle with what loving 'across the road' looks like for them today.",
        questions: ["The lawyer asked 'Who is my neighbour?' — what question did Jesus answer instead?", "Who might be 'Samaritans' to people your age today?", "Is it possible to love God without loving people? Why not?", "Where does mercy cost you something this week?"],
        activity: { title: "Modern retelling", steps: ["In pairs, rewrite the parable set in Accra today.", "Decide who the three passers-by are and why they don't stop.", "Perform or read your version; discuss what surprised you."] },
      },
    },
  },
  {
    slug: "jesus-calms-the-storm",
    date: "2026-10-04",
    title: "Jesus Calms the Storm",
    reference: "Mark 4:35–41",
    topic: "Trusting Jesus when we're afraid",
    story: [
      "At the end of a long day of teaching, Jesus said to His disciples, \"Let's cross to the other side of the lake.\" They got into a boat, and Jesus, tired, fell asleep on a cushion at the back.",
      "Suddenly a fierce storm blew up. Huge waves crashed over the sides, and the boat began to fill with water. The disciples were terrified.",
      "They woke Jesus: \"Teacher, don't You care that we're going to drown?\" Jesus stood up and spoke to the wind and the waves: \"Peace! Be still!\" At once the wind stopped and everything became completely calm.",
      "\"Why are you so afraid?\" Jesus asked. \"Do you still not have faith?\" The disciples were amazed and asked each other, \"Who is this? Even the wind and waves obey Him!\"",
    ],
    prayer: "Jesus, You are stronger than every storm. When I feel scared, help me remember You are with me and I can trust You. Amen.",
    levels: {
      beginners: { memoryVerse: { text: "When I am afraid, I will trust in You.", reference: "Psalm 56:3" }, objective: "Children will know that Jesus is with them when they are scared.", questions: ["Where was Jesus sleeping?", "What did Jesus say to the storm?", "What can you do when you feel scared?"], activity: { title: "Paper-plate boats", steps: ["Fold a paper plate into a boat.", "Add stick-on disciples and a sleeping Jesus.", "Shout 'Peace, be still!' together."] } },
      primary: { memoryVerse: { text: "When I am afraid, I will put my trust in You.", reference: "Psalm 56:3" }, objective: "Children will learn that Jesus has power over nature and that they can pray when afraid.", questions: ["How did the disciples feel?", "What happened when Jesus spoke?", "What 'storms' make you feel scared?"], activity: { title: "Storm in a bottle", steps: ["Fill a bottle with water and a drop of blue colour.", "Shake it to make a storm, then watch it calm.", "Talk about how Jesus brings calm."] } },
      juniors: { memoryVerse: { text: "Who then is this, that even the wind and the sea obey Him?", reference: "Mark 4:41" }, objective: "Children will see this miracle as evidence of who Jesus is, not just what He can do.", questions: ["Why might the disciples have thought Jesus didn't care?", "What does this miracle tell us about who Jesus is?", "How can faith and fear exist at the same time?"], activity: { title: "Storm journal", steps: ["Write about a time you felt afraid.", "Find one verse that speaks to that fear.", "Share with a partner if you're comfortable."] } },
      seniors: { memoryVerse: { text: "He awoke, and rebuked the wind, and said to the sea, 'Peace! Be still!' The wind ceased, and there was a great calm.", reference: "Mark 4:39" }, objective: "Students will connect this passage to Old Testament pictures of God ruling the sea and consider what that means for anxiety today.", questions: ["Read Psalm 107:23–30. What connection do you notice?", "Jesus calmed the storm — but He was also in the boat. Why does that matter?", "Does faith mean we never feel afraid?"], activity: { title: "Psalm + Gospel study", steps: ["Compare Mark 4 with Psalm 107 in pairs.", "List three things both passages say about God.", "Write a short prayer for someone facing a 'storm'."] } },
    },
  },
  {
    slug: "zacchaeus",
    date: "2026-09-27",
    title: "Zacchaeus Meets Jesus",
    reference: "Luke 19:1–10",
    topic: "Jesus came to seek and save the lost",
    story: [
      "Jesus was passing through Jericho, and a big crowd lined the streets. A man named Zacchaeus wanted to see Him. Zacchaeus was a chief tax collector — rich, and not very liked, because he cheated people.",
      "Zacchaeus was also short, so he couldn't see over the crowd. He ran ahead and climbed a sycamore-fig tree.",
      "When Jesus reached the spot, He looked up and said, \"Zacchaeus, come down quickly! I must stay at your house today.\" The crowd grumbled, but Zacchaeus hurried down, full of joy.",
      "Zacchaeus stood up and said, \"Lord, I'll give half of what I own to the poor, and if I've cheated anyone, I'll pay them back four times as much.\" Jesus said, \"Today salvation has come to this house. The Son of Man came to seek and to save the lost.\"",
    ],
    prayer: "Thank You, Jesus, that You know my name and want to be my friend. Help me to follow You and to make things right when I get things wrong. Amen.",
    levels: {
      beginners: { memoryVerse: { text: "Jesus came to save.", reference: "Luke 19:10" }, objective: "Children will know that Jesus knows their name and loves them.", questions: ["Where did Zacchaeus climb?", "What did Jesus call him?", "Does Jesus know your name?"], activity: { title: "Name tree", steps: ["Each child adds a leaf with their name to a paper tree.", "Sing 'Jesus knows my name'.", "Thank God for knowing each of us."] } },
      primary: { memoryVerse: { text: "The Son of Man came to seek and to save that which was lost.", reference: "Luke 19:10" }, objective: "Children will learn that meeting Jesus changed how Zacchaeus lived.", questions: ["Why didn't people like Zacchaeus?", "What did Zacchaeus do after meeting Jesus?", "Is there something you need to make right?"], activity: { title: "Before & after", steps: ["Fold paper in half.", "Draw Zacchaeus before and after meeting Jesus.", "Write one word for each side."] } },
      juniors: { memoryVerse: { text: "For the Son of Man came to seek and to save that which was lost.", reference: "Luke 19:10" }, objective: "Children will see that Jesus welcomes people others reject, and that real faith shows in changed actions.", questions: ["Why did the crowd grumble?", "What does Zacchaeus' promise show about his heart?", "Who might feel left out in your class?"], activity: { title: "Welcome plan", steps: ["Brainstorm ways to include someone new.", "Choose one to try this week.", "Pray for courage."] } },
      seniors: { memoryVerse: { text: "For the Son of Man came to seek and to save that which was lost.", reference: "Luke 19:10" }, objective: "Students will explore grace and repentance — which comes first, and why it matters.", questions: ["Did Jesus ask Zacchaeus to change before He welcomed him?", "What's the difference between being sorry and making restitution?", "How does this story challenge how we treat 'outsiders'?"], activity: { title: "Grace debate", steps: ["Split into two groups.", "Argue: 'Zacchaeus changed so Jesus accepted him' vs 'Jesus accepted him so he changed'.", "Read Romans 5:8 and discuss."] } },
    },
  },
];

/** Builds the per-class lessons from the weekly passages. */
export const lessons: BibleLesson[] = classes.flatMap((c) =>
  passages.map((p) => {
    const level = p.levels[c.group];
    return {
      id: p.slug,
      classId: c.id,
      date: p.date,
      title: p.title,
      reference: p.reference,
      topic: p.topic,
      story: p.story,
      prayer: p.prayer,
      ...level,
      resources: [
        { label: `${p.title} — take-home sheet`, type: "pdf" as const, url: "#", size: "420 KB" },
        { label: "Colouring page", type: "image" as const, url: "#", size: "1.1 MB" },
        { label: "Memory verse song", type: "audio" as const, url: "#", size: "2:14" },
      ],
    };
  }),
);
