import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type AuditEntry = {
  actorId: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ip?: string | null;
};

// Append-only audit log (PRD 9, Audit logging).
export async function audit(entry: AuditEntry, tx: Prisma.TransactionClient = db) {
  await tx.auditLog.create({ data: entry });
}
