import { redirect } from "next/navigation";

/** The first version had one page per game (/learn/scripture …). They now live on the journey. */
export default function OldTrackPage() {
  redirect("/learn/");
}
