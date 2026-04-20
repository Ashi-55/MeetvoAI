import { redirect } from "next/navigation";

/** Business dashboard entry: use the public marketplace catalog. */
export default function BusinessMarketplacePage() {
  redirect("/marketplace");
}
