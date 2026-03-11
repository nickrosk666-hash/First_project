import { notFound } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import { getIdeaById } from "@/lib/queries/ideas";
import IdeaDetailClient from "@/components/ideas/IdeaDetailClient";

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idea = getIdeaById(Number(id));
  if (!idea) notFound();

  return (
    <>
      <TopBar
        title={idea.title}
        breadcrumb={[
          { label: "Discoveries", href: "/ideas" },
          { label: idea.title },
        ]}
      />
      <IdeaDetailClient idea={idea} />
    </>
  );
}
