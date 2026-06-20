// Renders curated Key Metrics + an expandable grouped "Detailed Fundamentals"
// section from the global `fundamentals` object (Flask result_info).
(function () {
  if (typeof fundamentals === 'undefined' || !fundamentals) return;
  var F = fundamentals;

  // ---------- helpers ----------
  function isEmpty(v) {
    return v === '' || v === null || v === undefined ||
           (typeof v === 'number' && isNaN(v));
  }
  function num(v, d) {
    return Number(v).toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  // Each formatter returns a display string for a raw value.
  var FMT = {
    price:    function (v) { return '₹' + num(v, 2); },
    inr_cr:   function (v) { return '₹' + num(v / 1e7, 2) + ' Cr'; },     // absolute INR -> ₹ Crore
    cr_units: function (v) { return num(v / 1e7, 2) + ' Cr'; },           // share counts -> Crore units
    ratio:    function (v) { return num(v, 2); },
    mult:     function (v) { return num(v, 2) + '×'; },              // e.g. 12.36×
    pct_frac: function (v) { return num(v * 100, 2) + '%'; },             // fraction -> percent
    pct_raw:  function (v) { return num(v, 2) + '%'; },                   // already a percent
    de_ratio: function (v) { return num(v / 100, 2); },                  // yfinance D/E 36.6 -> 0.37
    intval:   function (v) { return num(v, 0); },
    risk:     function (v) { return v + ' / 10'; },
    date:     function (v) { return new Date(v * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); },
    reco:     function (v) { return prettyReco(v); }
  };

  function prettyReco(v) {
    return String(v).replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  // Format a metric; returns {text, cls} where cls applies +/- colouring when signed.
  function render(key, type, signed) {
    var v = F[key];
    if (isEmpty(v)) return { text: '—', cls: '' };
    var text = (FMT[type] || FMT.ratio)(v);
    var cls = '';
    if (signed && typeof v === 'number') cls = v > 0 ? 'val-pos' : (v < 0 ? 'val-neg' : '');
    return { text: text, cls: cls };
  }

  // ---------- curated highlights ----------
  var HIGHLIGHTS = [
    { label: 'Market Cap',       key: 'Market Cap',        type: 'inr_cr' },
    { label: 'P/E (TTM)',        key: 'Trailing PE',       type: 'ratio' },
    { label: 'P/B',              key: 'Price to Book',     type: 'ratio' },
    { label: 'ROE',              key: 'Return on Equity',  type: 'pct_frac' },
    { label: 'Net Margin',       key: 'Net Profit Margin', type: 'pct_frac' },
    { label: 'Div. Yield',       key: 'Dividend Yield',    type: 'pct_frac' },
    { label: '52W High',         key: '52W High',          type: 'price' },
    { label: '52W Low',          key: '52W Low',           type: 'price' },
    { label: 'Debt / Equity',    key: 'Debt to Equity',    type: 'de_ratio' },
    { label: '52W Change',       key: '52W Change %',      type: 'pct_raw', signed: true }
  ];

  // ---------- grouped detail ----------
  var GROUPS = [
    { title: 'Price & Trend', items: [
      ['Current Price', 'Current Price', 'price'],
      ['52W High', '52W High', 'price'],
      ['52W Low', '52W Low', 'price'],
      ['50-Day Avg', '50 DMA', 'price'],
      ['200-Day Avg', '200 DMA', 'price'],
      ['52W Change', '52W Change %', 'pct_raw', true],
      ['Beta', 'Beta', 'ratio'],
      ['Avg Volume', 'Average Volume', 'intval']
    ]},
    { title: 'Size & Shares', items: [
      ['Market Cap', 'Market Cap', 'inr_cr'],
      ['Enterprise Value', 'Enterprise Value', 'inr_cr'],
      ['Shares Outstanding', 'Shares Outstanding', 'cr_units'],
      ['Free Float Shares', 'Free Float Shares', 'cr_units'],
      ['Employees', 'Full-Time Employees', 'intval']
    ]},
    { title: 'Valuation', items: [
      ['Trailing P/E', 'Trailing PE', 'ratio'],
      ['Forward P/E', 'Forward PE', 'ratio'],
      ['PEG Ratio', 'PEG Ratio', 'ratio'],
      ['Price to Book', 'Price to Book', 'ratio'],
      ['Price to Sales', 'Price to Sales', 'ratio'],
      ['EV / EBITDA', 'EV/EBITDA', 'mult'],
      ['EV / Revenue', 'EV/Revenue', 'mult'],
      ['Trailing EPS', 'Trailing EPS', 'price'],
      ['Forward EPS', 'Forward EPS', 'price'],
      ['Book Value', 'Book Value', 'price']
    ]},
    { title: 'Profitability & Returns', items: [
      ['Gross Margin', 'Gross Margin', 'pct_frac'],
      ['EBITDA Margin', 'EBITDA Margin', 'pct_frac'],
      ['Operating Margin', 'Operating Margin', 'pct_frac'],
      ['Net Profit Margin', 'Net Profit Margin', 'pct_frac'],
      ['Return on Equity', 'Return on Equity', 'pct_frac'],
      ['Return on Assets', 'Return on Assets', 'pct_frac']
    ]},
    { title: 'Growth', items: [
      ['Revenue Growth', 'Revenue Growth', 'pct_frac', true],
      ['Earnings Growth', 'Earnings Growth', 'pct_frac', true],
      ['Qtrly Earnings Growth', 'Qtrly Earnings Growth', 'pct_frac', true]
    ]},
    { title: 'Financial Health', items: [
      ['Total Revenue', 'Total Revenue', 'inr_cr'],
      ['EBITDA', 'EBITDA', 'inr_cr'],
      ['Total Debt', 'Total Debt', 'inr_cr'],
      ['Total Cash', 'Total Cash', 'inr_cr'],
      ['Debt / Equity', 'Debt to Equity', 'de_ratio'],
      ['Current Ratio', 'Current Ratio', 'ratio'],
      ['Quick Ratio', 'Quick Ratio', 'ratio'],
      ['Operating Cash Flow', 'Operating Cash Flow', 'inr_cr'],
      ['Free Cash Flow', 'Free Cash Flow', 'inr_cr']
    ]},
    { title: 'Dividend', items: [
      ['Dividend Rate', 'Dividend Rate', 'price'],
      ['Dividend Yield', 'Dividend Yield', 'pct_frac'],
      ['Last Dividend', 'Last Dividend Value', 'price'],
      ['Last Dividend Date', 'Last Dividend Date', 'date']
    ]},
    { title: 'Shareholding', items: [
      ['Held by Insiders', 'Held % Insiders', 'pct_frac'],
      ['Held by Institutions', 'Held % Institutions', 'pct_frac']
    ]},
    { title: 'Governance Risk', items: [
      ['Audit Risk', 'Audit Risk', 'risk'],
      ['Board Risk', 'Board Risk', 'risk'],
      ['Overall Risk', 'Overall Risk', 'risk']
    ]},
    { title: 'Analyst View', items: [
      ['Recommendation', 'Recommendation', 'reco'],
      ['Target (Mean)', 'Target Mean Price', 'price'],
      ['Target (Median)', 'Target Median Price', 'price'],
      ['No. of Analysts', 'No. of Analysts', 'intval']
    ]}
  ];

  // ---------- render highlights ----------
  var kmEl = document.getElementById('keyMetrics');
  if (kmEl) {
    var html = '';
    HIGHLIGHTS.forEach(function (m) {
      var r = render(m.key, m.type, m.signed);
      html += '<div class="metric">' +
                '<span class="metric__label">' + m.label + '</span>' +
                '<span class="metric__value ' + r.cls + '">' + r.text + '</span>' +
              '</div>';
    });
    kmEl.innerHTML = html;
  }

  // ---------- render grouped detail ----------
  function rowsFor(items) {
    var out = '';
    items.forEach(function (it) {
      var r = render(it[1], it[2], it[3]);
      out += '<div class="fund-row">' +
               '<span class="fund-row__label">' + it[0] + '</span>' +
               '<span class="fund-row__value ' + r.cls + '">' + r.text + '</span>' +
             '</div>';
    });
    return out;
  }

  function managementGroup() {
    var officers = F.companyOfficers || [];
    if (!officers.length) return '';
    var rows = '';
    officers.slice(0, 8).forEach(function (o) {
      if (!o.Name) return;
      var meta = [o.Position, (o.Age ? 'Age ' + o.Age : '')].filter(Boolean).join(' · ');
      rows += '<div class="fund-row">' +
                '<span class="fund-row__label">' + o.Name + '</span>' +
                '<span class="fund-row__value fund-row__value--muted">' + (meta || '—') + '</span>' +
              '</div>';
    });
    if (!rows) return '';
    return '<div class="fund-group fund-group--wide"><h3 class="fund-group__title">Management</h3>' +
           '<div class="fund-rows">' + rows + '</div></div>';
  }

  var detailEl = document.getElementById('fundamentalsDetail');
  if (detailEl) {
    var groupsHtml = '';
    GROUPS.forEach(function (g) {
      groupsHtml += '<div class="fund-group"><h3 class="fund-group__title">' + g.title + '</h3>' +
                    '<div class="fund-rows">' + rowsFor(g.items) + '</div></div>';
    });
    groupsHtml += managementGroup();
    detailEl.innerHTML = '<div class="fund-groups">' + groupsHtml + '</div>';
  }

  // ---------- expand / collapse ----------
  var toggle = document.getElementById('fundToggle');
  if (toggle && detailEl) {
    toggle.addEventListener('click', function () {
      var open = detailEl.hasAttribute('hidden');
      if (open) {
        detailEl.removeAttribute('hidden');
        toggle.innerHTML = 'Show less <i class="fas fa-chevron-up"></i>';
        toggle.setAttribute('aria-expanded', 'true');
      } else {
        detailEl.setAttribute('hidden', '');
        toggle.innerHTML = 'Show all <i class="fas fa-chevron-down"></i>';
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ---------- recommendation badge in hero ----------
  var badge = document.getElementById('recoBadge');
  if (badge && !isEmpty(F.Recommendation)) {
    var key = String(F.Recommendation).toLowerCase();
    var tone = (key.indexOf('buy') >= 0) ? 'pos' : (key.indexOf('sell') >= 0 ? 'neg' : 'warn');
    badge.textContent = prettyReco(F.Recommendation);
    badge.className = 'reco-badge reco-badge--' + tone;
    badge.removeAttribute('hidden');
  }
})();
