import Link from "next/link";

interface PageHeadingI {
  pageTitle: string;
}

export default function PageHeading({ pageTitle }: PageHeadingI) {
  return (
    <div className="w-full flex flex-row justify-between items-center px-4">
      <h1 className="text-4xl font-bold">{pageTitle}</h1>
      <Link href="./" className="btn btn-outline px-4">
        Back
      </Link>
    </div>
  );
}
