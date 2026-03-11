import Link from "next/link";
import TopBar from "@/components/layout/TopBar";

export default function NotFound() {
  return (
    <>
      <TopBar title="404" />
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-6xl font-mono font-bold text-text-muted mb-4">404</h2>
        <p className="text-text-secondary mb-6">This page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="px-4 py-2 rounded-btn text-sm font-medium text-white"
          style={{ background: "linear-gradient(135deg, #3B82F6, #8B5CF6)" }}
        >
          Back to Command Center
        </Link>
      </div>
    </>
  );
}
