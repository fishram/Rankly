"use client";

import Link from "next/link";

export default function Page() {
  return (
    <>
      <div className="pb-20 flex flex-col items-center justify-center h-screen">
        <h1 className="text-8xl font-bold pb-14">Rankly</h1>

        <nav>
          <div className="flex flex-row space-x-10">
            <Link className="btn btn-primary btn-lg" href="/matches">
              Matches
            </Link>
            <Link className="btn btn-secondary btn-lg" href="/rankings">
              Rankings
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
