"use client";"use client";

import React, { useState, useMemo, useRef, useContext, createContext, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Generic hook: loads a table on mount, exposes rows + a setter that also syncs to Supabase
function useSupabaseTable(table, orderBy = "id", fallback = []) {
  const [rows, setRows]       = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_KEY) { setLoading(false); return; }
    setLoading(true);
    supabase.from(table).select("*").order(orderBy)
      .then(({ data, error }) => {
        if (error) { console.error("load", table, error.message); setError(error.message); }
        else if (data && data.length > 0) setRows(data);
        // if data is empty, keep the fallback already in state
        setLoading(false);
      });
  }, [table]);

  const upsert = useCallback(async (row) => {
    if (!SUPABASE_URL) return;
    const { data, error } = await supabase.from(table).upsert(row).select();
    if (error) console.error(`upsert ${table}:`, error.message);
    else {
      const saved = data?.[0] || row;
      setRows(prev => prev.some(r => r.id === saved.id)
        ? prev.map(r => r.id === saved.id ? { ...r, ...saved } : r)
        : [...prev, saved]);
    }
  }, [table]);

  const remove = useCallback(async (id) => {
    if (!SUPABASE_URL) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) console.error(`delete ${table}:`, error.message);
    else setRows(prev => prev.filter(r => r.id !== id));
  }, [table]);

  const replace = useCallback(async (newRows) => {
    if (!SUPABASE_URL) { setRows(newRows); return; }
    await supabase.from(table).delete().neq("id", 0);
    if (newRows.length) {
      const { error } = await supabase.from(table).insert(newRows);
      if (error) console.error(`replace ${table}:`, error.message);
    }
    setRows(newRows);
  }, [table]);

  return { rows, setRows, loading, error, upsert, remove, replace };
}


//  Theme definitions 
const THEMES = {
  lava: {
    name: " Lava",
    red:"#E73835", dark:"#24242D", teal:"#145365", white:"#FFFFFF",
    black:"#1B120B", gray:"#F2F2F5", muted:"#8B8B99", border:"#E0E0EA",
    green:"#059669", amber:"#D97706", blue:"#1D4ED8", purple:"#7C3AED",
    bg:"#F2F2F5", cardBg:"#FFFFFF", headerBg:"#1E1E26",
    tabActiveBorder:"#E73835", tabActiveColor:"#E73835", tabBg:"#FFFFFF",
  },
  green: {
    name: " Green",
    red:"#D97706", dark:"#14532D", teal:"#047857", white:"#F8FAF8",
    black:"#0D2818", gray:"#ECFAF3", muted:"#5A7A64", border:"#BBD9C8",
    green:"#15803D", amber:"#B45309", blue:"#0369A1", purple:"#6D28D9",
    bg:"#ECFAF3", cardBg:"#F8FAF8", headerBg:"#0D2818",
    tabActiveBorder:"#15803D", tabActiveColor:"#15803D", tabBg:"#F8FAF8",
  },
  nature: {
    name: " Warm",
    red:"#C2410C", dark:"#1C1309", teal:"#92400E", white:"#FFFBF5",
    black:"#1C1309", gray:"#FEF9F0", muted:"#A07850", border:"#F0D9BE",
    green:"#15803D", amber:"#CA8A04", blue:"#1D4ED8", purple:"#7C3AED",
    bg:"#FEF9F0", cardBg:"#FFFBF5", headerBg:"#1C1309",
    tabActiveBorder:"#C2410C", tabActiveColor:"#C2410C", tabBg:"#FFFBF5",
  },
  ocean: {
    name: " Ocean",
    red:"#EF4444", dark:"#0C1E3C", teal:"#0891B2", white:"#F0F9FF",
    black:"#0C1E3C", gray:"#E0F2FE", muted:"#4A7A9B", border:"#BAE6FD",
    green:"#059669", amber:"#D97706", blue:"#0369A1", purple:"#7C3AED",
    bg:"#E7F5FC", cardBg:"#F0F9FF", headerBg:"#0C1E3C",
    tabActiveBorder:"#0891B2", tabActiveColor:"#0891B2", tabBg:"#F0F9FF",
  },
};

const ThemeCtx = createContext(THEMES.lava);
function useTheme() { return useContext(ThemeCtx); }

//  Fallback C for module-level code (overridden per component via useTheme) 
const C = THEMES.lava;
const AM_COLOR = { Niccole: C.red, Alicia: C.teal, Karla: C.blue };

//  ALL CHECK-INS from Island KPI sheet — each VA is its own row 
const INIT_CHECKINS = [
  {id:1,week:"01/12/2026",client:"4th Check-in Meeting: TJ and Anna, Navigate Risk Advisors",vas:[{"name": "George", "score": 88.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:2,week:"01/12/2026",client:"2nd Check-in Meeting: Brad and Darcy, Ameriguard Agency Inc",vas:[],type:"weekly",mode:"zoom",status:"skipped",am:"",notes:""},
  {id:3,week:"01/12/2026",client:"2nd Check-in: Gerry and Gessy, Arctica",vas:[{"name": "Brooke", "score": 82.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:4,week:"01/12/2026",client:"3rd Month Checkin- Brokers' Insurance",vas:[],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:5,week:"01/12/2026",client:"12th Month Check-in: Scott, Allison Insurance",vas:[],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:6,week:"01/12/2026",client:"1st Check-in: Ben, Trailstone",vas:[{"name": "Andrei", "score": 59.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:7,week:"01/12/2026",client:"3-week c/in Sentinel Insurance Agency (Chrishan) VA Hanz - TL Ed /",vas:[{"name": "Hanz", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:8,week:"01/12/2026",client:"1-week c/in: Lewis, Hopkins & Williamson (LH&W)-",vas:[{"name": "Dhencel", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:9,week:"01/19/2026",client:"3rd Check-in: Gerry and Gessy, Arctica",vas:[{"name": "Brooke", "score": 88.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:10,week:"01/19/2026",client:"(Skipped) 3rd Check-in Meeting: Brad and Darcy, Ameriguard",vas:[],type:"weekly",mode:"zoom",status:"skipped",am:"",notes:""},
  {id:11,week:"01/19/2026",client:"5th Check-in Meeting: TJ and Anna, Navigate Risk Advisors",vas:[{"name": "George", "score": 82.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:12,week:"01/19/2026",client:"Month 8 Check-in: Jennifer Kramer, Navigate Risk Advisor",vas:[],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:13,week:"01/19/2026",client:"Month 6 Check-in: Vonda Copeland",vas:[],type:"monthly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:14,week:"01/19/2026",client:"Month 8 check-in / VA Rhona May Bahidi / Nu Sure Insurance / TL Rez",vas:[{"name": "Andy", "score": null}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:15,week:"01/19/2026",client:"11th month c/i: VA Almie / Rain Tree Group / TL RJ",vas:[{"name": "Andy", "score": null}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:16,week:"01/19/2026",client:"Month 4 Check-in: Rich, Beach Break Insurance",vas:[],type:"monthly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:17,week:"01/19/2026",client:"4th Month Check-in: Brandon & Keke, My Compass Insurance LLC",vas:[{"name": "Andy", "score": null}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:18,week:"01/19/2026",client:"4-week c/in Sentinel Insurance Agency (Chrishan) VA Hanz",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:19,week:"01/19/2026",client:"2-week c/in: Lewis, Hopkins & Williamson (LH&W)- VA Dhencel,",vas:[],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:20,week:"01/19/2026",client:"1-week c/in Duncan & Associates Insurance Brokers :VA Lynzette/TL",vas:[{"name": "Lyn", "score": 82.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:21,week:"01/19/2026",client:"2nd Check-in: Ben, Trailstone",vas:[{"name": "Andrei", "score": 82.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:22,week:"01/19/2026",client:"Month 4 Check-in: Mabel, Creekside",vas:[{"name": "Kris", "score": 100.0}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:23,week:"01/26/2026",client:"6th Check-in Meeting: TJ and Anna, Navigate Risk Advisors",vas:[{"name": "George", "score": 82.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:24,week:"01/26/2026",client:"4th Check-in Meeting: Brad and Darcy, Ameriguard Agency Inc",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:25,week:"01/26/2026",client:"4th Check-in: Gerry and Gessy, Arctica",vas:[{"name": "passed", "score": null}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:26,week:"01/26/2026",client:"1st Check-in Meeting: Daniel, Raleigh Insurance",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:27,week:"01/26/2026",client:"Sentinel",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:28,week:"01/26/2026",client:"Duncan",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:29,week:"01/26/2026",client:"Combined Benefits",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:30,week:"02/02/2026",client:"Month 2 Check-in: Lisa and Sheila, Dickey McCay Insurance",vas:[{"name": "Zig", "score": 89.0}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:31,week:"02/02/2026",client:"(Skipped) 5th Check-in: Gerry and Gessy, Arctica",vas:[{"name": "Brook -", "score": null}],type:"weekly",mode:"zoom",status:"skipped",am:"",notes:""},
  {id:32,week:"02/02/2026",client:"(Skipped) 2nd Check-in Meeting: Daniel, Raleigh Insurance",vas:[],type:"weekly",mode:"zoom",status:"skipped",am:"",notes:""},
  {id:33,week:"02/02/2026",client:"Month 8 Check-in: Jennifer Kramer, Navigate Risk Advisor",vas:[],type:"monthly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:34,week:"02/02/2026",client:"5th Check-in Meeting: Brad and Darcy, Ameriguard Agency Inc",vas:[{"name": "Diane", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:35,week:"02/02/2026",client:"Check-in: 2nd week VA Roberto/ 4th month VA Jian/ TL Ed/ Sidney",vas:[{"name": "Roberto", "score": 88.0}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:36,week:"02/02/2026",client:"Direct Insurance Services( - 82%",vas:[{"name": "82.0", "score": 82.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:37,week:"02/02/2026",client:"Duncan & Associates Insurance - 94%",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:38,week:"02/02/2026",client:"6-week c/in Sentinel Insurance Agency (Chrishan) VA Hanz - TL Ed",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:39,week:"02/09/2026",client:"2-week c/in: Direct Insurance Services(Michael Spence ): V",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:40,week:"02/09/2026",client:"1-week c/in Welsh Insurance Agency: VA Dhencel / TL Rez",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:41,week:"02/09/2026",client:"3rd Weekly Check-in: VA Roberto/ TL ED/ Sidney, Combined Benefit",vas:[{"name": "over 80", "score": null}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:42,week:"02/09/2026",client:"4th Month Check-in- Brokers Insurance",vas:[{"name": "86.0", "score": 86.0}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:43,week:"02/09/2026",client:"3rd Check-in Meeting: Daniel, Raleigh Insurance",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:44,week:"02/16/2026",client:"Hardenbergh Insurance Group",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:45,week:"02/16/2026",client:"Welsh Insurance Agency",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:46,week:"02/16/2026",client:"Glenn S Caldwell Insurance Services",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:47,week:"02/16/2026",client:"Duncan & Associates Insurance Brokers",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:48,week:"02/16/2026",client:"Direct Insurance Services",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:49,week:"02/16/2026",client:"Combined Benefits Administrators = 94%",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:50,week:"02/16/2026",client:"American Adventure Insurance = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:51,week:"02/16/2026",client:"J&J Insurance = 100% (edited)",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:52,week:"03/09/2026",client:"Month 1 Check-in: Gerry and Gessy, Arctica",vas:[{"name": "Brooke", "score": 71.0}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:53,week:"03/09/2026",client:"1st Check-in Meeting: Greg, IntelliBenefits Insurance Services",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:54,week:"03/09/2026",client:"5th Month Check-in- Brokers Insurance",vas:[{"name": "Bryan", "score": 86.0}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:55,week:"03/09/2026",client:"1st Weekly Check-in: Jennifer Frisbie, Hoery Insurance Agency Inc",vas:[{"name": "Dianne", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:56,week:"03/09/2026",client:"American Adventure Insurance = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:57,week:"03/09/2026",client:"J&J Insurance = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:58,week:"03/09/2026",client:"Direct Insurance Services",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:59,week:"03/09/2026",client:"Ovation Insurance",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:60,week:"03/09/2026",client:"Glenn S Caldwell Insurance Services Inc",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:61,week:"03/09/2026",client:"HIG",vas:[],type:"weekly",mode:"zoom",status:"skipped",am:"",notes:""},
  {id:62,week:"03/16/2026",client:"Month 4 Check-in: Lisa and Sheila, Dickey McCay Insurance",vas:[{"name": "Zig", "score": 88.0}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:63,week:"03/16/2026",client:"2nd Check-in Meeting: Greg, IntelliBenefits Insurance Services",vas:[{"name": "no show/late", "score": null}],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:64,week:"03/16/2026",client:"2nd Weekly Check-in: Jennifer Frisbie, Hoery Insurance Agency Inc",vas:[{"name": "Dianne", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:65,week:"03/16/2026",client:"Welsh Insurance Agency",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:66,week:"03/16/2026",client:"Duncan & Associates Insurance Brokers",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:67,week:"03/16/2026",client:"Hardenbergh",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:68,week:"03/16/2026",client:"J&J Insurance",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:69,week:"03/16/2026",client:"American Adventure insurance",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:70,week:"03/23/2026",client:"3rd Check-in Meeting: Greg, IntelliBenefits Insurance Services",vas:[{"name": "Mae", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:71,week:"03/23/2026",client:"1st Check-in Meeting: John and Justin, J. Gurley Insurance",vas:[{"name": "Rey", "score": 76.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:72,week:"03/23/2026",client:"3rd Weekly Check-in: Jennifer Frisbie, Hoery Insurance Agency Inc",vas:[{"name": "Diane", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:73,week:"03/23/2026",client:"Kwan Insurance Services = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:74,week:"03/23/2026",client:"Davies Insurance Agency Inc = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:75,week:"03/23/2026",client:"Business Insurers of the Carolinas - 82%",vas:[{"name": "82.0", "score": 82.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:76,week:"03/23/2026",client:"Glenn S Caldwell Insurance Services - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:77,week:"03/23/2026",client:"Ovation Insurance - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:78,week:"03/23/2026",client:"Neverman Insurance - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:79,week:"03/23/2026",client:"Hardenbergh Insurance - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:80,week:"03/23/2026",client:"Business Insurers of the Carolinas - 82%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:81,week:"03/23/2026",client:"Duncan & Associates Insurance Brokers",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:82,week:"03/30/2026",client:"(Skipped) 2nd Check-in Meeting: John and Justin, J. Gurley Insurance",vas:[{"name": "Rey - N/A", "score": null}],type:"weekly",mode:"zoom",status:"skipped",am:"",notes:""},
  {id:83,week:"03/30/2026",client:"Month 10 Check-in: Jennifer Kramer and Niccole Peeler",vas:[{"name": "Edna", "score": 100.0}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:84,week:"03/30/2026",client:"4th Check-in Meeting: Greg, IntelliBenefits Insurance Services",vas:[{"name": "Mae", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:85,week:"03/30/2026",client:"4th Weekly Check-in: Jennifer Frisbie, Hoery Insurance Agency Inc",vas:[{"name": "Dianne", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:86,week:"03/30/2026",client:"Business Insurers of the Carolinas - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:87,week:"03/30/2026",client:"Hardenbergh Insurance Group - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:88,week:"03/30/2026",client:"Glenn S Caldwell Insurance Services - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:89,week:"03/30/2026",client:"Duncan & Associates Insurance Brokers - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:90,week:"03/30/2026",client:"Scheier Insurance - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:91,week:"03/30/2026",client:"Portsmouth Atlantic Insurance = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:92,week:"03/30/2026",client:"United Risk Insurance (Brechie Bedico) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:93,week:"03/30/2026",client:"United Risk Insurance (Reyjol Jumawan) = 94%",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:94,week:"03/30/2026",client:"Kwan Insurance Services = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:95,week:"03/30/2026",client:"Davies Insurance Agency Inc = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:96,week:"03/30/2026",client:"American Adventure Insurance (2 VAs)",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:97,week:"03/30/2026",client:"J&J Insurance",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:98,week:"04/03/2026",client:"3rd Check-in Meeting: John and Justin, J. Gurley Insurance",vas:[{"name": "Rey", "score": 82.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:99,week:"04/03/2026",client:"(Skipped) 5th Check-in Meeting: Greg, IntelliBenefits Insurance Services",vas:[],type:"weekly",mode:"zoom",status:"skipped",am:"",notes:""},
  {id:100,week:"04/03/2026",client:"5th Weekly Check-in: Jennifer Frisbie, Hoery Insurance Agency Inc",vas:[{"name": "Diane", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:101,week:"04/03/2026",client:"3 week- c/in: Business Insurers of the Carolinas - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:102,week:"04/03/2026",client:"2 week-c/in: VA Cariela (EA) / Hardenbergh Insurance Group - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:103,week:"04/03/2026",client:"4-week c/in Duncan & Associates Insurance Brokers :VA Ronald/TL ED",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:104,week:"04/03/2026",client:"Portsmouth Atlantic Insurance = 82%",vas:[{"name": "82.0", "score": 82.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:105,week:"04/03/2026",client:"United Risk Insurance (Brechie Bedico) = 100%",vas:[{"name": "Brechie", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:106,week:"04/03/2026",client:"United Risk Insurance (Reyjol Jumawan) = 100%",vas:[{"name": "Reyjol", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:107,week:"04/03/2026",client:"Kwan Insurance Services = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:108,week:"04/03/2026",client:"Davies Insurance Agency Inc = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:109,week:"04/13/2026",client:"(Skipped)4th Check-in Meeting: John and Justin, J. Gurley Insurance",vas:[],type:"weekly",mode:"zoom",status:"skipped",am:"",notes:""},
  {id:110,week:"04/13/2026",client:"6th Check-in Meeting: Greg, IntelliBenefits Insurance Services",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:111,week:"04/13/2026",client:"6th Weekly Check-in: Jennifer Frisbie, Hoery Insurance Agency Inc",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:112,week:"04/13/2026",client:"4 week- c/in Business Insurers of the Carolinas- 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:113,week:"04/13/2026",client:"3 week-c/in: Hardenbergh Insurance Group - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:114,week:"04/13/2026",client:"5-week c/in Scheier Insurance (Allison Scheier - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:115,week:"04/13/2026",client:"5-week c/in Duncan & Associates Insurance Brokers",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:116,week:"04/13/2026",client:"United Risk Insurance (Brechie Bedico) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:117,week:"04/13/2026",client:"United Risk Insurance (Reyjol Jumawan) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:118,week:"04/13/2026",client:"Kwan Insurance Services = 94%",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:119,week:"04/13/2026",client:"Davies Insurance Agency Inc = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:120,week:"04/13/2026",client:"Portsmouth Atlantic Insurance",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:121,week:"04/20/2026",client:"Month 5 Check-in: Lisa and Sheila, Dickey McCay Insurance",vas:[{"name": "Zigfred", "score": 71.0}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:122,week:"04/20/2026",client:"5th Check-in Meeting: John and Justin, J. Gurley Insurance",vas:[{"name": "Rey", "score": 88.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:123,week:"04/20/2026",client:"5 week- c/in: Business Insurers of the Carolinas- 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:124,week:"04/20/2026",client:"4 week-c/in: Hardenbergh Insurance Group - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:125,week:"04/20/2026",client:"6-week c/in Duncan & Associates Insurance Brokers - 94%",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:126,week:"04/20/2026",client:"Portsmouth Atlantic Insurance = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:127,week:"04/20/2026",client:"United Risk Insurance (Brechie Bedico) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:128,week:"04/20/2026",client:"United Risk Insurance (Reyjol Jumawan) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:129,week:"04/20/2026",client:"Kwan Insurance Services = 94%",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:130,week:"04/20/2026",client:"Davies Insurance Agency Inc = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:131,week:"04/27/2026",client:"6th Check-in Meeting: John and Justin, J. Gurley Insurance",vas:[{"name": "Rey", "score": 88.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:132,week:"04/27/2026",client:"6 week- c/in: Business Insurers of the Carolinas- 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:133,week:"04/27/2026",client:"1 week- c/in: Amicum Financial - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:134,week:"04/27/2026",client:"(email) 5 week-c/in: VA Cariela (EA) / Hardenbergh Insurance Group - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:135,week:"04/27/2026",client:"Portsmouth Atlantic Insurance (James Klien Caluyong) = 94%",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:136,week:"04/27/2026",client:"United Risk Insurance (Brechie Bedico) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:137,week:"04/27/2026",client:"United Risk Insurance (Reyjol Jumawan) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:138,week:"04/27/2026",client:"Kwan Insurance Services (John Ian Gubalani)= 94%",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:139,week:"05/04/2026",client:"1st Check-in Meeting: Garrett, Raleigh Insurance",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:140,week:"05/04/2026",client:"1 week- c/in: Classic Coverage Group LLC VA Jorey- 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:141,week:"05/04/2026",client:"2 week- c/in: Amicum Financial VA James - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:142,week:"05/04/2026",client:"6 week-c/in: VA Cariela (EA) / Hardenbergh Insurance Group - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:143,week:"05/04/2026",client:"Davies Insurance Agency Inc (Sydney Navarro) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:144,week:"05/04/2026",client:"Portsmouth Atlantic Insurance (James Klien Caluyong) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:145,week:"05/04/2026",client:"United Risk Insurance (Brechie Bedico) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:146,week:"05/04/2026",client:"United Risk Insurance (Reyjol Jumawan) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:147,week:"05/04/2026",client:"Maverick Insurance (Sergei Vaughn Calumpong) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:148,week:"05/11/2026",client:"2nd Check-in Meeting: Garrett, Raleigh Insurance",vas:[{"name": "Maria", "score": 88.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:149,week:"05/11/2026",client:"Month 1 Check-in: Greg, IntelliBenefits Insurance Services",vas:[{"name": "Mae", "score": 100.0}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:150,week:"05/11/2026",client:"Month 1 Check-in: Jennifer Frisbie, Hoery Insurance Agency Inc",vas:[{"name": "Diane", "score": 100.0}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:151,week:"05/11/2026",client:"Maverick Insurance (Sergei Vaughn Calumpong) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:152,week:"05/11/2026",client:"TCA Insurance (Honey Grace Tioaquen) = %",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:153,week:"05/11/2026",client:"2 week- c/in: Classic Coverage Group- 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:154,week:"05/11/2026",client:"1 week- c/in: Vault Insurance & Risk Management - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:155,week:"05/18/2026",client:"Month 1 Check-in Meeting: John and Justin, J. Gurley Insurance",vas:[{"name": "Rey", "score": 100.0}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:156,week:"05/18/2026",client:"3rd Check-in Meeting: Garrett, Raleigh Insurance",vas:[{"name": "Maria", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:157,week:"05/18/2026",client:"4 week- c/in: Amicum Financial VA James- 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:158,week:"05/18/2026",client:"3 week / c/in: Classic Coverage Group LLC VA Jorey/ - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:159,week:"05/18/2026",client:"Maverick Insurance (Sergei Vaughn Calumpong) = 88%",vas:[{"name": "88.0", "score": 88.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:160,week:"05/18/2026",client:"TCA Insurance (Honey Grace Tioaquen) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:161,week:"05/18/2026",client:"NPPW Services",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:162,week:"05/26/2026",client:"4th Check-in Meeting: Garrett, Raleigh Insurance",vas:[{"name": "skipped - traveling", "score": null}],type:"weekly",mode:"zoom",status:"skipped",am:"",notes:""},
  {id:163,week:"05/26/2026",client:"Weekly Check-In with 3R Dena (VA Francis)- 78%",vas:[{"name": "78.0", "score": 78.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:164,week:"05/26/2026",client:"1 week- c/in: Vault Insurance & Risk Management VA Jefer- 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:165,week:"05/26/2026",client:"4 week- c/in: Classic Coverage Group LLC - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:166,week:"05/26/2026",client:"1 week- c/in: Vault Insurance & Risk Management VA Jhonel/ - 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:167,week:"05/26/2026",client:"1 week-c/in: VA Ryan / Hardenbergh Insurance Group- 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:168,week:"05/26/2026",client:"1 week Check-in: ACG Insure - 89%",vas:[{"name": "89.0", "score": 89.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:169,week:"05/26/2026",client:"5 week- c/in: Amicum Financial VA James (John Mitchell)/ TL Ed",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:170,week:"05/26/2026",client:"Maverick Insurance (Sergei Vaughn Calumpong) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:171,week:"05/26/2026",client:"TCA Insurance (Honey Grace Tioaquen) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:172,week:"05/26/2026",client:"RMIN Consulting (Gian Tristian Apostol) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:173,week:"05/26/2026",client:"South City Insurance (John Dave Baylon) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:174,week:"05/26/2026",client:"South City Insurance (Elaiza Eve Ramos) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:175,week:"05/26/2026",client:"NPPW Services (Ariel Benjamine Espanto) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:176,week:"05/26/2026",client:"NPPW Services (Arturo Gales) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:177,week:"06/01/2026",client:"5th Check-in Meeting: Garrett, Raleigh Insurance",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:178,week:"06/01/2026",client:"Maverick Insurance (Sergei Vaughn Calumpong) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:179,week:"06/01/2026",client:"TCA Insurance (Honey Grace Tioaquen) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:180,week:"06/01/2026",client:"RMIN Consulting (Gian Tristian Apostol) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:181,week:"06/01/2026",client:"South City Insurance (John Dave Baylon) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:182,week:"06/01/2026",client:"South City Insurance (Elaiza Eve Ramos) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:183,week:"06/01/2026",client:"South City Insurance (Maria Luz Marañon) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:184,week:"06/01/2026",client:"NPPW Services (Ariel Benjamine Espanto) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:185,week:"06/01/2026",client:"NPPW Services (Arturo Gales) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:186,week:"06/01/2026",client:"2 week- c/in: Vault Insurance & Risk Management VA Jefer(Ashley Hellbusch)/ TL Via/",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:187,week:"06/01/2026",client:"5 week- c/in: Classic Coverage Group LLC VA Jorey (John Mitchell)/ TL Martin/",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:188,week:"06/01/2026",client:"2week-c/in: VA Ryan / Hardenbergh Insurance Group / TL Rez /",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:189,week:"06/01/2026",client:"2 week- c/in: Vault Insurance & Risk Management VA Jhonel/ TL Via",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:190,week:"06/01/2026",client:"6 week- c/in: Amicum Financial VA James (John Mitchell)/ TL Ed",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:191,week:"06/01/2026",client:"2 week Check-in: ACG Insure (Chris Shepherd and Alicia Almanza )",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:192,week:"06/01/2026",client:"month 10 check in VA Doris/ Terral Insurance",vas:[{"name": "100.0", "score": 100.0}],type:"monthly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:193,week:"06/01/2026",client:"Thomas Insurance Advisors (Alyannah Villarosa) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:194,week:"06/01/2026",client:"United Risk Insurance (Brechie Bedico) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:195,week:"06/01/2026",client:"United Risk Insurance (Reyjol Jumawan) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:196,week:"06/01/2026",client:"Combined Benefits Administrators (Roberto Escovidal) = 26/30 90 day eval",vas:[{"name": "26/30", "score": null}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:197,week:"06/01/2026",client:"Combined Benefits Administrators (Jian Paculaba) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:198,week:"06/01/2026",client:"Waldo Agencies (Jayvee Boy Fuertes) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:199,week:"06/01/2026",client:"Kwan Insurance Services (John Ian Gubalani) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:200,week:"06/01/2026",client:"Schultz Insurance Services Inc.",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:201,week:"06/08/2026",client:"6th Check-in Meeting: Garrett, Raleigh Insurance",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:202,week:"06/08/2026",client:"1st weekly VA Gabriel: Steve Pore Insurance",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:203,week:"06/08/2026",client:"Month 2 Check-in: Jennifer Frisbie, Hoery Insurance Agency Inc",vas:[],type:"monthly",mode:"zoom",status:"skipped",am:"",notes:""},
  {id:204,week:"06/08/2026",client:"3 week- c/in: Vault Insurance & Risk Management",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:205,week:"06/08/2026",client:"1 week- c/in: Bly Insurance Group",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:206,week:"06/08/2026",client:"6 week- c/in: Classic Coverage Group LLC",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:207,week:"06/08/2026",client:"3 week-c/in: VA Ryan / Hardenbergh Insurance Group",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:208,week:"06/08/2026",client:"3 week- c/in: Vault Insurance & Risk Management",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:209,week:"06/08/2026",client:"3 week Check-in: ACG Insure",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:210,week:"06/08/2026",client:"Maverick Insurance (Sergei Vaughn Calumpong) = 94%",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:211,week:"06/08/2026",client:"RMIN Consulting (Gian Tristian Apostol) = 94%",vas:[{"name": "94.0", "score": 94.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:212,week:"06/08/2026",client:"South City Insurance (John Dave Baylon) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:213,week:"06/08/2026",client:"South City Insurance (Elaiza Eve Ramos) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:214,week:"06/08/2026",client:"South City Insurance (Maria Luz Marañon) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:215,week:"06/08/2026",client:"Steve Pore Insurance (Gabriel Zion Cimafranca) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:216,week:"06/08/2026",client:"TCA Insurance",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:217,week:"06/08/2026",client:"NPPW Services",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:218,week:"06/15/2026",client:"2 week- c/in: Bly Insurance Group",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:219,week:"06/15/2026",client:"4 week-c/in: VA Ryan / Hardenbergh Insurance Group",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:220,week:"06/15/2026",client:"4week Check-in: ACG Insure",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:221,week:"06/15/2026",client:"South City Insurance (John Dave Baylon) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:222,week:"06/15/2026",client:"South City Insurance (Elaiza Eve Ramos) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:223,week:"06/15/2026",client:"South City Insurance (Maria Luz Marañon) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:224,week:"06/15/2026",client:"Steve Pore Insurance (Gabriel Zion Cimafranca) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:225,week:"06/15/2026",client:"TCA Insurance (Honey Grace Tioaquen) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:226,week:"06/15/2026",client:"RMIN Consulting",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:227,week:"06/15/2026",client:"NPPW Services",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:228,week:"06/22/2026",client:"Vault Insurance & Risk Management Week 5 check-in VA Jefer",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:229,week:"06/22/2026",client:"Vault Insurance & Risk Management Week 5 check-in VA Jhonel",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:230,week:"06/22/2026",client:"Bly Insurance Group Week 3 check-in",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:231,week:"06/22/2026",client:"Hardenbergh Insurance Group Week 5 check-in",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:232,week:"06/22/2026",client:"South City Insurance (John Dave Baylon) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:233,week:"06/22/2026",client:"South City Insurance (Elaiza Eve Ramos) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:234,week:"06/22/2026",client:"South City Insurance (Maria Luz Marañon) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:235,week:"06/22/2026",client:"Steve Pore Insurance (Gabriel Zion Cimafranca) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:236,week:"06/22/2026",client:"RMIN Consulting (Gian Tristian Apostol) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:237,week:"06/22/2026",client:"NPPW Services (Ariel Benjamine Espanto) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:238,week:"06/22/2026",client:"NPPW Services (Arturo Gales) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:239,week:"06/22/2026",client:"NPPW Services (Joel Rey Bueno) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:240,week:"06/29/2026",client:"Month 2 Check-in Meeting: John and Justin, J. Gurley Insurance",vas:[],type:"monthly",mode:"zoom",status:"skipped",am:"",notes:""},
  {id:241,week:"06/29/2026",client:"1st Weekly Check-in Meeting - Marenco Insurance Agency",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:242,week:"06/29/2026",client:"Crawford Butz & Associates (Zigfred Gementiza) = 89%",vas:[{"name": "89.0", "score": 89.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:243,week:"06/29/2026",client:"JBLB Insurance Group (Diosdado Dalisay) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:244,week:"06/29/2026",client:"RMIN Consulting (Gian Tristian Apostol) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:245,week:"06/29/2026",client:"NPPW Services (Joel Rey Bueno) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:246,week:"06/29/2026",client:"Synergy Insurance Advisors (Ronna Jay Pejano) = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:247,week:"06/29/2026",client:"Steve Pore Insurance (client ooo)",vas:[],type:"weekly",mode:"zoom",status:"noshow",am:"",notes:""},
  {id:248,week:"06/29/2026",client:"4 week- c/in: Bly Insurance Group VA Hanna 1 week c/in VA Harvey = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:249,week:"06/29/2026",client:"1 week- c/in: Classic Coverage Group LLC VA Aimee = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:250,week:"06/29/2026",client:"6 week-c/in: VA Ryan / Hardenbergh Insurance Group = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:251,week:"06/29/2026",client:"1 week- c/in: Ramey King Insurance Agency VA Claire = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
  {id:252,week:"06/29/2026",client:"1 week- c/in: Scheier Insurance Agency VA Bernadette VA Marie / TL RJ = 100%",vas:[{"name": "100.0", "score": 100.0}],type:"weekly",mode:"zoom",status:"showed",am:"",notes:""},
];

const WEEK_STATS = {
  "01/12/2026": {niccoleShowW:null,niccoleShowM:null,niccoScW:null,niccoScM:null,overallShowW:null,overallScW:null},
  "01/19/2026": {niccoleShowW:{pct:100,shown:3,total:3},niccoleShowM:{pct:33,shown:1,total:3},niccoScW:{pct:100,shown:3,total:3},niccoScM:{pct:100,shown:1,total:1},overallShowW:{pct:86,shown:6,total:7},overallScW:{pct:83,shown:5,total:6}},
  "01/26/2026": {niccoleShowW:{pct:50,shown:2,total:4},niccoleShowM:null,niccoScW:{pct:50,shown:2,total:4},niccoScM:null,overallShowW:{pct:57,shown:4,total:7},overallScW:{pct:57,shown:4,total:7}},
  "02/02/2026": {niccoleShowW:{pct:100,shown:1,total:1},niccoleShowM:{pct:50,shown:1,total:2},niccoScW:{pct:100,shown:1,total:1},niccoScM:{pct:100,shown:1,total:1},overallShowW:{pct:80,shown:4,total:5},overallScW:{pct:100,shown:4,total:4}},
  "02/09/2026": {niccoleShowW:null,niccoleShowM:{pct:100,shown:1,total:1},niccoScW:null,niccoScM:{pct:100,shown:1,total:1},overallShowW:{pct:100,shown:3,total:3},overallScW:{pct:100,shown:3,total:3}},
  "02/16/2026": {niccoleShowW:null,niccoleShowM:{pct:100,shown:1,total:1},niccoScW:null,niccoScM:{pct:100,shown:1,total:1},overallShowW:{pct:100,shown:3,total:3},overallScW:{pct:100,shown:3,total:3}},
  "03/09/2026": {niccoleShowW:{pct:100,shown:2,total:2},niccoleShowM:{pct:100,shown:2,total:2},niccoScW:{pct:100,shown:2,total:2},niccoScM:{pct:100,shown:2,total:2},overallShowW:{pct:100,shown:7,total:7},overallScW:null},
  "03/16/2026": {niccoleShowW:{pct:50,shown:1,total:2},niccoleShowM:{pct:100,shown:1,total:1},niccoScW:{pct:100,shown:1,total:1},niccoScM:{pct:100,shown:1,total:1},overallShowW:{pct:71,shown:5,total:7},overallScW:{pct:100,shown:5,total:5}},
  "03/23/2026": {niccoleShowW:{pct:100,shown:3,total:3},niccoleShowM:null,niccoScW:{pct:67,shown:2,total:3},niccoScM:null,overallShowW:{pct:92,shown:11,total:12},overallScW:{pct:91,shown:10,total:11}},
  "03/30/2026": {niccoleShowW:{pct:100,shown:2,total:2},niccoleShowM:{pct:100,shown:1,total:1},niccoScW:{pct:100,shown:2,total:2},niccoScM:{pct:100,shown:1,total:1},overallShowW:{pct:86,shown:12,total:14},overallScW:{pct:100,shown:12,total:12}},
  "04/03/2026": {niccoleShowW:{pct:100,shown:2,total:2},niccoleShowM:null,niccoScW:{pct:100,shown:2,total:2},niccoScM:null,overallShowW:{pct:90,shown:9,total:10},overallScW:{pct:100,shown:9,total:9}},
  "04/13/2026": {niccoleShowW:{pct:100,shown:2,total:2},niccoleShowM:null,niccoScW:{pct:100,shown:2,total:2},niccoScM:null,overallShowW:{pct:82,shown:9,total:11},overallScW:{pct:100,shown:9,total:9}},
  "04/20/2026": {niccoleShowW:{pct:100,shown:1,total:1},niccoleShowM:{pct:100,shown:1,total:1},niccoScW:{pct:100,shown:1,total:1},niccoScM:{pct:100,shown:1,total:1},overallShowW:{pct:100,shown:9,total:9},overallScW:{pct:100,shown:9,total:9}},
  "04/27/2026": {niccoleShowW:{pct:100,shown:1,total:1},niccoleShowM:null,niccoScW:{pct:100,shown:1,total:1},niccoScM:null,overallShowW:{pct:100,shown:8,total:8},overallScW:{pct:100,shown:8,total:8}},
  "05/04/2026": {niccoleShowW:{pct:100,shown:1,total:1},niccoleShowM:null,niccoScW:{pct:100,shown:1,total:1},niccoScM:null,overallShowW:{pct:100,shown:8,total:8},overallScW:{pct:100,shown:9,total:9}},
  "05/11/2026": {niccoleShowW:{pct:100,shown:1,total:1},niccoleShowM:{pct:100,shown:2,total:2},niccoScW:{pct:100,shown:1,total:1},niccoScM:{pct:100,shown:2,total:2},overallShowW:{pct:100,shown:5,total:5},overallScW:{pct:100,shown:5,total:5}},
  "05/18/2026": {niccoleShowW:{pct:100,shown:1,total:1},niccoleShowM:{pct:100,shown:1,total:1},niccoScW:{pct:100,shown:1,total:1},niccoScM:{pct:100,shown:1,total:1},overallShowW:{pct:83,shown:5,total:6},overallScW:{pct:100,shown:5,total:5}},
  "05/26/2026": {niccoleShowW:null,niccoleShowM:null,niccoScW:null,niccoScM:null,overallShowW:{pct:91,shown:10,total:11},overallScW:{pct:92,shown:12,total:13}},
  "06/01/2026": {niccoleShowW:{pct:100,shown:1,total:1},niccoleShowM:null,niccoScW:{pct:100,shown:1,total:1},niccoScM:null,overallShowW:{pct:91,shown:10,total:11},overallScW:{pct:100,shown:14,total:14}},
  "06/08/2026": {niccoleShowW:{pct:100,shown:2,total:2},niccoleShowM:null,niccoScW:{pct:100,shown:2,total:2},niccoScM:null,overallShowW:{pct:85,shown:11,total:13},overallScW:{pct:100,shown:14,total:14}},
  "06/15/2026": {niccoleShowW:null,niccoleShowM:null,niccoScW:null,niccoScM:null,overallShowW:{pct:62,shown:5,total:8},overallScW:{pct:100,shown:7,total:7}},
  "06/22/2026": {niccoleShowW:null,niccoleShowM:null,niccoScW:null,niccoScM:null,overallShowW:{pct:100,shown:7,total:7},overallScW:{pct:100,shown:12,total:12}},
  "06/29/2026": {niccoleShowW:{pct:100,shown:1,total:1},niccoleShowM:null,niccoScW:{pct:100,shown:1,total:1},niccoScM:null,overallShowW:{pct:92,shown:11,total:12},overallScW:{pct:100,shown:11,total:11}},
};



const INIT_ACCOUNTS = [
  {id:1,  agency:"Agency Automate",                                    contact:"Rob Cesaric",                          vas:["John Charles Frederick Mamanao","Jericho Opsima","Lourrence Ed Senajon","Ivan Louie Malicsi","Kaiyou Serra"],                                                                                                                                   status:"Active",    phone:"",               state:""},
  {id:2,  agency:"Ameriguard Agency Inc",                              contact:"Brad Boldt",                           vas:["Dianne Hubay","Sunshine Marie Seriña","Luke Angelo Velez"],                                                                                                                                                                                  status:"Active",    phone:"763-767-0522",   state:"MN - CST"},
  {id:3,  agency:"Bailey Family Insurance",                             contact:"Mark Bailey",                          vas:["Carmela Nova Edig","Christian Vern Aguilar"],                                                                                                                                                                                                status:"Active",    phone:"(217) 441-2342", state:"IL - CST"},
  {id:4,  agency:"Beach Break Insurance Agency",                        contact:"Rich Sabatowski",                      vas:["Phoebe Espaldon","Joanna Bubutan","Pierre Anthony Marc Santos"],                                                                                                                                                                              status:"Active",    phone:"",               state:"CA - PST"},
  {id:5,  agency:"Blackwell Insurance",                                 contact:"Leigh Zellmer / Ken Haraughty",        vas:["Winslet Jul Napala"],                                                                                                                                                                                                                         status:"Active",    phone:"949-357-6804",   state:"CA - PST"},
  {id:6,  agency:"Caliber One Insurance",                               contact:"Vanessa Neil",                         vas:["Shaira Gayle Loregas"],                                                                                                                                                                                                                       status:"Active",    phone:"954-549-4019",   state:"FL - EST"},
  {id:7,  agency:"Copeland Insurance Agency",                           contact:"Vonda Copeland",                       vas:["Kenn Peter Viscayno"],                                                                                                                                                                                                                        status:"Active",    phone:"785-313-1544",   state:"KS - CST"},
  {id:8,  agency:"Cord Insurance",                                      contact:"Nicole Williams",                      vas:["Gifford Nale","Jesselyn Xena Paronda","Mariah Nicole Seville","Jacky Arado","Frederick Fedee","Maika Silagan","Allyza Legaspi","Diane Layne Fernandez","Jose Lorenzo Ponce De Leon","Dyniela Buhia","Leah Mae Abella","Christian Vern Aguilar","Roland Jason Gulanes","Ira Mae Basalan"], status:"Active", phone:"760-707-8710", state:"CA - PST"},
  {id:9,  agency:"D&E Insurance Group",                                 contact:"Eric Newendrop",                       vas:["Gee-chelle Alberllera"],                                                                                                                                                                                                                      status:"Active",    phone:"(623) 552-3248", state:"AZ - MDT"},
  {id:10, agency:"Dickey Mccay Insurance",                              contact:"Mark and Lisa",                        vas:["Zigfred Gementiza"],                                                                                                                                                                                                                          status:"Cancelled", phone:"423-496-3366",   state:"TN - EST"},
  {id:11, agency:"EG Bowman",                                           contact:"Jelani Fenton",                        vas:["Bien Ladin Akmad"],                                                                                                                                                                                                                           status:"Cancelled", phone:"(917) 803-7917", state:"NY - EST",    notes:"Bien's productivity is extremely low. Check to see if we can get new tasks for him."},
  {id:12, agency:"Evergreen Insurance Inc",                             contact:"Jesse Villafranca",                    vas:["Jeffrey Dela Cruz"],                                                                                                                                                                                                                          status:"Active",    phone:"360-907-9481",   state:"WA - PST"},
  {id:13, agency:"Florida Best Quotes",                                 contact:"Nina Mastridge",                       vas:["Marc Nadine","Kristian Rhey Piodos","Robert Lucio Calope","Erlan James Liguan","Weneliza Eyo","Garliet Aguilar","Rosanna Katrina Obeal","Phoebe Euanna May Maranga","Cecile Caputol","Kristine Mae Aldamia","Chelsea Dave Abrasaldo","Renalie Joy Tingson","Marielle Pajo"], status:"Active", phone:"727-584-9999", state:"FL - EST"},
  {id:14, agency:"Great Park Insurance",                                contact:"Daniel Seong",                         vas:["Shadrach Cabunoc","Lord John Oliveros"],                                                                                                                                                                                                      status:"Active",    phone:"949-873-3242",   state:"CA - PST"},
  {id:15, agency:"Grimes Insurance Agency",                             contact:"Ryan Reynolds",                        vas:["Daneca Mary Joy","Jennifer Pelle","Nikko Lim","Bobby Lyhne","Mark Caballles","Ma. Mikaela Alonso","Althea Sajeda N. Clao","Peter Lorenz Acosta","Nathalie Mae Santisas","Saramie Oani","Ana Katrina Faraon","Alemar Ortiz","Edriz Jann Somono","Andrea Arce","Kate Justin Diamante","Raymond Mara"], status:"Active", phone:"806-589-9565", state:"TX - CST", notes:"Only wants their old VA back. Waiting to see if we can get them back."},
  {id:16, agency:"Guardian Insurance",                                  contact:"Chris Dupill",                         vas:["Jayson Lauresta"],                                                                                                                                                                                                                            status:"Active",    phone:"",               state:"MA - EST"},
  {id:17, agency:"Heaton Bennett Insurance",                            contact:"Ross Bennett",                         vas:["Mary Jane Tejero","Reno Diansay","Jason Guipitacio","Rosalyn Esmero","Antonio Miguel Eugenio","Orpha Tumala"],                                                                                                                                status:"Active",    phone:"512-517-7751",   state:"TX - CST"},
  {id:18, agency:"Hoery Insurance Agency Inc",                          contact:"Scott Hoery",                          vas:["Dianne Mangoranda","Mary Barbette Baldestamon"],                                                                                                                                                                                             status:"Active",    phone:"720-261-9957",   state:"CO - MDT"},
  {id:19, agency:"IFG Insurance",                                       contact:"Alan Chu",                             vas:["Nhayma"],                                                                                                                                                                                                                                     status:"Cancelled", phone:"808-381-4820",   state:"HI - HST"},
  {id:20, agency:"Integrity Insurance Group",                           contact:"Michael Smith",                        vas:["Jhoanne Malla"],                                                                                                                                                                                                                              status:"Active",    phone:"570-565-8530",   state:"PA - EST"},
  {id:21, agency:"IntelliBenefits Insurance Services",                  contact:"Greg Haack",                           vas:["Mae Ambrosio"],                                                                                                                                                                                                                               status:"Active",    phone:"949-441-5144",   state:"CA - PST"},
  {id:22, agency:"J. Gurley Insurance",                                 contact:"John Byars",                           vas:["Rey Angely Saines"],                                                                                                                                                                                                                          status:"Active",    phone:"",               state:""},
  {id:23, agency:"JWI Group, Inc",                                      contact:"Chris Januski",                        vas:["Reychelle May Macaspac"],                                                                                                                                                                                                                     status:"Active",    phone:"914-968-1344",   state:"NY - EST"},
  {id:24, agency:"Keystone Insurance Services",                         contact:"Brent Thurman",                        vas:[],                                                                                                                                                                                                                                             status:"Active",    phone:"",               state:""},
  {id:25, agency:"LTC Specialists, LLC",                                contact:"Andrew Goetz",                         vas:["Vincent Angelo Pichon","Zhaina Karylle Carbonell"],                                                                                                                                                                                          status:"Active",    phone:"443-790-4449",   state:"MD - EST"},
  {id:26, agency:"Masters of Disasters",                                contact:"Larry Maistros",                       vas:["Vaughn Calumpong"],                                                                                                                                                                                                                           status:"Cancelled", phone:"440-781-6903",   state:"OH - EST"},
  {id:27, agency:"Navigate Risk Advisors",                              contact:"TJ Worsencroft",                       vas:["Mary Lou Cabigas","Herma Mae Lima","Edna Marie Villarino","George Michael Presilda"],                                                                                                                                                         status:"Active",    phone:"(440) 871-0110", state:"OH - EST",    notes:"So many red flags!!!!!"},
  {id:28, agency:"Omega Insurance Group / Brokers Insurance Agency",    contact:"Ryan Sanne",                           vas:["Bryan Neil Silva"],                                                                                                                                                                                                                           status:"Active",    phone:"402-325-0777",   state:"NE - CST",    notes:"Prefers to contact thru email moving forward. Super happy with his VA."},
  {id:29, agency:"Parkway LTC Consulting",                              contact:"Novel Martin",                         vas:["Colin Eder"],                                                                                                                                                                                                                                 status:"Active",    phone:"540-529-4845",   state:"VA - EST"},
  {id:30, agency:"Pinnacle - Premiere Home and Auto",                   contact:"Peter Manfra / Steve Kohlbrenner",     vas:["Michael John Baquero","Yousef Abdulrahman Zeinaldin"],                                                                                                                                                                                       status:"Active",    phone:"(856) 544-9330", state:"NJ - EST"},
  {id:31, agency:"Pinnacle Point Insurance",                            contact:"Aaron England",                        vas:["Marella Patiño"],                                                                                                                                                                                                                             status:"Active",    phone:"281-528-5737",   state:"TX - CST"},
  {id:32, agency:"Priority Risk",                                       contact:"Mark Shoultz",                         vas:["John Michael Clarin","Michael Joseph Cabigas","Pauline Ingrid Broas","Joan Lapinid"],                                                                                                                                                        status:"Active",    phone:"317-508-8118",   state:"IN - EST"},
  {id:33, agency:"Prostar Insurance",                                   contact:"John Pfeil",                           vas:["Anna Katrina Cabatingan","Jason Cedric Xavier","Fairie Pearl Tamargo"],                                                                                                                                                                       status:"Active",    phone:"206-850-7592",   state:"WA - PST"},
  {id:34, agency:"Raleigh Insurance Group",                             contact:"Daniel Rohrbaugh",                     vas:["Maria Carmina Quijada","Alexandra Guro","Maria Ulibeth Canvas"],                                                                                                                                                                              status:"Active",    phone:"(919) 744-7722", state:"NC - EST"},
  {id:35, agency:"Reliant Insurance Group",                             contact:"Ben Klesinger",                        vas:[],                                                                                                                                                                                                                                             status:"Cancelled", phone:"(303) 809-5189", state:"IN - EST"},
  {id:36, agency:"SalesPower",                                          contact:"David Lefevre",                        vas:["Daven Jay Piloton"],                                                                                                                                                                                                                          status:"Active",    phone:"813-857-3283",   state:"FL - EST"},
  {id:37, agency:"Taylor Moore Insurance Agency",                       contact:"Ryan Moore",                           vas:[],                                                                                                                                                                                                                                             status:"Cancelled", phone:"802-673-3363",   state:"VT - EST",    notes:"5th month check-in"},
  {id:38, agency:"The Hanks Group",                                     contact:"Rod Hanks",                            vas:[],                                                                                                                                                                                                                                             status:"Cancelled", phone:"214-769-5091",   state:"TX - CST",    notes:"Reached out to check in"},
  {id:39, agency:"The Insurance Team",                                  contact:"Steve Fisher",                         vas:[],                                                                                                                                                                                                                                             status:"Cancelled", phone:"(480) 241-8751", state:"AZ - MDT",    notes:"INQUIRE GELL — Client did not book a schedule (6/17/25)"},
  {id:40, agency:"The Sterling Insurance Group",                        contact:"Teresa Kitchens",                      vas:[],                                                                                                                                                                                                                                             status:"Cancelled", phone:"214-394-2353",   state:"TX - CST"},
  {id:41, agency:"Trailstone Insurance Group",                          contact:"Mark Rodgers",                         vas:["Samuel Blanco","Ella Marie","Andrea Magpantay","Vincent Giorgio","Kenny Salvaña","Jayson Sasuman","Joseph Benedict Sullan","Jarvy Jayme","Bryn John Cornejo","Al Sean Jr Sala","Kevin Matthew Dublin","Ella Mae Alberio","Rembrant Dagatan","Eliza Lazarraga","Jammi Jay Jr. Deriada","Andrei Lera","Alfredo Berjame Jr","Mizpah Joy Gavile"], status:"Active", phone:"(303) 792-2355", state:"CO - MDT"},
  {id:42, agency:"Valley Insurance Agency",                             contact:"Robert Qaoud",                         vas:["Faith del Rosario","Rojie May Cudal"],                                                                                                                                                                                                       status:"Active",    phone:"(314) 333-4921", state:"MO - CST"},
  {id:43, agency:"VRP Insurance Agency",                                contact:"Vincent Pesce",                        vas:["Jason Kyle Veroy","Juleinee Tayao"],                                                                                                                                                                                                         status:"Active",    phone:"631-738-7300",   state:"NY - EST"},
  {id:44, agency:"Marenco Insurance Agency",                            contact:"Alex Marenco",                         vas:["Daniela Generalao"],                                                                                                                                                                                                                          status:"Active",    phone:"",               state:""},
  {id:45, agency:"World Insurance",                                     contact:"Chris Badger",                         vas:["Kristoffer Randy Ramayla","Princess Jolisse Sastrillas"],                                                                                                                                                                                    status:"Active",    phone:"",               state:""},
];

const INIT_CONCERNS = [
  {id:1, date:"04/03/2026", agency:"Murphy Business",         va:"Dolly",      concern:"MIA due to power outage"},
  {id:2, date:"04/03/2026", agency:"Florida Best Quotes",     va:"Gly",        concern:"DND"},
  {id:3, date:"04/13/2026", agency:"Creekside",               va:"Kristoffer", concern:"MIA"},
  {id:4, date:"04/13/2026", agency:"LTC Specialists (Andy Goetz)", va:"",      concern:"Lava declining his VA's time off"},
  {id:5, date:"04/13/2026", agency:"Grimes Insurance",        va:"Emily",      concern:"VA's process"},
  {id:6, date:"04/20/2026", agency:"Duncan & Associates",     va:"Ron",        concern:"Clocking out 30 mins late"},
  {id:7, date:"04/27/2026", agency:"Truspoint",               va:"Miljun",     concern:"MIA for a bit due to power outage"},
  {id:8, date:"04/27/2026", agency:"Faith Insurance",         va:"Miko",       concern:"Performance"},
  {id:9, date:"05/04/2026", agency:"Navigate Risk Advisors",  va:"Edna",       concern:"MIA for a bit"},
  {id:10,date:"05/04/2026", agency:"Trailstone Insurance",    va:"Andrei",     concern:"Punctuality and task completion"},
  {id:11,date:"05/11/2026", agency:"Navigate Risk Advisors",  va:"Edna",       concern:"MIA again"},
  {id:12,date:"06/15/2026", agency:"Community Insurance",     va:"Melody",     concern:"Thinking of resigning"},
];

const INIT_TASKS = [
  {id:1,  task:"Island KPI",                                          due:"Fri",         assignee:"Gell",          priority:"High",   status:"Recurring",   notes:""},
  {id:2,  task:"HubSpot Tickets",                                     due:"Fri",         assignee:"Niccole/Gell",  priority:"Low",    status:"Recurring",   notes:"For follow-ups"},
  {id:3,  task:"Help Solomon",                                        due:"",            assignee:"Gell",          priority:"Medium", status:"In Progress", notes:""},
  {id:4,  task:"I want to get the spreadsheet started for Time Doc",  due:"",            assignee:"Gell",          priority:"Medium", status:"In Progress", notes:"Going to take forever lol"},
  {id:5,  task:"ON probs (Sales pushing clients before ready)",        due:"",            assignee:"Gell",          priority:"Low",    status:"Pending",     notes:""},
  {id:6,  task:"Breakup with Hubstaff",                               due:"",            assignee:"Niccole",       priority:"Low",    status:"Pending",     notes:""},
  {id:7,  task:"Match HubSpot numbers",                               due:"Mon",         assignee:"Gell",          priority:"Low",    status:"Done",        notes:""},
  {id:8,  task:"Contract red lines",                                  due:"",            assignee:"Niccole/Gell",  priority:"High",   status:"Done",        notes:""},
  {id:9,  task:"EA Training Course",                                  due:"",            assignee:"Gell",          priority:"High",   status:"Done",        notes:"Needs Niccole approval"},
  {id:10, task:"US SOP for NTE",                                      due:"",            assignee:"Niccole",       priority:"Low",    status:"Done",        notes:""},
  {id:11, task:"Research if HIPAA is better in Lava PH",              due:"",            assignee:"Niccole",       priority:"Low",    status:"Done",        notes:""},
  {id:12, task:"Reach out to Scott Hoery re: increase",               due:"",            assignee:"Niccole",       priority:"Medium", status:"Done",        notes:"Scott said he will hire a second VA soon instead"},
  {id:13, task:"FHC VA resignation",                                  due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:"FHC not replacing Anneka"},
  {id:14, task:"Set up meeting with Perry for orange partner form",    due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:"Waiting for questionnaire"},
  {id:15, task:"Set meeting with Austin to review HIPAA forms",        due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:""},
  {id:16, task:"Update the VTO",                                      due:"",            assignee:"Niccole",       priority:"High",   status:"Done",        notes:""},
  {id:17, task:"Make the rock SMART",                                 due:"",            assignee:"Niccole",       priority:"Medium", status:"Done",        notes:""},
  {id:18, task:"SOP for quarterly check-ins and annual review HQ",    due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:""},
  {id:19, task:"New VA OB",                                           due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:""},
  {id:20, task:"Meeting with Austin re: Insightful, etc",             due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:""},
  {id:21, task:"Sched VA interview for jessica@lockandkeytexasrealty", due:"",           assignee:"Niccole",       priority:"Medium", status:"Done",        notes:"Niccole already sent an email"},
  {id:22, task:"Cynthia with TIG: reach out and get onboard WeWo",    due:"",            assignee:"Niccole",       priority:"Medium", status:"Done",        notes:"Niccole already sent an email"},
  {id:23, task:"Book meeting with Taunny",                             due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:""},
  {id:24, task:"Set up meeting for Gurley phone training on the 9th",  due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:""},
  {id:25, task:"Check the ff email to intellezy",                     due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:""},
  {id:26, task:"Check the ff email to Mark re: quote",                due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:""},
  {id:27, task:"Check the email to Brian re: Candice",                due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:""},
  {id:28, task:"AM Reviews",                                          due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:""},
  {id:29, task:"Send Solomon the client list - Hubstaff",             due:"",            assignee:"Gell",          priority:"Medium", status:"Done",        notes:""},
  {id:30, task:"Sched meeting between Niccole and Nash re: Farmers",  due:"",            assignee:"Gell",          priority:"Medium", status:"Done",        notes:""},
  {id:31, task:"Upload docs for HIPAA and send survey for Millennium", due:"",           assignee:"Gell",          priority:"Medium", status:"Done",        notes:"Docs uploaded; no survey yet — no conclusion on 2500 buyout"},
  {id:32, task:"Follow up OB for Marenco once contract finalized",    due:"",            assignee:"Niccole/Gell",  priority:"Low",    status:"Done",        notes:""},
  {id:33, task:"Offboarding emails",                                  due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:"Already automated when term form is filled"},
  {id:34, task:"Onboardings",                                         due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:""},
  {id:35, task:"Create a survey form",                                due:"",            assignee:"Gell",          priority:"High",   status:"Done",        notes:""},
  {id:36, task:"Check the onboardings and Island for Monday",         due:"",            assignee:"Gell",          priority:"High",   status:"Done",        notes:""},
  {id:37, task:"Closed accounts for Solomon",                         due:"",            assignee:"Gell",          priority:"High",   status:"Done",        notes:""},
  {id:38, task:"Task list for Chris Dupill",                          due:"before 23rd", assignee:"Gell",          priority:"Low",    status:"Done",        notes:"They decided to cancel the interview"},
  {id:39, task:"OBs for two VAs (Marenco and Bly)",                   due:"",            assignee:"Gell",          priority:"Medium", status:"Done",        notes:""},
  {id:40, task:"Great Park OB",                                       due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:"VA still needs to complete her medical"},
  {id:41, task:"Book time with David at Southern Group (30 min)",      due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:""},
  {id:42, task:"Draft reply to Melissa re: Austin conversation",      due:"",            assignee:"Niccole",       priority:"Medium", status:"Done",        notes:""},
  {id:43, task:"Hubstaff Cleanup",                                    due:"",            assignee:"Gell",          priority:"Medium", status:"Done",        notes:""},
  {id:44, task:"Cancellation form for Kim Degamo",                    due:"",            assignee:"Gell",          priority:"Medium", status:"Done",        notes:"No need since there are still other VAs"},
  {id:45, task:"Check-in for World Insurance",                        due:"",            assignee:"Gell",          priority:"Medium", status:"Done",        notes:"Email check-in"},
  {id:46, task:"Check-in for Hoery",                                  due:"",            assignee:"Gell",          priority:"Medium", status:"Done",        notes:""},
  {id:47, task:"File for OT",                                         due:"",            assignee:"Gell",          priority:"Low",    status:"Done",        notes:""},
];
const HUBSPOT_LINKS = [
  {
    person: "Niccole",
    category: "General Meetings",
    links: [
      { label: "60/30/15 min", url: "https://meetings.hubspot.com/niccole-peeler" },
      {
        label: "2-Hour VA Interview",
        url: "https://meetings.hubspot.com/niccole-peeler/va-interview-window",
      },
    ],
  },
  {
    person: "Niccole",
    category: "Interview Cross-Sell",
    links: [
      { label: "Johnny", url: "https://meetings.hubspot.com/niccole-peeler/2hr-va-demo-jrx" },
      { label: "Mike", url: "https://meetings.hubspot.com/niccole-peeler/2hr-va-demo-mwx" },
      { label: "Celina", url: "https://meetings.hubspot.com/niccole-peeler/2hr-va-demo-cmx" },
      { label: "Clarise", url: "https://meetings.hubspot.com/niccole-peeler/2hr-va-demo-ccx" },
    ],
  },
  {
    person: "Niccole",
    category: "Upsell 30-min Demo",
    links: [
      { label: "Johnny", url: "https://meetings.hubspot.com/niccole-peeler/30-minute-va-demo-jrx" },
      { label: "Mike", url: "https://meetings.hubspot.com/niccole-peeler/30-minute-va-demo-mwx" },
      { label: "Celina", url: "https://meetings.hubspot.com/niccole-peeler/30-minute-va-demo-cmx" },
      {
        label: "Clarise",
        url: "https://meetings.hubspot.com/niccole-peeler/30-minute-va-demo-ccx",
      },
    ],
  },
  {
    person: "Alicia",
    category: "Interview Cross-Sell",
    links: [
      { label: "Johnny", url: "https://meetings.hubspot.com/alicia225/2hr-va-demo-jrx" },
      { label: "Mike", url: "https://meetings.hubspot.com/alicia225/2hr-va-demo-mwx" },
      { label: "Celina", url: "https://meetings.hubspot.com/alicia225/2hr-va-demo-cmx" },
      { label: "Clarise", url: "https://meetings.hubspot.com/alicia225/2hr-va-demo-ccx" },
    ],
  },
  {
    person: "Alicia",
    category: "Upsell 30-min Demo",
    links: [
      { label: "Johnny", url: "https://meetings.hubspot.com/alicia225/30-minute-va-demo-jrx" },
      { label: "Mike", url: "https://meetings.hubspot.com/alicia225/30-minute-va-demo-mwx" },
      { label: "Celina", url: "https://meetings.hubspot.com/alicia225/30-minute-va-demo-cmx" },
      { label: "Clarise", url: "https://meetings.hubspot.com/alicia225/30-minute-va-demo-ccx" },
    ],
  },
  {
    person: "Karla",
    category: "Interview Cross-Sell",
    links: [
      { label: "Johnny", url: "https://meetings.hubspot.com/karla-jardeloza/2hr-va-demo-jrx" },
      { label: "Mike", url: "https://meetings.hubspot.com/karla-jardeloza/2hr-va-demo-mwx" },
      { label: "Celina", url: "https://meetings.hubspot.com/karla-jardeloza/2hr-va-demo-cmx" },
      { label: "Clarise", url: "https://meetings.hubspot.com/karla-jardeloza/2hr-va-demo-ccx" },
    ],
  },
  {
    person: "Karla",
    category: "Upsell 30-min Demo",
    links: [
      {
        label: "Johnny",
        url: "https://meetings.hubspot.com/karla-jardeloza/30-minute-va-demo-jrx",
      },
      { label: "Mike", url: "https://meetings.hubspot.com/karla-jardeloza/30-minute-va-demo-mwx" },
      {
        label: "Celina",
        url: "https://meetings.hubspot.com/karla-jardeloza/30-minute-va-demo-cmx",
      },
      {
        label: "Clarise",
        url: "https://meetings.hubspot.com/karla-jardeloza/30-minute-va-demo-ccx",
      },
    ],
  },
  {
    person: "Interview Links",
    category: "VA Interview Scheduling",
    links: [
      { label: "Niccole",  url: "https://meetings.hubspot.com/niccole-peeler/va-interview-window" },
      { label: "Clarise",  url: "https://meetings.hubspot.com/clarise/2-hour-va-interviews-clarise" },
      { label: "Jhonny",   url: "https://meetings.hubspot.com/johnny-robert/2-hour-va-interviews" },
      { label: "Mike",     url: "https://meetings.hubspot.com/mike-walker/2-hour-va-interviews" },
      { label: "Celina",   url: "https://meetings.hubspot.com/celina-marquez/2-hour-va-interviews" },
    ],
  },
  {
    person: "Interview Links",
    category: "All HubSpot Meeting Links (Source)",
    links: [
      { label: "HubSpot Meetings Hub", url: "https://app.hubspot.com/meetings/48034691/" },
    ],
  },
];
const WORKFLOW = [
  {
    time: "Start of Day",
    emoji: "",
    color: C.dark,
    items: [
      "Clock in at 7AM (or earlier if Niccole has a 7AM meeting), 7:30AM on regular days",
      "Send good morning to Niccole and the team",
      "Review Niccole's calendar — make Alicia and Karla co-hosts for necessary meetings",
      "Check Niccole's emails and start sorting",
      "Identify high-priority tasks; build to-do list as you go through emails",
      "Reply to urgent emails; leave ones needing Niccole unread after reading",
    ],
  },
  {
    time: "Midday",
    emoji: "",
    color: "#374151",
    items: [
      "Work through the to-do list",
      "Attend scheduled meetings, take notes and action items — use AI tools",
      "Update documents, sheets, CRM, trackers",
      "Take a short break during downtime",
    ],
  },
  {
    time: "End of Day",
    emoji: "",
    color: C.teal,
    items: [
      "Review schedule for tomorrow; add right stakeholders to meetings",
      "Set priorities for a smooth start next day",
      "Send clock-out messages to Niccole and team",
      "Stop Hubstaff timer, close apps, shut down laptop",
    ],
  },
  {
    time: "Every Friday",
    emoji: "",
    color: C.red,
    items: [
      "Prepare Island KPIs",
      "Check contracts and ACH for Monday onboardings",
      "Double-check Monday onboardings — all stakeholders invited",
    ],
  },
];
const NOTES = [
  { label: "Niccole Phone", value: "5039962319" },
  { label: "US Address", value: "16332 SW Wright St. Beaverton OR 97007" },
  { label: "PH Address", value: "Units B1-B3 2F Buhangin Grand Complex Km 6 Buhangin, Davao City" },
  {
    label: "PH Mailing (Attn: Rey Jr. Gabila)",
    value:
      "Units B1-B3 2nd floor Buhangin Grand Complex, Km6 Carnation St. Brgy Buhangin, Davao City, Davao del Sur 8000",
  },
];
const SALES_SLIDES = [
  { id: 1, title: "Clarity Selling", subtitle: "By Bryan Ostermiller", content: "", type: "cover" },
  {
    id: 2,
    title: "The Opening Question",
    content: "How would making a $145k commission check for a single month make you feel?",
    type: "quote",
  },
  {
    id: 3,
    title: "The Paycheck That Shifted Everything",
    content:
      "2 very clear paths:\n1. Be done with it all.\n2. Find a way to integrate immense purpose into all aspects of life.",
    type: "text",
  },
  {
    id: 4,
    title: "Taking Path #2",
    content:
      "1. Where do I find genuine inspiration past another list of arbitrary goals?\n2. How can we sell in a way that creates real change in ourselves and prospects?\n3. Can we integrate 1 & 2 into the same path?",
    type: "text",
  },
  {
    id: 5,
    title: "Bryan Ostermiller",
    content:
      "• Top Sales Rep at Pinterest — millions in ad spend\n• Founder of Agency Hyper Growth → $1M cash/year for 2 years\n• Co-Founder of Remote Closing Academy → $0 to $1M/month in 9 months\n• Operator of Scale Front Equities → Springs Rejuvenation $0 to $2.5M/year in 12 months\n• Founder of Sales Generators — teaches Clarity Selling",
    type: "list",
  },
  {
    id: 6,
    title: "Sales & the Map of Consciousness",
    content:
      "Consciousness is the lens through which we experience reality. In sales it determines everything — a prospect's fears, desires, and objections are tied to their level of consciousness.",
    type: "text",
  },
  {
    id: 7,
    title: "Map of Consciousness — David Hawkins",
    content:
      "Scale 0–1000. Lower = fear-based. Higher = expansive, empowered.\n\nEnlightenment 700–1000 | Peace 600 | Joy 540 | Love 500\nReason 400 | Acceptance 350 | Willingness 310 | Neutrality 250\nCourage 200 ← CRITICAL LINE\nPride 175 | Anger 150 | Desire 125 | Fear 100\nGrief 75 | Apathy 50 | Guilt 30 | Shame 20",
    type: "map",
  },
  {
    id: 8,
    title: "How This Relates to Sales",
    content:
      "• Fear-based → needs certainty, not persuasion\n• Anger-based → needs a strong challenge, not comfort\n• Pride-based → needs to be called forward, not more info\n\nThe best closers meet people where they are and call them up.",
    type: "list",
  },
  {
    id: 9,
    title: "Starting With Courage — The 200 Line",
    content:
      "When a closer crosses 200, their operating system changes.\n\nBefore 200: reactive, attached to outcome, avoiding hard actions.\nAfter 200: calm under pressure, neutral, asking better questions, detached but committed.\n\n'Below 200, people are run by the mind. At 200+, people begin to run the mind.'",
    type: "text",
  },
  {
    id: 10,
    title: "Identifying Prospect Level",
    content:
      "• Grief/Shame → Apologetic, low energy, questioning their worth\n• Fear → Overanalyze, ask for guarantees, hesitant\n• Desire → Focus on money, success, lifestyle\n• Anger → Skeptical, burned before, complain\n• Pride → Know everything, don't want to feel sold\n• Courage → Open, proactive, ask how things work",
    type: "list",
  },
  {
    id: 11,
    title: "Grief / Shame",
    subtitle: "How to respond",
    content:
      "Gentle, reassuring. Focus on self-worth. Show hope.\n\n'A lot of people feel stuck making a big change. What do you feel has held you back the most?' → 'What would it feel like to finally have clarity on your next steps?'",
    type: "prospect",
  },
  {
    id: 12,
    title: "Fear",
    subtitle: "How to respond",
    content:
      "Calm certainty. Reduce risk perception. Make it safe to act.\n\n'What's the worst-case scenario you're afraid of? Let's get really clear on that.' → Name it, then make a case for why it's unlikely.",
    type: "prospect",
  },
  {
    id: 13,
    title: "Desire",
    subtitle: "How to respond",
    content:
      "Amplify the vision. Show how this gets them what they want.\n\n'If you had the income and freedom you wanted, what's the first thing you'd do with it?' → Let them dream, then bridge back.",
    type: "prospect",
  },
  {
    id: 14,
    title: "Anger",
    subtitle: "How to respond",
    content:
      "Validate frustration but reframe as fuel for change.\n\n'I hear you. It sounds like you've invested in things and didn't get results. What do you think was missing?'",
    type: "prospect",
  },
  {
    id: 15,
    title: "Pride",
    subtitle: "How to respond",
    content:
      "Challenge subtly. Respect their intelligence.\n\n'You're obviously someone who knows how to make things happen. So what do you feel is the one missing piece keeping you from change?'",
    type: "prospect",
  },
  {
    id: 16,
    title: "Courage",
    subtitle: "How to respond",
    content:
      "Reinforce confidence. Help them see the path clearly.\n\n'You're at the point where you just need the right plan and people to help you get there, right?' → Show how your offer provides that structure.",
    type: "prospect",
  },
  {
    id: 17,
    title: "Summary",
    content:
      "1. Let go of lower consciousness → non-linear, exponential changes in Self and Outcomes.\n2. Move past the script, truly see people → selling falls into a flow state.\n3. Set the tone of truth, leadership, and courage → growth is a natural byproduct.",
    type: "summary",
  },
  {
    id: 18,
    title: "Recommended Reading",
    content:
      "• Letting Go — David Hawkins\n• Power vs Force — David Hawkins\n\nFor more: join Sales Generators group",
    type: "list",
  },
];


const WORD_TRACK = [
  {
    id: 1,
    category: "Direct VA Talk Points",
    title: "Direct VA Talk Points",
    type: "talkpoints",
    bullets: [
      "Thank them for their time",
      "Ask Why",
      "Doing the illegal tasks — stacking tasks up, reviewing, and submitting; Department of the INS change; don't think INS will find out",
      "Keep getting pushed back — the value, the risk, the money",
      "DATA LOSS: Access control",
      "HELP ME UNDERSTAND WHAT THAT MEANS TO YOU SO I CAN GATHER A BIGGER PICTURE SUPPORT — what's stopping you from doing that now? What's the next level of security? E&O gap? Security?",
      "Agency Zoom limitations: it's the limits of AZ, not of LAVA. We have our limitations as well — we help with all",
      "PAY — what are you spending on tech (VPN, equipment, security, retrieval)? Have you added to your E&O? Checked what the new risk is covered? Remote company that accepts the risk? Added the rider policy? Charged a huge premium for international?",
      "What are you going to do if the VA steals from you or steals your equipment?",
      "Cyber security, remote access, international taxes, Hubstaff monitoring, DOLE regulations, HMO, 13th month, holiday schedule/PTO",
      "Add that all up and tell me how much you are really saving",
      "No contract — is it enforceable?",
      "Data retrieval and controls from stealing, red tape with the government",
      "13 things that LAVA does for you that comes at a cost",
      "Background checks, employment checks",
    ],
  },
  {
    id: 2,
    category: "#1 VA Not Performing",
    title: "Not Enough Tasks",
    type: "guide",
    intro:
      "Proactively ask the client for more work. Be confident and ask for more work. Push them to be more productive. Guide the client on ways to help the VA.",
    points: [
      "They are busy and don't always remember to give more work",
      "You need to lead with confidence and ask for more work repeatedly",
      "Getting them to see from the client's perspective",
      "Make it easy for the client to want to give work",
    ],
    notes:
      "If your % isn't high enough, the client doesn't feel like you are important.",
  },
  {
    id: 3,
    category: "#1 VA Not Performing",
    title: "VA Performance — Meeting Structure",
    type: "guide",
    intro:
      "Open: Let's schedule a meeting with your client and discuss the issue. If you have not already had a meeting with the VA, make sure to do your introductions. Share a little bit about yourself (VA).",
    points: [
      "Dive in: set the tone, expectations of the meeting, the goal, feedback, and Q&A",
      "Get their commitment to share their feelings",
      "Identify the emotion of the VA",
      "Build Trust, Fear, Shame, Guilt",
    ],
  },
  {
    id: 4,
    category: "#1 VA Not Performing",
    title: "Struggling to Understand Instructions",
    type: "qa",
    cols: ["Questions to ask VA", "Questions to ask yourself", "Questions to ask the client"],
    rows: [
      ["How do you prefer to learn?", "How's the VA's comprehension of English?", "Do you have SOPs to walk you through your tasks?"],
      ["Who did the training with you?", "Do we have training on the tools they're using?", "Are they clear and easy to understand? Are the SOPs updated/accurate?"],
      ["How often are you asking questions?", "Are there distractions in their environment?", "Show me your screen and let's walk through a task together?"],
      ["How's the dynamic on the team? Do you feel part of the team?", "Is the VA used to cultural differences? (Squeaky wheel gets the grease)", "Are they comfortable asking questions?"],
    ],
  },
  {
    id: 5,
    category: "#1 VA Not Performing",
    title: "Tasks Not Getting Done",
    type: "guide",
    intro:
      "Three-way attack — check Hubstaff, the client, and the VA.",
    points: [
      "Check Hubstaff: attendance, productivity rate, general activity",
      "Client check-in: AM should reach out to get a better understanding of what tasks aren't getting done and when the issue started",
      "What tasks are they failing to complete? When did the issue start? Has the agency discussed this with the VA? Did the agency take steps to resolve it?",
      "Is the agency open to a PIP? If yes: discuss the 30-day process, TL monitors daily, TL explains gravity/implications, update client on PIP start, AM checks in weekly with client",
      "If not open to a PIP: discuss replacement options and timeline",
      "VA check-in: set appointment, set expectations, ask about task assignment",
      "\"Share your screen, show me a sample task, let's walk through it together\" — assess how long this took, how many tasks a day, do the math",
      "Get their commitment to completing the tasks or filling the gap",
    ],
  },
  {
    id: 6,
    category: "#1 VA Not Performing",
    title: "Tasks Not Getting Done / Mistakes — Q&A",
    type: "qa",
    cols: ["Questions to ask VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Can you tell me what happened during this shift?", "Are they present during their shift? Productivity/activity rate?", "Do you have tasks that are not getting done?"],
      ["How do you feel about your work volume?", "How many tasks a day is the VA getting? What's their workload?", "When did the issue start?"],
      ["Are you familiar with the tools? Struggling with a specific task?", "Do we have training on the tools they're using?", "What tasks are they failing to complete?"],
      ["Were you assigned a new task? Any changes in your personal life?", "What's their vibe? What's their activity online?", "Is the VA having personal struggles affecting performance?"],
      ["Do you have any other jobs currently?", "What's your workflow? Clearly defined? Updated SOPs?", "What are their assignments? New tools?"],
    ],
  },
  {
    id: 7,
    category: "#1 VA Not Performing",
    title: "Productivity Dropping",
    type: "guide",
    intro: "Three-way attack — check Hubstaff, the client, and the VA.",
    points: [
      "Check Hubstaff: attendance, productivity, general activity",
      "Client check-in: get a better understanding of what tasks aren't getting done and when the issue started",
      "What's their bandwidth? Time on task? Rushed? Too many?",
    ],
  },
  {
    id: 8,
    category: "#1 VA Not Performing",
    title: "Lacks Attention to Detail / Not Proactive",
    type: "qa",
    cols: ["Questions to ask VA", "Questions to ask yourself", "Questions to ask the client"],
    rows: [
      ["Do you feel you're missing details in your work?", "Can I clearly define this to the VA?", "What details are being missed?"],
      ["What would you like to improve about your work details?", "Can the VA improve?", "Can you clearly define what you'd like to see different?"],
      ["How do you feel about your work volume?", "What's their workload like?", "How many tasks/volume is expected?"],
      ["Do you have updated SOPs or a sample to follow?", "Are their SOPs updated?", "Are there SOPs to help with details/checklists?"],
      ["Who do you report to? What do check-ins look like?", "What's different that might trigger changes in detail?", "Has anything changed in agency processes/personnel?"],
    ],
  },
  {
    id: 9,
    category: "#2 VA Attendance",
    title: "VA Did Not Give Ample Time for Leave Requests",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Share your understanding of the PTO process", "Did they file in Hubstaff?", "What is your internal policy on leave?"],
      ["When was this planned?", "Did they have enough PTO to use?", "Would you like to allow time off unpaid?"],
      ["Share any more trips/leaves planned for the next 3 months", "Did they clearly state the reason and request?", "Were you informed ahead of time about the leave?"],
      ["", "Did they already inform their client?", "Is the event/holiday legitimate? (link to US holidays)"],
    ],
  },
  {
    id: 10,
    category: "#2 VA Attendance",
    title: "PTO Conversion / Conversation",
    type: "guide",
    intro:
      "Client wants to know how much PTO a VA has available. VA is trying to use more days than available. Clients are required to give 10 days of PTO; VAs are allowed 5 days. The 5-day buffer is for the client's benefit and should be avoided in conversations — explaining cultural differences can be confusing.",
    points: [
      "Walk through understanding of the leave/PTO conversion policy",
      "Are they informed about PTO conversion during NHO?",
      "Do you offer PTO credit conversion or only rollover?",
      "Check with accounting on credits remaining",
    ],
  },
  {
    id: 11,
    category: "#2 VA Attendance",
    title: "VL/SL Application, Missing Shift (MIA), Idle Time",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Do you know how to apply VL/SL on Hubstaff?", "Were they trained on PTO filing?", "What is your leave policy?"],
      ["Did you inform and get approval from your client?", "Is the VA over 1 year tenure?", "Did the VA inform you ahead of time?"],
      ["Walk me through what happened during your shift?", "Did we check Hubstaff?", "Did the VA send a message prior?"],
      ["Why were you not able to inform your client or TL?", "Did we contact the VA via all communication lines?", "How's their communication otherwise — recurring issue?"],
      ["What are your daily/usual tasks?", "Do they have enough tasks? Did we validate idle time?", "What's the workload given to the VA?"],
    ],
  },
  {
    id: 12,
    category: "#2 VA Attendance",
    title: "PTO Excessive Use & Unexpected Absences",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Walk through your understanding of the PTO process", "Did we check with accounting on credits left?", "Are you aware how many leaves your VA has taken?"],
      ["Did you plan ahead for the upcoming event?", "Did we do wellness coaching?", "Was the client informed ahead of time?"],
      ["When did you find out about the event?", "Was this a death, medical, or legal emergency?", "Is there a pattern affecting performance?"],
      ["Is there a reason you're unable to skip out / leave early?", "How often are we seeing these events?", "Has the VA asked for VL with the same reason?"],
    ],
  },
  {
    id: 13,
    category: "#2 VA Attendance",
    title: "VA Not Motivated",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["What was your motivation before, when looking for work?", "Did we do a wellness/welfare check?", "Describe the decline in the VA's performance"],
      ["Describe your ideal work-day", "Look at tenure/longevity — need additional responsibilities?", "What would you like to see differently?"],
      ["Walk me through your average task set for the day", "How's their Hubstaff looking? Activity rate?", "How often are you meeting with the VA?"],
      ["Do you feel your pay is enough?", "Have you shared expectations with the VA recently?", "How often is your client communicating with you?"],
      ["What would motivate them to perform at your standard?", "", "Do you feel seen by your client?"],
    ],
  },
  {
    id: 14,
    category: "#3 VA Operations",
    title: "Zoom Camera Issues",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Can you share what's behind your hesitation?", "Was the VA made aware of the policy before client meetings?", "Thoughts on the VA not turning on their camera?"],
      ["Any barriers holding you back from Zoom participation?", "Did we have IT run an internet stress-test?", "Camera on required — keeps VAs from sub-letting job"],
      ["What does professional presence on Zoom look like for you?", "Does the VA have a proper workstation setup?", "Options to help: hide self view, touch up appearance, minimize/hide screen"],
    ],
  },
  {
    id: 15,
    category: "#3 VA Operations",
    title: "Deadlines, Power/Internet Reliability",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["How does your client usually set expectations for tasks?", "Did we check with both sides about turnaround times?", "How do you usually delegate tasks?"],
      ["How long do you feel it would take to complete this task?", "Has the client communicated expectations to the VA?", "How long should it take to do these tasks?"],
      ["How often do you run into internet issues?", "Are we observing a habitual trend?", "Does VA consistently adhere to task timelines?"],
      ["What's your typical internet speed during work hours?", "Can the VA upgrade their internet plan or switch ISP?", "Is this affecting business outcomes?"],
      ["Are you willing/able to commute to the office until resolved?", "Is there a long-term plan? (e.g. Samal)", "Are power outages known in their neighborhood?"],
    ],
  },
  {
    id: 16,
    category: "#3 VA Operations",
    title: "Money for Family Emergencies / Slow Computer on Zoom",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Tell me more about the financial struggles you're going through?", "Have we validated the claim / requested evidence?", "Is this the first time this has happened?"],
      ["Have you completed a family budget? Open to seeking help?", "Did we do a wellness check on financial/personal circumstances?", "What's your relationship with your VA like?"],
      ["Did you submit a ticket?", "Have we checked screenshots on Hubstaff? Was IT informed?", "Have we had this issue before? Is this affecting their work?"],
      ["When were you hired? Last time you cleaned your PC fan?", "Was an internet stress-test performed?", "What's their down time in Hubstaff? Any patterns?"],
    ],
  },
  {
    id: 17,
    category: "#4 Internal",
    title: "Missing Hours Coverage SOP",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Why do you have missing hours covered for the week?", "Is this one-off or a recurring pattern?", "How do you and the VA communicate?"],
      ["What do you do when hours for the day aren't complete?", "Did we coach the VA and issue reminders?", "Does the client know our process re: missing hours?"],
      ["Have you tried to resolve the cause of the missing hours?", "If it's internet/electricity, what can we do to help?", "Are we at the point we need a PIP?"],
      ["", "Was this a scheduled outage? Need an IR/NTE?", "Do you want us to dock their pay? Long-term plan?"],
    ],
  },
  {
    id: 18,
    category: "#4 Internal",
    title: "Payslip Breakdown & Pay Rate Adjustment (90th Day)",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Did you already reach out to accounting/payroll?", "Keep responses general, remind Payroll gives accurate response", "What brought this question up?"],
      ["Do you know who to reach out to and how?", "Is the Accounting Director aware of repeating complaints?", "Do you have reservations re: pay structure?"],
      ["Any questions on regularization?", "When is the VA's 90th working day on Hubspot?", "Are you satisfied with the VA's current performance?"],
      ["Has the VA started doing tasks independently?", "90th day refers to working days, doesn't include days off/holidays", "Can you see yourself working with us long-term?"],
    ],
    notes: "Government deductions are only taken out at end of month. Discrepancies go to Payroll, not HR. VAs are paid double the standard most BPOs pay; VAs start around $2-$3.",
  },
  {
    id: 19,
    category: "#4 Internal",
    title: "Incident Report (IR) Procedure",
    type: "guide",
    intro: "IR Process: AM, PM, TL, or Trainers can start an IR form. HR reviews the IR. An NTE can be issued, or it can be turned into a conversation.",
    points: [
      "Walk me through what transpired — be as detailed as possible",
      "Did we probe the VA and agency to find the core issue?",
      "Was the IR issued in a timely manner?",
      "Is this a one-off incident or recurring pattern?",
      "Did the incident result in damage to operations or business?",
    ],
    flow: [
      { step: "Incident Report filed and completed", color: "blue" },
      { step: "HR reviews the IR", color: "amber" },
      { step: "Did the VA violate the handbook?", color: "neutral", branches: [
        { label: "Yes", result: "HR issues an NTE", color: "red" },
        { label: "No", result: "Do we need to put them on PIP?", color: "neutral", branches: [
          { label: "No", result: "TL should talk to the VA about the incident and give coaching/guidance", color: "green" },
          { label: "Yes", result: "TL works with AM. Meet with client, set clear expectations and goals for the PIP. TL consistently coaches the VA till PIP is resolved.", color: "red" },
        ]},
      ]},
    ],
  },
  {
    id: 20,
    category: "#4 Internal",
    title: "NTE, PIP & Corrective Actions",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["What transpired? How can I help so this doesn't happen again?", "Who issued the NTE?", "Was the client informed? Do they need to be?"],
      ["How do you feel after getting the NTE?", "What did HR tell you re: the NTE?", "How has life been recently?"],
      ["What's it like working with your Agency?", "Does the client clearly communicate expectations?", "Is this recurring? When did it begin?"],
      ["Share your screen, walk me through your tasks", "Does the VA have daily tasks or one-offs?", "Would the agency benefit from an EOD report or Task Tracker?"],
      ["What actions can you take to mitigate this mistake?", "Are we explaining the intent behind corrective actions?", "Is the AM aware, and has the client been told?"],
    ],
  },
  {
    id: 21,
    category: "#5 Additional Training",
    title: "No Support When Hired/Promoted",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Walk me through your tasks", "When was this VA hired? New exams to retake?", "Did you receive a welcome packet?"],
      ["Do you have logins to LAVA University?", "When was the last LAVA U training?", "Do we have recurring meetings for this account?"],
      ["Walk me through your experience with LAVA trainers", "Do we check-in with this VA at regular intervals?", "Does the VA have areas to improve / need training on?"],
      ["For promotions: what are your new responsibilities?", "How long in the position before promotion? Raise included?", "What training have you provided on the new role?"],
    ],
  },
  {
    id: 22,
    category: "#5 Additional Training",
    title: "Too Many Tasks / Overwhelmed / New Untrained Task",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Give a detailed explanation of your tasks", "Are all tasks relevant to the agency?", "Expectations on output quality and turnaround time?"],
      ["Do you have SOPs? Walk me through SOP creation", "Let's check Hubstaff — how busy are they really?", "How clear was communication on prioritizing tasks?"],
      ["What are all the tasks you handle, how long each takes?", "Are these a reasonable amount of tasks for one person?", "Walk me through expectations of what a VA's day looks like"],
      ["What steps have you taken to understand a new task?", "Do we have training available for this specific task?", "Has the client started giving these tasks already?"],
      ["How do you feel about the additional task?", "Is it inside or outside LAVA's scope of support?", "Are you willing to let LAVA help with training/SOPs?"],
    ],
  },
  {
    id: 23,
    category: "#5 Additional Training",
    title: "Sandbox Request",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Did you already get training for this application/website?", "Do we have a sandbox for this? If not, offer training or get one.", "What's preventing us from providing logins to the VA?"],
    ],
  },
  {
    id: 24,
    category: "#6 Client Based Issues",
    title: "Client Not Communicating Enough",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["How long have you had this issue?", "Is this only with the VA or also AM/PM's experience?", "Does your VA have a direct report? How often do they talk?"],
      ["Have you made attempts to resolve this?", "Have we informed sales and gotten their assistance?", "What's your relationship with the client like?"],
      ["Could you share what conversations with your VA look like?", "How would I describe the VA/client relationship?", "How frequently do you reach out to the client? Proactive?"],
      ["How much screen time are you getting with your VA?", "Does the agency have an internal issue outside our control?", "Aside from your client, who else do you communicate with?"],
    ],
  },
  {
    id: 25,
    category: "#6 Client Based Issues",
    title: "Not Enough Time to Train VA",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Share your work struggles — tasks we could help train you on?", "Is the AM aware the client has barely trained the VA?", "What's been preventing us from moving forward with training?"],
      ["Walk me through the training process at your agency", "Have we pushed the client to get training started?", "Is there anyone who can help train the VA / shadow?"],
      ["What's the daily Zoom call schedule like? Worthwhile?", "Are we offering a plan of action or strategy?", "Would a strategy help the client understand what to do?"],
      ["", "Have we shared our training guide / welcome packet?", "What amount of time can you commit to training? 30/15 min?"],
    ],
  },
  {
    id: 26,
    category: "#6 Client Based Issues",
    title: "Annual Raise & Hubstaff Issues",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Did you already reach out to accounting?", "When is the VA's anniversary date?", "Did you receive the anniversary notice from accounting?"],
      ["What's your understanding of the annual review/raise process?", "Has accounting already reached out to the client?", "Has your client been fielding questions about the raise?"],
      ["Walk me through the issues you're having with Hubstaff", "How well did the AM explain Hubstaff to the client?", "What's the client's understanding of Hubstaff reports/metrics?"],
      ["Have you reached out to IT for help?", "Is there a configuration we need to edit?", "Would another agency member benefit from Hubstaff access?"],
    ],
    notes: "Accounting reaches out re: annual increase, gives a week from anniversary date to respond. If no response, accounting applies the minimum pay increase.",
  },
  {
    id: 27,
    category: "#6 Client Based Issues",
    title: "No Opportunity to Get Promoted",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Walk me through your dreams and goals in life", "How long has the VA worked for LAVA?", "Are we happy with the VA's current performance?"],
      ["How do you feel about your current work and position?", "Does this VA need more pay or career growth?", "What's the VA's leverage point — pay, balance, PTO, relationship?"],
      ["Would learning a new skill help you feel fulfilled?", "Is the VA looking for work elsewhere or moonlighting?", "What makes you happy as a client? Can we discover that for the VA?"],
      ["What does \"promotion\" mean to you, and why do you want it?", "Is the VA overwhelmed? Opportunity to cross-sell?", "What's their Hubstaff look like?"],
    ],
  },
  {
    id: 28,
    category: "#6 Client Based Issues",
    title: "Not Enough Tasks for VA / Working Past Shift",
    type: "qa",
    cols: ["Questions to ask the VA", "Questions to ask yourself", "Questions to ask the Client"],
    rows: [
      ["Walk me through your usual tasks", "Is the VA experienced/efficient at completing tasks?", "How quickly does the VA complete tasks?"],
      ["Show me how you proactively reach out for more tasks", "Does their Hubstaff reflect their narrative?", "How satisfied are you with output quality/accuracy?"],
      ["How frequently are you asked to do overtime?", "Is the VA compensated for overtime?", "Do you think the VA completes tasks in reasonable time?"],
      ["How do you feel about working overtime?", "Did we validate the VA's story against Hubstaff records?", "Are these one-off projects or do we need another VA?"],
    ],
  },
];

//  Helpers 
const PRIORITY_COLOR = { High: C.red, Medium: "#F59E0B", Low: C.teal, Recurring: C.purple };
function sc(s) {
  if (s === null || s === undefined) return C.muted;
  if (s >= 90) return C.green;
  if (s >= 75) return C.amber;
  return C.red;
}
function AMBadge({ am }) {
  const color = AM_COLOR[am] || C.muted;
  return (
    <span
      style={{
        background: color + "22",
        color,
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 99,
        border: `1px solid ${color}44`,
        whiteSpace: "nowrap",
      }}
    >
      {am}
    </span>
  );
}
function InlineEdit({ value, onSave, style = {}, multiline = false }) {
  const C = useTheme();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const ref = useRef();
  function save() { onSave(val); setEditing(false); }
  if (!editing)
    return (
      <span onClick={() => { setVal(value); setEditing(true); }}
        style={{ cursor: "text", ...style, borderBottom: "1px dashed " + C.border, minWidth: 24, display: "inline-block" }}
        title="Click to edit">
        {value || <span style={{ color: C.muted }}>—</span>}
      </span>
    );
  if (multiline)
    return (
      <textarea
        ref={ref}
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        rows={3}
        style={{
          width: "100%",
          padding: 4,
          fontSize: "inherit",
          fontFamily: "inherit",
          border: `1px solid ${C.red}`,
          borderRadius: 4,
          resize: "vertical",
        }}
      />
    );
  return (
    <input
      ref={ref}
      autoFocus
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") save();
        if (e.key === "Escape") setEditing(false);
      }}
      style={{
        width: "100%",
        padding: 4,
        fontSize: "inherit",
        fontFamily: "inherit",
        border: `1px solid ${C.red}`,
        borderRadius: 4,
      }}
    />
  );
}

// Editable text for headings/titles — pencil icon on hover, no underline
function EditableText({ value, onSave, style = {}, inputStyle = {} }) {
  const C = useTheme();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  function save() { if (val.trim()) { onSave(val.trim()); } else { setVal(value); } setEditing(false); }
  if (editing) return (
    <input autoFocus value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={save}
      onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setVal(value); setEditing(false); } }}
      style={{ background: "transparent", border: "none", borderBottom: "2px solid rgba(255,255,255,0.6)", outline: "none", color: "inherit", fontWeight: "inherit", fontSize: "inherit", fontFamily: "inherit", padding: "0 2px", ...inputStyle }}
    />
  );
  return (
    <span onClick={() => { setVal(value); setEditing(true); }}
      style={{ cursor: "text", display: "inline-flex", alignItems: "center", gap: 6, ...style }}
      title="Click to edit">
      {value}
      <span style={{ fontSize: 11, opacity: 0, transition: "opacity 0.15s" }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.6"}
        onMouseLeave={e => e.currentTarget.style.opacity = "0"}></span>
    </span>
  );
}

//  TASKS TAB 
function TasksTab() {
  const C = useTheme();
  const { rows: tasks, upsert: upsertTask, remove: removeTask } = useSupabaseTable("tasks", "id", INIT_TASKS);
  const [filter, setFilter] = useState("Active");
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState({
    task: "", due: "", assignee: "Gell", priority: "Medium", notes: "",
  });
  const visible = useMemo(
    () =>
      filter === "Active"
        ? tasks.filter((t) => t.status !== "Done")
        : filter === "Done"
          ? tasks.filter((t) => t.status === "Done")
          : tasks,
    [tasks, filter],
  );
  function update(id, field, value) {
    const task = tasks.find(t => t.id === id);
    if (task) upsertTask({ ...task, [field]: value });
  }
  function toggleDone(id) {
    const task = tasks.find(t => t.id === id);
    if (task) upsertTask({ ...task, status: task.status === "Done" ? "In Progress" : "Done" });
  }
  function del(id) { removeTask(id); }
  function add() {
    if (!newTask.task.trim()) return;
    upsertTask({ id: Date.now(), status: "In Progress", ...newTask });
    setNewTask({ task: "", due: "", assignee: "Gell", priority: "Medium", notes: "" });
    setAdding(false);
  }
  const ct = {
    open: tasks.filter((t) => t.status !== "Done").length,
    high: tasks.filter((t) => t.status !== "Done" && t.priority === "High").length,
    ip: tasks.filter((t) => t.status === "In Progress").length,
    pend: tasks.filter((t) => t.status === "Pending").length,
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { l: "Open", c: C.dark, v: ct.open },
          { l: "High Priority", c: C.red, v: ct.high },
          { l: "In Progress", c: C.blue, v: ct.ip },
          { l: "Pending", c: "#92400E", v: ct.pend },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              flex: 1,
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "12px 16px",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {["Active", "Done", "All"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "5px 14px",
                borderRadius: 99,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                background: filter === f ? C.dark : C.gray,
                color: filter === f ? C.white : C.black,
                fontWeight: filter === f ? 600 : 400,
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          style={{
            padding: "6px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: C.red,
            color: C.white,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          + Add Task
        </button>
      </div>
      {adding && (
        <div
          style={{
            background: C.gray,
            borderRadius: 10,
            padding: 14,
            marginBottom: 14,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <input
            placeholder="Task *"
            value={newTask.task}
            onChange={(e) => setNewTask((p) => ({ ...p, task: e.target.value }))}
            style={{
              flex: "2 1 200px",
              padding: "7px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              fontSize: 13,
            }}
          />
          <input
            type="date"
            value={newTask.due}
            onChange={(e) => setNewTask((p) => ({ ...p, due: e.target.value }))}
            style={{
              flex: "0 1 140px",
              padding: "7px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              fontSize: 13,
            }}
          />
          <input
            placeholder="Assignee"
            value={newTask.assignee}
            onChange={(e) => setNewTask((p) => ({ ...p, assignee: e.target.value }))}
            style={{
              flex: "0 1 110px",
              padding: "7px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              fontSize: 13,
            }}
          />
          <select
            value={newTask.priority}
            onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value }))}
            style={{
              flex: "0 1 100px",
              padding: "7px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              fontSize: 13,
            }}
          >
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
          <input
            placeholder="Notes"
            value={newTask.notes}
            onChange={(e) => setNewTask((p) => ({ ...p, notes: e.target.value }))}
            style={{
              flex: "2 1 160px",
              padding: "7px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              fontSize: 13,
            }}
          />
          <button
            onClick={add}
            style={{
              padding: "7px 16px",
              borderRadius: 6,
              border: "none",
              background: C.dark,
              color: C.white,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Save
          </button>
          <button
            onClick={() => setAdding(false)}
            style={{
              padding: "7px 12px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.white,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
        </div>
      )}
      <div
        style={{
          background: C.white,
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          overflow: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 780 }}>
          <thead>
            <tr style={{ background: C.dark, color: C.white }}>
              {["", "Task", "Due", "Assignee", "Priority", "Status", "Notes", ""].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "9px 12px",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: 11,
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((t, i) => (
              <tr
                key={t.id}
                style={{
                  background: i % 2 === 0 ? C.white : "#FAFAFA",
                  borderBottom: `1px solid ${C.border}`,
                  opacity: t.status === "Done" ? 0.6 : 1,
                }}
              >
                <td style={{ padding: "9px 12px", width: 28 }}>
                  <input
                    type="checkbox"
                    checked={t.status === "Done"}
                    onChange={() => toggleDone(t.id)}
                    style={{ cursor: "pointer", accentColor: C.red }}
                  />
                </td>
                <td style={{ padding: "9px 12px", fontWeight: 500, textDecoration: t.status === "Done" ? "line-through" : "none", minWidth: 160 }}>
                  <InlineEdit value={t.task} onSave={v => update(t.id, "task", v)} style={{ fontWeight: 500 }} />
                </td>
                <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                  {(()=>{
                    const TaskDatePicker = () => {
                      const MNAMES=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                      const DNAMES=["Su","Mo","Tu","We","Th","Fr","Sa"];
                      const [open, setOpen] = useState(false);
                      const parsed = t.due && t.due.match(/\d{4}-\d{2}-\d{2}/) ? new Date(t.due+"T00:00:00") : null;
                      const now = parsed || new Date();
                      const [cy, setCy] = useState(now.getFullYear());
                      const [cm, setCm] = useState(now.getMonth());
                      const fd = new Date(cy,cm,1).getDay();
                      const dim = new Date(cy,cm+1,0).getDate();
                      const cells=[]; for(let i=0;i<fd;i++) cells.push(null); for(let d=1;d<=dim;d++) cells.push(d);
                      const today = new Date();
                      const displayLabel = parsed
                        ? parsed.toLocaleDateString("en-US",{month:"short",day:"numeric"})
                        : t.due || "—";
                      return (
                        <div style={{position:"relative",display:"inline-block"}}>
                          <button onClick={()=>setOpen(v=>!v)}
                            style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:t.due?C.dark:C.muted,padding:0,textDecoration:"underline dotted"}}>
                            {displayLabel}
                          </button>
                          {open&&(
                            <div style={{position:"absolute",top:"100%",left:0,zIndex:50,marginTop:4,background:C.white,borderRadius:10,border:`1px solid ${C.border}`,padding:10,minWidth:220,boxShadow:"0 4px 20px rgba(0,0,0,0.12)"}}>
                              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                                <button onClick={()=>{if(cm===0){setCm(11);setCy(y=>y-1);}else setCm(m=>m-1);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:C.dark,padding:"2px 6px"}}>‹</button>
                                <span style={{fontWeight:700,fontSize:12,color:C.dark}}>{MNAMES[cm]} {cy}</span>
                                <button onClick={()=>{if(cm===11){setCm(0);setCy(y=>y+1);}else setCm(m=>m+1);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:14,color:C.dark,padding:"2px 6px"}}>›</button>
                              </div>
                              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:2}}>
                                {DNAMES.map(d=><div key={d} style={{textAlign:"center",fontSize:9,fontWeight:700,color:C.muted}}>{d}</div>)}
                              </div>
                              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
                                {cells.map((day,i)=>{
                                  if(!day) return <div key={i}/>;
                                  const iso=`${cy}-${String(cm+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                                  const isSel=t.due===iso;
                                  const isToday=today.getDate()===day&&today.getMonth()===cm&&today.getFullYear()===cy;
                                  return (
                                    <div key={i} onClick={()=>{update(t.id,"due",iso);setOpen(false);}}
                                      style={{textAlign:"center",padding:"5px 2px",borderRadius:4,fontSize:11,cursor:"pointer",
                                        background:isSel?C.red:"transparent",
                                        color:isSel?C.white:C.dark,
                                        fontWeight:isSel||isToday?700:400,
                                        border:isToday?`1px solid ${C.red}`:"1px solid transparent"}}>
                                      {day}
                                    </div>
                                  );
                                })}
                              </div>
                              <div style={{marginTop:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                <button onClick={()=>{update(t.id,"due","");setOpen(false);}}
                                  style={{fontSize:10,color:C.muted,background:"none",border:"none",cursor:"pointer"}}>Clear</button>
                                <button onClick={()=>setOpen(false)}
                                  style={{fontSize:10,color:C.muted,background:"none",border:"none",cursor:"pointer"}}>Close</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    };
                    return <TaskDatePicker/>;
                  })()}
                </td>
                <td style={{ padding: "9px 12px", whiteSpace: "nowrap" }}>
                  <select
                    value={t.assignee}
                    onChange={e => update(t.id, "assignee", e.target.value)}
                    style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 13, color: C.dark, fontWeight: 500 }}
                  >
                    <option>Gell</option>
                    <option>Niccole</option>
                    <option>Niccole/Gell</option>
                    <option>Alicia</option>
                    <option>Karla</option>
                  </select>
                </td>
                <td style={{ padding: "9px 12px" }}>
                  <select
                    value={t.priority}
                    onChange={(e) => update(t.id, "priority", e.target.value)}
                    style={{
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "3px 8px",
                      background: t.priority === "High" ? "#FEE2E2" : t.priority === "Medium" ? "#FEF9C3" : t.priority === "Low" ? "#DCFCE7" : C.gray,
                      color: t.priority === "High" ? "#DC2626" : t.priority === "Medium" ? "#CA8A04" : t.priority === "Low" ? "#16A34A" : C.muted,
                    }}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                    <option>Recurring</option>
                  </select>
                </td>
                <td style={{ padding: "9px 12px" }}>
                  <select
                    value={t.status}
                    onChange={(e) => update(t.id, "status", e.target.value)}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    <option>In Progress</option>
                    <option>Pending</option>
                    <option>Done</option>
                    <option>Recurring</option>
                  </select>
                </td>
                <td style={{ padding: "9px 12px", minWidth: 140 }}>
                  <InlineEdit value={t.notes || ""} onSave={v => update(t.id, "notes", v)} style={{ color: C.muted, fontSize: 13 }} multiline />
                </td>
                <td style={{ padding: "9px 12px" }}>
                  <button
                    onClick={() => del(t.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: C.muted,
                      fontSize: 16,
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
         Click any cell to edit inline.
      </p>
    </div>
  );
}

//  MINI CALENDAR 
function MiniCalendar({ weeks, checkins, activeWeek, onSelect, C, typeFilter, setTypeFilter, rangeStart, rangeEnd, setRangeStart, setRangeEnd }) {
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES   = ["Mo","Tu","We","Th","Fr","Sa","Su"];
  const [open, setOpen]       = useState(false);
  const [hovDay,  setHovDay]  = useState(null);
  const [dragging,setDragging]= useState(false);

  // Calendar month state — start at the month of the latest week
  const latestWeek  = weeks.length ? weeks[weeks.length-1] : null;
  const initDate    = latestWeek ? (()=>{ const [mm,dd,yy]=latestWeek.split("/"); return new Date(+yy,+mm-1,+dd); })() : new Date();
  const [cy, setCy] = useState(initDate.getFullYear());
  const [cm, setCm] = useState(initDate.getMonth());

  // Map week labels to their Monday Date
  const weekDates = useMemo(() => weeks.map(w => {
    const [mm,dd,yy] = w.split("/");
    return { mon: new Date(+yy,+mm-1,+dd), label: w };
  }), [weeks]);

  // Set of "YYYY-MM-DD" strings that are week-start Mondays with data
  const weekMondays = useMemo(() => {
    const s = new Set();
    weekDates.forEach(({ mon }) => s.add(toISO(mon)));
    return s;
  }, [weekDates]);

  function toISO(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  function fromISO(iso) {
    const [y,m,d] = iso.split("-").map(Number);
    return new Date(y, m-1, d);
  }
  function dayISO(day) {
    return `${cy}-${String(cm+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }

  // Find which week label contains a given date
  function weekForDate(d) {
    let best = null, bestDiff = Infinity;
    weekDates.forEach(({ mon, label }) => {
      const sun = new Date(mon); sun.setDate(mon.getDate()+6);
      if (d >= mon && d <= sun) { best = label; bestDiff = 0; return; }
      const diff = Math.min(Math.abs(d-mon), Math.abs(d-sun));
      if (diff < bestDiff) { bestDiff = diff; best = label; }
    });
    return best;
  }

  // Calendar grid (Mon-first)
  const grid = useMemo(() => {
    const firstDay = new Date(cy, cm, 1).getDay(); // 0=Sun
    const offset   = (firstDay + 6) % 7;            // shift so Mon=0
    const dim      = new Date(cy, cm+1, 0).getDate();
    const cells    = [];
    for (let i=0; i<offset; i++) cells.push(null);
    for (let d=1; d<=dim; d++) cells.push(d);
    return cells;
  }, [cy, cm]);

  // Effective range (lo ≤ hi)
  const lo = rangeStart && rangeEnd ? (rangeStart<=rangeEnd ? rangeStart : rangeEnd) : rangeStart;
  const hi = rangeStart && rangeEnd ? (rangeStart<=rangeEnd ? rangeEnd   : rangeStart) : rangeStart;

  function inRange(day) {
    if (!lo) return false;
    const d = fromISO(dayISO(day));
    return d >= lo && d <= (hi||lo);
  }
  function inHover(day) {
    if (!dragging || !rangeStart || !hovDay) return false;
    const d = fromISO(dayISO(day));
    const hlo = hovDay<=rangeStart ? hovDay : rangeStart;
    const hhi = hovDay<=rangeStart ? rangeStart : hovDay;
    return d >= hlo && d <= hhi;
  }
  function hasDot(day) { return weekMondays.has(dayISO(day)); }

  function handleDown(day) {
    const d = fromISO(dayISO(day));
    setRangeStart(d); setRangeEnd(null); setDragging(true); setHovDay(d);
    const w = weekForDate(d); if (w) onSelect(w);
  }
  function handleEnter(day) {
    if (!dragging) return;
    const d = fromISO(dayISO(day));
    setHovDay(d); setRangeEnd(d);
  }
  function handleUp(day) {
    const d = fromISO(dayISO(day));
    setRangeEnd(d); setDragging(false); setHovDay(null);
    setOpen(false);
  }
  function applyPreset(lo, hi) {
    setRangeStart(lo); setRangeEnd(hi);
    const w = weekForDate(lo); if (w) onSelect(w);
    setOpen(false);
  }
  function clearSel() { setRangeStart(null); setRangeEnd(null); }

  function prevMonth() { if(cm===0){setCm(11);setCy(y=>y-1);}else setCm(m=>m-1); }
  function nextMonth() { if(cm===11){setCm(0);setCy(y=>y+1);}else setCm(m=>m+1); }

  // Filtered checkins for stats display
  const filteredCheckins = useMemo(() => {
    let base;
    if (lo) {
      base = checkins.filter(c => {
        if (!c.week) return false;
        const [mm,dd,yy] = c.week.split("/");
        const mon = new Date(+yy,+mm-1,+dd);
        const sun = new Date(mon); sun.setDate(mon.getDate()+6);
        const hiEnd = hi ? new Date(hi.getFullYear(),hi.getMonth(),hi.getDate(),23,59,59) : new Date(lo.getFullYear(),lo.getMonth(),lo.getDate(),23,59,59);
        return mon <= hiEnd && sun >= lo;
      });
    } else {
      base = checkins.filter(c => c.week === activeWeek);
    }
    if (typeFilter === "all") return base;
    return base.filter(c => c.type === typeFilter);
  }, [checkins, lo, hi, activeWeek, typeFilter]);

  const today = new Date();

  // Label for trigger button
  function fmtDate(d) {
    return d ? d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "";
  }
  const triggerLabel = lo
    ? (hi && hi.toDateString()!==lo.toDateString() ? `${fmtDate(lo)} – ${fmtDate(hi)}` : fmtDate(lo))
    : (activeWeek || "Select dates");

  // Preset helpers
  function daysAgo(n) { const d=new Date(); d.setDate(d.getDate()-n); d.setHours(0,0,0,0); return d; }
  function startOfWeek(d) { const r=new Date(d); r.setDate(d.getDate()-((d.getDay()+6)%7)); r.setHours(0,0,0,0); return r; }
  function endOfDay(d) { const r=new Date(d); r.setHours(23,59,59,999); return r; }
  const presets = [
    { label:"Today",       lo: daysAgo(0), hi: endOfDay(new Date()) },
    { label:"Yesterday",   lo: daysAgo(1), hi: endOfDay(daysAgo(1)) },
    { label:"Last 7 days", lo: daysAgo(7), hi: endOfDay(new Date()) },
    { label:"Last week",   lo: startOfWeek(daysAgo(7)), hi: endOfDay(new Date(startOfWeek(daysAgo(7)).getTime()+6*86400000)) },
    { label:"This month",  lo: new Date(today.getFullYear(),today.getMonth(),1), hi: endOfDay(new Date()) },
    { label:"Last month",  lo: new Date(today.getFullYear(),today.getMonth()-1,1), hi: endOfDay(new Date(today.getFullYear(),today.getMonth(),0)) },
  ];

  return (
    <div style={{marginBottom:14}} onMouseLeave={()=>{if(dragging){setDragging(false);setHovDay(null);}}}>
      {/* Controls row */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:open?10:0}}>
        {/* Trigger button */}
        <button onClick={()=>setOpen(v=>!v)}
          style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,
            border:`2px solid ${open?C.teal:C.border}`,background:C.white,cursor:"pointer",
            fontSize:13,fontWeight:500,color:C.dark,boxShadow:open?"0 0 0 3px "+C.teal+"22":"none"}}>
           {triggerLabel}
          <span style={{fontSize:10,color:C.muted}}>{open?"":""}</span>
        </button>
        {lo&&<button onClick={clearSel} style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:12,color:C.muted}}> Clear</button>}
        {/* Prev/Next week */}
        <div style={{display:"flex",gap:4}}>
          <button onClick={()=>{const i=weeks.indexOf(activeWeek);if(i>0)onSelect(weeks[i-1]);}} disabled={weeks.indexOf(activeWeek)===0}
            style={{padding:"6px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:13,opacity:weeks.indexOf(activeWeek)===0?0.3:1}}>‹</button>
          <button onClick={()=>{const i=weeks.indexOf(activeWeek);if(i<weeks.length-1)onSelect(weeks[i+1]);}} disabled={weeks.indexOf(activeWeek)===weeks.length-1}
            style={{padding:"6px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:13,opacity:weeks.indexOf(activeWeek)===weeks.length-1?0.3:1}}>›</button>
          <button onClick={()=>onSelect(weeks[weeks.length-1])}
            style={{padding:"6px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:12,color:C.muted}}>Latest</button>
        </div>
        {/* Type filter */}
        <div style={{display:"flex",gap:4}}>
          {[["all","All"],["weekly"," Weekly"],["monthly"," Monthly"]].map(([v,l])=>(
            <button key={v} onClick={()=>setTypeFilter(v)}
              style={{padding:"5px 10px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,
                background:typeFilter===v?C.dark:C.gray,color:typeFilter===v?C.white:C.dark,fontWeight:typeFilter===v?700:400}}>{l}</button>
          ))}
        </div>
        {/* Quick stats */}
        <div style={{display:"flex",gap:6,marginLeft:"auto"}}>
          {[{l:"Showed",v:filteredCheckins.filter(c=>c.status==="showed").length,c:C.green},
            {l:"No Show",v:filteredCheckins.filter(c=>c.status==="noshow").length,c:C.red},
            {l:"Skipped",v:filteredCheckins.filter(c=>c.status==="skipped").length,c:C.muted}].map(s=>(
            <div key={s.l} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 10px",display:"flex",gap:5,alignItems:"center"}}>
              <span style={{fontSize:14,fontWeight:700,color:s.c}}>{s.v}</span>
              <span style={{fontSize:10,color:C.muted}}>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dropdown panel */}
      {open&&(
        <div style={{display:"flex",background:C.white,borderRadius:12,border:`1px solid ${C.border}`,boxShadow:"0 6px 30px rgba(0,0,0,0.13)",overflow:"hidden",zIndex:50,position:"relative",maxWidth:560}}>
          {/* Presets */}
          <div style={{borderRight:`1px solid ${C.border}`,padding:"12px 8px",display:"flex",flexDirection:"column",gap:2,minWidth:130}}>
            {presets.map(p=>(
              <button key={p.label} onClick={()=>applyPreset(p.lo,p.hi)}
                style={{padding:"7px 12px",borderRadius:6,border:"none",cursor:"pointer",textAlign:"left",fontSize:13,
                  background:"transparent",color:C.dark,fontWeight:400,
                  transition:"background 0.1s"}}
                onMouseEnter={e=>e.currentTarget.style.background=C.gray}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div style={{padding:16,flex:1}}>
            {/* Month nav */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <button onClick={prevMonth} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:C.dark,padding:"2px 8px"}}>‹</button>
              <span style={{fontWeight:700,fontSize:14,color:C.dark}}>{MONTH_NAMES[cm]} {cy}</span>
              <button onClick={nextMonth} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:C.dark,padding:"2px 8px"}}>›</button>
            </div>
            {/* Day headers */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
              {DAY_NAMES.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:C.muted,padding:"2px 0"}}>{d}</div>)}
            </div>
            {/* Day cells */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,userSelect:"none"}}>
              {grid.map((day,i)=>{
                if (!day) return <div key={i}/>;
                const sel    = inRange(day);
                const hov    = !sel && inHover(day);
                const dot    = hasDot(day);
                const isToday= today.getDate()===day&&today.getMonth()===cm&&today.getFullYear()===cy;
                const highlight = sel || hov;
                return (
                  <div key={i}
                    onMouseDown={()=>handleDown(day)}
                    onMouseEnter={()=>handleEnter(day)}
                    onMouseUp={()=>handleUp(day)}
                    style={{textAlign:"center",padding:"7px 2px",borderRadius:6,fontSize:12,cursor:"pointer",position:"relative",
                      background: sel ? C.teal : hov ? C.gray : "transparent",
                      color: sel ? C.white : C.dark,
                      fontWeight: sel||isToday ? 700 : 400,
                      border: isToday ? `2px solid ${C.teal}` : "2px solid transparent",
                    }}>
                    {day}
                    {dot&&!sel&&<div style={{position:"absolute",bottom:2,left:"50%",transform:"translateX(-50%)",width:4,height:4,borderRadius:"50%",background:C.teal}}/>}
                  </div>
                );
              })}
            </div>
            {/* Footer */}
            <div style={{marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:`1px solid ${C.border}`,paddingTop:10}}>
              <span style={{fontSize:11,color:C.muted}}>
                {lo ? (hi&&hi.toDateString()!==lo.toDateString() ? `${fmtDate(lo)} – ${fmtDate(hi)}` : fmtDate(lo)) : "Click or drag to select"}
              </span>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>{clearSel();setOpen(false);}} style={{padding:"5px 12px",borderRadius:6,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:12,color:C.muted}}>Cancel</button>
                <button onClick={()=>setOpen(false)} style={{padding:"5px 14px",borderRadius:6,border:"none",background:C.teal,color:C.white,cursor:"pointer",fontSize:12,fontWeight:700}}>Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






//  KPI TAB 
function KPITab() {
  const C = useTheme();
  const EMPTY_CI = { week:"", date:"", client:"", vas:[{name:"",score:""}], type:"weekly", mode:"zoom", status:"showed", am:"", tl:"", notes:"" };
  const STATUS_CFG = {
    showed: { bg:"#FFFFFF", dot:"#059669", label:" Showed" },
    skipped:{ bg:"#F0FDF4", dot:"#16A34A", label:"⏭ Skipped (not counted)" },
    noshow: { bg:"#FFF1F1", dot:C.red,     label:" No Show" },
  };
  const TYPE_CFG   = { weekly:" Weekly", monthly:" Monthly" };
  const MODE_CFG   = { zoom:" Zoom", call:" Call", email:" Email" };
  const AM_COLORS  = { Niccole:C.red, Karla:C.blue, Alicia:C.teal };
  const AMs        = ["Niccole","Karla","Alicia"];

  const { rows: checkins, upsert: upsertCI, remove: removeCI } = useSupabaseTable("checkins", "id", INIT_CHECKINS);
  const setCheckins = null; // replaced by upsertCI/removeCI
  const [viewMode, setViewMode] = useState("report");
  const [selWeek,  setSelWeek]  = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search,   setSearch]   = useState("");
  // Calendar range selection (lifted from MiniCalendar)
  const [calRangeStart, setCalRangeStart] = useState(null);
  const [calRangeEnd,   setCalRangeEnd]   = useState(null);
  const [amFilter, setAmFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  // Add modal state
  const [adding,   setAdding]   = useState(false);
  const [newCI,    setNewCI]    = useState(EMPTY_CI);
  // Expand state for inline editing in report view
  const [expandId, setExpandId] = useState(null);
  // Client Concerns state
  const { rows: concerns, upsert: upsertConcern, remove: removeConcern } = useSupabaseTable("concerns", "id", INIT_CONCERNS);
  const setConcerns = null; // replaced by upsertConcern/removeConcern
  const [concernSearch, setConcernSearch] = useState("");
  const [addingConcern, setAddingConcern] = useState(false);
  const [newConcern, setNewConcern] = useState({ date:"", agency:"", va:"", concern:"" });
  // Concern calendar state
  const [concernCalYear,  setConcernCalYear]  = useState(2026);
  const [concernCalMonth, setConcernCalMonth] = useState(0);
  const [concernRangeStart, setConcernRangeStart] = useState(null);
  const [concernRangeEnd,   setConcernRangeEnd]   = useState(null);
  const [concernDragging,   setConcernDragging]   = useState(false);
  const [concernCalOpen,    setConcernCalOpen]     = useState(false);
  const [addConcernCalOpen, setAddConcernCalOpen]  = useState(false);

  const weeks = useMemo(() => [...new Set(checkins.map(c=>c.week))].sort(), [checkins]);
  const activeWeek = selWeek || weeks[weeks.length-1] || "";

  // weekDates map for range matching
  const weekDateMap = useMemo(() => weeks.map(w => {
    const [mm,dd,yy] = w.split("/");
    return { date: new Date(+yy, +mm-1, +dd), label: w };
  }), [weeks]);

  // Filter by exact date if available, otherwise fall back to week range
  const weekCheckins = useMemo(() => {
    let base;
    if (calRangeStart) {
      const lo = calRangeEnd && calRangeEnd < calRangeStart ? calRangeEnd : calRangeStart;
      const hi = calRangeEnd && calRangeEnd > calRangeStart ? calRangeEnd : calRangeStart;
      const loMid = new Date(lo.getFullYear(), lo.getMonth(), lo.getDate(), 0, 0, 0);
      const hiEnd = new Date(hi.getFullYear(), hi.getMonth(), hi.getDate(), 23, 59, 59);
      base = checkins.filter(c => {
        // If check-in has a specific date, use it for exact matching
        if (c.date && c.date.match(/\d{4}-\d{2}-\d{2}/)) {
          const [y,m,d] = c.date.split("-").map(Number);
          const cd = new Date(y, m-1, d);
          return cd >= loMid && cd <= hiEnd;
        }
        // Older data: fall back to week-based matching
        if (!c.week) return false;
        const [mm,dd,yy] = c.week.split("/");
        const mon = new Date(+yy, +mm-1, +dd);
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
        return mon <= hiEnd && sun >= loMid;
      });
    } else {
      base = checkins.filter(c => c.week === activeWeek);
    }
    if (typeFilter === "all") return base;
    return base.filter(c => c.type === typeFilter);
  }, [checkins, activeWeek, calRangeStart, calRangeEnd, weekDateMap, typeFilter]);
  // Per-AM stats broken out by type — computed from tagged check-ins (skipped not counted)
  const amStats = useMemo(() => {
    function rateFor(rows) {
      const showed    = rows.filter(c => c.status === "showed");
      const withScore  = showed.flatMap(c => c.vas.filter(v => v.score !== null && v.score !== ""));
      const passing    = withScore.filter(v => +v.score >= 80);
      return {
        total:    rows.length,
        showed:   showed.length,
        noShow:   rows.filter(c => c.status === "noshow").length,
        showRate: rows.length      ? Math.round(showed.length  / rows.length      * 100) : null,
        scRate:   withScore.length ? Math.round(passing.length / withScore.length * 100) : null,
        avgScore: withScore.length ? Math.round(withScore.reduce((a,b) => a+(+b.score), 0) / withScore.length * 10) / 10 : null,
        scored:   withScore.length,
        passing:  passing.length,
      };
    }
    return AMs.map(am => {
      const all     = weekCheckins.filter(c => c.am === am && c.status !== "skipped");
      return { am, all: rateFor(all), weekly: rateFor(all.filter(c=>c.type==="weekly")), monthly: rateFor(all.filter(c=>c.type==="monthly")) };
    });
  }, [weekCheckins]);

  // Overall = aggregate of all tagged check-ins (computed, not from sheet)
  const overallStats = useMemo(() => {
    function rateFor(rows) {
      const showed    = rows.filter(c => c.status === "showed");
      const withScore = showed.flatMap(c => c.vas.filter(v => v.score !== null && v.score !== ""));
      const passing   = withScore.filter(v => +v.score >= 80);
      return {
        total:    rows.length,
        showed:   showed.length,
        noShow:   rows.filter(c => c.status === "noshow").length,
        showRate: rows.length      ? Math.round(showed.length  / rows.length      * 100) : null,
        scRate:   withScore.length ? Math.round(passing.length / withScore.length * 100) : null,
        avgScore: withScore.length ? Math.round(withScore.reduce((a,b) => a+(+b.score), 0) / withScore.length * 10) / 10 : null,
      };
    }
    const tagged = weekCheckins.filter(c => c.am !== "" && c.status !== "skipped");
    return { all: rateFor(tagged), weekly: rateFor(tagged.filter(c=>c.type==="weekly")), monthly: rateFor(tagged.filter(c=>c.type==="monthly")) };
  }, [weekCheckins]);

  const weekTotals = useMemo(() => {
    const counted = weekCheckins.filter(c=>c.status!=="skipped");
    const showed  = counted.filter(c=>c.status==="showed");
    const withScore = showed.flatMap(c=>c.vas.filter(v=>v.score!==null&&v.score!==""));
    return {
      total: counted.length,
      showed: showed.length,
      noShow: counted.filter(c=>c.status==="noshow").length,
      skipped: weekCheckins.filter(c=>c.status==="skipped").length,
      untagged: weekCheckins.filter(c=>c.status!=="skipped"&&c.am==="").length,
      avgScore: withScore.length ? Math.round(withScore.reduce((a,b)=>a+(+b.score),0)/withScore.length*10)/10 : null,
    };
  }, [weekCheckins]);

  const visible = useMemo(() =>
    checkins.filter(c=>{
      const q = search.toLowerCase();
      const ms = !search || c.client.toLowerCase().includes(q) || c.week.includes(q) || c.am.toLowerCase().includes(q) || c.vas.some(v=>v.name.toLowerCase().includes(q));
      return ms && (amFilter==="All"||c.am===amFilter) && (statusFilter==="All"||c.status===statusFilter);
    }), [checkins,search,amFilter,statusFilter]);

  function upCI(id, field, value) {
    const ci = checkins.find(c => c.id === id);
    if (ci) upsertCI({ ...ci, [field]: value });
  }
  function delCI(id) { removeCI(id); }
  function addVA(){ setNewCI(p=>({...p,vas:[...p.vas,{name:"",score:""}]})); }
  function removeVA(i){ setNewCI(p=>({...p,vas:p.vas.filter((_,j)=>j!==i)})); }
  function setVA(i,field,val){ setNewCI(p=>({...p,vas:p.vas.map((v,j)=>j===i?{...v,[field]:val}:v)})); }
  function saveNew(){
    if(!newCI.client.trim()&&!newCI.week) return;
    const vasClean = newCI.vas.filter(v=>v.name.trim()).map(v=>({name:v.name.trim(),score:v.score===""?null:parseFloat(v.score)||null}));
    upsertCI({...newCI,id:Date.now(),vas:vasClean});
    setNewCI(EMPTY_CI); setAdding(false);
  }

  // Inline VA editor for a check-in
  function VaEditor({ ci }) {
    const [localVas, setLocalVas] = useState(ci.vas.length ? ci.vas.map(v=>({...v,score:v.score??''})) : [{name:'',score:''}]);
    function save() { upCI(ci.id,'vas',localVas.filter(v=>v.name.trim()).map(v=>({name:v.name.trim(),score:v.score===''?null:parseFloat(v.score)||null}))); }
    return (
      <div>
        {localVas.map((v,i)=>(
          <div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
            <input value={v.name} placeholder="VA name" onChange={e=>{const n=[...localVas];n[i]={...n[i],name:e.target.value};setLocalVas(n);}} onBlur={save}
              style={{flex:"1 1 120px",padding:"4px 7px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:12}}/>
            <input value={v.score} placeholder="Score %" type="number" min="0" max="100" onChange={e=>{const n=[...localVas];n[i]={...n[i],score:e.target.value};setLocalVas(n);}} onBlur={save}
              style={{width:70,padding:"4px 7px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:12}}/>
            <button onClick={()=>{const n=localVas.filter((_,j)=>j!==i);setLocalVas(n.length?n:[{name:'',score:''}]);setTimeout(save,0);}}
              style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:14,padding:0}}>×</button>
          </div>
        ))}
        <button onClick={()=>setLocalVas(p=>[...p,{name:'',score:''}])}
          style={{fontSize:11,color:C.teal,background:"none",border:"none",cursor:"pointer",padding:0}}>+ Add VA</button>
      </div>
    );
  }

  function ExpandedRow({ ci }) {
    const cfg = STATUS_CFG[ci.status] || STATUS_CFG.showed;
    return (
      <tr>
        <td colSpan={7} style={{padding:0,borderBottom:`1px solid ${C.border}`}}>
          <div style={{background:"#FAFBFF",padding:"14px 20px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
            {/* Date */}
            <div>
              <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:4}}>DATE</div>
              <input defaultValue={ci.date||ci.week} onBlur={e=>upCI(ci.id,'date',e.target.value)}
                style={{width:"100%",padding:"5px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
            </div>
            {/* Client */}
            <div style={{gridColumn:"span 2"}}>
              <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:4}}>CLIENT / AGENCY</div>
              <input defaultValue={ci.client} onBlur={e=>upCI(ci.id,'client',e.target.value)}
                style={{width:"100%",padding:"5px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
            </div>
            {/* Type */}
            <div>
              <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:4}}>TYPE</div>
              <select value={ci.type} onChange={e=>upCI(ci.id,'type',e.target.value)}
                style={{width:"100%",padding:"5px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}>
                <option value="weekly"> Weekly</option>
                <option value="monthly"> Monthly</option>
              </select>
            </div>
            {/* Mode */}
            <div>
              <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:4}}>MODE</div>
              <select value={ci.mode} onChange={e=>upCI(ci.id,'mode',e.target.value)}
                style={{width:"100%",padding:"5px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}>
                <option value="zoom"> Zoom</option>
                <option value="call"> Call</option>
                <option value="email"> Email</option>
              </select>
            </div>
            {/* AM */}
            <div>
              <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:4}}>AM</div>
              <select value={ci.am} onChange={e=>upCI(ci.id,'am',e.target.value)}
                style={{width:"100%",padding:"5px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13,color:ci.am?AM_COLORS[ci.am]:C.muted}}>
                <option value="">— Select AM —</option>
                <option>Niccole</option><option>Karla</option><option>Alicia</option>
              </select>
            </div>
            {/* TL */}
            <div>
              <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:4}}>TL ASSIGNED</div>
              <select value={ci.tl||""} onChange={e=>upCI(ci.id,'tl',e.target.value)}
                style={{width:"100%",padding:"5px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}>
                <option value="">— Select TL —</option>
                <option>Martin</option><option>Rez</option><option>Ed</option><option>RJ</option><option>Vincent</option>
              </select>
            </div>
            {/* Status */}
            <div>
              <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:4}}>STATUS</div>
              <select value={ci.status} onChange={e=>upCI(ci.id,'status',e.target.value)}
                style={{width:"100%",padding:"5px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13,color:cfg.dot}}>
                <option value="showed"> Showed</option>
                <option value="skipped">⏭ Skipped</option>
                <option value="noshow"> No Show</option>
              </select>
            </div>
            {/* VAs */}
            <div style={{gridColumn:"span 2"}}>
              <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:4}}>VIRTUAL ASSISTANTS & SCORES</div>
              <VaEditor ci={ci}/>
            </div>
            {/* Notes */}
            <div style={{gridColumn:"span 2"}}>
              <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:4}}>NOTES</div>
              <input defaultValue={ci.notes} onBlur={e=>upCI(ci.id,'notes',e.target.value)}
                style={{width:"100%",padding:"5px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
            </div>
          </div>
        </td>
      </tr>
    );
  }

  function PctChip({ label, value, shown, total }) {
    if (value===null||value===undefined) return (
      <div style={{background:C.gray,borderRadius:8,padding:"8px 10px"}}>
        <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{label}</div>
        <div style={{fontSize:18,fontWeight:700,color:C.muted}}>—</div>
        <div style={{fontSize:10,color:C.muted}}>no data</div>
      </div>
    );
    const col = value>=80?C.green:value>=60?C.amber:C.red;
    return (
      <div style={{background:C.gray,borderRadius:8,padding:"8px 10px"}}>
        <div style={{fontSize:10,color:C.muted,marginBottom:2}}>{label}</div>
        <div style={{fontSize:18,fontWeight:700,color:col}}>{value}%</div>
        {shown!==null&&shown!==undefined&&<div style={{fontSize:10,color:C.muted}}>{shown}/{total}</div>}
      </div>
    );
  }

  const sel = { padding:"6px 10px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13,cursor:"pointer" };

  return (
    <div>
      {/* Top bar: view toggle + legend + add button */}
      <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",background:C.gray,borderRadius:8,padding:3}}>
          {[{v:"report",l:" Client Check-ins"},{v:"table",l:" Full Table"},{v:"concerns",l:" Client Concerns"}].map(m=>(
            <button key={m.v} onClick={()=>setViewMode(m.v)} style={{padding:"6px 14px",borderRadius:6,border:"none",cursor:"pointer",fontSize:13,background:viewMode===m.v?C.dark:C.gray,color:viewMode===m.v?C.white:C.muted,fontWeight:viewMode===m.v?700:400}}>{m.l}</button>
          ))}
        </div>
        {viewMode!=="concerns"&&(
          <button onClick={()=>setAdding(v=>!v)} style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",background:C.red,color:C.white,fontWeight:600,fontSize:13,marginLeft:"auto"}}>
            {adding?" Cancel":"+ Add Check-in"}
          </button>
        )}
      </div>

      {/* Add Check-in Form */}
      {adding&&(
        <div style={{background:C.white,border:`2px solid ${C.teal}`,borderRadius:12,padding:20,marginBottom:18}}>
          <div style={{fontWeight:700,fontSize:14,color:C.teal,marginBottom:14}}>New Check-in</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:12}}>
            {/* Date */}
            <div>
              <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>DATE *</div>
              <input type="date" value={newCI.date} onChange={e=>setNewCI(p=>({...p,date:e.target.value,week:e.target.value?new Date(e.target.value+'T00:00:00').toLocaleDateString('en-US',{month:'2-digit',day:'2-digit',year:'numeric'}):p.week}))}
                style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
            </div>
            {/* Client */}
            <div style={{gridColumn:"span 2"}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>CLIENT / AGENCY *</div>
              <input value={newCI.client} placeholder="e.g. TJ Worsencroft, Navigate Risk Advisors" onChange={e=>setNewCI(p=>({...p,client:e.target.value}))}
                style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
            </div>
            {/* Type */}
            <div>
              <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>TYPE</div>
              <select value={newCI.type} onChange={e=>setNewCI(p=>({...p,type:e.target.value}))} style={{...sel,width:"100%"}}>
                <option value="weekly"> Weekly</option>
                <option value="monthly"> Monthly</option>
              </select>
            </div>
            {/* Mode */}
            <div>
              <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>MODE OF COMMUNICATION</div>
              <select value={newCI.mode} onChange={e=>setNewCI(p=>({...p,mode:e.target.value}))} style={{...sel,width:"100%"}}>
                <option value="zoom"> Zoom</option>
                <option value="call"> Call</option>
                <option value="email"> Email</option>
              </select>
            </div>
            {/* AM */}
            <div>
              <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>AM</div>
              <select value={newCI.am} onChange={e=>setNewCI(p=>({...p,am:e.target.value}))} style={{...sel,width:"100%",color:newCI.am?AM_COLORS[newCI.am]:undefined}}>
                <option value="">— Select AM —</option>
                <option>Niccole</option><option>Karla</option><option>Alicia</option>
              </select>
            </div>
            {/* TL */}
            <div>
              <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>TL ASSIGNED</div>
              <select value={newCI.tl} onChange={e=>setNewCI(p=>({...p,tl:e.target.value}))} style={{...sel,width:"100%"}}>
                <option value="">— Select TL —</option>
                <option>Martin</option><option>Rez</option><option>Ed</option><option>RJ</option><option>Vincent</option>
              </select>
            </div>
            {/* Status */}
            <div>
              <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>STATUS</div>
              <select value={newCI.status} onChange={e=>setNewCI(p=>({...p,status:e.target.value}))} style={{...sel,width:"100%"}}>
                <option value="showed"> Showed</option>
                <option value="skipped">⏭ Skipped</option>
                <option value="noshow"> No Show</option>
              </select>
            </div>
            {/* VAs */}
            <div style={{gridColumn:"span 2"}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:6}}>VIRTUAL ASSISTANTS & SCORES</div>
              {newCI.vas.map((v,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                  <div style={{fontSize:12,color:C.muted,width:20,textAlign:"right",flexShrink:0}}>#{i+1}</div>
                  <input value={v.name} placeholder="VA full name" onChange={e=>setVA(i,"name",e.target.value)}
                    style={{flex:"1 1 150px",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
                  <input value={v.score} placeholder="Score %" type="number" min="0" max="100" onChange={e=>setVA(i,"score",e.target.value)}
                    style={{width:90,padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
                  {newCI.vas.length>1&&(
                    <button onClick={()=>removeVA(i)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,padding:0,flexShrink:0}}>×</button>
                  )}
                </div>
              ))}
              <button onClick={addVA} style={{fontSize:12,color:C.teal,background:"none",border:`1px dashed ${C.teal}`,borderRadius:6,padding:"4px 12px",cursor:"pointer",marginTop:2}}>+ Add another VA</button>
            </div>
            {/* Notes */}
            <div style={{gridColumn:"span 2"}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>NOTES</div>
              <input value={newCI.notes} placeholder="Any additional notes…" onChange={e=>setNewCI(p=>({...p,notes:e.target.value}))}
                style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"flex-end"}}>
            <button onClick={()=>setAdding(false)} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:13}}>Cancel</button>
            <button onClick={saveNew} style={{padding:"8px 22px",borderRadius:8,border:"none",background:C.teal,color:C.white,cursor:"pointer",fontWeight:700,fontSize:13}}>Save Check-in</button>
          </div>
        </div>
      )}

      {/*  MONDAY REPORT  */}
      {viewMode==="report"&&(
        <div>
          {/* Calendar + type filter */}
          <MiniCalendar weeks={weeks} checkins={checkins} activeWeek={activeWeek} onSelect={setSelWeek} C={C} typeFilter={typeFilter} setTypeFilter={setTypeFilter} rangeStart={calRangeStart} rangeEnd={calRangeEnd} setRangeStart={setCalRangeStart} setRangeEnd={setCalRangeEnd} />

          {/* AM Stats Cards */}
          <div style={{marginBottom:18}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,letterSpacing:"0.07em",marginBottom:10}}>
              SHOW RATE & SCORECARD RATE — {activeWeek}
              {weekTotals.untagged>0&&<span style={{marginLeft:10,fontSize:10,fontWeight:500,color:C.amber}}> {weekTotals.untagged} check-in{weekTotals.untagged!==1?"s":""} not tagged to an AM</span>}
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {amStats.map(({am,all,weekly,monthly})=>(
                <div key={am} style={{flex:"1 1 200px",background:C.white,borderRadius:10,border:`2px solid ${AM_COLORS[am]}`,padding:"12px 14px"}}>
                  <div style={{fontWeight:700,fontSize:13,color:AM_COLORS[am],marginBottom:10}}>
                    {am}
                    {all.total>0&&<span style={{fontWeight:400,fontSize:11,color:C.muted,marginLeft:8}}>{all.showed}/{all.total} showed</span>}
                  </div>
                  {all.total===0?(
                    <div style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>No check-ins tagged yet</div>
                  ):(
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {/* Weekly row */}
                      {weekly.total>0&&(
                        <div style={{background:C.gray,borderRadius:8,padding:"8px 10px"}}>
                          <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:6,letterSpacing:"0.05em"}}>WEEKLY ({weekly.total})</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                            <PctChip label="Show Rate" value={weekly.showRate} shown={weekly.showed} total={weekly.total}/>
                            <PctChip label="Scorecard" value={weekly.scRate} shown={weekly.passing} total={weekly.scored}/>
                          </div>
                          {weekly.avgScore!==null&&<div style={{fontSize:10,color:C.muted,marginTop:4}}>avg score {weekly.avgScore}%</div>}
                        </div>
                      )}
                      {/* Monthly row */}
                      {monthly.total>0&&(
                        <div style={{background:"#EFF6FF",borderRadius:8,padding:"8px 10px"}}>
                          <div style={{fontSize:10,fontWeight:700,color:C.blue,marginBottom:6,letterSpacing:"0.05em"}}>MONTHLY ({monthly.total})</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                            <PctChip label="Show Rate" value={monthly.showRate} shown={monthly.showed} total={monthly.total}/>
                            <PctChip label="Scorecard" value={monthly.scRate} shown={monthly.passing} total={monthly.scored}/>
                          </div>
                          {monthly.avgScore!==null&&<div style={{fontSize:10,color:C.muted,marginTop:4}}>avg score {monthly.avgScore}%</div>}
                        </div>
                      )}
                      {weekly.total===0&&monthly.total===0&&(
                        <div style={{fontSize:11,color:C.muted}}>All check-ins are skipped</div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Overall — computed from tagged check-ins */}
              <div style={{flex:"1 1 200px",background:C.white,borderRadius:10,border:`2px solid ${C.dark}`,padding:"12px 14px"}}>
                <div style={{fontWeight:700,fontSize:13,color:C.dark,marginBottom:10}}>
                  Overall / All AMs
                  {overallStats.all.total>0&&<span style={{fontWeight:400,fontSize:11,color:C.muted,marginLeft:8}}>{overallStats.all.showed}/{overallStats.all.total} showed</span>}
                </div>
                {overallStats.all.total===0?(
                  <div style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>Tag check-ins to AMs to see overall rates</div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {overallStats.weekly.total>0&&(
                      <div style={{background:C.gray,borderRadius:8,padding:"8px 10px"}}>
                        <div style={{fontSize:10,fontWeight:700,color:C.muted,marginBottom:6,letterSpacing:"0.05em"}}>WEEKLY ({overallStats.weekly.total})</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                          <PctChip label="Show Rate" value={overallStats.weekly.showRate} shown={overallStats.weekly.showed} total={overallStats.weekly.total}/>
                          <PctChip label="Scorecard" value={overallStats.weekly.scRate} shown={null} total={null}/>
                        </div>
                      </div>
                    )}
                    {overallStats.monthly.total>0&&(
                      <div style={{background:"#EFF6FF",borderRadius:8,padding:"8px 10px"}}>
                        <div style={{fontSize:10,fontWeight:700,color:C.blue,marginBottom:6,letterSpacing:"0.05em"}}>MONTHLY ({overallStats.monthly.total})</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                          <PctChip label="Show Rate" value={overallStats.monthly.showRate} shown={overallStats.monthly.showed} total={overallStats.monthly.total}/>
                          <PctChip label="Scorecard" value={overallStats.monthly.scRate} shown={null} total={null}/>
                        </div>
                      </div>
                    )}
                    {overallStats.all.noShow>0&&<div style={{fontSize:11,color:C.muted}}> {overallStats.all.noShow} no shows across all AMs</div>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Check-in list */}
          <div style={{background:C.teal,color:C.white,borderRadius:"10px 10px 0 0",padding:"10px 18px",display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontWeight:700,fontSize:13}}>Check-ins — {calRangeStart ? (calRangeEnd && calRangeEnd.toDateString()!==calRangeStart.toDateString() ? `${calRangeStart.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${calRangeEnd.toLocaleDateString("en-US",{month:"short",day:"numeric"})}` : calRangeStart.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})) : activeWeek}</span>
            <span style={{fontSize:12,opacity:.85}}>{weekTotals.total} counted</span>
            <span style={{fontSize:12}}> {weekTotals.showed} showed</span>
            <span style={{fontSize:12}}> {weekTotals.noShow} no show</span>
            {weekTotals.skipped>0&&<span style={{fontSize:12,opacity:.7}}>⏭ {weekTotals.skipped} skipped</span>}
            {weekTotals.avgScore!==null&&<span style={{fontSize:12}}> avg {weekTotals.avgScore}%</span>}
            <span style={{fontSize:11,opacity:.7,marginLeft:"auto"}}>Click a row to edit</span>
          </div>
          <div style={{background:C.white,border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 10px 10px",overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:640}}>
              <thead>
                <tr style={{background:"#F8F8FB"}}>
                  {["","Client / Agency","VAs & Scores","Type","Mode","AM","TL","Status",""].map((h,i)=>(
                    <th key={i} style={{padding:"8px 12px",textAlign:"left",fontSize:11,color:C.muted,fontWeight:700,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weekCheckins.length===0&&(
                  <tr><td colSpan={7} style={{padding:24,textAlign:"center",color:C.muted}}>No check-ins for this week.</td></tr>
                )}
                {weekCheckins.map(c=>{
                  const cfg = STATUS_CFG[c.status]||STATUS_CFG.showed;
                  const isOpen = expandId===c.id;
                  return(
                    <React.Fragment key={c.id}>
                      <tr onClick={()=>setExpandId(isOpen?null:c.id)}
                        style={{borderBottom:isOpen?"none":`1px solid ${C.border}`,background:cfg.bg,cursor:"pointer"}}>
                        <td style={{padding:"8px 8px 8px 12px",width:12}}>
                          <span style={{display:"inline-block",width:10,height:10,borderRadius:2,background:cfg.dot}}/>
                        </td>
                        <td style={{padding:"8px 12px",fontWeight:500}}>
                          {c.client}
                          {c.notes&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{c.notes}</div>}
                        </td>
                        <td style={{padding:"8px 12px"}}>
                          {c.vas.length===0?<span style={{color:C.muted}}>—</span>:
                            c.vas.map((v,i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                                <span style={{color:C.dark}}>{v.name||"—"}</span>
                                {v.score!==null&&v.score!==undefined&&<span style={{fontWeight:700,fontSize:12,color:sc(+v.score),background:C.gray,padding:"1px 6px",borderRadius:99}}>{v.score}%</span>}
                              </div>
                            ))
                          }
                        </td>
                        <td style={{padding:"8px 12px",whiteSpace:"nowrap",fontSize:12}}>
                          <select value={c.type} onChange={e=>upCI(c.id,"type",e.target.value)} style={{border:"none",background:"transparent",fontSize:12,cursor:"pointer",color:C.dark}}>
                            <option value="weekly"> Weekly</option><option value="monthly"> Monthly</option>
                          </select>
                        </td>
                        <td style={{padding:"8px 12px",whiteSpace:"nowrap",fontSize:12}}>
                          <select value={c.mode} onChange={e=>upCI(c.id,"mode",e.target.value)} style={{border:"none",background:"transparent",fontSize:12,cursor:"pointer",color:C.dark}}>
                            <option value="zoom"> Zoom</option><option value="call"> Call</option><option value="email"> Email</option>
                          </select>
                        </td>
                        <td style={{padding:"8px 12px"}}>
                          {c.am?<span style={{fontSize:12,fontWeight:700,color:AM_COLORS[c.am]||C.muted}}>{c.am}</span>
                            :<span style={{fontSize:11,color:C.amber}}> Tag AM</span>}
                        </td>
                        <td style={{padding:"8px 12px"}}>
                          {c.tl?<span style={{fontSize:12,fontWeight:600,color:C.teal}}>{c.tl}</span>
                            :<span style={{fontSize:11,color:C.muted}}>—</span>}
                        </td>
                        <td style={{padding:"8px 12px"}}>
                          <span style={{fontSize:11,fontWeight:600,color:cfg.dot}}>{cfg.label}</span>
                        </td>
                        <td style={{padding:"8px 8px"}} onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>delCI(c.id)}
                            style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,cursor:"pointer",color:C.muted,fontSize:13,padding:"3px 8px",lineHeight:1}}
                            title="Delete check-in">×</button>
                        </td>
                      </tr>
                      {isOpen&&<ExpandedRow ci={c}/>}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/*  FULL TABLE  */}
      {viewMode==="table"&&(
        <div>
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            <input placeholder=" Search client, VA, week, AM…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{flex:"1 1 200px",padding:"7px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13}}/>
            {["All",...AMs].map(a=>(
              <button key={a} onClick={()=>setAmFilter(a)} style={{padding:"6px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,background:amFilter===a?(a==="All"?C.dark:AM_COLORS[a]):C.gray,color:amFilter===a?C.white:C.dark,fontWeight:amFilter===a?700:400}}>{a==="All"?"All AMs":a}</button>
            ))}
            {[["All","All statuses"],["showed"," Showed"],["skipped","⏭ Skipped"],["noshow"," No Show"]].map(([v,l])=>(
              <button key={v} onClick={()=>setStatusFilter(v)} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${statusFilter===v?C.dark:C.border}`,cursor:"pointer",fontSize:12,background:statusFilter===v?C.dark:C.white,color:statusFilter===v?C.white:C.dark,fontWeight:statusFilter===v?700:400}}>{l}</button>
            ))}
          </div>
          <div style={{background:C.white,borderRadius:10,border:`1px solid ${C.border}`,overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:800}}>
              <thead>
                <tr style={{background:C.dark,color:C.white}}>
                  {["","Week","Client / Agency","VAs & Scores","Type","Mode","AM","TL","Status",""].map((h,i)=>(
                    <th key={i} style={{padding:"9px 12px",textAlign:"left",fontWeight:600,fontSize:11,letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((c,ri)=>{
                  const cfg = STATUS_CFG[c.status]||STATUS_CFG.showed;
                  const isOpen = expandId===c.id;
                  return(
                    <React.Fragment key={c.id}>
                      <tr onClick={()=>setExpandId(isOpen?null:c.id)}
                        style={{borderBottom:isOpen?"none":`1px solid ${C.border}`,background:cfg.bg,cursor:"pointer"}}>
                        <td style={{padding:"7px 8px 7px 12px"}}>
                          <span style={{display:"inline-block",width:10,height:10,borderRadius:2,background:cfg.dot}}/>
                        </td>
                        <td style={{padding:"7px 12px",whiteSpace:"nowrap",fontSize:12,color:C.muted}}>{c.week}</td>
                        <td style={{padding:"7px 12px",fontWeight:500,minWidth:200}}>{c.client}</td>
                        <td style={{padding:"7px 12px",minWidth:140}}>
                          {c.vas.length===0?<span style={{color:C.muted}}>—</span>:
                            c.vas.map((v,i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                                <span>{v.name||"—"}</span>
                                {v.score!==null&&v.score!==undefined&&<span style={{fontWeight:700,fontSize:12,color:sc(+v.score)}}>{v.score}%</span>}
                              </div>
                            ))
                          }
                        </td>
                        <td style={{padding:"7px 12px",whiteSpace:"nowrap",fontSize:12}}>
                          <select value={c.type} onChange={e=>upCI(c.id,"type",e.target.value)} style={{border:"none",background:"transparent",fontSize:12,cursor:"pointer",color:C.dark}}>
                            <option value="weekly"> Weekly</option><option value="monthly"> Monthly</option>
                          </select>
                        </td>
                        <td style={{padding:"7px 12px",whiteSpace:"nowrap",fontSize:12}}>
                          <select value={c.mode} onChange={e=>upCI(c.id,"mode",e.target.value)} style={{border:"none",background:"transparent",fontSize:12,cursor:"pointer",color:C.dark}}>
                            <option value="zoom"> Zoom</option><option value="call"> Call</option><option value="email"> Email</option>
                          </select>
                        </td>
                        <td style={{padding:"7px 12px"}}>
                          {c.am?<span style={{fontSize:12,fontWeight:700,color:AM_COLORS[c.am]||C.muted}}>{c.am}</span>
                            :<span style={{fontSize:11,color:C.amber}}> Tag</span>}
                        </td>
                        <td style={{padding:"7px 12px"}}>
                          <select value={c.tl||""} onChange={e=>upCI(c.id,"tl",e.target.value)}
                            style={{border:"none",background:"transparent",cursor:"pointer",fontSize:12,color:c.tl?C.teal:C.muted,fontWeight:c.tl?600:400}}>
                            <option value="">— TL —</option>
                            <option>Martin</option><option>Rez</option><option>Ed</option><option>RJ</option><option>Vincent</option>
                          </select>
                        </td>
                        <td style={{padding:"7px 12px"}}>
                          <span style={{fontSize:11,fontWeight:600,color:cfg.dot}}>{cfg.label}</span>
                        </td>
                        <td style={{padding:"7px 12px"}} onClick={e=>{e.stopPropagation();delCI(c.id);}}>
                          <button style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16}}>×</button>
                        </td>
                      </tr>
                      {isOpen&&<ExpandedRow ci={c}/>}
                    </React.Fragment>
                  );
                })}
                {visible.length===0&&(
                  <tr><td colSpan={9} style={{padding:24,textAlign:"center",color:C.muted}}>No check-ins found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p style={{fontSize:11,color:C.muted,marginTop:8}}>{visible.length} of {checkins.length} · Click any row to expand and edit all fields</p>
        </div>
      )}

      {/*  CLIENT CONCERNS  */}
      {viewMode==="concerns"&&(
        <div>
          {/* Concern Calendar — dropdown */}
          {(()=>{
            const MNAMES=["January","February","March","April","May","June","July","August","September","October","November","December"];
            const DNAMES=["Su","Mo","Tu","We","Th","Fr","Sa"];
            const firstDay=new Date(concernCalYear,concernCalMonth,1).getDay();
            const daysInMonth=new Date(concernCalYear,concernCalMonth+1,0).getDate();
            const grid=[];
            for(let i=0;i<firstDay;i++) grid.push(null);
            for(let d=1;d<=daysInMonth;d++) grid.push(d);
            const concernDates=new Set(concerns.map(c=>{
              if(!c.date) return null;
              if(c.date.includes('-')) return c.date.slice(0,10);
              const [mm,dd,yy]=c.date.split('/');
              return `${yy}-${(mm||'').padStart(2,'0')}-${(dd||'').padStart(2,'0')}`;
            }).filter(Boolean));
            function dayISO(d){ return `${concernCalYear}-${String(concernCalMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
            function inRange(d){
              if(!concernRangeStart) return false;
              const dt=new Date(concernCalYear,concernCalMonth,d);
              const lo=concernRangeEnd&&concernRangeEnd<concernRangeStart?concernRangeEnd:concernRangeStart;
              const hi=concernRangeEnd&&concernRangeEnd>concernRangeStart?concernRangeEnd:concernRangeStart;
              return dt>=lo&&dt<=hi;
            }
            const today=new Date();
            const selLabel=concernRangeStart
              ?(concernRangeEnd&&concernRangeEnd.toDateString()!==concernRangeStart.toDateString()
                ?`${concernRangeStart.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${concernRangeEnd.toLocaleDateString("en-US",{month:"short",day:"numeric"})}`
                :concernRangeStart.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}))
              :"Filter by date";
            return (
              <div style={{marginBottom:14,position:"relative"}}
                onMouseLeave={()=>{if(concernDragging) setConcernDragging(false);}}>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <button onClick={()=>setConcernCalOpen(v=>!v)}
                    style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:13,fontWeight:500,color:C.dark}}>
                     {selLabel}
                    <span style={{fontSize:10,color:C.muted}}>{concernCalOpen?"":""}</span>
                  </button>
                  {concernRangeStart&&(
                    <button onClick={()=>{setConcernRangeStart(null);setConcernRangeEnd(null);}}
                      style={{padding:"7px 10px",borderRadius:8,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:12,color:C.muted}}> Clear</button>
                  )}
                  <span style={{fontSize:12,color:C.muted}}>
                    {concerns.filter(c=>{
                      if(concernRangeStart&&c.date){
                        const parts=c.date.includes('-')?c.date.split('-'):[c.date.split('/')[2],c.date.split('/')[0],c.date.split('/')[1]];
                        const cd=new Date(+parts[0],+parts[1]-1,+parts[2]);
                        const lo=new Date(concernRangeEnd&&concernRangeEnd<concernRangeStart?concernRangeEnd:concernRangeStart);
                        lo.setHours(0,0,0,0);
                        const hi=new Date(concernRangeEnd&&concernRangeEnd>concernRangeStart?concernRangeEnd:concernRangeStart);
                        hi.setHours(23,59,59,999);
                        return cd>=lo&&cd<=hi;
                      }
                      return true;
                    }).length} concerns
                  </span>
                </div>
                {concernCalOpen&&(
                  <div style={{position:"absolute",top:"100%",left:0,zIndex:20,marginTop:6,background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding:12,maxWidth:240,boxShadow:"0 4px 20px rgba(0,0,0,0.12)"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                      <button onClick={()=>{if(concernCalMonth===0){setConcernCalMonth(11);setConcernCalYear(y=>y-1);}else setConcernCalMonth(m=>m-1);}}
                        style={{background:"none",border:"none",cursor:"pointer",fontSize:15,color:C.dark,padding:"2px 6px"}}>‹</button>
                      <span style={{fontWeight:700,fontSize:13,color:C.dark}}>{MNAMES[concernCalMonth]} {concernCalYear}</span>
                      <button onClick={()=>{if(concernCalMonth===11){setConcernCalMonth(0);setConcernCalYear(y=>y+1);}else setConcernCalMonth(m=>m+1);}}
                        style={{background:"none",border:"none",cursor:"pointer",fontSize:15,color:C.dark,padding:"2px 6px"}}>›</button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:3}}>
                      {DNAMES.map(d=><div key={d} style={{textAlign:"center",fontSize:9,fontWeight:700,color:C.muted}}>{d}</div>)}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,userSelect:"none"}}>
                      {grid.map((day,i)=>{
                        if(!day) return <div key={i}/>;
                        const iso=dayISO(day);
                        const hasDot=concernDates.has(iso);
                        const sel=inRange(day);
                        const isToday=today.getDate()===day&&today.getMonth()===concernCalMonth&&today.getFullYear()===concernCalYear;
                        return (
                          <div key={i}
                            onMouseDown={()=>{
                              const d=new Date(concernCalYear,concernCalMonth,day);
                              setConcernRangeStart(d);setConcernRangeEnd(null);setConcernDragging(true);
                            }}
                            onMouseEnter={()=>{if(concernDragging)setConcernRangeEnd(new Date(concernCalYear,concernCalMonth,day));}}
                            onMouseUp={()=>{setConcernRangeEnd(new Date(concernCalYear,concernCalMonth,day));setConcernDragging(false);setConcernCalOpen(false);}}
                            style={{textAlign:"center",padding:"5px 2px",borderRadius:5,fontSize:11,cursor:"pointer",position:"relative",
                              background:sel?C.red:"transparent",
                              color:sel?C.white:hasDot?C.dark:C.muted,
                              fontWeight:sel||isToday?700:400,
                              border:isToday?`2px solid ${C.red}`:"2px solid transparent"}}>
                            {day}
                            {hasDot&&!sel&&<div style={{position:"absolute",bottom:1,left:"50%",transform:"translateX(-50%)",width:3,height:3,borderRadius:"50%",background:C.red}}/>}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{marginTop:8,fontSize:9,color:C.muted,textAlign:"center"}}>Click or drag · closes on pick</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Header bar */}
          <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"center",flexWrap:"wrap"}}>
            <input
              placeholder=" Search agency, VA, or concern…"
              value={concernSearch}
              onChange={e=>setConcernSearch(e.target.value)}
              style={{flex:"1 1 220px",padding:"7px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13}}
            />
            <button onClick={()=>setAddingConcern(v=>!v)}
              style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",background:C.red,color:C.white,fontWeight:600,fontSize:13,marginLeft:"auto"}}>
              {addingConcern?" Cancel":"+ Add Concern"}
            </button>
          </div>

          {/* Add concern form */}
          {addingConcern&&(
            <div style={{background:C.white,border:`2px solid ${C.red}`,borderRadius:12,padding:18,marginBottom:16}}>
              <div style={{fontWeight:700,fontSize:13,color:C.red,marginBottom:14}}>New Client Concern</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
                <div>
                  <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>DATE *</div>
                  <div style={{position:"relative"}}>
                    <button onClick={()=>setAddConcernCalOpen(v=>!v)}
                      style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13,
                        background:C.white,cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",justifyContent:"space-between",color:newConcern.date?C.dark:C.muted}}>
                      <span> {newConcern.date ? new Date(newConcern.date+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "Pick a date"}</span>
                      <span style={{fontSize:10,color:C.muted}}>{addConcernCalOpen?"":""}</span>
                    </button>
                    {addConcernCalOpen&&(()=>{
                      const MNAMES=["January","February","March","April","May","June","July","August","September","October","November","December"];
                      const DNAMES=["Su","Mo","Tu","We","Th","Fr","Sa"];
                      const selDate = newConcern.date ? new Date(newConcern.date+"T00:00:00") : new Date();
                      const [calY, setCalY] = [selDate.getFullYear(), ()=>{}];
                      const [calM, setCalM] = [selDate.getMonth(), ()=>{}];
                      // Use a sub-component to hold month state
                      const ConcernDatePicker = ()=>{
                        const [cy,setCy] = useState(selDate.getFullYear());
                        const [cm,setCm] = useState(selDate.getMonth());
                        const fd = new Date(cy,cm,1).getDay();
                        const dim = new Date(cy,cm+1,0).getDate();
                        const cells=[];
                        for(let i=0;i<fd;i++) cells.push(null);
                        for(let d=1;d<=dim;d++) cells.push(d);
                        const today=new Date();
                        return (
                          <div style={{position:"absolute",top:"100%",left:0,zIndex:30,marginTop:4,background:C.white,borderRadius:10,border:`1px solid ${C.border}`,padding:12,maxWidth:240,boxShadow:"0 4px 20px rgba(0,0,0,0.12)"}}>
                            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                              <button onClick={()=>{if(cm===0){setCm(11);setCy(y=>y-1);}else setCm(m=>m-1);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:15,color:C.dark,padding:"2px 6px"}}>‹</button>
                              <span style={{fontWeight:700,fontSize:13,color:C.dark}}>{MNAMES[cm]} {cy}</span>
                              <button onClick={()=>{if(cm===11){setCm(0);setCy(y=>y+1);}else setCm(m=>m+1);}} style={{background:"none",border:"none",cursor:"pointer",fontSize:15,color:C.dark,padding:"2px 6px"}}>›</button>
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:3}}>
                              {DNAMES.map(d=><div key={d} style={{textAlign:"center",fontSize:9,fontWeight:700,color:C.muted}}>{d}</div>)}
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1}}>
                              {cells.map((day,i)=>{
                                if(!day) return <div key={i}/>;
                                const iso=`${cy}-${String(cm+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                                const isSel=newConcern.date===iso;
                                const isToday=today.getDate()===day&&today.getMonth()===cm&&today.getFullYear()===cy;
                                return (
                                  <div key={i} onClick={()=>{setNewConcern(p=>({...p,date:iso}));setAddConcernCalOpen(false);}}
                                    style={{textAlign:"center",padding:"5px 2px",borderRadius:5,fontSize:11,cursor:"pointer",
                                      background:isSel?C.red:"transparent",
                                      color:isSel?C.white:C.dark,
                                      fontWeight:isSel||isToday?700:400,
                                      border:isToday?`2px solid ${C.red}`:"2px solid transparent"}}>
                                    {day}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      };
                      return <ConcernDatePicker/>;
                    })()}
                  </div>
                </div>
                <div style={{gridColumn:"span 2"}}>
                  <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>AGENCY *</div>
                  <input value={newConcern.agency} placeholder="e.g. Navigate Risk Advisors" onChange={e=>setNewConcern(p=>({...p,agency:e.target.value}))}
                    style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
                </div>
                <div>
                  <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>VA NAME</div>
                  <input value={newConcern.va} placeholder="VA full name" onChange={e=>setNewConcern(p=>({...p,va:e.target.value}))}
                    style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
                </div>
                <div style={{gridColumn:"span 3"}}>
                  <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>CONCERN *</div>
                  <input value={newConcern.concern} placeholder="Describe the client concern…" onChange={e=>setNewConcern(p=>({...p,concern:e.target.value}))}
                    style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
                </div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:14,justifyContent:"flex-end"}}>
                <button onClick={()=>setAddingConcern(false)}
                  style={{padding:"7px 18px",borderRadius:8,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:13}}>Cancel</button>
                <button onClick={()=>{
                    if(!newConcern.agency.trim()||!newConcern.concern.trim()) return;
                    upsertConcern({id:Date.now(),...newConcern});
                    setNewConcern({date:"",agency:"",va:"",concern:""});
                    setAddingConcern(false);
                  }}
                  style={{padding:"7px 22px",borderRadius:8,border:"none",background:C.red,color:C.white,cursor:"pointer",fontWeight:700,fontSize:13}}>Save Concern</button>
              </div>
            </div>
          )}

          {/* Concerns table */}
          <div style={{background:C.white,borderRadius:10,border:`1px solid ${C.border}`,overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:600}}>
              <thead>
                <tr style={{background:C.dark,color:C.white}}>
                  {["Date","Agency","VA Name","Concern",""].map((h,i)=>(
                    <th key={i} style={{padding:"9px 14px",textAlign:"left",fontWeight:600,fontSize:11,letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {concerns
                  .filter(c=>{
                    // Calendar range filter
                    if(concernRangeStart && c.date){
                      const parts=c.date.includes('-')?c.date.split('-'):[c.date.split('/')[2],c.date.split('/')[0],c.date.split('/')[1]];
                      const cd=new Date(+parts[0],+parts[1]-1,+parts[2]);
                      const lo=new Date(concernRangeEnd&&concernRangeEnd<concernRangeStart?concernRangeEnd:concernRangeStart);
                      lo.setHours(0,0,0,0);
                      const hi=new Date(concernRangeEnd&&concernRangeEnd>concernRangeStart?concernRangeEnd:concernRangeStart);
                      hi.setHours(23,59,59,999);
                      if(cd<lo||cd>hi) return false;
                    }
                    const q=concernSearch.toLowerCase();
                    return !concernSearch||c.agency.toLowerCase().includes(q)||c.va.toLowerCase().includes(q)||c.concern.toLowerCase().includes(q);
                  })
                  .sort((a,b)=>new Date(b.date)-new Date(a.date))
                  .map((c,i)=>(
                  <tr key={c.id} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?C.white:"#FAFAFA"}}>
                    <td style={{padding:"10px 14px",whiteSpace:"nowrap",fontSize:12,color:C.muted}}>
                      <InlineEdit value={c.date} onSave={v=>upsertConcern({...c,date:v})} style={{color:C.muted}}/>
                    </td>
                    <td style={{padding:"10px 14px",fontWeight:600}}>
                      <InlineEdit value={c.agency} onSave={v=>upsertConcern({...c,agency:v})}/>
                    </td>
                    <td style={{padding:"10px 14px"}}>
                      <InlineEdit value={c.va||"—"} onSave={v=>upsertConcern({...c,va:v})} style={{color:c.va?C.dark:C.muted}}/>
                    </td>
                    <td style={{padding:"10px 14px",minWidth:260}}>
                      <InlineEdit value={c.concern} onSave={v=>upsertConcern({...c,concern:v})} multiline/>
                    </td>
                    <td style={{padding:"10px 14px"}}>
                      <button onClick={()=>removeConcern(c.id)}
                        style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16}}>×</button>
                    </td>
                  </tr>
                ))}
                {concerns.length===0&&(
                  <tr><td colSpan={5} style={{padding:24,textAlign:"center",color:C.muted}}>No concerns logged yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p style={{fontSize:11,color:C.muted,marginTop:8}}> Click any cell to edit inline.</p>
        </div>
      )}
    </div>
  );
}

//  HUBSPOT TAB 
function HubSpotTab() {
  const C = useTheme();
  const { rows: rawLinks, upsert: upsertLink } = useSupabaseTable("hubspot_links", "id");
  // Group raw rows into the nested structure the UI expects
  const links = useMemo(() => {
    const persons = [...new Set(rawLinks.map(r => r.person))];
    return persons.flatMap(person => {
      const cats = [...new Set(rawLinks.filter(r => r.person === person).map(r => r.category))];
      return cats.map(category => ({
        person, category,
        links: rawLinks.filter(r => r.person === person && r.category === category)
          .map(r => ({ id: r.id, label: r.label, url: r.url }))
      }));
    });
  }, [rawLinks]);
  const [activePerson, setActivePerson] = useState("Niccole");
  const [copied, setCopied] = useState("");
  const persons = [...new Set(links.map((g) => g.person))];
  const groups = links.filter((g) => g.person === activePerson);

  function copyLink(url) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(""), 1500);
    }).catch(() => {});
  }
  function updateLink(gi, li, field, val) {
    const group = groups[gi];
    if (!group) return;
    const linkRow = group.links[li];
    if (!linkRow) return;
    const raw = rawLinks.find(r => r.id === linkRow.id);
    if (raw) upsertLink({ ...raw, [field]: val });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {persons.map((p) => (
          <button key={p} onClick={() => setActivePerson(p)}
            style={{ padding: "7px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
              background: activePerson === p ? C.red : C.gray,
              color: activePerson === p ? C.white : C.black,
              fontWeight: activePerson === p ? 600 : 400 }}>
            {p}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {groups.map((g, gi) => (
          <div key={gi} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: C.dark, color: C.white, fontSize: 12, fontWeight: 600, letterSpacing: "0.05em" }}>
              {g.category.toUpperCase()}
            </div>
            <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {g.links.map((l, li) => (
                <div key={li} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 6, background: C.gray }}>
                  <span style={{ fontWeight: 600, fontSize: 13, minWidth: 70 }}>{l.label}</span>
                  <span style={{ flex: 1, fontSize: 12, color: C.teal }}>{l.url}</span>
                  <button onClick={() => copyLink(l.url)}
                    style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.border}`,
                      background: copied === l.url ? "#D1FAE5" : C.white, cursor: "pointer", fontSize: 11,
                      fontWeight: 600, color: copied === l.url ? C.green : C.dark, whiteSpace: "nowrap" }}>
                    {copied === l.url ? "Copied!" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

//  NICCOLE'S ACCOUNTS TAB 
function AccountsTab({ checkins }) {
  const C = useTheme();
  const { rows: accounts, upsert: upsertAccount } = useSupabaseTable("accounts", "id", INIT_ACCOUNTS);
  function upAcc(id, field, value) {
    const acc = accounts.find(a => a.id === id);
    if (acc) upsertAccount({ ...acc, [field]: value });
  }
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedId, setExpandedId] = useState(null);
  const [addingVA, setAddingVA] = useState(null);
  const [newVA, setNewVA] = useState("");
  const [adding, setAdding] = useState(false);
  const [newAcc, setNewAcc] = useState({
    agency: "",
    contact: "",
    vas: [],
    status: "Active",
    phone: "",
    state: "",
    notes: "",
  });

  // Build VA-level last-check-in: match by VA first name (lowercase)
  const vaLastCI = useMemo(() => {
    const map = {};
    checkins.forEach((c) => {
      if (!c.va || !c.va.trim()) return;
      const key = c.va.toLowerCase().trim();
      const firstName = key.split(/\s/)[0];
      // store by both full name and first name, prefer later id
      [key, firstName].forEach((k) => {
        if (!map[k] || c.id > map[k].id) map[k] = c;
      });
    });
    return map;
  }, [checkins]);

  function getVACI(vaName) {
    const key = vaName.toLowerCase().trim();
    const firstName = key.split(/\s/)[0];
    return vaLastCI[key] || vaLastCI[firstName] || null;
  }

  const visible = useMemo(
    () =>
      accounts.filter((a) => {
        const q = search.toLowerCase();
        return (
          (!search ||
            a.agency.toLowerCase().includes(q) ||
            a.contact.toLowerCase().includes(q) ||
            a.vas.some((v) => v.toLowerCase().includes(q))) &&
          (statusFilter === "All" || a.status === statusFilter)
        );
      }),
    [accounts, search, statusFilter],
  );


  function removeVA(aId, vName) {
    const acc = accounts.find(a => a.id === aId);
    if (acc) upsertAccount({ ...acc, vas: acc.vas.filter(v => v !== vName) });
  }
  function addVA(aId) {
    if (!newVA.trim()) return;
    const acc = accounts.find(a => a.id === aId);
    if (acc) upsertAccount({ ...acc, vas: [...(acc.vas || []), newVA.trim()] });
    setNewVA("");
    setAddingVA(null);
  }
  function delAcc(id) {
    const { remove: removeAccount } = { remove: (i) => supabase.from("accounts").delete().eq("id", i) };
    removeAccount(id);
  }
  function addAccount() {
    if (!newAcc.agency.trim()) return;
    upsertAccount({ id: Date.now(), ...newAcc });
    setNewAcc({
      agency: "",
      contact: "",
      vas: [],
      status: "Active",
      phone: "",
      state: "",
      notes: "",
    });
    setAdding(false);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder=" Search agency, contact, or VA…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 220px",
            padding: "8px 12px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            fontSize: 13,
          }}
        />
        {["All", "Active", "Cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              background: statusFilter === s ? C.dark : C.gray,
              color: statusFilter === s ? C.white : C.black,
              fontWeight: statusFilter === s ? 600 : 400,
            }}
          >
            {s}
          </button>
        ))}
        <span style={{ padding: "8px 0", fontSize: 13, color: C.muted, alignSelf: "center" }}>
          {visible.length} accounts
        </span>
        <button
          onClick={() => setAdding((v) => !v)}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: C.red,
            color: C.white,
            fontWeight: 600,
            fontSize: 13,
            marginLeft: "auto",
          }}
        >
          + Add Account
        </button>
      </div>

      {adding && (
        <div
          style={{
            background: C.gray,
            borderRadius: 10,
            padding: 14,
            marginBottom: 14,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <input
            placeholder="Agency *"
            value={newAcc.agency}
            onChange={(e) => setNewAcc((p) => ({ ...p, agency: e.target.value }))}
            style={{
              flex: "2 1 190px",
              padding: "7px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              fontSize: 13,
            }}
          />
          <input
            placeholder="Contact"
            value={newAcc.contact}
            onChange={(e) => setNewAcc((p) => ({ ...p, contact: e.target.value }))}
            style={{
              flex: "1 1 140px",
              padding: "7px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              fontSize: 13,
            }}
          />
          <input
            placeholder="Phone"
            value={newAcc.phone}
            onChange={(e) => setNewAcc((p) => ({ ...p, phone: e.target.value }))}
            style={{
              flex: "0 1 125px",
              padding: "7px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              fontSize: 13,
            }}
          />
          <input
            placeholder="State/TZ"
            value={newAcc.state}
            onChange={(e) => setNewAcc((p) => ({ ...p, state: e.target.value }))}
            style={{
              flex: "0 1 105px",
              padding: "7px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              fontSize: 13,
            }}
          />
          <select
            value={newAcc.status}
            onChange={(e) => setNewAcc((p) => ({ ...p, status: e.target.value }))}
            style={{
              flex: "0 1 105px",
              padding: "7px 10px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              fontSize: 13,
            }}
          >
            <option>Active</option>
            <option>Cancelled</option>
          </select>
          <button
            onClick={addAccount}
            style={{
              padding: "7px 16px",
              borderRadius: 6,
              border: "none",
              background: C.dark,
              color: C.white,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Save
          </button>
          <button
            onClick={() => setAdding(false)}
            style={{
              padding: "7px 12px",
              borderRadius: 6,
              border: `1px solid ${C.border}`,
              background: C.white,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map((a) => {
          const exp = expandedId === a.id;
          const isAlert = a.notes && a.notes.includes("!");
          return (
            <div
              key={a.id}
              style={{
                background: C.white,
                borderRadius: 10,
                border: `1px solid ${isAlert ? C.red : C.border}`,
                overflow: "hidden",
              }}
            >
              {/* Summary row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  cursor: "pointer",
                }}
                onClick={() => setExpandedId(exp ? null : a.id)}
              >
                <span style={{ fontSize: 14, color: C.muted, userSelect: "none" }}>
                  {exp ? "" : ""}
                </span>
                <div style={{ flex: "2 1 170px", fontWeight: 600, fontSize: 13 }} onClick={e => e.stopPropagation()}>
                  <InlineEdit value={a.agency} onSave={v => upAcc(a.id, "agency", v)} style={{ fontWeight: 600, fontSize: 13 }} />
                </div>
                <div style={{ flex: "1 1 110px", fontSize: 12, color: C.muted }} onClick={e => e.stopPropagation()}>
                  <InlineEdit value={a.contact || "—"} onSave={v => upAcc(a.id, "contact", v)} style={{ fontSize: 12, color: C.muted }} />
                </div>
                <div style={{ flex: "0 0 75px" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: a.status === "Active" ? "#D1FAE5" : "#FEE2E2",
                      color: a.status === "Active" ? "#065F46" : "#991B1B",
                    }}
                  >
                    {a.status}
                  </span>
                </div>
                <div style={{ flex: "0 0 65px", fontSize: 12, color: C.muted }}>
                  {a.vas.length} VA{a.vas.length !== 1 ? "s" : ""}
                </div>
                <div style={{ flex: "1 1 100px", fontSize: 12, color: C.muted }} onClick={e => e.stopPropagation()}>
                  <InlineEdit value={a.phone || "—"} onSave={v => upAcc(a.id, "phone", v)} style={{ fontSize: 12, color: C.teal }} />
                </div>
                <div style={{ flex: "0 0 85px", fontSize: 12, color: C.muted }} onClick={e => e.stopPropagation()}>
                  <InlineEdit value={a.state || "—"} onSave={v => upAcc(a.id, "state", v)} style={{ fontSize: 12, color: C.muted }} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    delAcc(a.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.muted,
                    fontSize: 18,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              {/* Expanded panel */}
              {exp && (
                <div
                  style={{ borderTop: `1px solid ${C.border}`, padding: 16, background: C.gray }}
                >
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {/* VA list — numbered, with last check-in per VA */}
                    <div style={{ flex: "2 1 300px" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 12,
                          color: C.muted,
                          marginBottom: 10,
                          letterSpacing: "0.05em",
                        }}
                      >
                        VIRTUAL ASSISTANTS ({a.vas.length})
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        {a.vas.map((va, idx) => {
                          const ci = getVACI(va);
                          return (
                            <div
                              key={va}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                background: C.white,
                                borderRadius: 8,
                                padding: "8px 12px",
                                border: `1px solid ${C.border}`,
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: 11,
                                  color: C.muted,
                                  minWidth: 22,
                                  flexShrink: 0,
                                }}
                              >
                                #{idx + 1}
                              </span>
                              <span style={{ fontWeight: 500, fontSize: 13, flex: "1 1 120px" }}>
                                {va}
                              </span>
                              {ci ? (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    fontSize: 11,
                                    flexShrink: 0,
                                  }}
                                >
                                  <span style={{ color: C.muted }}>{ci.week}</span>
                                  <span style={{ fontWeight: 700, color: sc(ci.score) }}>
                                    {ci.score !== null ? `${ci.score}%` : "No score"}
                                  </span>
                                  <AMBadge am={ci.am} />
                                </div>
                              ) : (
                                <span style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}>
                                  No check-in on record
                                </span>
                              )}
                              <button
                                onClick={() => removeVA(a.id, va)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: C.muted,
                                  fontSize: 14,
                                  padding: 0,
                                  lineHeight: 1,
                                  flexShrink: 0,
                                }}
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                        {addingVA === a.id ? (
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              alignItems: "center",
                              padding: "4px 0",
                            }}
                          >
                            <input
                              autoFocus
                              value={newVA}
                              onChange={(e) => setNewVA(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") addVA(a.id);
                                if (e.key === "Escape") setAddingVA(null);
                              }}
                              placeholder="VA full name"
                              style={{
                                padding: "5px 8px",
                                borderRadius: 6,
                                border: `1px solid ${C.red}`,
                                fontSize: 13,
                                flex: 1,
                              }}
                            />
                            <button
                              onClick={() => addVA(a.id)}
                              style={{
                                background: C.dark,
                                color: C.white,
                                border: "none",
                                borderRadius: 6,
                                padding: "5px 12px",
                                cursor: "pointer",
                                fontSize: 13,
                              }}
                            >
                              Add
                            </button>
                            <button
                              onClick={() => setAddingVA(null)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: C.muted,
                                fontSize: 16,
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingVA(a.id)}
                            style={{
                              background: "none",
                              border: `1px dashed ${C.border}`,
                              borderRadius: 8,
                              padding: "6px 14px",
                              cursor: "pointer",
                              fontSize: 12,
                              color: C.muted,
                              textAlign: "left",
                            }}
                          >
                            + Add VA
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ flex: "1 1 180px" }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 12,
                          color: C.muted,
                          marginBottom: 10,
                          letterSpacing: "0.05em",
                        }}
                      >
                        DETAILS
                      </div>
                      <div
                        style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}
                      >
                        {[
                          ["Contact", a.contact, "contact"],
                          ["Phone", a.phone, "phone"],
                          ["State/TZ", a.state, "state"],
                        ].map(([label, val, field]) => (
                          <div
                            key={field}
                            style={{ display: "flex", gap: 8, alignItems: "center" }}
                          >
                            <span
                              style={{ color: C.muted, width: 68, fontSize: 12, flexShrink: 0 }}
                            >
                              {label}
                            </span>
                            <InlineEdit value={val || ""} onSave={(v) => upAcc(a.id, field, v)} />
                          </div>
                        ))}
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ color: C.muted, width: 68, fontSize: 12, flexShrink: 0 }}>
                            Status
                          </span>
                          <select
                            value={a.status}
                            onChange={(e) => upAcc(a.id, "status", e.target.value)}
                            style={{
                              border: `1px solid ${C.border}`,
                              borderRadius: 6,
                              padding: "3px 8px",
                              fontSize: 13,
                            }}
                          >
                            <option>Active</option>
                            <option>Cancelled</option>
                          </select>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ color: C.muted, width: 68, fontSize: 12, flexShrink: 0 }}>
                            Notes
                          </span>
                          <InlineEdit
                            value={a.notes || ""}
                            onSave={(v) => upAcc(a.id, "notes", v)}
                            multiline
                            style={{ color: isAlert ? C.red : C.dark, fontSize: 12 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
         Click a row to expand. Each VA shows their last check-in from Island KPI data. Click any
        field to edit.
      </p>
    </div>
  );
}

//  WORKFLOW & NOTES TAB 
const EMAIL_STARS = [
  { icon: "", color: "#F59E0B", bg: "#FFFBEB", border: "#FCD34D", label: "File Away",    desc: "Archive / file the email away" },
  { icon: "", color: "#059669", bg: "#F0FDF4", border: "#6EE7B7", label: "Sales",        desc: "Sales-related email" },
  { icon: "", color: "#1D4ED8", bg: "#EFF6FF", border: "#93C5FD", label: "IT",           desc: "IT-related email" },
  { icon: "", color: "#B45309", bg: "#FFFBEB", border: "#FCD34D", label: "VA Concerns",  desc: "VA concern — needs attention", square: true, sqColor: "#FCD34D" },
  { icon: "", color: "#7C3AED", bg: "#F5F3FF", border: "#C4B5FD", label: "$ Concerns",   desc: "Financial / billing concern", square: true, sqColor: "#C4B5FD" },
  { icon: "", color: "#DC2626", bg: "#FFF1F1", border: "#FCA5A5", label: "High Priority", desc: "Tell Niccole immediately when this email arrives", square: true, sqColor: "#FCA5A5" },
  { icon: "ℹ", color: "#1D4ED8", bg: "#EFF6FF", border: "#93C5FD", label: "1-off Work",   desc: "One-off task or work item", square: true, sqColor: "#93C5FD" },
];

function WorkflowTab() {
  const C = useTheme();
  const [workflow, setWorkflow] = useState(WORKFLOW);
  const [emailStars, setEmailStars] = useState(EMAIL_STARS);

  function updateItem(si, ii, val) {
    setWorkflow(prev => prev.map((s, i) => i !== si ? s : {
      ...s, items: s.items.map((item, j) => j !== ii ? item : val)
    }));
  }
  function updateStar(si, field, val) {
    setEmailStars(prev => prev.map((s, i) => i !== si ? s : { ...s, [field]: val }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {workflow.map((s, si) => (
        <div key={s.time} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "12px 18px", background: s.color, color: C.white, fontWeight: 700, fontSize: 14 }}>
            {s.emoji} <EditableText value={s.time} onSave={v => setWorkflow(prev => prev.map((w, i) => i !== si ? w : { ...w, time: v }))} />
          </div>
          <ul style={{ margin: 0, padding: "12px 18px 12px 32px", display: "flex", flexDirection: "column", gap: 8 }}>
            {s.items.map((item, ii) => (
              <li key={ii} style={{ fontSize: 13, lineHeight: 1.6 }}>
                <InlineEdit value={item} onSave={v => updateItem(si, ii, v)} style={{ fontSize: 13, width: "100%" }} />
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Email Star Codes */}
      <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", background: "#92400E", color: C.white, fontWeight: 700, fontSize: 14 }}>
          ⭐ Email Star Codes — Niccole's System
        </div>
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {emailStars.map((s, si) => (
            <div key={si} style={{ background: s.bg, border: `2px solid ${s.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              {s.square ? (
                <div style={{ width: 36, height: 36, borderRadius: 6, background: s.sqColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, fontWeight: 900 }}>
                  {s.icon}
                </div>
              ) : (
                <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{s.icon}</div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: s.color, marginBottom: 3 }}>
                  <InlineEdit value={s.label} onSave={v => updateStar(si, "label", v)} style={{ fontWeight: 700, fontSize: 13, color: s.color }} />
                </div>
                <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
                  <InlineEdit value={s.desc} onSave={v => updateStar(si, "desc", v)} style={{ fontSize: 12, color: "#374151" }} multiline />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GeneralNotesTab() {
  const C = useTheme();
  const { rows: notes, upsert: upsertNote, remove: removeNote } = useSupabaseTable("notes", "id", NOTES);
  const { rows: shipping, upsert: upsertShipping } = useSupabaseTable("shipping");
  const { rows: rawAgencyNotes, replace: replaceAgencyNotes } = useSupabaseTable("agency_notes");
  const [adding, setAdding] = useState(false);
  const [newNote, setNewNote] = useState({ label: "", value: "" });
  const [copiedShipping, setCopiedShipping] = useState("");

  // Reconstruct agencyNotes grouped structure from flat DB rows
  const agencyNotes = useMemo(() => {
    const sections = [...new Set(rawAgencyNotes.map(r => r.section))];
    return sections.map(section => ({
      section,
      items: rawAgencyNotes
        .filter(r => r.section === section)
        .sort((a, b) => a.item_index - b.item_index)
        .map(r => ({ text: r.text, flag: r.flag }))
    }));
  }, [rawAgencyNotes]);

  function updateAgencyItem(gi, ii, newText) {
    const group = agencyNotes[gi];
    if (!group) return;
    const flat = rawAgencyNotes
      .filter(r => r.section === group.section)
      .sort((a, b) => a.item_index - b.item_index);
    const row = flat[ii];
    if (row) {
      const { replace: _, ...rest } = row;
      supabase.from("agency_notes").update({ text: newText }).eq("id", row.id).then(() => {});
      // optimistic update via replaceAgencyNotes not needed — hook re-fetches on mount only
      // for now just update locally via replace
      replaceAgencyNotes(rawAgencyNotes.map(r => r.id === row.id ? { ...r, text: newText } : r));
    }
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Tab description */}
      <div style={{ background: "#EFF6FF", border: "1px solid #93C5FD", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#1E3A5F", lineHeight: 1.6 }}>
        <strong> General Notes</strong> — Your quick-reference hub for important contacts, addresses, shipping info, and agency-level notes you need handy at all times. Everything here is editable so you can keep it up to date.
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setAdding(v => !v)} style={{ padding: "7px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: C.purple, color: C.white, fontWeight: 600, fontSize: 13 }}>
          {adding ? " Cancel" : "+ Add Note"}
        </button>
      </div>
      {adding && (
        <div style={{ background: C.white, border: `2px solid ${C.purple}`, borderRadius: 10, padding: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <input placeholder="Label" value={newNote.label} onChange={e => setNewNote(p => ({ ...p, label: e.target.value }))}
            style={{ flex: "0 1 200px", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
          <input placeholder="Value" value={newNote.value} onChange={e => setNewNote(p => ({ ...p, value: e.target.value }))}
            style={{ flex: "2 1 240px", padding: "7px 10px", borderRadius: 6, border: `1px solid ${C.border}`, fontSize: 13 }} />
          <button onClick={() => { if (!newNote.label.trim()) return; upsertNote({ id: Date.now(), ...newNote }); setNewNote({ label: "", value: "" }); setAdding(false); }}
            style={{ padding: "7px 18px", borderRadius: 6, border: "none", background: C.purple, color: C.white, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Save</button>
        </div>
      )}
      <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", background: C.purple, color: C.white, fontWeight: 700, fontSize: 14 }}>
           Key References
        </div>
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {notes.map((n, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "8px 10px", background: C.gray, borderRadius: 6, alignItems: "flex-start" }}>
              <span style={{ fontWeight: 600, fontSize: 12, color: C.muted, minWidth: 200, whiteSpace: "nowrap" }}>{n.label}</span>
              <InlineEdit value={n.value} onSave={v => upsertNote({ ...n, value: v })} style={{ fontSize: 13 }} />
              <button onClick={() => removeNote(n.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16, marginLeft: "auto", flexShrink: 0 }}>×</button>
            </div>
          ))}
          {notes.length === 0 && <div style={{ padding: 16, textAlign: "center", color: C.muted, fontSize: 13 }}>No notes yet. Add one above.</div>}
        </div>
      </div>
      <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}> Click any value to edit inline.</p>

      {/* Shipping Details */}
      <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", background: "#0369A1", color: C.white, fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span> PH Shipping Details</span>
          <button
            onClick={() => {
              const text = shipping.map(r => `${r.label}: ${r.value}`).join("\n");
              navigator.clipboard.writeText(text).then(() => {
                setCopiedShipping("all");
                setTimeout(() => setCopiedShipping(""), 1800);
              }).catch(() => {});
            }}
            style={{ padding: "4px 14px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.4)", background: copiedShipping === "all" ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)", color: C.white, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            {copiedShipping === "all" ? " Copied!" : "Copy All"}
          </button>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {shipping.map((row, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "8px 12px", background: C.gray, borderRadius: 6, alignItems: "flex-start" }}>
              <span style={{ fontWeight: 600, fontSize: 12, color: C.muted, minWidth: 130, flexShrink: 0 }}>{row.label}</span>
              <div style={{ flex: 1 }}>
                <InlineEdit value={row.value} onSave={v => upsertShipping({ ...row, value: v })} style={{ fontSize: 13 }} />
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(row.value).then(() => {
                    setCopiedShipping(i);
                    setTimeout(() => setCopiedShipping(""), 1500);
                  }).catch(() => {});
                }}
                style={{ padding: "3px 10px", borderRadius: 6, border: `1px solid ${C.border}`, background: copiedShipping === i ? "#D1FAE5" : C.white, cursor: "pointer", fontSize: 11, fontWeight: 600, color: copiedShipping === i ? C.green : C.muted, whiteSpace: "nowrap", flexShrink: 0 }}>
                {copiedShipping === i ? " Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Agency Notes */}
      <div style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", background: C.teal, color: C.white, fontWeight: 700, fontSize: 14 }}>
           Agency Notes
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {agencyNotes.map((group, gi) => (
            <div key={gi}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: C.dark }}>{group.section}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {group.items.map((item, ii) => (
                  <div key={ii} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "7px 12px", borderRadius: 6,
                    background: item.flag === "inactive" ? "#FEF2F2" : C.gray,
                    border: `1px solid ${item.flag === "inactive" ? "#FCA5A5" : C.border}`,
                  }}>
                    {item.flag === "inactive" && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#DC2626", background: "#FEE2E2", padding: "1px 7px", borderRadius: 99, whiteSpace: "nowrap", flexShrink: 0 }}>Inactive</span>
                    )}
                    <InlineEdit
                      value={item.text}
                      onSave={v => updateAgencyItem(gi, ii, v)}
                      style={{ fontSize: 13, color: item.flag === "inactive" ? "#991B1B" : C.dark, flex: 1 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function ClaritySellingPanel() {
  const C = useTheme();
  const [slideIdx, setSlideIdx] = useState(0);
  const slide = SALES_SLIDES[slideIdx];
  const st = {
    cover: { bg: C.dark, fg: C.white },
    quote: { bg: C.red, fg: C.white },
    summary: { bg: C.teal, fg: C.white },
    text: { bg: C.white, fg: C.black },
    list: { bg: C.white, fg: C.black },
    map: { bg: "#1a1a2e", fg: "#e0e0ff" },
    "before-after": { bg: C.white, fg: C.black },
    prospect: { bg: "#f0f9ff", fg: C.black },
  }[slide.type] || { bg: C.white, fg: C.black };
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        overflow: "hidden",
      }}
    >
        <div
          style={{
            padding: "12px 18px",
            background: C.blue,
            color: C.white,
            fontWeight: 700,
            fontSize: 14,
          }}
        >
           Sales Training — Clarity Selling by Bryan Ostermiller
        </div>
        <div style={{ padding: 16 }}>
          <div
            style={{
              background: st.bg,
              color: st.fg,
              borderRadius: 10,
              padding: 26,
              minHeight: 180,
              marginBottom: 14,
              border: `1px solid ${C.border}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: st.fg === "white" ? "rgba(255,255,255,0.5)" : C.muted,
                marginBottom: 6,
                letterSpacing: "0.1em",
              }}
            >
              SLIDE {slideIdx + 1} / {SALES_SLIDES.length}
              {slide.type === "prospect" && (
                <span
                  style={{
                    marginLeft: 8,
                    background: C.red,
                    color: C.white,
                    padding: "1px 8px",
                    borderRadius: 99,
                    fontSize: 10,
                  }}
                >
                  PROSPECT TYPE
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: slide.type === "cover" ? 24 : 16,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              {slide.title}
            </div>
            {slide.subtitle && (
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>{slide.subtitle}</div>
            )}
            {slide.content && (
              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.8,
                  whiteSpace: "pre-line",
                  fontFamily: slide.type === "map" ? "monospace" : "inherit",
                }}
              >
                {slide.content}
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <button
              disabled={slideIdx === 0}
              onClick={() => setSlideIdx((v) => v - 1)}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: slideIdx === 0 ? C.gray : C.dark,
                color: slideIdx === 0 ? C.muted : C.white,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              ← Prev
            </button>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
              {SALES_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIdx(i)}
                  style={{
                    width: i === slideIdx ? 22 : 8,
                    height: 8,
                    borderRadius: 99,
                    border: "none",
                    cursor: "pointer",
                    background: i === slideIdx ? C.red : C.border,
                    transition: "width 0.2s",
                    padding: 0,
                  }}
                />
              ))}
            </div>
            <button
              disabled={slideIdx === SALES_SLIDES.length - 1}
              onClick={() => setSlideIdx((v) => v + 1)}
              style={{
                padding: "8px 20px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: slideIdx === SALES_SLIDES.length - 1 ? C.gray : C.red,
                color: slideIdx === SALES_SLIDES.length - 1 ? C.muted : C.white,
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Next →
            </button>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 5, flexWrap: "wrap" }}>
            {SALES_SLIDES.map((s, i) => (
              <button
                key={i}
                onClick={() => setSlideIdx(i)}
                style={{
                  padding: "3px 9px",
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: slideIdx === i ? C.red : C.white,
                  color: slideIdx === i ? C.white : C.dark,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: slideIdx === i ? 600 : 400,
                }}
              >
                {i + 1}. {s.title.substring(0, 18)}
                {s.title.length > 18 ? "…" : ""}
              </button>
            ))}
          </div>
        </div>
    </div>
  );
}


function WordTrackPanel() {
  const C = useTheme();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const categories = ["All", ...new Set(WORD_TRACK.map((s) => s.category))];

  const visible = WORD_TRACK.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      (s.intro || "").toLowerCase().includes(q) ||
      (s.bullets || []).some((b) => b.toLowerCase().includes(q)) ||
      (s.points || []).some((p) => p.toLowerCase().includes(q)) ||
      (s.rows || []).some((r) => r.some((cell) => cell.toLowerCase().includes(q)));
    const matchesCat = catFilter === "All" || s.category === catFilter;
    return matchesSearch && matchesCat;
  });

  function renderFlow(flowItems, depth = 0) {
    const colorMap = {
      blue: { bg: "#DBEAFE", fg: "#1E40AF" },
      amber: { bg: "#FEF3C7", fg: "#92400E" },
      red: { bg: "#FEE2E2", fg: "#991B1B" },
      green: { bg: "#D1FAE5", fg: "#065F46" },
      neutral: { bg: "#F4F4F6", fg: "#24242D" },
    };
    return flowItems.map((item, i) => {
      const cs = colorMap[item.color] || colorMap.neutral;
      return (
        <div key={i} style={{ marginLeft: depth * 20, marginBottom: 8 }}>
          <div
            style={{
              background: cs.bg,
              color: cs.fg,
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 600,
              display: "inline-block",
            }}
          >
            {item.step || item.result}
          </div>
          {item.branches &&
            item.branches.map((b, bi) => (
              <div key={bi} style={{ marginLeft: 20, marginTop: 6 }}>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginRight: 6 }}>
                  {b.label} →
                </span>
                {renderFlow([b], depth + 1)}
              </div>
            ))}
        </div>
      );
    });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder=" Search topics, keywords, questions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 220px",
            padding: "8px 12px",
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            fontSize: 13,
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              background: catFilter === cat ? C.dark : C.gray,
              color: catFilter === cat ? C.white : C.black,
              fontWeight: catFilter === cat ? 600 : 400,
              whiteSpace: "nowrap",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {visible.map((section) => (
          <div
            key={section.id}
            style={{
              background: C.white,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "10px 16px",
                background: C.teal,
                color: C.white,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14 }}>{section.title}</span>
              <span
                style={{
                  fontSize: 10,
                  background: "rgba(255,255,255,0.2)",
                  padding: "2px 8px",
                  borderRadius: 99,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
              >
                {section.category}
              </span>
            </div>
            <div style={{ padding: 16 }}>
              {section.intro && (
                <p style={{ fontSize: 13, lineHeight: 1.6, color: C.dark, marginTop: 0, marginBottom: 12 }}>
                  {section.intro}
                </p>
              )}

              {section.type === "talkpoints" && (
                <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {section.bullets.map((b, i) => (
                    <li key={i} style={{ fontSize: 13, lineHeight: 1.6 }}>
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              {section.type === "guide" && (
                <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {section.points.map((p, i) => (
                    <li key={i} style={{ fontSize: 13, lineHeight: 1.6 }}>
                      {p}
                    </li>
                  ))}
                </ul>
              )}

              {section.flow && (
                <div style={{ marginTop: 14 }}>{renderFlow(section.flow)}</div>
              )}

              {section.type === "qa" && (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 600 }}>
                    <thead>
                      <tr style={{ background: C.gray }}>
                        {section.cols.map((c, i) => (
                          <th
                            key={i}
                            style={{
                              padding: "8px 10px",
                              textAlign: "left",
                              fontSize: 11,
                              color: C.muted,
                              fontWeight: 700,
                              borderBottom: `1px solid ${C.border}`,
                            }}
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: `1px solid ${C.border}` }}>
                          {row.map((cell, ci) => (
                            <td key={ci} style={{ padding: "8px 10px", verticalAlign: "top", lineHeight: 1.5 }}>
                              {cell || <span style={{ color: C.muted }}>—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {section.notes && (
                <div
                  style={{
                    marginTop: 12,
                    background: "#FEF3C7",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 12,
                    color: "#92400E",
                  }}
                >
                   {section.notes}
                </div>
              )}
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: C.muted, fontSize: 13 }}>
            No matching topics found.
          </div>
        )}
      </div>
    </div>
  );
}

function SalesTrainingTab() {
  const C = useTheme();
  const [resource, setResource] = useState("clarity");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <button
          onClick={() => setResource("clarity")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: resource === "clarity" ? 700 : 400,
            background: resource === "clarity" ? C.dark : C.gray,
            color: resource === "clarity" ? C.white : C.muted,
          }}
        >
           Clarity Selling
        </button>
        <button
          onClick={() => setResource("wordtrack")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: resource === "wordtrack" ? 700 : 400,
            background: resource === "wordtrack" ? C.dark : C.gray,
            color: resource === "wordtrack" ? C.white : C.muted,
          }}
        >
           VA & AM Word Track
        </button>
      </div>
      {resource === "clarity" && <ClaritySellingPanel />}
      {resource === "wordtrack" && <WordTrackPanel />}
    </div>
  );
}

//  APP SHELL 
const TABS = [
  { id: "tasks",        label: " Tasks",               locked: true },
  { id: "kpi",          label: " Island KPIs",         locked: true },
  { id: "hubspot",      label: " HubSpot Links",       locked: true },
  { id: "accounts",     label: " Niccole's Accounts",  locked: true },
  { id: "workflow",     label: " Workflow",             locked: false },
  { id: "generalnotes", label: " General Notes",        locked: false },
  { id: "notes",        label: " Sales Training",       locked: false },
];

export default function GellApp() {
  const [activeTab, setActiveTab] = useState("tasks");
  const { rows: checkins } = useSupabaseTable("checkins", "id", INIT_CHECKINS);
  const [themeName, setThemeName] = useState("lava");
  const [tabs, setTabs] = useState(TABS);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [appTitle, setAppTitle] = useState("Gell's Dashboard");
  const [appSubtitle, setAppSubtitle] = useState("LAVA AUTOMATION — CS OPERATIONS");
  const theme = THEMES[themeName];
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const isFriday = new Date().getDay() === 5;

  function onDragStart(i) { setDragIdx(i); }
  function onDragOver(e, i) { e.preventDefault(); setDragOverIdx(i); }
  function onDrop(i) {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...tabs];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setTabs(next);
    setDragIdx(null);
    setDragOverIdx(null);
  }
  function onDragEnd() { setDragIdx(null); setDragOverIdx(null); }

  return (
    <ThemeCtx.Provider value={theme}>
    <div style={{ minHeight: "100vh", background: theme.bg, fontFamily: "Poppins, system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: theme.headerBg, color: "#FFFFFF", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", marginBottom: 2 }}>
            <EditableText value={appSubtitle} onSave={setAppSubtitle} style={{ fontSize: 10, letterSpacing: "0.12em" }} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            <EditableText value={appTitle} onSave={setAppTitle} style={{ fontSize: 20, fontWeight: 700 }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          {/* Theme picker */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>THEME</span>
            {Object.entries(THEMES).map(([key, t]) => (
              <button key={key} onClick={() => setThemeName(key)} title={t.name}
                style={{ width: 20, height: 20, borderRadius: "50%", background: t.red, padding: 0, cursor: "pointer",
                  border: themeName === key ? "3px solid rgba(255,255,255,0.9)" : "2px solid rgba(255,255,255,0.25)",
                  boxShadow: themeName === key ? "0 0 0 2px rgba(0,0,0,0.25)" : "none",
                }}
              />
            ))}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{today}</div>
            {isFriday && <div style={{ marginTop: 4, background: theme.red, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 99 }}> Friday — Prep Island KPIs!</div>}
          </div>
        </div>
      </div>

      {/* Tab nav — draggable */}
      <div style={{ background: theme.cardBg, borderBottom: `1px solid ${theme.border}`, padding: "0 12px", display: "flex", gap: 0, overflowX: "auto", userSelect: "none" }}>
        {tabs.map((tab, i) => {
          const isActive  = activeTab === tab.id;
          const isDragged = dragIdx === i;
          const isOver    = dragOverIdx === i && dragIdx !== i;
          return (
            <div
              key={tab.id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={e => onDragOver(e, i)}
              onDrop={() => onDrop(i)}
              onDragEnd={onDragEnd}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "14px 16px",
                cursor: "grab",
                fontSize: 13,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? theme.tabActiveColor : theme.muted,
                borderBottom: isActive ? `2px solid ${theme.tabActiveBorder}` : "2px solid transparent",
                borderLeft: isOver ? `3px solid ${theme.tabActiveBorder}` : "3px solid transparent",
                whiteSpace: "nowrap",
                opacity: isDragged ? 0.4 : 1,
                background: isDragged ? theme.border : "none",
                borderRadius: "4px 4px 0 0",
                transition: "border-color 0.1s, opacity 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 11, color: theme.muted, opacity: 0.5, cursor: "grab" }}></span>
              <span style={{ color: isActive ? theme.tabActiveColor : theme.muted, fontWeight: isActive ? 700 : 400, fontSize: 13 }}>
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
        {activeTab === "tasks"        && <TasksTab />}
        {activeTab === "kpi"          && <KPITab />}
        {activeTab === "hubspot"      && <HubSpotTab />}
        {activeTab === "accounts"     && <AccountsTab checkins={checkins} />}
        {activeTab === "workflow"     && <WorkflowTab />}
        {activeTab === "generalnotes" && <GeneralNotesTab />}
        {activeTab === "notes"        && <SalesTrainingTab />}
      </div>
    </div>
    </ThemeCtx.Provider>
  );
}
