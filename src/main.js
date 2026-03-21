// ============================================================
//  SPECIAL FC — 2026  |  App Logic
//  Edit data.js for all data changes. This file is logic only.
// ============================================================

import { LEAGUE, TEAMS, SQUADS, FIXTURES, SLOT_TIMES, RESULTS } from './data.js';

const TEAM_NAMES = Object.keys(TEAMS);

// ── Storage ───────────────────────────────────────────────────
// Priority: localStorage (your live edits) overrides RESULTS (last push).
// Export merges both so you never lose local-only entries.
const STORAGE_KEY = 'sfc26_v3';

function getMatchKey(md, idx) { return `${md}-${idx}`; }
function saveData(d)           { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function loadData() {
  let local = {};
  try { local = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch {}
  return { ...RESULTS, ...local };
}

// ── Core computation ──────────────────────────────────────────
function buildStandings(data) {
  const s = {};
  TEAM_NAMES.forEach(t => (s[t] = {
    P:0, W:0, D:0, L:0, GF:0, GA:0, GD:0, Pts:0,
    CS:0, OG:0, form:[], YC:0, RC:0,
  }));

  const playerGoals = {}, playerAssists = {}, playerOG = {};
  const playerYC = {}, playerRC = {}, playerCS = {}, playerTeam = {};

  TEAM_NAMES.forEach(t => SQUADS[t].forEach(p => {
    playerGoals[p] = playerAssists[p] = playerOG[p] = 0;
    playerYC[p]    = playerRC[p]      = playerCS[p] = 0;
    playerTeam[p]  = t;
  }));

  FIXTURES.forEach(md => md.matches.forEach((m, i) => {
    const key = getMatchKey(md.md, i);
    const d   = data[key];
    if (!d || d.hg === '' || d.hg == null) return;

    const hg = +d.hg, ag = +d.ag;
    const h  = s[m.home], a = s[m.away];

    h.P++; a.P++;
    h.GF += hg; h.GA += ag;
    a.GF += ag; a.GA += hg;

    if (hg > ag)      { h.W++; h.Pts += 3; a.L++; h.form.push('W'); a.form.push('L'); }
    else if (hg < ag) { a.W++; a.Pts += 3; h.L++; h.form.push('L'); a.form.push('W'); }
    else              { h.D++; a.D++; h.Pts++; a.Pts++; h.form.push('D'); a.form.push('D'); }

    if (ag === 0) { h.CS++; SQUADS[m.home].forEach(p => playerCS[p] = (playerCS[p]||0)+1); }
    if (hg === 0) { a.CS++; SQUADS[m.away].forEach(p => playerCS[p] = (playerCS[p]||0)+1); }

    (d.events || []).forEach(e => {
      if (e.type === 'own_goal') {
        const benTeam = e.team === m.home ? m.away : m.home;
        s[benTeam].OG++;
        if (e.scorer) playerOG[e.scorer] = (playerOG[e.scorer]||0)+1;
      } else {
        if (e.scorer) playerGoals[e.scorer]   = (playerGoals[e.scorer]||0)+1;
        if (e.assist) playerAssists[e.assist] = (playerAssists[e.assist]||0)+1;
      }
    });

    (d.cards || []).forEach(c => {
      if (!s[c.team]) return;
      if (c.type === 'yellow') { s[c.team].YC++; if (c.player) playerYC[c.player] = (playerYC[c.player]||0)+1; }
      if (c.type === 'red')    { s[c.team].RC++; if (c.player) playerRC[c.player] = (playerRC[c.player]||0)+1; }
    });
  }));

  TEAM_NAMES.forEach(t => (s[t].GD = s[t].GF - s[t].GA));
  return { standings:s, playerGoals, playerAssists, playerOG, playerYC, playerRC, playerCS, playerTeam };
}

function computeMovement(data) {
  let latestMD = 0;
  FIXTURES.forEach(md => md.matches.forEach((_, i) => {
    const d = data[getMatchKey(md.md, i)];
    if (d && d.hg != null && d.hg !== '') latestMD = Math.max(latestMD, md.md);
  }));
  if (latestMD === 0) return {};

  const prevData = {};
  Object.entries(data).forEach(([key, val]) => {
    if (parseInt(key.split('-')[0]) < latestMD) prevData[key] = val;
  });

  const rank = (standings) => Object.entries(standings)
    .sort((a,b) => b[1].Pts-a[1].Pts || b[1].GD-a[1].GD || b[1].GF-a[1].GF)
    .map(([n]) => n);

  const curr = rank(buildStandings(data).standings);
  const prev = rank(buildStandings(prevData).standings);

  const mv = {};
  curr.forEach((name, ci) => {
    const pi = prev.indexOf(name);
    mv[name] = pi === -1 ? 0 : pi - ci;
  });
  return mv;
}

function computeAll() {
  const data = loadData();
  const { standings, playerGoals, playerAssists, playerOG,
          playerYC, playerRC, playerCS, playerTeam } = buildStandings(data);
  const movement = computeMovement(data);

  const sortedTable = Object.entries(standings)
    .sort((a,b) => b[1].Pts-a[1].Pts || b[1].GD-a[1].GD || b[1].GF-a[1].GF)
    .map(([name, s]) => ({ name, ...s, movement: movement[name]||0 }));

  const allPlayers = TEAM_NAMES.flatMap(t => SQUADS[t].map(p => ({
    name:p, team:t,
    goals:   playerGoals[p]  ||0,
    assists: playerAssists[p]||0,
    og:      playerOG[p]     ||0,
    yc:      playerYC[p]     ||0,
    rc:      playerRC[p]     ||0,
    cs:      playerCS[p]     ||0,
    total:  (playerGoals[p]||0)+(playerAssists[p]||0),
  })));

  const scorers      = allPlayers.filter(p=>p.goals>0).sort((a,b)=>b.goals-a.goals||b.assists-a.assists);
  const assisters    = allPlayers.filter(p=>p.assists>0).sort((a,b)=>b.assists-a.assists||b.goals-a.goals);
  const contributors = allPlayers.filter(p=>p.total>0).sort((a,b)=>b.total-a.total||b.goals-a.goals);
  const disciplined  = allPlayers.filter(p=>p.yc>0||p.rc>0).sort((a,b)=>(b.rc*3+b.yc)-(a.rc*3+a.yc));

  return { sortedTable, scorers, assisters, contributors, disciplined,
           standings, playerGoals, playerAssists, playerOG, playerYC, playerRC, playerCS, playerTeam, data };
}

// ── Render: Standings ─────────────────────────────────────────
function renderStandings() {
  const { sortedTable, scorers, assisters, standings, data } = computeAll();

  const totalGoals  = Object.values(data).reduce((s,d)=>s+(d&&d.hg!=null&&d.hg!==''?(+d.hg+(+d.ag)):0),0);
  const playedGames = Object.values(data).filter(d=>d&&d.hg!=null&&d.hg!=='').length;
  const topScorer   = scorers[0];
  const topAssist   = assisters[0];
  const totalCS     = TEAM_NAMES.reduce((s,t)=>s+(standings[t].CS||0),0);

  document.getElementById('summaryCards').innerHTML = `
    <div class="stat-card">
      <div class="stat-card-val">${playedGames}</div>
      <div class="stat-card-lbl">Matches Played</div>
      <div class="stat-card-sub">of ${FIXTURES.length*2} total</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-val">${totalGoals}</div>
      <div class="stat-card-lbl">Total Goals</div>
      <div class="stat-card-sub">${playedGames?(totalGoals/playedGames).toFixed(1):0} per match</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-val">${topScorer?topScorer.goals:0}</div>
      <div class="stat-card-lbl">Top Scorer</div>
      <div class="stat-card-sub">${topScorer?topScorer.name:'—'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-val">${topAssist?topAssist.assists:0}</div>
      <div class="stat-card-lbl">Top Assist</div>
      <div class="stat-card-sub">${topAssist?topAssist.name:'—'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-val">${totalCS}</div>
      <div class="stat-card-lbl">Clean Sheets</div>
      <div class="stat-card-sub">across all teams</div>
    </div>`;

  document.getElementById('standingsBody').innerHTML = sortedTable.map((t, i) => {
    const pos = i + 1;
    const c   = TEAMS[t.name].color;
    const gd  = t.GD>0?`<span class="gd-p">+${t.GD}</span>`:t.GD<0?`<span class="gd-n">${t.GD}</span>`:`<span class="gd-z">0</span>`;
    const form = t.form.slice(-5).map(f=>`<span class="fdot ${f}">${f}</span>`).join('');
    let mvHtml = `<span class="mv-neutral">—</span>`;
    if (t.movement>0) mvHtml = `<span class="mv-up">▲${t.movement}</span>`;
    if (t.movement<0) mvHtml = `<span class="mv-dn">▼${Math.abs(t.movement)}</span>`;

    return `
    <tr>
      <td>
        <div class="pos-cell">
          <span class="pos-num p${Math.min(pos,4)}">${pos}</span>
          <span class="mv-wrap">${mvHtml}</span>
        </div>
      </td>
      <td class="left">
        <div class="team-row-name">
          <div class="team-color-bar" style="background:${c}"></div>
          <span class="team-name-text">${t.name}</span>
        </div>
      </td>
      <td>${t.P}</td><td>${t.W}</td><td>${t.D}</td><td>${t.L}</td>
      <td>${t.GF}</td><td>${t.GA}</td><td>${gd}</td>
      <td class="cs-cell">${t.CS}</td>
      <td class="pts-num">${t.Pts}</td>
      <td><div class="form-track">${form||'<span class="form-empty">—</span>'}</div></td>
    </tr>`;
  }).join('');
}

// ── Render: Fixtures ──────────────────────────────────────────
function renderFixtures() {
  const data = loadData();
  document.getElementById('fixturesBody').innerHTML = FIXTURES.map(md => `
  <div class="matchday-block">
    <div class="md-header">
      <span class="md-label">Matchday ${md.md}</span>
      <span class="md-date">📅 ${md.date}</span>
    </div>
    <div class="matches-wrap">
      ${md.matches.map((m, i) => {
        const key    = getMatchKey(md.md, i);
        const d      = data[key] || {};
        const played = d.hg != null && d.hg !== '';
        const hg = +d.hg, ag = +d.ag;
        const hc = TEAMS[m.home].color, ac = TEAMS[m.away].color;
        const ha = TEAMS[m.home].abbr,  aa = TEAMS[m.away].abbr;
        const resultTxt = played?(hg>ag?`${m.home} Win`:hg<ag?`${m.away} Win`:'Draw'):'';
        const events = d.events||[], cards = d.cards||[];
        const hasDetail = played && (events.length||cards.length);

        return `
        <div class="match-row">
          <div class="team-side">
            <div class="team-badge-lg" style="background:${hc}">${ha}</div>
            <div>
              <div class="team-name-lg">${m.home}</div>
              <div class="slot-time">${SLOT_TIMES[m.slot]}</div>
            </div>
          </div>
          <div class="score-center">
            ${played?`<div class="score-num">${hg} – ${ag}</div>`:`<div class="score-num tbd">TBD</div>`}
            <span class="slot-badge slot-${m.slot==='Early'?'e':'l'}">${m.slot}</span>
            ${resultTxt?`<div class="result-label">${resultTxt}</div>`:''}
          </div>
          <div class="team-side away">
            <div class="team-badge-lg" style="background:${ac}">${aa}</div>
            <div>
              <div class="team-name-lg">${m.away}</div>
              <div class="slot-time" style="text-align:right">${SLOT_TIMES[m.slot]}</div>
            </div>
          </div>
        </div>
        ${hasDetail ? `<div class="match-detail-bar">
          ${events.map(e=>{
            const isOG=e.type==='own_goal';
            const tc=TEAMS[e.team]?.color||'#ccc';
            return `<div class="match-event">
              <span class="evt-dot" style="background:${tc}"></span>
              <span class="evt-icon">${isOG?'🔵':'⚽'}</span>
              <span class="evt-player">${e.scorer}${isOG?' (OG)':''}</span>
              ${e.assist&&!isOG?`<span class="evt-assist">↳ ${e.assist}</span>`:''}
            </div>`;
          }).join('')}
          ${cards.map(c=>`<div class="match-event">
            <span class="evt-dot" style="background:${TEAMS[c.team]?.color||'#ccc'}"></span>
            <span class="evt-icon">${c.type==='red'?'🟥':'🟨'}</span>
            <span class="evt-player">${c.player}</span>
          </div>`).join('')}
        </div>` : played?`<div class="no-goals">No detail recorded</div>`:''}`;
      }).join('')}
    </div>
  </div>`).join('');
}

// ── Render: Stats ─────────────────────────────────────────────
function leaderboardHTML(rows, valKey, emptyMsg) {
  if (!rows.length) return `<div class="lb-empty">${emptyMsg}</div>`;
  const max = rows[0][valKey]||1;
  return rows.slice(0,8).map((r,i)=>{
    const pos=i+1, pCls=pos===1?'r1':pos===2?'r2':pos===3?'r3':'rn';
    const c=TEAMS[r.team]?.color||'#888';
    return `
    <div class="leaderboard-row">
      <span class="lb-rank ${pCls}">${pos}</span>
      <div class="lb-avatar" style="background:${c}">${r.name[0]}</div>
      <div class="lb-info">
        <div class="lb-name">${r.name}</div>
        <div class="lb-team">${r.team}</div>
        <div class="lb-bar-wrap"><div class="lb-bar" style="width:${Math.round((r[valKey]/max)*100)}%;background:${c}"></div></div>
      </div>
      <div class="lb-val">${r[valKey]}</div>
    </div>`;
  }).join('');
}

function renderStats() {
  const { scorers, assisters, contributors, disciplined, standings } = computeAll();
  document.getElementById('topScorers').innerHTML       = leaderboardHTML(scorers,      'goals',   'No goals yet');
  document.getElementById('topAssists').innerHTML       = leaderboardHTML(assisters,    'assists', 'No assists yet');
  document.getElementById('topContributions').innerHTML = leaderboardHTML(contributors, 'total',   'No stats yet');

  document.getElementById('disciplineTable').innerHTML = disciplined.length
    ? disciplined.slice(0,8).map(p => {
        const c=TEAMS[p.team]?.color||'#888';
        return `<div class="leaderboard-row">
          <div class="lb-avatar" style="background:${c}">${p.name[0]}</div>
          <div class="lb-info">
            <div class="lb-name">${p.name}</div>
            <div class="lb-team">${p.team}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            ${p.yc?`<span class="card-pill yc">${p.yc} 🟨</span>`:''}
            ${p.rc?`<span class="card-pill rc">${p.rc} 🟥</span>`:''}
          </div>
        </div>`;
      }).join('')
    : `<div class="lb-empty">No cards issued yet</div>`;

  const rows=TEAM_NAMES.map(t=>({name:t,...standings[t]})).sort((a,b)=>b.Pts-a.Pts||b.GD-a.GD);
  // Clean sheet table
  const csRows = TEAM_NAMES.map(t=>({name:t,cs:standings[t].CS||0,color:TEAMS[t].color,abbr:TEAMS[t].abbr})).sort((a,b)=>b.cs-a.cs);
  document.getElementById('cleanSheetTable').innerHTML = csRows.some(r=>r.cs>0)
    ? csRows.map(r => `<div class="leaderboard-row">
        <div class="lb-avatar" style="background:${r.color};font-size:11px">${r.abbr}</div>
        <div class="lb-info">
          <div class="lb-name">${r.name}</div>
          <div class="lb-bar-wrap"><div class="lb-bar" style="width:${r.cs>0?Math.round((r.cs/Math.max(...csRows.map(x=>x.cs)))*100):0}%;background:${r.color}"></div></div>
        </div>
        <div class="lb-val" style="color:#1565c0">${r.cs}</div>
      </div>`).join('')
    : `<div class="lb-empty">No clean sheets yet</div>`;

  document.getElementById('teamStats').innerHTML = rows.map(t=>{
    const c=TEAMS[t.name].color, avgGF=t.P?(t.GF/t.P).toFixed(1):0;
    return `<div class="leaderboard-row">
      <div class="lb-avatar" style="background:${c};font-size:11px">${TEAMS[t.name].abbr}</div>
      <div class="lb-info">
        <div class="lb-name">${t.name}</div>
        <div class="lb-team">${t.W}W ${t.D}D ${t.L}L · ${avgGF} g/game · ${t.CS} CS</div>
        <div class="lb-bar-wrap"><div class="lb-bar" style="width:${Math.round((t.Pts/15)*100)}%;background:${c}"></div></div>
      </div>
      <div style="text-align:right">
        <div class="lb-val" style="color:${c}">${t.Pts}</div>
        <div style="font-size:9px;color:#aaa;letter-spacing:.5px">PTS</div>
      </div>
    </div>`;
  }).join('');
}

// ── Render: Squads ────────────────────────────────────────────
function renderSquads() {
  const { playerGoals, playerAssists, playerCS, playerYC, playerRC } = computeAll();
  document.getElementById('squadsGrid').innerHTML = TEAM_NAMES.map(team => {
    const { color } = TEAMS[team];
    return `
    <div class="squad-card">
      <div class="squad-header" style="background:${color}">
        <h3>${team}</h3>
        <div class="squad-meta">${SQUADS[team].length} Players</div>
      </div>
      <div>
        ${SQUADS[team].map((p,i)=>{
          const g=playerGoals[p]||0, a=playerAssists[p]||0;
          const cs=playerCS[p]||0, yc=playerYC[p]||0, rc=playerRC[p]||0;
          return `<div class="player-row">
            <span class="p-num" style="background:${color}">${i+1}</span>
            <span class="p-name">${p}</span>
            <div class="p-stats">
              <span class="p-stat-pill ${g>0?'has-goals':''}" title="Goals">⚽${g}</span>
              <span class="p-stat-pill ${a>0?'has-assists':''}" title="Assists">🎯${a}</span>
              <span class="p-stat-pill ${cs>0?'has-cs':''}" title="Clean Sheets">🧤${cs}</span>
              ${yc?`<span class="p-stat-pill has-yc" title="Yellow Cards">🟨${yc}</span>`:''}
              ${rc?`<span class="p-stat-pill has-rc" title="Red Cards">🟥${rc}</span>`:''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

// ── Admin: entry rows ─────────────────────────────────────────
let goalCounters = {}, cardCounters = {};

function goalEntryRowHTML(key, homeTeam, awayTeam, gi, e={}) {
  const isOG=e.type==='own_goal', selTeam=e.team||'', players=selTeam?SQUADS[selTeam]:[];
  return `
  <div class="goal-entry-row" id="grow_${key}_${gi}">
    <label class="og-toggle">
      <input type="checkbox" id="gog_${key}_${gi}" ${isOG?'checked':''}
        onchange="window._sfc.toggleOGRow('${key}',${gi})"/>
      <span class="og-label">OG</span>
    </label>
    <select id="gt_${key}_${gi}" onchange="window._sfc.onTeamChange('${key}',${gi},'${homeTeam}','${awayTeam}')">
      <option value="">Team…</option>
      ${[homeTeam,awayTeam].map(t=>`<option value="${t}" ${e.team===t?'selected':''}>${t}</option>`).join('')}
    </select>
    <select id="gs_${key}_${gi}">
      <option value="">Scorer…</option>
      ${players.map(p=>`<option value="${p}" ${e.scorer===p?'selected':''}>${p}</option>`).join('')}
    </select>
    <select id="ga_${key}_${gi}" ${isOG?'disabled':''} style="opacity:${isOG?.4:1}">
      <option value="">Assist…</option>
      ${players.map(p=>`<option value="${p}" ${e.assist===p?'selected':''}>${p}</option>`).join('')}
    </select>
    <button class="del-goal" onclick="window._sfc.removeGoalRow('${key}',${gi})">🗑</button>
  </div>`;
}

function cardEntryRowHTML(key, homeTeam, awayTeam, ci, c={}) {
  const selTeam=c.team||'', players=selTeam?SQUADS[selTeam]:[];
  return `
  <div class="card-entry-row" id="crow_${key}_${ci}">
    <select id="ctype_${key}_${ci}">
      <option value="yellow" ${(c.type||'yellow')==='yellow'?'selected':''}>🟨 Yellow</option>
      <option value="red"    ${c.type==='red'?'selected':''}>🟥 Red</option>
    </select>
    <select id="cteam_${key}_${ci}" onchange="window._sfc.onCardTeamChange('${key}',${ci},'${homeTeam}','${awayTeam}')">
      <option value="">Team…</option>
      ${[homeTeam,awayTeam].map(t=>`<option value="${t}" ${c.team===t?'selected':''}>${t}</option>`).join('')}
    </select>
    <select id="cplay_${key}_${ci}">
      <option value="">Player…</option>
      ${players.map(p=>`<option value="${p}" ${c.player===p?'selected':''}>${p}</option>`).join('')}
    </select>
    <button class="del-goal" onclick="window._sfc.removeCardRow('${key}',${ci})">🗑</button>
  </div>`;
}

function onTeamChange(key, gi, homeTeam, awayTeam) {
  const team=document.getElementById(`gt_${key}_${gi}`)?.value||'';
  const players=team?SQUADS[team]:[];
  const opts=`<option value="">Scorer…</option>${players.map(p=>`<option>${p}</option>`).join('')}`;
  const aOpts=`<option value="">Assist…</option>${players.map(p=>`<option>${p}</option>`).join('')}`;
  const s=document.getElementById(`gs_${key}_${gi}`), a=document.getElementById(`ga_${key}_${gi}`);
  if(s) s.innerHTML=opts; if(a) a.innerHTML=aOpts;
}

function onCardTeamChange(key, ci) {
  const team=document.getElementById(`cteam_${key}_${ci}`)?.value||'';
  const players=team?SQUADS[team]:[];
  const s=document.getElementById(`cplay_${key}_${ci}`);
  if(s) s.innerHTML=`<option value="">Player…</option>${players.map(p=>`<option>${p}</option>`).join('')}`;
}

function toggleOGRow(key, gi) {
  const isOG=document.getElementById(`gog_${key}_${gi}`)?.checked;
  const a=document.getElementById(`ga_${key}_${gi}`);
  if(a){a.disabled=isOG;a.style.opacity=isOG?'0.4':'1';a.value='';}
}

function addGoalRow(key, ht, at) {
  if(!goalCounters[key]) goalCounters[key]=document.querySelectorAll(`[id^="grow_${key}_"]`).length;
  document.getElementById(`goals-list-${key}`)?.insertAdjacentHTML('beforeend',goalEntryRowHTML(key,ht,at,goalCounters[key]++));
}
function removeGoalRow(key, gi) { document.getElementById(`grow_${key}_${gi}`)?.remove(); }

function addCardRow(key, ht, at) {
  if(!cardCounters[key]) cardCounters[key]=document.querySelectorAll(`[id^="crow_${key}_"]`).length;
  document.getElementById(`cards-list-${key}`)?.insertAdjacentHTML('beforeend',cardEntryRowHTML(key,ht,at,cardCounters[key]++));
}
function removeCardRow(key, ci) { document.getElementById(`crow_${key}_${ci}`)?.remove(); }

function saveMatch(key, ht, at) {
  const hg=document.getElementById(`hg_${key}`)?.value??'';
  const ag=document.getElementById(`ag_${key}`)?.value??'';

  const events=[];
  document.querySelectorAll(`[id^="grow_${key}_"]`).forEach(row=>{
    const gi=row.id.replace(`grow_${key}_`,'');
    const isOG=document.getElementById(`gog_${key}_${gi}`)?.checked;
    const team=document.getElementById(`gt_${key}_${gi}`)?.value||'';
    const scorer=document.getElementById(`gs_${key}_${gi}`)?.value||'';
    const assist=document.getElementById(`ga_${key}_${gi}`)?.value||'';
    if(team&&scorer) events.push(isOG?{type:'own_goal',team,scorer}:{type:'goal',team,scorer,assist});
  });

  const cards=[];
  document.querySelectorAll(`[id^="crow_${key}_"]`).forEach(row=>{
    const ci=row.id.replace(`crow_${key}_`,'');
    const type=document.getElementById(`ctype_${key}_${ci}`)?.value||'yellow';
    const team=document.getElementById(`cteam_${key}_${ci}`)?.value||'';
    const player=document.getElementById(`cplay_${key}_${ci}`)?.value||'';
    if(team&&player) cards.push({type,team,player});
  });

  const data=loadData(); data[key]={hg,ag,events,cards}; saveData(data);
  const saved=document.getElementById(`saved-${key}`);
  if(saved){saved.classList.add('show');setTimeout(()=>saved.classList.remove('show'),2500);}
  showToast('✅ Match saved!'); renderAll();
}

// ── Admin: panel ──────────────────────────────────────────────
function buildAdminPanel() {
  const data=loadData();
  document.getElementById('adminTabsNav').innerHTML=
    FIXTURES.map((md,ti)=>`<div class="admin-tab ${ti===0?'active':''}" onclick="window._sfc.switchAdminTab(${ti})" id="atab-${ti}">MD${md.md}</div>`).join('')+
    `<div class="admin-tab" onclick="window._sfc.switchAdminTab(99)" id="atab-99">📤 Export</div>`;

  document.getElementById('adminTabsBodies').innerHTML=
    FIXTURES.map((md,ti)=>`
    <div class="admin-tab-body ${ti===0?'active':''}" id="abody-${ti}">
      <p class="admin-md-label">${md.date}</p>
      ${md.matches.map((m,mi)=>{
        const key=getMatchKey(md.md,mi), d=data[key]||{hg:'',ag:'',events:[],cards:[]};
        const hc=TEAMS[m.home].color, ac=TEAMS[m.away].color;
        return `
        <div class="score-match-block" id="smb-${key}">
          <div class="smb-header">
            <span class="smb-dot" style="background:${hc}"></span>
            ${m.home} <span style="color:#aaa;margin:0 4px">vs</span> ${m.away}
            <span class="smb-slot">${m.slot} · ${SLOT_TIMES[m.slot]}</span>
          </div>
          <div class="score-line">
            <div class="score-team-lbl" style="color:${hc}">${m.home}</div>
            <input class="score-inp" type="number" min="0" max="99" id="hg_${key}" value="${d.hg}" placeholder="0" style="border-color:${hc}50"/>
            <input class="score-inp" type="number" min="0" max="99" id="ag_${key}" value="${d.ag}" placeholder="0" style="border-color:${ac}50"/>
            <div class="score-team-lbl away" style="color:${ac}">${m.away}</div>
          </div>
          <div class="goals-section">
            <div class="goals-section-title">⚽ Goals &amp; Assists
              <span class="og-hint">(tick OG checkbox for own goals)</span></div>
            <div class="goal-entry-header"><span>OG</span><span>Team</span><span>Scorer</span><span>Assist</span><span></span></div>
            <div id="goals-list-${key}">${(d.events||[]).map((e,gi)=>goalEntryRowHTML(key,m.home,m.away,gi,e)).join('')}</div>
            <button class="add-entry-btn" onclick="window._sfc.addGoalRow('${key}','${m.home}','${m.away}')">+ Add Goal</button>
          </div>
          <div class="goals-section" style="margin-top:12px">
            <div class="goals-section-title">🟨🟥 Cards</div>
            <div class="card-entry-header"><span>Type</span><span>Team</span><span>Player</span><span></span></div>
            <div id="cards-list-${key}">${(d.cards||[]).map((c,ci)=>cardEntryRowHTML(key,m.home,m.away,ci,c)).join('')}</div>
            <button class="add-entry-btn" onclick="window._sfc.addCardRow('${key}','${m.home}','${m.away}')">+ Add Card</button>
          </div>
          <div style="display:flex;align-items:center;margin-top:14px">
            <button class="save-match-btn" onclick="window._sfc.saveMatch('${key}','${m.home}','${m.away}')">💾 Save Match</button>
            <span class="save-success" id="saved-${key}">✅ Saved!</span>
          </div>
        </div>`;
      }).join('')}
    </div>`).join('')+

    `<div class="admin-tab-body" id="abody-99">
      <div class="export-explainer">
        <strong>Publishing scores to everyone — 3 steps:</strong>
        <ol>
          <li>Enter results &amp; events above → <em>Save Match</em> for each game</li>
          <li>Click <strong>Generate Export</strong> below → Copy the output</li>
          <li>In <code>src/data.js</code>, replace the entire <code>export const RESULTS = { ... };</code> block → <code>git push</code></li>
        </ol>
        <p style="margin-top:8px;color:#888;font-size:12px">Vercel deploys in ~30s. All teammates see the update automatically.</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin:16px 0 12px">
        <button class="btn btn-primary btn-sm" onclick="window._sfc.generateExport()">📤 Generate Export</button>
        <button class="btn btn-danger btn-sm"  onclick="window._sfc.clearAllData()">🗑 Clear Local Data</button>
      </div>
      <div id="exportOutput"></div>
    </div>`;
}

function generateExport() {
  const merged=loadData();
  const inner=JSON.stringify(merged,null,2).replace(/^\{/,'').replace(/\}$/,'').trim();
  const block=`export const RESULTS = {\n${inner}\n};`;
  document.getElementById('exportOutput').innerHTML=`
    <p style="font-size:12px;color:#555;margin-bottom:8px;line-height:1.6">
      Copy everything below → replace the entire <code>export const RESULTS = { ... };</code> block in <code>src/data.js</code>
    </p>
    <textarea class="export-box" id="exportTxt" readonly>${block}</textarea>
    <button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="
      navigator.clipboard.writeText(document.getElementById('exportTxt').value)
        .then(()=>window._sfc.showToast('📋 Copied! Now paste into src/data.js and git push'))">
      📋 Copy to clipboard
    </button>`;
}

function clearAllData() {
  if(confirm('Clear all local data? (Pushed results in data.js are unaffected.)')) {
    saveData({}); showToast('🗑 Local data cleared'); buildAdminPanel(); renderAll();
  }
}

// ── Admin gate ────────────────────────────────────────────────
let logoClicks=0, logoTimer=null;
document.getElementById('logoWrap').addEventListener('click',()=>{
  logoClicks++;
  clearTimeout(logoTimer);
  if(logoClicks>=7){
    logoClicks=0;
    document.getElementById('adminOverlay').classList.add('open');
    document.getElementById('adminPwd').value='';
    document.getElementById('pwdErr').style.display='none';
    setTimeout(()=>document.getElementById('adminPwd').focus(),100);
  } else { logoTimer=setTimeout(()=>logoClicks=0,2500); }
});

function checkPwd() {
  if(document.getElementById('adminPwd').value===LEAGUE.adminPassword){
    document.getElementById('adminOverlay').classList.remove('open'); openAdmin();
  } else { document.getElementById('pwdErr').style.display='block'; }
}
function closeOverlay(){ document.getElementById('adminOverlay').classList.remove('open'); logoClicks=0; }
function openAdmin(){
  document.getElementById('adminPanel').classList.add('open');
  buildAdminPanel(); goalCounters={}; cardCounters={}; activateTab('standings');
}
function closeAdmin(){ document.getElementById('adminPanel').classList.remove('open'); }

// ── Tabs ──────────────────────────────────────────────────────
function activateTab(name){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===name));
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.toggle('active',t.id===`tab-${name}`));
}
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    activateTab(tab.dataset.tab);
    if(tab.dataset.tab==='stats')  renderStats();
    if(tab.dataset.tab==='squads') renderSquads();
  });
});

function switchAdminTab(ti){
  document.querySelectorAll('.admin-tab').forEach((t,i)=>t.classList.toggle('active',i===ti||(ti===99&&i===FIXTURES.length)));
  document.querySelectorAll('.admin-tab-body').forEach((b,i)=>b.classList.toggle('active',i===ti||(ti===99&&i===FIXTURES.length)));
}

// ── Toast ─────────────────────────────────────────────────────
let toastTimer;
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2800);
}

window._sfc={
  checkPwd,closeOverlay,openAdmin,closeAdmin,
  onTeamChange,onCardTeamChange,toggleOGRow,
  addGoalRow,removeGoalRow,addCardRow,removeCardRow,
  saveMatch,switchAdminTab,generateExport,clearAllData,showToast,
};

function renderAll(){ renderStandings(); renderFixtures(); renderStats(); renderSquads(); }
renderAll();
