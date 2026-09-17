"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/* The site's chrome (header, loader, overture, cursor) is not drawn on
   the admin panel - it is a tool, not a page of the site. */
export default function ShellGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname?.startsWith("/admin/")) return null;
  return <>{children}</>;
}
