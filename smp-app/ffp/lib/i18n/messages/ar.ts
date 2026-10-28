import type { Messages } from "./en";
import { governanceAr } from "./governance.ar";

/**
 * Arabic interface strings (spec 031), Modern Standard Arabic for business
 * users. Typed against en.ts, so every key must be present. Digits stay
 * Western throughout, matching process codes.
 */
export const ar: Messages = {
  language: {
    label: "اللغة",
    english: "English",
    arabic: "العربية",
  },
  login: {
    title: "تسجيل الدخول",
    intro: "خرائط العمليات ومصفوفات RACI ومصفوفات الصلاحيات لمشاريع العملاء.",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    submit: "تسجيل الدخول",
    submitting: "جارٍ تسجيل الدخول…",
  },
  common: {
    save: "حفظ",
    saving: "جارٍ الحفظ…",
    cancel: "إلغاء",
    close: "إغلاق",
    delete: "حذف",
    keep: "إبقاء",
    edit: "تعديل",
    add: "إضافة",
    remove: "إزالة",
    none: "— لا شيء —",
    unassigned: "غير مُسند",
    archived: "مؤرشف",
    couldNotSave: "تعذّر الحفظ.",
    working: "جارٍ العمل…",
    loading: "جارٍ التحميل…",
  },
  shell: {
    firmSettings: "إعدادات الشركة",
    signOut: "تسجيل الخروج",
  },
  builder: {
    title: "منشئ العمليات",
    eyebrow: "العمليات · المنشئ",
    staffView: "فتح عرض الموظفين",
    newProcess: "عملية جديدة",
    sections: "أقسام المنشئ",
    views: "طرق العرض",
    viewOnly: "عرض فقط",
    tabs: {
      all: "كل العمليات",
      handle: "للمعالجة",
      landscape: "المشهد العام",
      priorities: "الأولويات",
      governance: "الحوكمة",
      export: "التصدير",
    },
    landscapeViews: { valueChain: "سلسلة القيمة", helicopter: "النظرة الشاملة" },
    desc: {
      all: (n: number, drafts: number) => `مكتب الاستراتيجية · ${n} عملية · ${drafts} مسودة · كل عملية في كل حالاتها`,
      handle: "مسودات أعادها المعتمِد أو اعتمدها، وعمليات بها فجوات.",
      landscape: "كيف تترابط العمليات: سلسلة القيمة والنظرة الشاملة في مكان واحد.",
      priorities: "أي العمليات يتعمق فيها المكتب تالياً: الخطوات الكاملة ومصفوفة RACI والضوابط وإجراء التشغيل القياسي.",
      governance: "التقييم والمخاطر والسياسات والضوابط الناتجة عن كل عملية.",
      export: "اختر العمليات وأنشئ الحزمة: الشركة وملخص والهيكل التنظيمي ثم كل عملية.",
      other: "صفحات مكتب الاستراتيجية.",
    },
    tiles: { sentBack: "معادة", drafts: "مسودات", gaps: "فجوات" },
    handle: {
      emptyTitle: "لا شيء ينتظر المكتب",
      emptyBody: "تظهر هنا المسودات المعادة أو المعتمدة والعمليات التي بها فجوات.",
      sentBack: "معادة",
      sentBackBy: (who: string) => `أعادها ${who}`,
      approved: "معتمدة",
      approvedLine: (who: string) => `اعتمدها ${who}. النشر يجعلها سارية ويطلب من كل من له خطوة فيها قراءتها.`,
      theApprover: "المعتمِد",
      gaps: "فجوات",
      gapsLine: (n: number) => `${n} عملية قيد الرسم بها فجوات`,
      gapCount: (n: number) => `${n} فجوة`,
      open: "فتح",
    },
  },
  governance: governanceAr,
};
