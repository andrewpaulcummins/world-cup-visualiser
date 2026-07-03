// accent = replaces --gold throughout the UI
// bg     = up to 3 flag colors for background glow blobs
export const TEAM_THEMES = {
  ARG: { accent: '#74ACDF', bg: ['#74ACDF', '#FFFFFF'] },
  AUS: { accent: '#FFCD00', bg: ['#00843D', '#FFCD00', '#003DA5'] },
  AUT: { accent: '#ED2939', bg: ['#ED2939', '#FFFFFF'] },
  BEL: { accent: '#FAE042', bg: ['#000000', '#FAE042', '#EF3340'] },
  BIH: { accent: '#FCD116', bg: ['#002395', '#FCD116', '#FFFFFF'] },
  BRA: { accent: '#FCDF00', bg: ['#009C3B', '#FCDF00', '#002776'] },
  CAN: { accent: '#FF5050', bg: ['#FF0000', '#FFFFFF'] },
  CHE: { accent: '#FF5050', bg: ['#FF0000', '#FFFFFF'] },
  CIV: { accent: '#FF8C00', bg: ['#F77F00', '#FFFFFF', '#009A44'] },
  CMR: { accent: '#4CAF70', bg: ['#007A5E', '#CE1126', '#FCDD09'] },
  COD: { accent: '#FFCD00', bg: ['#007FFF', '#FFCD00', '#CE1126'] },
  COL: { accent: '#FCD116', bg: ['#FCD116', '#003087', '#CE1126'] },
  CPV: { accent: '#4488CC', bg: ['#003893', '#CF2027', '#F7D116'] },
  CRO: { accent: '#FF5050', bg: ['#FF0000', '#FFFFFF', '#003DA5'] },
  DEN: { accent: '#C60C30', bg: ['#C60C30', '#FFFFFF'] },
  DZA: { accent: '#4CAF70', bg: ['#006233', '#FFFFFF'] },
  ECU: { accent: '#FFD100', bg: ['#FFD100', '#003DA5', '#EE1C25'] },
  EGY: { accent: '#EE1C25', bg: ['#EE1C25', '#FFFFFF', '#000000'] },
  ENG: { accent: '#CF142B', bg: ['#CF142B', '#FFFFFF'] },
  ESP: { accent: '#F1BF00', bg: ['#AA151B', '#F1BF00'] },
  FRA: { accent: '#6080EE', bg: ['#002395', '#FFFFFF', '#ED2939'] },
  GER: { accent: '#FFCE00', bg: ['#000000', '#DD0000', '#FFCE00'] },
  GHA: { accent: '#FCD116', bg: ['#EE1C25', '#FCD116', '#006B3F'] },
  GRE: { accent: '#4488CC', bg: ['#0D5EAF', '#FFFFFF'] },
  HON: { accent: '#4488CC', bg: ['#0073CF', '#FFFFFF'] },
  IRE: { accent: '#169B62', bg: ['#169B62', '#FFFFFF', '#FF883E'] },
  IRL: { accent: '#169B62', bg: ['#169B62', '#FFFFFF', '#FF883E'] },
  IRN: { accent: '#4CAF70', bg: ['#239F40', '#FFFFFF', '#DA0000'] },
  IRQ: { accent: '#EE1C25', bg: ['#007A3D', '#FFFFFF', '#EE1C25'] },
  ISR: { accent: '#4488CC', bg: ['#003DA5', '#FFFFFF'] },
  JAM: { accent: '#FED100', bg: ['#000000', '#FED100', '#009B3A'] },
  JPN: { accent: '#FF5050', bg: ['#BC002D', '#FFFFFF'] },
  KOR: { accent: '#CD2E3A', bg: ['#CD2E3A', '#FFFFFF', '#003478'] },
  KSA: { accent: '#4CAF70', bg: ['#006C35', '#FFFFFF'] },
  MAR: { accent: '#EF4040', bg: ['#C1272D', '#006233'] },
  MEX: { accent: '#4CAF70', bg: ['#006847', '#FFFFFF', '#CE1126'] },
  MLI: { accent: '#FCD116', bg: ['#14B53A', '#FCD116', '#CE1126'] },
  NED: { accent: '#FF6600', bg: ['#AE1C28', '#FFFFFF', '#21468B'] },
  NGA: { accent: '#4CAF70', bg: ['#008751', '#FFFFFF'] },
  NOR: { accent: '#EF5050', bg: ['#EF2B2D', '#FFFFFF', '#003680'] },
  NZL: { accent: '#5599FF', bg: ['#00247D', '#CC142B', '#FFFFFF'] },
  PAN: { accent: '#4488CC', bg: ['#005293', '#EE1C25', '#FFFFFF'] },
  PAR: { accent: '#EE1C25', bg: ['#002868', '#FFFFFF', '#EE1C25'] },
  PER: { accent: '#EE1C25', bg: ['#EE1C25', '#FFFFFF'] },
  POL: { accent: '#EE1C25', bg: ['#EE1C25', '#FFFFFF'] },
  POR: { accent: '#EF5050', bg: ['#006600', '#FF0000', '#FFD700'] },
  QAT: { accent: '#8D1B3D', bg: ['#8D1B3D', '#FFFFFF'] },
  ROU: { accent: '#FFD700', bg: ['#002B7F', '#FFD700', '#CE1126'] },
  RSA: { accent: '#007A4D', bg: ['#007A4D', '#FFB81C', '#002395'] },
  SCO: { accent: '#5599FF', bg: ['#003DA5', '#FFFFFF'] },
  SWE: { accent: '#FECC00', bg: ['#006AA7', '#FECC00'] },
  SEN: { accent: '#4CAF70', bg: ['#00853F', '#FDEF42', '#E31B23'] },
  SLV: { accent: '#4488CC', bg: ['#0F47AF', '#FFFFFF'] },
  SRB: { accent: '#C6363C', bg: ['#C6363C', '#FFFFFF', '#00358C'] },
  SVK: { accent: '#EE1C25', bg: ['#FFFFFF', '#003DA5', '#EE1C25'] },
  TUN: { accent: '#EE1C25', bg: ['#EE1C25', '#FFFFFF'] },
  TUR: { accent: '#EE1C25', bg: ['#EE1C25', '#FFFFFF'] },
  UKR: { accent: '#FFD700', bg: ['#005BBB', '#FFD700'] },
  URU: { accent: '#5EB6E4', bg: ['#5EB6E4', '#FFFFFF', '#000000'] },
  USA: { accent: '#5599FF', bg: ['#002868', '#BF0A30', '#FFFFFF'] },
  VEN: { accent: '#CF142B', bg: ['#CF142B', '#002868', '#FCCD01'] },
  WAL: { accent: '#EE1C25', bg: ['#00AB39', '#EE1C25', '#FFFFFF'] },
};

export const DEFAULT_THEME = {
  accent: '#C9A84C',
  bg: ['#C9A84C', '#7A6030'],
};

export function getTheme(teamCode) {
  return TEAM_THEMES[teamCode] || DEFAULT_THEME;
}

export function getDim(accent) {
  // Darken the accent color by ~40% for use as --gold-dim
  const n = parseInt(accent.replace('#', ''), 16);
  const r = Math.floor(((n >> 16) & 0xff) * 0.55);
  const g = Math.floor(((n >> 8) & 0xff) * 0.55);
  const b = Math.floor((n & 0xff) * 0.55);
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}
