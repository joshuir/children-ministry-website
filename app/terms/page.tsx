import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms of Use", description: "The terms for using the Children's Ministry website and community feed.", alternates: { canonical: "/terms/" } };

export default function Page() {
  return (
    <LegalPage eyebrow="Terms" title="Terms of use" updated="1 October 2026"
      intro="A few simple rules that keep this a kind, safe place for families."
      sections={[
        { h: "Using this website", p: ["This website is provided by Presbyterian Church, Accra for families of Presbyterian Children's Ministry. By using it, you agree to these terms."] },
        { h: "Community guidelines", p: [["Be kind and encouraging.", "Never share a child's full name, photo, school, address or contact details.", "No advertising, spam or links to unrelated sites.", "Comments that break these guidelines will be removed, and repeat breaches may lead to account suspension."]] },
        { h: "Lesson materials", p: ["Lesson plans and resources are free for personal, family and church use. Please don't sell them or republish them without permission."] },
        { h: "Changes", p: ["We may update these terms from time to time. The latest version will always be on this page."] },
      ]} />
  );
}
