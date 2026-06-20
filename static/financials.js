// Renders the financial statements as clean, tabbed, scrollable tables.
// Reads the global `financials` object injected by result.html:
//   { "Income Statement": { columns: [...], rows: [{label, values:[...]}] }, ... }
(function () {
  if (typeof financials === 'undefined' || !financials) return;

  var tabsEl = document.getElementById('finTabs');
  var wrapEl = document.getElementById('finTableWrap');
  if (!tabsEl || !wrapEl) return;

  var names = Object.keys(financials);

  // Format a raw INR value into Crore notation with Indian comma grouping.
  // e.g. 9.04e11 -> "90,456.10"
  function formatCr(value) {
    if (value === null || value === undefined || value === '') return '—';
    var cr = value / 1e7; // 1 Crore = 10,000,000
    return cr.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function buildTable(statement) {
    var cols = (statement && statement.columns) || [];
    var rows = (statement && statement.rows) || [];

    if (!cols.length || !rows.length) {
      return '<p class="fin-empty">No data available for this statement.</p>';
    }

    var html = '<table class="fin-table"><thead><tr>';
    html += '<th class="fin-metric">Particulars</th>';
    cols.forEach(function (c) {
      html += '<th>' + c + '</th>';
    });
    html += '</tr></thead><tbody>';

    rows.forEach(function (row) {
      html += '<tr><td class="fin-metric">' + row.label + '</td>';
      row.values.forEach(function (v) {
        var cls = (typeof v === 'number' && v < 0) ? ' class="neg"' : '';
        html += '<td' + cls + '>' + formatCr(v) + '</td>';
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  function showStatement(index) {
    wrapEl.innerHTML = buildTable(financials[names[index]]);
    var buttons = tabsEl.querySelectorAll('button');
    buttons.forEach(function (b, i) {
      b.classList.toggle('active', i === index);
    });
  }

  names.forEach(function (name, i) {
    var btn = document.createElement('button');
    btn.textContent = name;
    btn.className = 'fin-tab';
    btn.addEventListener('click', function () { showStatement(i); });
    tabsEl.appendChild(btn);
  });

  if (names.length) showStatement(0);
})();
