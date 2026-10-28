import { governanceEn } from "./governance.en";
/**
 * English interface strings (spec 031): the source of truth. ar.ts is typed
 * against this object, so a key missing from Arabic fails the type check.
 * Strings that carry a count or a name are functions.
 */
export const en = {
  language: {
    label: "Language",
    english: "English",
    arabic: "العربية",
  },
  login: {
    title: "Sign in",
    intro: "Process mapping, RACI, and authority matrices for client engagements.",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in…",
  },
  common: {
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    keep: "Keep",
    edit: "Edit",
    add: "Add",
    remove: "Remove",
    none: "— none —",
    unassigned: "Unassigned",
    archived: "archived",
    couldNotSave: "Could not save.",
    working: "Working…",
    loading: "Loading…",
  },
  shell: {
    firmSettings: "Firm Settings",
    signOut: "Sign out",
  },
  /** The office's builder home (spec 067 §4.2): the navy band, its six tabs, and To handle. */
  builder: {
    title: "Process builder",
    eyebrow: "Processes · Builder",
    staffView: "Open the staff view",
    newProcess: "New process",
    sections: "Builder sections",
    views: "Views",
    viewOnly: "View only",
    tabs: {
      all: "All processes",
      handle: "To handle",
      landscape: "Landscape",
      priorities: "Priorities",
      governance: "Governance",
      export: "Export",
    },
    landscapeViews: { valueChain: "Value chain", helicopter: "Helicopter view" },
    desc: {
      all: (n: number, drafts: number) => `Strategy Office · ${n} process${n === 1 ? "" : "es"} · ${drafts} draft${drafts === 1 ? "" : "s"} · every process, in every state`,
      handle: "Drafts the approver sent back or approved, and processes with gaps.",
      landscape: "How the processes fit together: the value chain and the helicopter view, in one place.",
      priorities: "Which processes the office takes deep next: full steps, RACI, controls and an SOP.",
      governance: "The assessment, risks, policies, and the controls that come from each process.",
      export: "Pick processes and build the pack: the company, a summary, the org structure, then each process.",
      other: "The Strategy Office's own pages.",
    },
    tiles: { sentBack: "Sent back", drafts: "Drafts", gaps: "Gaps" },
    handle: {
      emptyTitle: "Nothing waiting on the office",
      emptyBody: "Drafts sent back or approved, and processes with gaps, show up here.",
      sentBack: "Sent back",
      sentBackBy: (who: string) => `${who} sent it back`,
      approved: "Approved",
      approvedLine: (who: string) => `${who} approved it. Publishing puts it in force and asks everyone with a step to read it.`,
      theApprover: "The approver",
      gaps: "Gaps",
      gapsLine: (n: number) => `${n} process${n === 1 ? "" : "es"} being drawn ${n === 1 ? "has" : "have"} gaps`,
      gapCount: (n: number) => `${n} gap${n === 1 ? "" : "s"}`,
      open: "Open",
    },
  },
  governance: governanceEn,
};

export type Messages = typeof en;
