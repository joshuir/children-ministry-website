import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getSite } from "@/lib/content";

export const metadata: Metadata = { title: "Child Safety & Safeguarding", description: "How Children's Ministry keeps children safe — teacher vetting, check-in, photo consent and online safety.", alternates: { canonical: "/safeguarding/" } };

export default async function Page() {
  const site = await getSite();
  return (
    <LegalPage eyebrow="Child safety" tone="mint" title="Keeping every child safe" updated="1 October 2026"
      intro="Safeguarding isn't a policy we keep in a drawer — it shapes how we teach, how we check children in and out, and how this website works."
      sections={[
        { h: "Our commitment", p: ["Every child who attends Children's Ministry has the right to be safe, respected and protected from harm. We follow the safeguarding policy of Presbyterian Church, Accra and Ghana's Children's Act (Act 560)."] },
        { h: "Who teaches your child", p: [["All teachers and helpers are church members of at least six months.", "Every adult passes a background check and two references before serving.", "Safeguarding training is completed on joining and refreshed every year.", "There are always at least two adults in every classroom — never one adult alone with a child."]] },
        { h: "Check-in and collection", p: ["Each family receives a QR check-in card. Children can only be collected by adults listed on that card. If someone else is collecting, please tell the welcome desk in person before service."] },
        { h: "Photos and video", p: [["We only photograph children whose parent or guardian has given written consent.", "We share group photos only — no names, school uniforms, or details that could identify where a child lives or studies.", "You can withdraw consent at any time, and we'll remove images within seven days."]] },
        { h: "Online safety on this website", p: [["Children cannot create accounts, post or comment.", "Only verified teachers can publish posts; every post is approved by a ministry administrator.", "Parent comments are held for moderation and automatically blocked if they contain phone numbers, emails or addresses.", "Anyone can report a post or comment, and reports are reviewed within 24 hours."]] },
        { h: "Raising a concern", p: [`If you are worried about a child, speak to our Safeguarding Lead, Yaw Amponsah, on a Sunday, or email ${site.contact.email} with the subject "Safeguarding". If a child is in immediate danger, contact the police or the Department of Social Welfare straight away.`] },
      ]} />
  );
}
