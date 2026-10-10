/* Recommended illuminance ranges (lx) from JIS Z9110-2010,
   "Adequate light levels for your working or at your work areas".
   Each entry: [area names, min lx, max lx]. Areas listed in one box share a range. */
(function (root) {
  "use strict";
  const T = {
    "Office": [
      [["Entrance hall (day-time)", "Director room"], 500, 1000],
      [["Council room", "Electronic computer room", "Reception room", "Guard station"], 300, 750],
      [["Inquiry office", "Dining room", "Night-duty room"], 200, 500],
      [["Library", "Tearoom", "Dressing room", "Toilet, lavatory"], 150, 300],
      [["Stair"], 100, 200],
      [["Warehouse", "Lift", "Passage"], 75, 150],
      [["Indoor emergency staircase"], 30, 75],
    ],
    "Factory": [
      [["Extra fine visual work"], 1000, 2000],
      [["Design room", "Drawing room"], 500, 1000],
      [["Control room", "Electric room", "Air conditioning machine room", "Lavatory, toilet"], 150, 300],
      [["Stair"], 100, 200],
      [["Entrance", "Passage path", "Warehouse"], 75, 150],
      [["Indoor emergency staircase"], 30, 75],
    ],
    "School": [
      [["Drawing room"], 500, 1000],
      [["Clothing classroom", "Electronic computer room", "Experimental laboratory", "Reading room", "Healthcare room"], 300, 750],
      [["Classroom", "Faculty room", "Dining room", "Gymnasium", "Night-duty room"], 200, 500],
      [["Auditorium", "Assembly room", "Locker room", "Lavatory, toilet"], 150, 300],
      [["Stair"], 100, 200],
      [["Passage"], 75, 150],
    ],
    "Hospital": [
      [["Operating room", "Emergency room"], 750, 1500],
      [["Consultation room", "Nurse station", "Pharmacist office", "General examination room", "Physiological examination room", "Radioisotope room", "Funeral chapel"], 300, 750],
      [["X-ray room", "Physiotherapy room", "Exercise machine room", "Night-duty room", "Endoscopy room", "X-ray fluoroscopy room"], 200, 500],
      [["Nursery room", "Waiting room", "Visiting room", "Passage for outpatients", "Changing room", "Lavatory, toilet", "Hospital charts room"], 150, 300],
      [["Ward"], 75, 150],
      [["Ophthalmic dark room"], 50, 100],
      [["Emergency staircase"], 30, 75],
    ],
    "Store": [
      [["Most important part of display"], 1500, 3000],
      [["Important part of display", "Register", "Packaging stand"], 500, 1000],
      [["Lift lobby", "Escalator"], 300, 750],
      [["Negotiation room"], 200, 500],
      [["Reception room", "Lavatory, toilet"], 150, 300],
      [["Stair"], 100, 200],
      [["Passage", "Resting room"], 75, 150],
    ],
    "Restaurant": [
      [["Sample case"], 500, 1000],
      [["Cookroom", "Dining table", "Counter"], 300, 750],
      [["Register"], 200, 500],
      [["Waiting room", "Guest room", "Lavatory, toilet"], 150, 300],
      [["Stair"], 100, 200],
      [["Porch", "Passage"], 75, 150],
    ],
    "Theatre / concert hall": [
      [["Ticket office"], 300, 750],
      [["Stall", "Green room", "Monitoring room"], 200, 500],
      [["Spectator seats", "Lobby", "Electric room", "Mechanical room", "Lavatory, toilet"], 150, 300],
      [["Stair", "Theatre basement work room"], 100, 200],
      [["Entrance", "Resting room", "Projection room", "Passage"], 75, 150],
      [["Monitoring room (during performance)"], 15, 30],
      [["Projection room (during performance)"], 7, 15],
    ],
    "Inn / hotel": [
      [["Front desk", "Counter", "Office"], 500, 1000],
      [["Cuisine", "Guest room desk"], 300, 750],
      [["Carriage porch", "Dining room"], 200, 500],
      [["Banqueting hall", "Salle", "Lobby", "Lavatory, toilet"], 150, 300],
      [["Stair"], 100, 200],
      [["Game room", "Guest room", "Entrance", "Passage", "Bathroom", "Undressing room"], 75, 150],
      [["Important parts of garden"], 50, 100],
    ],
    "Beauty salon / barber shop": [
      [["Hair dressing", "Hair dyeing", "Hair set", "Make-up"], 750, 1500],
      [["Hair cut", "Shaving", "Dressing", "Shampooing", "Register"], 300, 750],
      [["Toilet inside the shop"], 150, 300],
      [["Stair"], 100, 200],
      [["Passage"], 75, 150],
    ],
  };
  // Flatten to [{category, name, min, max, key}]
  const AREAS = [];
  Object.keys(T).forEach((cat) => T[cat].forEach(([names, min, max]) => names.forEach((name) =>
    AREAS.push({ category: cat, name, min, max, key: cat + "|" + name, std: "JIS" }))));

  // Fallback: OSHA 29 CFR 1926.56 Table D-3 minimum illumination (foot-candles -> lux, 1 fc = 10.764 lx).
  // Used only when a location has no matching area in the JIS table. OSHA gives minimums only.
  const FC = (fc) => Math.round(fc * 10.764);
  const OSHA_STD = "OSHA 29 CFR 1926.56";
  const OSHA = [
    ["Access ways, loading platforms, active storage and yards", 3],
    ["General construction / outdoor work area", 5],
    ["Indoor corridors, hallways and exitways", 5],
    ["Tunnels, shafts and underground work areas", 5],
    ["Plant and shops, workrooms, equipment rooms", 10],
    ["First aid stations, infirmaries and offices", 30],
  ].map(([name, fc]) => ({ category: "OSHA (minimum)", name, min: FC(fc), max: null, fc, key: "OSHA|" + name, std: "OSHA" }));
  const OSHA_RULES = [
    [/ (first aid|infirmar\w*|sick bay|medical cent\w*|dispensary) /, 5],
    [/ (tunnel\w*|shaft\w*|underground|basement|pit) /, 3],
    [/ (production\w*|process\w*|manufactur\w*|assembly line|sewing|line \d*|machine shop|workshop\w*|maintenance|repair|fabricat\w*|welding|carpent\w*|joinery|work room|workroom|shop floor|plant floor|floor|weaving|spinning|drying|withering|rolling|fermentation|sorting|grading|boiler house|batch plant|mixing|bakery|laundry|loft|quarters|barrack\w*|dormitor\w*|accommodation|labour line\w*|living) /, 4],
    [/ (loading|unloading|dock\w*|dispatch area|yard\w*|refuel\w*|fuel\w*|car park\w*|carpark|parking|driveway|drive way|access road|road\w*|ramp\w*|waste\w*|garbage|scrap|excavation|outdoor|outside|exterior|external|perimeter|compound|premises) /, 0],
    [/ (construction|site area|building site|open area) /, 1],
  ];
  // ---------- Automatic matching from the location text ----------
  const norm = (t) => " " + String(t || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim() + " ";

  // Building type from the site name.
  const SITE_RULES = [
    [/ (hospital|clinic|medical|health|maternity|nursing home|dispensary|bh|dgh|tgh|th|nhsl|mch) /, "Hospital"],
    [/ (factory|mill|plant|industr\w*|manufactur\w*|garment|apparel|tea estate|estate|workshop|processing) /, "Factory"],
    [/ (school|college|university|campus|institute|vidyalaya|academy) /, "School"],
    [/ (hotel|inn|resort|guest house|villa|lodge|hostel) /, "Inn / hotel"],
    [/ (restaurant|cafe|bakery|eatery|food court) /, "Restaurant"],
    [/ (store|shop|supermarket|super market|mall|showroom|outlet|pharmacy shop) /, "Store"],
    [/ (theatre|theater|cinema|concert|auditorium) /, "Theatre / concert hall"],
    [/ (salon|barber|beauty) /, "Beauty salon / barber shop"],
    [/ (office|bank|ministry|department|secretariat|authority|head office|corporation|board) /, "Office"],
  ];
  function buildingType(site) {
    const t = norm(site);
    for (const [re, cat] of SITE_RULES) if (re.test(t)) return cat;
    return null;
  }

  // Location words -> JIS area name. [pattern, area name, forced category]
  // More specific patterns come first.
  const RULES = [
    [/ (emergency stair\w*|fire escape|fire exit) /, "Emergency staircase", "Hospital"],
    [/ (theatre|theater|theatres) /, "Operating room", "Hospital", "Hospital"],
    [/ (operating|operation theat\w*|ot|theatre complex|surgery|surgical theat\w*) /, "Operating room", "Hospital"],
    [/ (etu|emergency|casualty|accident|a and e|pcu) /, "Emergency room", "Hospital"],
    [/ (nurse\w*|nursing station|sister room) /, "Nurse station", "Hospital"],
    [/ (pharmac\w*|dispensary|drug store|drugs store) /, "Pharmacist office", "Hospital"],
    [/ (x ray|xray|radiology|ct|ct scan|mri|scan\w*|ultrasound|uss|mammogra\w*) /, "X-ray room", "Hospital"],
    [/ (fluoroscop\w*) /, "X-ray fluoroscopy room", "Hospital"],
    [/ (physio\w*|rehab\w*) /, "Physiotherapy room", "Hospital"],
    [/ (endoscop\w*|gastroscop\w*|colonoscop\w*) /, "Endoscopy room", "Hospital"],
    [/ (ecg|eeg|physiological|cardiac lab|cath lab) /, "Physiological examination room", "Hospital"],
    [/ (radioisotope|nuclear medicine) /, "Radioisotope room", "Hospital"],
    [/ (mortuary|morgue|funeral|chapel) /, "Funeral chapel", "Hospital"],
    [/ (eye|ophthalm\w*|dark room) /, "Ophthalmic dark room", "Hospital"],
    [/ (nursery|baby room|neonat\w*|scbu|nicu) /, "Nursery room", "Hospital"],
    [/ (visit\w*) /, "Visiting room", "Hospital"],
    [/ (outpatient\w* (corridor|passage)|opd (corridor|passage)) /, "Passage for outpatients", "Hospital"],
    [/ (opd|consult\w*|clinic|doctor\w*|mo room|vog room|treatment|exam\w*|procedure room|dental|dressing room hospital) /, "Consultation room", "Hospital"],
    [/ (record\w*|charts?|mro|medical records) /, "Hospital charts room", "Hospital"],
    [/ (ward|bed\w*|patient\w*|icu|hdu|cicu|micu|sicu|paying ward|cubicle) /, "Ward", "Hospital"],
    [/ (lab|labs|laborator\w*) /, "Experimental laboratory", null],
    [/ (monitoring room during|control booth) /, "Monitoring room (during performance)", "Theatre / concert hall"],
    [/ (projection room during) /, "Projection room (during performance)", "Theatre / concert hall"],
    [/ (ticket\w*|box office) /, "Ticket office", "Theatre / concert hall"],
    [/ (spectator\w*|audience|seating) /, "Spectator seats", "Theatre / concert hall"],
    [/ (green room|stage) /, "Green room", "Theatre / concert hall"],
    [/ (projection) /, "Projection room", "Theatre / concert hall"],
    [/ (inspection|precision|quality check|qc|qa|fine work|extra fine) /, "Extra fine visual work", "Factory"],
    [/ (design\w*) /, "Design room", "Factory"],
    [/ (drawing) /, "Drawing room", null],
    [/ (control room|scada|panel room|bms room) /, "Control room", "Factory"],
    [/ (electric\w*|switch\w*|generator|substation|sub station|transformer|mcc|msb|ldb|ups room|battery room) /, "Electric room", null],
    [/ (ac plant|chiller\w*|ahu|boiler\w*|pump\w*|compressor\w*|machine room|plant room|mechanical room|hvac|cooling tower) /, "Air conditioning machine room", "Factory"],
    [/ (classroom\w*|class room\w*|lecture\w*|tutorial) /, "Classroom", "School"],
    [/ (staff room|faculty|teachers? room) /, "Faculty room", "School"],
    [/ (gym\w*|sports hall) /, "Gymnasium", "School"],
    [/ (auditorium|assembly hall|assembly|main hall) /, "Auditorium", "School"],
    [/ (locker\w*) /, "Locker room", "School"],
    [/ (sick room|medical room|health room|healthcare room) /, "Healthcare room", "School"],
    [/ (reading room|study room) /, "Reading room", "School"],
    [/ (sewing|clothing) /, "Clothing classroom", "School"],
    [/ (display|showcase|show case|window display) /, "Important part of display", "Store"],
    [/ (packing|packaging|wrapping) /, "Packaging stand", "Store"],
    [/ (escalator\w*) /, "Escalator", "Store"],
    [/ (negotiat\w*) /, "Negotiation room", "Store"],
    [/ (cashier|billing|register|till|checkout|check out) /, "Register", null],
    [/ (sample\w*) /, "Sample case", "Restaurant"],
    [/ (kitchen|cook\w*|cuisine) /, "Cookroom", "Restaurant"],
    [/ (dining table|table \d+) /, "Dining table", "Restaurant"],
    [/ (front desk|front office) /, "Front desk", "Inn / hotel"],
    [/ (porch) /, "Porch", null],
    [/ (banquet\w*|ballroom|function hall|salle) /, "Banqueting hall", "Inn / hotel"],
    [/ (guest room\w*|hotel room|suite|bedroom) /, "Guest room", null],
    [/ (game\w* room|games) /, "Game room", "Inn / hotel"],
    [/ (garden\w*|lawn) /, "Important parts of garden", "Inn / hotel"],
    [/ (undress\w*) /, "Undressing room", "Inn / hotel"],
    [/ (hair cut|haircut|shaving|shampoo\w*) /, "Hair cut", "Beauty salon / barber shop"],
    [/ (hair\w*|make up|makeup|styling) /, "Hair dressing", "Beauty salon / barber shop"],
    [/ (director\w*|chairman|ceo|gm room|manager\w*|executive) /, "Director room", "Office"],
    [/ (meeting\w*|conference|board room|boardroom|council|committee) /, "Council room", "Office"],
    [/ (computer\w*|server\w*|it room|it unit|data cent\w*|ict) /, "Electronic computer room", null],
    [/ (reception\w*|front counter) /, "Reception room", "Office"],
    [/ (security|guard\w*|gate house|gatehouse) /, "Guard station", "Office"],
    [/ (inquir\w*|enquir\w*|information desk|help desk) /, "Inquiry office", "Office"],
    [/ (night duty|on call|duty room) /, "Night-duty room", null],
    [/ (canteen|dining|cafeteria|mess|lunch room) /, "Dining room", null],
    [/ (library) /, "Library", "Office"],
    [/ (tea room|tearoom|pantry) /, "Tearoom", "Office"],
    [/ (changing|change room|dressing) /, "Changing room", "Hospital"],
    [/ (bathroom) /, "Bathroom", "Inn / hotel"],
    [/ (toilet\w*|wc|washroom\w*|wash room\w*|lavator\w*|restroom\w*|rest room\w*|urinal\w*|sanitary) /, "Lavatory, toilet", null],
    [/ (waiting) /, "Waiting room", null],
    [/ (lift lobby|lift\w*|elevator\w*) /, "Lift", "Office"],
    [/ (lobby|foyer) /, "Lobby", null],
    [/ (store room|stores|warehouse|godown|storage|store) /, "Warehouse", null],
    [/ (stair\w*|steps|staircase) /, "Stair", null],
    [/ (corridor\w*|passage\w*|walkway|hallway|hall way|aisle|verandah|veranda) /, "Passage", null],
    [/ (entrance|entry|main gate) /, "Entrance", null],
    [/ (office\w*|admin\w*|account\w*|finance|clerk\w*|hr|work area|workstation|desk) /, "Director room", "Office"],
    [/ (resting room|rest area|break room) /, "Resting room", null],
  ];
  // Building-specific names for shared words.
  const ALIAS = { "Hospital|Passage": "Passage for outpatients", "Hospital|Entrance": "Passage for outpatients", "Hospital|Lobby": "Waiting room" };
  const ORDER = ["Hospital", "Office", "Factory", "School", "Store", "Restaurant", "Inn / hotel", "Theatre / concert hall", "Beauty salon / barber shop"];

  function pick(name, forced, building) {
    const cands = AREAS.filter((a) => a.name === name);
    if (!cands.length) return null;
    if (building) { const b = cands.find((a) => a.category === building); if (b) return b; }
    if (forced) { const f = cands.find((a) => a.category === forced); if (f) return f; }
    for (const c of ORDER) { const x = cands.find((a) => a.category === c); if (x) return x; }
    return cands[0];
  }

  /** Find the JIS area for a location. learned: {normalised location: area key}. */
  function match(location, site, learned) {
    const t = norm(location);
    const key = t.trim();
    if (learned && learned[key]) { const a = byKey(learned[key]); if (a) return a; }
    // Also try the location without trailing numbers ("Ward 3" -> "ward")
    const base = norm(location.replace(/[\d\-\/#]+/g, " ")).trim();
    if (learned && base && learned[base]) { const a = byKey(learned[base]); if (a) return a; }
    const building = buildingType(site);
    for (const [re, name, forced, onlyIn] of RULES) {
      if (onlyIn && building !== onlyIn) continue;
      if (re.test(t)) return pick(ALIAS[building + "|" + name] || name, forced, building);
    }
    // No JIS area for this location: fall back to OSHA minimums.
    for (const [re, i] of OSHA_RULES) if (re.test(t)) return OSHA[i];
    return null;
  }
  function byKey(k) { return AREAS.find((x) => x.key === k) || OSHA.find((x) => x.key === k) || null; }
  const learnKey = (location) => norm(String(location).replace(/[\d\-\/#]+/g, " ")).trim();

  const api = { TABLE: T, AREAS, OSHA, OSHA_STD, CATEGORIES: Object.keys(T), SOURCE: "JIS Z9110-2010", match, buildingType, learnKey, byKey };
  root.JIS = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
