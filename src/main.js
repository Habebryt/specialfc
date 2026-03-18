// ============================================================
//  SPECIAL FC — 2026 APP LOGIC
//  All rendering, admin, and state logic lives here.
//  Edit data.js to change teams/fixtures/squads.
// ============================================================

import { LEAGUE, TEAMS, SQUADS, FIXTURES, SLOT_TIMES } from './data.js';

const TEAM_NAMES = Object.keys(TEAMS);

// ── Storage ──────────────────────────────────────────────────
// Data is stored in localStorage — persists in this browser.
// Use Export/Import in the admin Data tab to move data between devices.
const STORAGE_KEY = 'sfc26_v2';

function getMatchKey(md, idx) { return `${md}-${idx}`; }
function saveData(d)           { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

// ── Compute standings + stats from raw match data ─────────────
function computeAll() {
  const data = loadData();

  const standings = {};
  TEAM_NAMES.forEach(t => (standings[t] = { P:0, W:0, D:0, L:0, GF:0, GA:0, GD:0, Pts:0, form:[] }));

  const playerGoals   = {};
  const playerAssists = {};
  const playerTeam    = {};
  TEAM_NAMES.forEach(t =>
    SQUADS[t].forEach(p => { playerGoals[p] = 0; playerAssists[p] = 0; playerTeam[p] = t; })
  );

  FIXTURES.forEach(md =>
    md.matches.forEach((m, i) => {
      const key = getMatchKey(md.md, i);
      const d   = data[key];
      if (!d || d.hg === '' || d.hg == null) return;

      const hg = +d.hg, ag = +d.ag;
      const h  = standings[m.home], a = standings[m.away];
      h.P++; a.P++;
      h.GF += hg; h.GA += ag;
      a.GF += ag; a.GA += hg;

      if (hg > ag)      { h.W++; h.Pts += 3; a.L++; h.form.push('W'); a.form.push('L'); }
      else if (hg < ag) { a.W++; a.Pts += 3; h.L++; a.form.push('L'); h.form.push('W'); }
      else              { h.D++; a.D++; h.Pts++; a.Pts++; h.form.push('D'); a.form.push('D'); }

      (d.events || []).forEach(e => {
        if (e.scorer) playerGoals[e.scorer]   = (playerGoals[e.scorer]   || 0) + 1;
        if (e.assist) playerAssists[e.assist] = (playerAssists[e.assist] || 0) + 1;
      });
    })
  );

  TEAM_NAMES.forEach(t => (standings[t].GD = standings[t].GF - standings[t].GA));

  const sortedTable = Object.entries(standings)
    .sort((a, b) => b[1].Pts - a[1].Pts || b[1].GD - a[1].GD || b[1].GF - a[1].GF)
    .map(([name, s]) => ({ name, ...s }));

  const scorers = Object.entries(playerGoals)
    .filter(([, g]) => g > 0)
    .map(([name, goals]) => ({ name, team: playerTeam[name], goals, assists: playerAssists[name] || 0 }))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists);

  const assisters = Object.entries(playerAssists)
    .filter(([, a]) => a > 0)
    .map(([name, assists]) => ({ name, team: playerTeam[name], assists, goals: playerGoals[name] || 0 }))
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals);

  const contributors = TEAM_NAMES.flatMap(t =>
    SQUADS[t].map(p => ({
      name: p, team: t,
      goals:   playerGoals[p]   || 0,
      assists: playerAssists[p] || 0,
      total:  (playerGoals[p]   || 0) + (playerAssists[p] || 0),
    }))
  ).filter(p => p.total > 0).sort((a, b) => b.total - a.total || b.goals - a.goals);

  return { sortedTable, scorers, assisters, contributors, standings, playerGoals, playerAssists, playerTeam };
}

// ── Render: Standings ─────────────────────────────────────────
function renderStandings() {
  const { sortedTable, scorers, assisters } = computeAll();
  const data = loadData();

  const totalGoals = FIXTURES.reduce((sum, md) =>
    sum + md.matches.reduce((s, _, i) => {
      const d = data[getMatchKey(md.md, i)];
      return s + (d && d.hg != null && d.hg !== '' ? (+d.hg + +d.ag) : 0);
    }, 0), 0);

  const playedGames = FIXTURES.reduce((sum, md) =>
    sum + md.matches.filter((_, i) => {
      const d = data[getMatchKey(md.md, i)];
      return d && d.hg != null && d.hg !== '';
    }).length, 0);

  const topScorer = scorers[0];
  const topAssist = assisters[0];

  document.getElementById('summaryCards').innerHTML = `
    <div class="stat-card">
      <div class="stat-card-val">${playedGames}</div>
      <div class="stat-card-lbl">Matches Played</div>
      <div class="stat-card-sub">of ${FIXTURES.length * 2} total</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-val">${totalGoals}</div>
      <div class="stat-card-lbl">Total Goals</div>
      <div class="stat-card-sub">${playedGames ? (totalGoals / playedGames).toFixed(1) : 0} per match</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-val">${topScorer ? topScorer.goals : 0}</div>
      <div class="stat-card-lbl">Top Scorer Goals</div>
      <div class="stat-card-sub">${topScorer ? topScorer.name : '—'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-val">${topAssist ? topAssist.assists : 0}</div>
      <div class="stat-card-lbl">Top Assists</div>
      <div class="stat-card-sub">${topAssist ? topAssist.name : '—'}</div>
    </div>`;

  document.getElementById('standingsBody').innerHTML = sortedTable.map((t, i) => {
    const pos = i + 1;
    const gd  = t.GD > 0 ? `<span class="gd-p">+${t.GD}</span>`
              : t.GD < 0 ? `<span class="gd-n">${t.GD}</span>`
              : `<span class="gd-z">0</span>`;
    const form = t.form.slice(-5).map(f => `<span class="fdot ${f}">${f}</span>`).join('');
    const c    = TEAMS[t.name].color;
    return `
    <tr>
      <td><span class="pos-num p${pos}">${pos}</span></td>
      <td class="left">
        <div class="team-row-name">
          <div class="team-color-bar" style="background:${c}"></div>
          <span class="team-name-text">${t.name}</span>
        </div>
      </td>
      <td>${t.P}</td><td>${t.W}</td><td>${t.D}</td><td>${t.L}</td>
      <td>${t.GF}</td><td>${t.GA}</td><td>${gd}</td>
      <td class="pts-num">${t.Pts}</td>
      <td><div class="form-dots">${form || '<span style="color:#ccc;font-size:11px">—</span>'}</div></td>
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
        const resultTxt = played ? (hg > ag ? `${m.home} Win` : hg < ag ? `${m.away} Win` : 'Draw') : '';
        const events    = d.events || [];
        const goalsHtml = played && events.length
          ? `<div class="goal-events">
              ${events.map(e => `
                <div class="goal-event">
                  <span class="goal-team-dot" style="background:${TEAMS[e.team]?.color || '#ccc'}"></span>
                  <span class="goal-icon">⚽</span>
                  <span class="goal-player">${e.scorer}</span>
                  ${e.assist ? `<span class="goal-assist">↳ ${e.assist}</span>` : ''}
                </div>`).join('')}
             </div>`
          : played ? '<div class="no-goals">No scorer data recorded</div>' : '';

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
            ${played
              ? `<div class="score-num">${hg} – ${ag}</div>`
              : `<div class="score-num tbd">TBD</div>`}
            <span class="slot-badge slot-${m.slot === 'Early' ? 'e' : 'l'}">${m.slot}</span>
            ${resultTxt ? `<div class="result-label">${resultTxt}</div>` : ''}
          </div>
          <div class="team-side away">
            <div class="team-badge-lg" style="background:${ac}">${aa}</div>
            <div>
              <div class="team-name-lg">${m.away}</div>
              <div class="slot-time" style="text-align:right">${SLOT_TIMES[m.slot]}</div>
            </div>
          </div>
        </div>
        ${goalsHtml}`;
      }).join('')}
    </div>
  </div>`).join('');
}

// ── Render: Stats ────────────────────────────────────────────
function leaderboardHTML(rows, valKey, emptyMsg) {
  if (!rows.length) return `<div style="padding:24px;text-align:center;color:#ccc;font-size:13px">${emptyMsg}</div>`;
  const max = rows[0][valKey] || 1;
  return rows.slice(0, 8).map((r, i) => {
    const pos  = i + 1;
    const pCls = pos === 1 ? 'r1' : pos === 2 ? 'r2' : pos === 3 ? 'r3' : 'rn';
    const c    = TEAMS[r.team]?.color || '#888';
    const pct  = Math.round((r[valKey] / max) * 100);
    return `
    <div class="leaderboard-row">
      <span class="lb-rank ${pCls}">${pos}</span>
      <div class="lb-avatar" style="background:${c}">${r.name[0]}</div>
      <div class="lb-info">
        <div class="lb-name">${r.name}</div>
        <div class="lb-team">${r.team}</div>
        <div class="lb-bar-wrap"><div class="lb-bar" style="width:${pct}%;background:${c}"></div></div>
      </div>
      <div class="lb-val">${r[valKey]}</div>
    </div>`;
  }).join('');
}

function renderStats() {
  const { scorers, assisters, contributors, standings } = computeAll();
  document.getElementById('topScorers').innerHTML       = leaderboardHTML(scorers,       'goals',   'No goals scored yet');
  document.getElementById('topAssists').innerHTML       = leaderboardHTML(assisters,     'assists', 'No assists recorded yet');
  document.getElementById('topContributions').innerHTML = leaderboardHTML(contributors,  'total',   'No stats yet');

  const rows = TEAM_NAMES.map(t => ({ name: t, ...standings[t] })).sort((a, b) => b.Pts - a.Pts || b.GD - a.GD);
  document.getElementById('teamStats').innerHTML = rows.map(t => {
    const c    = TEAMS[t.name].color;
    const avgGF = t.P ? (t.GF / t.P).toFixed(1) : 0;
    return `
    <div class="leaderboard-row">
      <div class="lb-avatar" style="background:${c}">${TEAMS[t.name].abbr}</div>
      <div class="lb-info">
        <div class="lb-name">${t.name}</div>
        <div class="lb-team">${t.W}W ${t.D}D ${t.L}L · ${avgGF} goals/game</div>
        <div class="lb-bar-wrap"><div class="lb-bar" style="width:${Math.round((t.Pts / 15) * 100)}%;background:${c}"></div></div>
      </div>
      <div style="text-align:right">
        <div class="lb-val" style="color:${c}">${t.Pts}</div>
        <div style="font-size:10px;color:#aaa;letter-spacing:.5px">PTS</div>
      </div>
    </div>`;
  }).join('');
}

// ── Render: Squads ────────────────────────────────────────────
function renderSquads() {
  const { playerGoals, playerAssists } = computeAll();
  document.getElementById('squadsGrid').innerHTML = TEAM_NAMES.map(team => {
    const { color } = TEAMS[team];
    return `
    <div class="squad-card">
      <div class="squad-header" style="background:${color}">
        <h3>${team}</h3>
        <div class="squad-meta">${SQUADS[team].length} Players</div>
      </div>
      <div>
        ${SQUADS[team].map((p, i) => {
          const g = playerGoals[p]   || 0;
          const a = playerAssists[p] || 0;
          return `
          <div class="player-row">
            <span class="p-num" style="background:${color}">${i + 1}</span>
            <span class="p-name">${p}</span>
            <div class="p-stats">
              <span class="p-stat-pill ${g > 0 ? 'has-goals'   : ''}" title="Goals">⚽ ${g}</span>
              <span class="p-stat-pill ${a > 0 ? 'has-assists' : ''}" title="Assists">🎯 ${a}</span>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }).join('');
}

// ── Admin: build panel ────────────────────────────────────────
let goalCounters = {};

function goalEntryRowHTML(key, homeTeam, awayTeam, gi, e = {}) {
  const teams = [homeTeam, awayTeam];
  const selTeam = e.team || '';
  const scorerPlayers = selTeam ? SQUADS[selTeam] : [];

  return `
  <div class="goal-entry-row" id="grow_${key}_${gi}">
    <select id="gt_${key}_${gi}" onchange="window._sfc.updateAssistSelect('${key}',${gi},'${homeTeam}','${awayTeam}')">
      <option value="">Team…</option>
      ${teams.map(t => `<option value="${t}" ${e.team === t ? 'selected' : ''}>${t}</option>`).join('')}
    </select>
    <select id="gs_${key}_${gi}">
      <option value="">Scorer…</option>
      ${scorerPlayers.map(p => `<option value="${p}" ${e.scorer === p ? 'selected' : ''}>${p}</option>`).join('')}
    </select>
    <select id="ga_${key}_${gi}">
      <option value="">Assist (opt)…</option>
      ${scorerPlayers.map(p => `<option value="${p}" ${e.assist === p ? 'selected' : ''}>${p}</option>`).join('')}
    </select>
    <button class="del-goal" onclick="window._sfc.removeGoalRow('${key}',${gi})">🗑</button>
  </div>`;
}

function buildAdminPanel() {
  const data = loadData();
  document.getElementById('adminTabsNav').innerHTML =
    FIXTURES.map((md, ti) =>
      `<div class="admin-tab ${ti === 0 ? 'active' : ''}" onclick="window._sfc.switchAdminTab(${ti})" id="atab-${ti}">MD${md.md}</div>`
    ).join('') +
    `<div class="admin-tab" onclick="window._sfc.switchAdminTab(99)" id="atab-99">⚙ Data</div>`;

  document.getElementById('adminTabsBodies').innerHTML =
    FIXTURES.map((md, ti) => `
    <div class="admin-tab-body ${ti === 0 ? 'active' : ''}" id="abody-${ti}">
      <div style="font-size:11px;color:#aaa;margin-bottom:12px;letter-spacing:.5px">${md.date} · 2 matches</div>
      ${md.matches.map((m, mi) => {
        const key = getMatchKey(md.md, mi);
        const d   = data[key] || { hg: '', ag: '', events: [] };
        const hc  = TEAMS[m.home].color, ac = TEAMS[m.away].color;
        return `
        <div class="score-match-block" id="smb-${key}">
          <div class="smb-header">
            <span style="width:10px;height:10px;border-radius:50%;background:${hc};display:inline-block"></span>
            ${m.home} vs ${m.away}
            <span style="background:#e8ede8;border-radius:10px;padding:2px 8px;font-size:10px;color:#666">${m.slot} · ${SLOT_TIMES[m.slot]}</span>
          </div>
          <div class="score-line">
            <div class="score-team-lbl" style="color:${hc}">${m.home}</div>
            <input class="score-inp" type="number" min="0" max="99"
              id="hg_${key}" value="${d.hg}" placeholder="0" style="border-color:${hc}50"/>
            <input class="score-inp" type="number" min="0" max="99"
              id="ag_${key}" value="${d.ag}" placeholder="0" style="border-color:${ac}50"/>
            <div class="score-team-lbl away" style="color:${ac}">${m.away}</div>
          </div>
          <div class="goals-section">
            <div class="goals-section-title">⚽ Goal Scorers & Assists</div>
            <div id="goals-list-${key}">
              ${(d.events || []).map((e, gi) => goalEntryRowHTML(key, m.home, m.away, gi, e)).join('')}
            </div>
            <button class="add-goal-btn" onclick="window._sfc.addGoalRow('${key}','${m.home}','${m.away}')">+ Add Goal</button>
          </div>
          <div style="display:flex;align-items:center">
            <button class="save-match-btn" onclick="window._sfc.saveMatch('${key}','${m.home}','${m.away}')">
              💾 Save Match
            </button>
            <span class="save-success" id="saved-${key}">✅ Saved!</span>
          </div>
        </div>`;
      }).join('')}
    </div>`).join('') +
    `<div class="admin-tab-body" id="abody-99">
      <p style="font-size:13px;color:#555;margin-bottom:16px;line-height:1.6">
        Data is stored in <strong>this browser's localStorage</strong> — it persists across refreshes
        but is device-specific. Use Export/Import to move data between devices or back it up.
      </p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
        <button class="btn btn-primary btn-sm"  onclick="window._sfc.exportData()">📤 Export Data</button>
        <button class="btn btn-gold btn-sm"     onclick="window._sfc.showImport()">📥 Import Data</button>
        <button class="btn btn-danger btn-sm"   onclick="window._sfc.clearAllData()">🗑 Clear All</button>
      </div>
      <div id="dataIO"></div>
    </div>`;
}

// ── Admin: actions ────────────────────────────────────────────
function updateAssistSelect(key, gi, homeTeam, awayTeam) {
  const teamSel = document.getElementById(`gt_${key}_${gi}`);
  if (!teamSel) return;
  const team    = teamSel.value;
  const players = team ? SQUADS[team] : [];
  const opts    = `<option value="">Scorer…</option>${players.map(p => `<option value="${p}">${p}</option>`).join('')}`;
  const aOpts   = `<option value="">Assist (opt)…</option>${players.map(p => `<option value="${p}">${p}</option>`).join('')}`;
  const sSel = document.getElementById(`gs_${key}_${gi}`);
  const aSel = document.getElementById(`ga_${key}_${gi}`);
  if (sSel) sSel.innerHTML = opts;
  if (aSel) aSel.innerHTML = aOpts;
}

function addGoalRow(key, homeTeam, awayTeam) {
  if (!goalCounters[key]) goalCounters[key] = document.querySelectorAll(`[id^="grow_${key}_"]`).length;
  const gi   = goalCounters[key]++;
  const list = document.getElementById(`goals-list-${key}`);
  if (!list) return;
  list.insertAdjacentHTML('beforeend', goalEntryRowHTML(key, homeTeam, awayTeam, gi));
}

function removeGoalRow(key, gi) {
  document.getElementById(`grow_${key}_${gi}`)?.remove();
}

function saveMatch(key, homeTeam, awayTeam) {
  const hg = document.getElementById(`hg_${key}`)?.value ?? '';
  const ag = document.getElementById(`ag_${key}`)?.value ?? '';

  const events = [];
  document.querySelectorAll(`[id^="grow_${key}_"]`).forEach(row => {
    const gi     = row.id.replace(`grow_${key}_`, '');
    const team   = document.getElementById(`gt_${key}_${gi}`)?.value || '';
    const scorer = document.getElementById(`gs_${key}_${gi}`)?.value || '';
    const assist = document.getElementById(`ga_${key}_${gi}`)?.value || '';
    if (team && scorer) events.push({ team, scorer, assist });
  });

  const data = loadData();
  data[key] = { hg, ag, events };
  saveData(data);

  const saved = document.getElementById(`saved-${key}`);
  if (saved) { saved.classList.add('show'); setTimeout(() => saved.classList.remove('show'), 2500); }

  showToast('✅ Match saved!');
  renderAll();
}

function switchAdminTab(ti) {
  document.querySelectorAll('.admin-tab').forEach((t, i) =>
    t.classList.toggle('active', i === ti || (ti === 99 && i === FIXTURES.length))
  );
  document.querySelectorAll('.admin-tab-body').forEach((b, i) =>
    b.classList.toggle('active', i === ti || (ti === 99 && i === FIXTURES.length))
  );
}

function exportData() {
  const json = JSON.stringify(loadData(), null, 2);
  document.getElementById('dataIO').innerHTML = `
    <textarea class="export-box" readonly>${json}</textarea>
    <button class="btn btn-sm btn-primary" onclick="navigator.clipboard.writeText(${JSON.stringify(json)}).then(()=>window._sfc.showToast('📋 Copied!'))">📋 Copy to clipboard</button>`;
}

function showImport() {
  document.getElementById('dataIO').innerHTML = `
    <textarea class="export-box" id="importBox" placeholder='Paste exported JSON here…'></textarea>
    <button class="btn btn-sm btn-gold" style="margin-top:8px" onclick="window._sfc.doImport()">✅ Confirm Import</button>`;
}

function doImport() {
  try {
    const raw = document.getElementById('importBox')?.value;
    if (!raw) return;
    saveData(JSON.parse(raw));
    showToast('✅ Data imported!');
    buildAdminPanel();
    renderAll();
  } catch {
    showToast('❌ Invalid JSON — check the format');
  }
}

function clearAllData() {
  if (confirm('Clear ALL match data? This cannot be undone.')) {
    saveData({});
    showToast('🗑 All data cleared');
    buildAdminPanel();
    renderAll();
  }
}

// ── Admin gate (logo click ×7) ────────────────────────────────
let logoClicks = 0;
let logoTimer  = null;

document.getElementById('logoWrap').addEventListener('click', () => {
  logoClicks++;
  clearTimeout(logoTimer);
  if (logoClicks >= 7) {
    logoClicks = 0;
    document.getElementById('adminOverlay').classList.add('open');
    document.getElementById('adminPwd').value = '';
    document.getElementById('pwdErr').style.display = 'none';
    setTimeout(() => document.getElementById('adminPwd').focus(), 100);
  } else {
    logoTimer = setTimeout(() => logoClicks = 0, 2500);
  }
});

function checkPwd() {
  if (document.getElementById('adminPwd').value === LEAGUE.adminPassword) {
    document.getElementById('adminOverlay').classList.remove('open');
    openAdmin();
  } else {
    document.getElementById('pwdErr').style.display = 'block';
  }
}

function closeOverlay() {
  document.getElementById('adminOverlay').classList.remove('open');
  logoClicks = 0;
}

function openAdmin() {
  document.getElementById('adminPanel').classList.add('open');
  buildAdminPanel();
  goalCounters = {};
  activateTab('standings');
}

function closeAdmin() {
  document.getElementById('adminPanel').classList.remove('open');
}

// ── Tab routing ───────────────────────────────────────────────
function activateTab(name) {
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === name)
  );
  document.querySelectorAll('.tab-content').forEach(t =>
    t.classList.toggle('active', t.id === `tab-${name}`)
  );
}

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    activateTab(tab.dataset.tab);
    if (tab.dataset.tab === 'stats')  renderStats();
    if (tab.dataset.tab === 'squads') renderSquads();
  });
});

// ── Toast notification ────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Expose globals for inline onclick handlers ────────────────
window._sfc = {
  checkPwd, closeOverlay, openAdmin, closeAdmin,
  updateAssistSelect, addGoalRow, removeGoalRow, saveMatch,
  switchAdminTab, exportData, showImport, doImport, clearAllData, showToast,
};

// ── Initial render ────────────────────────────────────────────
function renderAll() {
  renderStandings();
  renderFixtures();
  renderStats();
  renderSquads();
}

renderAll();
