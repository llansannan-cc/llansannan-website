// Shared bilingual date formatting, built from a plain ISO date string
// (YYYY-MM-DD) picked via the CMS's calendar date widget. Used anywhere a
// meeting or event date needs to be shown as "Dydd Iau, 17 Medi 2026" /
// "Thursday, 17 September 2026" without hand-typing both versions in the CMS.

export const monthNamesEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const monthNamesCy = ['Ionawr','Chwefror','Mawrth','Ebrill','Mai','Mehefin','Gorffennaf','Awst','Medi','Hydref','Tachwedd','Rhagfyr'];

const weekdayNamesEn = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const weekdayNamesCy = ['Dydd Sul','Dydd Llun','Dydd Mawrth','Dydd Mercher','Dydd Iau','Dydd Gwener','Dydd Sadwrn'];

export function formatDateBilingual(iso: string): { cy: string; en: string } {
  const d = new Date(iso + 'T00:00:00');
  const day = d.getDate();
  const year = d.getFullYear();
  return {
    en: `${weekdayNamesEn[d.getDay()]}, ${day} ${monthNamesEn[d.getMonth()]} ${year}`,
    cy: `${weekdayNamesCy[d.getDay()]}, ${day} ${monthNamesCy[d.getMonth()]} ${year}`
  };
}
