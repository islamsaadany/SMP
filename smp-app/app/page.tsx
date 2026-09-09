/* The new app serves NOTHING yet (spec 043 §5: the first slice is a spike,
   not a page). The frozen build keeps every client until the first screen
   group cuts over, page group by page group (D4), each behind its own
   mockup. This placeholder exists so the skeleton compiles; it draws no
   product content and no tenant data. */
export default function Page() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <p>SMP — nothing is served here yet.</p>
    </main>
  );
}
