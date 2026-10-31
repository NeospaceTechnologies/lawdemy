import { z } from "zod";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { fail, invalid, ok, readJson } from "@/lib/http";
import { requireStaff } from "@/lib/auth/staff";
import { materialise, TAXONOMY_KINDS, type TaxonomyKind } from "@/lib/taxonomy-store";

const kind = z.enum(Object.keys(TAXONOMY_KINDS) as [TaxonomyKind, ...TaxonomyKind[]]);
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), kind, value: z.string().trim().min(2, "Enter a value.").max(80) }),
  z.object({ action: z.literal("rename"), kind, id: z.string(), value: z.string().trim().min(2, "Enter a value.").max(80) }),
  z.object({ action: z.literal("toggle"), kind, id: z.string() }),
  z.object({ action: z.literal("move"), kind, id: z.string(), dir: z.enum(["up", "down"]) }),
]);

// ADM-11: manage lists without a code release. Values are hidden rather than deleted, so
// profiles and courses that already use them stay valid.
export async function POST(req: Request) {
  const { user, error } = await requireStaff();
  if (error) return error;
  const p = schema.safeParse(await readJson(req));
  if (!p.success) return invalid(p.error);
  const d = p.data;
  await materialise(d.kind);
  if (d.action === "add") {
    if (await db.taxonomyItem.count({ where: { kind: d.kind, value: d.value } })) return fail(409, "EXISTS", "That value is already in the list.");
    const last = await db.taxonomyItem.findFirst({ where: { kind: d.kind }, orderBy: { position: "desc" } });
    await db.taxonomyItem.create({ data: { kind: d.kind, value: d.value, position: (last?.position ?? -1) + 1 } });
  } else {
    const item = await db.taxonomyItem.findFirst({ where: { id: d.id, kind: d.kind } });
    if (!item) return fail(404, "NOT_FOUND", "Value not found. Reload and try again.");
    if (d.action === "rename") {
      if (d.kind === "category") return fail(409, "NOT_ALLOWED", "Course categories can’t be renamed because courses store them. Hide it and add a new one.");
      await db.taxonomyItem.update({ where: { id: item.id }, data: { value: d.value } });
    } else if (d.action === "toggle") {
      await db.taxonomyItem.update({ where: { id: item.id }, data: { active: !item.active } });
    } else {
      const all = await db.taxonomyItem.findMany({ where: { kind: d.kind }, orderBy: { position: "asc" } });
      const i = all.findIndex((x) => x.id === item.id);
      const j = d.dir === "up" ? i - 1 : i + 1;
      if (j >= 0 && j < all.length) {
        [all[i], all[j]] = [all[j], all[i]];
        await db.$transaction(all.map((x, pos) => db.taxonomyItem.update({ where: { id: x.id }, data: { position: pos } })));
      }
    }
  }
  await audit({ actorId: user.id, action: `taxonomy_${d.action}`, targetType: "taxonomy", targetId: d.kind, after: d });
  return ok({ ok: true });
}
