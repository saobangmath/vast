import type { Metadata } from "next";
import { NewsList } from "@/components/NewsList";
import { getGroup } from "@/lib/content";

const group = getGroup("chuyen-doi-so")!;
export const metadata: Metadata = { title: `${group.name} | VAST` };

export default async function GroupIndex({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  return (
    <NewsList
      group={group}
      section="all"
      page={Number(page) || 1}
      blurb="Khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số: bản tin, cải cách hành chính, ứng dụng CNTT và IPv6."
    />
  );
}
