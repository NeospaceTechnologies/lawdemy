import { redirect } from "next/navigation";

// Visitors land on the learner sign-in; instructors use /instructor/sign-in.
export default function Home() {
  redirect("/sign-in");
}
