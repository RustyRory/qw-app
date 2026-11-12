// Liste des pays (codes ISO 3166-1 alpha-2), libellés en français fournis
// par le navigateur. La valeur enregistrée est le nom français du pays
// (« France », « Belgique »…), lisible tel quel et reconnu par le scoring
// (critère « bénéficiaire étranger »).
const CODES =
  "AF ZA AL DZ DE AD AO AI AQ AG SA AR AM AW AU AT AZ BS BH BD BB BE BZ BJ BM BT BY MM BO BA BW BR BN BG BF BI KH CM CA CV CL CN CY CO KM CG CD KP KR CR CI HR CU CW DK DJ DM EG AE EC ER ES EE SZ US ET FJ FI FR GA GM GE GS GH GI GR GD GL GP GU GT GG GN GQ GW GY GF HT HN HK HU IM UM VG VI IN ID IQ IR IE IS IL IT JM JP JE JO KZ KE KG KI XK KW LA LS LV LB LR LY LI LT LU MO MK MG MY MW MV ML MT MP MA MH MQ MU MR YT MX FM MD MC MN ME MS MZ NA NR NP NI NE NG NU NF NO NC NZ IO OM UG UZ PK PW PS PA PG PY NL PE PH PN PL PF PR PT QA CF DO CZ RE RO GB RU RW EH BL KN SM MF SX PM VC SH LC SB WS AS ST SN RS SC SL SG SK SI SO SD SS LK SE CH SR SJ SY TJ TW TZ TD TF TH TL TG TK TO TT TN TM TC TR TV UA UY VU VA VE VN WF YE ZM ZW BQ AX BV CC CK CX FK FO HM KY".split(
    " ",
  );

function libelles(): string[] {
  try {
    const dn = new Intl.DisplayNames(["fr"], { type: "region" });
    return CODES.map((c) => dn.of(c) ?? c);
  } catch {
    return CODES;
  }
}

// France en tête, puis ordre alphabétique français.
export const PAYS: string[] = (() => {
  const noms = Array.from(new Set(libelles())).filter((n) => n !== "France");
  noms.sort((a, b) => a.localeCompare(b, "fr"));
  return ["France", ...noms];
})();
