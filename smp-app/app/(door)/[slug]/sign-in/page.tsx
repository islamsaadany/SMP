import { DoorPage, doorMetadata } from "../../DoorPage.tsx";
export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) { return doorMetadata((await params).slug); }
/* A client's own door (§313.36): the same page, wearing that client's mark. */
export default async function Page({ params }: P) { return DoorPage({ slug: (await params).slug }); }
