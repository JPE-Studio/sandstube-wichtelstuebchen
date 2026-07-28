/* ═══════════════════════════════════════════════════════════════════════
 * Vorschau für den Decap-Editor
 *
 * Zeigt die Inhalte in den echten Schriften und Farben der Papierwelt.
 * Bewusst KEINE 1:1-Kopie der Seite: Das würde das komplette Markup aller
 * sechs Seiten ein zweites Mal in JavaScript verlangen und bei jeder
 * Design-Änderung auseinanderlaufen. Stattdessen eine treue Darstellung
 * der Inhalte – man sieht sofort, wie **Wort** und Links wirken.
 * ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var h = window.h;

  /* ---------- Stile: erst die Schriften, dann das Papierwelt-CSS ---------- */
  CMS.registerPreviewStyle(
    'https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Fraunces:opsz,wght,SOFT,WONK@9..144,400..700,0..100,0..1&family=Nunito:wght@500;700;800&display=swap'
  );
  CMS.registerPreviewStyle('/admin/preview.css');
  CMS.registerPreviewStyle(
    [
      'body{padding:28px 22px}',
      '.cms-sec{margin-bottom:34px}',
      '.cms-label{font-family:var(--font-body);font-size:.68rem;font-weight:800;',
      'letter-spacing:.14em;text-transform:uppercase;color:var(--b-600);',
      'border-bottom:2px dotted var(--b-200);padding-bottom:6px;margin-bottom:16px}',
      '.cms-sec img{border-radius:var(--r-md);max-height:190px;width:auto;margin:10px 0}',
      '.cms-flag{display:inline-block;font-size:.72rem;font-weight:800;padding:.3em .8em;',
      'border-radius:999px;background:var(--b-100);color:var(--b-800)}',
      '.cms-flag--off{background:#F3D9D9;color:#8A2E2E}',
      '.cms-sub{border-left:3px solid var(--b-200);padding-left:16px;margin:14px 0}',
    ].join(''),
    { raw: true }
  );

  /* ---------- Stammdaten für {{platzhalter}} nachladen ---------- */
  var stammdaten = null;
  fetch('/admin/site.json')
    .then(function (r) { return r.json(); })
    .then(function (d) { stammdaten = d; })
    .catch(function () { /* Vorschau zeigt dann die Platzhalter im Klartext */ });

  // Entspricht fill() in src/lib/text.ts
  function fill(value) {
    if (!stammdaten) return value;
    var werte = {
      inhaberin: stammdaten.inhaberin,
      strasse: stammdaten.kontakt.strasse,
      plz_ort: stammdaten.kontakt.plz_ort,
      email: stammdaten.kontakt.email,
    };
    return String(value).replace(/\{\{\s*(\w+)\s*\}\}/g, function (m, k) {
      return werte[k] !== undefined ? werte[k] : m;
    });
  }

  /* ---------- Dieselben Textregeln wie in src/lib/text.ts ---------- */
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Überschrift: Zeilenumbruch → <br>, **Wort** → der gemalte Schwung
  function heading(value) {
    return escapeHtml(value)
      .replace(/\*\*(.+?)\*\*/g, '<span class="mark">$1</span>')
      .replace(/\r?\n/g, '<br>');
  }

  // Fließtext: **fett**, *kursiv*, [Text](Link)
  function rich(value) {
    return escapeHtml(value)
      // HTML-Entities wie &nbsp; wiederherstellen – marked lässt sie ebenfalls durch
      .replace(/&amp;((?:[a-zA-Z][a-zA-Z0-9]*|#\d+));/g, '&$1;')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(/\r?\n\r?\n/g, '<br><br>');
  }

  // Mehrzeilige Texte (Rechtstexte): Absätze und „- “-Aufzählungen,
  // entspricht blocks() auf der Seite.
  function bloecke(value) {
    return String(value)
      .split(/\r?\n\r?\n/)
      .map(function (absatz) {
        var zeilen = absatz.split(/\r?\n/).filter(function (z) { return z.trim(); });
        if (zeilen.length && zeilen.every(function (z) { return /^\s*[-*]\s+/.test(z); })) {
          return (
            '<ul class="ticks">' +
            zeilen
              .map(function (z) { return '<li>' + rich(z.replace(/^\s*[-*]\s+/, '')) + '</li>'; })
              .join('') +
            '</ul>'
          );
        }
        return '<p>' + zeilen.map(rich).join('<br>') + '</p>';
      })
      .join('');
  }

  function html(tag, cls, markup, key) {
    return h(tag, { key: key, className: cls, dangerouslySetInnerHTML: { __html: markup } });
  }

  /* ---------- Feldnamen → passende Darstellung ---------- */
  var UEBERSCHRIFT = ['ueberschrift', 'titel'];
  var FLIESSTEXT = ['text', 'beschreibung', 'hinweis', 'hinweis_technik', 'tipp', 'wert'];
  var ETIKETT = ['chip', 'untertitel', 'label', 'rolle', 'einheit', 'motto'];
  var LISTEN = ['punkte', 'fakten'];
  var VERSTECKT = ['bild_alt', 'alt', 'maps_url', 'tidycal_path', 'wichtelkompass_url', 'reihenfolge'];

  function has(list, key) {
    return list.indexOf(key) !== -1;
  }

  /* Rendert anhand der Felddefinition aus config.yml – dadurch stimmt die
     Reihenfolge immer mit dem Formular (und damit mit der Seite) überein. */
  function nachDefinition(fields, data, tiefe) {
    if (!fields || !fields.map) return objekt(data || {}, tiefe);
    return fields
      .map(function (f) {
        var name = f.get('name');
        var widget = f.get('widget') || 'string';
        var wert = data ? data[name] : undefined;
        if (wert === null || wert === undefined || has(VERSTECKT, name)) return null;

        if (widget === 'object') {
          return h('div', { key: name, className: tiefe === 0 ? null : 'cms-sub' },
            nachDefinition(f.get('fields'), wert, tiefe + 1));
        }
        if (widget === 'list' && f.get('fields') && Array.isArray(wert)) {
          return h('div', { key: name }, wert.map(function (item, i) {
            return h('div', { key: i, className: 'cms-sub' },
              nachDefinition(f.get('fields'), item, tiefe + 1));
          }));
        }
        return feld(name, wert, tiefe, f.get('label'));
      })
      .toArray();
  }

  function feld(key, value, tiefe, label) {
    if (value === null || value === undefined || has(VERSTECKT, key)) return null;

    // Schalter mit dem echten Label aus config.yml beschriften – „anzeigen“
    // und „hervorheben“ bedeuten Verschiedenes.
    if (typeof value === 'boolean') {
      return h(
        'p',
        { key: key },
        h(
          'span',
          { className: value ? 'cms-flag' : 'cms-flag cms-flag--off' },
          (label || key) + ': ' + (value ? 'ja' : 'nein')
        )
      );
    }

    if (typeof value === 'number') return h('p', { key: key }, String(value));

    if (typeof value === 'string') {
      if (!value.trim()) return null;
      value = fill(value);
      if (key === 'bild' || /^\/images\//.test(value)) {
        return h('img', { key: key, src: value, alt: '' });
      }
      if (key === 'kicker') return html('p', 'kicker', escapeHtml(value), key);
      if (key === 'zitat') {
        return h(
          'p',
          { key: key, style: { fontFamily: 'var(--font-hand)', fontSize: '1.5rem', color: 'var(--accent)' } },
          value
        );
      }
      if (key === 'preis') return html('div', 'price', escapeHtml(value), key);
      if (has(UEBERSCHRIFT, key)) {
        return html(tiefe === 0 ? 'h2' : 'h3', null, heading(value), key);
      }
      if (has(ETIKETT, key) || /^button/.test(key)) {
        return html('span', 'chip', escapeHtml(value), key);
      }
      // Mehrzeilig → Absätze und Aufzählungen wie auf der Seite
      if (/\r?\n/.test(value)) return html('div', 'legal', bloecke(value), key);
      if (has(FLIESSTEXT, key)) return html('p', 'lead', rich(value), key);
      return html('p', null, rich(value), key);
    }

    if (Array.isArray(value)) {
      if (has(LISTEN, key) || typeof value[0] === 'string') {
        return h(
          'ul',
          { key: key, className: 'ticks' },
          value.map(function (v, i) {
            return html('li', null, rich(v), i);
          })
        );
      }
      return h(
        'div',
        { key: key },
        value.map(function (v, i) {
          return h('div', { key: i, className: 'cms-sub' }, objekt(v, tiefe + 1));
        })
      );
    }

    if (typeof value === 'object') {
      return h('div', { key: key, className: 'cms-sub' }, objekt(value, tiefe + 1));
    }

    return null;
  }

  function objekt(obj, tiefe) {
    return Object.keys(obj).map(function (key) {
      return feld(key, obj[key], tiefe);
    });
  }

  /* ---------- Vorschau einer Seite ---------- */
  function seitenVorschau(theme) {
    return function (props) {
      var daten = props.entry.get('data');
      var data = daten && daten.toJS ? daten.toJS() : {};
      var fields = props.fields;

      // Ohne Felddefinitionen (sollte nicht vorkommen) auf Schlüssel zurückfallen
      if (!fields || !fields.map) {
        return h('div', { className: 't-' + theme }, objekt(data, 0));
      }

      var abschnitte = fields
        .map(function (f) {
          var name = f.get('name');
          if (name === 'seo') return null; // wirkt sich nicht sichtbar aus
          var wert = data[name];
          if (wert === null || wert === undefined) return null;

          var inhalt =
            f.get('widget') === 'object'
              ? nachDefinition(f.get('fields'), wert, 0)
              : [feld(name, wert, 0)];

          return h('section', { key: name, className: 'cms-sec' }, [
            h('div', { key: 'l', className: 'cms-label' }, f.get('label') || name),
            inhalt,
          ]);
        })
        .toArray();

      return h('div', { className: 't-' + theme }, abschnitte);
    };
  }

  /* ---------- Vorschau eines Teammitglieds ---------- */
  function teamVorschau(props) {
    var d = props.entry.get('data');
    var data = d && d.toJS ? d.toJS() : {};
    var foto = data.foto && props.getAsset ? props.getAsset(data.foto) : data.foto;

    return h('div', { className: 't-wichtel' }, [
      h('article', { key: 'p', className: 'person', style: { maxWidth: '340px' } }, [
        h(
          'div',
          { key: 'f', className: 'person-photo' },
          foto ? h('img', { src: String(foto), alt: data.name || '' }) : null
        ),
        h('div', { key: 'b', className: 'person-body' }, [
          h('h3', { key: 'n' }, data.name || ''),
          h('span', { key: 'r', className: 'person-role' }, data.rolle || ''),
          html('p', null, rich(data.body || ''), 't'),
        ]),
      ]),
    ]);
  }

  /* ---------- Registrieren ---------- */
  var seiten = {
    startseite: 'hub',
    sandstube: 'sand',
    wichtelstuebchen: 'wichtel',
    team_seite: 'wichtel',
    impressum: 'hub',
    datenschutz: 'hub',
    fehlerseite: 'hub',
    site: 'hub',
  };

  Object.keys(seiten).forEach(function (name) {
    CMS.registerPreviewTemplate(name, seitenVorschau(seiten[name]));
  });
  CMS.registerPreviewTemplate('team', teamVorschau);
})();
