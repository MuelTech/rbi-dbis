export type DuplicateAction = "skip" | "overwrite";

export interface FamilyMemberLinkPlan {
  toCreate: string[];
  toUpdate: string[];
  toRemove: string[];
}

/**
 * Decides how a family's member links should change for a batch import.
 *
 * Existing links are never removed: a resident omitted from the import is left
 * linked to their family rather than being orphaned. In `skip` mode existing
 * members are left untouched; in `overwrite` mode their relationship is updated.
 */
export function planFamilyMemberLinks(
  existingResidentIds: string[],
  incomingResidentIds: string[],
  duplicateAction: DuplicateAction
): FamilyMemberLinkPlan {
  const existing = new Set(existingResidentIds);
  const incoming = Array.from(new Set(incomingResidentIds));

  const toCreate = incoming.filter((id) => !existing.has(id));

  if (duplicateAction === "skip") {
    return { toCreate, toUpdate: [], toRemove: [] };
  }

  const toUpdate = incoming.filter((id) => existing.has(id));
  return { toCreate, toUpdate, toRemove: [] };
}
