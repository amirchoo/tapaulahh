import { notFound } from "next/navigation";

// Sends unknown paths to [locale]/not-found.tsx so the 404 gets the app shell.
export default function CatchAllPage() {
  notFound();
}
