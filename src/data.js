// ============================================================
//  SPECIAL FC — 2026 LEAGUE DATA
//  Edit this file to update teams, fixtures, squads, config.
// ============================================================

// ── League Config ────────────────────────────────────────────
export const LEAGUE = {
  name:    "Special FC",
  season:  "2026",
  venue:   "Abuja, Nigeria",
  format:  "Double Round-Robin",
  totalMatchdays: 6,
  adminPassword:  "sfc2026",       // ← change this!
};

// ── Team Colours ──────────────────────────────────────────────
// color: main colour  |  abbr: 3-letter badge label
export const TEAMS = {
  Ajax:      { color: "#D42B2B", abbr: "AJX" },
  Flamengo:  { color: "#B01020", abbr: "FLA" },
  Lyon:      { color: "#1859B8", abbr: "LYO" },
  Wolfsburg: { color: "#27A43C", abbr: "WOL" },
};

// ── Squad Lists ───────────────────────────────────────────────
// Add or remove players here. Names must match exactly what
// you enter as scorers/assist providers in the admin panel.
export const SQUADS = {
  Ajax: [
    "Clint", "Don", "Ps5", "T.M",
    "Near Here", "Matthew", "Energy", "Val",
  ],
  Flamengo: [
    "Shola", "Khalifa", "Mamba", "Yinka",
    "Precious", "Godbam", "Miles", "Salvation", "Dr. Luther",
  ],
  Lyon: [
    "Jerry", "Adam", "Jude", "Rabiu",
    "Promise", "Chally", "Dodo (Rabiu Bro)", "Gerald", "Khalifa (Solar)",
  ],
  Wolfsburg: [
    "Sam", "Brown", "Gbenga", "Kanayo",
    "Bright", "Kayode", "Habeeb", "Lawman", "Austin",
  ],
};

// ── Fixture Schedule ──────────────────────────────────────────
// Each matchday has 2 matches (early + late slot).
// Slot distribution is balanced: every team plays 3 Early + 3 Late.
//
//  MD | Date           | Early (7:30–8:15)        | Late (8:20–9:05)
//  1  | Sat 21 Mar 26  | Ajax vs Flamengo          | Lyon vs Wolfsburg
//  2  | Sat 04 Apr 26  | Flamengo vs Wolfsburg      | Ajax vs Lyon
//  3  | Sat 18 Apr 26  | Lyon vs Ajax               | Wolfsburg vs Flamengo
//  4  | Sat 02 May 26  | Wolfsburg vs Ajax          | Flamengo vs Lyon
//  5  | Sat 16 May 26  | Lyon vs Flamengo           | Ajax vs Wolfsburg
//  6  | Sat 06 Jun 26  | Wolfsburg vs Lyon          | Flamengo vs Ajax
//
// Slot count per team: Ajax 3E/3L · Flamengo 3E/3L · Lyon 3E/3L · Wolfsburg 3E/3L ✓
export const FIXTURES = [
  {
    md: 1,
    date: "Sat 21 Mar 2026",
    matches: [
      { home: "Ajax",     away: "Flamengo",  slot: "Early" },
      { home: "Lyon",     away: "Wolfsburg", slot: "Late"  },
    ],
  },
  {
    md: 2,
    date: "Sat 04 Apr 2026",
    matches: [
      { home: "Flamengo", away: "Wolfsburg", slot: "Early" },
      { home: "Ajax",     away: "Lyon",      slot: "Late"  },
    ],
  },
  {
    md: 3,
    date: "Sat 18 Apr 2026",
    matches: [
      { home: "Lyon",     away: "Ajax",      slot: "Early" },
      { home: "Wolfsburg",away: "Flamengo",  slot: "Late"  },
    ],
  },
  {
    md: 4,
    date: "Sat 02 May 2026",
    matches: [
      { home: "Wolfsburg",away: "Ajax",      slot: "Early" },
      { home: "Flamengo", away: "Lyon",      slot: "Late"  },
    ],
  },
  {
    md: 5,
    date: "Sat 16 May 2026",
    matches: [
      { home: "Lyon",     away: "Flamengo",  slot: "Early" },
      { home: "Ajax",     away: "Wolfsburg", slot: "Late"  },
    ],
  },
  {
    md: 6,
    date: "Sat 06 Jun 2026",
    matches: [
      { home: "Wolfsburg",away: "Lyon",      slot: "Early" },
      { home: "Flamengo", away: "Ajax",      slot: "Late"  },
    ],
  },
];

// ── Slot Times ────────────────────────────────────────────────
export const SLOT_TIMES = {
  Early: "7:30–8:15",
  Late:  "8:20–9:05",
};
