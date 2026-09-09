import { NO_SUCH_TENANT } from "../../lib/door.ts";
/* ONE refusal for a client that is not yours and a client that does not
   exist (§313, contracts §1.4): the sentence is the door's, and it is the
   only thing said. */
export default function NotFound() {
  return (
    <main className="holder">
      <h1>{NO_SUCH_TENANT}</h1>
      <p><a href="/">Back to the door</a></p>
    </main>
  );
}
