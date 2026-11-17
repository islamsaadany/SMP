import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/* The platform's own typeface: the variable Source Sans 3 file the product
   ships (SMP-Project-Folder/src/fonts), loaded from public/fonts so the
   render needs no network. */
const FAMILY = "Source Sans 3";
export const fontReady = loadFont({ family: FAMILY, url: staticFile("fonts/Source_Sans_3.woff2"), format: "woff2", weight: "200 900" });
/* Quoted: a family name with a digit in it is invalid unquoted in CSS. */
export const FONT = `"${FAMILY}", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

/* The platform's own tokens (SMP-Project-Folder/src/_shared.css, Forefront palette) */
export const C = {
  ground: "#F7F8FA",
  surface: "#FFFFFF",
  surface2: "#EFF2F6",
  ink: "#0F172A",
  ink2: "#334155",
  ink3: "#5E6E85",
  line: "#D6DCE5",
  lineSoft: "#E6EAF0",
  navy: "#16325C",
  navyDeep: "#0F2C69",
  navyInk: "#FFFFFF",
  amber: "#F5A623",
  gold: "#C9A24D",
  cta: "#C2410C",
  ctaHover: "#9A3412",
  good: "#059669",
  goodTx: "#047857",
  goodBg: "#ECFDF5",
  attn: "#D97706",
  attnTx: "#B45309",
  attnBg: "#FFFBEB",
  bad: "#DC2626",
  badTx: "#B91C1C",
  badBg: "#FEF2F2",
  dark: "#0B1120",
  dark2: "#131C2E",
  darkInk: "#E8EDF5",
  darkQuiet: "#94A3B8",
};

export type Band = "good" | "attn" | "bad";
export const bandOf = (v: number): Band => (v >= 90 ? "good" : v >= 70 ? "attn" : "bad");
export const bandColor = (b: Band) => (b === "good" ? C.good : b === "attn" ? C.attn : C.bad);
export const bandText = (b: Band) => (b === "good" ? C.goodTx : b === "attn" ? C.attnTx : C.badTx);
export const bandBg = (b: Band) => (b === "good" ? C.goodBg : b === "attn" ? C.attnBg : C.badBg);
export const bandLabel = (b: Band) => (b === "good" ? "On track" : b === "attn" ? "Needs attention" : "Off track");
