export type PendingTaxonomySelection = {
  savedId: string | null;
  selectedId: string | null;
};

export function beginTaxonomySelection(savedId: string | null): PendingTaxonomySelection {
  return { savedId, selectedId: savedId };
}

export function chooseTaxonomySelection(
  draft: PendingTaxonomySelection,
  selectedId: string | null,
): PendingTaxonomySelection {
  return { ...draft, selectedId };
}

export function cancelTaxonomySelection(draft: PendingTaxonomySelection): string | null {
  return draft.savedId;
}

export function saveTaxonomySelection(draft: PendingTaxonomySelection): string | null {
  return draft.selectedId;
}

export function isTaxonomySelectionCurrent(
  selectedId: string | null,
  candidateId: string,
): boolean {
  return selectedId === candidateId;
}
