"use client";

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

const INIT_TL_ATO = [
  {id:1,start:"7/8/2020",vaName:"King Paje",vaTag:"Gen VA",status:"Active",vaEmail:"kingrayzpaje29@gmail.com",company:"Aspen Insurance Agency",agencyPOC:"Jon Goldenberg",timeZone:"CO - MDT",tl:"Martin",am:"Alicia",salesRep:"Austin"},
  {id:2,start:"8/25/2020",vaName:"Daneca Mary Joy",vaTag:"Gen VA",status:"Active",vaEmail:"danecaalegria@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:3,start:"9/9/2020",vaName:"Jennifer Pelle",vaTag:"Gen VA",status:"Active",vaEmail:"jennifer26pelle@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:4,start:"9/14/2020",vaName:"Nikko Lim",vaTag:"Gen VA",status:"Active",vaEmail:"kunilim5@gmail.com",company:"Grimes Insurance Agency/McMichael Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:5,start:"1/28/2021",vaName:"Marc Nadine",vaTag:"Gen VA",status:"Active",vaEmail:"nhad_shimmer14@yahoo.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:6,start:"3/8/2021",vaName:"Joshua Poe Cadano",vaTag:"Gen VA",status:"Resigned",vaEmail:"joshua.cadano.3@gmail.com",company:"Turbodial",agencyPOC:"",timeZone:"",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:7,start:"3/15/2021",vaName:"Bobby Lyhne",vaTag:"Gen VA",status:"Active",vaEmail:"bobbylyhnem@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:8,start:"3/15/2021",vaName:"Mark Caballles",vaTag:"Gen VA",status:"Active",vaEmail:"standupbenice@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:9,start:"4/12/2021",vaName:"Sebastian Dominique",vaTag:"Gen VA",status:"Resigned",vaEmail:"bastipilay77@gmail.com",company:"Raleigh Insurance Group",agencyPOC:"Daniel Rohrbaugh",timeZone:"NC- EST",tl:"Rezyl",am:"Niccole",salesRep:"Austin"},
  {id:10,start:"4/19/2021",vaName:"Ma. Mikaela Alonso",vaTag:"Gen VA",status:"Active",vaEmail:"mikaelaalonso0129@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:11,start:"5/19/2021",vaName:"Karla Mae Jardeloza",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"karlajardeloza18@gmail.com",company:"Atlantic Insurance Agency",agencyPOC:"",timeZone:"FL - EST",tl:"",am:"Cancelled",salesRep:"Austin"},
  {id:12,start:"5/26/2021",vaName:"Samuel Blanco",vaTag:"Gen VA",status:"Active",vaEmail:"samblancojr89@gmail.com",company:"Trailstone Insurance Group",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:13,start:"6/14/2021",vaName:"Ella Marie",vaTag:"Gen VA",status:"Active",vaEmail:"jellamarie18@gmail.com",company:"Trailstone Insurance Group",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:14,start:"7/28/2021",vaName:"Crisben Ian Barra",vaTag:"Gen VA",status:"Terminated",vaEmail:"crisbenian11@gmail.com",company:"Blackwell Insurance Agency",agencyPOC:"Leigh Zellmer / Ken Haraughty",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Austin"},
  {id:15,start:"8/3/2021",vaName:"Elvic Trixie Lynn",vaTag:"Gen VA",status:"Resigned",vaEmail:"elvictrixielynnroble@gmail.com",company:"Guardian insurance LLC",agencyPOC:"Chris Dupill",timeZone:"MA - EST",tl:"Rezyl",am:"Niccole",salesRep:"Austin"},
  {id:16,start:"8/16/2021",vaName:"Kristian  Rhey Piodos",vaTag:"Gen VA",status:"Active",vaEmail:"krpiodos@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:17,start:"8/23/2021",vaName:"Andrea Magpantay",vaTag:"Gen VA",status:"Active",vaEmail:"acmagpantay4@gmail.com",company:"Trailstone Insurance Group",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:18,start:"8/23/2021",vaName:"John Michael Clarin",vaTag:"Gen VA",status:"Active",vaEmail:"clarin_4@yahoo.com",company:"Priority Risk Management",agencyPOC:"Mark Shoultz",timeZone:"IN - EST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:19,start:"10/4/2021",vaName:"Melody David",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"Melodydavid.1994@gmail.com",company:"The Thompson Group",agencyPOC:"Sherri Logan",timeZone:"IN - EST",tl:"",am:"Cancelled",salesRep:"Austin"},
  {id:20,start:"10/19/2021",vaName:"Mark Jayson Javier",vaTag:"Gen VA",status:"Terminated",vaEmail:"seth.zephyr@gmail.com",company:"Agency Automate",agencyPOC:"Bill Jenkins",timeZone:"MN - CST",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:21,start:"11/1/2021",vaName:"Gee-chelle Mariexris Albellera",vaTag:"Gen VA",status:"Active",vaEmail:"geechellea@gmail.com",company:"D&E Insurance Group",agencyPOC:"Eric Newendrop",timeZone:"AZ - MDT",tl:"Martin",am:"Alicia",salesRep:"Austin"},
  {id:22,start:"11/8/2021",vaName:"Liezel Ann Corlet",vaTag:"Gen VA",status:"Active",vaEmail:"la.corlet@gmail.com",company:"Foundations Insurance",agencyPOC:"Rebecca Richardson",timeZone:"CO - MDT",tl:"Martin",am:"Karla",salesRep:"Johnny"},
  {id:23,start:"11/15/2021",vaName:"Patrick Jardinel",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"pdjardinel@gmail.com",company:"Rieder Wellness Ltd./LAVA Automation",agencyPOC:"",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:24,start:"12/27/2021",vaName:"Denver Eneluna",vaTag:"Gen VA",status:"Active",vaEmail:"dusteneluna@gmail.com",company:"Associated Insurance Services",agencyPOC:"Kimberly Mathews",timeZone:"IN - EST",tl:"Rezyl",am:"Karla",salesRep:"Austin"},
  {id:25,start:"1/10/2022",vaName:"Anna Katrina Cabatingan",vaTag:"Gen VA",status:"Active",vaEmail:"katrina1917@gmail.com",company:"Prostar Insurance",agencyPOC:"John Pfeil",timeZone:"WA - PST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:26,start:"2/7/2022",vaName:"Robert Lucio Calope",vaTag:"Gen VA",status:"Active",vaEmail:"robertcalope@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:27,start:"2/7/2022",vaName:"Jason Cedric Xavier",vaTag:"Gen VA",status:"Active",vaEmail:"jasoncedricxavier@gmail.com",company:"Prostar Insurance",agencyPOC:"John Pfeil",timeZone:"WA - PST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:28,start:"3/21/2022",vaName:"MARY ROSE JOFEL",vaTag:"Gen VA",status:"Terminated",vaEmail:"mrjvillacampa@gmail.com",company:"PCFG Insurance",agencyPOC:"Liam O'Brien",timeZone:"NY - EST",tl:"",am:"Cancelled",salesRep:""},
  {id:29,start:"3/21/2022",vaName:"Tatiana Rose",vaTag:"Gen VA",status:"Terminated",vaEmail:"etatianarose91596@gmail.com",company:"Pinnacle Partners Insurance Companies",agencyPOC:"Steve Kohlbrenner",timeZone:"PA - EST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:30,start:"4/4/2022",vaName:"Vincent Giorgio",vaTag:"Gen VA",status:"Active",vaEmail:"vincentmusne@gmail.com",company:"Trailstone Insurance Group",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:31,start:"4/6/2022",vaName:"Erlan James Liguan",vaTag:"Gen VA",status:"Active",vaEmail:"erlanjames.today@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:32,start:"4/18/2022",vaName:"Jonard",vaTag:"Gen VA",status:"Terminated",vaEmail:"jonard.asoy24@gmail.com",company:"Heaton Bennett Insurance",agencyPOC:"Ross Bennett",timeZone:"TX - CST",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:33,start:"5/2/2022",vaName:"Camille Katrina",vaTag:"Gen VA",status:"Terminated",vaEmail:"misscamilleang@gmail.com",company:"PMIA",agencyPOC:"Matt Clark",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:34,start:"5/2/2022",vaName:"Ryan Mendoza",vaTag:"Gen VA",status:"Terminated",vaEmail:"ryandoysabas@gmail.com",company:"PMIA",agencyPOC:"Matt Clark",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:35,start:"5/2/2022",vaName:"Shaina",vaTag:"Gen VA",status:"Terminated",vaEmail:"smheyres@gmail.com",company:"PCFG Insurance",agencyPOC:"Liam O'Brien",timeZone:"NY - EST",tl:"",am:"Cancelled",salesRep:""},
  {id:36,start:"5/9/2022",vaName:"Maria Angela Alonso",vaTag:"Gen VA",status:"Resigned",vaEmail:"maangela.alonso@gmail.com",company:"Heaton Bennett Insurance",agencyPOC:"Ross Bennett",timeZone:"TX - CST",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:37,start:"5/23/2022",vaName:"Chelsea Canete",vaTag:"Gen VA",status:"Active",vaEmail:"canetechelseap207@gmail.com",company:"Best Insutance Group",agencyPOC:"Brian Smith",timeZone:"AL - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:38,start:"5/23/2022",vaName:"Steven",vaTag:"Gen VA",status:"Terminated",vaEmail:"IAMSTEVEnumber1@gmail.com",company:"Little Giant Marketing",agencyPOC:"John Graham",timeZone:"",tl:"",am:"Cancelled",salesRep:"Johnny"},
  {id:39,start:"5/31/2022",vaName:"Arlyne Julia",vaTag:"Gen VA",status:"Terminated",vaEmail:"aj.taganas@yahoo.com",company:"PMIA",agencyPOC:"Matt Clark",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:40,start:"5/31/2022",vaName:"Krist Edu",vaTag:"Gen VA",status:"Terminated",vaEmail:"kristjovenier@gmail.com",company:"PMIA",agencyPOC:"Matt Clark",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:41,start:"6/7/2022",vaName:"Jaenelle Mikaela",vaTag:"Gen VA",status:"Terminated",vaEmail:"gabutero.mikaela@gmail.com",company:"Pinnacle Partners Insurance Companies",agencyPOC:"Steve Kohlbrenner",timeZone:"PA - EST",tl:"Vince",am:"Niccole",salesRep:"Johnny"},
  {id:42,start:"6/7/2022",vaName:"Jaenelle Mikaela",vaTag:"Gen VA",status:"Terminated",vaEmail:"gabutero.mikaela@gmail.com",company:"Halo Insurance and Benefits Group",agencyPOC:"Carlyne Weber",timeZone:"",tl:"",am:"Cancelled",salesRep:"Johnny"},
  {id:43,start:"6/9/2022",vaName:"Faith del Rosario",vaTag:"Gen VA",status:"Active",vaEmail:"faithdelrosario34@gmail.com",company:"Valley Insurance Agency Alliance",agencyPOC:"Robert Qaoud",timeZone:"MO - CST",tl:"Vince",am:"Niccole",salesRep:"Johnny"},
  {id:44,start:"6/9/2022",vaName:"Ryan James Villarmia",vaTag:"Gen VA",status:"BuyOut",vaEmail:"rjbvillarmia13@gmail.com",company:"Valley Insurance Agency Alliance",agencyPOC:"Robert Qaoud",timeZone:"MO - CST",tl:"Vince",am:"Niccole",salesRep:"Johnny"},
  {id:45,start:"6/17/2022",vaName:"Antonio Miguel",vaTag:"Gen VA",status:"Terminated",vaEmail:"migueleugenio94@gmail.com",company:"Heaton Bennett Insurance",agencyPOC:"Ross Bennett",timeZone:"TX - CST",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:46,start:"6/20/2022",vaName:"Kenny Salvaña",vaTag:"Gen VA",status:"Active",vaEmail:"forcaster93@gmail.com",company:"Trailstone Insurance Group",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:47,start:"6/29/2022",vaName:"Jeff Espinosa",vaTag:"Gen VA",status:"Terminated",vaEmail:"Zeff.A.Espinosa@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:48,start:"7/7/2022",vaName:"Jhon Reyel Jimenez",vaTag:"Gen VA",status:"Terminated",vaEmail:"reyeljimenez555@gmail.com",company:"Valley Insurance Agency Alliance",agencyPOC:"Robert Qaoud",timeZone:"MO - CST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:49,start:"7/13/2022",vaName:"Rojie May Cudal",vaTag:"Gen VA",status:"Active",vaEmail:"rojiemayc@gmail.com",company:"Valley Insurance Agency Alliance",agencyPOC:"Robert Qaoud",timeZone:"MO - CST",tl:"Vince",am:"Niccole",salesRep:"Johnny"},
  {id:50,start:"7/26/2022",vaName:"Khristian Dignos",vaTag:"Gen VA",status:"Terminated",vaEmail:"khristiandignos038@gmail.com",company:"Little Giant Marketing",agencyPOC:"John Graham",timeZone:"",tl:"",am:"Cancelled",salesRep:"Johnny"},
  {id:51,start:"8/8/2022",vaName:"Leslie Daffodil Cabonilas",vaTag:"Gen VA",status:"Terminated",vaEmail:"leslie14cabs@gmail.com",company:"Trailstone Insurance Group",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:52,start:"10/24/2022",vaName:"Christian Paul Cervantes",vaTag:"Gen VA",status:"Active",vaEmail:"christianpaulcervantes0209@gmail.com",company:"The Weikum Group",agencyPOC:"Ken Weikum",timeZone:"GA - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:53,start:"11/9/2022",vaName:"Shadrach Cabunoc",vaTag:"Gen VA",status:"Active",vaEmail:"berhelentize@gmail.com",company:"Great Park Insurance",agencyPOC:"Daniel Seong",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:54,start:"12/27/2022",vaName:"Diane Marie Dotollo",vaTag:"Gen VA",status:"Resigned",vaEmail:"diane.dotollo@gmail.com",company:"Michael Sailor Insurance",agencyPOC:"Michael Sailor",timeZone:"CO - MDT",tl:"",am:"Karla",salesRep:"Johnny"},
  {id:55,start:"1/6/2023",vaName:"Althea Sajeda N. Clao",vaTag:"Gen VA",status:"Active",vaEmail:"altheasajedaclao@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:56,start:"1/18/2023",vaName:"Leslie Montenegro",vaTag:"Gen VA",status:"Resigned",vaEmail:"lesliemontenegro18@gmail.com",company:"Creekside Risk",agencyPOC:"Chris Badger",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:57,start:"1/21/2023",vaName:"Weneliza Eyo",vaTag:"Gen VA",status:"Active",vaEmail:"kenli2015lp@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:58,start:"2/26/2023",vaName:"Christine Joyce Dasalla Gicain",vaTag:"Gen VA",status:"Active",vaEmail:"tinegicainj@gmail.com",company:"Meridian Investigative Group",agencyPOC:"Shawn Rae",timeZone:"FL - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:59,start:"2/28/2023",vaName:"Gemma Salonga",vaTag:"Gen VA",status:"Active",vaEmail:"letiwaffle@gmail.com",company:"4 State Insurance Agency",agencyPOC:"Margaret Rutherford",timeZone:"OK - CST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:60,start:"3/8/2023",vaName:"Rixer Llego",vaTag:"Gen VA",status:"Resigned",vaEmail:"rixer.llego@gmail.com",company:"Great Park Insurance",agencyPOC:"Daniel Seong",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:61,start:"3/16/2023",vaName:"Peter Lorenz Acosta",vaTag:"Gen VA",status:"Active",vaEmail:"peterlorenzacosta27@gmail.com",company:"Grimes Insurance",agencyPOC:"Niki Saavedra",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:62,start:"3/16/2023",vaName:"Edgar Sarmieno",vaTag:"Gen VA",status:"Terminated",vaEmail:"edgdvsarmiento@addu.edu.ph",company:"Priority Risk Management",agencyPOC:"Mark Shoultz",timeZone:"IN - EST",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:63,start:"3/20/2023",vaName:"John Enrico Auxillan",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"johnenrico1998@gmail.com",company:"Chris Mann Insurance Services, Inc",agencyPOC:"Christopher Mann",timeZone:"",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:64,start:"3/21/2023",vaName:"Garliet Aguilar",vaTag:"Gen VA",status:"Active",vaEmail:"aguilargarliet@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:65,start:"3/21/2023",vaName:"Rosanna Katrina Obeal",vaTag:"Gen VA",status:"Active",vaEmail:"katrina.obeal26@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:66,start:"3/29/2023",vaName:"Karl Loyd Sison",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"karlloydsison1997@gmail.com",company:"Pines Insurance Group",agencyPOC:"Jack McClelland",timeZone:"NC - EST",tl:"",am:"Cancelled",salesRep:"Austin"},
  {id:67,start:"4/3/2023",vaName:"Kara Matinong",vaTag:"Gen VA",status:"Terminated",vaEmail:"karamatinong0728@gmail.com",company:"Rushdi Insurance",agencyPOC:"",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:68,start:"4/3/2023",vaName:"Razmia Abutazil",vaTag:"Gen VA",status:"Terminated",vaEmail:"abutazilrazmia@gmail.com",company:"Procare",agencyPOC:"Filip Lundstedt",timeZone:"FL - EST",tl:"Rezyl",am:"Karla",salesRep:"Mike"},
  {id:69,start:"4/10/2023",vaName:"Christine Joy Aquino",vaTag:"Gen VA",status:"Terminated",vaEmail:"christinea616@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:70,start:"4/11/2023",vaName:"Mary Jane Tejero",vaTag:"Gen VA",status:"Active",vaEmail:"maryjanetejero0107@gmail.com",company:"Heaton Bennett Insurance",agencyPOC:"Ross Bennett",timeZone:"TX - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:71,start:"4/11/2023",vaName:"Reno Diansay",vaTag:"Gen VA",status:"Active",vaEmail:"diansayreno143@gmail.com",company:"Heaton Bennett Insurance",agencyPOC:"Ross Bennett",timeZone:"TX - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:72,start:"4/13/2023",vaName:"John Vergel Entize",vaTag:"Gen VA",status:"Terminated",vaEmail:"berhelentize@gmail.com",company:"Great Park Insurance",agencyPOC:"Daniel Seong",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:73,start:"4/17/2023",vaName:"Jenevieve Carillo",vaTag:"Gen VA",status:"Terminated",vaEmail:"carillojenevieve@gmail.com",company:"Extra Mile Insurance Solutions",agencyPOC:"Niki Henley",timeZone:"",tl:"",am:"Cancelled",salesRep:"Celina"},
  {id:74,start:"4/20/2023",vaName:"Kimberly Dawn Maglanoc",vaTag:"Gen VA",status:"Active",vaEmail:"kimaglanoc@gmail.com",company:"Procare Consluting",agencyPOC:"Filip Lundstedt",timeZone:"FL - EST",tl:"Rezyl",am:"Karla",salesRep:"Mike"},
  {id:75,start:"4/24/2023",vaName:"Apple Mae Ybas",vaTag:"Gen VA",status:"Terminated",vaEmail:"powerple21@gmail.com",company:"Rushdi Insurance",agencyPOC:"",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:76,start:"4/24/2023",vaName:"Mikko Amadeo Bueno",vaTag:"Gen VA",status:"Active",vaEmail:"mikko.bueno.bd.ph@gmail.com",company:"Hays and Hagan Insurance",agencyPOC:"Cory Hagan",timeZone:"TX - CST",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:77,start:"4/24/2023",vaName:"Raynard Aquino",vaTag:"Gen VA",status:"Terminated",vaEmail:"raynking.aquino@gmail.com",company:"Underwood Agency",agencyPOC:"Chuch Clark",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:78,start:"5/1/2023",vaName:"Jerome Suazo",vaTag:"Gen VA",status:"Resigned",vaEmail:"jeromesuazo@gmail.com",company:"Priority Risk Management",agencyPOC:"Mark Shoultz",timeZone:"IN - EST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:79,start:"5/1/2023",vaName:"Jacob Martin Heje",vaTag:"Gen VA",status:"Terminated",vaEmail:"jacobheje.2000@gmail.com",company:"Underwood Agency",agencyPOC:"Chuch Clark",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:80,start:"5/2/2023",vaName:"Gifford Nale",vaTag:"Gen VA",status:"Active",vaEmail:"gifford.nale1995@gmail.com",company:"Steele Insurance Agency",agencyPOC:"Steve Renteria",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:81,start:"5/2/2023",vaName:"Jesselyn Xena Paronda",vaTag:"Gen VA",status:"Active",vaEmail:"xenaparonda@gmail.com",company:"Steele Insurance Agency",agencyPOC:"Steve Renteria",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:82,start:"5/3/2023",vaName:"John Paul Maceda",vaTag:"Gen VA",status:"Terminated",vaEmail:"jpmaceda39@gmail.com",company:"Hagan Insurance",agencyPOC:"Cory Hagan",timeZone:"TX - CST",tl:"RJ",am:"Cancelled",salesRep:"Mike"},
  {id:83,start:"5/5/2023",vaName:"An Ampong",vaTag:"Gen VA",status:"Terminated",vaEmail:"amponggmz@gmail.com",company:"Trailstone Insurance",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:84,start:"5/5/2023",vaName:"Shaine Daryl Javido",vaTag:"Gen VA",status:"Resigned",vaEmail:"ShaineJavido@gmail.com",company:"Trailstone Insurance",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:85,start:"5/8/2023",vaName:"Nathalie Mae Santisas",vaTag:"Gen VA",status:"Active",vaEmail:"nathsantisas@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:86,start:"5/8/2023",vaName:"Saramie Oani",vaTag:"Gen VA",status:"Active",vaEmail:"saramieoani@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:87,start:"5/8/2023",vaName:"Ghaylee Mae Jarligo",vaTag:"Gen VA",status:"Resigned",vaEmail:"ghaylejarligo@gmail.com",company:"Carnegie Home & Auto",agencyPOC:"",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:88,start:"5/11/2023",vaName:"Raymond Vincent Vivar",vaTag:"Gen VA",status:"Terminated",vaEmail:"ravenvivarian10@gmail.com",company:"Jerry Farcone",agencyPOC:"Jerry Farcone",timeZone:"",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:89,start:"5/15/2023",vaName:"Jose Rey Solatorio",vaTag:"Gen VA",status:"Active",vaEmail:"josereysolatorio@gmail.com",company:"CT3 Insurance Group",agencyPOC:"Tommy Sellars",timeZone:"NC - EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:90,start:"5/15/2023",vaName:"Laurence Balaota",vaTag:"Gen VA",status:"Terminated",vaEmail:"balaotalaurence@gmail.com",company:"Community Association Insurance Consulting, LLC",agencyPOC:"Maureen Porter CAIC",timeZone:"MN",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:91,start:"5/16/2023",vaName:"Analyn Enterina",vaTag:"Gen VA",status:"Terminated",vaEmail:"analynenterina04@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:92,start:"5/16/2023",vaName:"Joshua Bajao",vaTag:"Gen VA",status:"Terminated",vaEmail:"joshuabajao19@gmail.com",company:"One Choice Insurance",agencyPOC:"",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:93,start:"5/16/2023",vaName:"Ylaissa Noreen Navales",vaTag:"Gen VA",status:"Terminated",vaEmail:"ylaissanoreennavales@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:94,start:"5/22/2023",vaName:"Daryl Tagadiad",vaTag:"Gen VA",status:"Active",vaEmail:"darylptagadiad@gmail.com",company:"Family Insurance Services",agencyPOC:"Nick Mesaros",timeZone:"IN - EST",tl:"Rezyl",am:"Alicia",salesRep:"Austin"},
  {id:95,start:"5/23/2023",vaName:"Glenn Mejorada",vaTag:"Combo",status:"Reprofiled",vaEmail:"glennmejorada0621@gmail.com",company:"Mappus Insurance",agencyPOC:"Andrew Muller",timeZone:"SC - EST",tl:"Rezyl",am:"Karla",salesRep:"Mike"},
  {id:96,start:"5/23/2023",vaName:"Joseph Adrian Muñoz",vaTag:"Gen VA",status:"Terminated",vaEmail:"josefeena08@gmail.com",company:"Marcure Insurance, Inc",agencyPOC:"",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:97,start:"5/23/2023",vaName:"Lesley Alyssa Baño",vaTag:"Gen VA",status:"Resigned",vaEmail:"lesleyalyssabano@gmail.com",company:"Aspen Insurance Agency",agencyPOC:"Jon Goldenberg",timeZone:"CO - MDT",tl:"Martin",am:"Alicia",salesRep:"Austin"},
  {id:98,start:"5/23/2023",vaName:"Ruth Nicolae Rosales",vaTag:"Combo",status:"Resigned",vaEmail:"rosales.nicolae@gmail.com",company:"Mappus Insurance",agencyPOC:"Andrew Muller",timeZone:"SC - EST",tl:"Rezyl",am:"Karla",salesRep:"Mike"},
  {id:99,start:"5/24/2023",vaName:"Danielle Ayezza Taghoy",vaTag:"Gen VA",status:"Terminated",vaEmail:"damtaghoy@gmail.com",company:"Nerissa Berry Insurance Agency",agencyPOC:"Nerissa Berry",timeZone:"OK - CST",tl:"RJ",am:"Karla",salesRep:"Mike"},
  {id:100,start:"5/24/2023",vaName:"Reina Mae Narisma",vaTag:"Gen VA",status:"Terminated",vaEmail:"rein.narisma@gmail.com",company:"Navigate Risk Advisors",agencyPOC:"TJ Worsencroft",timeZone:"OH - EST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:101,start:"5/24/2023",vaName:"Rushiel Mae Baroman",vaTag:"Gen VA",status:"Terminated",vaEmail:"rushielhayley3094@gmail.com",company:"Stacks Insurance Brokerage",agencyPOC:"Amber Stockert/Taylor Stacks",timeZone:"FL - EST",tl:"Rezyl",am:"Alicia",salesRep:"Johnny"},
  {id:102,start:"5/30/2023",vaName:"Nicole Mendoza",vaTag:"Gen VA",status:"Terminated",vaEmail:"nicoledavidmendoza@gmail.com",company:"Premiere Home & Auto",agencyPOC:"Peter Manfra",timeZone:"NJ - EST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:103,start:"5/31/2023",vaName:"Dominic Emmanuel Roxas",vaTag:"Gen VA",status:"Resigned",vaEmail:"nikkouniinusky121703@gmail.com",company:"SJ Adams Insurance",agencyPOC:"Shaun Adams",timeZone:"NC- EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:104,start:"5/31/2023",vaName:"Therese Bullet Regis",vaTag:"Gen VA",status:"Resigned",vaEmail:"Theresebulletregis00@gmail.com",company:"Brady Insurance Group, LLC",agencyPOC:"Jack Jones",timeZone:"TN - CST",tl:"RJ",am:"Alicia",salesRep:"Austin"},
  {id:105,start:"6/2/2023",vaName:"Ken Kriesler Guinang",vaTag:"Gen VA",status:"Terminated",vaEmail:"guinangkenkriesler@gmail.com",company:"Trailstone Insurance",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:106,start:"6/5/2023",vaName:"Jeamie Abadies",vaTag:"Combo",status:"Terminated",vaEmail:"jeamieabadies@gmail.com",company:"Genesis One Insurance",agencyPOC:"Greg Adams",timeZone:"",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:107,start:"6/6/2023",vaName:"Jay Encomienda",vaTag:"Gen VA",status:"Active",vaEmail:"encomiendero94@gmail.com",company:"Stacks Insurance Brokerage",agencyPOC:"Amber Stockert/Taylor Stacks",timeZone:"FL - EST",tl:"Rezyl",am:"Alicia",salesRep:"Johnny"},
  {id:108,start:"6/12/2023",vaName:"Juhn Rafael Yee",vaTag:"Combo",status:"Reprofiled",vaEmail:"rafael.yeah123@gmail.com",company:"Arcadia Insurance Group",agencyPOC:"Aaron Pietila",timeZone:"",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:109,start:"6/13/2023",vaName:"Iris Bayson",vaTag:"Combo",status:"Resigned",vaEmail:"irisbayson7@gmail.com",company:"Trailstone Insurance Group - Morgan",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:110,start:"6/13/2023",vaName:"Maylene Licayan",vaTag:"Gen VA",status:"Terminated",vaEmail:"luchavezmaymay@gmail.com",company:"Derek Wiley Agency",agencyPOC:"Derek Wiley",timeZone:"VA - EST",tl:"Rezyl",am:"Cancelled",salesRep:"Johnny"},
  {id:111,start:"6/15/2023",vaName:"Mariah Nicole Seville",vaTag:"Gen VA",status:"Active",vaEmail:"mariahnicoleseville@gmail.com",company:"Steele Insurance Agency",agencyPOC:"Steve Renteria",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:112,start:"6/15/2023",vaName:"Rezyl Jane Regondon",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"rjaneregondon816@gmail.com",company:"Glenn Harris & Associates",agencyPOC:"Laurie Bly",timeZone:"",tl:"",am:"Cancelled",salesRep:"Austin"},
  {id:113,start:"6/16/2023",vaName:"Andrei Lera",vaTag:"Gen VA",status:"Terminated",vaEmail:"dreilera@gmail.com",company:"Derek Wiley Agency",agencyPOC:"Derek Wiley",timeZone:"VA - EST",tl:"Rezyl",am:"Cancelled",salesRep:"Johnny"},
  {id:114,start:"6/19/2023",vaName:"Jessabell Requillo",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"Jessabell.requillo@gmail.com",company:"Doing the Most LLC",agencyPOC:"Daniel Linger",timeZone:"",tl:"",am:"Cancelled",salesRep:"Johnny"},
  {id:115,start:"6/26/2023",vaName:"Crystel Mae Montero",vaTag:"Gen VA",status:"Terminated",vaEmail:"crystelmaemontero123@gmail.com",company:"The Firm of Louisiana",agencyPOC:"Andy Dressler",timeZone:"LA - PST",tl:"ED",am:"Cancelled",salesRep:"Mike"},
  {id:116,start:"6/26/2023",vaName:"Sandy Camacho",vaTag:"Gen VA",status:"Terminated",vaEmail:"shamdy0316@gmail.com",company:"The Firm of Louisiana",agencyPOC:"Andy Dressler",timeZone:"LA - PST",tl:"ED",am:"Cancelled",salesRep:"Mike"},
  {id:117,start:"6/29/2023",vaName:"Aled Geronimo",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"geronimoaled@gmail.com",company:"The Firm of Louisiana",agencyPOC:"Andy Dressler",timeZone:"LA - PST",tl:"ED",am:"Cancelled",salesRep:"Mike"},
  {id:118,start:"6/29/2023",vaName:"Elisa Alexandra Lazarraga",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"lazarragaelisa@gmail.com",company:"The Firm of Louisiana",agencyPOC:"Andy Dressler",timeZone:"LA - PST",tl:"ED",am:"Cancelled",salesRep:"Mike"},
  {id:119,start:"6/29/2023",vaName:"Pamela Dianne Faye Layo",vaTag:"Gen VA",status:"Terminated",vaEmail:"pameladflayo@gmail.com",company:"The Firm of Louisiana",agencyPOC:"Andy Dressler",timeZone:"LA - PST",tl:"ED",am:"Cancelled",salesRep:"Mike"},
  {id:120,start:"7/5/2023",vaName:"Jemavelle Mie Sasam",vaTag:"Combo",status:"Resigned",vaEmail:"jemavellemie@gmail.com",company:"Millennium Brokers Insurance Group",agencyPOC:"Brandon Thompson",timeZone:"MO - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:121,start:"7/5/2023",vaName:"Gray Marie Lagolos",vaTag:"Gen VA",status:"Terminated",vaEmail:"nikolaiferrazteves@gmail.com",company:"Sterling Peaks Insurance LLC",agencyPOC:"Robert Bates/Bobby Bates",timeZone:"CO - MDT",tl:"",am:"Cancelled",salesRep:"Johnny"},
  {id:122,start:"7/5/2023",vaName:"Martin Dominic Salcedo",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"martinsalcedo.work@gmail.com",company:"Glenn Harris & Associates",agencyPOC:"Laurie Bly",timeZone:"",tl:"",am:"Cancelled",salesRep:"Austin"},
  {id:123,start:"7/10/2023",vaName:"Nikolai Teves",vaTag:"Combo",status:"Terminated",vaEmail:"",company:"Reliant Insurance Group",agencyPOC:"Ben Klesinger",timeZone:"IN - EST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:124,start:"7/11/2023",vaName:"Catherene Bonsucan",vaTag:"Gen VA",status:"Terminated",vaEmail:"catherene.bonsucan@gmail.com",company:"Webb Insurance Group",agencyPOC:"Laura Webb",timeZone:"FL - EST",tl:"",am:"Cancelled",salesRep:"Johnny"},
  {id:125,start:"7/11/2023",vaName:"Melody Tesorero",vaTag:"Gen VA",status:"Terminated",vaEmail:"melodytesorero36@gmail.com",company:"Webb Insurance Group",agencyPOC:"Laura Webb",timeZone:"FL - EST",tl:"",am:"Cancelled",salesRep:"Johnny"},
  {id:126,start:"7/17/2023",vaName:"Allana Lou Dapetilla",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"allanalou99@gmail.com",company:"The Firm of Louisiana",agencyPOC:"Andy Dressler",timeZone:"LA - PST",tl:"ED",am:"Cancelled",salesRep:"Mike"},
  {id:127,start:"7/17/2023",vaName:"Karla Jeanne Tigullo",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"tigullokj@gmail.com",company:"The Firm of Louisiana",agencyPOC:"Andy Dressler",timeZone:"LA - PST",tl:"ED",am:"Cancelled",salesRep:"Mike"},
  {id:128,start:"7/21/2023",vaName:"New",vaTag:"Gen VA",status:"Active",vaEmail:"galimbasricheljoy@gmail.com",company:"Trailstone Insurance",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:129,start:"7/21/2023",vaName:"Queenie Decena",vaTag:"Gen VA",status:"Resigned",vaEmail:"Qddecena@gmail.com",company:"Trailstone Insurance",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:130,start:"7/24/2023",vaName:"John Enrico Auxillan",vaTag:"Combo",status:"Active",vaEmail:"johnenrico1998@gmail.com",company:"Kilgo Insurance",agencyPOC:"Jason Kilgo",timeZone:"VA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Johnny"},
  {id:131,start:"8/3/2023",vaName:"Rodelyn Muana",vaTag:"Gen VA",status:"Active",vaEmail:"rodelynmuana18@gmail.com",company:"Snyder Insurance Agency",agencyPOC:"Katie Bruch",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Johnny"},
  {id:132,start:"8/7/2023",vaName:"Mary Ann Villarba",vaTag:"Gen VA",status:"Resigned",vaEmail:"maryannvillarba8@gmail.com",company:"Great Park Insurance",agencyPOC:"Daniel Seong",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:133,start:"8/8/2023",vaName:"Edger Calope",vaTag:"Gen VA",status:"Terminated",vaEmail:"ei.eidah04@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:134,start:"8/8/2023",vaName:"Maria Alexandra Faye Cabigas",vaTag:"Gen VA",status:"Active",vaEmail:"fayealexandra7@gmail.com",company:"Bailey Family insurance",agencyPOC:"Mark Bailey",timeZone:"IL - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:135,start:"8/9/2023",vaName:"Dohnna Joy Maranga",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"deejaymars1982@gmail.com",company:"Wize Insurance & Risk Management",agencyPOC:"Ralph Wize",timeZone:"IN - EST",tl:"",am:"Cancelled",salesRep:"Johnny"},
  {id:136,start:"8/9/2023",vaName:"Jessa Adlawan",vaTag:"Gen VA",status:"Terminated",vaEmail:"adlawanjee@gmail.com",company:"Community Association Insurance Consulting, LLC",agencyPOC:"Melissa Blenker",timeZone:"WI - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:137,start:"8/14/2023",vaName:"Jason Guipitacio",vaTag:"Gen VA",status:"Active",vaEmail:"jasonguipitacio244@gmail.com",company:"Heaton Bennett Insurance",agencyPOC:"Ross Bennett",timeZone:"TX - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:138,start:"8/14/2023",vaName:"Jerrick Jai Braza",vaTag:"Combo",status:"Terminated",vaEmail:"jerrickjaib@gmail.com",company:"Independence Insurance Center",agencyPOC:"",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:139,start:"8/14/2023",vaName:"Jhun Bart Macirin",vaTag:"Combo",status:"Terminated",vaEmail:"jhunbartm@gmail.com",company:"JMJ Insurance",agencyPOC:"Michael James",timeZone:"",tl:"",am:"Cancelled",salesRep:"Johnny"},
  {id:140,start:"8/21/2023",vaName:"Jahziel Alolino",vaTag:"Gen VA",status:"Active",vaEmail:"hikariyami07@gmail.com",company:"McGlothin Insurance & Financial",agencyPOC:"Brock McGlothin",timeZone:"OH - EST",tl:"Vince",am:"Alicia",salesRep:"Mike"},
  {id:141,start:"8/21/2023",vaName:"John Clyde Recososa",vaTag:"Gen VA",status:"Terminated",vaEmail:"recososajohnclyde9@gmail.com",company:"McGlothin Insurance& Financial",agencyPOC:"Brock McGlothin",timeZone:"OH - EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:142,start:"8/23/2023",vaName:"Juvelyn Quibuyen",vaTag:"Gen VA",status:"Terminated",vaEmail:"quibuyenuvel@gmail.com",company:"Blackwell Insurance",agencyPOC:"Leigh Zellmer / Ken Haraughty",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:143,start:"8/24/2023",vaName:"Richard Sawanaka",vaTag:"Gen VA",status:"Active",vaEmail:"richardsawanaka@gmail.com",company:"Zagweb",agencyPOC:"Robert Cesaric",timeZone:"FL - EST",tl:"Rezyl",am:"Niccole",salesRep:"Austin"},
  {id:144,start:"8/28/2023",vaName:"Andre Miguelle Lao",vaTag:"Gen VA",status:"Terminated",vaEmail:"miguellito2600@gmail.com",company:"Lead Paths",agencyPOC:"",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:145,start:"8/28/2023",vaName:"Denny Marc Eleido Maquiling",vaTag:"Gen VA",status:"Terminated",vaEmail:"maquilingdennymarc@gmail.com",company:"Agency Automate",agencyPOC:"Bill Jenkins",timeZone:"MN - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:146,start:"8/28/2023",vaName:"Ivan Raphael Geralde",vaTag:"Gen VA",status:"Active",vaEmail:"irgeralde@yahoo.com",company:"SJ Adams Insurance",agencyPOC:"Shaun Adams",timeZone:"NC- EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:147,start:"8/28/2023",vaName:"Colin Eder",vaTag:"Gen VA",status:"Active",vaEmail:"collineder789@gmail.com",company:"Parkway LTC Consulting",agencyPOC:"Novel Martin",timeZone:"VA - EST",tl:"Vince",am:"Niccole",salesRep:""},
  {id:148,start:"8/30/2023",vaName:"Laurence Lesmoras",vaTag:"Gen VA",status:"Terminated",vaEmail:"llesmoras@proton.me",company:"Lead Paths",agencyPOC:"",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:149,start:"8/31/2023",vaName:"Shammah Krisha Casulla",vaTag:"Gen VA",status:"Terminated",vaEmail:"shammahcsll@gmail.com",company:"Chris Mann Insurance Services, Inc",agencyPOC:"Christopher Mann",timeZone:"",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:150,start:"9/5/2023",vaName:"Ann Hope Garcia",vaTag:"Gen VA",status:"Terminated",vaEmail:"hopegarcia15@gmail.com",company:"Securum Insurance Solutions",agencyPOC:"Loshanda Johnson",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:151,start:"9/5/2023",vaName:"Joylan Panungcat",vaTag:"Gen VA",status:"Terminated",vaEmail:"joylanpanungcat.jobs@gmail.com",company:"Agency Automate",agencyPOC:"Bill Jenkins",timeZone:"MN - CST",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:152,start:"9/7/2023",vaName:"Mel Francis Ramos",vaTag:"Gen VA",status:"Terminated",vaEmail:"melfrancisbuzz.ramos@gmail.com",company:"Lead Paths",agencyPOC:"",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:153,start:"9/11/2023",vaName:"Adrienne Nicole Tenchavez",vaTag:"Gen VA",status:"Resigned",vaEmail:"antenchavez@gmail.com",company:"Navigate Risk Advisors",agencyPOC:"TJ Worsencroft",timeZone:"OH - EST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:154,start:"9/11/2023",vaName:"Mary Lou Cabigas",vaTag:"Gen VA",status:"Active",vaEmail:"cabigasmary@gmail.com",company:"Navigate Risk Advisors",agencyPOC:"TJ Worsencroft",timeZone:"OH - EST",tl:"Vince",am:"Niccole",salesRep:"Johnny"},
  {id:155,start:"9/18/2023",vaName:"Bryan May Salazar",vaTag:"Gen VA",status:"Terminated",vaEmail:"bboyz1234598@gmail.com",company:"Coverland Brokerages Inc",agencyPOC:"Frank Firriolo",timeZone:"NY - EST",tl:"Rezyl",am:"Cancelled",salesRep:"Mike"},
  {id:156,start:"9/18/2023",vaName:"Jan Niko Atinen",vaTag:"Combo",status:"Terminated",vaEmail:"jndatinen@gmail.com",company:"Pinnacle Point Insurance",agencyPOC:"Aaron England",timeZone:"TX - CST",tl:"RJ",am:"Niccole",salesRep:"Johnny"},
  {id:157,start:"9/18/2023",vaName:"Shawlly Lou Guday",vaTag:"Gen VA",status:"Terminated",vaEmail:"shaw.gmnglh@gmail.com",company:"Pinnacle Point Insurance",agencyPOC:"Aaron England",timeZone:"TX - CST",tl:"RJ",am:"Niccole",salesRep:"Johnny"},
  {id:158,start:"9/18/2023",vaName:"Vilfe Bacus",vaTag:"Gen VA",status:"Resigned",vaEmail:"bvilfe162015@gmail.com",company:"Coverland Brokerages Inc",agencyPOC:"Frank Firriolo",timeZone:"NY - EST",tl:"Rezyl",am:"Cancelled",salesRep:"Mike"},
  {id:159,start:"9/20/2023",vaName:"Margaret Floirendo",vaTag:"Gen VA",status:"Active",vaEmail:"margz1927@gmail.com",company:"Chan Wright Insurance Agency",agencyPOC:"Chan Wright",timeZone:"NC- EST",tl:"Vince",am:"Karla",salesRep:"Mike"},
  {id:160,start:"9/25/2023",vaName:"Raymond Vincent Vivar",vaTag:"Combo",status:"Terminated",vaEmail:"ravenvivarian10@gmail.com",company:"Top Flite Insurance Agency",agencyPOC:"Fiona Swaenepoel",timeZone:"NC- EST",tl:"Rezyl",am:"Cancelled",salesRep:"Johnny"},
  {id:161,start:"9/25/2023",vaName:"Karl Antoinette Tair",vaTag:"Combo",status:"Terminated",vaEmail:"antoinettetair@gmail.com",company:"Reliant Insurance Group",agencyPOC:"Ben Klesinger",timeZone:"IN - EST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:162,start:"9/27/2023",vaName:"Vanessa May Bagay",vaTag:"Combo",status:"Terminated",vaEmail:"vanessa.t.bagay@gmail.com",company:"Top Flite Insurance Agency",agencyPOC:"Fiona Swaenepoel",timeZone:"NC- EST",tl:"Rezyl",am:"Cancelled",salesRep:"Johnny"},
  {id:163,start:"10/2/2023",vaName:"Aster Pearl Baghari",vaTag:"Gen VA",status:"Resigned",vaEmail:"asterpearl19@outlook.com",company:"Coverland Brokerages Inc",agencyPOC:"Frank Firriolo",timeZone:"NY - EST",tl:"Rezyl",am:"Cancelled",salesRep:"Mike"},
  {id:164,start:"10/2/2023",vaName:"Faith Ann Fuentes",vaTag:"Combo",status:"Terminated",vaEmail:"fuentesfaithann6@gmail.com",company:"Golden Oak Insurance",agencyPOC:"Seth Murray",timeZone:"",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:165,start:"10/2/2023",vaName:"John Mark Canoy",vaTag:"Gen VA",status:"Terminated",vaEmail:"johnmark7231993@gmail.com",company:"United Risk Insurance",agencyPOC:"Cale Merrill",timeZone:"MS - CST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:166,start:"10/2/2023",vaName:"Kristine Escol",vaTag:"Combo",status:"Terminated",vaEmail:"kristinebescol@gmail.com",company:"Linda Meyer Insurance Brokerage",agencyPOC:"Linda Meyer",timeZone:"TX - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:167,start:"10/2/2023",vaName:"Michael Vincent Cael",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"vincentcael@yahoo.com",company:"Pinnacle Partners Insurance Companies",agencyPOC:"Steve Kohlbrenner",timeZone:"PA - EST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:168,start:"10/5/2023",vaName:"John Carlo Flauta",vaTag:"Combo",status:"Active",vaEmail:"cj.atualfo@gmail.com",company:"Top Flite Insurance Agency",agencyPOC:"Fiona Swaenepoel",timeZone:"NC- EST",tl:"Rezyl",am:"Cancelled",salesRep:"Johnny"},
  {id:169,start:"10/9/2023",vaName:"Jeffrey Dela Cruz",vaTag:"Combo",status:"Active",vaEmail:"jdccadc@gmail.com",company:"Evergreen Insurance Inc",agencyPOC:"Jesse Villafranca",timeZone:"WA - PST",tl:"ED",am:"Niccole",salesRep:"Mike"},
  {id:170,start:"10/10/2023",vaName:"Dexter Andatuan",vaTag:"Gen VA",status:"Terminated",vaEmail:"mirandadexter48@gmail.com",company:"Webb Insurance Group",agencyPOC:"Laura Webb",timeZone:"FL - EST",tl:"",am:"Cancelled",salesRep:"Johnny"},
  {id:171,start:"10/16/2023",vaName:"Darwin Nacpil",vaTag:"Combo",status:"Resigned",vaEmail:"Nacpildarwin@gmail.com",company:"Linda Meyer Insurance Brokerage",agencyPOC:"Linda Meyer",timeZone:"TX - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:172,start:"10/16/2023",vaName:"John Vincent Sosing",vaTag:"Combo",status:"Active",vaEmail:"vincentjvs@yahoo.com",company:"Vermost Insurance Agency",agencyPOC:"Darren Vermost",timeZone:"FL - EST",tl:"Vince",am:"Karla",salesRep:"Johnny"},
  {id:173,start:"10/16/2023",vaName:"Marc Lester Cang",vaTag:"Combo",status:"Active",vaEmail:"marc.lester.cang@gmail.com",company:"Vermost Insurance Agency",agencyPOC:"Darren Vermost",timeZone:"FL - EST",tl:"Vince",am:"Karla",salesRep:"Johnny"},
  {id:174,start:"10/16/2023",vaName:"Mira Lyne Sagales",vaTag:"Gen VA",status:"Terminated",vaEmail:"mirasagales.611@gmail.com",company:"Finance Freedom Builders LLC",agencyPOC:"Mike Racaniello",timeZone:"",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:175,start:"10/23/2023",vaName:"Alec Dwayne Quimco",vaTag:"Combo",status:"Resigned",vaEmail:"admquimco@gmail.com",company:"Reliant Insurance Group",agencyPOC:"Ben Klesinger",timeZone:"IN - EST",tl:"Vince",am:"Niccole",salesRep:"Johnny"},
  {id:176,start:"10/23/2023",vaName:"Kim Gutib",vaTag:"Combo",status:"Terminated",vaEmail:"kim.gutib@gmail.com",company:"AVIA",agencyPOC:"Morgan Hege",timeZone:"",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:177,start:"10/30/2023",vaName:"Janelle Faith Sanchez",vaTag:"Gen VA",status:"Terminated",vaEmail:"jfsanchez1007@gmail.com",company:"Nav Sav",agencyPOC:"Courtney Lee",timeZone:"FL - EST",tl:"",am:"Cancelled",salesRep:"Austin"},
  {id:178,start:"10/30/2023",vaName:"Krizza Tenorio Salisi",vaTag:"Combo",status:"Active",vaEmail:"krizzahoneyfaithsalisi@gmail.com",company:"Gartman Insurance Agency",agencyPOC:"Nick Gartman",timeZone:"MS - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:179,start:"10/30/2023",vaName:"Mira Lyne Sagales",vaTag:"Gen VA",status:"Terminated",vaEmail:"mirasagales.611@gmail.com",company:"Nav Sav",agencyPOC:"Courtney Lee",timeZone:"FL - EST",tl:"",am:"Cancelled",salesRep:"Austin"},
  {id:180,start:"11/1/2023",vaName:"Gellimea Berona",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"gellimeaberonal@gmail.com",company:"McEvoy Insurance & Financial Services",agencyPOC:"Rick McEvoy",timeZone:"VA - EST",tl:"",am:"Cancelled",salesRep:"Johnny"},
  {id:181,start:"11/6/2023",vaName:"Mack Peniel Como",vaTag:"Combo",status:"Terminated",vaEmail:"c.mackpniel@gmail.com",company:"Jump Insurance",agencyPOC:"",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:182,start:"11/9/2023",vaName:"John Ryan Ilumba",vaTag:"Gen VA",status:"Terminated",vaEmail:"johnryan.ilumba92@gmail.com",company:"McGlothin Insurance & Financial",agencyPOC:"Brock McGlothin",timeZone:"OH - EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:183,start:"11/14/2023",vaName:"Joeren Romasanta",vaTag:"Gen VA",status:"Resigned",vaEmail:"joerenromasanta04@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:184,start:"11/20/2023",vaName:"Ana Katrina Faraon",vaTag:"Gen VA",status:"Active",vaEmail:"iamkatey04@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:185,start:"11/20/2023",vaName:"Jose Joshua Jabol",vaTag:"Combo",status:"Terminated",vaEmail:"josejoshuajabol@gmail.com",company:"Thousand Oaks Insurance Agency",agencyPOC:"",timeZone:"",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:186,start:"11/20/2023",vaName:"Phoebe Kate Fernandez",vaTag:"Combo",status:"Terminated",vaEmail:"phoebekatef21@gmail.com",company:"ICA Group",agencyPOC:"",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:187,start:"11/20/2023",vaName:"Reyanne Talan",vaTag:"Combo",status:"Terminated",vaEmail:"reyannetalan2021@gmail.com",company:"Frank Slaughter Insurance Agency",agencyPOC:"Angela Taylor",timeZone:"",tl:"",am:"Cancelled",salesRep:"Johnny"},
  {id:188,start:"11/20/2023",vaName:"Rosshiel Ann Bahidi",vaTag:"Gen VA",status:"Terminated",vaEmail:"annbahidi@gmail.com",company:"Fairhouse Insurance",agencyPOC:"Asif Dhodi",timeZone:"TN - CST",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:189,start:"11/27/2023",vaName:"Cassandra Apostol",vaTag:"Gen VA",status:"Terminated",vaEmail:"cassandratapostol@gmail.com",company:"DCI Group",agencyPOC:"Julie Janowicz",timeZone:"",tl:"",am:"Cancelled",salesRep:"Celina"},
  {id:190,start:"11/27/2023",vaName:"Jessabell Requillo",vaTag:"Gen VA",status:"Terminated",vaEmail:"Jessabell.requillo@gmail.com",company:"Dishon Insurance",agencyPOC:"Johnny Dishon",timeZone:"",tl:"",am:"Cancelled",salesRep:"Austin"},
  {id:191,start:"12/4/2023",vaName:"Mayolito Jr. Salva",vaTag:"Gen VA",status:"Active",vaEmail:"salvamayolitojr@gmail.com",company:"SJ Adams Insurance",agencyPOC:"Shaun Adams",timeZone:"NC- EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:192,start:"12/18/2023",vaName:"Jeshryll Funa",vaTag:"Combo",status:"Terminated",vaEmail:"jeshryll13@gmail.com",company:"CSP Insurance Services",agencyPOC:"Lawson Walker",timeZone:"SC - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:193,start:"12/18/2023",vaName:"Kathleen Pagador",vaTag:"Gen VA",status:"Terminated",vaEmail:"kathleenpagador@gmail.com",company:"Risk Management",agencyPOC:"",timeZone:"",tl:"",am:"Cancelled",salesRep:""},
  {id:194,start:"12/18/2023",vaName:"Pierre Anthony Marc Santos",vaTag:"Combo",status:"Reprofiled",vaEmail:"p.saintz187@gmail.com",company:"Lock Insurance",agencyPOC:"Don Westerfeld",timeZone:"FL - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:195,start:"1/3/2024",vaName:"Vincent Angelo Pichon",vaTag:"Gen VA",status:"Active",vaEmail:"vincentangelopichon@gmail.com",company:"LTC Specialists, LLC",agencyPOC:"Andrew Goetz",timeZone:"MD - EST",tl:"Rezyl",am:"Alicia",salesRep:"Johnny"},
  {id:196,start:"1/15/2024",vaName:"Apple Rose Florenosos",vaTag:"Combo",status:"Active",vaEmail:"florenosos.applerose2003@gmail.com",company:"Powdersville Insurance",agencyPOC:"Jeff Knight",timeZone:"SC - EST",tl:"Rezyl",am:"Karla",salesRep:"Mike"},
  {id:197,start:"1/22/2024",vaName:"Christianne Ellie Antonio",vaTag:"Gen VA",status:"Active",vaEmail:"christianneellie@gmail.com",company:"Creekside Risk Management",agencyPOC:"Chris Badger",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:198,start:"1/22/2024",vaName:"Clint Warren Decierdo",vaTag:"Gen VA",status:"Active",vaEmail:"clintwarren.decierdo@gmail.com",company:"Creekside Risk",agencyPOC:"Chris Badger",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:199,start:"1/24/2024",vaName:"Ken Froilan Melitado",vaTag:"Gen VA",status:"Active",vaEmail:"thekenmelitado@gmail.com",company:"McGlothin Insurance & Financial",agencyPOC:"Brock McGlothin",timeZone:"OH - EST",tl:"Vince",am:"Alicia",salesRep:"Mike"},
  {id:200,start:"1/31/2024",vaName:"Efren Herrera",vaTag:"Gen VA",status:"Active",vaEmail:"efrenbherrera@gmail.com",company:"Kowalewski Jawork Insurance Agency Inc",agencyPOC:"Sandy Kowalewski",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:201,start:"2/5/2024",vaName:"Arnold Faderogao",vaTag:"Gen VA",status:"Terminated",vaEmail:"fadarnold1994@gmail.com",company:"Heaton Bennett Insurance",agencyPOC:"Ross Bennett",timeZone:"TX - CST",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:202,start:"2/7/2024",vaName:"Julie Anne Deloria",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"majbnph@gmail.com",company:"Apex Insurance & Investment Group LLC",agencyPOC:"Paul Jacques",timeZone:"FL - EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:203,start:"2/12/2024",vaName:"Arturo Jr. Gales",vaTag:"Combo",status:"Reprofiled",vaEmail:"arturogales65@gmail.com",company:"Vibrant Insurance Group",agencyPOC:"Ryan Swalve",timeZone:"IA - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:204,start:"2/12/2024",vaName:"Dianne Depalubos",vaTag:"Gen VA",status:"Terminated",vaEmail:"depalubosdianne@gmail.com",company:"Trailstone Insurance",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:205,start:"2/12/2024",vaName:"Jayson Sasuman",vaTag:"Gen VA",status:"Active",vaEmail:"geezhon27@gmail.com",company:"Trailstone Insurance",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:206,start:"2/12/2024",vaName:"Marcejean Pableo",vaTag:"Combo",status:"Active",vaEmail:"mvpableo@icloud.com",company:"Vibrant Insurance Group",agencyPOC:"Ryan Swalve",timeZone:"IA - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:207,start:"2/14/2024",vaName:"Alejandre Liwag",vaTag:"Gen VA",status:"Active",vaEmail:"alejandreliwag.22@gmail.com",company:"360 Insurance Solutions, Inc",agencyPOC:"Jason Armogida",timeZone:"VA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:208,start:"2/19/2024",vaName:"Maria Carmina Quijada",vaTag:"Gen VA",status:"Active",vaEmail:"animracquijada@gmail.com",company:"Raleigh Insurance Group",agencyPOC:"Daniel Rohrbaugh",timeZone:"NC- EST",tl:"Rezyl",am:"Niccole",salesRep:"Austin"},
  {id:209,start:"2/19/2024",vaName:"Paula Sedigo",vaTag:"Combo",status:"Terminated",vaEmail:"paupausedigo@gmail.com",company:"Arcadia Insurance Group",agencyPOC:"Aaron Pietila",timeZone:"",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:210,start:"2/26/2024",vaName:"Carlos Miguel Flores",vaTag:"Gen VA",status:"Active",vaEmail:"migzflores22@gmail.com",company:"Suncoast Insurance",agencyPOC:"Patricia Southerland",timeZone:"FL - EST",tl:"Vince",am:"Karla",salesRep:"Mike"},
  {id:211,start:"2/26/2024",vaName:"Nhayma Caballero",vaTag:"Gen VA",status:"Resigned",vaEmail:"nhaymacaballero0722@gmail.com",company:"IFG Insurance",agencyPOC:"Alan Chu",timeZone:"HI - HST",tl:"Karla",am:"Niccole",salesRep:"Mike"},
  {id:212,start:"2/26/2024",vaName:"Tara Nathalia Hizon-Dumapias",vaTag:"Gen VA",status:"Terminated",vaEmail:"trnthlhzn@outlook.com",company:"Navigate Risk Advisors",agencyPOC:"TJ Worsencroft",timeZone:"OH - EST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:213,start:"2/29/2024",vaName:"Gemma Lou Berame",vaTag:"Gen VA",status:"Terminated",vaEmail:"glberame@gmail.com",company:"Arcadia Insurance Group",agencyPOC:"Aaron Pietila",timeZone:"",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:214,start:"3/4/2024",vaName:"Camille Ricamora",vaTag:"Gen VA",status:"Resigned",vaEmail:"Camillericamora031@gmail.com",company:"Premier Home and Auto, LLC",agencyPOC:"Peter Manfra",timeZone:"NJ - EST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:215,start:"3/4/2024",vaName:"Carmela Nova Edig",vaTag:"Gen VA",status:"Active",vaEmail:"novaedig@gmail.com",company:"Bailey Family Insurance",agencyPOC:"Mark Bailey",timeZone:"IL - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:216,start:"3/7/2024",vaName:"Angelito Pedrosa",vaTag:"Gen VA",status:"Terminated",vaEmail:"angelito.pedrosa11@gmail.com",company:"Great Park Insurance",agencyPOC:"Daniel Seong",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:217,start:"3/18/2024",vaName:"Pete Christian Bogal",vaTag:"Combo",status:"Active",vaEmail:"christiangran23@gmail.com",company:"Eastside Insurance Services",agencyPOC:"Matt Rubin",timeZone:"WA - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:218,start:"3/25/2024",vaName:"Mark John Ibarra",vaTag:"Combo",status:"Active",vaEmail:"ibarramark92@gmail.com",company:"Southern Insurance Group",agencyPOC:"David Ashton",timeZone:"NC- EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:219,start:"3/25/2024",vaName:"Reychelle May Macaspac",vaTag:"Combo",status:"Active",vaEmail:"reych101@gmail.com",company:"JWI Group, Inc",agencyPOC:"Chris Januski",timeZone:"NY - EST",tl:"Vince",am:"Niccole",salesRep:"Mike"},
  {id:220,start:"3/25/2024",vaName:"Juhn Rafael Yee",vaTag:"Gen VA",status:"Terminated",vaEmail:"rafael.yeah123@gmail.com",company:"JMJ Insurance",agencyPOC:"Michael James",timeZone:"",tl:"",am:"Cancelled",salesRep:"Johnny"},
  {id:221,start:"3/25/2024",vaName:"Sakura Sakamoto",vaTag:"Gen VA",status:"Terminated",vaEmail:"sakurasakamoto26@gmail.com",company:"Creekside Risk",agencyPOC:"Chris Badger",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:222,start:"3/28/2024",vaName:"Camila Tagusi",vaTag:"Gen VA",status:"Terminated",vaEmail:"camilatagusi19@gmail.com",company:"Creekside Risk",agencyPOC:"Chris Badger",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:223,start:"4/1/2024",vaName:"Nhunkie Garingan",vaTag:"Gen VA",status:"Resigned",vaEmail:"ngaringan@yahoo.com",company:"Peer Executive Groups",agencyPOC:"David Crowley",timeZone:"PA - EST",tl:"",am:"Cancelled",salesRep:"Johnny"},
  {id:224,start:"4/1/2024",vaName:"Shaira Beah Jaralve",vaTag:"Combo",status:"Resigned",vaEmail:"shairabeah.jaralve@gmail.com",company:"Rain Tree Group",agencyPOC:"Joey Capps",timeZone:"OK - CST",tl:"RJ",am:"Karla",salesRep:"Mike"},
  {id:225,start:"4/8/2024",vaName:"Edwin Cabag Jr.",vaTag:"Gen VA",status:"Active",vaEmail:"summervalentine.042014@gmail.com",company:"Gartman Insurance Agency",agencyPOC:"Nick Gartman",timeZone:"MS - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:226,start:"4/8/2024",vaName:"Madylen Mae Bajala",vaTag:"Gen VA",status:"Terminated",vaEmail:"mady.bajala@gmail.com",company:"Greco Insurance Group",agencyPOC:"Joey Greco",timeZone:"NE - CST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:227,start:"4/15/2024",vaName:"Alice Avenido",vaTag:"Combo",status:"Reprofiled",vaEmail:"avenidoalice@gmail.com",company:"Innovators Insurance Group LLC",agencyPOC:"Daniel Dieterlen",timeZone:"IN - EST",tl:"Rezyl",am:"Alicia",salesRep:"Johnny"},
  {id:228,start:"4/15/2024",vaName:"Kim De Gamo",vaTag:"Gen VA",status:"Resigned",vaEmail:"kimdegamo838@gmail.com",company:"Pinnacle Mutual",agencyPOC:"Jenell Lessley",timeZone:"PA - EST",tl:"Vince",am:"Niccole",salesRep:"Johnny"},
  {id:229,start:"4/15/2024",vaName:"Alemar Ortiz",vaTag:"Gen VA",status:"Active",vaEmail:"ortizalemar19@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:230,start:"4/15/2024",vaName:"Edriz Jann Somono",vaTag:"Gen VA",status:"Active",vaEmail:"edreeezzy@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:231,start:"4/15/2024",vaName:"Mery Gail Desquitado",vaTag:"Gen VA",status:"Resigned",vaEmail:"mdesquitado08@gmail.com",company:"Nerissa Berry Insurance Agency",agencyPOC:"Nerissa Berry",timeZone:"OK - CST",tl:"RJ",am:"Karla",salesRep:"Mike"},
  {id:232,start:"4/15/2024",vaName:"Vincent Sequerra",vaTag:"Combo",status:"Terminated",vaEmail:"sequerrav@gmail.com",company:"R. T. Thomas Insurance LLC",agencyPOC:"Raina Walton",timeZone:"MO - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:233,start:"4/22/2024",vaName:"Eliza Lazarraga",vaTag:"Combo",status:"Terminated",vaEmail:"lazarragaelizaalessandra@gmail.com",company:"Dillehay Insurance",agencyPOC:"Kyle Dillehay - Valley Group",timeZone:"MO - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:234,start:"4/22/2024",vaName:"Arlene Joy Cabase",vaTag:"Combo",status:"Active",vaEmail:"arlenezoi29@gmail.com",company:"Wiley Insurance Agency",agencyPOC:"Traci Wiley - Valley Group",timeZone:"MO - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:235,start:"4/22/2024",vaName:"Edsel John Arcales",vaTag:"Combo",status:"Active",vaEmail:"ejarcales@gmail.com",company:"Partners Insurance Inc.",agencyPOC:"Jason Wamsganz-Valley Group",timeZone:"MO - CST",tl:"RJ",am:"Karla",salesRep:"Celina"},
  {id:236,start:"4/22/2024",vaName:"Johann Vera Cruz",vaTag:"Combo",status:"Terminated",vaEmail:"veracruzjohann@gmail.com",company:"Rock Island Insurance, LLC",agencyPOC:"Erik Svoboda - Valley Group",timeZone:"MO - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:237,start:"4/22/2024",vaName:"Kevin Rey Tsuchida",vaTag:"Combo",status:"Active",vaEmail:"kevintsuchida411@gmail.com",company:"Bull Insurance Agency",agencyPOC:"Kevin Bull - Valley Group",timeZone:"MO - CST",tl:"RJ",am:"Alicia",salesRep:"Celina"},
  {id:238,start:"4/22/2024",vaName:"Miko Acolentava",vaTag:"Combo",status:"Reprofiled",vaEmail:"okimacolentava@gmail.com",company:"Faith Insurance Agency",agencyPOC:"Jordan Wilson - Valley Group",timeZone:"MO - CST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:239,start:"4/22/2024",vaName:"Lovelydel Matuod",vaTag:"Combo",status:"Terminated",vaEmail:"iamlovelydelbmatuod@gmail.com",company:"Rock Island Insurance, LLC",agencyPOC:"Erik Svoboda - Valley Group",timeZone:"MO - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:240,start:"4/29/2024",vaName:"Mira Gulane",vaTag:"Combo",status:"Active",vaEmail:"gulanemira13@gmail.com",company:"Rock Island Insurance, LLC",agencyPOC:"Erik Svoboda - Valley Group",timeZone:"MO - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:241,start:"4/29/2024",vaName:"Angel Domingo",vaTag:"Combo",status:"Active",vaEmail:"domingoangelj@gmail.com",company:"Robertson Insurance and Risk Management",agencyPOC:"Neil Robertson",timeZone:"PA - EST",tl:"Vince",am:"Karla",salesRep:"Mike"},
  {id:242,start:"4/30/2024",vaName:"Rhea Mecaela Curayag",vaTag:"Combo",status:"Active",vaEmail:"rheacurayag@gmail.com",company:"Graves Insurance Group",agencyPOC:"Robert Graves - Valley Group",timeZone:"MO - CST",tl:"RJ",am:"Alicia",salesRep:"Austin"},
  {id:243,start:"5/13/2024",vaName:"Bryan Christian Salvador",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"brianamoguis@yahoo.com",company:"Reliant Insurance Group",agencyPOC:"Ben Klesinger",timeZone:"IN - EST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:244,start:"5/13/2024",vaName:"Jefer Sera",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"jefersera26@gmail.com",company:"Vibrant Insurance Group",agencyPOC:"Ryan Swalve",timeZone:"IA - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:245,start:"5/13/2024",vaName:"Mike Lorenz Arnado",vaTag:"Gen VA",status:"Active",vaEmail:"mikearnado123@gmail.com",company:"Turbodial",agencyPOC:"",timeZone:"",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:246,start:"5/13/2024",vaName:"Ragel Zhen Alves",vaTag:"Combo",status:"Terminated",vaEmail:"alvesragel@gmail.com",company:"Reliable Insurance",agencyPOC:"Ben Klesinger",timeZone:"IN - EST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:247,start:"5/20/2024",vaName:"Rolriann Kirk Biala",vaTag:"Combo",status:"Active",vaEmail:"kirkbiala@gmail.com",company:"JELMS Insurance Group",agencyPOC:"Brian Cichon",timeZone:"AZ - MDT",tl:"Martin",am:"Karla",salesRep:"Johnny"},
  {id:248,start:"5/20/2024",vaName:"Albert De Asis",vaTag:"Gen VA",status:"Active",vaEmail:"albertdeasis00@gmail.com",company:"Omni Insurance Brokerage",agencyPOC:"Mitchell Hancock",timeZone:"NV - PST",tl:"ED",am:"Alicia",salesRep:"Johnny"},
  {id:249,start:"5/28/2024",vaName:"Paul Jeane Michael Maglaqui",vaTag:"Gen VA",status:"Terminated",vaEmail:"mymail4u2is@gmail.com",company:"Heaton Bennett Insurance",agencyPOC:"Ross Bennett",timeZone:"TX - CST",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:250,start:"6/3/2024",vaName:"Florabelle Gamilla",vaTag:"Gen VA",status:"Terminated",vaEmail:"gamilla.fbvielle07@gmail.com",company:"Davis Insurance Associates Inc.",agencyPOC:"Brad Davis",timeZone:"SC - EST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:251,start:"6/3/2024",vaName:"Mary Ann Manguiran",vaTag:"Combo",status:"Terminated",vaEmail:"maryann.zoobooksystems@gmail.com",company:"Synergy Insurance Advisors",agencyPOC:"Scott Starita",timeZone:"CO - MDT",tl:"Martin",am:"Karla",salesRep:"Johnny"},
  {id:252,start:"6/5/2024",vaName:"Bajram 'BASH' Elisha Veton Montesa",vaTag:"Gen VA",status:"Terminated",vaEmail:"bashmontesa@gmail.com",company:"Creekside Risk",agencyPOC:"Chris Badger",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:253,start:"6/5/2024",vaName:"Ailene Ruth Rojo",vaTag:"Gen VA",status:"Active",vaEmail:"rojoailene@gmail.com",company:"Leif Assurance",agencyPOC:"AJ Schrage",timeZone:"MO - CST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:254,start:"6/10/2024",vaName:"Gie Talisic",vaTag:"Gen VA",status:"Resigned",vaEmail:"greatvagie@gmail.com",company:"The Sterling Insurance Group",agencyPOC:"Teresa Kitchens",timeZone:"TX - CST",tl:"Karla",am:"Niccole",salesRep:"Mike"},
  {id:255,start:"6/10/2024",vaName:"Glenn Mejorada",vaTag:"Gen VA",status:"BuyOut",vaEmail:"glennmejorada0621@gmail.com",company:"Fusco Orsini & Associates",agencyPOC:"Michael Fusco",timeZone:"CA - PST",tl:"ED",am:"Cancelled",salesRep:"Austin"},
  {id:256,start:"6/10/2024",vaName:"Merce Joy Sta. Maria",vaTag:"Gen VA",status:"Terminated",vaEmail:"mjjolloso@icloud.com",company:"Insurance Plus LLC /Accounting Plus Inc",agencyPOC:"Lance Hall",timeZone:"MO - CST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:257,start:"6/12/2024",vaName:"Mhea Rose Pizon",vaTag:"Gen VA",status:"Terminated",vaEmail:"mheapizon05@gmail.com",company:"Trailstone Insurance",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:258,start:"6/13/2024",vaName:"Jacky Arado",vaTag:"Gen VA",status:"Active",vaEmail:"aradojacky@gmail.com",company:"Cord Insurance",agencyPOC:"Steve Renteria",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Johnny"},
  {id:259,start:"6/21/2024",vaName:"Ferlene Ria Carrillo",vaTag:"Gen VA",status:"Terminated",vaEmail:"ferlene.carrillo@gmail.com",company:"Lafaro Insurance Agency",agencyPOC:"Robert Lafaro",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:260,start:"6/21/2024",vaName:"Phoebe Euanna May Maranga",vaTag:"Gen VA",status:"Active",vaEmail:"phoebeeuannamay@gmail.com",company:"Florida Best Quotes",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:261,start:"6/21/2024",vaName:"Michael Joseph Cabigas",vaTag:"Gen VA",status:"Active",vaEmail:"michaelcabigas639@gmail.com",company:"Priority Risk Management",agencyPOC:"Mark Shoultz",timeZone:"IN - EST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:262,start:"6/21/2024",vaName:"Edhen Mae Amores",vaTag:"Gen VA",status:"Active",vaEmail:"edhenamores@gmail.com",company:"Lafaro Insurance Agency",agencyPOC:"Robert Lafaro",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:263,start:"6/24/2024",vaName:"Joseph Benedict Sullan",vaTag:"Gen VA",status:"Active",vaEmail:"josephbenedictsullan@gmail.com",company:"Trailstone",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:264,start:"6/25/2024",vaName:"John Jazel Alex Gaviola",vaTag:"Gen VA",status:"Terminated",vaEmail:"thelastjeremiah@gmail.com",company:"Turbodial",agencyPOC:"",timeZone:"",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:265,start:"6/26/2024",vaName:"Jefryle Jude Rivero",vaTag:"Gen VA",status:"Resigned",vaEmail:"judasaiyan3@gmail.com",company:"Cord Insurance",agencyPOC:"Steve Renteria",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Johnny"},
  {id:266,start:"7/1/2024",vaName:"Emille Patricia Campaña",vaTag:"Combo",status:"Terminated",vaEmail:"epatriciacamp@gmail.com",company:"The Salvati Insurance Group, Inc",agencyPOC:"Thomas Salvati",timeZone:"MI - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:267,start:"7/1/2024",vaName:"Francis Remce Salino",vaTag:"Combo",status:"Terminated",vaEmail:"francesremce@gmail.com",company:"Glenn S Caldwell Insurance Services Inc",agencyPOC:"Candice Myers",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Celina"},
  {id:268,start:"7/1/2024",vaName:"Gem Camille Elaya",vaTag:"Combo",status:"Reprofiled",vaEmail:"elaya.gem@gmail.com",company:"Neighborhood Insurance Agency",agencyPOC:"Martin Felix",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:269,start:"7/1/2024",vaName:"Gregg Nilo Jr Bation",vaTag:"Combo",status:"Terminated",vaEmail:"greggnilobjr@gmail.com",company:"Faith Insurance Agency",agencyPOC:"Jordan Wilson - Valley Group",timeZone:"MO - CST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:270,start:"7/1/2024",vaName:"Hans Matthew Delos Santos",vaTag:"Combo",status:"Resigned",vaEmail:"hmtdelossantos@gmail.com",company:"Kwan Insurance Services",agencyPOC:"Karson Kwan",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Johnny"},
  {id:271,start:"7/1/2024",vaName:"Jairus Misajon",vaTag:"Combo",status:"Active",vaEmail:"jairus.misajon@gmail.com",company:"Choice+ Insurance Services, Inc.",agencyPOC:"Zach Davis",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Celina"},
  {id:272,start:"7/1/2024",vaName:"Francis Anthony Gabriento",vaTag:"Combo",status:"Active",vaEmail:"work.fgabriento@gmail.com",company:"3R Insurance Agency",agencyPOC:"Andy Roy",timeZone:"CO - MDT",tl:"Martin",am:"Alicia",salesRep:"Celina"},
  {id:273,start:"7/1/2024",vaName:"Frances Maxine Trigo",vaTag:"Gen VA",status:"Active",vaEmail:"trigomaxine56@gmail.com",company:"Meridian",agencyPOC:"Shawn Rae",timeZone:"FL - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:274,start:"7/1/2024",vaName:"James Paul Sargado",vaTag:"Combo",status:"Active",vaEmail:"japsargado@gmail.com",company:"Luminary Insurance Group",agencyPOC:"Lance Gray",timeZone:"GA - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:275,start:"7/1/2024",vaName:"Isaiah Melchor Tan",vaTag:"Combo",status:"Active",vaEmail:"isaiahmelchortan@gmail.com",company:"Jackie Dees Insurance",agencyPOC:"Jackie Dee",timeZone:"NC- EST",tl:"Martin",am:"Alicia",salesRep:"Celina"},
  {id:276,start:"7/1/2024",vaName:"Fe Angeli Tomale",vaTag:"Combo",status:"Active",vaEmail:"fetomaleva@gmail.com",company:"Advantage Auto Tag and Insurance",agencyPOC:"Gregory Kramer",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Austin"},
  {id:277,start:"7/1/2024",vaName:"Jan Alfred Ranile",vaTag:"Combo",status:"Active",vaEmail:"jan.ranile@outlook.com",company:"CSP Insurance",agencyPOC:"Lawson Walker",timeZone:"SC - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:278,start:"7/1/2024",vaName:"Jake Boston",vaTag:"Combo",status:"Active",vaEmail:"jakeboston2000@gmail.com",company:"Worthen Insurance Group",agencyPOC:"Caroline Johnson",timeZone:"TX - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:279,start:"7/1/2024",vaName:"Mimi Brendamae Estorba",vaTag:"Gen VA",status:"Resigned",vaEmail:"mimifreelances@gmail.com",company:"Allco Fullerton Insurance Agency",agencyPOC:"Andrew Kadera",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Austin"},
  {id:280,start:"7/8/2024",vaName:"Princess Mae Inderio",vaTag:"Combo",status:"Active",vaEmail:"oberesp7366@gmail.com",company:"FHC Insurance",agencyPOC:"Anthony Bucca",timeZone:"FL - EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:281,start:"7/9/2024",vaName:"Honey Grace Tioaquen",vaTag:"Gen VA",status:"Terminated",vaEmail:"h.tioaquen96@gmail.com",company:"Rod Dunlap Insurance",agencyPOC:"Rod Dunlap",timeZone:"OR - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:282,start:"7/10/2024",vaName:"Ronald Allan Jr Sy",vaTag:"Gen VA",status:"Terminated",vaEmail:"ronaldsy97@gmail.com",company:"Paducah Insurance Agency LLC",agencyPOC:"Jared Morgan",timeZone:"KY - EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:283,start:"7/26/2024",vaName:"Sheena Mae Yurag",vaTag:"Gen VA",status:"Terminated",vaEmail:"sheenayurag87@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:284,start:"7/29/2024",vaName:"Anneka Beatriz Celis",vaTag:"Gen VA",status:"Resigned",vaEmail:"aecelis02@gmail.com",company:"FHC Insurance",agencyPOC:"Anthony Bucca",timeZone:"FL - EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:285,start:"7/29/2024",vaName:"Jessa Mae But-ay",vaTag:"Gen VA",status:"Active",vaEmail:"jessamebutay@gmail.com",company:"Scheier Insurance Agency",agencyPOC:"Allison Scheier",timeZone:"CA - PST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:286,start:"8/5/2024",vaName:"John Reybond Ho",vaTag:"Combo",status:"Active",vaEmail:"johnho1906@gmail.com/outlook.com",company:"Gannon Coyne & Associates, Inc.",agencyPOC:"Chris Coyne / Emma Coyne",timeZone:"PA - EST",tl:"Vince",am:"Alicia",salesRep:"Mike"},
  {id:287,start:"8/5/2024",vaName:"Prince John Demabildo",vaTag:"Combo",status:"Active",vaEmail:"demabilp@gmail.com",company:"MaxInsurance",agencyPOC:"Joe Luminiello",timeZone:"TX - CST",tl:"RJ",am:"Karla",salesRep:"Celina"},
  {id:288,start:"8/6/2024",vaName:"Jarvy Jayme",vaTag:"Gen VA",status:"Active",vaEmail:"jarvyjayme42@gmail.com",company:"Trailstone Insurance",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:289,start:"8/8/2024",vaName:"Ayessa Kyla Siton",vaTag:"Gen VA",status:"Terminated",vaEmail:"ayessaky.siton@gmail.com",company:"Matt Roberts Agency",agencyPOC:"Matt Roberts",timeZone:"NC- EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:290,start:"8/12/2024",vaName:"Frederick Fedee",vaTag:"Gen VA",status:"Active",vaEmail:"freggieweggie123@gmail.com",company:"Cord Insurance",agencyPOC:"Steve Renteria",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Johnny"},
  {id:291,start:"8/12/2024",vaName:"Maika Silagan",vaTag:"Gen VA",status:"Active",vaEmail:"mtsilagan@gmail.com",company:"Cord Insurance",agencyPOC:"Steve Renteria",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Johnny"},
  {id:292,start:"8/12/2024",vaName:"Michael John Baquero",vaTag:"Gen VA",status:"Resigned",vaEmail:"mikzlindzz@gmail.com",company:"Premiere Home & Auto",agencyPOC:"Peter Manfra",timeZone:"NJ - EST",tl:"Vince",am:"Niccole",salesRep:"Johnny"},
  {id:293,start:"8/12/2024",vaName:"Yousef Abdulrahman Zeinaldin",vaTag:"Gen VA",status:"Active",vaEmail:"otapzeinaldin@gmail.com",company:"Premiere Home & Auto",agencyPOC:"Peter Manfra",timeZone:"NJ - EST",tl:"Vince",am:"Niccole",salesRep:"Johnny"},
  {id:294,start:"8/12/2024",vaName:"Rona Mae Ramo",vaTag:"Combo",status:"Active",vaEmail:"ronamaeramo@gmail.com",company:"My Compass Insurance",agencyPOC:"Brandon Vanderbeck",timeZone:"NY - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:295,start:"8/19/2024",vaName:"Allyza Legaspi",vaTag:"Gen VA",status:"Active",vaEmail:"allyzaquesada@gmail.com",company:"Cord Insurance",agencyPOC:"Steve Renteria",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Johnny"},
  {id:296,start:"8/19/2024",vaName:"Diane Layne Fernandez",vaTag:"Gen VA",status:"Active",vaEmail:"dianelaynefernandez@gmail.com",company:"Cord Insurance",agencyPOC:"Steve Renteria",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Johnny"},
  {id:297,start:"8/19/2024",vaName:"Jose Lorenzo Ponce De Leon",vaTag:"Gen VA",status:"Active",vaEmail:"jolopdl99@gmail.com",company:"Cord Insurance",agencyPOC:"Steve Renteria",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Johnny"},
  {id:298,start:"8/26/2024",vaName:"Herma Mae Lima",vaTag:"Gen VA",status:"Active",vaEmail:"limahermamae@gmail.com",company:"Navigate Risk Advisors",agencyPOC:"TJ Worsencroft",timeZone:"OH - EST",tl:"Vince",am:"Niccole",salesRep:"Johnny"},
  {id:299,start:"9/3/2024",vaName:"Jayson Mark Aguirre",vaTag:"Combo",status:"Reprofiled",vaEmail:"jmdgaguirre@gmail.com",company:"Green Planet Insurance",agencyPOC:"Daniel Ahluwailia",timeZone:"AZ - MDT",tl:"Martin",am:"Karla",salesRep:"Johnny"},
  {id:300,start:"9/3/2024",vaName:"Zhaina Karylle Carbonell",vaTag:"Gen VA",status:"Active",vaEmail:"zhainakarylle8@gmail.com",company:"LTC Specialists, LLC",agencyPOC:"Andrew Goetz",timeZone:"MD - EST",tl:"Rezyl",am:"Alicia",salesRep:"Johnny"},
  {id:301,start:"9/9/2024",vaName:"Dyniela Buhia",vaTag:"Gen VA",status:"Active",vaEmail:"dynielabuhia@gmail.com",company:"Cord Insurance",agencyPOC:"Steve Renteria",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Johnny"},
  {id:302,start:"9/9/2024",vaName:"Miljun Magno",vaTag:"Gen VA",status:"Active",vaEmail:"miljunrealme23@gmail.com",company:"TrustPoint Services LLC",agencyPOC:"Kristina Reiling",timeZone:"KS - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:303,start:"9/9/2024",vaName:"T.j Kent Serafica",vaTag:"Gen VA",status:"Terminated",vaEmail:"tjkentserafica@gmail.com",company:"Hifi Associates",agencyPOC:"Ron Hirschhorn",timeZone:"NJ - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:304,start:"9/16/2024",vaName:"Jan Micheal Bello",vaTag:"Gen VA",status:"Active",vaEmail:"mtmlsbellojb@gmail.com",company:"Soliman Insurance",agencyPOC:"Max Soliman/Yesenia Rodriguez",timeZone:"AZ - MDT",tl:"Martin",am:"Karla",salesRep:"Mike"},
  {id:305,start:"9/16/2024",vaName:"Mikaella Beatrize Bouffard",vaTag:"Combo",status:"Terminated",vaEmail:"beatrizebouffard@gmail.com",company:"Copeland Insurance Agency",agencyPOC:"Vonda Copeland",timeZone:"KS - CST",tl:"Martin",am:"Niccole",salesRep:"Johnny"},
  {id:306,start:"10/7/2024",vaName:"Joel Rey Bueno",vaTag:"Combo",status:"Reprofiled",vaEmail:"bueno.joelrey@gmail.com",company:"Gaffney Insurance Agency & Financial Services, LLC",agencyPOC:"Stephan Gaffney",timeZone:"TN - CST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:307,start:"10/8/2024",vaName:"Christian Vern Aguilar",vaTag:"Combo",status:"Reprofiled",vaEmail:"aguilarvern06@gmail.com",company:"Family Insurance",agencyPOC:"Mark Bailey",timeZone:"IL - CST",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:308,start:"10/8/2024",vaName:"Bryn John Cornejo",vaTag:"Gen VA",status:"Active",vaEmail:"brynbydsgn@gmail.com",company:"Trailstone",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:309,start:"10/21/2024",vaName:"Aubrey Gail Estomago",vaTag:"Combo",status:"Resigned",vaEmail:"aubreyestomago407@gmail.com",company:"P3 Insurance Solutioins",agencyPOC:"Dariet Wallace",timeZone:"TN - CST",tl:"RJ",am:"Karla",salesRep:"Mike"},
  {id:310,start:"10/21/2024",vaName:"Kate Justin Diamante",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"katejustind@gmail.com",company:"Community Association Insurance Consulting, LLC",agencyPOC:"Melissa Blenker",timeZone:"WI - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:311,start:"10/21/2024",vaName:"Phoebe Espaldon",vaTag:"Gen VA",status:"Active",vaEmail:"phoebeespaldon23@gmail.com",company:"Beach Break Insurance",agencyPOC:"Rich Sabatowski",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:312,start:"10/28/2024",vaName:"Elisa Alexandra Lazarraga",vaTag:"Combo",status:"Inactive",vaEmail:"lazarragaelisa@gmail.com",company:"Ovation Insurance",agencyPOC:"Joel Dunham",timeZone:"IN - EST",tl:"Rezyl",am:"Alicia",salesRep:"Johnny"},
  {id:313,start:"10/28/2024",vaName:"John Elias Ibarra",vaTag:"Combo",status:"Active",vaEmail:"derpibarra@gmail.com",company:"Aspen Agency Inc",agencyPOC:"Rob Boyd",timeZone:"NY - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:314,start:"10/28/2024",vaName:"Aled Espinosa Geronimo",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"geronimoaled@gmail.com",company:"Manna Insurance Group",agencyPOC:"Daniel Vander Kooi",timeZone:"WA - PST",tl:"ED",am:"Alicia",salesRep:"Mike"},
  {id:315,start:"10/28/2024",vaName:"Mohaimen 'Eden' Dampac",vaTag:"Gen VA",status:"Resigned",vaEmail:"mohaimendampac20@gmail.com",company:"K Taylor Insurance Solutions",agencyPOC:"Ken Taylor Jr.",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:316,start:"10/29/2024",vaName:"Allana Lou Dapetilla",vaTag:"Gen VA",status:"Terminated",vaEmail:"allanalou99@gmail.com",company:"Loveland Insurance, LLC",agencyPOC:"Scott Loveland",timeZone:"MO - CST",tl:"RJ",am:"Karla",salesRep:"Mike"},
  {id:317,start:"11/4/2024",vaName:"Dianne Mangoranda",vaTag:"Gen VA",status:"Terminated",vaEmail:"diannemangoranda.vaph@gmail.com",company:"Vibrant Insurance Group",agencyPOC:"Ryan Swalve",timeZone:"IA - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:318,start:"11/5/2024",vaName:"Angelie grace Fortaleza",vaTag:"Gen VA",status:"Terminated",vaEmail:"fortalezaangelie@gmail.com",company:"Kiesau Insurance services",agencyPOC:"Jeffrey Kiesau",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:319,start:"11/5/2024",vaName:"Iona Eunice Fornolles",vaTag:"Gen VA",status:"Terminated",vaEmail:"fornollesionaeunice26@gmail.com",company:"Kiesau Insurance services",agencyPOC:"Jeffrey Kiesau",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:320,start:"11/5/2024",vaName:"Sheldon Fritz Villasand",vaTag:"Gen VA",status:"Terminated",vaEmail:"villasandfritz@gmail.com",company:"Utopia Mngt. & Insurance Services, Inc.",agencyPOC:"Grant Moseley",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Mike"},
  {id:321,start:"11/12/2024",vaName:"Jules Harriet Consigna",vaTag:"Gen VA",status:"Active",vaEmail:"julesconsigna@gmail.com",company:"Barber Insurance Agency",agencyPOC:"Cheryl Fessenden",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Johnny"},
  {id:322,start:"11/13/2024",vaName:"Bien Laddin Akmad",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"bien.akmd@gmail.com",company:"EG Bowman",agencyPOC:"Jelani Fenton",timeZone:"NY - EST",tl:"Via",am:"Niccole",salesRep:"Mike"},
  {id:323,start:"11/18/2024",vaName:"Nico Fernandez",vaTag:"Combo",status:"Active",vaEmail:"nicofernandez100700@gmail.com",company:"Choice+ Insurance Services, Inc.",agencyPOC:"Zach Davis",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Celina"},
  {id:324,start:"11/18/2024",vaName:"Shaira Mae Cantil",vaTag:"Combo",status:"Terminated",vaEmail:"cantilshai99@gmail.com",company:"Jordan and Jordan Insurance Group",agencyPOC:"Linda Jordan",timeZone:"TX - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:325,start:"11/24/2024",vaName:"Nicole Santisas",vaTag:"Gen VA",status:"Active",vaEmail:"santisas.nicole@gmail.com",company:"Cook Insurance Agency",agencyPOC:"Luke Cook",timeZone:"AR - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:326,start:"11/25/2024",vaName:"Al Sean Jr Sala",vaTag:"Gen VA",status:"Active",vaEmail:"jrsalaalsean@gmail.com",company:"Trailstone Insurance Group",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:327,start:"11/25/2024",vaName:"Kevin Matthew Dublin",vaTag:"Gen VA",status:"Active",vaEmail:"dublinkevinmatthew@gmail.com",company:"Trailstone Insurance Group",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:328,start:"11/25/2024",vaName:"Elijah Kent Nana",vaTag:"Combo",status:"Active",vaEmail:"elijahkentnana@gmail.com",company:"Muir Insurance Group",agencyPOC:"Mike Muir",timeZone:"IL - CST",tl:"RJ",am:"Karla",salesRep:"Celina"},
  {id:329,start:"12/2/2024",vaName:"Rosalyn Esmero",vaTag:"Gen VA",status:"Active",vaEmail:"rosalyesmero@gmail.com",company:"Heaton Bennett Insurance",agencyPOC:"Ross Bennett",timeZone:"TX - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:330,start:"12/6/2024",vaName:"John Louis Oliveros",vaTag:"Gen VA",status:"Terminated",vaEmail:"oliverosjohnlouis@gmail.com",company:"Heaton Bennett Insurance",agencyPOC:"Ross Bennett",timeZone:"TX - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:331,start:"12/9/2024",vaName:"Mary Joy Indac",vaTag:"Combo",status:"Active",vaEmail:"mjindac.ipeasc@gmail.com",company:"Ryan P Conway Agency LLC",agencyPOC:"Ryan Conway",timeZone:"IL - CST",tl:"RJ",am:"Karla",salesRep:"Mike"},
  {id:332,start:"12/16/2024",vaName:"Brisbane Alexander Cordero",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"brisbanecordero46@gmail.com",company:"Haymes Insurance Agency",agencyPOC:"Jennie Haymes",timeZone:"MO - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:333,start:"12/16/2024",vaName:"Melody David",vaTag:"Combo",status:"Resigned",vaEmail:"Melodydavid.1994@gmail.com",company:"Weer Insurance Group",agencyPOC:"Scott Weer",timeZone:"IL - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:334,start:"12/17/2024",vaName:"Thea Arns Timbal",vaTag:"Gen VA",status:"Terminated",vaEmail:"thearnsotto1@gmail.com",company:"America Insurance Agency",agencyPOC:"Nathan Breece",timeZone:"PA - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:335,start:"12/23/2024",vaName:"Bryan Christian Salvador",vaTag:"Combo",status:"Terminated",vaEmail:"brianamoguis@yahoo.com",company:"Ramey King Insurance",agencyPOC:"Mandy Smith",timeZone:"TX - CST",tl:"RJ",am:"Karla",salesRep:"Mike"},
  {id:336,start:"12/30/2024",vaName:"Kyle Guissepphe Guille Dacup",vaTag:"Combo",status:"Terminated",vaEmail:"kyleguille@gmail.com",company:"Fort Collins Insurance",agencyPOC:"Ryan Jackson",timeZone:"CO - MDT",tl:"Martin",am:"Alicia",salesRep:"Mike"},
  {id:337,start:"12/30/2024",vaName:"Lorie Angie Pardillo",vaTag:"Combo",status:"Reprofiled",vaEmail:"pardillolor@gmail.com",company:"The Hanks Group",agencyPOC:"Rod Hanks",timeZone:"TX - CST",tl:"RJ",am:"Niccole",salesRep:"Mike"},
  {id:338,start:"12/30/2024",vaName:"Mary Joy Bocawe",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"maryjoybocawe611@gmail.com",company:"The Insurance Pad",agencyPOC:"Kim Rankin",timeZone:"OH - EST",tl:"Rezyl",am:"Karla",salesRep:"Mike"},
  {id:339,start:"12/30/2024",vaName:"Joshua Elijah Sindao",vaTag:"Combo",status:"Active",vaEmail:"joshuaelijahsindao@gmail.com",company:"Browning Reagle Insurance Agency",agencyPOC:"David Reagle",timeZone:"MD - EST",tl:"Vince",am:"Karla",salesRep:"Mike"},
  {id:340,start:"12/30/2024",vaName:"Charmeine Chatto",vaTag:"Combo",status:"Active",vaEmail:"charmeinegchatto@gmail.com",company:"Centennial Insurance Group, INC",agencyPOC:"Tami Birkes",timeZone:"OK - CST",tl:"RJ",am:"Alicia",salesRep:"Celina"},
  {id:341,start:"12/30/2024",vaName:"Brad Ford Rosal",vaTag:"Combo",status:"Active",vaEmail:"bfdrosal@gmail.com",company:"Nowlin Insurance Group LLC",agencyPOC:"Lance Nowlin",timeZone:"TX - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:342,start:"1/6/2025",vaName:"Micahel Jerien Taño",vaTag:"Gen VA",status:"Terminated",vaEmail:"tanomikmik@gmail.com",company:"Cavalry Insurance Services",agencyPOC:"Nicole Wu",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Johnny"},
  {id:343,start:"1/6/2025",vaName:"Rommel Cuta",vaTag:"Combo",status:"Terminated",vaEmail:"rommelcuta@gmail.com",company:"Allison Insurance",agencyPOC:"Scott Nesbitt",timeZone:"AL - CST",tl:"RJ",am:"Karla",salesRep:"Mike"},
  {id:344,start:"1/7/2025",vaName:"Rosie Fe Ocho",vaTag:"Gen VA",status:"Active",vaEmail:"rosiefeocho0920@gmail.com",company:"Kraken Insurance - Tyler Pearson",agencyPOC:"Tyler Pearson",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Johnny"},
  {id:345,start:"1/9/2025",vaName:"Fairie Pearl Tamargo",vaTag:"Gen VA",status:"Active",vaEmail:"tamargofaye@gmail.com",company:"Prostar Insurance",agencyPOC:"John Pfeil",timeZone:"WA - PST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:346,start:"1/13/2025",vaName:"Aella Katryn Campo",vaTag:"Gen VA",status:"Resigned",vaEmail:"campo.aella@gmail.com",company:"Navigate Risk Advisors",agencyPOC:"TJ Worsencroft",timeZone:"OH - EST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:347,start:"1/14/2025",vaName:"Jenneth Castillanes",vaTag:"Combo",status:"Active",vaEmail:"qaseoknam@gmail.com",company:"LH&W Insurance",agencyPOC:"Michael Whitcraft",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Johnny"},
  {id:348,start:"1/20/2025",vaName:"Hazel Ann Baui",vaTag:"Combo",status:"Terminated",vaEmail:"hazelann.baui@gmail.com",company:"Meyer Insurance",agencyPOC:"Eric Meyer/Lisa Peterson",timeZone:"SD - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:349,start:"1/20/2025",vaName:"Armando Jr Labton",vaTag:"Combo",status:"Active",vaEmail:"labtonarman@gmail.com",company:"Stevens Investments & Insurance",agencyPOC:"Jodi Stevens",timeZone:"OH - EST",tl:"Rezyl",am:"Alicia",salesRep:"Johnny"},
  {id:350,start:"1/27/2025",vaName:"Jeoffrey Poe Cadano",vaTag:"Gen VA",status:"Resigned",vaEmail:"cjeoffreypoe@gmail.com",company:"Agency Automate",agencyPOC:"Bill Jenkins",timeZone:"MN - CST",tl:"Vince",am:"Alicia",salesRep:"Austin"},
  {id:351,start:"1/27/2025",vaName:"Ralph David Malubay",vaTag:"Combo",status:"Active",vaEmail:"davidxbusiness@gmail.com",company:"Sutkay Insurance",agencyPOC:"Paul Sutkay",timeZone:"IL - CST",tl:"RJ",am:"Alicia",salesRep:"Celina"},
  {id:352,start:"2/3/2025",vaName:"Clark Aron Sastrellas",vaTag:"Gen VA",status:"Resigned",vaEmail:"sastrellasclark@gmail.com",company:"Procare",agencyPOC:"Filip Lundstedt",timeZone:"FL - EST",tl:"Rezyl",am:"Karla",salesRep:"Mike"},
  {id:353,start:"2/10/2025",vaName:"Charlene Cuas",vaTag:"Gen VA",status:"Active",vaEmail:"charlenecuas98@gmail.com",company:"Jessica Liu Insurance Services",agencyPOC:"Jessica Liu",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Johnny"},
  {id:354,start:"2/10/2025",vaName:"Francis Ean Jon Lumbayon",vaTag:"Gen VA",status:"Active",vaEmail:"franslumbayon@gmail.com",company:"Stacks Brokerage",agencyPOC:"Austin Kaszuba/Taylor Stacks",timeZone:"FL - EST",tl:"Rezyl",am:"Alicia",salesRep:"Johnny"},
  {id:355,start:"2/10/2025",vaName:"Leo Angelo Saycon",vaTag:"Combo",status:"Active",vaEmail:"lasaycon@gmail.com",company:"The Salvati Insurance Group",agencyPOC:"Thomas Salvati",timeZone:"MI - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:356,start:"2/10/2025",vaName:"Fatima Comawas",vaTag:"Combo",status:"Active",vaEmail:"fatimacomawas968@gmail.com",company:"The Gordon Agency",agencyPOC:"Michael Gordon",timeZone:"WI - CST",tl:"RJ",am:"Karla",salesRep:"Celina"},
  {id:357,start:"2/12/2025",vaName:"Rowie Sarillana",vaTag:"Combo",status:"Resigned",vaEmail:"rowie.c.sarillana@gmail.com",company:"Pinnacle Point Insurance",agencyPOC:"Aaron England",timeZone:"TX - CST",tl:"RJ",am:"Niccole",salesRep:"Johnny"},
  {id:358,start:"2/16/2025",vaName:"Andrea Arce",vaTag:"Gen VA",status:"Active",vaEmail:"aarce0813@gmail.com",company:"Grimes Insurance",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:359,start:"2/17/2025",vaName:"Lord John Oliveros",vaTag:"Gen VA",status:"Active",vaEmail:"ljoliveros45@gmail.com",company:"Great Park Insurance",agencyPOC:"Daniel Seong",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:360,start:"2/17/2025",vaName:"Shanaz Gani",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"shanazgani12@gmail.com",company:"Legacy Lines Insurance & Financial",agencyPOC:"Kacey Thomas",timeZone:"NV - PST",tl:"ED",am:"Alicia",salesRep:"Mike"},
  {id:361,start:"2/24/2025",vaName:"Daven Jay Piloton",vaTag:"Gen VA",status:"Active",vaEmail:"daven.piloton17@gmail.com",company:"Sale Power CRM",agencyPOC:"David Lefevre",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:""},
  {id:362,start:"2/24/2025",vaName:"Almie Jane Romanillos",vaTag:"Gen VA",status:"Active",vaEmail:"sollinamoralmie@gmail.com",company:"Rain Tree Group",agencyPOC:"Joey Capps",timeZone:"OK - CST",tl:"RJ",am:"Karla",salesRep:"Mike"},
  {id:363,start:"2/24/2025",vaName:"Noreen Velez",vaTag:"Gen VA",status:"Active",vaEmail:"noreenvelez27@gmail.com",company:"Varde Insurance Group",agencyPOC:"Grant Johnson",timeZone:"OK - CST",tl:"RJ",am:"Alicia",salesRep:"John"},
  {id:364,start:"2/24/2025",vaName:"Patricia Arielle Pascual",vaTag:"Gen VA",status:"Resigned",vaEmail:"patriciaariellep@gmail.com",company:"GlobalGreen Insurance Agency",agencyPOC:"Hassan Jaafar",timeZone:"MI - EST",tl:"Rezyl",am:"Karla",salesRep:"Austin"},
  {id:365,start:"3/10/2025",vaName:"Joshua Villocino",vaTag:"Gen VA",status:"Terminated",vaEmail:"joshuavillocino@gmail.com",company:"Legacy Lines Insurance & Financial",agencyPOC:"Michael Smith",timeZone:"NV - PST",tl:"ED",am:"Alicia",salesRep:"Celina"},
  {id:366,start:"3/17/2025",vaName:"Louie Jay Elio",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"ljve1398@gmail.com",company:"Eskew Insurance Agency",agencyPOC:"Nic Eskew",timeZone:"WY - MDT",tl:"Martin",am:"Karla",salesRep:"Johnny"},
  {id:367,start:"3/17/2025",vaName:"Dolly Mae Sementela",vaTag:"Gen VA",status:"Active",vaEmail:"sementeladollymae@gmail.com",company:"Murphy Business",agencyPOC:"Joe Chiarello",timeZone:"FL - EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:368,start:"3/17/2025",vaName:"Leonard Joshua Perez",vaTag:"Combo",status:"Active",vaEmail:"perezleonardjoshua@gmail.com",company:"Hardenbergh Insurace Group",agencyPOC:"Jon Sharp / Tracey Smith /Heather Pinard",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Celina"},
  {id:369,start:"3/17/2025",vaName:"Tracy Nicole Dumogho",vaTag:"Gen VA",status:"Resigned",vaEmail:"tracyworks.dvo@gmail.com",company:"Ram Risk Group",agencyPOC:"Daniel Tighe",timeZone:"FL - EST",tl:"Rezyl",am:"Alicia",salesRep:"Celina"},
  {id:370,start:"3/18/2025",vaName:"Psyche Diana Enojo",vaTag:"Gen VA",status:"Resigned",vaEmail:"enojopsychediana@gmail.com",company:"The Salvati Insurance Group",agencyPOC:"Thomas Salvati",timeZone:"MI - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:371,start:"3/24/2025",vaName:"Jeazelle Mia Maslog",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"miamaslog08@gmail.com",company:"Trustpoint Insurance",agencyPOC:"Kristina Reiling",timeZone:"KS - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:372,start:"3/31/2025",vaName:"Jay Ryan Dedumo",vaTag:"Gen VA",status:"Terminated",vaEmail:"ryanjd2497@gmail.com",company:"AA Lares Insurance Services, Inc.",agencyPOC:"Patty Lares",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Austin"},
  {id:373,start:"3/31/2025",vaName:"Bryan Neil Silva",vaTag:"Gen VA",status:"Active",vaEmail:"silvabryaneil@gmail.com",company:"Omega Insurance Group",agencyPOC:"Ryan Sanne",timeZone:"NE - CST",tl:"RJ",am:"Niccole",salesRep:"Mike"},
  {id:374,start:"4/2/2025",vaName:"Alyannah Villarosa",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"alyannahvillarosa123@gmail.com",company:"Redmon Insurance Agency",agencyPOC:"Kai Redmon",timeZone:"IL - CST",tl:"RJ",am:"Karla",salesRep:"Celina"},
  {id:375,start:"4/7/2025",vaName:"Dhahran Dilangalen",vaTag:"Combo",status:"Reprofiled",vaEmail:"dhahran.dilangalen1997@gmail.com",company:"Wilde Wealth Insurance Services LLC",agencyPOC:"Taylor Whatcott",timeZone:"AZ - MDT",tl:"Martin",am:"Alicia",salesRep:"Johnny"},
  {id:376,start:"4/7/2025",vaName:"Edna Bonilla",vaTag:"Gen VA",status:"Terminated",vaEmail:"nadiebonilla12@gmail.com",company:"V.I.P. Insurance Services",agencyPOC:"Tiffany Leone",timeZone:"AZ - MDT",tl:"Martin",am:"Karla",salesRep:"Celina"},
  {id:377,start:"4/7/2025",vaName:"Christian Mark Abang",vaTag:"Combo",status:"Active",vaEmail:"markchristianabang20@gmail.com",company:"Jennings Bryan-Chappell Insurance Agency",agencyPOC:"Josh Chappell",timeZone:"NC- EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:378,start:"4/7/2025",vaName:"Niel Perez",vaTag:"Combo",status:"Active",vaEmail:"mrnielperez@gmail.com",company:"Jennings Bryan-Chappell Insurance Services",agencyPOC:"Josh Chappell",timeZone:"NC- EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:379,start:"4/7/2025",vaName:"Rembrant Dagatan",vaTag:"Combo",status:"Terminated",vaEmail:"dagatanrembrant3@gmail.com",company:"Slaughter Insurance Agency",agencyPOC:"Adam Slaughter",timeZone:"TX - CST",tl:"RJ",am:"Karla",salesRep:"Mike"},
  {id:380,start:"4/8/2025",vaName:"Gideon Joash Gili",vaTag:"Gen VA",status:"Terminated",vaEmail:"joashhhgili@gmail.com",company:"Jessica Liu Insurance Services",agencyPOC:"Jessica Liu",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Johnny"},
  {id:381,start:"4/8/2025",vaName:"Leah Mae Abella",vaTag:"Gen VA",status:"Active",vaEmail:"leahmaecozoabella@gmail.com",company:"Cord Insurance",agencyPOC:"Steve Renteria",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Johnny"},
  {id:382,start:"4/14/2025",vaName:"Mary Jane Verdida",vaTag:"Combo",status:"Terminated",vaEmail:"darylmitzmolina1297@gmail.com",company:"Franke Insurance Services",agencyPOC:"Michael Franke",timeZone:"TX - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:383,start:"4/21/2025",vaName:"John Richard Bajao",vaTag:"Combo",status:"Resigned",vaEmail:"john.drahcirr@gmail.com",company:"Optimal Insurance AZ",agencyPOC:"Jeremy Besse",timeZone:"AZ - MDT",tl:"Martin",am:"Karla",salesRep:"Johnny"},
  {id:384,start:"4/21/2025",vaName:"Pauline Ingrid Broas",vaTag:"Gen VA",status:"Active",vaEmail:"plnbroas@gmail.com",company:"Priority Risk Management",agencyPOC:"Mark Shoultz",timeZone:"IN - EST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:385,start:"4/28/2025",vaName:"Eugene Belong",vaTag:"Gen VA",status:"Terminated",vaEmail:"eugenebelong.va3@gmail.com",company:"Kiesau Insurance Services",agencyPOC:"Jeffrey Kiesau",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:386,start:"4/28/2025",vaName:"Leane Dane Sadiang-abay",vaTag:"Gen VA",status:"Terminated",vaEmail:"ln.dn1625@gmail.com",company:"Allison Scheier Insurance Agency",agencyPOC:"Allison Scheier",timeZone:"CA - PST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:387,start:"4/28/2025",vaName:"Clinton Orio",vaTag:"Gen VA",status:"Active",vaEmail:"nabzstyle21@gmail.com",company:"Kiesau Insurance Services",agencyPOC:"Jeffrey Kiesau",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:388,start:"4/28/2025",vaName:"Renz Michael Dayanghirang",vaTag:"Gen VA",status:"Active",vaEmail:"dayanghirangkael@gmail.com",company:"Kiesau Insurance Services",agencyPOC:"Jeffrey Kiesau",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:389,start:"4/28/2025",vaName:"Kiarra Nichole Arabejo",vaTag:"Gen VA",status:"Active",vaEmail:"knicholearabejo@gmail.com",company:"Barfield Insurance Agency",agencyPOC:"James Barfield",timeZone:"FL - EST",tl:"Rezyl",am:"Karla",salesRep:"Celina"},
  {id:390,start:"5/5/2025",vaName:"Pierce Jyro Fernandez",vaTag:"Gen VA",status:"Terminated",vaEmail:"pfernandez3797@gmail.com",company:"TrustPoint Insurance & Real Estate",agencyPOC:"Kristina Reiling",timeZone:"KS - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:391,start:"5/5/2025",vaName:"Rodolfo Miguel Jabrica",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"rmcjabrica@gmail.com",company:"The Insurance Team",agencyPOC:"Steve Fisher",timeZone:"AZ - MDT",tl:"Martin",am:"Niccole",salesRep:"Celina"},
  {id:392,start:"5/12/2025",vaName:"Ella Mae Alberio",vaTag:"Gen VA",status:"Active",vaEmail:"alberioellamae@gmail.com",company:"Trailstone",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:393,start:"5/12/2025",vaName:"Rhona May Bahidi",vaTag:"Combo",status:"Active",vaEmail:"rhonamaybahidi@gmail.com",company:"Nusure Insurance",agencyPOC:"Michael Alvarez",timeZone:"FL - EST",tl:"Rezyl",am:"Karla",salesRep:"John"},
  {id:394,start:"5/12/2025",vaName:"Edna Marie Villarino",vaTag:"Gen VA",status:"Active",vaEmail:"villarinoednamarie@gmail.com",company:"Navigate Risk",agencyPOC:"TJ Worsencroft",timeZone:"OH - EST",tl:"Vince",am:"Niccole",salesRep:"Johnny"},
  {id:395,start:"5/12/2025",vaName:"Kate Justin Diamante",vaTag:"Gen VA",status:"Active",vaEmail:"katejustind@gmail.com",company:"Grimes Insurance",agencyPOC:"Niki Saavedra",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:396,start:"5/13/2025",vaName:"Hazel Joyce Bubuli",vaTag:"Gen VA",status:"Terminated",vaEmail:"hazeljoyce120599@gmail.com",company:"Varde Insurance Group",agencyPOC:"Grant Johnson",timeZone:"OK - CST",tl:"RJ",am:"Alicia",salesRep:"John"},
  {id:397,start:"5/19/2025",vaName:"Jerome Caballero",vaTag:"Combo",status:"Terminated",vaEmail:"jeromecaballero53@gmail.com",company:"Flathead Insurance",agencyPOC:"James Entzi",timeZone:"ID - MDT",tl:"Martin",am:"Karla",salesRep:"Celina"},
  {id:398,start:"5/19/2025",vaName:"Maye Caila Joy Maniquez",vaTag:"Combo",status:"Terminated",vaEmail:"cailamaniquez@gmail.com",company:"Brighton Insurance",agencyPOC:"Vernon Williams",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"John"},
  {id:399,start:"5/19/2025",vaName:"Monsur Jundam",vaTag:"Gen VA",status:"Terminated",vaEmail:"jundammonsur31@gmail.com",company:"Trailstone Insurance Group",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:400,start:"5/19/2025",vaName:"Melody Llaguno",vaTag:"Combo",status:"Active",vaEmail:"melodyllgno@gmail.com",company:"Community Insurance",agencyPOC:"Melissa Blenker",timeZone:"WI - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:401,start:"5/19/2025",vaName:"Xymon Franz De Jesus",vaTag:"Gen VA",status:"Resigned",vaEmail:"dejesusxfl@gmail.com",company:"Grimes Insurance",agencyPOC:"Niki Saavedra",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:402,start:"5/27/2025",vaName:"Erika Joyce Marcos",vaTag:"Gen VA",status:"Terminated",vaEmail:"ejoycemarcos@gmail.com",company:"Steele Insurance Agency",agencyPOC:"Steve Renteria",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Austin"},
  {id:403,start:"5/27/2025",vaName:"Floitte Jamie Santiago",vaTag:"Combo",status:"Resigned",vaEmail:"sfloitte@gmail.com",company:"Zeigler Insurance",agencyPOC:"Dirk Zeigler",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Austin"},
  {id:404,start:"5/27/2025",vaName:"James Erick Leorito",vaTag:"Gen VA",status:"Active",vaEmail:"jamesleorito@gmail.com",company:"Hardenbergh Insurance Group",agencyPOC:"Jon Sharp / Tracey Smith /Heather Pinard",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Celina"},
  {id:405,start:"5/27/2025",vaName:"Jan Jocef Juanillo",vaTag:"Gen VA",status:"Active",vaEmail:"janjocefjuan@gmail.com",company:"Hardenbergh Insurance Group",agencyPOC:"Jon Sharp / Tracey Smith /Heather Pinard",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Celina"},
  {id:406,start:"5/27/2025",vaName:"Marlou Queen Fernandez",vaTag:"Gen VA",status:"Active",vaEmail:"marlouf944@gmail.com",company:"Belmont Insurance Services",agencyPOC:"Landon Phillips",timeZone:"SC - EST",tl:"Rezyl",am:"Karla",salesRep:"Mike"},
  {id:407,start:"6/2/2025",vaName:"John Winnie Marqueda",vaTag:"Gen VA",status:"Resigned",vaEmail:"jowiemar243@gmail.com",company:"AllTrust Insurance Agency LLC",agencyPOC:"Kelly Wang",timeZone:"MO - CST",tl:"RJ",am:"Karla",salesRep:"Mike"},
  {id:408,start:"6/3/2025",vaName:"Kimberly Salazar",vaTag:"Gen VA",status:"Active",vaEmail:"kim.salazar0810@gmail.com",company:"Jessica Liu Insurance Services",agencyPOC:"Jessica Liu",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Johnny"},
  {id:409,start:"6/9/2025",vaName:"Dhel Navacilla",vaTag:"Gen VA",status:"Terminated",vaEmail:"dhelnicanava@gmail.com",company:"Clear View Insurance",agencyPOC:"Jim Jennings",timeZone:"MO - CST",tl:"RJ",am:"Karla",salesRep:"Celina"},
  {id:410,start:"6/9/2025",vaName:"Mc Luize Laurence Saral",vaTag:"Combo",status:"Active",vaEmail:"mcluizelaurence@gmail.com",company:"Jordan and Jordan Insurance Group",agencyPOC:"Linda Jordan",timeZone:"TX - CST",tl:"RJ",am:"Karla",salesRep:"Mike"},
  {id:411,start:"6/13/2025",vaName:"Antonio Miguel Eugenio",vaTag:"Gen VA",status:"Active",vaEmail:"migueleugenio94@gmail.com",company:"Heaton Bennett Insurance",agencyPOC:"Ross Bennett",timeZone:"TX - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:412,start:"6/16/2025",vaName:"Dianne Nicole Manalo",vaTag:"Gen VA",status:"Active",vaEmail:"dnpmanalo@gmail.com",company:"Allco Fullerton Insurance Agency",agencyPOC:"Andrew Kadera",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Austin"},
  {id:413,start:"6/16/2025",vaName:"Onmejey Obus",vaTag:"Gen VA",status:"Active",vaEmail:"omnejeyo@gmail.com",company:"Allco Fullerton Insurance Agency",agencyPOC:"Andrew Kadera",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Austin"},
  {id:414,start:"6/18/2025",vaName:"Razdyl Jade Banghal",vaTag:"Gen VA",status:"Active",vaEmail:"rj.banghal@gmail.com",company:"Bradley Insurance",agencyPOC:"Jack Jones",timeZone:"TN - CST",tl:"RJ",am:"Alicia",salesRep:"Austin"},
  {id:415,start:"6/23/2025",vaName:"Ma. Ross 'Flame' Rica Villanueva",vaTag:"Gen VA",status:"Active",vaEmail:"vmariarossrica@gmail.com",company:"Soliman Insurance",agencyPOC:"Max Soliman/Yesenia",timeZone:"AZ - MDT",tl:"Martin",am:"Karla",salesRep:"Mike"},
  {id:416,start:"6/23/2025",vaName:"Kenn Peter Viscayno",vaTag:"Combo",status:"Active",vaEmail:"kptviscayno@gmail.com",company:"Copeland Insurance Agency",agencyPOC:"Vonda Copeland",timeZone:"KS - CST",tl:"Martin",am:"Niccole",salesRep:"Johnny"},
  {id:417,start:"6/23/2025",vaName:"Wilter Dajao",vaTag:"Gen VA",status:"Resigned",vaEmail:"dajaowilter1995@gmail.com",company:"Taylor Moore Insurance Agency",agencyPOC:"Ryan Moore",timeZone:"VT - EST",tl:"Rezyl",am:"Alicia",salesRep:"Austin"},
  {id:418,start:"6/26/2025",vaName:"Sergei Vaughn Calumpong",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"svc.clmpng@gmail.com",company:"Masters of Disasters",agencyPOC:"Larry Maistros",timeZone:"OH - EST",tl:"Rezyl",am:"Niccole",salesRep:"Celina"},
  {id:419,start:"6/30/2025",vaName:"Angelica Berondo",vaTag:"Combo",status:"Active",vaEmail:"berondoangelica@gmail.com",company:"PrimeWest Insurance Brokerage, Inc.",agencyPOC:"Gabby Rodriguez / Chris Rodriguez",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Austin"},
  {id:420,start:"7/14/2025",vaName:"Joash Gili",vaTag:"Gen VA",status:"Terminated",vaEmail:"joashhhgili@gmail.com",company:"Taylor Moore Insurance Agency",agencyPOC:"Ryan Moore",timeZone:"VT - EST",tl:"Rezyl",am:"Alicia",salesRep:"Austin"},
  {id:421,start:"7/14/2025",vaName:"Mark Knoffer Sabac",vaTag:"Gen VA",status:"Terminated",vaEmail:"marksabac07@gmail.com",company:"The Salvati Insurance Group",agencyPOC:"Thomas Salvati",timeZone:"MI - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:422,start:"7/14/2025",vaName:"Dwight Padalapat",vaTag:"Gen VA",status:"Active",vaEmail:"dwightinahhp@gmail.com",company:"Choice Plus Insurance Services Inc",agencyPOC:"Zach Davis",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Celina"},
  {id:423,start:"7/14/2025",vaName:"Kie An Hannah Hernane",vaTag:"Gen VA",status:"Active",vaEmail:"broccolihannah@gmail.com",company:"Choice Plus Insurance Services Inc",agencyPOC:"Zach Davis",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Celina"},
  {id:424,start:"7/14/2025",vaName:"Shannen Lurot",vaTag:"Gen VA",status:"Active",vaEmail:"shannenlurot.16@gmail.com",company:"Bucher Family Allstate",agencyPOC:"Cass Catalano",timeZone:"IN - EST",tl:"Rezyl",am:"Karla",salesRep:"Mike"},
  {id:425,start:"7/14/2025",vaName:"Sherry Nikolette Edmilao",vaTag:"Gen VA",status:"Terminated",vaEmail:"sherry.edmilao@gmail.com",company:"Taylor Moore Insurance Agency",agencyPOC:"Ryan Moore",timeZone:"VT - EST",tl:"Rezyl",am:"Alicia",salesRep:"Austin"},
  {id:426,start:"7/21/2025",vaName:"Dominic Dianne Parada",vaTag:"Combo",status:"Terminated",vaEmail:"dparada060398@gmail.com",company:"AA Lares Insurance Services, Inc.",agencyPOC:"Patty Lares",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Austin"},
  {id:427,start:"7/28/2025",vaName:"Eric Luke Buluran",vaTag:"Combo",status:"Terminated",vaEmail:"ericlukeb.1997@gmail.com",company:"Southwestern Insurance Group",agencyPOC:"David Stuart",timeZone:"TN - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:428,start:"7/28/2025",vaName:"Fiona Maurrice Bahian",vaTag:"Combo",status:"Active",vaEmail:"fionabahian2@gmail.com",company:"The Salvati Insurance Group",agencyPOC:"Thomas Salvati",timeZone:"MI - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:429,start:"7/28/2025",vaName:"Thea Arns Timbal",vaTag:"Gen VA",status:"Resigned",vaEmail:"thearnsotto1@gmail.com",company:"ACG Insure",agencyPOC:"Chris Shepherd",timeZone:"KS - CST",tl:"RJ",am:"Alicia",salesRep:"Celina"},
  {id:430,start:"8/4/2025",vaName:"Aziljun Fontaños",vaTag:"Combo",status:"Resigned",vaEmail:"aziljun97@gmail.com",company:"My Compass Insurance LLC",agencyPOC:"Brandon Vanderbeck",timeZone:"NY - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:431,start:"8/4/2025",vaName:"Joed Aguilar",vaTag:"Combo",status:"Active",vaEmail:"aguilarjoed153@gmail.com",company:"Dulles Insurance",agencyPOC:"Nick Ladavaere",timeZone:"FL - EST",tl:"Martin",am:"Alicia",salesRep:"Johnny"},
  {id:432,start:"8/5/2025",vaName:"Rechile Pineda",vaTag:"Gen VA",status:"Terminated",vaEmail:"rechilepineda@gmail.com",company:"Glenn S. Caldwell Insurance Services Inc.",agencyPOC:"Candice Myers",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Celina"},
  {id:433,start:"8/5/2025",vaName:"Sitty Nazerin Aseri",vaTag:"Gen VA",status:"Active",vaEmail:"aserisittynazerin@gmail.com",company:"Batchelder Bros. Insurance",agencyPOC:"Andrew Thayer",timeZone:"ME - EST",tl:"Martin",am:"Karla",salesRep:"Mike"},
  {id:434,start:"8/6/2025",vaName:"Anna Patricia Fara-On",vaTag:"Gen VA",status:"Terminated",vaEmail:"annapatriciafaraon@gmail.com",company:"HiFi Associates",agencyPOC:"Ron Hirschhorn",timeZone:"NJ - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:435,start:"8/7/2025",vaName:"Christian Vern Aguilar",vaTag:"Combo",status:"Active",vaEmail:"aguilarvern06@gmail.com",company:"Cord Insurance/Steele Insurance",agencyPOC:"Niccole Williams",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Johnny"},
  {id:436,start:"8/11/2025",vaName:"Joanna Bubutan",vaTag:"Gen VA",status:"Active",vaEmail:"jnnbbtn@gmail.com",company:"Beach Break Insurance Agency",agencyPOC:"Rich Sabatowski",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:437,start:"8/11/2025",vaName:"Doris Mae Tabuno",vaTag:"Gen VA",status:"Active",vaEmail:"tabunodorismae@gmail.com",company:"Terral Insurance, LLC",agencyPOC:"Richard Davis",timeZone:"MS - CST",tl:"RJ",am:"Alicia",salesRep:"Celina"},
  {id:438,start:"8/12/2025",vaName:"Rembrant Dagatan",vaTag:"Gen VA",status:"Active",vaEmail:"dagatanrembrant3@gmail.com",company:"Trailstone",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:439,start:"8/18/2025",vaName:"Lauro Bunda",vaTag:"Gen VA",status:"Active",vaEmail:"bundalauro@gmail.com",company:"ACG Insure",agencyPOC:"Chris Shepherd",timeZone:"KS - CST",tl:"RJ",am:"Alicia",salesRep:"Celina"},
  {id:440,start:"8/25/2025",vaName:"Jayson Mark Aguirre",vaTag:"Combo",status:"Active",vaEmail:"jmdgaguirre@gmail.com",company:"Meyer Insurance Agency",agencyPOC:"Eric Meyer",timeZone:"SD - CST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:441,start:"8/25/2025",vaName:"Vience Jhon Banzali",vaTag:"Combo",status:"Active",vaEmail:"viencejhonalimento.banzali@gmail.com",company:"Schultz Insurance Services Inc.",agencyPOC:"Mike Schultz",timeZone:"IL - CST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:442,start:"8/27/2025",vaName:"Ivan Kent Cano",vaTag:"Combo",status:"Active",vaEmail:"ivankentcano.va@gmail.com / canoivankent.13@gmail.com",company:"My Compass Insurance LLC",agencyPOC:"Brandon Vanderbeck",timeZone:"NY - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:443,start:"8/28/2025",vaName:"Paul Janray Billones",vaTag:"Gen VA",status:"Resigned",vaEmail:"billonespau@gmail.com",company:"GlobalGreen Insurance Agency",agencyPOC:"Hassan Jaafar",timeZone:"MI - EST",tl:"Rezyl",am:"Karla",salesRep:"Austin"},
  {id:444,start:"9/2/2025",vaName:"Ezekiel Luis Arellano",vaTag:"Gen VA",status:"Active",vaEmail:"ginko.arellano@gmail.com",company:"Caldwell Insurance Services Inc",agencyPOC:"Candice Myers",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Celina"},
  {id:445,start:"9/2/2025",vaName:"Jian Paculaba",vaTag:"Gen VA",status:"Active",vaEmail:"jian.paculaba13@gmail.com",company:"Combined Benefits Administrators",agencyPOC:"Sidney Dahlhauser",timeZone:"LA - PDT",tl:"ED",am:"Karla",salesRep:"Celina"},
  {id:446,start:"9/2/2025",vaName:"Jhoanne Malla",vaTag:"Combo",status:"Active",vaEmail:"jhoannebilbao.work@gmail.com",company:"Integrity Insurance Group",agencyPOC:"Michael Smith",timeZone:"PA - EST",tl:"Rezyl",am:"Niccole",salesRep:"John"},
  {id:447,start:"9/2/2025",vaName:"Joren Carcallas",vaTag:"Gen VA",status:"Active",vaEmail:"jorenc123@gmail.com",company:"Worthen Insurance Group",agencyPOC:"Caroline Johnson",timeZone:"TX - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:448,start:"9/8/2025",vaName:"Alex James William Lu",vaTag:"Combo",status:"Reprofiled",vaEmail:"alexlu0421@gmail.com",company:"Garcia Agency",agencyPOC:"Jonathan Garcia",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Mike"},
  {id:449,start:"9/8/2025",vaName:"Fernando Sabijon",vaTag:"Combo",status:"Terminated",vaEmail:"fernandosabijon0506@gmail.com",company:"Brighton Financial & Insurance Services",agencyPOC:"Vernon Williams",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Austin"},
  {id:450,start:"9/8/2025",vaName:"Neil John Misoles",vaTag:"Combo",status:"Active",vaEmail:"nj.misoles@gmail.com",company:"Neverman Insurance",agencyPOC:"John Horvath",timeZone:"OH - EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:451,start:"9/8/2025",vaName:"Jayvee Boy Fuertes",vaTag:"Combo",status:"Active",vaEmail:"fuertesjayveeboy@gmail.com",company:"Waldo Agencies",agencyPOC:"Dellas Waldo",timeZone:"OR - PST",tl:"ED",am:"Karla",salesRep:"Johnny"},
  {id:452,start:"9/9/2025",vaName:"Honey Grace Tioaquen",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"h.tioaquen96@gmail.com",company:"Blackwell Insurance",agencyPOC:"Leigh Zellmer / Ken Haraughty",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Austin"},
  {id:453,start:"9/22/2025",vaName:"Alyannah Villarosa",vaTag:"Combo",status:"Active",vaEmail:"alyannahvillarosa123@gmail.com",company:"Thomas Insurance Advisors",agencyPOC:"Gary Thomas",timeZone:"MO - CST",tl:"RJ",am:"Karla",salesRep:"Mike"},
  {id:454,start:"9/22/2025",vaName:"Zigfred Gementiza",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"zigfredg@gmail.com",company:"Dickey Mccay Insurance",agencyPOC:"Lisa Johnson",timeZone:"TN - EST",tl:"Rezyl",am:"Niccole",salesRep:"Austin"},
  {id:455,start:"9/25/2025",vaName:"Maria Alyssa Amante",vaTag:"Gen VA",status:"Terminated",vaEmail:"alyssaamante16@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:456,start:"9/29/2025",vaName:"Cecile Caputol",vaTag:"Gen VA",status:"Active",vaEmail:"cecilecaputol31@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:457,start:"9/29/2025",vaName:"Jayson Lauresta",vaTag:"Gen VA",status:"Active",vaEmail:"jaysonlauresta02@gmail.com",company:"Guardian Insurance",agencyPOC:"Chris Dupill",timeZone:"MA - EST",tl:"Rezyl",am:"Niccole",salesRep:"Austin"},
  {id:458,start:"9/29/2025",vaName:"Dhahran Dilangalen",vaTag:"Combo",status:"Active",vaEmail:"dhahran.dilangalen1997@gmail.com",company:"The Stevens Group",agencyPOC:"Jodi Stevens",timeZone:"OH - EST",tl:"Rezyl",am:"Alicia",salesRep:"Johnny"},
  {id:459,start:"9/29/2025",vaName:"Kristoffer Randy Ramayla",vaTag:"Gen VA",status:"Active",vaEmail:"krc.ramayla@gmail.com",company:"Creekside Risk Management/ World Insurance",agencyPOC:"Chris Badger",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:460,start:"10/6/2025",vaName:"Shaira Gayle Loregas",vaTag:"Gen VA",status:"Active",vaEmail:"shairadespa@gmail.com",company:"Caliber One Insurance",agencyPOC:"Vanessa Neil",timeZone:"FL - EST",tl:"RJ",am:"Niccole",salesRep:"Austin"},
  {id:461,start:"10/6/2025",vaName:"Jeazelle Maslog",vaTag:"Gen VA",status:"Active",vaEmail:"miamaslog08@gmail.com",company:"Mainguard Insurance Partners",agencyPOC:"Lexi Barron",timeZone:"TX - CST",tl:"RJ",am:"Karla",salesRep:"Celina"},
  {id:462,start:"10/13/2025",vaName:"Carl Jasper Sarad",vaTag:"Gen VA",status:"Terminated",vaEmail:"carljaspersarad@gmail.com",company:"Greco Insurance Group",agencyPOC:"Joey Greco",timeZone:"NE - CST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:463,start:"10/13/2025",vaName:"Cybille Charriz Icoy",vaTag:"Gen VA",status:"Active",vaEmail:"cybillecharrizicoy@gmail.com",company:"Synergy Insurance Advisors",agencyPOC:"Scott Starita",timeZone:"CO - MDT",tl:"Martin",am:"Karla",salesRep:"Johnny"},
  {id:464,start:"10/20/2025",vaName:"Mary Rose Navarro",vaTag:"Combo",status:"Active",vaEmail:"trakepod@gmail.com",company:"All American Insurance Services",agencyPOC:"Damon Hanons",timeZone:"OK - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:465,start:"10/27/2025",vaName:"Adrian Paul Plasabas",vaTag:"Gen VA",status:"Terminated",vaEmail:"plasabasa30@gmail.com",company:"VRP Insurance Agency",agencyPOC:"Vincent Pesce",timeZone:"NY - EST",tl:"ED",am:"Karla",salesRep:"Johnny"},
  {id:466,start:"10/27/2025",vaName:"Jane Pearl Lagaac",vaTag:"Gen VA",status:"Terminated",vaEmail:"lagaacjanepearl@gmail.com",company:"Navigate Risk Advisors",agencyPOC:"TJ Worsencroft",timeZone:"OH - EST",tl:"Karla",am:"Niccole",salesRep:"Johnny"},
  {id:467,start:"10/27/2025",vaName:"Mary Ann Manguiran",vaTag:"Gen VA",status:"Active",vaEmail:"maryann.zoobooksystems@gmail.com",company:"Gartman Insurance Agency",agencyPOC:"Nick Gartman",timeZone:"MS - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:468,start:"10/27/2025",vaName:"Janine Rae Cuares",vaTag:"Gen VA",status:"Active",vaEmail:"janineraecuares@gmail.com",company:"Morgan Management Group",agencyPOC:"Tony Morgan",timeZone:"NY - EST",tl:"Rezyl",am:"Karla",salesRep:"Mike"},
  {id:469,start:"10/27/2025",vaName:"Shanaz Gani",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"shanazgani12@gmail.com",company:"Garcia Agency",agencyPOC:"Jonathan Garcia",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Mike"},
  {id:470,start:"10/30/2025",vaName:"Rodolfo Miguel Jabrica",vaTag:"Combo",status:"Terminated",vaEmail:"rmcjabrica@gmail.com",company:"The Salvati Insurance Group, Inc.",agencyPOC:"Thomas Salvati",timeZone:"MI - EST",tl:"Rezyl",am:"Karla",salesRep:"Johnny"},
  {id:471,start:"10/30/2025",vaName:"Harold Wilson Lastima",vaTag:"Combo",status:"Active",vaEmail:"lastimaharoldwilson04@gmail.com",company:"Southwestern Insurance Group",agencyPOC:"David Stuart",timeZone:"TN - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:472,start:"11/3/2025",vaName:"Paige Kimberly Sue Demavibas",vaTag:"Combo",status:"Terminated",vaEmail:"pksdemavibas@gmail.com",company:"New Buffalo Insurance Agency",agencyPOC:"Liz Benz",timeZone:"NY - EST",tl:"Martin",am:"Alicia",salesRep:"Celina"},
  {id:473,start:"11/3/2025",vaName:"Ramadinah Aleah Beruar",vaTag:"Combo",status:"Terminated",vaEmail:"beruarramadinahaleah@gmail.com",company:"April Jones Insurance",agencyPOC:"April Jones",timeZone:"NC- EST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:474,start:"11/3/2025",vaName:"Marella Patiño",vaTag:"Combo",status:"Active",vaEmail:"mrllpatino15@gmail.com",company:"Pinnacle Point Insurance",agencyPOC:"Aaron England",timeZone:"TX - CST",tl:"RJ",am:"Niccole",salesRep:"Johnny"},
  {id:475,start:"11/10/2025",vaName:"Glaisa Escatror",vaTag:"Gen VA",status:"Terminated",vaEmail:"glaisaescatron@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:476,start:"11/10/2025",vaName:"Hazel Grace Umacob",vaTag:"Gen VA",status:"Terminated",vaEmail:"azelumb@gmail.com",company:"Greco Insurance Group",agencyPOC:"Joey Greco",timeZone:"NE - CST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:477,start:"11/10/2025",vaName:"Jason Kyle Veroy",vaTag:"Gen VA",status:"Active",vaEmail:"veroykyle@gmail.com",company:"VRP Insurance Agency",agencyPOC:"Vincent Pesce",timeZone:"NY - EST",tl:"ED",am:"Karla",salesRep:"Johnny"},
  {id:478,start:"11/10/2025",vaName:"Juleinee Tayao",vaTag:"Gen VA",status:"Active",vaEmail:"juleineetayao@gmail.com",company:"VRP Insurance Agency",agencyPOC:"Vincent Pesce",timeZone:"NY - EST",tl:"ED",am:"Karla",salesRep:"Johnny"},
  {id:479,start:"11/10/2025",vaName:"Kathy Beghanilum",vaTag:"Gen VA",status:"Resigned",vaEmail:"kathybeghanilum16@gmail.com",company:"Classic Coverage Group",agencyPOC:"Michael Arkin",timeZone:"NY - EST",tl:"Martin",am:"Alicia",salesRep:"Mike"},
  {id:480,start:"11/17/2025",vaName:"Aldren Kent Cirunay",vaTag:"Gen VA",status:"Terminated",vaEmail:"aldrencirunay@gmail.com",company:"Agency Automate",agencyPOC:"Bill Jenkins",timeZone:"MN - CST",tl:"Karla",am:"Niccole",salesRep:"Austin"},
  {id:481,start:"11/17/2025",vaName:"Wilfredo Vistal Jr.",vaTag:"Gen VA",status:"Active",vaEmail:"wil.vistal@gmail.com",company:"Risk Advisors",agencyPOC:"David Watson",timeZone:"SC - EST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:482,start:"12/1/2025",vaName:"Eliza Lazarraga",vaTag:"Gen VA",status:"Active",vaEmail:"lazarragaelizaalessandra@gmail.com",company:"Trailstone",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:483,start:"12/1/2025",vaName:"Jammi Jay Jr. Deriada",vaTag:"Gen VA",status:"Active",vaEmail:"onlyjabee@gmail.com",company:"Trailstone",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:484,start:"12/8/2025",vaName:"Mizpah Joy Gavile",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"mizzy.va@gmail.com",company:"Autumn Stong",agencyPOC:"Autumn Strong",timeZone:"",tl:"Martin",am:"Karla",salesRep:"Mike"},
  {id:485,start:"12/8/2025",vaName:"George Michael Presilda",vaTag:"Gen VA",status:"Active",vaEmail:"george.presilda28@gmail.com",company:"Navigate Risk",agencyPOC:"TJ Worsencroft",timeZone:"OH - EST",tl:"Vince",am:"Niccole",salesRep:"Johnny"},
  {id:486,start:"12/8/2025",vaName:"Lynzette Mae Estrada",vaTag:"Combo",status:"Active",vaEmail:"maeestrada144@gmail.com",company:"Duncan & Associates Insurance Brokers",agencyPOC:"Heidi Duncan",timeZone:"WA - PST",tl:"ED",am:"Alicia",salesRep:"Mike"},
  {id:487,start:"12/15/2025",vaName:"Hanzelm Santos",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"hanzelmsantos21@gmail.com",company:"Sentinel Insurance Agency",agencyPOC:"Chrishan De Silva",timeZone:"",tl:"ED",am:"Alicia",salesRep:"Johnny"},
  {id:488,start:"12/15/2025",vaName:"Dianne Hubay",vaTag:"Gen VA",status:"Active",vaEmail:"diannehubay020495@gmail.com",company:"Ameriguard Agency Inc",agencyPOC:"Brad Boldt",timeZone:"MA - EST",tl:"RJ",am:"Niccole",salesRep:"Celina"},
  {id:489,start:"12/22/2025",vaName:"Dhencel Concon",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"dconcon77@gmail.com",company:"Lewis, Hopkins & Williamson (LH&W)",agencyPOC:"Jamie Meissner",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Johnny"},
  {id:490,start:"12/22/2025",vaName:"John Charles Frederick Mamanao",vaTag:"Gen VA",status:"Active",vaEmail:"beastnectus@gmail.com",company:"Agency Automate",agencyPOC:"Rob Cesaric",timeZone:"MN - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:491,start:"12/22/2025",vaName:"Kimberly Brooke Orbeta",vaTag:"Gen VA",status:"Active",vaEmail:"kborbeta@gmail.com",company:"Arctica",agencyPOC:"Gerry Li",timeZone:"WI - CST",tl:"RJ",am:"Niccole",salesRep:"Johnny"},
  {id:492,start:"12/30/2025",vaName:"Andrei Lera",vaTag:"Gen VA",status:"Active",vaEmail:"dreilera@gmail.com",company:"Trailstone",agencyPOC:"Sam  Thomas",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:493,start:"1/5/2026",vaName:"Joseph Ferrer",vaTag:"Combo",status:"Active",vaEmail:"josephferrer214@gmail.com",company:"Direct Insurance Services",agencyPOC:"Michael Spence",timeZone:"CO - MST",tl:"Martin",am:"Alicia",salesRep:"Mike"},
  {id:494,start:"1/12/2026",vaName:"Romarjay Talara",vaTag:"Gen VA",status:"Active",vaEmail:"talararomarjay@gmail.com",company:"American Adventure Insurance",agencyPOC:"Marsden Haigh",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:495,start:"1/12/2026",vaName:"Alfredo Berjame Jr",vaTag:"Gen VA",status:"Active",vaEmail:"alfredoberjame190@yahoo.com",company:"Trailstone",agencyPOC:"",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:496,start:"1/12/2026",vaName:"Mizpah Joy Gavile",vaTag:"Gen VA",status:"Active",vaEmail:"mizzy.va@gmail.com",company:"Trailstone",agencyPOC:"Mark Rodgers",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:497,start:"1/12/2026",vaName:"Roberto Escovidal",vaTag:"Gen VA",status:"Active",vaEmail:"rjbescovidal@gmail.com",company:"Combined Benefits Administrators",agencyPOC:"Sidney",timeZone:"LA - PDT",tl:"ED",am:"Karla",salesRep:"Celina"},
  {id:498,start:"1/12/2026",vaName:"Alexandra Guro",vaTag:"Gen VA",status:"Active",vaEmail:"sabelloguro@gmail.com",company:"Raleigh Insurance Group",agencyPOC:"Daniel Rohrbaugh",timeZone:"NC- EST",tl:"Rezyl",am:"Niccole",salesRep:"Austin"},
  {id:499,start:"1/26/2026",vaName:"Dianne Mangoranda",vaTag:"Gen VA",status:"Active",vaEmail:"diannemangoranda.vaph@gmail.com",company:"Hoery Insurance Agency Inc",agencyPOC:"Scott Hoery",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Celina"},
  {id:500,start:"1/26/2026",vaName:"Dhencel Concon",vaTag:"Gen VA",status:"Active",vaEmail:"dconcon77@gmail.com",company:"Welsh Insurance Agency",agencyPOC:"Jeffrey Welsh",timeZone:"CO - MST",tl:"Rezyl",am:"Alicia",salesRep:"Mike"},
  {id:501,start:"1/26/2026",vaName:"Allana Lou Dapetilla",vaTag:"Gen VA",status:"Active",vaEmail:"allanalou99@gmail.com",company:"J&J Insurance",agencyPOC:"Hassan Jaafar",timeZone:"MI - EST",tl:"Rezyl",am:"Karla",salesRep:"Austin"},
  {id:502,start:"1/29/2026",vaName:"Leo Cesar Maboloc",vaTag:"Combo",status:"Reprofiled",vaEmail:"leocrisanto0802@gmail.com",company:"Optimal Insurance AZ",agencyPOC:"Jeremy Besse",timeZone:"AZ - MDT",tl:"Martin",am:"Karla",salesRep:"Johnny"},
  {id:503,start:"1/30/2026",vaName:"Winslet Jul Napala",vaTag:"Combo",status:"Active",vaEmail:"napalawinsletjul@gmail.com",company:"Blackwell Insurance",agencyPOC:"Leigh Zellmer / Ken Haraughty",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:504,start:"2/2/2026",vaName:"Michaella Fhaira Matalam",vaTag:"Gen VA",status:"Active",vaEmail:"michaella14matalam@gmail.com",company:"Hardenbergh Insurance Group",agencyPOC:"Jon Sharp / Tracey Smith /Heather Pinard",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Celina"},
  {id:505,start:"2/2/2026",vaName:"Nikka Tyra Baquiran",vaTag:"Gen VA",status:"Active",vaEmail:"baquiran.nikka13@gmail.com",company:"Hardenbergh Insurance Group",agencyPOC:"Jon Sharp / Tracey Smith /Heather Pinard",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Celina"},
  {id:506,start:"2/2/2026",vaName:"Irig Florian Tarona",vaTag:"Gen VA",status:"Active",vaEmail:"adatarona@gmail.com",company:"Ovation Insurance",agencyPOC:"Joel Dunham",timeZone:"IN - EST",tl:"Rezyl",am:"Alicia",salesRep:"Johnny"},
  {id:507,start:"2/2/2026",vaName:"Kristine Mae Aldamia",vaTag:"Gen VA",status:"Active",vaEmail:"aldamial05kr@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:508,start:"2/9/2026",vaName:"Jemimah Jazzle Cristobal",vaTag:"Combo",status:"Resigned",vaEmail:"jazzdelgado10@gmail.com",company:"Kwan Insurance Services",agencyPOC:"Karson Kwan",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Johnny"},
  {id:509,start:"2/9/2026",vaName:"John Vincent Chua",vaTag:"Combo",status:"Active",vaEmail:"johnchua.jobs@gmail.com",company:"Glenn S Caldwell Insurance Services Inc",agencyPOC:"Candice Myers",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Celina"},
  {id:510,start:"2/16/2026",vaName:"Mae Ambrosio",vaTag:"Gen VA",status:"Active",vaEmail:"workwithmaea@gmail.com",company:"IntelliBenefits Insurance Services",agencyPOC:"Greg Haack",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Johnny"},
  {id:511,start:"2/23/2026",vaName:"Joan Marie Gelicame",vaTag:"Gen VA",status:"Active",vaEmail:"joanmariegelicame@gmail.com",company:"American Adventure Insurance",agencyPOC:"Marsden Haigh",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:512,start:"2/23/2026",vaName:"Daniel Llavor",vaTag:"Combo",status:"Active",vaEmail:"llavordaniel@gmail.com",company:"Business Insurers of the Carolinas",agencyPOC:"Keith Pearsall",timeZone:"NC - EST",tl:"ED",am:"Alicia",salesRep:"Mike"},
  {id:513,start:"2/23/2026",vaName:"Chelsea Dave Abrasaldo",vaTag:"Gen VA",status:"Active",vaEmail:"chelseaabrasaldo@yahoo.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:514,start:"3/2/2026",vaName:"Jessica Navarro",vaTag:"Gen VA",status:"Terminated",vaEmail:"jessicanavarro1003@gmail.com",company:"Cord Insurance/Steele Insurance",agencyPOC:"Niccole Williams",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Johnny"},
  {id:515,start:"3/2/2026",vaName:"Louie Jay Elio",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"ljve1398@gmail.com",company:"Cord Insurance/Steele Insurance",agencyPOC:"Niccole Williams",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Johnny"},
  {id:516,start:"3/2/2026",vaName:"Ronald Allan Jr Sy",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"ronaldsy97@gmail.com",company:"Duncan & Associates Insurance Brokers",agencyPOC:"Heidi Duncan",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Mike"},
  {id:517,start:"3/2/2026",vaName:"Jericho Opsima",vaTag:"Gen VA",status:"Active",vaEmail:"jerichoopsima22@gmail.com",company:"Agency Automate",agencyPOC:"Bill Jenkins",timeZone:"MN - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:518,start:"3/2/2026",vaName:"Jairiz Edward Esposo",vaTag:"Gen VA",status:"Terminated",vaEmail:"jesposo.dev@gmail.com",company:"Agency Automate",agencyPOC:"Bill Jenkins",timeZone:"MN - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:519,start:"3/2/2026",vaName:"James Klien Caluyong",vaTag:"Combo",status:"Active",vaEmail:"jamesklienccaluyong@gmail.com",company:"Portsmouth Atlantic Insurance",agencyPOC:"Jon Merwin",timeZone:"NH - EST",tl:"Martin",am:"Karla",salesRep:"Celina"},
  {id:520,start:"3/2/2026",vaName:"Roland Jason Gulanes",vaTag:"Gen VA",status:"Active",vaEmail:"gulanesjason@gmail.com",company:"Cord Insurance/Steele Insurance",agencyPOC:"Niccole Williams",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Johnny"},
  {id:521,start:"3/2/2026",vaName:"John Ian Gubalani",vaTag:"Combo",status:"Active",vaEmail:"johnian.gubalani@gmail.com",company:"Kwan Insurance Services",agencyPOC:"Karson Kwan",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Johnny"},
  {id:522,start:"3/2/2026",vaName:"Xyrelle Voughn Maquiling",vaTag:"Gen VA",status:"Resigned",vaEmail:"xyrellemaquiling11@gmail.com",company:"Scheier Insurance Agency",agencyPOC:"Allison Scheier",timeZone:"CA - PST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:523,start:"3/9/2026",vaName:"Jalaica Bellosillo",vaTag:"Combo",status:"Terminated",vaEmail:"jalaicabellosillo@gmail.com",company:"Jody Entrekin",agencyPOC:"Jody Entrekin",timeZone:"MS - CST",tl:"",am:"Cancelled",salesRep:"Mike"},
  {id:524,start:"3/9/2026",vaName:"Cariela Otod",vaTag:"Gen VA",status:"Active",vaEmail:"carielaotod1026@gmail.com",company:"Hardenbergh Insurance Group",agencyPOC:"Jon Sharp / Tracey Smith",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Celina"},
  {id:525,start:"3/9/2026",vaName:"Rey Angely Saines",vaTag:"Gen VA",status:"Active",vaEmail:"reyangelysaines@gmail.com",company:"J. Gurley Insurance",agencyPOC:"John Byars",timeZone:"AL - CST",tl:"RJ",am:"Niccole",salesRep:"Mike"},
  {id:526,start:"3/9/2026",vaName:"Sydney Navarro",vaTag:"Gen VA",status:"Active",vaEmail:"sydneynav1003@gmail.com",company:"Davies Insurance Agency Inc",agencyPOC:"Craig Davies",timeZone:"CA - PST",tl:"ED",am:"Karla",salesRep:"Celina"},
  {id:527,start:"3/16/2026",vaName:"Reyjol Jumawan",vaTag:"Gen VA",status:"Active",vaEmail:"reyjol888@gmail.com",company:"United Risk Insurance",agencyPOC:"Cale Merrill",timeZone:"MS - CST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:528,start:"3/16/2026",vaName:"Orpha Tumala",vaTag:"Gen VA",status:"Active",vaEmail:"orpha.tumala@gmail.com",company:"Heaton Bennett",agencyPOC:"Ross Bennett",timeZone:"TX - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:529,start:"3/16/2026",vaName:"Brechie Bedico",vaTag:"Gen VA",status:"Terminated",vaEmail:"bedicobrech@gmail.com",company:"United Risk Insurance",agencyPOC:"Cale Merrill",timeZone:"MS - CST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:530,start:"3/23/2026",vaName:"Ariel Benjamine Espanto",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"arielespanto2013@gmail.com",company:"Direct Insurance Services",agencyPOC:"Michael Spence",timeZone:"CO - MST",tl:"Martin",am:"Alicia",salesRep:"Mike"},
  {id:531,start:"3/24/2026",vaName:"Renalie Joy Tingson",vaTag:"Gen VA",status:"Active",vaEmail:"renalietngzn@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:532,start:"3/30/2026",vaName:"Dexter Salcedo",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"salcedodexter.vaedition@gmail.com",company:"Cotner Rock Agency",agencyPOC:"Josh Cotner",timeZone:"AZ - MDT",tl:"",am:"Cancelled",salesRep:""},
  {id:533,start:"3/30/2026",vaName:"James Andrei Cardinales",vaTag:"Combo",status:"Active",vaEmail:"clesandrei02@gmail.com",company:"Amicum Financial",agencyPOC:"John Mitchell",timeZone:"OH - EST",tl:"ED",am:"Alicia",salesRep:"Mike"},
  {id:534,start:"4/6/2026",vaName:"Cesar Ryan Ladringan",vaTag:"Combo",status:"Reprofiled",vaEmail:"cesarryanladringan@gmail.com",company:"AIC Insurance Agency",agencyPOC:"Christopher Green",timeZone:"OR - PST",tl:"RJ",am:"Cancelled",salesRep:"Johnny"},
  {id:535,start:"4/6/2026",vaName:"Gabriel Zion Cimafranca",vaTag:"Combo",status:"Reprofiled",vaEmail:"cimafrancagabriel@gmail.com",company:"AIC Insurance Agency",agencyPOC:"Christopher Green",timeZone:"OR - PST",tl:"RJ",am:"Cancelled",salesRep:"Johnny"},
  {id:536,start:"4/6/2026",vaName:"Mary Joy Bocawe",vaTag:"Gen VA",status:"Resigned",vaEmail:"maryjoybocawe611@gmail.com",company:"Maverick Insurance",agencyPOC:"Scott Andrew Mills",timeZone:"OH - EST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:537,start:"4/6/2026",vaName:"Patriz Bianca Clarion",vaTag:"Gen VA",status:"Terminated",vaEmail:"pbc112889@gmail.com",company:"AIC Insurance Agency",agencyPOC:"Christopher Green",timeZone:"OR - PST",tl:"RJ",am:"Cancelled",salesRep:"Johnny"},
  {id:538,start:"4/8/2026",vaName:"Pierre Anthony Marc Santos",vaTag:"Combo",status:"Active",vaEmail:"p.saintz187@gmail.com",company:"Beach Break Insurance",agencyPOC:"Rich Sabatowski",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:539,start:"4/13/2026",vaName:"Maria Ulibeth Canvas",vaTag:"Gen VA",status:"Active",vaEmail:"canvas.m04@gmail.com",company:"Raleigh Insurance Group",agencyPOC:"Daniel Rohrbaugh",timeZone:"NC- EST",tl:"Rezyl",am:"Niccole",salesRep:"Austin"},
  {id:540,start:"4/13/2026",vaName:"Marielle Pajo",vaTag:"Gen VA",status:"Active",vaEmail:"mariellepajo@gmail.com",company:"Florida Best Quote",agencyPOC:"Nina Mastridge",timeZone:"FL - EST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:541,start:"4/13/2026",vaName:"Raymond Mara",vaTag:"Gen VA",status:"Active",vaEmail:"imara.raymondp@gmail.com",company:"Grimes Insurance Agency",agencyPOC:"Ryan Reynolds",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:542,start:"4/20/2026",vaName:"Jorey Israel Bendanillo",vaTag:"Gen VA",status:"Active",vaEmail:"bendanillojorey@gmail.com",company:"Classic Coverage Group",agencyPOC:"Michael Arkin",timeZone:"NY - EST",tl:"Martin",am:"Alicia",salesRep:"Mike"},
  {id:543,start:"4/20/2026",vaName:"Sergei Vaughn Calumpong",vaTag:"Gen VA",status:"Active",vaEmail:"svc.clmpng@gmail.com",company:"Maverick Insurance",agencyPOC:"Scott Andrew Mills",timeZone:"OH - EST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:544,start:"4/27/2026",vaName:"Honey Grace Tioaquen",vaTag:"Gen VA",status:"Active",vaEmail:"h.tioaquen96@gmail.com",company:"TCA Insurance",agencyPOC:"Cliff Miller",timeZone:"MI - EST",tl:"ED",am:"Karla",salesRep:"Celina"},
  {id:545,start:"4/27/2026",vaName:"Jhonel Alfaro",vaTag:"Gen VA",status:"Active",vaEmail:"jhonelalfaro@gmail.com",company:"Vault Insurance & Risk Management",agencyPOC:"Ashley Hellbusch",timeZone:"NE - CST",tl:"ED",am:"Alicia",salesRep:"Celina"},
  {id:546,start:"5/4/2026",vaName:"Ariel Benjamine Espanto",vaTag:"Gen VA",status:"Active",vaEmail:"arielespanto2013@gmail.com",company:"NPPW Services",agencyPOC:"Lennix Gibson",timeZone:"CA - PST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:547,start:"5/4/2026",vaName:"Arturo Gales",vaTag:"Gen VA",status:"Active",vaEmail:"arturogales123@gmail.com",company:"NPPW Services",agencyPOC:"Lennix Gibson",timeZone:"CA - PST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:548,start:"5/11/2026",vaName:"Hanna Mae Eduria",vaTag:"Combo",status:"Active",vaEmail:"xiungeun@gmail.com",company:"Bly Insurance Group",agencyPOC:"Joseph Bly",timeZone:"MO - CST",tl:"RJ",am:"Alicia",salesRep:"Celina"},
  {id:549,start:"5/11/2026",vaName:"Gabriel Zion Cimafranca",vaTag:"Combo",status:"Active",vaEmail:"cimafrancagabriel@gmail.com",company:"Steve Pore Insurance",agencyPOC:"Amy Butler",timeZone:"KS - CST",tl:"RJ",am:"Karla",salesRep:"Mike"},
  {id:550,start:"5/11/2026",vaName:"Ira Mae Basalan",vaTag:"Gen VA",status:"Active",vaEmail:"basalaniramaelopez@gmail.com",company:"Cord Insurance/Steele Insurance",agencyPOC:"Niccole Williams",timeZone:"CA - PST",tl:"ED",am:"Alicia",salesRep:"Johnny"},
  {id:551,start:"5/11/2026",vaName:"Maria Cristine Rañoa",vaTag:"Gen VA",status:"Reprofiled",vaEmail:"mariacristineranoa1126@gmail.com",company:"ACG Insure LLC",agencyPOC:"Chris Shepherd",timeZone:"KS - CST",tl:"RJ",am:"Alicia",salesRep:"Celina"},
  {id:552,start:"5/11/2026",vaName:"Gian Tristian Apostol",vaTag:"Gen VA",status:"Active",vaEmail:"giantristianapostol@gmail.com",company:"RMIN Consulting",agencyPOC:"Adrian Smith",timeZone:"LA - CST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:553,start:"5/11/2026",vaName:"Jefer Sera",vaTag:"Gen VA",status:"Active",vaEmail:"jefersera26@gmail.com",company:"Vault Insurance & Risk Management",agencyPOC:"Ashley Hellbusch",timeZone:"NE - CST",tl:"ED",am:"Alicia",salesRep:"Celina"},
  {id:554,start:"5/11/2026",vaName:"Elaiza Eve Ramos",vaTag:"Gen VA",status:"Active",vaEmail:"ramos.elaizaeve@gmail.com",company:"South City Insurance",agencyPOC:"Daman Bhinder / Myles Weigel",timeZone:"TX - CST",tl:"Martin",am:"Karla",salesRep:"Celina"},
  {id:555,start:"5/11/2026",vaName:"John Dave Baylon",vaTag:"Gen VA",status:"Active",vaEmail:"johndavebaylon@gmail.com",company:"South City Insurance",agencyPOC:"Myles Weigel",timeZone:"TX - CST",tl:"Martin",am:"Karla",salesRep:"Celina"},
  {id:556,start:"5/14/2026",vaName:"Cesar Ryan Ladringan",vaTag:"Gen VA",status:"Active",vaEmail:"cesarryanladringan@gmail.com",company:"Hardenbergh Insurance Group",agencyPOC:"Jon Sharp / Tracey Smith",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Celina"},
  {id:557,start:"5/18/2026",vaName:"Maria Luz Marañon",vaTag:"Gen VA",status:"Active",vaEmail:"mariamaranon017@gmail.com",company:"South City Insurance",agencyPOC:"Daman Bhinder / Myles Weigel",timeZone:"TX - CST",tl:"Martin",am:"Karla",salesRep:"Celina"},
  {id:558,start:"5/26/2026",vaName:"Prince Oncada",vaTag:"Combo",status:"Terminated",vaEmail:"prince.oncada@gmail.com",company:"Mosaic Insurance Alliance",agencyPOC:"Paul Pukis",timeZone:"WA - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:559,start:"5/26/2026",vaName:"Akela Paulene Antalan",vaTag:"Combo",status:"Resigned",vaEmail:"akela.paulene@gmail.com",company:"Mosaic Insurance Alliance",agencyPOC:"Paul Pukis",timeZone:"WA - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:560,start:"6/1/2026",vaName:"Claire Celeste",vaTag:"Combo",status:"Active",vaEmail:"claire.celeste23@gmail.com",company:"Ramey King Insurance Agency",agencyPOC:"Mandy Smith",timeZone:"TX - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:561,start:"6/1/2026",vaName:"Joel Rey Bueno",vaTag:"Gen VA",status:"Active",vaEmail:"bueno.joelrey@gmail.com",company:"NPPW Services",agencyPOC:"Lennix Gibson",timeZone:"CA - PST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:562,start:"6/8/2026",vaName:"Ronald Sy Jr.",vaTag:"Combo",status:"Active",vaEmail:"ronjrsy22@gmail.com",company:"Reilly Insurance LLC",agencyPOC:"Mark Reilly",timeZone:"PA - EST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:563,start:"6/8/2026",vaName:"Mark Kenny Gesmalin",vaTag:"Combo",status:"Resigned",vaEmail:"gesmalinmarkkenny@gmail.com",company:"Mosaic Insurance Alliance",agencyPOC:"Paul Pukis",timeZone:"WA - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:564,start:"6/15/2026",vaName:"Daniela Generalao",vaTag:"Gen VA",status:"Active",vaEmail:"danielageneralao77@gmail.com",company:"Marenco Insurance Agency",agencyPOC:"Alex Marenco",timeZone:"NY - EST",tl:"ED",am:"Niccole",salesRep:"Celina"},
  {id:565,start:"6/15/2026",vaName:"Zigfred Gementiza",vaTag:"Gen VA",status:"Active",vaEmail:"zigfredg@gmail.com",company:"Crawford Butz & Associates",agencyPOC:"Mike Ehrlich/Jordan Wren",timeZone:"MO - CST",tl:"Rezyl",am:"Karla",salesRep:"Celina"},
  {id:566,start:"6/15/2026",vaName:"Mary Barbette Baldestamon",vaTag:"Gen VA",status:"Active",vaEmail:"marybarbette@gmail.com",company:"Hoery Insurance - Farmers",agencyPOC:"Scott Hoery",timeZone:"CO - MDT",tl:"Martin",am:"Niccole",salesRep:"Celina"},
  {id:567,start:"6/15/2026",vaName:"Bernadette Cal",vaTag:"Gen VA",status:"Active",vaEmail:"calbernadette24@gmail.com",company:"Scheier Insurance Agency",agencyPOC:"Allison Scheier",timeZone:"CA - PST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:568,start:"6/15/2026",vaName:"Marie Franchesca Placer",vaTag:"Gen VA",status:"Active",vaEmail:"mariefranchescaplacer@gmail.com",company:"Scheier Insurance Agency",agencyPOC:"Allison Scheier",timeZone:"CA - PST",tl:"RJ",am:"Alicia",salesRep:"Johnny"},
  {id:569,start:"6/15/2026",vaName:"Ronna Jay Pejano",vaTag:"Combo",status:"Active",vaEmail:"ronnapejano@gmail.com",company:"Synergy Insurance Advisors",agencyPOC:"Scott Starita",timeZone:"CO - MDT",tl:"Martin",am:"Karla",salesRep:"Johnny"},
  {id:570,start:"6/15/2026",vaName:"Kimberly Royo",vaTag:"Gen VA",status:"Resigned",vaEmail:"royo.kimberly@gmail.com",company:"JBLB Insurance Group",agencyPOC:"Tawnya Stuedle",timeZone:"MO - CST",tl:"RJ",am:"Karla",salesRep:"Celina"},
  {id:571,start:"6/15/2026",vaName:"Lindsay Cañete",vaTag:"Combo",status:"Active",vaEmail:"lcanete833@gmail.com",company:"Mosaic Insurance Alliance",agencyPOC:"Paul Pukis",timeZone:"WA - PST",tl:"ED",am:"Karla",salesRep:"Mike"},
  {id:572,start:"6/15/2026",vaName:"Brisbane Alexander Cordero",vaTag:"Gen VA",status:"Terminated",vaEmail:"brisbanecordero46@gmail.com",company:"Lundell Insurance",agencyPOC:"Chanee Boehnen",timeZone:"WI - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:573,start:"6/15/2026",vaName:"Joan Lapinid",vaTag:"Gen VA",status:"Active",vaEmail:"joanlapinidofficial@gmail.com",company:"Priority Risk Management",agencyPOC:"Mark Shoultz",timeZone:"IN - EST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:574,start:"6/15/2026",vaName:"Diosdado Dalisay",vaTag:"Gen VA",status:"Active",vaEmail:"diosdadodalisay1095@gmail.com",company:"JBLB Insurance Group",agencyPOC:"Tawnya Stuedle",timeZone:"MO - CST",tl:"RJ",am:"Karla",salesRep:"Celina"},
  {id:575,start:"6/16/2026",vaName:"Krishia Mae Del Rosario",vaTag:"Gen VA",status:"Resigned",vaEmail:"krishiamaemdelrosario@gmail.com",company:"Great Park Insurance",agencyPOC:"Daniel Seong",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:576,start:"6/16/2026",vaName:"Harvey Maranan",vaTag:"Gen VA",status:"Active",vaEmail:"harveymaranan19251@gmail.com",company:"Bly Insurance Group",agencyPOC:"Joseph Bly",timeZone:"MO - CST",tl:"RJ",am:"Alicia",salesRep:"Celina"},
  {id:577,start:"6/17/2026",vaName:"Aimee Fernandez",vaTag:"Gen VA",status:"Active",vaEmail:"fernandezaimee224@gmail.com",company:"Classic Coverage Group",agencyPOC:"Michael Arkin",timeZone:"NY - EST",tl:"Martin",am:"Alicia",salesRep:"Mike"},
  {id:578,start:"6/22/2026",vaName:"Sid Vicious Cagula",vaTag:"Gen VA",status:"Active",vaEmail:"cagulasid4@gmail.com",company:"Hardenbergh Insurance Group",agencyPOC:"Jon Sharp / Tracey Smith",timeZone:"PA - EST",tl:"Rezyl",am:"Alicia",salesRep:"Celina"},
  {id:579,start:"6/22/2026",vaName:"Princess Jolisse Sastrillas",vaTag:"Gen VA",status:"Active",vaEmail:"princessmondee@gmail.com",company:"World Insurance",agencyPOC:"Chris Badger",timeZone:"TX - CST",tl:"Martin",am:"Niccole",salesRep:"Austin"},
  {id:580,start:"6/22/2026",vaName:"Mekka Ella Bulan",vaTag:"Gen VA",status:"Active",vaEmail:"bulanmekka98@gmail.com",company:"Greco Insurance Group",agencyPOC:"Joey Greco",timeZone:"NE - CST",tl:"RJ",am:"Karla",salesRep:"Johnny"},
  {id:581,start:"6/29/2026",vaName:"Sunshine Marie Seriña",vaTag:"Gen VA",status:"Active",vaEmail:"sersunsh1@gmail.com",company:"Ameriguard Agency Inc.",agencyPOC:"Brad Boldt",timeZone:"MA - EST",tl:"RJ",am:"Niccole",salesRep:"Celina"},
  {id:582,start:"6/29/2026",vaName:"Luke Angelo Velez",vaTag:"Gen VA",status:"Active",vaEmail:"velezlukeangelo11@gmail.com",company:"Ameriguard Agency Inc.",agencyPOC:"Brad Boldt",timeZone:"MA - EST",tl:"RJ",am:"Niccole",salesRep:"Celina"},
  {id:583,start:"6/29/2026",vaName:"Lourrence Ed Senajon",vaTag:"Gen VA",status:"Active",vaEmail:"orenedsenajon@gmail.com",company:"Agency Automate",agencyPOC:"Bill Jenkins",timeZone:"MN - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:584,start:"6/29/2026",vaName:"Ivan Louie Malicsi",vaTag:"Gen VA",status:"Active",vaEmail:"ivanlouiemalicsi@gmail.com",company:"Agency Automate",agencyPOC:"Bill Jenkins",timeZone:"MN - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:585,start:"6/29/2026",vaName:"Kaiyou Serra",vaTag:"Gen VA",status:"Active",vaEmail:"kserra@addu.edu.ph",company:"Agency Automate",agencyPOC:"Bill Jenkins",timeZone:"MN - CST",tl:"Vince",am:"Niccole",salesRep:"Austin"},
  {id:586,start:"6/29/2026",vaName:"Ceide Tan",vaTag:"Gen VA",status:"Active",vaEmail:"ceide999@gmail.com",company:"Lundell Insurance",agencyPOC:"Chanee Boehnen",timeZone:"WI - CST",tl:"RJ",am:"Alicia",salesRep:"Mike"},
  {id:587,start:"6/29/2026",vaName:"Leo Niño Gasque",vaTag:"Combo",status:"Active",vaEmail:"leontheabsurd@gmail.com",company:"Great Park Insurance",agencyPOC:"Daniel Seong",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:588,start:"6/29/2026",vaName:"Cherry Love Sabijon",vaTag:"Gen VA",status:"Active",vaEmail:"cherrylovesabijon24@gmail.com",company:"Great Park Insurance",agencyPOC:"Daniel Seong",timeZone:"CA - PST",tl:"ED",am:"Niccole",salesRep:"Austin"},
  {id:589,start:"7/13/2026",vaName:"Jomar Lumabi",vaTag:"",status:"",vaEmail:"jlumab731@gmail.com",company:"Kevin Panter Insurance",agencyPOC:"Kevin Panter",timeZone:"GA - EST",tl:"Vince",am:"",salesRep:"Mike"},
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
    emoji: "☀️",
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
    emoji: "☀",
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
    emoji: "🌙",
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
    emoji: "📅",
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
  const { rows: tasks, upsert: upsertTask, remove: removeTask, loading: tasksLoading } = useSupabaseTable("tasks", "id", []);
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
  if (tasksLoading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,flexDirection:"column",gap:12}}>
      <div style={{width:32,height:32,border:`3px solid ${C.border}`,borderTop:`3px solid ${C.teal}`,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
      <div style={{fontSize:13,color:C.muted}}>Loading tasks...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

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
    showed:  { bg:"#FFFFFF", dot:"#059669", label:"Showed" },
    skipped: { bg:"#F0FDF4", dot:"#16A34A", label:"Skipped (not counted)" },
    noshow:  { bg:"#FFF1F1", dot:C.red,     label:"No Show" },
    noreply: { bg:"#FFF7ED", dot:"#EA580C", label:"No Reply" },
    replied: { bg:"#EFF6FF", dot:C.blue,    label:"Replied" },
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
  const { rows: tlAtoRecords } = useSupabaseTable("tl_ato", "id", INIT_TL_ATO);

  // Auto-populate AM and TL from TL ATO when client/company is filled
  function lookupFromTLATO(clientText) {
    if (!clientText.trim()) return {};
    const q = clientText.toLowerCase();
    const match = tlAtoRecords.find(r =>
      (r.company && r.company.toLowerCase().includes(q)) ||
      (r.agencyPOC && r.agencyPOC.toLowerCase().includes(q))
    );
    if (match) return { am: match.am || "", tl: match.tl || "" };
    return {};
  }

  // Get all VA names for a given agency/company from TL ATO
  function lookupVAsFromTLATO(clientText) {
    if (!clientText.trim()) return [];
    const q = clientText.toLowerCase();
    const matches = tlAtoRecords.filter(r =>
      (r.company && r.company.toLowerCase().includes(q)) ||
      (r.agencyPOC && r.agencyPOC.toLowerCase().includes(q))
    );
    return matches.map(r => r.vaName).filter(Boolean);
  }
  const [calRangeStart, setCalRangeStart] = useState(null);
  const [calRangeEnd,   setCalRangeEnd]   = useState(null);
  const [amFilter, setAmFilter] = useState("All");
  const [amColOpen, setAmColOpen] = useState(false);
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
    if (calRangeStart) {      const lo = calRangeEnd && calRangeEnd < calRangeStart ? calRangeEnd : calRangeStart;
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

  // Apply AM filter on top of weekCheckins for the report view list
  const filteredWeekCheckins = useMemo(() =>
    amFilter === "All" ? weekCheckins : weekCheckins.filter(c => c.am === amFilter),
  [weekCheckins, amFilter]);
  // Per-AM stats broken out by type — computed from tagged check-ins (skipped not counted)
  const amStats = useMemo(() => {
    function rateFor(rows) {
      // showed, noreply, replied all count as "showed" for show rate
      const showed    = rows.filter(c => ["showed","replied"].includes(c.status));
      const withScore  = showed.flatMap(c => c.vas.filter(v => v.score !== null && v.score !== "" && String(v.score).toUpperCase() !== "N/A"));
      const passing    = withScore.filter(v => +v.score >= 80);
      return {
        total:    rows.length,
        showed:   showed.length,
        noShow:   rows.filter(c => ["noshow","noreply"].includes(c.status)).length,
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
      const showed    = rows.filter(c => ["showed","replied"].includes(c.status));
      const withScore = showed.flatMap(c => c.vas.filter(v => v.score !== null && v.score !== "" && String(v.score).toUpperCase() !== "N/A"));
      const passing   = withScore.filter(v => +v.score >= 80);
      return {
        total:    rows.length,
        showed:   showed.length,
        noShow:   rows.filter(c => ["noshow","noreply"].includes(c.status)).length,
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
    const showed  = counted.filter(c=>["showed","replied"].includes(c.status));
    const withScore = showed.flatMap(c=>c.vas.filter(v=>v.score!==null&&v.score!==""&&String(v.score).toUpperCase()!=="N/A"));
    return {
      total: counted.length,
      showed: showed.length,
      noShow: counted.filter(c=>["noshow","noreply"].includes(c.status)).length,
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
    const vasClean = newCI.vas.filter(v=>v.name.trim()).map(v=>({name:v.name.trim(),score:v.score===""?null:(v.score.trim().toUpperCase()==="N/A"?"N/A":parseFloat(v.score)||null)}));
    upsertCI({...newCI,id:Date.now(),vas:vasClean});
    setNewCI(EMPTY_CI); setAdding(false);
  }

  // Inline VA editor for a check-in
  function VaEditor({ ci }) {
    const [localVas, setLocalVas] = useState(ci.vas.length ? ci.vas.map(v=>({...v,score:v.score??''})) : [{name:'',score:''}]);
    function save() { upCI(ci.id,'vas',localVas.filter(v=>v.name.trim()).map(v=>({name:v.name.trim(),score:v.score===''?null:(String(v.score).trim().toUpperCase()==='N/A'?'N/A':parseFloat(v.score)||null)}))); }
    return (
      <div>
        {localVas.map((v,i)=>(
          <div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:4}}>
            <input value={v.name} placeholder="VA name" onChange={e=>{const n=[...localVas];n[i]={...n[i],name:e.target.value};setLocalVas(n);}} onBlur={save}
              style={{flex:"1 1 120px",padding:"4px 7px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:12}}/>
            <input value={v.score} placeholder="Score % or N/A" onChange={e=>{const n=[...localVas];n[i]={...n[i],score:e.target.value};setLocalVas(n);}} onBlur={save}
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
                <option>Martin</option><option>Vince</option><option>Karla</option><option>Rezyl</option><option>ED</option><option>RJ</option>
              </select>
            </div>
            {/* Status */}
            <div>
              <div style={{fontSize:10,color:C.muted,fontWeight:700,marginBottom:4}}>STATUS</div>
              <select value={ci.status} onChange={e=>upCI(ci.id,'status',e.target.value)}
                style={{width:"100%",padding:"5px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13,color:cfg.dot}}>
                <option value="showed">Showed</option>
                <option value="noshow">No Show</option>
                <option value="skipped">Skipped</option>
                <option value="noreply">No Reply</option>
                <option value="replied">Replied</option>
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
              <input value={newCI.client} placeholder="e.g. TJ Worsencroft, Navigate Risk Advisors"
                onChange={e=>setNewCI(p=>({...p,client:e.target.value}))}
                onBlur={e=>{
                  const l=lookupFromTLATO(e.target.value);
                  const vas=lookupVAsFromTLATO(e.target.value);
                  if(l.am||l.tl) setNewCI(p=>({...p,...l}));
                  if(vas.length>0) setNewCI(p=>({
                    ...p,
                    vas: vas.map(name=>({name,score:""}))
                  }));
                }}
                style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
              {newCI.client&&(()=>{
                const l=lookupFromTLATO(newCI.client);
                const vas=lookupVAsFromTLATO(newCI.client);
                if(!l.am&&!vas.length) return null;
                return (
                  <div style={{fontSize:11,color:C.green,marginTop:3}}>
                    {l.am&&<span>Auto-filled: AM = {l.am}{l.tl?`, TL = ${l.tl}`:""}</span>}
                    {vas.length>0&&<span style={{marginLeft:l.am?8:0}}>· {vas.length} VA{vas.length>1?"s":""} found</span>}
                  </div>
                );
              })()}
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
                <option>Martin</option><option>Vince</option><option>Karla</option><option>Rezyl</option><option>ED</option><option>RJ</option>
              </select>
            </div>
            {/* Status */}
            <div>
              <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>STATUS</div>
              <select value={newCI.status} onChange={e=>setNewCI(p=>({...p,status:e.target.value}))} style={{...sel,width:"100%"}}>
                <option value="showed">Showed</option>
                <option value="noshow">No Show</option>
                <option value="skipped">Skipped</option>
                <option value="noreply">No Reply</option>
                <option value="replied">Replied</option>
              </select>
            </div>
            {/* VAs */}
            <div style={{gridColumn:"span 2"}}>
              <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:6}}>VIRTUAL ASSISTANTS & SCORES</div>
              {newCI.vas.map((v,i)=>{
                const agencyVAs = lookupVAsFromTLATO(newCI.client);
                return (
                  <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                    <div style={{fontSize:12,color:C.muted,width:20,textAlign:"right",flexShrink:0}}>#{i+1}</div>
                    {agencyVAs.length>0 ? (
                      <select value={v.name} onChange={e=>setVA(i,"name",e.target.value)}
                        style={{flex:"1 1 150px",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}>
                        <option value="">— Select VA —</option>
                        {agencyVAs.map(n=><option key={n} value={n}>{n}</option>)}
                      </select>
                    ) : (
                      <input value={v.name} placeholder="VA full name" onChange={e=>setVA(i,"name",e.target.value)}
                        style={{flex:"1 1 150px",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
                    )}
                    <input value={v.score} placeholder="Score % or N/A" onChange={e=>setVA(i,"score",e.target.value)}
                      style={{width:90,padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
                    {newCI.vas.length>1&&(
                      <button onClick={()=>removeVA(i)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,padding:0,flexShrink:0}}>×</button>
                    )}
                  </div>
                );
              })}
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
          {/* Check-in list header */}
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
                  {["","Client / Agency","VAs & Scores","Type","Mode"].map((h,i)=>(
                    <th key={i} style={{padding:"8px 12px",textAlign:"left",fontSize:11,color:C.muted,fontWeight:700,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                  <th style={{padding:"8px 12px",textAlign:"left",fontSize:11,fontWeight:700,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>
                    <div style={{position:"relative",display:"inline-block"}}>
                      <button onClick={e=>{e.stopPropagation();setAmColOpen(v=>!v);}}
                        style={{background:amFilter!=="All"?({Niccole:C.red,Karla:C.blue,Alicia:C.teal}[amFilter]||C.dark):"none",
                          color:amFilter!=="All"?C.white:C.muted,border:"none",cursor:"pointer",fontSize:11,fontWeight:700,
                          padding:amFilter!=="All"?"2px 8px":"0",borderRadius:6}}>
                        {amFilter==="All"?"AM ▾":`${amFilter} ▾`}
                      </button>
                      {amColOpen&&(
                        <div style={{position:"absolute",top:"100%",left:0,zIndex:99,background:C.white,border:`1px solid ${C.border}`,borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",padding:6,minWidth:110}}>
                          {["All","Niccole","Karla","Alicia"].map(a=>(
                            <div key={a} onClick={e=>{e.stopPropagation();setAmFilter(a);setAmColOpen(false);}}
                              style={{padding:"6px 10px",cursor:"pointer",borderRadius:6,fontSize:12,
                                color:a==="All"?C.dark:({Niccole:C.red,Karla:C.blue,Alicia:C.teal}[a]||C.dark),
                                fontWeight:amFilter===a?700:400,background:amFilter===a?C.gray:"transparent"}}>
                              {a==="All"?"All AMs":a}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </th>
                  {["TL","Status",""].map((h,i)=>(
                    <th key={i} style={{padding:"8px 12px",textAlign:"left",fontSize:11,color:C.muted,fontWeight:700,borderBottom:`1px solid ${C.border}`,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredWeekCheckins.length===0&&(
                  <tr><td colSpan={9} style={{padding:24,textAlign:"center",color:C.muted}}>No check-ins found.</td></tr>
                )}
                {filteredWeekCheckins.map(c=>{
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
                                {v.score!==null&&v.score!==undefined&&<span style={{fontWeight:700,fontSize:12,color:String(v.score).toUpperCase()==='N/A'?C.muted:sc(+v.score),background:C.gray,padding:"1px 6px",borderRadius:99}}>{String(v.score).toUpperCase()==='N/A'?'N/A':`${v.score}%`}</span>}
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
            {[["All","All statuses"],["showed","Showed"],["noshow","No Show"],["skipped","Skipped"],["noreply","No Reply"],["replied","Replied"]].map(([v,l])=>(
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
                                {v.score!==null&&v.score!==undefined&&<span style={{fontWeight:700,fontSize:12,color:String(v.score).toUpperCase()==='N/A'?C.muted:sc(+v.score)}}>{String(v.score).toUpperCase()==='N/A'?'N/A':`${v.score}%`}</span>}
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
                            <option>Martin</option><option>Vince</option><option>Karla</option><option>Rezyl</option><option>ED</option><option>RJ</option>
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
                  <input value={newConcern.agency} placeholder="e.g. Navigate Risk Advisors"
                    onChange={e=>setNewConcern(p=>({...p,agency:e.target.value}))}
                    onBlur={e=>{
                      const vas = lookupVAsFromTLATO(e.target.value);
                      if (vas.length===1) setNewConcern(p=>({...p,va:vas[0]}));
                    }}
                    style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
                  {(()=>{
                    const vas = lookupVAsFromTLATO(newConcern.agency);
                    return vas.length>0 ? <div style={{fontSize:11,color:C.green,marginTop:3}}>{vas.length} VA{vas.length>1?"s":""} found for this agency</div> : null;
                  })()}
                </div>
                <div>
                  <div style={{fontSize:11,color:C.muted,fontWeight:600,marginBottom:4}}>VA NAME</div>
                  {(()=>{
                    const vas = lookupVAsFromTLATO(newConcern.agency);
                    return vas.length > 0 ? (
                      <select value={newConcern.va} onChange={e=>setNewConcern(p=>({...p,va:e.target.value}))}
                        style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}>
                        <option value="">— Select VA —</option>
                        {vas.map(v=><option key={v} value={v}>{v}</option>)}
                      </select>
                    ) : (
                      <input value={newConcern.va} placeholder="VA full name" onChange={e=>setNewConcern(p=>({...p,va:e.target.value}))}
                        style={{width:"100%",padding:"6px 8px",borderRadius:6,border:`1px solid ${C.border}`,fontSize:13}}/>
                    );
                  })()}
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
  { icon: "⭐", color: "#F59E0B", bg: "#FFFBEB", border: "#FCD34D", label: "File Away",    desc: "Archive / file the email away" },
  { icon: "🟢", color: "#059669", bg: "#F0FDF4", border: "#6EE7B7", label: "Sales",        desc: "Sales-related email" },
  { icon: "🔵", color: "#1D4ED8", bg: "#EFF6FF", border: "#93C5FD", label: "IT",           desc: "IT-related email" },
  { icon: "❗", color: "#B45309", bg: "#FFFBEB", border: "#FCD34D", label: "VA Concerns",  desc: "VA concern — needs attention", square: true, sqColor: "#FCD34D" },
  { icon: "❓", color: "#7C3AED", bg: "#F5F3FF", border: "#C4B5FD", label: "$ Concerns",   desc: "Financial / billing concern", square: true, sqColor: "#C4B5FD" },
  { icon: "❗", color: "#DC2626", bg: "#FFF1F1", border: "#FCA5A5", label: "High Priority", desc: "Tell Niccole immediately when this email arrives", square: true, sqColor: "#FCA5A5" },
  { icon: "ℹ️", color: "#1D4ED8", bg: "#EFF6FF", border: "#93C5FD", label: "1-off Work",   desc: "One-off task or work item", square: true, sqColor: "#93C5FD" },
];

// ── TL ATO TAB ──
function TLATOTab() {
  const C = useTheme();
  const { rows: records, upsert: upsertRecord, remove: removeRecord } = useSupabaseTable("tl_ato", "id", INIT_TL_ATO);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [tlFilter,     setTlFilter]     = useState("All");
  const [amFilter,     setAmFilter]     = useState("All");
  const [salesFilter,  setSalesFilter]  = useState("All");
  const [adding, setAdding]   = useState(false);
  const EMPTY = { start:"", vaName:"", vaTag:"", status:"Active", vaEmail:"", company:"", agencyPOC:"", timeZone:"", tl:"", am:"", salesRep:"" };
  const [newRec, setNewRec]   = useState(EMPTY);
  const [expandId, setExpandId] = useState(null);

  const statuses  = ["All", ...new Set(records.map(r => r.status).filter(Boolean))];
  const TLS = ["Martin","Vince","Karla","Rezyl","ED","RJ"];
  const AMS = ["Niccole","Karla","Alicia"];
  const tlOptions = ["All","Martin","Vince","Karla","Rezyl","ED","RJ"];
  const amOptions = ["All", "Niccole", "Karla", "Alicia"];
  const salesOptions = ["All", ...new Set(records.map(r => r.salesRep).filter(Boolean))];

  const visible = useMemo(() => records.filter(r => {
    const q = search.toLowerCase();
    const ms = !search || [r.vaName,r.company,r.agencyPOC,r.tl,r.am,r.salesRep,r.vaEmail,r.vaTag,r.timeZone,r.status]
      .some(v => v && v.toLowerCase().includes(q));
    return ms
      && (statusFilter  === "All" || r.status    === statusFilter)
      && (tlFilter      === "All" || r.tl        === tlFilter)
      && (amFilter      === "All" || r.am        === amFilter)
      && (salesFilter   === "All" || r.salesRep  === salesFilter);
  }), [records, search, statusFilter, companyFilter, tlFilter, amFilter, salesFilter]);

  function upRec(id, field, val) {
    const r = records.find(x => x.id === id);
    if (r) upsertRecord({ ...r, [field]: val });
  }
  function saveNew() {
    if (!newRec.vaName.trim() && !newRec.company.trim()) return;
    upsertRecord({ id: Date.now(), ...newRec });
    setNewRec(EMPTY); setAdding(false);
  }

  const fieldStyle = { width:"100%", padding:"5px 8px", borderRadius:6, border:`1px solid ${C.border}`, fontSize:13, background:C.white };
  const labelStyle = { fontSize:10, color:C.muted, fontWeight:700, marginBottom:3 };

  return (
    <div>
      {/* Search + filters + add */}
      <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
        <input placeholder="Search VA, company, TL, AM, email..."
          value={search} onChange={e=>setSearch(e.target.value)}
          style={{flex:"1 1 220px",padding:"8px 12px",borderRadius:8,border:`1px solid ${C.border}`,fontSize:13}}/>
        <span style={{fontSize:12,color:C.muted}}>{visible.length} records</span>
        <button onClick={()=>setAdding(v=>!v)}
          style={{padding:"7px 16px",borderRadius:8,border:"none",cursor:"pointer",background:C.red,color:C.white,fontWeight:600,fontSize:13,marginLeft:"auto"}}>
          {adding?"✕ Cancel":"+ Add Account"}
        </button>
      </div>


      {/* Add form */}
      {adding&&(
        <div style={{background:C.white,border:`2px solid ${C.teal}`,borderRadius:12,padding:18,marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:14,color:C.teal,marginBottom:14}}>New Account</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:12}}>
            {[["Start Date","start","date"],["VA Name","vaName"],["VA Tag","vaTag"],["Status","status","select-status"],
              ["VA Email","vaEmail"],["Company","company"],["Agency POC","agencyPOC"],["Time Zone","timeZone"],
              ["TL","tl","select-tl"],["AM","am","select-am"],["Sales Rep","salesRep"]].map(([label,field,type])=>(
              <div key={field}>
                <div style={labelStyle}>{label.toUpperCase()}</div>
                {type==="date" ? (
                  <input type="date" value={newRec[field]} onChange={e=>setNewRec(p=>({...p,[field]:e.target.value}))} style={fieldStyle}/>
                ) : type==="select-status" ? (
                  <select value={newRec[field]} onChange={e=>setNewRec(p=>({...p,[field]:e.target.value}))} style={fieldStyle}>
                    {["Active","Resigned","Terminated","On Leave"].map(s=><option key={s}>{s}</option>)}
                  </select>
                ) : type==="select-tl" ? (
                  <select value={newRec[field]} onChange={e=>setNewRec(p=>({...p,[field]:e.target.value}))} style={fieldStyle}>
                    <option value="">— Select TL —</option>
                    {TLS.map(t=><option key={t}>{t}</option>)}
                  </select>
                ) : type==="select-am" ? (
                  <select value={newRec[field]} onChange={e=>setNewRec(p=>({...p,[field]:e.target.value}))} style={fieldStyle}>
                    <option value="">— Select AM —</option>
                    {AMS.map(a=><option key={a}>{a}</option>)}
                  </select>
                ) : (
                  <input value={newRec[field]} placeholder={label} onChange={e=>setNewRec(p=>({...p,[field]:e.target.value}))} style={fieldStyle}/>
                )}
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:10,marginTop:14,justifyContent:"flex-end"}}>
            <button onClick={()=>setAdding(false)} style={{padding:"7px 18px",borderRadius:8,border:`1px solid ${C.border}`,background:C.white,cursor:"pointer",fontSize:13}}>Cancel</button>
            <button onClick={saveNew} style={{padding:"7px 22px",borderRadius:8,border:"none",background:C.teal,color:C.white,cursor:"pointer",fontWeight:700,fontSize:13}}>Save</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{background:C.white,borderRadius:10,border:`1px solid ${C.border}`,overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:900}}>
          <thead>
            <tr style={{background:C.dark,color:C.white}}>
              {["Start","Name of VA","VA Tag"].map((h,i)=>(
                <th key={i} style={{padding:"9px 12px",textAlign:"left",fontWeight:600,fontSize:11,whiteSpace:"nowrap"}}>{h}</th>
              ))}
              {[
                {key:"status",  label:"Status",   opts:["All",...new Set(records.map(r=>r.status).filter(Boolean))],  val:statusFilter, set:setStatusFilter, ac:C.dark},
              ].map(({key,label,opts,val,set,ac})=>(
                <th key={key} style={{padding:"9px 12px",textAlign:"left",fontWeight:600,fontSize:11,whiteSpace:"nowrap",position:"relative"}}>
                  <button onClick={e=>{e.stopPropagation();const el=document.getElementById(`tl-ato-${key}`);el.style.display=el.style.display==="block"?"none":"block";}}
                    style={{background:val!=="All"?ac:"transparent",color:val!=="All"?C.white:"#CBD5E1",border:"none",cursor:"pointer",
                      fontSize:11,fontWeight:700,padding:val!=="All"?"2px 8px":"0",borderRadius:6,display:"flex",alignItems:"center",gap:4}}>
                    {val==="All"?label:val} ▾
                  </button>
                  <div id={`tl-ato-${key}`} style={{display:"none",position:"absolute",top:"100%",left:0,zIndex:99,background:C.white,
                    border:`1px solid ${C.border}`,borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",padding:6,minWidth:130}}>
                    {opts.map(o=>(
                      <div key={o} onClick={e=>{e.stopPropagation();set(o);document.getElementById(`tl-ato-${key}`).style.display="none";}}
                        style={{padding:"6px 10px",cursor:"pointer",borderRadius:6,fontSize:12,color:C.dark,
                          fontWeight:val===o?700:400,background:val===o?C.gray:"transparent"}}>{o==="All"?`All ${label}s`:o}</div>
                    ))}
                  </div>
                </th>
              ))}
              {["Company","Agency POC","TZ"].map((h,i)=>(
                <th key={`m${i}`} style={{padding:"9px 12px",textAlign:"left",fontWeight:600,fontSize:11,whiteSpace:"nowrap"}}>{h}</th>
              ))}
              {[
                {key:"tl",    label:"TL",       opts:["All","Martin","Vince","Karla","Rezyl","ED","RJ"],  val:tlFilter,     set:setTlFilter,     ac:C.teal},
                {key:"am",    label:"AM",        opts:["All","Niccole","Karla","Alicia"],                 val:amFilter,     set:setAmFilter,     ac:C.red},
                {key:"sales", label:"Sales Rep", opts:salesOptions,                                       val:salesFilter,  set:setSalesFilter,  ac:C.purple},
              ].map(({key,label,opts,val,set,ac})=>(
                <th key={key} style={{padding:"9px 12px",textAlign:"left",fontWeight:600,fontSize:11,whiteSpace:"nowrap",position:"relative"}}>
                  <button onClick={e=>{e.stopPropagation();const el=document.getElementById(`tl-ato-${key}`);el.style.display=el.style.display==="block"?"none":"block";}}
                    style={{background:val!=="All"?ac:"transparent",color:val!=="All"?C.white:"#CBD5E1",border:"none",cursor:"pointer",
                      fontSize:11,fontWeight:700,padding:val!=="All"?"2px 8px":"0",borderRadius:6,display:"flex",alignItems:"center",gap:4}}>
                    {val==="All"?label:val} ▾
                  </button>
                  <div id={`tl-ato-${key}`} style={{display:"none",position:"absolute",top:"100%",left:0,zIndex:99,background:C.white,
                    border:`1px solid ${C.border}`,borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",padding:6,minWidth:130}}>
                    {opts.map(o=>(
                      <div key={o} onClick={e=>{e.stopPropagation();set(o);document.getElementById(`tl-ato-${key}`).style.display="none";}}
                        style={{padding:"6px 10px",cursor:"pointer",borderRadius:6,fontSize:12,
                          color:o==="All"?C.dark:key==="am"?({Niccole:C.red,Karla:C.blue,Alicia:C.teal}[o]||C.dark):C.dark,
                          fontWeight:val===o?700:400,background:val===o?C.gray:"transparent"}}>
                        {o==="All"?`All ${label}s`:o}
                      </div>
                    ))}
                  </div>
                </th>
              ))}
              <th style={{padding:"9px 12px"}}></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r,ri)=>{
              const isOpen = expandId === r.id;
              const statusColor = r.status==="Active"?C.green:r.status==="Resigned"?"#EF4444":r.status==="Terminated"?"#DC2626":C.amber;
              return (
                <React.Fragment key={r.id}>
                  <tr onClick={()=>setExpandId(isOpen?null:r.id)}
                    style={{borderBottom:`1px solid ${C.border}`,background:ri%2===0?C.white:C.gray,cursor:"pointer"}}>
                    <td style={{padding:"8px 12px",whiteSpace:"nowrap",color:C.muted}}>{r.start}</td>
                    <td style={{padding:"8px 12px",fontWeight:600,minWidth:140}}>{r.vaName}</td>
                    <td style={{padding:"8px 12px",color:C.muted}}>{r.vaTag}</td>
                    <td style={{padding:"8px 12px"}}>
                      <span style={{fontSize:11,fontWeight:700,color:statusColor,background:statusColor+"18",padding:"2px 8px",borderRadius:99}}>{r.status}</span>
                    </td>
                    <td style={{padding:"8px 12px",minWidth:160}}>{r.company}</td>
                    <td style={{padding:"8px 12px"}}>{r.agencyPOC}</td>
                    <td style={{padding:"8px 12px",color:C.muted,whiteSpace:"nowrap"}}>{r.timeZone}</td>
                    <td style={{padding:"8px 12px",fontWeight:600,color:C.teal}}>{r.tl}</td>
                    <td style={{padding:"8px 12px",fontWeight:600,color:r.am?({Niccole:C.red,Karla:C.blue,Alicia:C.teal}[r.am]||C.dark):C.muted}}>{r.am||"—"}</td>
                    <td style={{padding:"8px 12px"}}>{r.salesRep}</td>
                    <td style={{padding:"8px 10px"}} onClick={e=>{e.stopPropagation();removeRecord(r.id);}}>
                      <button style={{background:"none",border:`1px solid ${C.border}`,borderRadius:6,cursor:"pointer",color:C.muted,fontSize:13,padding:"2px 7px"}}>×</button>
                    </td>
                  </tr>
                  {isOpen&&(
                    <tr>
                      <td colSpan={11} style={{padding:0,borderBottom:`1px solid ${C.border}`}}>
                        <div style={{background:"#FAFBFF",padding:"14px 18px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12}}>
                          {[["Start Date","start"],["VA Name","vaName"],["VA Tag","vaTag"],["VA Email","vaEmail"],
                            ["Company","company"],["Agency POC","agencyPOC"],["Time Zone","timeZone"],["Sales Rep","salesRep"]].map(([label,field])=>(
                            <div key={field}>
                              <div style={labelStyle}>{label.toUpperCase()}</div>
                              <input defaultValue={r[field]} onBlur={e=>upRec(r.id,field,e.target.value)}
                                style={fieldStyle}/>
                            </div>
                          ))}
                          <div>
                            <div style={labelStyle}>STATUS</div>
                            <select value={r.status} onChange={e=>upRec(r.id,"status",e.target.value)} style={fieldStyle}>
                              {["Active","Resigned","Terminated","On Leave"].map(s=><option key={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <div style={labelStyle}>TL</div>
                            <select value={r.tl} onChange={e=>upRec(r.id,"tl",e.target.value)} style={fieldStyle}>
                              <option value="">— Select TL —</option>
                              {TLS.map(t=><option key={t}>{t}</option>)}
                            </select>
                          </div>
                          <div>
                            <div style={labelStyle}>AM</div>
                            <select value={r.am} onChange={e=>upRec(r.id,"am",e.target.value)} style={{...fieldStyle,color:r.am?({Niccole:C.red,Karla:C.blue,Alicia:C.teal}[r.am]||C.dark):C.muted}}>
                              <option value="">— Select AM —</option>
                              {AMS.map(a=><option key={a}>{a}</option>)}
                            </select>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {visible.length===0&&(
              <tr><td colSpan={11} style={{padding:24,textAlign:"center",color:C.muted}}>No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p style={{fontSize:11,color:C.muted,marginTop:8}}>{visible.length} of {records.length} records · Click any row to expand and edit</p>
    </div>
  );
}

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

  const VBS_SECTIONS = [
    {
      title: "Value-Based Selling",
      color: "#0369A1",
      content: `Value-based selling is a sales approach where you focus on the business outcomes and value your solution provides, instead of its features or price.`,
      examples: [
        { label: "Instead of saying", text: `"Our VAs can answer phones, quote policies, and manage renewals."` },
        { label: "You would say", text: `"Our VAs help agencies reduce administrative workload by up to 40%, allowing licensed staff to focus on revenue-generating activities and improving customer response times."` },
      ],
      bullets: ["ROI (return on investment)", "Time savings", "Increased revenue", "Improved efficiency", "Reduced stress and bottlenecks"],
      bulletsLabel: "The conversation centers on:",
      keyQuestion: "\"How will this improve the client's business?\"",
    },
    {
      title: "Consultative Discovery",
      color: "#0369A1",
      content: `Consultative discovery is the process of asking thoughtful questions to understand a prospect's business, challenges, goals, and priorities before recommending a solution. Instead of immediately explaining your service, you spend time learning about the client.`,
      examples: [],
      bullets: [
        "What prompted you to look for a VA?",
        "What tasks are taking up most of your team's time?",
        "Where do you feel your agency is losing efficiency?",
        "What does success look like six months from now?",
        "Have you tried outsourcing before? What worked and what didn't?",
      ],
      bulletsLabel: "Examples of discovery questions:",
      uncover: ["Pain points", "Goals", "Budget", "Decision-making process", "Urgency", "Desired outcomes"],
      uncoverLabel: "The goal is to uncover:",
    },
    {
      title: "How They Work Together",
      color: "#065F46",
      content: "Consultative discovery comes first: Ask questions → Listen carefully → Identify the client's biggest challenges → Connect your solution using value-based selling.",
      dialogue: [
        { speaker: "Discovery", text: `"What is your biggest bottleneck right now?"` },
        { speaker: "Client", text: `"My producers spend too much time servicing existing clients."` },
        { speaker: "Value-Based Response", text: `"That's exactly where our VAs can help. By taking over policy servicing, certificate requests, and administrative work, your producers can spend more time selling and building relationships, which typically has a much greater impact on agency growth."` },
      ],
      remember: [
        { label: "Consultative Discovery", value: "Ask before you tell." },
        { label: "Value-Based Selling", value: "Sell the outcome, not the service." },
      ],
    },
    {
      title: "Why You're Less Likely to Hear 'No' at Cross-Sell",
      color: "#92400E",
      content: `A "no" at the cross-sell stage often means you didn't fully understand the customer's needs earlier in the conversation. The client has essentially convinced themselves they have the problem — you're not saying "buy this," you're saying "earlier you mentioned X, this is how we solve X."`,
      scenarios: [
        {
          label: "Poor Discovery",
          bad: `Salesperson: "Would you also be interested in our MSP services?"\nClient: "No, we're good."`,
          note: "The client says no because they don't see why they need it.",
        },
        {
          label: "Good Discovery",
          good: `Earlier: "Who manages your IT today? How much downtime do you experience?"\nClient: "Honestly, it's becoming a headache. We don't have anyone dedicated to IT."\nLater: "Based on what you've shared, I think our MSP offering could take that burden off your team."`,
          note: "Now it doesn't feel like a random upsell. It feels like a solution.",
        },
      ],
    },
    {
      title: "Applying It to Lava",
      color: "#4F46E5",
      content: "Instead of jumping to \"Would you like another VA?\", first discover the pain points, then connect your recommendation to what they told you.",
      discoverList: ["Are producers doing admin work?", "Are calls going to voicemail?", "Is turnaround time on quotes slow?", "Are employees working overtime?", "Are there tasks that never get done?"],
      example: {
        client: `"Our CSRs are buried."`,
        response: `"Based on what you've shared, I think adding another VA would help relieve your CSRs so they can focus on servicing clients instead of getting stuck with administrative work."`,
        note: "At that point, you're not cross-selling. You're recommending a solution based on what the client told you.",
      },
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {[
          { key: "clarity",  label: " Clarity Selling" },
          { key: "wordtrack",label: " VA & AM Word Track" },
          { key: "vbs",      label: " Value-Based Selling" },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setResource(key)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13,
              fontWeight: resource === key ? 700 : 400,
              background: resource === key ? C.dark : C.gray,
              color: resource === key ? C.white : C.muted }}>
            {label}
          </button>
        ))}
      </div>
      {resource === "clarity"   && <ClaritySellingPanel />}
      {resource === "wordtrack" && <WordTrackPanel />}
      {resource === "vbs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {VBS_SECTIONS.map((s, si) => (
            <div key={si} style={{ background: C.white, borderRadius: 10, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", background: s.color, color: "#fff", fontWeight: 700, fontSize: 14 }}>
                {s.title}
              </div>
              <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                {s.content && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: C.dark }}>{s.content}</p>}

                {s.examples && s.examples.map((e, i) => (
                  <div key={i} style={{ background: C.gray, borderRadius: 8, padding: "10px 14px", borderLeft: `4px solid ${s.color}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 4 }}>{e.label.toUpperCase()}</div>
                    <div style={{ fontSize: 13, color: C.dark, fontStyle: "italic" }}>{e.text}</div>
                  </div>
                ))}

                {s.bulletsLabel && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>{s.bulletsLabel}</div>
                    <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                      {s.bullets.map((b, i) => <li key={i} style={{ fontSize: 13, color: C.dark }}>{b}</li>)}
                    </ul>
                  </div>
                )}

                {s.uncoverLabel && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>{s.uncoverLabel}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {s.uncover.map((u, i) => (
                        <span key={i} style={{ background: s.color + "18", color: s.color, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99 }}>{u}</span>
                      ))}
                    </div>
                  </div>
                )}

                {s.keyQuestion && (
                  <div style={{ background: s.color + "12", borderRadius: 8, padding: "10px 14px", fontSize: 13, fontWeight: 700, color: s.color }}>
                    Key question: {s.keyQuestion}
                  </div>
                )}

                {s.dialogue && s.dialogue.map((d, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: s.color, minWidth: 160, flexShrink: 0, paddingTop: 2 }}>{d.speaker}</span>
                    <div style={{ background: C.gray, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.dark, flex: 1, fontStyle: "italic" }}>{d.text}</div>
                  </div>
                ))}

                {s.remember && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {s.remember.map((r, i) => (
                      <div key={i} style={{ background: s.color + "12", borderRadius: 8, padding: "10px 14px", flex: "1 1 200px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: s.color, marginBottom: 4 }}>{r.label}</div>
                        <div style={{ fontSize: 13, color: C.dark }}>{r.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {s.scenarios && s.scenarios.map((sc, i) => (
                  <div key={i} style={{ background: C.gray, borderRadius: 8, padding: "12px 14px", borderLeft: `4px solid ${i === 0 ? C.red : C.green}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? C.red : C.green, marginBottom: 6 }}>{sc.label}</div>
                    <pre style={{ margin: 0, fontSize: 12, color: C.dark, whiteSpace: "pre-wrap", fontFamily: "inherit", lineHeight: 1.6 }}>{sc.bad || sc.good}</pre>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 6, fontStyle: "italic" }}>{sc.note}</div>
                  </div>
                ))}

                {s.discoverList && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6 }}>Discover first:</div>
                    <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                      {s.discoverList.map((d, i) => <li key={i} style={{ fontSize: 13, color: C.dark }}>{d}</li>)}
                    </ul>
                  </div>
                )}

                {s.example && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.red, minWidth: 60, flexShrink: 0, paddingTop: 2 }}>Client</span>
                      <div style={{ background: C.gray, borderRadius: 8, padding: "8px 12px", fontSize: 13, flex: 1, fontStyle: "italic" }}>{s.example.client}</div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: s.color, minWidth: 60, flexShrink: 0, paddingTop: 2 }}>Response</span>
                      <div style={{ background: C.gray, borderRadius: 8, padding: "8px 12px", fontSize: 13, flex: 1, fontStyle: "italic" }}>{s.example.response}</div>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, fontStyle: "italic" }}>{s.example.note}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

//  APP SHELL 
const TABS = [
  { id: "tasks",        label: " Tasks",               locked: true },
  { id: "kpi",          label: " Island KPIs",         locked: true },
  { id: "hubspot",      label: " HubSpot Links",       locked: true },
  { id: "accounts",     label: " Niccole's Accounts",  locked: true },
  { id: "tlato",        label: "TL ATO",               locked: false },
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
        {activeTab === "tlato"        && <TLATOTab />}
        {activeTab === "workflow"     && <WorkflowTab />}
        {activeTab === "generalnotes" && <GeneralNotesTab />}
        {activeTab === "notes"        && <SalesTrainingTab />}
      </div>
    </div>
    </ThemeCtx.Provider>
  );
}
