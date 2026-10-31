import Link from "next/link";

export function SectionHeader({ title, href, id }: { title: string; href?: string; id?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 id={id} className="m-0 text-xl font-semibold">{title}</h2>
      {href && <Link href={href} className="text-[13px] font-semibold underline">See all</Link>}
    </div>
  );
}
