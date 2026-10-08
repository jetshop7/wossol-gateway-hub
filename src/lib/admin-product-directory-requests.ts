export type DirectoryFilters = {
  query: string;
  companyId: string;
  taxonomyNodeId: string;
  countryOfOrigin: string;
  publicationStatus: string;
};

export function directoryFilterDelay(previous: DirectoryFilters, next: DirectoryFilters) {
  const onlyTextFiltersChanged =
    previous.companyId === next.companyId &&
    previous.taxonomyNodeId === next.taxonomyNodeId &&
    previous.publicationStatus === next.publicationStatus;
  const textChanged =
    previous.query !== next.query || previous.countryOfOrigin !== next.countryOfOrigin;
  return onlyTextFiltersChanged && textChanged ? 250 : 0;
}

export function createLatestRequestGate() {
  let latest = 0;
  return {
    begin() {
      latest += 1;
      return latest;
    },
    isCurrent(id: number) {
      return id === latest;
    },
    invalidate() {
      latest += 1;
    },
  };
}
