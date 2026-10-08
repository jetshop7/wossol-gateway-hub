const ISO_3166_ALPHA_2_CODES = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ
BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ
DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR
GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY
HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP
KE KG KH KI KM KN KP KR KW KY KZ
LA LB LC LI LK LR LS LT LU LV LY
MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ
NA NC NE NF NG NI NL NO NP NR NU NZ
OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW
SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ
TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ
VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW
`
  .trim()
  .split(/\s+/);

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
const countryCodes = new Set(ISO_3166_ALPHA_2_CODES);

export type CountryOption = { code: string; name: string };

export const COUNTRIES: CountryOption[] = ISO_3166_ALPHA_2_CODES.map((code) => ({
  code,
  name: countryNames.of(code) ?? code,
})).sort((left, right) => left.name.localeCompare(right.name, "en"));

export function searchCountries(query: string): CountryOption[] {
  const normalized = normalizeCountrySearch(query);
  if (!normalized) return COUNTRIES;
  return COUNTRIES.filter(
    (country) =>
      normalizeCountrySearch(country.name).includes(normalized) ||
      country.code.toLowerCase().includes(normalized),
  );
}

export function countryLabel(value: string | null | undefined): string {
  const normalized = value?.trim();
  if (!normalized) return "";
  const country = COUNTRIES.find((item) => item.code === normalized.toUpperCase());
  return country ? `${country.name} (${country.code})` : normalized;
}

export function validCountryCode(value: string | null | undefined): string | undefined {
  const normalized = value?.trim().toUpperCase();
  return normalized && countryCodes.has(normalized) ? normalized : undefined;
}

export function getDefaultProductOrigin(companyCountryCode: string | null | undefined): string {
  return validCountryCode(companyCountryCode) ?? "DZ";
}

export const clientCountryLabel = countryLabel;

function normalizeCountrySearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
