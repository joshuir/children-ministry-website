import type { QuizQuestion, QuizTrack } from "@/lib/types";

/**
 * Seed question bank for the Bible learning games. Staff can add, edit or hide questions
 * in the content manager (Bible games). Every question needs its own id, and the site
 * ignores a question whose wording repeats another one, so children never see duplicates.
 *
 * Verse wording follows the King James Version (public domain).
 */

export const TRACKS: { id: QuizTrack; title: string; blurb: string; tone: "blue" | "sun" | "coral" | "mint" | "lilac" }[] = [
  { id: "scripture", title: "Bible stories", blurb: "Quick questions about the big stories of the Bible.", tone: "blue" },
  { id: "verses", title: "Memory verses", blurb: "Fill gaps and build verses word by word.", tone: "sun" },
  { id: "characters", title: "Bible people", blurb: "Kings, prophets, disciples and brave helpers.", tone: "coral" },
  { id: "places", title: "Bible places", blurb: "Towns, rivers, mountains and gardens.", tone: "mint" },
  { id: "writing", title: "Write it", blurb: "Type answers and write your own short prayers.", tone: "lilac" },
];

export const LEVELS = [
  { id: 1 as const, label: "Little learners", ages: "Ages 3–6" },
  { id: 2 as const, label: "Explorers", ages: "Ages 7–9" },
  { id: 3 as const, label: "Champions", ages: "Ages 10–13" },
];

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
];
