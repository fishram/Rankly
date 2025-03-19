"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import PageHeading from "../../components/page_heading";
import Link from "next/link";

export default function FixDatabasePage() {
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not admin
  if (status === "loading") {
    return (
      <div className="h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin");
    return null;
  }

  if (!session?.user?.isAdmin) {
    router.push("/");
    return null;
  }

  const handleFixSequences = async () => {
    setIsFixing(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/fix-sequences", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix sequences");
      }

      setResult(
        `Successfully fixed database sequences. Response: ${JSON.stringify(
          data
        )}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 mt-10">
      <PageHeading pageTitle="Fix Database"></PageHeading>

      <div className="card bg-base-200 shadow-xl mt-6">
        <div className="card-body">
          <h2 className="card-title">Fix Database Sequences</h2>
          <p>
            This tool will fix ID sequences that may have become out of sync
            after database migrations. Use this if you're encountering unique
            constraint errors when creating new records.
          </p>

          {result && (
            <div className="alert alert-success mt-4">
              <span>{result}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error mt-4">
              <span>{error}</span>
            </div>
          )}

          <div className="card-actions justify-end mt-4">
            <Link href="/admin" className="btn btn-neutral">
              Back to Admin
            </Link>
            <button
              className={`btn btn-primary ${isFixing ? "loading" : ""}`}
              onClick={handleFixSequences}
              disabled={isFixing}
            >
              {isFixing ? "Fixing..." : "Fix Sequences"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
