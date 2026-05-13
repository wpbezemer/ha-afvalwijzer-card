// afvalwijzer-card.js

class AfvalwijzerCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
  }

  setConfig(config) {
    this._config = {
      title: config.title || 'Afvalkalender',
      entities: Array.isArray(config.entities) ? [...config.entities] : [],
      week_starts_on: config.week_starts_on || 'monday',
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  _fire() {
    const config = JSON.parse(JSON.stringify(this._config));
    if (!config.type) config.type = 'custom:afvalwijzer-card';
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config },
      bubbles: true,
      composed: true,
    }));
  }

  _getSuggestions(query) {
    if (!this._hass) return [];
    const q = (query || '').toLowerCase();
    const all = Object.keys(this._hass.states).sort();
    if (!q) {
      return all.filter(id =>
        ['afval','papier','plastic','gft','restafval','rest','bio','pmd']
          .some(k => id.toLowerCase().includes(k))
      ).slice(0, 10);
    }
    return all.filter(id => id.toLowerCase().includes(q)).slice(0, 10);
  }

  _render() {
    const entities = this._config.entities;

    this.innerHTML = `
      <style>
        .afe { padding: 4px 0; }
        .afe label { display: block; font-size: 12px; color: var(--secondary-text-color); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
        .afe input[type=text] {
          width: 100%; box-sizing: border-box; padding: 8px 10px;
          border-radius: 8px; border: 1px solid var(--divider-color, #e0e0e0);
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color); font-size: 14px; margin-bottom: 12px;
        }
        .afe input[type=text]:focus { outline: none; border-color: var(--primary-color, #03a9f4); }
        .afe .sec { font-size: 12px; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.04em; margin: 4px 0 10px; }
        .afe .erow { display: flex; align-items: stretch; gap: 6px; margin-bottom: 8px; position: relative; }
        .afe .erow input { flex: 1; margin-bottom: 0; }
        .afe .del { background: none; border: 1px solid var(--divider-color,#e0e0e0); border-radius: 8px; cursor: pointer; color: var(--secondary-text-color); font-size: 18px; padding: 0 10px; line-height: 1; flex-shrink: 0; }
        .afe .del:hover { color: #c0392b; background: #fddcda; border-color: #f5b0a8; }
        .afe .dd {
          display: none; position: absolute; top: calc(100% + 2px); left: 0; right: 0;
          background: var(--card-background-color, #fff);
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 8px; max-height: 220px; overflow-y: auto;
          z-index: 9999; box-shadow: 0 4px 16px rgba(0,0,0,0.14);
        }
        .afe .dd.open { display: block; }
        .afe .opt { padding: 9px 12px; font-size: 13px; cursor: pointer; color: var(--primary-text-color); border-bottom: 0.5px solid var(--divider-color,#f0f0f0); }
        .afe .opt:last-child { border-bottom: none; }
        .afe .opt:hover { background: var(--secondary-background-color, #f5f5f5); }
        .afe .hint { font-size: 12px; color: var(--secondary-text-color); margin: 4px 0 0; }
        .afe .toggle-row { display: flex; gap: 8px; margin-bottom: 12px; }
        .afe .toggle-btn { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid var(--divider-color,#e0e0e0); background: var(--card-background-color,#fff); color: var(--secondary-text-color); font-size: 13px; cursor: pointer; text-align: center; }
        .afe .toggle-btn.active { border-color: var(--primary-color,#03a9f4); background: var(--primary-color,#03a9f4); color: #fff; font-weight: 500; }
      </style>
      <div class="afe">
        <label>Titel</label>
        <input type="text" id="afe-title" value="${this._config.title}" placeholder="Afvalkalender" />

        <div class="sec">Week begint op</div>
        <div class="toggle-row">
          <button class="toggle-btn ${this._config.week_starts_on === 'monday' ? 'active' : ''}" data-week="monday">Maandag</button>
          <button class="toggle-btn ${this._config.week_starts_on === 'sunday' ? 'active' : ''}" data-week="sunday">Zondag</button>
        </div>

        <div class="sec">Entiteiten (${entities.length})</div>

        ${entities.map((val, i) => `
          <div class="erow" data-idx="${i}">
            <input type="text" class="afe-entity" data-idx="${i}"
              value="${val}" placeholder="Entiteit ID" autocomplete="off" />
            <div class="dd" id="afe-dd-${i}"></div>
            <button class="del" data-del="${i}" title="Verwijderen">×</button>
          </div>`).join('')}

        <div class="erow" data-idx="${entities.length}">
          <input type="text" class="afe-entity afe-new" data-idx="${entities.length}"
            value="" placeholder="Entiteit toevoegen…" autocomplete="off" />
          <div class="dd" id="afe-dd-${entities.length}"></div>
        </div>

        <p class="hint">Typ om te filteren op entity ID</p>
      </div>`;

    // Title: fire on blur only
    const titleEl = this.querySelector('#afe-title');
    titleEl.addEventListener('blur', () => {
      this._config.title = titleEl.value;
      this._fire();
    });

    // Week starts on toggle
    this.querySelectorAll('[data-week]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._config.week_starts_on = btn.dataset.week;
        this._fire();
      });
    });

    // Entity inputs
    this.querySelectorAll('.afe-entity').forEach(input => {
      const i = parseInt(input.dataset.idx);
      const dd = this.querySelector(`#afe-dd-${i}`);
      const isNew = i === entities.length;

      const showDd = (query) => {
        const suggestions = this._getSuggestions(query);
        if (!suggestions.length) { dd.classList.remove('open'); return; }
        dd.innerHTML = suggestions.map(id =>
          `<div class="opt" data-id="${id}">${id}</div>`
        ).join('');
        // Attach pick handlers
        dd.querySelectorAll('.opt').forEach(opt => {
          opt.addEventListener('mousedown', e => {
            e.preventDefault();
            const id = opt.dataset.id;
            if (isNew) {
              this._config.entities.push(id);
            } else {
              this._config.entities[i] = id;
            }
            // Fire THEN re-render — HA will call setConfig which re-renders
            this._fire();
          });
        });
        dd.classList.add('open');
      };

      input.addEventListener('focus', () => showDd(input.value));
      input.addEventListener('input', () => showDd(input.value));
      input.addEventListener('blur', () => {
        setTimeout(() => dd.classList.remove('open'), 200);
      });
    });

    // Delete buttons
    this.querySelectorAll('[data-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.del);
        this._config.entities.splice(i, 1);
        this._fire();
      });
    });
  }
}

customElements.define('afvalwijzer-card-editor', AfvalwijzerCardEditor);

// ──────────────────────────────────────────────
// Card
// ──────────────────────────────────────────────
class AfvalwijzerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
  }

  static getConfigElement() {
    return document.createElement('afvalwijzer-card-editor');
  }

  static getStubConfig() {
    return { title: 'Afvalkalender', entities: [], week_starts_on: 'monday' };
  }

  setConfig(config) {
    if (!config) throw new Error('Geen configuratie opgegeven');
    this._config = {
      title: config.title || 'Afvalkalender',
      entities: Array.isArray(config.entities) ? config.entities : [],
      week_starts_on: config.week_starts_on || 'monday',
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return (this._config.entities || []).length + 1;
  }

  _getDays(state, attrs) {
    if (attrs.days_until_collection_date !== undefined) {
      const n = parseInt(attrs.days_until_collection_date);
      return isNaN(n) ? null : n;
    }
    if (!state || state === 'unavailable' || state === 'unknown') return null;
    try {
      const d = new Date(state);
      d.setHours(0, 0, 0, 0);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return Math.round((d - now) / 86400000);
    } catch { return null; }
  }

  _formatDate(str) {
    if (!str || str === 'unavailable' || str === 'unknown') return '—';
    try {
      return new Date(str).toLocaleDateString('nl-NL', {
        weekday: 'short', day: 'numeric', month: 'short'
      });
    } catch { return str; }
  }

  _urgency(days) {
    if (days === null) return { level: 'unknown',  label: 'Onbekend',      sub: 'Geen data' };
    if (days < 0)      return { level: 'past',     label: 'Verlopen',      sub: 'Datum is voorbij' };
    if (days === 0)    return { level: 'today',    label: 'Vandaag!',      sub: 'Zet container nu buiten' };
    if (days === 1)    return { level: 'tomorrow', label: 'Morgen!',       sub: 'Vanavond buiten zetten' };
    if (days <= 6)     return { level: 'soon',     label: `${days} dagen`, sub: `Nog ${days} dagen` };
    if (days <= 14)    return { level: 'week',     label: `${days} dagen`, sub: `Nog ${days} dagen` };
    return                    { level: 'later',    label: `${days} dagen`, sub: `Nog ${days} dagen` };
  }

  _color(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('plastic') || n.includes('pmd'))
      return { bg: '#FDE8D4', fg: '#C05A1A', accent: '#E8793A' };
    if (n.includes('gft') || n.includes('bio') || n.includes('groen'))
      return { bg: '#DDEFC9', fg: '#3B6D11', accent: '#5D9B2A' };
    if (n.includes('papier') || n.includes('blauw') || n.includes('karton'))
      return { bg: '#D4E8F6', fg: '#185FA5', accent: '#2B7FC7' };
    if (n.includes('rest') || n.includes('grijs'))
      return { bg: '#E5E5E2', fg: '#444441', accent: '#888780' };
    return { bg: '#E5E5E2', fg: '#444441', accent: '#888780' };
  }

  _iconSvg(name, color) {
    const n = (name || '').toLowerCase();
    const base = `xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
    // ti-bottle (official tabler path)
    if (n.includes('plastic') || n.includes('pmd'))
      return `<svg ${base}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 5h4v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2z"/><path d="M14 3.5c0 1.626 .507 3.212 1.45 4.537l.05 .07a8.093 8.093 0 0 1 1.5 4.694v6.199a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-6.2c0 -1.682 .524 -3.322 1.5 -4.693l.05 -.07a7.823 7.823 0 0 0 1.45 -4.537"/><path d="M7 14.803a2.4 2.4 0 0 0 1 -.803a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 1 -.805"/></svg>`;
    // ti-leaf (official tabler path)
    if (n.includes('gft') || n.includes('bio') || n.includes('groen'))
      return `<svg ${base}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 21c.5 -4.5 2.5 -8 7 -10"/><path d="M9 18c6.218 0 10.5 -3.288 11 -12v-2h-4.014c-9 0 -11.986 4 -12 9c0 1 0 3 2 5h3l.014 0"/></svg>`;
    // ti-file-text (official tabler path)
    if (n.includes('papier') || n.includes('blauw') || n.includes('karton'))
      return `<svg ${base}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"/><path d="M9 9l1 0"/><path d="M9 13l6 0"/><path d="M9 17l6 0"/></svg>`;
    // ti-trash (official tabler path)
    return `<svg ${base}><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0"/><path d="M10 11l0 6"/><path d="M14 11l0 6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/></svg>`;
  }

  _getWeekStart(date, weekStartsOn) {
    // weekStartsOn: 0 = sunday, 1 = monday
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0=sun, 1=mon, ...6=sat
    const diff = (day - weekStartsOn + 7) % 7;
    d.setDate(d.getDate() - diff);
    return d;
  }

  _sectionLabel(days, targetDate) {
    if (days === null) return 'Onbekend';
    if (days < 0)     return 'Verlopen';
    if (days === 0)   return 'Vandaag';
    if (days === 1)   return 'Morgen';

    const weekStartsOn = this._config.week_starts_on === 'sunday' ? 0 : 1;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const thisWeekStart = this._getWeekStart(now, weekStartsOn);
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);

    const nextWeekStart = new Date(thisWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);

    if (target >= thisWeekStart && target <= thisWeekEnd) return 'Deze week';
    if (target >= nextWeekStart && target <= nextWeekEnd) return 'Volgende week';
    return 'Later';
  }

  _badgeCss(level) {
    if (level === 'today')    return 'background:#FDDCDA;color:#8B1A1A';
    if (level === 'tomorrow') return 'background:#FDE8D4;color:#9B3E10';
    if (level === 'soon')     return 'background:#FEF3D4;color:#7A5000';
    if (level === 'past')     return 'background:#eee;color:#999';
    return 'background:var(--secondary-background-color,#f5f5f5);color:var(--secondary-text-color,#888)';
  }

  _render() {
    if (!this._hass || !this._config) return;

    const items = this._config.entities.map(id => {
      const s = this._hass.states[id];
      if (!s) return null;
      const attrs = s.attributes || {};
      const name = attrs.friendly_name || id;
      const days = this._getDays(s.state, attrs);
      return {
        name, days,
        rawDate: s.state,
        urgency: this._urgency(days),
        color: this._color(name),
        iconSvg: this._iconSvg(name, this._color(name).fg),
        date: this._formatDate(s.state),
      };
    }).filter(Boolean).sort((a, b) => {
      const da = a.days === null ? 9999 : a.days < 0 ? 8888 : a.days;
      const db = b.days === null ? 9999 : b.days < 0 ? 8888 : b.days;
      return da - db;
    });

    let cardsHtml = '';
    let lastSection = null;

    items.forEach(item => {
      const section = this._sectionLabel(item.days, item.rawDate);
      if (section !== lastSection) {
        cardsHtml += `<div class="sec-label">${section}</div>`;
        lastSection = section;
      }
      const { level } = item.urgency;
      const hasBorder = level === 'today' || level === 'tomorrow' || level === 'soon';
      const borderColor = level === 'today' ? '#C0392B'
        : level === 'tomorrow' ? item.color.accent : '#D4A017';
      const cardBg = (level === 'today' || level === 'tomorrow')
        ? item.color.bg + '44'
        : 'var(--card-background-color,#fff)';

      cardsHtml += `
        <div class="acard" style="
          background:${cardBg};
          ${hasBorder
            ? `border-left:4px solid ${borderColor};border-top:none;border-right:none;border-bottom:none;`
            : 'border:0.5px solid var(--divider-color,#e0e0e0);'}">
          <div class="icon" style="background:${item.color.bg}">
            ${item.iconSvg}
          </div>
          <div class="body">
            <p class="title">${item.name}</p>
            <p class="sub">${item.urgency.sub}</p>
          </div>
          <div class="right">
            <p class="date">${item.date}</p>
            <span class="badge" style="${this._badgeCss(level)}">${item.urgency.label}</span>
          </div>
        </div>`;
    });

    if (!items.length) {
      cardsHtml = `<p class="empty">Voeg entiteiten toe via de editor.</p>`;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { padding: 16px 16px 8px; }
        .header { font-size: 16px; font-weight: 500; color: var(--primary-text-color); margin: 0 0 14px; }
        .sec-label { font-size: 11px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--secondary-text-color,#888); padding: 8px 0 4px; }
        .sec-label:first-child { padding-top: 0; }
        .acard { display: flex; align-items: center; gap: 14px; border-radius: 12px; padding: 12px 14px; margin-bottom: 8px; }
        .icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .body { flex: 1; min-width: 0; }
        .title { font-size: 14px; font-weight: 500; color: var(--primary-text-color); margin: 0 0 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sub { font-size: 12px; color: var(--secondary-text-color,#888); margin: 0; }
        .right { text-align: right; flex-shrink: 0; }
        .date { font-size: 13px; font-weight: 500; color: var(--primary-text-color); margin: 0 0 4px; }
        .badge { display: inline-block; font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 20px; }
        .empty { font-size: 13px; color: var(--secondary-text-color,#888); text-align: center; padding: 16px 0; margin: 0; }
      </style>
      <ha-card>
        <p class="header">${this._config.title}</p>
        ${cardsHtml}
      </ha-card>`;
  }
}

customElements.define('afvalwijzer-card', AfvalwijzerCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'afvalwijzer-card',
  name: 'Afvalwijzer Card',
  description: 'Ophaaldata per fractie met urgentie-indicatoren',
  preview: true,
});
