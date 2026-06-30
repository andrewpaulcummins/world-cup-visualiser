// ISO 3166-1 alpha-2 codes for flagcdn.com
export const ISO = {
  BRA:'br', JPN:'jp', GER:'de', PAR:'py', FRA:'fr', SWE:'se',
  NED:'nl', MAR:'ma', CIV:'ci', NOR:'no', MEX:'mx', ECU:'ec',
  ENG:'gb-eng', COD:'cd', BEL:'be', SEN:'sn', USA:'us', BIH:'ba',
  ESP:'es', AUT:'at', POR:'pt', CRO:'hr', CAN:'ca', RSA:'za',
  ARG:'ar', DZA:'dz', GHA:'gh', COL:'co', EGY:'eg',
  AUS:'au', CHE:'ch', CPV:'cv',
};

export function flagUrl(code) {
  const iso = ISO[code];
  return iso ? `https://flagcdn.com/w40/${iso}.png` : null;
}

// Keep FLAGS for emoji fallback in non-SVG contexts (mobile card list)
export const FLAGS = {
  BRA:'🇧🇷', JPN:'🇯🇵', GER:'🇩🇪', PAR:'🇵🇾', FRA:'🇫🇷', SWE:'🇸🇪',
  NED:'🇳🇱', MAR:'🇲🇦', CIV:'🇨🇮', NOR:'🇳🇴', MEX:'🇲🇽', ECU:'🇪🇨',
  ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', COD:'🇨🇩', BEL:'🇧🇪', SEN:'🇸🇳', USA:'🇺🇸', BIH:'🇧🇦',
  ESP:'🇪🇸', AUT:'🇦🇹', POR:'🇵🇹', CRO:'🇭🇷', CAN:'🇨🇦', RSA:'🇿🇦',
  ARG:'🇦🇷', DZA:'🇩🇿', GHA:'🇬🇭', COL:'🇨🇴', EGY:'🇪🇬',
  AUS:'🇦🇺', CHE:'🇨🇭', CPV:'🇨🇻',
};

export const NAMES = {
  BRA:'Brazil', JPN:'Japan', GER:'Germany', PAR:'Paraguay', FRA:'France',
  SWE:'Sweden', NED:'Netherlands', MAR:'Morocco', CIV:'Ivory Coast',
  NOR:'Norway', MEX:'Mexico', ECU:'Ecuador', ENG:'England', COD:'Congo DR',
  BEL:'Belgium', SEN:'Senegal', USA:'USA', BIH:'Bosnia & Herz.', ESP:'Spain',
  AUT:'Austria', POR:'Portugal', CRO:'Croatia', CAN:'Canada', RSA:'S. Africa',
  ARG:'Argentina', DZA:'Algeria', GHA:'Ghana', COL:'Colombia', EGY:'Egypt',
  AUS:'Australia', CHE:'Switzerland', CPV:'Cape Verde',
};

// Order determines bracket connections: adjacent pairs (0+1, 2+3, …) meet in R16,
// groups of 4 (0-3, 4-7, …) meet in QF, halves (0-7, 8-15) meet in SF.
export const MATCHUPS = [
  // ── Left bracket (M101 semi-final) ───────────────────────────────────────
  // R16: M89  QF: M97
  { id:'m74', home:'GER', away:'PAR' },   // 0 ┐ meet in R16
  { id:'m77', home:'FRA', away:'SWE' },   // 1 ┘
  { id:'m75', home:'RSA', away:'CAN' },   // 2 ┐ meet in R16
  { id:'m76', home:'NED', away:'MAR' },   // 3 ┘
  // R16: M93/M94  QF: M98
  { id:'m83', home:'POR', away:'CRO' },   // 4 ┐ meet in R16
  { id:'m84', home:'ESP', away:'AUT' },   // 5 ┘
  { id:'m81', home:'USA', away:'BIH' },   // 6 ┐ meet in R16
  { id:'m82', home:'BEL', away:'SEN' },   // 7 ┘
  // ── Right bracket (M102 semi-final) ──────────────────────────────────────
  // R16: M91/M92  QF: M99
  { id:'m76', home:'BRA', away:'JPN' },   // 8  ┐ meet in R16
  { id:'m78', home:'CIV', away:'NOR' },   // 9  ┘
  { id:'m79', home:'MEX', away:'ECU' },   // 10 ┐ meet in R16
  { id:'m80', home:'ENG', away:'COD' },   // 11 ┘
  // R16: M95/M96  QF: M100
  { id:'m86', home:'ARG', away:'CPV' },   // 12 ┐ meet in R16
  { id:'m88', home:'EGY', away:'AUS' },   // 13 ┘
  { id:'m85', home:'DZA', away:'CHE' },   // 14 ┐ meet in R16
  { id:'m87', home:'COL', away:'GHA' },   // 15 ┘
];
