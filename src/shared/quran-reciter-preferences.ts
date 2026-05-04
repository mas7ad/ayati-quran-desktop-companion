export interface QuranRecitationResource {
  id: number;
  name: string;
}

const REMOVED_RECITER_PATTERN = /mishari|mishary|alafasy|afasy/i;
const DEFAULT_RECITER_PATTERN = /abu\s*bakr|shatri|shatree|ash-shatri/i;

export function isRemovedRecitationResource(resource: QuranRecitationResource): boolean {
  return REMOVED_RECITER_PATTERN.test(resource.name);
}

export function filterAvailableRecitationResources(
  resources: QuranRecitationResource[],
): QuranRecitationResource[] {
  return resources.filter((resource) => !isRemovedRecitationResource(resource));
}

export function selectDefaultRecitationResource(
  resources: QuranRecitationResource[],
): QuranRecitationResource | null {
  const availableResources = filterAvailableRecitationResources(resources);
  return availableResources.find((resource) => DEFAULT_RECITER_PATTERN.test(resource.name))
    ?? availableResources[0]
    ?? null;
}
