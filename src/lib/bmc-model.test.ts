import { describe, expect, it } from "vitest";
import { adCanLaunch, campaignRecipients, fmtDate, fmtDateTime, normalizeMaPhone, scheduleDates, validatePost } from "./bmc-model";

const base = {
  description: "Texte",
  media: [] as { id: string; kind: "image" | "video"; src: string; name: string }[],
  platforms: [] as ("instagram" | "tiktok" | "facebook" | "linkedin")[],
  perNetwork: {},
  date: "2026-10-09",
  time: "18:30",
  status: "draft" as const,
  hashtags: "",
  location: "",
  tone: "expert" as const,
  captionLength: "moyenne" as const,
  language: "fr" as const,
};
const now = new Date(2026, 9, 7, 12, 0);

describe("règles BMC", () => {
  it("dates au format JJ/MM/AAAA", () => {
    expect(fmtDate("2026-10-09")).toBe("09/10/2026");
    expect(fmtDateTime("2026-10-09", "18:30")).toBe("09/10/2026 à 18:30");
  });
  it("3× par semaine espace les posts de 2 à 3 jours", () => {
    expect(scheduleDates("3x", 3, "2026-10-07")).toEqual(["2026-10-09", "2026-10-11", "2026-10-14"]);
  });
  it("refuse une date passée", () => {
    const e = validatePost({ ...base, platforms: ["facebook"], date: "2026-10-01" }, "schedule", now);
    expect(e["date"]).toBeDefined();
  });
  it("Instagram exige au moins 1 média", () => {
    expect(validatePost({ ...base, platforms: ["instagram"] }, "now", now)["instagram"]).toBeDefined();
  });
  it("TikTok exige au moins 1 vidéo", () => {
    const withImage = { ...base, platforms: ["tiktok" as const], media: [{ id: "1", kind: "image" as const, src: "", name: "" }] };
    expect(validatePost(withImage, "now", now)["tiktok"]).toBeDefined();
    const withVideo = { ...withImage, media: [{ id: "2", kind: "video" as const, src: "", name: "" }] };
    expect(validatePost(withVideo, "now", now)["tiktok"]).toBeUndefined();
  });
  it("vérifie le format +212", () => {
    expect(normalizeMaPhone("06 12 34 56 78")).toBe("+212612345678");
    expect(normalizeMaPhone("+212 7 11 22 33 44")).toBe("+212711223344");
    expect(normalizeMaPhone("12345")).toBeNull();
  });
  it("lancement de publicité bloqué sans budget ni dates", () => {
    expect(adCanLaunch({ budget: 0, startDate: "2026-10-10", startTime: "09:00", budgetType: "daily" })).toBe(false);
    expect(adCanLaunch({ budget: 150, startDate: "", startTime: "", budgetType: "daily" })).toBe(false);
    expect(adCanLaunch({ budget: 150, startDate: "2026-10-10", startTime: "09:00", budgetType: "daily" })).toBe(true);
  });
  it("une campagne peut viser tous les destinataires ou une sélection individuelle", () => {
    const contacts = [
      { id: "a", name: "A", company: "BMC", phone: "+212611111111", category: "Client", consent: true, unsubscribed: false, lists: ["Clients"] },
      { id: "b", name: "B", company: "BMC", phone: "+212622222222", category: "Client", consent: true, unsubscribed: false, lists: ["Clients"] },
      { id: "c", name: "C", company: "BMC", phone: "+212633333333", category: "Client", consent: false, unsubscribed: false, lists: ["Clients"] },
    ];
    expect(campaignRecipients({ channel: "whatsapp", list: "Clients", recipientMode: "all" }, contacts).map((c) => c.id)).toEqual(["a", "b"]);
    expect(campaignRecipients({ channel: "whatsapp", list: "Clients", recipientMode: "selected", recipientIds: ["b"] }, contacts).map((c) => c.id)).toEqual(["b"]);
    expect(campaignRecipients({ channel: "telegram", list: "Clients", recipientMode: "selected", recipientIds: ["c"] }, contacts).map((c) => c.id)).toEqual(["c"]);
  });
});
