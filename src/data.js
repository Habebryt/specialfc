// ============================================================
//  SPECIAL FC — 2026 LEAGUE DATA
//  ⭐ Only file you need to edit for all updates.
//
//  SCORE UPDATE WORKFLOW (after every matchday):
//  1. npm run dev  →  enter scores in admin panel
//  2. Admin → "📤 Export for data.js" → copy the block
//  3. Replace the entire RESULTS section at the bottom
//  4. git add src/data.js && git commit -m "MD1 results" && git push
//  5. Vercel deploys in ~30s ✅
// ============================================================

export const LEAGUE = {
  name:           "Special FC",
  season:         "2026",
  venue:          "Abuja, Nigeria",
  format:         "Double Round-Robin",
  totalMatchdays: 6,
  adminPassword:  "sfc2026",
};

export const TEAMS = {
  Ajax:      { color: "#D42B2B", abbr: "AJX" },
  Flamengo:  { color: "#B01020", abbr: "FLA" },
  Lyon:      { color: "#1859B8", abbr: "LYO" },
  Wolfsburg: { color: "#27A43C", abbr: "WOL" },
};

export const SQUADS = {
  Ajax: [
    "Clint", "Don", "Ps5", "T.M",
    "Near Here", "Matthew", "Energy", "Val",  "Udo",
  ],
  Flamengo: [
    "Shola", "Khalifa", "Mamba", "Yinka",
    "Precious", "Godbam", "Miles", "Salvation", "Dr. Luther", "Sped Djos",
  ],
  Lyon: [
    "Jerry", "Adam", "Jude", "Rabiu",
    "Promise", "Chally", "Todo (Rabiu Bro)", "Gerald", "Khalifa (Solar)", "DC", "Praise",
  ],
  Wolfsburg: [
    "Sam", "Brown", "Gbenga", "Kanayo",
    "Bright", "Kayode", "Habeeb", "Lawman", "Austin",
  ],
};

export const FIXTURES = [
  { md:1, date:"Sat 21 Mar 2026", matches:[   // ← PLAYED — First Leg
    { home:"Ajax",      away:"Flamengo",  slot:"Early" },
    { home:"Lyon",      away:"Wolfsburg", slot:"Late"  },
  ]},
  { md:2, date:"Sat 04 Apr 2026", matches:[   // First Leg
    { home:"Flamengo",  away:"Wolfsburg", slot:"Early" },
    { home:"Ajax",      away:"Lyon",      slot:"Late"  },
  ]},
  { md:3, date:"Sat 18 Apr 2026", matches:[   // First Leg
    { home:"Ajax",      away:"Wolfsburg", slot:"Early" },
    { home:"Flamengo",  away:"Lyon",      slot:"Late"  },
  ]},
  { md:4, date:"Sat 02 May 2026", matches:[   // Second Leg
    { home:"Wolfsburg", away:"Lyon",      slot:"Early" },
    { home:"Flamengo",  away:"Ajax",      slot:"Late"  },
  ]},
  { md:5, date:"Sat 16 May 2026", matches:[   // Second Leg
    { home:"Lyon",      away:"Ajax",      slot:"Early" },
    { home:"Wolfsburg", away:"Flamengo",  slot:"Late"  },
  ]},
  { md:6, date:"Sat 06 Jun 2026", matches:[   // Second Leg
    { home:"Lyon",      away:"Flamengo",  slot:"Early" },
    { home:"Wolfsburg", away:"Ajax",      slot:"Late"  },
  ]},
];

export const SLOT_TIMES = {
  Early: "7:30–8:15",
  Late:  "8:20–9:05",
};

// ══════════════════════════════════════════════════════════════
//  MATCH RESULTS
//  ── HOW TO UPDATE ──────────────────────────────────────────
//  After matchday: Admin panel → "📤 Export for data.js"
//  Copy the output and replace EVERYTHING between the
//  two ═══ lines below (keep the export const RESULTS = line).
//
//  EVENT TYPES:
//    { "type":"goal",     "team":"Ajax", "scorer":"Don",  "assist":"Clint" }
//    { "type":"own_goal", "team":"Ajax", "scorer":"Val"  }  ← Val (Ajax) OG → counts for opponent
//
//  CARD TYPES:
//    { "type":"yellow", "team":"Ajax", "player":"Clint" }
//    { "type":"red",    "team":"Ajax", "player":"Clint" }
//
//  KEY FORMAT:  "md-matchIndex"  (matchIndex is 0 or 1)
//    MD1 Early → "1-0"  |  MD1 Late → "1-1"
//    MD2 Early → "2-0"  |  MD2 Late → "2-1"  … etc.
// ══════════════════════════════════════════════════════════════
export const RESULTS = {
"1-0": {
    "hg": "1",
    "ag": "1",
    "events": [
      {
        "type": "goal",
        "team": "Ajax",
        "scorer": "Don",
        "assist": ""
      },
      {
        "type": "goal",
        "team": "Flamengo",
        "scorer": "Shola",
        "assist": "Ben"
      }
    ],
    "cards": []
  },
  "1-1": {
    "hg": "1",
    "ag": "2",
    "events": [
      {
        "type": "goal",
        "team": "Lyon",
        "scorer": "Rabiu",
        "assist": "Adam"
      },
      {
        "type": "goal",
        "team": "Wolfsburg",
        "scorer": "Habeeb",
        "assist": "Brown"
      },
      {
        "type": "goal",
        "team": "Wolfsburg",
        "scorer": "Sam",
        "assist": "Habeeb"
      }
    ],
    "cards": [
      {
        "type": "yellow",
        "team": "Wolfsburg",
        "player": "Habeeb"
      },
      {
        "type": "red",
        "team": "Lyon",
        "player": "Rabiu"
      },
      {
        "type": "yellow",
        "team": "Lyon",
        "player": "Todo (Rabiu Bro)"
      },
      {
        "type": "yellow",
        "team": "Lyon",
        "player": "Gerald"
      }
    ]
  },
  "2-0": {
    "hg": "1",
    "ag": "1",
    "events": [
      {
        "type": "goal",
        "team": "Wolfsburg",
        "scorer": "Brown",
        "assist": ""
      }
    ],
    "cards": [
      {
        "type": "red",
        "team": "Wolfsburg",
        "player": "Kayode"
      },
      {
        "type": "yellow",
        "team": "Wolfsburg",
        "player": "Habeeb"
      }
    ]
  },
  "2-1": {
    "hg": "2",
    "ag": "0",
    "events": [
      {
        "type": "goal",
        "team": "Ajax",
        "scorer": "Clint",
        "assist": "Udo"
      },
      {
        "type": "goal",
        "team": "Ajax",
        "scorer": "Clint",
        "assist": ""
      }
    ],
    "cards": []
  }
};
// ══════════════════════════════════════════════════════════════
