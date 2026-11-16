import { Suspense } from "react";
import { HomeVariants } from "@/components/HomeVariants";
import { fetchNew } from "@/lib/api";

async function loadPress() {
  try {
    const res = await fetchNew(1);
    return res.items;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const articles = await loadPress();
  const today = new Intl.DateTimeFormat("vi-VN", { dateStyle: "full", timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(),
  );

  return (
    <Suspense fallback={<div className="wrap" style={{ padding: "24px 0" }}>Đang tải Trang chủ…</div>}>
      <HomeVariants articles={articles} today={today} />
    </Suspense>
  );
}
