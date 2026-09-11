import { DoorPage, doorMetadata } from "./DoorPage.tsx";
export const dynamic = "force-dynamic";
export async function generateMetadata() { return doorMetadata(null); }
/* Forefront's own door: it draws no client (§313.15). */
export default async function Page() { return DoorPage({ slug: null }); }
