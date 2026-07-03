// ISO 3166-1 alpha-2 codes for flagcdn.com
export const ISO = {
  // Bracket teams
  BRA:'br', JPN:'jp', GER:'de', PAR:'py', FRA:'fr', SWE:'se',
  NED:'nl', MAR:'ma', CIV:'ci', NOR:'no', MEX:'mx', ECU:'ec',
  ENG:'gb-eng', COD:'cd', BEL:'be', SEN:'sn', USA:'us', BIH:'ba',
  ESP:'es', AUT:'at', POR:'pt', CRO:'hr', CAN:'ca', RSA:'za',
  ARG:'ar', DZA:'dz', GHA:'gh', COL:'co', EGY:'eg',
  AUS:'au', CHE:'ch', CPV:'cv',
  // Additional WC 2026 teams
  URU:'uy', KOR:'kr', PRK:'kp', IRN:'ir', KSA:'sa', SRB:'rs',
  ROU:'ro', DEN:'dk', TUR:'tr', UKR:'ua', POL:'pl', HUN:'hu',
  SVK:'sk', SVN:'si', VEN:'ve', PAN:'pa', CRC:'cr', HON:'hn',
  NZL:'nz', NGA:'ng', CMR:'cm', IRQ:'iq', UZB:'uz', JOR:'jo',
  MLI:'ml', SLV:'sv', JAM:'jm', TTO:'tt', ZAM:'zm', BFA:'bf',
  TAN:'tz', CZE:'cz', GRE:'gr', WAL:'gb-wls', ISR:'il', ALB:'al',
  MKD:'mk', ISL:'is', FIN:'fi', IRL:'ie', SCO:'gb-sct', WLS:'gb-wls',
  NOR:'no', SWE:'se', TUN:'tn', LBY:'ly', ZIM:'zw', KEN:'ke',
  UGA:'ug', ANG:'ao', MOZ:'mz', GUI:'gn', GAB:'ga', MOI:'ml',
  ETH:'et', SOM:'so', YEM:'ye', SYR:'sy', LBN:'lb', OMN:'om',
  QAT:'qa', ARE:'ae', BHR:'bh', KUW:'kw', TKM:'tm', KGZ:'kg',
  TJK:'tj', MNG:'mn', VIE:'vn', THA:'th', IDN:'id', MYS:'my',
  PHL:'ph', SGP:'sg', IND:'in', PAK:'pk', BAN:'bd', SRI:'lk',
  BOL:'bo', PER:'pe', CHI:'cl', GUY:'gy', SUR:'sr', BRB:'bb',
  TRI:'tt', CUB:'cu', HAI:'ht', DOM:'do', GUA:'gt', NIC:'ni',
  COS:'cr', BLZ:'bz', ATG:'ag', LCA:'lc', SKN:'kn',
};

export function flagUrl(code) {
  const iso = ISO[code];
  return iso ? `https://flagcdn.com/w40/${iso}.png` : null;
}

// Keep FLAGS for emoji fallback in non-SVG contexts (mobile card list)
export const FLAGS = {
  // Bracket teams
  BRA:'🇧🇷', JPN:'🇯🇵', GER:'🇩🇪', PAR:'🇵🇾', FRA:'🇫🇷', SWE:'🇸🇪',
  NED:'🇳🇱', MAR:'🇲🇦', CIV:'🇨🇮', NOR:'🇳🇴', MEX:'🇲🇽', ECU:'🇪🇨',
  ENG:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', COD:'🇨🇩', BEL:'🇧🇪', SEN:'🇸🇳', USA:'🇺🇸', BIH:'🇧🇦',
  ESP:'🇪🇸', AUT:'🇦🇹', POR:'🇵🇹', CRO:'🇭🇷', CAN:'🇨🇦', RSA:'🇿🇦',
  ARG:'🇦🇷', DZA:'🇩🇿', GHA:'🇬🇭', COL:'🇨🇴', EGY:'🇪🇬',
  AUS:'🇦🇺', CHE:'🇨🇭', CPV:'🇨🇻',
  // Additional WC 2026 teams
  URU:'🇺🇾', KOR:'🇰🇷', IRN:'🇮🇷', KSA:'🇸🇦', SRB:'🇷🇸', ROU:'🇷🇴',
  DEN:'🇩🇰', TUR:'🇹🇷', UKR:'🇺🇦', POL:'🇵🇱', HUN:'🇭🇺', SVK:'🇸🇰',
  SVN:'🇸🇮', VEN:'🇻🇪', PAN:'🇵🇦', CRC:'🇨🇷', HON:'🇭🇳', NZL:'🇳🇿',
  NGA:'🇳🇬', CMR:'🇨🇲', IRQ:'🇮🇶', UZB:'🇺🇿', JOR:'🇯🇴', MLI:'🇲🇱',
  SLV:'🇸🇻', JAM:'🇯🇲', TTO:'🇹🇹', ZAM:'🇿🇲', BFA:'🇧🇫', TAN:'🇹🇿',
  CZE:'🇨🇿', GRE:'🇬🇷', WAL:'🏴󠁧󠁢󠁷󠁬󠁳󠁿', ISR:'🇮🇱', ALB:'🇦🇱', MKD:'🇲🇰',
  ISL:'🇮🇸', FIN:'🇫🇮', IRL:'🇮🇪', SCO:'🏴󠁧󠁢󠁳󠁣󠁴󠁿', WLS:'🏴󠁧󠁢󠁷󠁬󠁳󠁿', TUN:'🇹🇳',
  ZIM:'🇿🇼', KEN:'🇰🇪', UGA:'🇺🇬', ANG:'🇦🇴', MOZ:'🇲🇿', GUI:'🇬🇳',
  ETH:'🇪🇹', QAT:'🇶🇦', ARE:'🇦🇪', OMN:'🇴🇲', BHR:'🇧🇭', KUW:'🇰🇼',
  VIE:'🇻🇳', THA:'🇹🇭', IDN:'🇮🇩', PHL:'🇵🇭', IND:'🇮🇳', BOL:'🇧🇴',
  PER:'🇵🇪', CHI:'🇨🇱', GUA:'🇬🇹', NIC:'🇳🇮', COS:'🇨🇷', CUB:'🇨🇺',
  HAI:'🇭🇹', TRI:'🇹🇹', DOM:'🇩🇴',
};

export const NAMES = {
  // Bracket teams
  BRA:'Brazil', JPN:'Japan', GER:'Germany', PAR:'Paraguay', FRA:'France',
  SWE:'Sweden', NED:'Netherlands', MAR:'Morocco', CIV:'Ivory Coast',
  NOR:'Norway', MEX:'Mexico', ECU:'Ecuador', ENG:'England', COD:'Congo DR',
  BEL:'Belgium', SEN:'Senegal', USA:'USA', BIH:'Bosnia & Herz.', ESP:'Spain',
  AUT:'Austria', POR:'Portugal', CRO:'Croatia', CAN:'Canada', RSA:'S. Africa',
  ARG:'Argentina', DZA:'Algeria', GHA:'Ghana', COL:'Colombia', EGY:'Egypt',
  AUS:'Australia', CHE:'Switzerland', CPV:'Cape Verde',
  // Additional WC 2026 teams
  URU:'Uruguay', KOR:'South Korea', IRN:'Iran', KSA:'Saudi Arabia',
  SRB:'Serbia', ROU:'Romania', DEN:'Denmark', TUR:'Turkey', UKR:'Ukraine',
  POL:'Poland', HUN:'Hungary', SVK:'Slovakia', SVN:'Slovenia', VEN:'Venezuela',
  PAN:'Panama', CRC:'Costa Rica', HON:'Honduras', NZL:'New Zealand',
  NGA:'Nigeria', CMR:'Cameroon', IRQ:'Iraq', UZB:'Uzbekistan', JOR:'Jordan',
  MLI:'Mali', SLV:'El Salvador', JAM:'Jamaica', TTO:'Trinidad & Tobago',
  ZAM:'Zambia', BFA:'Burkina Faso', TAN:'Tanzania', CZE:'Czech Rep.',
  GRE:'Greece', WAL:'Wales', ISR:'Israel', ALB:'Albania', MKD:'N. Macedonia',
  ISL:'Iceland', FIN:'Finland', IRL:'Ireland', SCO:'Scotland', WLS:'Wales',
  TUN:'Tunisia', ZIM:'Zimbabwe', KEN:'Kenya', UGA:'Uganda', ANG:'Angola',
  MOZ:'Mozambique', GUI:'Guinea', ETH:'Ethiopia', QAT:'Qatar', ARE:'UAE',
  OMN:'Oman', BHR:'Bahrain', KUW:'Kuwait', VIE:'Vietnam', THA:'Thailand',
  IDN:'Indonesia', PHL:'Philippines', IND:'India', BOL:'Bolivia', PER:'Peru',
  CHI:'Chile', GUA:'Guatemala', NIC:'Nicaragua', COS:'Costa Rica',
  CUB:'Cuba', HAI:'Haiti', TRI:'Trinidad & Tobago', DOM:'Dominican Rep.',
};

// Primary kit colours — visible on dark backgrounds
export const TEAM_COLORS = {
  GER:'#E0E0E0', FRA:'#1C6DC5', BRA:'#F7D116', JPN:'#4169A4',
  NED:'#FF6200', MAR:'#C1272D', ENG:'#E0E0E0', USA:'#4169A4',
  ESP:'#C60B1E', POR:'#009A44', ARG:'#74ACDF', COL:'#FCD116',
  GHA:'#FCD116', AUS:'#FFB81C', CHE:'#D40000', BEL:'#EF2B2D',
  SEN:'#00A84F', CRO:'#CC0000', CAN:'#FF2222', RSA:'#00A84F',
  PAR:'#D52B1E', SWE:'#1C6DC5', NOR:'#EF2B2D', ECU:'#FFD100',
  MEX:'#009A44', EGY:'#CE1126', COD:'#4169A4', CIV:'#F77F00',
  BIH:'#4169A4', DZA:'#009A44', CPV:'#1C6DC5', AUT:'#ED2939',
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
