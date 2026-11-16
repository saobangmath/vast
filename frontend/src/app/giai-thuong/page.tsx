import type { Metadata } from "next";
import { NewsList } from "@/components/NewsList";
import { getGroup } from "@/lib/content";

const group = getGroup("giai-thuong")!;
export const metadata: Metadata = { title: `${group.name} | VAST` };

export default async function GroupIndex({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  return <NewsList group={group} section="all" page={Number(page) || 1} />;
}
