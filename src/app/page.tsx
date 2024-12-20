"use client";

import Link from "next/link";

export default function Page() {
  return (
    <>
      <div className="pb-20 flex flex-col items-center justify-center h-screen">
        <h1 className="text-8xl font-bold pb-14">Rankly</h1>

        <nav>
          <div className="grid-cols-2 grid rows-2 gap-4">
            <Link className="btn btn-accent btn-lg col-span-2" href="/newmatch">
              New Match
            </Link>
            <Link className="btn btn-secondary btn-lg" href="/rankings">
              Rankings
            </Link>
            <Link className="btn btn-primary btn-lg" href="/history">
              History
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
