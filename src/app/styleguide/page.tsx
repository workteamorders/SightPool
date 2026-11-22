import type { Metadata } from "next";
import { Styleguide } from "@/components/styleguide/styleguide";

export const metadata: Metadata = { title: "Styleguide", description: "Design tokens and components.", robots: { index: false, follow: false } };

export default function Page() {
  return <Styleguide />;
}
