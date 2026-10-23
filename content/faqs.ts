import type { Faq } from "@/lib/types";

/** Questions parents ask most — editable in the CMS under "FAQs". */
export const faqs: Faq[] = [
  { id: "faq-first-visit", category: "visiting", question: "What should we expect on our first Sunday?", answer: "Arrive about 15 minutes early and find our welcome desk by the main entrance. A team member will register your child, show you their classroom and introduce you to the teachers. Services run 9:00 – 10:45 am." },
  { id: "faq-cost", category: "visiting", question: "Does it cost anything?", answer: "No. Sunday classes, the midweek Bible Club and most events are free. For the occasional camp or outing we share costs well in advance, and no child is ever left out because of cost." },
  { id: "faq-ages", category: "classes", question: "Which class is right for my child?", answer: "Children are grouped by age: Beginners (3–5), Primary (6–8), Juniors (9–10) and Seniors (11–13). If you're unsure, our welcome team will help you choose — children can always move to the class where they're happiest." },
  { id: "faq-safety", category: "safety", question: "How do you keep children safe?", answer: "Every teacher and helper is background-checked and safeguarding-trained. Classes always have at least two adults, children are signed in and out with a matching tag, and only the named parent or guardian can collect them." },
  { id: "faq-allergies", category: "safety", question: "My child has allergies or additional needs. Who should I tell?", answer: "Please mention it at registration, or message us beforehand. We note medical and support needs on your child's record, brief the class teachers, and are happy to talk through anything that will help your child feel at home." },
  { id: "faq-parents", category: "parents", question: "Can I stay with my child?", answer: "Of course. Many parents stay for the first week or two while their child settles in. You're always welcome to look in on the class, and teachers will come and find you if your child needs you." },
  { id: "faq-lessons", category: "parents", question: "How can we keep learning at home?", answer: "Each week's Bible lesson — with a memory verse, questions and a simple activity — is on the class pages and in our mobile app, so you can carry on the conversation during the week." },
  { id: "faq-contact", category: "parents", question: "How do I get in touch with a teacher?", answer: "Send us a message through the contact page or WhatsApp and we'll pass it straight to your child's class teachers. You can also catch them at drop-off or pick-up on Sundays." },
];

export const FAQ_CATEGORIES = [
  { value: "visiting", label: "Visiting" },
  { value: "classes", label: "Classes" },
  { value: "safety", label: "Safety" },
  { value: "parents", label: "Parents" },
];
