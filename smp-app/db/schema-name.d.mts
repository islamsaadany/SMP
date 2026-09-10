/* Types for db/schema-name.mjs — the file itself is plain ESM because
   db/apply.mjs and the scripts are run by node directly and cannot import a
   .ts. One name, one place (§317.4); this only tells tsc what it is. */
export declare const SCHEMA: string;
export declare function schemaIdent(name?: string): string;
