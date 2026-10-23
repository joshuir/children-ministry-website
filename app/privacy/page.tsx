import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getSite } from "@/lib/content";

export const metadata: Metadata = { title: "Privacy Policy", description: "What information Children's Ministry collects, why, and how we protect it.", alternates: { canonical: "/privacy/" } };

export default async function Page() {
  const site = await getSite();
  return (
    <LegalPage eyebrow="Privacy" title="Privacy policy" updated="1 October 2026"
      intro="We collect as little as we can, keep it safe, and never sell it. Here's exactly what that means."
      sections={[
        { h: "What we collect", p: [["Contact form: your name, email, optional phone number and message.", "Newsletter: your name and email address.", "Parent accounts (for commenting): your name, email and the posts you react to or comment on.", "We do not collect information about children through this website."]] },
        { h: "How we use it", p: ["Only to reply to you, send the newsletter you asked for, and keep the feed safe. We do not use advertising trackers, and we never sell or share your details with third parties for marketing."] },
        { h: "Where it's stored", p: ["Data is stored securely with our database provider using encryption in transit and at rest. Access is restricted to named ministry administrators using role-based permissions."] },
        { h: "How long we keep it", p: ["Contact messages are deleted after 12 months. Newsletter details are kept until you unsubscribe. Comments are kept while your account is active."] },
        { h: "Your rights", p: [`You can ask to see, correct or delete your information at any time by emailing ${site.contact.email}. Every newsletter has a one-click unsubscribe link.`] },
      ]} />
  );
}
