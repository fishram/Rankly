"use client";

import Link from "next/link";

export default function Page() {
  return (
    <>
      <div className="pb-20 flex flex-col items-center justify-center h-screen space-y-2">
        <h1 className="text-9xl font-bold mb-8">Rankly</h1>

        <nav>
          <div className="flex flex-row space-x-10">
            <button className="btn btn-primary btn-lg">
              <Link href="/matches">Matches</Link>
            </button>
            <button className="btn btn-secondary btn-lg">
              <Link href="/rankings">Rankings</Link>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
