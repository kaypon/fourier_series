import { Studio } from "@/components/Studio";
import { Explainer } from "@/components/Explainer";
import { fromQuery } from "@/lib/share";
import { preset } from "@/lib/steps";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") params.set(key, value);
  }
  const initial = fromQuery(params) ?? preset("square", 5);
  return <Studio initial={initial} explainer={<Explainer />} />;
}
