// Dashboard page
async function renderDashboard() {
  const [projects, employees, articles, timeEntries, projectCosts] = await Promise.all([
    apiGet('/projects'),
    apiGet('/employees?active=1'),
    apiGet('/articles'),
    apiGet('/time-entries'),
    apiGet('/reports/project-costs')
  ]);

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const totalHoursThisMonth = timeEntries
    .filter(t => t.date && t.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((sum, t) => sum + (t.hours || 0), 0);
  const lowStockArticles = articles.filter(a => a.stock_quantity <= a.min_stock).length;
  const totalRevenue = projectCosts.reduce((sum, p) => sum + (p.total_cost || 0), 0);

  return `
    <div class="page-header">
      <h2>Dashboard</h2>
      <span style="color:var(--gray-400);font-size:0.85rem">${new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Aktive Projekte</div>
        <div class="stat-value">${activeProjects}</div>
        <div class="stat-sub">von ${projects.length} gesamt</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">Mitarbeiter</div>
        <div class="stat-value">${employees.length}</div>
        <div class="stat-sub">aktive Mitarbeiter</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-label">Stunden (Monat)</div>
        <div class="stat-value">${totalHoursThisMonth.toFixed(1)}</div>
        <div class="stat-sub">erfasste Stunden</div>
      </div>
      <div class="stat-card ${lowStockArticles > 0 ? 'danger' : ''}">
        <div class="stat-label">Lager-Warnungen</div>
        <div class="stat-value">${lowStockArticles}</div>
        <div class="stat-sub">Artikel unter Mindestbestand</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <div class="card">
        <div class="card-header"><h3>Aktive Projekte</h3></div>
        <div class="card-body">
          ${projects.filter(p => p.status === 'active').length === 0
            ? '<div class="empty-state"><p>Keine aktiven Projekte</p></div>'
            : '<div class="table-wrap"><table><thead><tr><th>Projekt</th><th>Kunde</th><th>Kosten</th></tr></thead><tbody>' +
              projects.filter(p => p.status === 'active').map(p => {
                const cost = projectCosts.find(c => c.id === p.id);
                return `<tr>
                  <td><strong>${esc(p.name)}</strong></td>
                  <td>${esc(p.customer_name || '-')}</td>
                  <td>${(cost?.total_cost || 0).toFixed(2)} &euro;</td>
                </tr>`;
              }).join('') +
              '</tbody></table></div>'
          }
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Letzte Zeiteintr&auml;ge</h3></div>
        <div class="card-body">
          ${timeEntries.length === 0
            ? '<div class="empty-state"><p>Keine Zeiteintr&auml;ge</p></div>'
            : '<div class="table-wrap"><table><thead><tr><th>Datum</th><th>Mitarbeiter</th><th>Projekt</th><th>Std.</th></tr></thead><tbody>' +
              timeEntries.slice(0, 5).map(t => `<tr>
                <td>${t.date}</td>
                <td>${esc(t.employee_name)}</td>
                <td>${esc(t.project_name)}</td>
                <td>${t.hours != null ? t.hours.toFixed(1) : '<span class="badge badge-active">l&auml;uft</span>'}</td>
              </tr>`).join('') +
              '</tbody></table></div>'
          }
        </div>
      </div>
    </div>

    ${lowStockArticles > 0 ? `
    <div class="card" style="margin-top:24px">
      <div class="card-header"><h3 style="color:var(--danger)">Lager-Warnungen</h3></div>
      <div class="card-body">
        <div class="table-wrap"><table><thead><tr><th>Artikel</th><th>Bestand</th><th>Mindestbestand</th><th>Einheit</th></tr></thead><tbody>
        ${articles.filter(a => a.stock_quantity <= a.min_stock).map(a => `<tr>
          <td>${esc(a.name)}</td>
          <td style="color:var(--danger);font-weight:600">${a.stock_quantity}</td>
          <td>${a.min_stock}</td>
          <td>${esc(a.unit)}</td>
        </tr>`).join('')}
        </tbody></table></div>
      </div>
    </div>` : ''}
  `;
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
