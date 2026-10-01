/* Only FFProcess's stylesheet (ffp/globals.css, imported by the Processes
   pages alone) uses Tailwind; every other SMP stylesheet is plain CSS. */
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
