// Shared bilingual labels for roles and wards used across src/data/councillors.json.
// Kept separate from the data file itself so the CMS only has to store a
// short key (e.g. "chair", "llansannan") rather than the clerk having to
// type matching Welsh/English text by hand every time.

export const ROLE_LABELS = {
  chair: { cy: 'Cadeirydd', en: 'Chair' },
  vice_chair: { cy: 'Is-gadeirydd', en: 'Vice-Chair' },
  councillor: { cy: 'Cynghorydd', en: 'Councillor' },
  clerk: { cy: 'Clerc', en: 'Clerk' },
  rfo: { cy: 'Swyddog Cyllid Cyfrifol', en: 'Responsible Financial Officer' },
  vacant: { cy: 'Swydd Wag', en: 'Vacancy' },
};

export const WARD_LABELS = {
  llansannan: { cy: 'Ward Llansannan', en: 'Llansannan Ward' },
  bylchau: { cy: 'Ward Bylchau', en: 'Bylchau Ward' },
  llannefydd: { cy: 'Ward Llannefydd', en: 'Llannefydd Ward' },
  staff: { cy: 'Staff y Cyngor', en: 'Council Staff' },
};

// The three electoral wards, in display order. Deliberately excludes
// "staff" (Clerk, RFO, etc.) -- those aren't elected and don't belong on
// a ward listing.
export const ELECTED_WARDS = ['llansannan', 'bylchau', 'llannefydd'];
