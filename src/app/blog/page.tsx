import { redirect } from "next/navigation";

/** Live CINC site maps /blog back to the consumer home experience. */
export default function BlogRedirectPage() {
  redirect("/");
}
