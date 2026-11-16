import { notFound } from "next/navigation";
import { NewsList } from "@/components/NewsList";
import { getGroup } from "@/lib/content";

const group = getGroup("chuyen-doi-so")!;

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ section }, { page }] = await Promise.all([params, searchParams]);
  if (!group.sections.includes(section)) notFound();
  return <NewsList group={group} section={section} page={Number(page) || 1} />;
}
