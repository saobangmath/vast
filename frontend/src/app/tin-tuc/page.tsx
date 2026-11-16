import type { Metadata } from "next";
import { NewsList } from "@/components/NewsList";
import { getGroup } from "@/lib/content";

const group = getGroup("tin-tuc")!;
export const metadata: Metadata = { title: `${group.name} | VAST` };

export default async function GroupIndex({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  return (
    <NewsList
      group={group}
      section="all"
      page={Number(page) || 1}
      blurb="Hoạt động của Viện Hàn lâm và tin khoa học - công nghệ trong nước, quốc tế."
    />
  );
}
