export const PET_APPEARANCE_IDS = ['ayah', 'bolt', 'cloudlet', 'cosmo', 'boba'] as const;

export type PetAppearanceId = (typeof PET_APPEARANCE_IDS)[number];

export const PET_APPEARANCE_LABELS: Record<PetAppearanceId, string> = {
  ayah: 'Ayah',
  bolt: 'Bolt',
  cloudlet: 'Cloudlet',
  cosmo: 'Cosmo',
  boba: 'Boba',
};

export function isPetAppearanceId(value: string): value is PetAppearanceId {
  return (PET_APPEARANCE_IDS as readonly string[]).includes(value);
}

export function normalizePetAppearanceId(value: unknown): PetAppearanceId {
  if (typeof value === 'string' && isPetAppearanceId(value)) {
    return value;
  }
  return 'ayah';
}
