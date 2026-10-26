import type { LearnCategory, LearnChallenge, LearnLesson, LearnTone, QuizLevel, QuizQuestion } from "@/lib/types";

/**
 * Seed content for the Bible learning platform: categories, journey sections, lessons, daily
 * challenges and the question bank. Staff manage all of it in the content manager. Every question needs its own id, and the site
 * ignores a question whose wording repeats another one, so children never see duplicates.
 *
 * Verse wording follows the King James Version (public domain).
 */

export const CATEGORIES: LearnCategory[] = [
  { id: "scripture", title: "Scripture quiz", blurb: "Quick questions about the big stories of the Bible.", tone: "blue", icon: "book" },
  { id: "verses", title: "Memory verses", blurb: "Fill gaps and build verses word by word.", tone: "sun", icon: "sparkles" },
  { id: "characters", title: "Bible people", blurb: "Kings, prophets, disciples and brave helpers.", tone: "coral", icon: "users" },
  { id: "places", title: "Bible places", blurb: "Towns, rivers, mountains and gardens.", tone: "mint", icon: "map" },
  { id: "blanks", title: "Fill the gap", blurb: "Finish sentences from favourite Bible stories.", tone: "lilac", icon: "blank" },
  { id: "puzzles", title: "Word puzzles", blurb: "Unscramble the letters to find Bible words.", tone: "sun", icon: "puzzle" },
  { id: "spelling", title: "Spelling bee", blurb: "Spell Bible names and words, letter by letter.", tone: "coral", icon: "spell" },
  { id: "matching", title: "Match up", blurb: "Pair people, places and stories that belong together.", tone: "blue", icon: "link" },
  { id: "timeline", title: "Story order", blurb: "Put Bible events in the order they happened.", tone: "mint", icon: "clock" },
  { id: "writing", title: "Write it", blurb: "Type answers and write your own short prayers.", tone: "lilac", icon: "pen" },
];

/** Journey sections: each one matches a question difficulty. Growing in faith, Colossians 2:7. */
export const SECTIONS: { id: QuizLevel; title: string; blurb: string; tone: LearnTone }[] = [
  { id: 1, title: "Seeds", blurb: "First stories and simple words.", tone: "mint" },
  { id: 2, title: "Sprouts", blurb: "Heroes, journeys and favourite verses.", tone: "sun" },
  { id: 3, title: "Branches", blurb: "Kings, prophets and the life of Jesus.", tone: "blue" },
  { id: 4, title: "Trees", blurb: "Deeper stories and longer verses.", tone: "coral" },
  { id: 5, title: "Fruit", blurb: "Challenges for Bible champions.", tone: "lilac" },
];

/** Age groups decide where a child's journey starts; earlier sections stay open for practice. */
export const LEVELS = [
  { id: 1 as const, label: "Little learners", ages: "Ages 3–6", start: 1 as QuizLevel },
  { id: 2 as const, label: "Explorers", ages: "Ages 7–9", start: 2 as QuizLevel },
  { id: 3 as const, label: "Champions", ages: "Ages 10–13", start: 3 as QuizLevel },
];

export const CHALLENGES: LearnChallenge[] = [
  { id: "ch-xp-30", title: "Earn 30 XP", metric: "xp", target: 30, reward: 10 },
  { id: "ch-xp-60", title: "Earn 60 XP", metric: "xp", target: 60, reward: 20 },
  { id: "ch-correct-10", title: "Get 10 answers right", metric: "correct", target: 10, reward: 10 },
  { id: "ch-correct-20", title: "Get 20 answers right", metric: "correct", target: 20, reward: 20 },
  { id: "ch-lessons-2", title: "Finish 2 lessons", metric: "lessons", target: 2, reward: 15 },
  { id: "ch-perfect", title: "Finish a lesson with no mistakes", metric: "perfect", target: 1, reward: 20 },
  { id: "ch-verses", title: "Answer 5 memory verse questions", metric: "category", category: "verses", target: 5, reward: 15 },
  { id: "ch-people", title: "Answer 5 Bible people questions", metric: "category", category: "characters", target: 5, reward: 15 },
  { id: "ch-timeline", title: "Put 3 Bible stories in order", metric: "category", category: "timeline", target: 3, reward: 15 },
  { id: "ch-spelling", title: "Spell 4 Bible words", metric: "category", category: "spelling", target: 4, reward: 15 },
];

/** Builds the default journey: one lesson per category per section (where there are enough questions) and a checkpoint. */
export function defaultLessons(bank: QuizQuestion[], cats: LearnCategory[] = CATEGORIES): LearnLesson[] {
  const out: LearnLesson[] = [];
  for (const sec of SECTIONS) {
    for (const c of cats) {
      const n = bank.filter((x) => x.track === c.id && x.level === sec.id).length;
      if (n >= 3) out.push({ id: `s${sec.id}-${c.id}`, title: c.title, section: sec.id, category: c.id, size: Math.min(6, n) });
    }
    out.push({ id: `s${sec.id}-checkpoint`, title: `${sec.title} checkpoint`, section: sec.id, category: "mixed", size: 8 });
  }
  return out;
}

const q = (id: string, rest: Omit<QuizQuestion, "id">): QuizQuestion => ({ id, ...rest });

export const quiz: QuizQuestion[] = [
  /* ---------------------------------------------------------------- Bible stories */
  q("sc-noah-ark", { track: "scripture", level: 1, kind: "choice", prompt: "Who built a big ark before the flood?", answer: "Noah", options: ["Moses", "David", "Peter"], reference: "Genesis 6:14", explain: "God told Noah to build an ark to keep his family and the animals safe." }),
  q("sc-first-day", { track: "scripture", level: 1, kind: "choice", prompt: "What did God make on the very first day?", answer: "Light", options: ["Animals", "People", "Trees"], reference: "Genesis 1:3–5" }),
  q("sc-big-fish", { track: "scripture", level: 1, kind: "choice", prompt: "Who was swallowed by a great fish?", answer: "Jonah", options: ["Daniel", "Paul", "Elijah"], reference: "Jonah 1:17" }),
  q("sc-twelve", { track: "scripture", level: 1, kind: "choice", prompt: "How many disciples did Jesus choose?", answer: "12", options: ["3", "7", "10"], reference: "Mark 3:14" }),
  q("sc-goliath-tf", { track: "scripture", level: 1, kind: "truefalse", prompt: "David beat the giant Goliath with a sling and a stone.", answer: "true", reference: "1 Samuel 17:49" }),
  q("sc-lions", { track: "scripture", level: 1, kind: "choice", prompt: "Who was put in a den of lions but kept safe by God?", answer: "Daniel", options: ["Joseph", "Samson", "Jonah"], reference: "Daniel 6:22" }),
  q("sc-loaves", { track: "scripture", level: 1, kind: "choice", prompt: "What did Jesus use to feed 5,000 people?", answer: "Five loaves and two fish", options: ["Seven cakes", "Ten apples", "One big pot of rice"], reference: "John 6:9–11" }),
  q("sc-rest-day", { track: "scripture", level: 1, kind: "choice", prompt: "On which day did God rest after making everything?", answer: "The seventh day", options: ["The first day", "The third day", "The tenth day"], reference: "Genesis 2:2" }),
  q("sc-moses-basket", { track: "scripture", level: 1, kind: "truefalse", prompt: "Baby Moses was hidden in a basket among the reeds by the river.", answer: "true", reference: "Exodus 2:3" }),
  q("sc-rainbow", { track: "scripture", level: 1, kind: "truefalse", prompt: "After the flood, God put a rainbow in the sky as a promise.", answer: "true", reference: "Genesis 9:13" }),

  q("sc-exodus-leader", { track: "scripture", level: 2, kind: "choice", prompt: "Who led the Israelites out of Egypt?", answer: "Moses", options: ["Abraham", "Joshua", "Elijah"], reference: "Exodus 12–14" }),
  q("sc-water-wine", { track: "scripture", level: 2, kind: "choice", prompt: "At a wedding, Jesus turned water into…", answer: "Wine", options: ["Milk", "Honey", "Oil"], reference: "John 2:9" }),
  q("sc-denied", { track: "scripture", level: 2, kind: "choice", prompt: "Which disciple said three times that he did not know Jesus?", answer: "Peter", options: ["John", "Thomas", "Andrew"], reference: "Luke 22:61" }),
  q("sc-rain-days", { track: "scripture", level: 2, kind: "choice", prompt: "For how many days and nights did it rain in the flood?", answer: "40", options: ["7", "12", "100"], reference: "Genesis 7:12" }),
  q("sc-joseph-egypt", { track: "scripture", level: 2, kind: "choice", prompt: "Who was sold by his brothers but later became a ruler in Egypt?", answer: "Joseph", options: ["Benjamin", "Jacob", "Esau"], reference: "Genesis 37; 41" }),
  q("sc-walk-water", { track: "scripture", level: 2, kind: "choice", prompt: "Which disciple stepped out of the boat to walk on the water to Jesus?", answer: "Peter", options: ["James", "Matthew", "Philip"], reference: "Matthew 14:29" }),
  q("sc-first-king", { track: "scripture", level: 2, kind: "choice", prompt: "Who was the first king of Israel?", answer: "Saul", options: ["David", "Solomon", "Samuel"], reference: "1 Samuel 10:1" }),
  q("sc-baptism-tf", { track: "scripture", level: 2, kind: "truefalse", prompt: "John the Baptist baptised Jesus.", answer: "true", reference: "Matthew 3:13–16" }),
  q("sc-samaritan", { track: "scripture", level: 2, kind: "choice", prompt: "In Jesus' story, who stopped to help the hurt man on the road?", answer: "A Samaritan", options: ["A priest", "A soldier", "A king"], reference: "Luke 10:33" }),
  q("sc-lost-sheep", { track: "scripture", level: 2, kind: "truefalse", prompt: "In the parable, the shepherd left 99 sheep to look for one that was lost.", answer: "true", reference: "Luke 15:4" }),

  q("sc-66-books", { track: "scripture", level: 3, kind: "choice", prompt: "How many books are in the Bible?", answer: "66", options: ["39", "27", "72"], explain: "39 in the Old Testament and 27 in the New Testament." }),
  q("sc-first-book", { track: "scripture", level: 3, kind: "choice", prompt: "Which book comes first in the Bible?", answer: "Genesis", options: ["Exodus", "Matthew", "Psalms"] }),
  q("sc-letters", { track: "scripture", level: 3, kind: "choice", prompt: "Who wrote many New Testament letters, such as Romans and Galatians?", answer: "Paul", options: ["Peter", "Luke", "James"] }),
  q("sc-saul-paul", { track: "scripture", level: 3, kind: "choice", prompt: "Paul was also known by which name?", answer: "Saul", options: ["Simon", "Silas", "Stephen"], reference: "Acts 13:9" }),
  q("sc-sinai-tf", { track: "scripture", level: 3, kind: "truefalse", prompt: "God gave Moses the Ten Commandments on Mount Sinai.", answer: "true", reference: "Exodus 19–20" }),
  q("sc-dreams", { track: "scripture", level: 3, kind: "choice", prompt: "Who explained King Nebuchadnezzar's dream with God's help?", answer: "Daniel", options: ["Ezra", "Nehemiah", "Jeremiah"], reference: "Daniel 2" }),
  q("sc-last-book", { track: "scripture", level: 3, kind: "truefalse", prompt: "Revelation is the last book of the Bible.", answer: "true" }),
  q("sc-gospel", { track: "scripture", level: 3, kind: "choice", prompt: "Which of these is one of the four Gospels?", answer: "Luke", options: ["Acts", "Romans", "Psalms"] }),
  q("sc-plagues", { track: "scripture", level: 3, kind: "choice", prompt: "How many plagues did God send on Egypt?", answer: "10", options: ["3", "7", "12"], reference: "Exodus 7–12" }),
  q("sc-pentecost-tf", { track: "scripture", level: 3, kind: "truefalse", prompt: "The Holy Spirit came on the disciples on the day of Pentecost.", answer: "true", reference: "Acts 2:1–4" }),

  /* ---------------------------------------------------------------- Memory verses */
  q("mv-god-is-love", { track: "verses", level: 1, kind: "order", prompt: "Build the verse.", answer: "God is love.", reference: "1 John 4:8" }),
  q("mv-shepherd", { track: "verses", level: 1, kind: "fill", prompt: "The LORD is my ___; I shall not want.", answer: "shepherd", options: ["king", "friend", "teacher"], reference: "Psalm 23:1" }),
  q("mv-beginning", { track: "verses", level: 1, kind: "fill", prompt: "In the beginning God created the heaven and the ___.", answer: "earth", options: ["sea", "stars", "trees"], reference: "Genesis 1:1" }),
  q("mv-pray", { track: "verses", level: 1, kind: "order", prompt: "Build the verse.", answer: "Pray without ceasing.", reference: "1 Thessalonians 5:17" }),
  q("mv-light-world", { track: "verses", level: 1, kind: "fill", prompt: "Ye are the ___ of the world.", answer: "light", options: ["salt", "king", "voice"], reference: "Matthew 5:14" }),

  q("mv-john316", { track: "verses", level: 2, kind: "fill", prompt: "For God so loved the ___, that he gave his only begotten Son.", answer: "world", options: ["church", "angels", "animals"], reference: "John 3:16" }),
  q("mv-lamp", { track: "verses", level: 2, kind: "fill", prompt: "Thy word is a ___ unto my feet, and a light unto my path.", answer: "lamp", options: ["road", "song", "shoe"], reference: "Psalm 119:105" }),
  q("mv-obey", { track: "verses", level: 2, kind: "order", prompt: "Build the verse.", answer: "Children, obey your parents in the Lord.", reference: "Ephesians 6:1" }),
  q("mv-this-day", { track: "verses", level: 2, kind: "fill", prompt: "This is the day which the LORD hath made; we will ___ and be glad in it.", answer: "rejoice", options: ["rest", "sleep", "travel"], reference: "Psalm 118:24" }),
  q("mv-the-way", { track: "verses", level: 2, kind: "choice", prompt: "Who said, “I am the way, the truth, and the life”?", answer: "Jesus", options: ["Moses", "Paul", "David"], reference: "John 14:6" }),
  q("mv-neighbour", { track: "verses", level: 2, kind: "order", prompt: "Build the verse.", answer: "Thou shalt love thy neighbour as thyself.", reference: "Luke 10:27" }),
  q("mv-all-things", { track: "verses", level: 2, kind: "fill", prompt: "I can do all things through ___ which strengtheneth me.", answer: "Christ", options: ["money", "friends", "strength"], reference: "Philippians 4:13" }),

  q("mv-trust", { track: "verses", level: 3, kind: "fill", prompt: "___ in the LORD with all thine heart; and lean not unto thine own understanding.", answer: "Trust", options: ["Sing", "Walk", "Wait"], reference: "Proverbs 3:5" }),
  q("mv-refuge", { track: "verses", level: 3, kind: "fill", prompt: "God is our ___ and strength, a very present help in trouble.", answer: "refuge", options: ["king", "shield", "song"], reference: "Psalm 46:1" }),
  q("mv-courage", { track: "verses", level: 3, kind: "order", prompt: "Build the verse.", answer: "Be strong and of a good courage.", reference: "Joshua 1:9" }),
  q("mv-care", { track: "verses", level: 3, kind: "fill", prompt: "Casting all your ___ upon him; for he careth for you.", answer: "care", options: ["money", "work", "joy"], reference: "1 Peter 5:7" }),
  q("mv-where-gen11", { track: "verses", level: 3, kind: "choice", prompt: "Where is the verse “In the beginning God created the heaven and the earth”?", answer: "Genesis 1:1", options: ["John 1:1", "Psalm 1:1", "Exodus 1:1"] }),
  q("mv-same", { track: "verses", level: 3, kind: "fill", prompt: "Jesus Christ the same ___, and to day, and for ever.", answer: "yesterday", options: ["morning", "always", "tonight"], reference: "Hebrews 13:8" }),
  q("mv-word-lamp-order", { track: "verses", level: 3, kind: "order", prompt: "Build the verse.", answer: "Thy word is a lamp unto my feet.", reference: "Psalm 119:105" }),

  /* ---------------------------------------------------------------- Bible people */
  q("ch-mary", { track: "characters", level: 1, kind: "choice", prompt: "What was the name of Jesus' mother?", answer: "Mary", options: ["Martha", "Ruth", "Sarah"], reference: "Luke 1:30–31" }),
  q("ch-adam", { track: "characters", level: 1, kind: "choice", prompt: "Who was the first man God made?", answer: "Adam", options: ["Noah", "Abraham", "Cain"], reference: "Genesis 2:7" }),
  q("ch-samson", { track: "characters", level: 1, kind: "choice", prompt: "Which very strong man had long hair?", answer: "Samson", options: ["Saul", "Goliath", "Gideon"], reference: "Judges 16:17" }),
  q("ch-shepherd-king", { track: "characters", level: 1, kind: "choice", prompt: "Which shepherd boy grew up to be a king?", answer: "David", options: ["Jonah", "Isaac", "Aaron"], reference: "1 Samuel 16:11–13" }),
  q("ch-eve", { track: "characters", level: 1, kind: "truefalse", prompt: "Eve was the first woman God made.", answer: "true", reference: "Genesis 2:22; 3:20" }),

  q("ch-isaac", { track: "characters", level: 2, kind: "choice", prompt: "Abraham and Sarah's son, born when they were very old, was called…", answer: "Isaac", options: ["Ishmael", "Jacob", "Joseph"], reference: "Genesis 21:2–3" }),
  q("ch-judas", { track: "characters", level: 2, kind: "choice", prompt: "Who handed Jesus over for thirty pieces of silver?", answer: "Judas Iscariot", options: ["Pontius Pilate", "Simon Peter", "Herod"], reference: "Matthew 26:14–15" }),
  q("ch-zacchaeus", { track: "characters", level: 2, kind: "choice", prompt: "Which tax collector climbed a tree to see Jesus?", answer: "Zacchaeus", options: ["Matthew", "Nicodemus", "Lazarus"], reference: "Luke 19:2–4" }),
  q("ch-esther", { track: "characters", level: 2, kind: "choice", prompt: "Which brave queen spoke to the king to save her people?", answer: "Esther", options: ["Jezebel", "Sheba", "Vashti"], reference: "Esther 4:16" }),
  q("ch-naomi", { track: "characters", level: 2, kind: "choice", prompt: "Ruth promised to stay with her mother-in-law. What was her name?", answer: "Naomi", options: ["Hannah", "Rachel", "Leah"], reference: "Ruth 1:16" }),
  q("ch-elijah", { track: "characters", level: 2, kind: "choice", prompt: "Which prophet went up to heaven in a whirlwind?", answer: "Elijah", options: ["Elisha", "Isaiah", "Jonah"], reference: "2 Kings 2:11" }),
  q("ch-aaron", { track: "characters", level: 2, kind: "choice", prompt: "Who was Moses' brother, who helped him speak to Pharaoh?", answer: "Aaron", options: ["Joshua", "Caleb", "Levi"], reference: "Exodus 4:14–16" }),

  q("ch-stephen", { track: "characters", level: 3, kind: "choice", prompt: "Who was the first follower of Jesus to die for his faith?", answer: "Stephen", options: ["James", "Philip", "Timothy"], reference: "Acts 7:59–60" }),
  q("ch-luke", { track: "characters", level: 3, kind: "choice", prompt: "Which doctor travelled with Paul?", answer: "Luke", options: ["Mark", "Titus", "Silas"], reference: "Colossians 4:14" }),
  q("ch-gideon", { track: "characters", level: 3, kind: "choice", prompt: "Which leader defeated the Midianites with only 300 men?", answer: "Gideon", options: ["Joshua", "Samson", "Barak"], reference: "Judges 7:7" }),
  q("ch-solomon", { track: "characters", level: 3, kind: "choice", prompt: "Which king asked God for wisdom?", answer: "Solomon", options: ["Saul", "Hezekiah", "Josiah"], reference: "1 Kings 3:9" }),
  q("ch-samuel", { track: "characters", level: 3, kind: "choice", prompt: "Which boy heard God call his name at night in the temple?", answer: "Samuel", options: ["Eli", "David", "Josiah"], reference: "1 Samuel 3:10" }),
  q("ch-barnabas-tf", { track: "characters", level: 3, kind: "truefalse", prompt: "Barnabas travelled with Paul on his first missionary journey.", answer: "true", reference: "Acts 13:2" }),
  q("ch-deborah", { track: "characters", level: 3, kind: "choice", prompt: "Which prophetess judged Israel and went to battle with Barak?", answer: "Deborah", options: ["Miriam", "Huldah", "Anna"], reference: "Judges 4:4–9" }),

  /* ---------------------------------------------------------------- Bible places */
  q("pl-bethlehem", { track: "places", level: 1, kind: "choice", prompt: "In which town was Jesus born?", answer: "Bethlehem", options: ["Nazareth", "Jericho", "Rome"], reference: "Luke 2:4–7" }),
  q("pl-eden", { track: "places", level: 1, kind: "choice", prompt: "Where did Adam and Eve first live?", answer: "The Garden of Eden", options: ["Egypt", "Jerusalem", "Babylon"], reference: "Genesis 2:8" }),
  q("pl-nazareth", { track: "places", level: 1, kind: "choice", prompt: "Which town did Jesus grow up in?", answer: "Nazareth", options: ["Bethlehem", "Capernaum", "Damascus"], reference: "Luke 2:51" }),
  q("pl-ararat-tf", { track: "places", level: 1, kind: "truefalse", prompt: "Noah's ark came to rest on the mountains of Ararat.", answer: "true", reference: "Genesis 8:4" }),

  q("pl-jordan", { track: "places", level: 2, kind: "choice", prompt: "In which river was Jesus baptised?", answer: "The Jordan", options: ["The Nile", "The Euphrates", "The Tigris"], reference: "Mark 1:9" }),
  q("pl-red-sea", { track: "places", level: 2, kind: "choice", prompt: "Which sea did God part so the Israelites could cross on dry ground?", answer: "The Red Sea", options: ["The Dead Sea", "The Sea of Galilee", "The Mediterranean Sea"], reference: "Exodus 14:21–22" }),
  q("pl-cana", { track: "places", level: 2, kind: "choice", prompt: "In which village did Jesus do his first miracle at a wedding?", answer: "Cana", options: ["Bethany", "Nain", "Emmaus"], reference: "John 2:1–11" }),
  q("pl-jericho", { track: "places", level: 2, kind: "choice", prompt: "Which city's walls fell down when the Israelites shouted?", answer: "Jericho", options: ["Ai", "Hebron", "Bethel"], reference: "Joshua 6:20" }),
  q("pl-nineveh", { track: "places", level: 2, kind: "choice", prompt: "God sent Jonah to tell the people of which city to turn from their sins?", answer: "Nineveh", options: ["Tarshish", "Joppa", "Tyre"], reference: "Jonah 1:2" }),
  q("pl-galilee-tf", { track: "places", level: 2, kind: "truefalse", prompt: "Jesus calmed a storm on the Sea of Galilee.", answer: "true", reference: "Mark 4:39" }),

  q("pl-golgotha", { track: "places", level: 3, kind: "choice", prompt: "What was the name of the place where Jesus was crucified?", answer: "Golgotha", options: ["Gethsemane", "Bethany", "Mount Sinai"], reference: "John 19:17" }),
  q("pl-damascus", { track: "places", level: 3, kind: "choice", prompt: "Saul met Jesus in a bright light on the road to which city?", answer: "Damascus", options: ["Athens", "Corinth", "Ephesus"], reference: "Acts 9:3" }),
  q("pl-temple", { track: "places", level: 3, kind: "choice", prompt: "In which city did King Solomon build the temple?", answer: "Jerusalem", options: ["Samaria", "Shiloh", "Hebron"], reference: "1 Kings 6:1" }),
  q("pl-gethsemane", { track: "places", level: 3, kind: "choice", prompt: "In which garden did Jesus pray before he was arrested?", answer: "Gethsemane", options: ["Eden", "Olivet", "Golgotha"], reference: "Matthew 26:36" }),
  q("pl-antioch", { track: "places", level: 3, kind: "choice", prompt: "Where were Jesus' followers first called Christians?", answer: "Antioch", options: ["Jerusalem", "Rome", "Philippi"], reference: "Acts 11:26" }),
  q("pl-babel", { track: "places", level: 3, kind: "choice", prompt: "People tried to build a tower up to the heavens at…", answer: "Babel", options: ["Ur", "Sodom", "Bethel"], reference: "Genesis 11:4–9" }),
  q("pl-horeb-tf", { track: "places", level: 3, kind: "truefalse", prompt: "Moses saw the burning bush at Horeb, the mountain of God.", answer: "true", reference: "Exodus 3:1–2" }),

  /* ---------------------------------------------------------------- Write it */
  q("wr-ark", { track: "writing", level: 1, kind: "write", prompt: "Write the name of the big boat Noah built.", answer: "ark|the ark", reference: "Genesis 6:14" }),
  q("wr-love", { track: "writing", level: 1, kind: "write", prompt: "Write the missing word: God is ___.", answer: "love", reference: "1 John 4:8" }),
  q("wr-mary", { track: "writing", level: 1, kind: "write", prompt: "Spell the name of Jesus' mother.", answer: "Mary" }),
  q("wr-thanks", { track: "writing", level: 1, kind: "reflect", prompt: "Write one thing you want to thank God for today.", answer: "", explain: "Thank you for sharing! God loves to hear a thankful heart." }),

  q("wr-goliath", { track: "writing", level: 2, kind: "write", prompt: "Write the name of the giant that David defeated.", answer: "Goliath", reference: "1 Samuel 17" }),
  q("wr-shepherd", { track: "writing", level: 2, kind: "write", prompt: "Write the missing word: The LORD is my ___.", answer: "shepherd", reference: "Psalm 23:1" }),
  q("wr-bethlehem", { track: "writing", level: 2, kind: "write", prompt: "Spell the town where Jesus was born.", answer: "Bethlehem", reference: "Luke 2:4" }),
  q("wr-twelve", { track: "writing", level: 2, kind: "write", prompt: "How many disciples did Jesus choose? Write the number.", answer: "12|twelve", reference: "Mark 3:14" }),
  q("wr-kindness", { track: "writing", level: 2, kind: "reflect", prompt: "Like the Good Samaritan, write one way you can help someone this week.", answer: "", reference: "Luke 10:37", explain: "What a kind idea — now go and do it!" }),

  q("wr-genesis", { track: "writing", level: 3, kind: "write", prompt: "Write the name of the first book of the Bible.", answer: "Genesis" }),
  q("wr-lamp", { track: "writing", level: 3, kind: "write", prompt: "Write the missing word: Thy word is a ___ unto my feet.", answer: "lamp", reference: "Psalm 119:105" }),
  q("wr-gethsemane", { track: "writing", level: 3, kind: "write", prompt: "Spell the garden where Jesus prayed before he was arrested.", answer: "Gethsemane", reference: "Matthew 26:36" }),
  q("wr-prayer", { track: "writing", level: 3, kind: "reflect", prompt: "Write a short prayer for someone in your family or class.", answer: "", explain: "Beautiful. Keep praying for the people you love." }),
  q("wr-paul", { track: "writing", level: 3, kind: "write", prompt: "Write the name of the apostle who wrote the letter to the Romans.", answer: "Paul|Saint Paul|St Paul", reference: "Romans 1:1" }),
  /* ---------------------------------------------------------------- Scripture quiz · harder */
  q("sc-jacob-sons", { track: "scripture", level: 4, kind: "choice", prompt: "How many sons did Jacob have?", answer: "12", options: ["7", "10", "2"], reference: "Genesis 35:22" }),
  q("sc-last-plague", { track: "scripture", level: 4, kind: "choice", prompt: "What was the last plague God sent on Egypt?", answer: "The death of the firstborn", options: ["Frogs", "Darkness", "Locusts"], reference: "Exodus 12:29" }),
  q("sc-furnace", { track: "scripture", level: 4, kind: "choice", prompt: "Which three friends were thrown into a fiery furnace and kept safe by God?", answer: "Shadrach, Meshach and Abednego", options: ["Peter, James and John", "Paul, Silas and Timothy", "Moses, Aaron and Miriam"], reference: "Daniel 3" }),
  q("sc-third-day-tf", { track: "scripture", level: 4, kind: "truefalse", prompt: "Jesus rose from the dead on the third day.", answer: "true", reference: "Luke 24:7", explain: "He then appeared to his followers over forty days before going up to heaven (Acts 1:3)." }),
  q("sc-job", { track: "scripture", level: 5, kind: "choice", prompt: "Which book tells of a man who lost almost everything but stayed faithful to God?", answer: "Job", options: ["Ruth", "Esther", "Jonah"] }),
  q("sc-eli", { track: "scripture", level: 5, kind: "choice", prompt: "Who was the priest when the boy Samuel served in the house of the LORD?", answer: "Eli", options: ["Aaron", "Zadok", "Caiaphas"], reference: "1 Samuel 3:1" }),
  q("sc-27-books", { track: "scripture", level: 5, kind: "choice", prompt: "How many books are in the New Testament?", answer: "27", options: ["12", "39", "66"] }),
  q("sc-languages-tf", { track: "scripture", level: 5, kind: "truefalse", prompt: "The Bible was first written in Hebrew, Aramaic and Greek.", answer: "true" }),

  /* ---------------------------------------------------------------- Memory verses · harder */
  q("mv-be-still", { track: "verses", level: 4, kind: "fill", prompt: "Be still, and know that I am ___.", answer: "God", options: ["king", "here", "near"], reference: "Psalm 46:10" }),
  q("mv-perfect-peace", { track: "verses", level: 4, kind: "fill", prompt: "Thou wilt keep him in perfect ___, whose mind is stayed on thee.", answer: "peace", options: ["rest", "joy", "light"], reference: "Isaiah 26:3" }),
  q("mv-season", { track: "verses", level: 4, kind: "choice", prompt: "Which book says “To every thing there is a season”?", answer: "Ecclesiastes", options: ["Proverbs", "Psalms", "Job"], reference: "Ecclesiastes 3:1" }),
  q("mv-renew", { track: "verses", level: 5, kind: "fill", prompt: "But they that wait upon the LORD shall renew their ___.", answer: "strength", options: ["hope", "joy", "minds"], reference: "Isaiah 40:31" }),
  q("mv-rejoice", { track: "verses", level: 5, kind: "order", prompt: "Build the verse.", answer: "Rejoice in the Lord alway.", reference: "Philippians 4:4" }),
  q("mv-glory", { track: "verses", level: 5, kind: "fill", prompt: "For all have sinned, and come short of the ___ of God.", answer: "glory", options: ["grace", "love", "word"], reference: "Romans 3:23" }),

  /* ---------------------------------------------------------------- Bible people · harder */
  q("ch-matthias", { track: "characters", level: 4, kind: "choice", prompt: "Who was chosen to take Judas' place among the twelve apostles?", answer: "Matthias", options: ["Barnabas", "Silas", "Timothy"], reference: "Acts 1:26" }),
  q("ch-lois", { track: "characters", level: 4, kind: "choice", prompt: "What was the name of Timothy's grandmother, who had strong faith?", answer: "Lois", options: ["Eunice", "Lydia", "Priscilla"], reference: "2 Timothy 1:5" }),
  q("ch-joshua", { track: "characters", level: 4, kind: "choice", prompt: "Who led the Israelites into the Promised Land after Moses?", answer: "Joshua", options: ["Caleb", "Aaron", "Gideon"], reference: "Joshua 1:1–2" }),
  q("ch-priscilla", { track: "characters", level: 5, kind: "choice", prompt: "Which married couple made tents and worked with Paul?", answer: "Priscilla and Aquila", options: ["Ananias and Sapphira", "Mary and Joseph", "Zechariah and Elizabeth"], reference: "Acts 18:2–3" }),
  q("ch-ehud", { track: "characters", level: 5, kind: "choice", prompt: "Which left-handed judge rescued Israel from King Eglon?", answer: "Ehud", options: ["Othniel", "Jephthah", "Samson"], reference: "Judges 3:15" }),
  q("ch-hosea", { track: "characters", level: 5, kind: "choice", prompt: "Which prophet married a woman called Gomer?", answer: "Hosea", options: ["Amos", "Micah", "Joel"], reference: "Hosea 1:3" }),

  /* ---------------------------------------------------------------- Bible places · harder */
  q("pl-ur", { track: "places", level: 4, kind: "choice", prompt: "Which city did Abraham's family come from?", answer: "Ur", options: ["Egypt", "Nineveh", "Babylon"], reference: "Genesis 11:31" }),
  q("pl-patmos", { track: "places", level: 4, kind: "choice", prompt: "On which island was John when he wrote the book of Revelation?", answer: "Patmos", options: ["Malta", "Crete", "Cyprus"], reference: "Revelation 1:9" }),
  q("pl-carmel", { track: "places", level: 4, kind: "choice", prompt: "On which mountain did Elijah call down fire from heaven?", answer: "Mount Carmel", options: ["Mount Sinai", "Mount Zion", "Mount Hermon"], reference: "1 Kings 18:19–38" }),
  q("pl-athens", { track: "places", level: 5, kind: "choice", prompt: "In which city did Paul talk about an altar “to the unknown god”?", answer: "Athens", options: ["Rome", "Corinth", "Ephesus"], reference: "Acts 17:22–23" }),
  q("pl-bethany", { track: "places", level: 5, kind: "choice", prompt: "Which village did Lazarus, Mary and Martha live in?", answer: "Bethany", options: ["Bethel", "Bethlehem", "Bethsaida"], reference: "John 11:1" }),
  q("pl-naaman", { track: "places", level: 5, kind: "choice", prompt: "In which river did Naaman wash seven times and get well?", answer: "The Jordan", options: ["The Nile", "The Abana", "The Euphrates"], reference: "2 Kings 5:14" }),

  /* ---------------------------------------------------------------- Fill the gap */
  q("bl-ark", { track: "blanks", level: 1, kind: "fill", prompt: "God told Noah to build an ___.", answer: "ark", options: ["house", "tower", "tent"], reference: "Genesis 6:14" }),
  q("bl-bethlehem", { track: "blanks", level: 1, kind: "fill", prompt: "Baby Jesus was born in a town called ___.", answer: "Bethlehem", options: ["Nazareth", "Jericho", "Rome"], reference: "Luke 2:4–7" }),
  q("bl-sling", { track: "blanks", level: 1, kind: "fill", prompt: "David beat Goliath with a ___ and a stone.", answer: "sling", options: ["sword", "spear", "bow"], reference: "1 Samuel 17:50" }),
  q("bl-fish", { track: "blanks", level: 1, kind: "fill", prompt: "Jonah was swallowed by a great ___.", answer: "fish", options: ["bird", "lion", "bear"], reference: "Jonah 1:17" }),
  q("bl-red-sea", { track: "blanks", level: 2, kind: "fill", prompt: "Moses stretched out his hand and God parted the ___ Sea.", answer: "Red", options: ["Dead", "Black", "Blue"], reference: "Exodus 14:21" }),
  q("bl-coat", { track: "blanks", level: 2, kind: "fill", prompt: "Jacob gave his son Joseph a colourful ___.", answer: "coat", options: ["crown", "ring", "sword"], reference: "Genesis 37:3" }),
  q("bl-three-times", { track: "blanks", level: 2, kind: "fill", prompt: "Daniel knelt and prayed ___ times a day.", answer: "three", options: ["two", "five", "seven"], reference: "Daniel 6:10" }),
  q("bl-seven-days", { track: "blanks", level: 2, kind: "fill", prompt: "The Israelites marched around Jericho for ___ days.", answer: "seven", options: ["three", "ten", "forty"], reference: "Joshua 6:15" }),
  q("bl-temple-boy", { track: "blanks", level: 3, kind: "fill", prompt: "When Jesus was twelve, Mary and Joseph found him in the ___.", answer: "temple", options: ["market", "palace", "field"], reference: "Luke 2:46" }),
  q("bl-tax", { track: "blanks", level: 3, kind: "fill", prompt: "Zacchaeus was a ___ collector.", answer: "tax", options: ["fruit", "shell", "stamp"], reference: "Luke 19:2" }),
  q("bl-malta", { track: "blanks", level: 3, kind: "fill", prompt: "Paul was shipwrecked on the island of ___.", answer: "Malta", options: ["Crete", "Cyprus", "Patmos"], reference: "Acts 28:1" }),
  q("bl-ravens", { track: "blanks", level: 3, kind: "fill", prompt: "God sent ___ to bring Elijah bread and meat.", answer: "ravens", options: ["doves", "eagles", "sparrows"], reference: "1 Kings 17:6" }),
  q("bl-walls", { track: "blanks", level: 4, kind: "fill", prompt: "Nehemiah led the people to rebuild the ___ of Jerusalem.", answer: "walls", options: ["palace", "markets", "roads"], reference: "Nehemiah 2:17" }),
  q("bl-fleece", { track: "blanks", level: 4, kind: "fill", prompt: "Gideon laid out a ___ to ask God for a sign.", answer: "fleece", options: ["sword", "lamp", "basket"], reference: "Judges 6:37" }),
  q("bl-boaz", { track: "blanks", level: 4, kind: "fill", prompt: "Ruth gathered grain in the field of a kind man called ___.", answer: "Boaz", options: ["Obed", "Jesse", "Elimelech"], reference: "Ruth 2:3" }),
  q("bl-mustard", { track: "blanks", level: 5, kind: "fill", prompt: "Jesus said the kingdom of heaven is like a ___ seed.", answer: "mustard", options: ["apple", "olive", "lemon"], reference: "Matthew 13:31" }),
  q("bl-fifteen", { track: "blanks", level: 5, kind: "fill", prompt: "God gave King Hezekiah ___ more years to live.", answer: "fifteen", options: ["five", "ten", "twenty"], reference: "2 Kings 20:6" }),
  q("bl-dry-bones", { track: "blanks", level: 5, kind: "fill", prompt: "The prophet ___ saw a valley of dry bones come to life.", answer: "Ezekiel", options: ["Isaiah", "Jeremiah", "Amos"], reference: "Ezekiel 37" }),

  /* ---------------------------------------------------------------- Word puzzles (unscramble) */
  q("wp-ark", { track: "puzzles", level: 1, kind: "scramble", prompt: "The big boat Noah built", answer: "ARK" }),
  q("wp-adam", { track: "puzzles", level: 1, kind: "scramble", prompt: "The first man God made", answer: "ADAM" }),
  q("wp-stars", { track: "puzzles", level: 1, kind: "scramble", prompt: "God made the sun, the moon and the …", answer: "STARS" }),
  q("wp-sheep", { track: "puzzles", level: 1, kind: "scramble", prompt: "The animals a good shepherd looks after", answer: "SHEEP" }),
  q("wp-bible", { track: "puzzles", level: 1, kind: "scramble", prompt: "God's holy book", answer: "BIBLE" }),
  q("wp-goliath", { track: "puzzles", level: 2, kind: "scramble", prompt: "The giant David beat", answer: "GOLIATH" }),
  q("wp-eden", { track: "puzzles", level: 2, kind: "scramble", prompt: "The garden where Adam and Eve lived", answer: "EDEN" }),
  q("wp-dove", { track: "puzzles", level: 2, kind: "scramble", prompt: "The bird that brought Noah an olive leaf", answer: "DOVE", reference: "Genesis 8:11" }),
  q("wp-psalms", { track: "puzzles", level: 3, kind: "scramble", prompt: "The Bible book full of songs and prayers", answer: "PSALMS" }),
  q("wp-manna", { track: "puzzles", level: 3, kind: "scramble", prompt: "Bread from heaven in the desert", answer: "MANNA", reference: "Exodus 16:31" }),
  q("wp-disciples", { track: "puzzles", level: 3, kind: "scramble", prompt: "Jesus' twelve special followers", answer: "DISCIPLES" }),
  q("wp-pentecost", { track: "puzzles", level: 4, kind: "scramble", prompt: "The day the Holy Spirit came", answer: "PENTECOST", reference: "Acts 2:1" }),
  q("wp-darius", { track: "puzzles", level: 4, kind: "scramble", prompt: "The king who had Daniel put in the lions' den", answer: "DARIUS", reference: "Daniel 6:9" }),
  q("wp-commandments", { track: "puzzles", level: 4, kind: "scramble", prompt: "God gave Moses the Ten …", answer: "COMMANDMENTS" }),
  q("wp-timothy", { track: "puzzles", level: 5, kind: "scramble", prompt: "Paul's young helper who received two of his letters", answer: "TIMOTHY" }),
  q("wp-jerusalem", { track: "puzzles", level: 5, kind: "scramble", prompt: "The city whose walls Nehemiah rebuilt", answer: "JERUSALEM" }),
  q("wp-matthew", { track: "puzzles", level: 5, kind: "scramble", prompt: "The first book of the New Testament", answer: "MATTHEW" }),

  /* ---------------------------------------------------------------- Spelling bee */
  q("sp-manger", { track: "spelling", level: 1, kind: "spell", prompt: "Baby Jesus was laid in a …", answer: "MANGER", reference: "Luke 2:7" }),
  q("sp-days", { track: "spelling", level: 1, kind: "spell", prompt: "God made the world in six …", answer: "DAYS", reference: "Exodus 20:11" }),
  q("sp-rainbow", { track: "spelling", level: 1, kind: "spell", prompt: "God's colourful promise in the sky", answer: "RAINBOW", reference: "Genesis 9:13" }),
  q("sp-sarah", { track: "spelling", level: 2, kind: "spell", prompt: "Abraham's wife", answer: "SARAH" }),
  q("sp-star", { track: "spelling", level: 2, kind: "spell", prompt: "What the wise men followed to find Jesus", answer: "STAR", reference: "Matthew 2:9" }),
  q("sp-galilee", { track: "spelling", level: 2, kind: "spell", prompt: "Jesus walked on the Sea of …", answer: "GALILEE", reference: "John 6:1, 19" }),
  q("sp-israel", { track: "spelling", level: 3, kind: "spell", prompt: "The new name God gave to Jacob", answer: "ISRAEL", reference: "Genesis 32:28" }),
  q("sp-pharaoh", { track: "spelling", level: 3, kind: "spell", prompt: "The title of the king of Egypt", answer: "PHARAOH" }),
  q("sp-apostle", { track: "spelling", level: 3, kind: "spell", prompt: "A messenger sent out by Jesus to share the good news", answer: "APOSTLE" }),
  q("sp-hebrew", { track: "spelling", level: 4, kind: "spell", prompt: "The language most of the Old Testament was written in", answer: "HEBREW" }),
  q("sp-pilate", { track: "spelling", level: 4, kind: "spell", prompt: "The Roman governor who judged Jesus", answer: "PILATE", reference: "Mark 15:15" }),
  q("sp-acts", { track: "spelling", level: 4, kind: "spell", prompt: "The book that tells the story of the early church", answer: "ACTS" }),
  q("sp-golgotha", { track: "spelling", level: 5, kind: "spell", prompt: "The hill where Jesus was crucified", answer: "GOLGOTHA", reference: "Mark 15:22" }),
  q("sp-isaiah", { track: "spelling", level: 5, kind: "spell", prompt: "The prophet who wrote “For unto us a child is born”", answer: "ISAIAH", reference: "Isaiah 9:6" }),
  q("sp-gospel", { track: "spelling", level: 5, kind: "spell", prompt: "A word that means “good news”", answer: "GOSPEL" }),

  /* ---------------------------------------------------------------- Match up */
  q("mt-stories", { track: "matching", level: 1, kind: "match", prompt: "Match each person to their story.", answer: "", pairs: [{ a: "Noah", b: "The ark" }, { a: "Jonah", b: "The great fish" }, { a: "David", b: "The giant" }, { a: "Daniel", b: "The lions' den" }] }),
  q("mt-creation", { track: "matching", level: 1, kind: "match", prompt: "Match the day to what God made.", answer: "", pairs: [{ a: "Day 1", b: "Light" }, { a: "Day 4", b: "Sun, moon and stars" }, { a: "Day 5", b: "Fish and birds" }, { a: "Day 6", b: "Animals and people" }], reference: "Genesis 1" }),
  q("mt-christmas", { track: "matching", level: 1, kind: "match", prompt: "Match the Christmas story.", answer: "", pairs: [{ a: "An angel", b: "Told Mary the good news" }, { a: "Shepherds", b: "Came from the fields" }, { a: "Wise men", b: "Followed a star" }, { a: "Baby Jesus", b: "Lay in a manger" }], reference: "Luke 1–2; Matthew 2" }),
  q("mt-couples", { track: "matching", level: 2, kind: "match", prompt: "Match the husband and wife.", answer: "", pairs: [{ a: "Adam", b: "Eve" }, { a: "Abraham", b: "Sarah" }, { a: "Isaac", b: "Rebekah" }, { a: "Jacob", b: "Rachel" }] }),
  q("mt-mothers", { track: "matching", level: 2, kind: "match", prompt: "Match each mother to her son.", answer: "", pairs: [{ a: "Mary", b: "Jesus" }, { a: "Hannah", b: "Samuel" }, { a: "Sarah", b: "Isaac" }, { a: "Elizabeth", b: "John the Baptist" }] }),
  q("mt-brothers", { track: "matching", level: 2, kind: "match", prompt: "Match the brothers.", answer: "", pairs: [{ a: "Moses", b: "Aaron" }, { a: "Jacob", b: "Esau" }, { a: "Cain", b: "Abel" }, { a: "Peter", b: "Andrew" }] }),
  q("mt-books", { track: "matching", level: 3, kind: "match", prompt: "Match the book to what kind of book it is.", answer: "", pairs: [{ a: "Genesis", b: "Beginnings" }, { a: "Psalms", b: "Songs and prayers" }, { a: "Matthew", b: "Gospel" }, { a: "Romans", b: "Letter" }] }),
  q("mt-prophets", { track: "matching", level: 3, kind: "match", prompt: "Match the prophet to the king he spoke to.", answer: "", pairs: [{ a: "Nathan", b: "David" }, { a: "Elijah", b: "Ahab" }, { a: "Samuel", b: "Saul" }, { a: "Isaiah", b: "Hezekiah" }] }),
  q("mt-jobs", { track: "matching", level: 3, kind: "match", prompt: "Match each follower of Jesus to their work.", answer: "", pairs: [{ a: "Peter", b: "Fisherman" }, { a: "Matthew", b: "Tax collector" }, { a: "Luke", b: "Doctor" }, { a: "Paul", b: "Tentmaker" }] }),
  q("mt-places-events", { track: "matching", level: 4, kind: "match", prompt: "Match the place to what happened there.", answer: "", pairs: [{ a: "Mount Sinai", b: "Ten Commandments" }, { a: "Bethlehem", b: "Jesus was born" }, { a: "River Jordan", b: "Jesus was baptised" }, { a: "Road to Damascus", b: "Saul met Jesus" }] }),
  q("mt-judges", { track: "matching", level: 4, kind: "match", prompt: "Match the leader to their story.", answer: "", pairs: [{ a: "Gideon", b: "A fleece and 300 men" }, { a: "Samson", b: "Great strength" }, { a: "Deborah", b: "Judged under a palm tree" }, { a: "Samuel", b: "Heard God call at night" }] }),
  q("mt-fathers", { track: "matching", level: 4, kind: "match", prompt: "Match each son to his father.", answer: "", pairs: [{ a: "Isaac", b: "Abraham" }, { a: "Solomon", b: "David" }, { a: "Joseph", b: "Jacob" }, { a: "John the Baptist", b: "Zechariah" }] }),
  q("mt-ot-books", { track: "matching", level: 5, kind: "match", prompt: "Match the Old Testament book to its kind.", answer: "", pairs: [{ a: "Genesis", b: "Law" }, { a: "Joshua", b: "History" }, { a: "Proverbs", b: "Wisdom" }, { a: "Jeremiah", b: "Prophets" }] }),
  q("mt-miracles", { track: "matching", level: 5, kind: "match", prompt: "Match the miracle to where it happened.", answer: "", pairs: [{ a: "Water into wine", b: "Cana" }, { a: "Lazarus raised", b: "Bethany" }, { a: "Storm calmed", b: "Sea of Galilee" }, { a: "Bartimaeus healed", b: "Jericho" }] }),
  q("mt-letters", { track: "matching", level: 5, kind: "match", prompt: "Match the letter to who first received it.", answer: "", pairs: [{ a: "Romans", b: "Christians in Rome" }, { a: "Galatians", b: "Churches in Galatia" }, { a: "Philemon", b: "Paul's friend Philemon" }, { a: "Titus", b: "Paul's helper Titus" }] }),

  /* ---------------------------------------------------------------- Story order */
  q("tl-creation", { track: "timeline", level: 1, kind: "sequence", prompt: "Put the creation story in order.", answer: "", items: ["God made light", "God made the sky", "God made the sun, moon and stars", "God made animals and people"], reference: "Genesis 1" }),
  q("tl-noah", { track: "timeline", level: 1, kind: "sequence", prompt: "Put Noah's story in order.", answer: "", items: ["Noah builds the ark", "The animals go in", "It rains for forty days", "A rainbow appears"], reference: "Genesis 6–9" }),
  q("tl-christmas", { track: "timeline", level: 1, kind: "sequence", prompt: "Put the Christmas story in order.", answer: "", items: ["An angel visits Mary", "Mary and Joseph go to Bethlehem", "Jesus is born", "Shepherds visit baby Jesus"], reference: "Luke 1–2" }),
  q("tl-david", { track: "timeline", level: 2, kind: "sequence", prompt: "Put David's life in order.", answer: "", items: ["David looks after sheep", "Samuel anoints David", "David defeats Goliath", "David becomes king"], reference: "1 Samuel 16 – 2 Samuel 5" }),
  q("tl-moses", { track: "timeline", level: 2, kind: "sequence", prompt: "Put Moses' story in order.", answer: "", items: ["Baby Moses in a basket", "The burning bush", "Crossing the Red Sea", "The Ten Commandments"], reference: "Exodus 2–20" }),
  q("tl-joseph", { track: "timeline", level: 2, kind: "sequence", prompt: "Put Joseph's story in order.", answer: "", items: ["Joseph gets a colourful coat", "His brothers sell him", "He explains Pharaoh's dreams", "He forgives his brothers"], reference: "Genesis 37–45" }),
  q("tl-easter", { track: "timeline", level: 3, kind: "sequence", prompt: "Put the Easter story in order.", answer: "", items: ["Jesus rides into Jerusalem", "The Last Supper", "Jesus prays in Gethsemane", "Jesus dies on the cross", "Jesus rises again"], reference: "Matthew 21–28" }),
  q("tl-jonah", { track: "timeline", level: 3, kind: "sequence", prompt: "Put Jonah's story in order.", answer: "", items: ["God tells Jonah to go to Nineveh", "Jonah runs away on a ship", "A great fish swallows Jonah", "Jonah preaches in Nineveh"], reference: "Jonah 1–3" }),
  q("tl-patriarchs", { track: "timeline", level: 3, kind: "sequence", prompt: "Put the family in order, oldest first.", answer: "", items: ["Abraham", "Isaac", "Jacob", "Joseph"], reference: "Genesis 21–37" }),
  q("tl-kings", { track: "timeline", level: 4, kind: "sequence", prompt: "Put the kings in the order they reigned.", answer: "", items: ["Saul", "David", "Solomon", "Rehoboam"], reference: "1 Samuel – 1 Kings 12" }),
  q("tl-exodus", { track: "timeline", level: 4, kind: "sequence", prompt: "Put the escape from Egypt in order.", answer: "", items: ["The plagues", "The first Passover", "Crossing the Red Sea", "Manna in the desert", "The Ten Commandments"], reference: "Exodus 7–20" }),
  q("tl-acts", { track: "timeline", level: 4, kind: "sequence", prompt: "Put the early church in order.", answer: "", items: ["The Holy Spirit comes at Pentecost", "Stephen is killed for his faith", "Saul meets Jesus on the road", "Paul's first missionary journey"], reference: "Acts 2–13" }),
  q("tl-torah", { track: "timeline", level: 5, kind: "sequence", prompt: "Put the first five books of the Bible in order.", answer: "", items: ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"] }),
  q("tl-gospels", { track: "timeline", level: 5, kind: "sequence", prompt: "Put the four Gospels in Bible order.", answer: "", items: ["Matthew", "Mark", "Luke", "John"] }),
  q("tl-elijah", { track: "timeline", level: 5, kind: "sequence", prompt: "Put Elijah and Elisha's story in order.", answer: "", items: ["Fire falls on Mount Carmel", "Elijah goes up in a whirlwind", "Elisha picks up Elijah's cloak", "Naaman is healed"], reference: "1 Kings 18 – 2 Kings 5" }),

  /* ---------------------------------------------------------------- Write it · harder */
  q("wr-revelation", { track: "writing", level: 4, kind: "write", prompt: "Write the name of the last book of the Bible.", answer: "Revelation|Revelations" }),
  q("wr-jordan", { track: "writing", level: 4, kind: "write", prompt: "Write the name of the river where Jesus was baptised.", answer: "Jordan|the Jordan|River Jordan|Jordan River", reference: "Mark 1:9" }),
  q("wr-brave", { track: "writing", level: 4, kind: "reflect", prompt: "David trusted God when he was afraid. Write about a time you were brave.", answer: "", explain: "God is with you when you're brave — just like David!" }),
  q("wr-thomas", { track: "writing", level: 5, kind: "write", prompt: "Write the name of the disciple who doubted until he saw Jesus.", answer: "Thomas", reference: "John 20:24–28" }),
  q("wr-66", { track: "writing", level: 5, kind: "write", prompt: "How many books are in the Bible? Write the number.", answer: "66|sixty-six|sixty six" }),
  q("wr-verse", { track: "writing", level: 5, kind: "reflect", prompt: "Write a verse you know by heart, and what it means to you.", answer: "", explain: "Hiding God's word in your heart is a wonderful thing (Psalm 119:11)." }),
];
