"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/components/auth-modal";

export default function PublicLoginPage() {
  const { openLogin } = useAuthModal();
  const router = useRouter();

  useEffect(() => {
    openLogin();
    router.replace("/");
  }, [openLogin, router]);

  return null;
}
