import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";
import "@/components/cms/blocks.css";
import "../insights/blog.css";
import "../insights/post/post.css";
import "./admin.css";

/* The admin panel. A static shell - everything in it comes from
   /api/admin after sign-in (worker/api). The Worker serves this page
   with headers that forbid framing, caching and indexing
   (worker/index.js, admin()). */
export const metadata: Metadata = {
  title: "Admin · SoCheers",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function AdminPage() {
  return <AdminApp />;
}
