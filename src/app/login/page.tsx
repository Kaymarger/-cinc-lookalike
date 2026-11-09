import { redirect } from "next/navigation";

export default function PublicLoginPage() {
  redirect("/?login=1");
}
