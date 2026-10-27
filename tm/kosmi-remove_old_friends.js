// ==UserScript==
// @name         Kosmi – Remove Inactive Friends
// @description  Unfriend people whose last private message is N+ days old.
// @version      2026-10-27
// @author       Cinema-Blue
// @copyright    2026+ Cinema-Blue
// @license      MIT
// @namespace    https://cinema-blue.icu
// @match        https://app.kosmi.io/*
// @icon         https://app.kosmi.io/favicon.png
// @downloadURL  https://static-cytube.github.io/tm/kosmi-remove_old_friends.js
// @updateURL    https://static-cytube.github.io/tm/kosmi-remove_old_friends.js
// @run-at       document-idle
// @grant        unsafeWindow
// @grant        GM_registerMenuCommand
// ==/UserScript==

/* eslint-disable no-multi-spaces */

(function () {
  'use strict';

  // ---------------- Settings ----------------
  const MIN_DAYS = 90;               // remove if label shows >= this many days ("2d", "3d", ...)
  const INCLUDE_NO_MESSAGES = false; // also remove friends you've never messaged (they have no age)
  const DELAY_MS = 1500;             // pause between removals, to avoid rate limits
  const KEEP = [];                   // usernames never to remove, e.g. ['alice', 'bob']

  // Always remove (any age, pre-ticked even in "Delete ALL" mode). KEEP still wins.
  const ALWAYS_REMOVE = /anonymous/i;            // matched against the username
  const ALWAYS_REMOVE_CHECK_DISPLAY_NAME = true; // also match the display name

  // "Friend Request!" handling
  const REMOVE_INCOMING_REQUESTS = true;  // decline requests sent TO you (state PENDING)
  const REMOVE_OUTGOING_REQUESTS = false; // cancel requests YOU sent (state REQUESTED)
  const REQUESTS_IGNORE_AGE = true;       // true = remove all requests; false = only those MIN_DAYS+ old

  // -------------------------------------------
  const W = unsafeWindow;

  // ---- Minimal GraphQL AST builders (no gql library needed) ----
  const N = (v) => ({ kind: 'Name', value: v });
  const F = (name, sel, args = []) => ({
    kind: 'Field', name: N(name), arguments: args, directives: [],
    ...(sel ? { selectionSet: { kind: 'SelectionSet', selections: sel.map((s) => (typeof s === 'string' ? F(s) : s)) } } : {}),
  });
  const op = (operation, name, selections, varDefs = []) => ({
    kind: 'Document',
    definitions: [{
      kind: 'OperationDefinition', operation, name: N(name),
      variableDefinitions: varDefs, directives: [],
      selectionSet: { kind: 'SelectionSet', selections },
    }],
  });
  const strVar = (v) => ({
    kind: 'VariableDefinition', directives: [],
    variable: { kind: 'Variable', name: N(v) },
    type: { kind: 'NonNullType', type: { kind: 'NamedType', name: N('String') } },
  });
  const varArg = (v) => ({ kind: 'Argument', name: N(v), value: { kind: 'Variable', name: N(v) } });

  const FRIENDS_QUERY = op('query', 'FriendsListQuery', [
    F('currentUser', ['id', F('user', ['id', F('friends', ['state', F('user', ['id', 'displayName', 'username'])])])]),
  ]);

  const MESSAGE_LIST_QUERY = op('query', 'MessageList', [
    F('messageList', ['id', F('latestMessage', ['id', 'time']), F('user', ['id', 'displayName', 'username', 'friendshipState'])]),
  ]);

  const REMOVE_FRIEND = op('mutation', 'RemoveFriendMutation2',
    [F('removeFriend', ['id'], [varArg('userId')])],
    [strVar('userId')]);

  // ---- Helpers ----
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const client = () => {
    const c = W.__APOLLO_CLIENT__;
    if (!c) throw new Error('Kosmi Apollo client not found. Wait for the page to load and make sure you are logged in.');
    return c;
  };
  // Same formula Kosmi uses for the "2d" label
  const daysAgo = (unixSec) => Math.floor(Math.abs(Date.now() / 1000 - unixSec) / 86400);

  async function findCandidates(allMode = false) {
    const c = client();
    const [fr, ml] = await Promise.all([
      c.query({ query: FRIENDS_QUERY, fetchPolicy: 'network-only' }),
      c.query({ query: MESSAGE_LIST_QUERY, fetchPolicy: 'network-only' }),
    ]);

    const states = new Set(['ACCEPTED']);
    if (REMOVE_INCOMING_REQUESTS) states.add('PENDING');
    if (REMOVE_OUTGOING_REQUESTS) states.add('REQUESTED');

    // Collect people from the friends list and from the message list (requests can show up in either)
    const people = new Map();
    for (const f of fr.data?.currentUser?.user?.friends || []) {
      if (f?.user?.id && states.has(f.state)) people.set(f.user.id, { ...f.user, state: f.state });
    }
    const lastMsg = new Map();
    for (const m of ml.data?.messageList || []) {
      const u = m?.user;
      if (!u?.id) continue;
      if (m.latestMessage?.time) lastMsg.set(u.id, m.latestMessage.time);
      if (!people.has(u.id) && states.has(u.friendshipState)) people.set(u.id, { ...u, state: u.friendshipState });
    }

    const keep = new Set(KEEP.map((u) => u.toLowerCase()));
    const isRequest = (s) => s === 'PENDING' || s === 'REQUESTED';

    return [...people.values()]
      .map((p) => {
        const t = lastMsg.get(p.id);
        const forced = ALWAYS_REMOVE.test(p.username || '') ||
          (ALWAYS_REMOVE_CHECK_DISPLAY_NAME && ALWAYS_REMOVE.test(p.displayName || ''));
        return { id: p.id, name: p.displayName || p.username, username: p.username, state: p.state, days: t ? daysAgo(t) : null, forced };
      })
      .filter((p) => !keep.has((p.username || '').toLowerCase()))
      .filter((p) => {
        if (p.forced) return true;  // matches ALWAYS_REMOVE
        if (allMode) return true;   // "Delete ALL" ticked: every friend/request, no age filter
        if (isRequest(p.state) && REQUESTS_IGNORE_AGE) return true;
        return p.days === null ? INCLUDE_NO_MESSAGES : p.days >= MIN_DAYS;
      })
      // "anonymous" matches first, then requests, then oldest friends
      .sort((a, b) => (b.forced - a.forced) || (isRequest(b.state) - isRequest(a.state)) || ((b.days ?? 1e9) - (a.days ?? 1e9)));
  }

  // ---- UI panel ----
  function panel(html) {
    let p = document.getElementById('kosmi-cleanup-panel');
    if (!p) {
      p = document.createElement('div');
      p.id = 'kosmi-cleanup-panel';
      Object.assign(p.style, {
        position: 'fixed', top: '16px', right: '16px', zIndex: 2147483647, width: '340px', maxHeight: '70vh',
        overflow: 'auto', background: '#1e1e24', color: '#eee', font: '13px/1.4 system-ui, sans-serif',
        padding: '14px', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,.5)',
      });
      document.body.appendChild(p);
    }
    p.innerHTML = html;
    return p;
  }
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const btn = (id, label, bg) =>
    `<button id="${id}" style="margin:8px 6px 0 0;padding:6px 12px;border:0;border-radius:6px;cursor:pointer;background:${bg};color:#fff">${label}</button>`;

  async function preview(allMode = false) {
    panel('Loading friends…');
    let list;
    try { list = await findCandidates(allMode); }
    catch (e) { panel(`<b>Error:</b> ${esc(e.message)}<br>${btn('kc-close', 'Close', '#555')}`); bindClose(); return; }

    const allToggle =
      `<label style="display:block;margin-bottom:8px;padding:6px 8px;border-radius:6px;background:${allMode ? '#5a1d1d' : '#2a2a32'}">
        <input type="checkbox" id="kc-all"${allMode ? ' checked' : ''}> <b>Delete ALL friends</b> <span style="opacity:.6">(ignore age)</span>
      </label>`;
    const bindAll = () => {
      const a = document.getElementById('kc-all');
      if (a) a.onchange = () => preview(a.checked);
    };

    if (!list.length) {
      panel(`${allToggle}Nothing to remove (no friends inactive ${MIN_DAYS}d+, no matching friend requests).<br>${btn('kc-close', 'Close', '#555')}`);
      bindClose(); bindAll(); return;
    }

    const TAG = {
      PENDING: '<span style="background:#e67e22;color:#fff;border-radius:4px;padding:0 5px;font-size:11px">Friend Request!</span>',
      REQUESTED: '<span style="background:#7f8c8d;color:#fff;border-radius:4px;padding:0 5px;font-size:11px">Sent request</span>',
      ACCEPTED: '',
    };
    const ANON_TAG = '<span style="background:#8e44ad;color:#fff;border-radius:4px;padding:0 5px;font-size:11px">Anonymous</span> ';
    const rows = list.map((f) =>
      `<label style="display:block;padding:3px 0"><input type="checkbox" data-id="${esc(f.id)}"${!allMode || f.forced ? ' checked' : ''}> ${f.forced ? ANON_TAG : ''}${TAG[f.state] || ''}${esc(f.name)} <span style="opacity:.6">@${esc(f.username)} · ${f.days === null ? 'no messages' : f.days + 'd'}</span></label>`
    ).join('');

    const nReq = list.filter((f) => f.state !== 'ACCEPTED').length;
    const nFr = list.length - nReq;
    const nAnon = list.filter((f) => f.forced).length;
    const anonNote = nAnon ? `<div style="opacity:.7">${nAnon} "anonymous" match(es), always ticked</div>` : '';
    const heading = (allMode
      ? `<b>ALL: ${nFr} friend(s), ${nReq} friend request(s)</b>`
      : `<b>${nFr} friend(s) inactive ${MIN_DAYS}d+, ${nReq} friend request(s)</b>`) + anonNote;
    panel(`${allToggle}${heading}<div style="margin-top:8px">${rows}</div>
      ${btn('kc-go', 'Remove selected', '#c0392b')}${btn('kc-close', 'Cancel', '#555')}`);
    bindClose();
    bindAll();

    document.getElementById('kc-go').onclick = async () => {
      const ids = [...document.querySelectorAll('#kosmi-cleanup-panel input[data-id]:checked')].map((c) => c.dataset.id);
      if (!ids.length) { alert('Nothing selected — tick the people you want to remove.'); return; }
      if (!confirm(`Remove ${ids.length} friend(s)/request(s)? This can't be undone automatically.`)) return;
      await removeAll(list.filter((f) => ids.includes(f.id)));
    };
  }

  async function removeAll(list) {
    const c = client();
    const log = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      panel(`Removing ${i + 1}/${list.length}: ${esc(f.name)}…<br><div style="opacity:.7;margin-top:6px">${log.join('<br>')}</div>`);
      try {
        await c.mutate({ mutation: REMOVE_FRIEND, variables: { userId: f.id } });
        log.push(`✓ ${esc(f.name)}`);
        console.log('[kosmi-cleanup] removed', f);
      } catch (e) {
        log.push(`✗ ${esc(f.name)}: ${esc(e.message)}`);
        console.warn('[kosmi-cleanup] failed', f, e);
      }
      if (i < list.length - 1) await sleep(DELAY_MS);
    }
    panel(`<b>Done.</b><div style="margin-top:6px">${log.join('<br>')}</div>${btn('kc-close', 'Close', '#555')}`);
    bindClose();
  }

  function bindClose() {
    const b = document.getElementById('kc-close');
    if (b) b.onclick = () => document.getElementById('kosmi-cleanup-panel')?.remove();
  }

  GM_registerMenuCommand(`🧹 Remove friends inactive ${MIN_DAYS}d+ & friend requests`, () => preview(false));
})();  // -------------------------------------------
  const W = unsafeWindow;

  // ---- Minimal GraphQL AST builders (no gql library needed) ----
  const N = (v) => ({ kind: 'Name', value: v });
  const F = (name, sel, args = []) => ({
    kind: 'Field', name: N(name), arguments: args, directives: [],
    ...(sel ? { selectionSet: { kind: 'SelectionSet', selections: sel.map((s) => (typeof s === 'string' ? F(s) : s)) } } : {}),
  });
  const op = (operation, name, selections, varDefs = []) => ({
    kind: 'Document',
    definitions: [{
      kind: 'OperationDefinition', operation, name: N(name),
      variableDefinitions: varDefs, directives: [],
      selectionSet: { kind: 'SelectionSet', selections },
    }],
  });
  const strVar = (v) => ({
    kind: 'VariableDefinition', directives: [],
    variable: { kind: 'Variable', name: N(v) },
    type: { kind: 'NonNullType', type: { kind: 'NamedType', name: N('String') } },
  });
  const varArg = (v) => ({ kind: 'Argument', name: N(v), value: { kind: 'Variable', name: N(v) } });

  const FRIENDS_QUERY = op('query', 'FriendsListQuery', [
    F('currentUser', ['id', F('user', ['id', F('friends', ['state', F('user', ['id', 'displayName', 'username'])])])]),
  ]);

  const MESSAGE_LIST_QUERY = op('query', 'MessageList', [
    F('messageList', ['id', F('latestMessage', ['id', 'time']), F('user', ['id', 'displayName', 'username', 'friendshipState'])]),
  ]);

  const REMOVE_FRIEND = op('mutation', 'RemoveFriendMutation2',
    [F('removeFriend', ['id'], [varArg('userId')])],
    [strVar('userId')]);

  // ---- Helpers ----
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const client = () => {
    const c = W.__APOLLO_CLIENT__;
    if (!c) throw new Error('Kosmi Apollo client not found. Wait for the page to load and make sure you are logged in.');
    return c;
  };
  // Same formula Kosmi uses for the "2d" label
  const daysAgo = (unixSec) => Math.floor(Math.abs(Date.now() / 1000 - unixSec) / 86400);

  async function findCandidates(allMode = false) {
    const c = client();
    const [fr, ml] = await Promise.all([
      c.query({ query: FRIENDS_QUERY, fetchPolicy: 'network-only' }),
      c.query({ query: MESSAGE_LIST_QUERY, fetchPolicy: 'network-only' }),
    ]);

    const states = new Set(['ACCEPTED']);
    if (REMOVE_INCOMING_REQUESTS) states.add('PENDING');
    if (REMOVE_OUTGOING_REQUESTS) states.add('REQUESTED');

    // Collect people from the friends list and from the message list (requests can show up in either)
    const people = new Map();
    for (const f of fr.data?.currentUser?.user?.friends || []) {
      if (f?.user?.id && states.has(f.state)) people.set(f.user.id, { ...f.user, state: f.state });
    }
    const lastMsg = new Map();
    for (const m of ml.data?.messageList || []) {
      const u = m?.user;
      if (!u?.id) continue;
      if (m.latestMessage?.time) lastMsg.set(u.id, m.latestMessage.time);
      if (!people.has(u.id) && states.has(u.friendshipState)) people.set(u.id, { ...u, state: u.friendshipState });
    }

    const keep = new Set(KEEP.map((u) => u.toLowerCase()));
    const isRequest = (s) => s === 'PENDING' || s === 'REQUESTED';

    return [...people.values()]
      .map((p) => {
        const t = lastMsg.get(p.id);
        return { id: p.id, name: p.displayName || p.username, username: p.username, state: p.state, days: t ? daysAgo(t) : null };
      })
      .filter((p) => !keep.has((p.username || '').toLowerCase()))
      .filter((p) => {
        if (allMode) return true; // "Delete ALL" ticked: every friend/request, no age filter
        if (isRequest(p.state) && REQUESTS_IGNORE_AGE) return true;
        return p.days === null ? INCLUDE_NO_MESSAGES : p.days >= MIN_DAYS;
      })
      // requests first, then oldest friends
      .sort((a, b) => (isRequest(b.state) - isRequest(a.state)) || ((b.days ?? 1e9) - (a.days ?? 1e9)));
  }

  // ---- UI panel ----
  function panel(html) {
    let p = document.getElementById('kosmi-cleanup-panel');
    if (!p) {
      p = document.createElement('div');
      p.id = 'kosmi-cleanup-panel';
      Object.assign(p.style, {
        position: 'fixed', top: '16px', right: '16px', zIndex: 2147483647, width: '340px', maxHeight: '70vh',
        overflow: 'auto', background: '#1e1e24', color: '#eee', font: '13px/1.4 system-ui, sans-serif',
        padding: '14px', borderRadius: '10px', boxShadow: '0 8px 30px rgba(0,0,0,.5)',
      });
      document.body.appendChild(p);
    }
    p.innerHTML = html;
    return p;
  }
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const btn = (id, label, bg) =>
    `<button id="${id}" style="margin:8px 6px 0 0;padding:6px 12px;border:0;border-radius:6px;cursor:pointer;background:${bg};color:#fff">${label}</button>`;

  async function preview(allMode = false) {
    panel('Loading friends…');
    let list;
    try { list = await findCandidates(allMode); }
    catch (e) { panel(`<b>Error:</b> ${esc(e.message)}<br>${btn('kc-close', 'Close', '#555')}`); bindClose(); return; }

    const allToggle =
      `<label style="display:block;margin-bottom:8px;padding:6px 8px;border-radius:6px;background:${allMode ? '#5a1d1d' : '#2a2a32'}">
        <input type="checkbox" id="kc-all"${allMode ? ' checked' : ''}> <b>Delete ALL friends</b> <span style="opacity:.6">(ignore age)</span>
      </label>`;
    const bindAll = () => {
      const a = document.getElementById('kc-all');
      if (a) a.onchange = () => preview(a.checked);
    };

    if (!list.length) {
      panel(`${allToggle}Nothing to remove (no friends inactive ${MIN_DAYS}d+, no matching friend requests).<br>${btn('kc-close', 'Close', '#555')}`);
      bindClose(); bindAll(); return;
    }

    const TAG = {
      PENDING: '<span style="background:#e67e22;color:#fff;border-radius:4px;padding:0 5px;font-size:11px">Friend Request!</span>',
      REQUESTED: '<span style="background:#7f8c8d;color:#fff;border-radius:4px;padding:0 5px;font-size:11px">Sent request</span>',
      ACCEPTED: '',
    };
    const rows = list.map((f) =>
      `<label style="display:block;padding:3px 0"><input type="checkbox" data-id="${esc(f.id)}" checked> ${TAG[f.state] || ''} ${esc(f.name)} <span style="opacity:.6">@${esc(f.username)} · ${f.days === null ? 'no messages' : f.days + 'd'}</span></label>`
    ).join('');

    const nReq = list.filter((f) => f.state !== 'ACCEPTED').length;
    const nFr = list.length - nReq;
    const heading = allMode
      ? `<b>ALL: ${nFr} friend(s), ${nReq} friend request(s)</b>`
      : `<b>${nFr} friend(s) inactive ${MIN_DAYS}d+, ${nReq} friend request(s)</b>`;
    panel(`${allToggle}${heading}<div style="margin-top:8px">${rows}</div>
      ${btn('kc-go', 'Remove selected', '#c0392b')}${btn('kc-close', 'Cancel', '#555')}`);
    bindClose();
    bindAll();

    document.getElementById('kc-go').onclick = async () => {
      const ids = [...document.querySelectorAll('#kosmi-cleanup-panel input[data-id]:checked')].map((c) => c.dataset.id);
      if (!ids.length) return;
      if (!confirm(`Remove ${ids.length} friend(s)/request(s)? This can't be undone automatically.`)) return;
      await removeAll(list.filter((f) => ids.includes(f.id)));
    };
  }

  async function removeAll(list) {
    const c = client();
    const log = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      panel(`Removing ${i + 1}/${list.length}: ${esc(f.name)}…<br><div style="opacity:.7;margin-top:6px">${log.join('<br>')}</div>`);
      try {
        await c.mutate({ mutation: REMOVE_FRIEND, variables: { userId: f.id } });
        log.push(`✓ ${esc(f.name)}`);
        console.log('[kosmi-cleanup] removed', f);
      } catch (e) {
        log.push(`✗ ${esc(f.name)}: ${esc(e.message)}`);
        console.warn('[kosmi-cleanup] failed', f, e);
      }
      if (i < list.length - 1) await sleep(DELAY_MS);
    }
    panel(`<b>Done.</b><div style="margin-top:6px">${log.join('<br>')}</div>${btn('kc-close', 'Close', '#555')}`);
    bindClose();
  }

  function bindClose() {
    const b = document.getElementById('kc-close');
    if (b) b.onclick = () => document.getElementById('kosmi-cleanup-panel')?.remove();
  }

  GM_registerMenuCommand(`🧹 Remove friends inactive ${MIN_DAYS}d+ & friend requests`, () => preview(false));
})();
