import { redirect } from 'next/navigation';

export default function MoonPage({
  params,
}: {
  params: { clientSlug: string; skillSlug: string; moonSlug: string };
}) {
  redirect(`/${params.clientSlug}/${params.skillSlug}?moon=${params.moonSlug}`);
}
