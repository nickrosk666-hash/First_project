import TopBar from "@/components/layout/TopBar";
import { getIdeas, getVerdictCounts } from "@/lib/queries/ideas";
import IdeaFeed from "@/components/ideas/IdeaFeed";

export default function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  return <IdeasPageInner searchParams={searchParams} />;
}

async function IdeasPageInner({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const verdict = params.verdict as "BUILD" | "BET" | "FLIP" | "KILL" | undefined;
  const source = params.source || undefined;
  const keyword = params.keyword || undefined;

  const ideas = getIdeas({
    verdict: verdict || null,
    source: source as any,
    keyword,
  });
  const counts = getVerdictCounts();

  return (
    <>
      <TopBar title="Discoveries" />
      <div className="p-6">
        <IdeaFeed
          initialIdeas={ideas}
          counts={counts}
          initialVerdict={verdict || null}
          initialSource={source || null}
          initialKeyword={keyword || null}
        />
      </div>
    </>
  );
}
