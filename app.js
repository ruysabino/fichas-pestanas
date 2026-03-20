/* ═══════════════════════════════════════════════════════════════════════════
   APP.JS — Lógica principal · Fichas Extensão de Pestanas
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

/* ── TOAST ───────────────────────────────────────────────────────────────── */
let _toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ── SCREEN ──────────────────────────────────────────────────────────────── */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.style.display = 'none';
    s.classList.remove('active');
  });
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'flex';
    el.classList.add('active');
    window.scrollTo(0, 0);
  }
}

/* ── BOOT ────────────────────────────────────────────────────────────────── */
async function bootApp() {
  await openDB();

  // Set studio name in header
  const sName = localStorage.getItem('ls_studio_name') || 'Lash Studio';
  const hdr = document.getElementById('studio-name-header');
  if (hdr) hdr.textContent = sName;
  const loginBrand = document.getElementById('login-brand');
  if (loginBrand) loginBrand.textContent = sName;

  if (!hasAnyUser()) {
    showScreen('screen-setup');
    return;
  }
  if (loadSession()) {
    showScreen('screen-select');
    updateUserBadge();
    loadStats();
    return;
  }
  showScreen('screen-login');
}

window.addEventListener('DOMContentLoaded', bootApp);

/* ── AUTH FLOWS ──────────────────────────────────────────────────────────── */
async function doSetup() {
  const nome = document.getElementById('setup-nome')?.value.trim();
  const user = document.getElementById('setup-user')?.value.trim();
  const pass = document.getElementById('setup-pass')?.value;
  const conf = document.getElementById('setup-conf')?.value;
  const err  = document.getElementById('setup-err');
  err.textContent = '';
  if (!nome || !user || !pass) { err.textContent = 'Preencha todos os campos.'; return; }
  if (pass.length < 8) { err.textContent = 'Senha com mínimo 8 caracteres.'; return; }
  if (pass !== conf)   { err.textContent = 'As senhas não coincidem.'; return; }
  try {
    await createUser(user, pass, 'admin');
    localStorage.setItem('ls_studio_name', nome);
    startSession(user);
    const hdr = document.getElementById('studio-name-header');
    if (hdr) hdr.textContent = nome;
    showToast('✅ Configurado! Bem-vinda, ' + user + '!');
    showScreen('screen-select');
    updateUserBadge();
    loadStats();
  } catch(e) { err.textContent = e.message; }
}

async function doLogin() {
  const user = document.getElementById('login-user')?.value.trim();
  const pass = document.getElementById('login-pass')?.value;
  const err  = document.getElementById('login-err');
  const btn  = document.getElementById('login-btn');
  err.textContent = '';
  if (!user || !pass) { err.textContent = 'Preencha utilizador e senha.'; return; }
  btn.disabled = true;
  btn.textContent = '🔄 A verificar…';
  try {
    const ok = await loginUser(user, pass);
    if (!ok) {
      err.textContent = '❌ Utilizador ou senha incorretos.';
      btn.disabled = false; btn.textContent = '🔐 Entrar'; return;
    }
    startSession(user);
    showToast('✅ Bem-vinda, ' + user + '!');
    showScreen('screen-select');
    updateUserBadge();
    loadStats();
  } catch(e) {
    err.textContent = 'Erro: ' + e.message;
    btn.disabled = false; btn.textContent = '🔐 Entrar';
  }
}

function doLogout() {
  if (!confirm('Terminar sessão?')) return;
  clearSession();
  showScreen('screen-login');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('screen-login')?.classList.contains('active')) {
    doLogin();
  }
});

function updateUserBadge() {
  const el = document.getElementById('user-badge');
  if (el) el.textContent = '👤 ' + currentUser();
  const adminArea = document.getElementById('admin-only-btns');
  if (adminArea) adminArea.style.display = isAdmin() ? 'flex' : 'none';
}

/* ── STATS ───────────────────────────────────────────────────────────────── */
async function loadStats() {
  try {
    const fichas = await dbGetAll();
    const now = new Date();
    const thisMonth = fichas.filter(f => {
      const d = new Date(f.dataRegisto || f.dataAtend || '');
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const authYes = fichas.filter(f => f.imgAuth === 'Autorizo');
    document.getElementById('stat-total-num').textContent = fichas.length;
    document.getElementById('stat-month-num').textContent = thisMonth.length;
    document.getElementById('stat-auth-yes-num').textContent = authYes.length;
  } catch(e) {}
}

/* ── NAVIGATION ──────────────────────────────────────────────────────────── */
function showNovaFicha() {
  resetFicha();
  showScreen('screen-ficha');
}

function backToSelect() {
  showScreen('screen-select');
  loadStats();
}

function showListagem() {
  renderList();
  showScreen('screen-list');
}

function backToList() {
  showListagem();
}

/* ── RADIO BUTTONS ───────────────────────────────────────────────────────── */
function selectRadio(btn) {
  const field = btn.dataset.field;
  const val   = btn.dataset.val;
  // Deselect siblings
  document.querySelectorAll(`.radio-btn[data-field="${field}"]`).forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  const hidden = document.getElementById(field);
  if (hidden) hidden.value = val;
  // Conditional rows
  handleConditionalRows(field, val);
}

function handleConditionalRows(field, val) {
  const show = v => v === 'Sim';
  const toggle = (rowId, visible) => {
    const row = document.getElementById(rowId);
    if (row) row.style.display = visible ? 'flex' : 'none';
  };
  if (field === 'f-alergia')       toggle('row-alergia-desc', show(val));
  if (field === 'f-alergia-cil')   toggle('row-alergia-cil-desc', show(val));
  if (field === 'f-doenca-ocular') toggle('row-doenca-ocular-desc', show(val));
  if (field === 'f-cirurgia-ocular') toggle('row-cirurgia-ocular-tempo', show(val));
  if (field === 'f-oculos')        toggle('row-lentes-compromisso', show(val));
  if (field === 'f-historico')     toggle('row-duracao', show(val));
}

function resetFicha() {
  // Clear all inputs
  ['f-nome','f-nasc','f-tel','f-instagram','f-data-atend','f-profissional',
   'f-alergia-desc','f-doenca-ocular-desc','f-cirurgia-ocular-tempo','f-duracao',
   'f-alergia-cil-desc','f-assinatura'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('f-pestana').value = '';
  // Clear radios
  document.querySelectorAll('.radio-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('input[type="hidden"]').forEach(i => i.value = '');
  // Set today's date for atendimento
  document.getElementById('f-data-atend').value = new Date().toISOString().split('T')[0];
  // Hide conditional rows
  ['row-alergia-desc','row-alergia-cil-desc','row-doenca-ocular-desc',
   'row-cirurgia-ocular-tempo','row-lentes-compromisso','row-duracao'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

/* ── GUARDAR FICHA ───────────────────────────────────────────────────────── */
async function guardarFicha() {
  // Validate required
  const req = [
    { id: 'f-nome',          label: 'Nome Completo' },
    { id: 'f-nasc',          label: 'Data de Nascimento' },
    { id: 'f-tel',           label: 'Telefone' },
    { id: 'f-alergia',       label: 'Pergunta sobre alergias (1)' },
    { id: 'f-alergia-cola',  label: 'Alergia a colas/patches' },
    { id: 'f-alergia-cil',   label: 'Reação a extensões anteriores' },
    { id: 'f-doenca-ocular', label: 'Doença ocular crónica' },
    { id: 'f-colirio',       label: 'Uso de colírio' },
    { id: 'f-cirurgia-ocular', label: 'Cirurgia ocular' },
    { id: 'f-fotofobia',     label: 'Fotofobia' },
    { id: 'f-oculos',        label: 'Óculos/lentes' },
    { id: 'f-derm',          label: 'Tratamento dermatológico' },
    { id: 'f-gravida',       label: 'Gravidez/amamentação' },
    { id: 'f-consent',       label: 'Consentimento' },
    { id: 'f-img-auth',      label: 'Autorização de imagem' },
    { id: 'f-assinatura',    label: 'Assinatura digital' },
  ];
  for (const r of req) {
    const el = document.getElementById(r.id);
    if (!el || !el.value.trim()) {
      showToast('⚠️ Campo obrigatório: ' + r.label);
      el?.closest('.ficha-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  }

  const ficha = {
    nome:              document.getElementById('f-nome').value.trim(),
    nasc:              document.getElementById('f-nasc').value,
    tel:               document.getElementById('f-tel').value.trim(),
    instagram:         document.getElementById('f-instagram').value.trim(),
    dataAtend:         document.getElementById('f-data-atend').value,
    profissional:      document.getElementById('f-profissional').value.trim(),
    alergia:           document.getElementById('f-alergia').value,
    alergiaDesc:       document.getElementById('f-alergia-desc').value.trim(),
    alergiaCola:       document.getElementById('f-alergia-cola').value,
    alergiaCil:        document.getElementById('f-alergia-cil').value,
    alergiaCilDesc:    document.getElementById('f-alergia-cil-desc').value.trim(),
    doencaOcular:      document.getElementById('f-doenca-ocular').value,
    doencaOcularDesc:  document.getElementById('f-doenca-ocular-desc').value.trim(),
    colirio:           document.getElementById('f-colirio').value,
    cirurgiaOcular:    document.getElementById('f-cirurgia-ocular').value,
    cirurgiaOcularTempo: document.getElementById('f-cirurgia-ocular-tempo').value.trim(),
    fotofobia:         document.getElementById('f-fotofobia').value,
    oculos:            document.getElementById('f-oculos').value,
    lentesComprom:     document.getElementById('f-lentes-comprom').value,
    derm:              document.getElementById('f-derm').value,
    gravida:           document.getElementById('f-gravida').value,
    maquiagem:         document.getElementById('f-maquiagem').value,
    esfregar:          document.getElementById('f-esfregar').value,
    natacao:           document.getElementById('f-natacao').value,
    historico:         document.getElementById('f-historico').value,
    duracao:           document.getElementById('f-duracao').value.trim(),
    pestana:           document.getElementById('f-pestana').value,
    consent:           document.getElementById('f-consent').value,
    imgAuth:           document.getElementById('f-img-auth').value,
    assinatura:        document.getElementById('f-assinatura').value.trim(),
    dataRegisto:       new Date().toISOString(),
    criadoPor:         currentUser(),
  };

  try {
    await dbSave(ficha);
    showToast('✅ Ficha guardada com sucesso!');
    showScreen('screen-select');
    loadStats();
  } catch(e) {
    showToast('❌ Erro ao guardar: ' + e.message);
  }
}

/* ── LISTAGEM ────────────────────────────────────────────────────────────── */
let _allFichas = [];

async function renderList() {
  _allFichas = await dbGetAll();
  _allFichas.sort((a, b) => (b.dataRegisto || '').localeCompare(a.dataRegisto || ''));
  drawList(_allFichas);
}

function filterList() {
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  const filtered = q ? _allFichas.filter(f => (f.nome || '').toLowerCase().includes(q)) : _allFichas;
  drawList(filtered);
}

function drawList(fichas) {
  const container = document.getElementById('fichas-list');
  if (!fichas.length) {
    container.innerHTML = `<div class="empty-state"><div class="es-icon">👁️</div><p>Nenhuma ficha encontrada.</p></div>`;
    return;
  }
  container.innerHTML = fichas.map(f => `
    <div class="ficha-item">
      <div class="ficha-item-info">
        <div class="ficha-item-name">${esc(f.nome)}</div>
        <div class="ficha-item-meta">
          ${f.dataAtend ? '📅 ' + fmt(f.dataAtend) : ''}
          ${f.pestana ? ' · 👁️ ' + esc(f.pestana) : ''}
          ${f.imgAuth === 'Autorizo' ? ' · ✅ Imagem' : ''}
        </div>
      </div>
      <div class="ficha-item-actions">
        <button class="btn-secondary btn-sm" onclick="verFicha(${f.id})">Ver / Imprimir</button>
        ${isAdmin() ? `<button class="btn-icon" onclick="confirmarEliminar(${f.id})" title="Eliminar">🗑️</button>` : ''}
      </div>
    </div>
  `).join('');
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmt(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00' : ''));
  return d.toLocaleDateString('pt-PT');
}

async function confirmarEliminar(id) {
  if (!confirm('Eliminar esta ficha? Esta ação não pode ser desfeita.')) return;
  await dbDelete(id);
  showToast('🗑️ Ficha eliminada.');
  renderList();
}

/* ── VER / IMPRIMIR FICHA ────────────────────────────────────────────────── */
async function verFicha(id) {
  const f = await dbGetById(id);
  if (!f) { showToast('Ficha não encontrada.'); return; }
  const area = document.getElementById('print-area');
  area.innerHTML = buildPrintHTML(f);
  showScreen('screen-view');
}

function row(label, val, full) {
  const cls = full ? 'print-field print-field--full' : 'print-field';
  return `<div class="${cls}"><label>${label}</label><div class="val">${esc(val) || '—'}</div></div>`;
}

function buildPrintHTML(f) {
  const studioName = localStorage.getItem('ls_studio_name') || 'Lash Studio';
  const today = new Date(f.dataRegisto).toLocaleDateString('pt-PT', { day:'2-digit', month:'long', year:'numeric' });
  return `
  <div class="print-doc" style="padding:28px 32px;background:white;color:#111;font-family:'DM Sans',Arial,sans-serif;">
    <div class="print-header">
      <div>
        <div class="print-header-title" style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;color:#1a1a1a;">✦ ${esc(studioName)}</div>
        <div class="print-header-sub" style="font-size:12px;color:#555;margin-top:2px;">Ficha de Anamnese · Extensão de Pestanas</div>
      </div>
      <div style="text-align:right;font-size:12px;color:#666;">
        <div>Nº ficha: <strong>#${f.id}</strong></div>
        <div>Registado: ${today}</div>
      </div>
    </div>

    <section class="print-section" style="margin-bottom:16px;">
      <div class="print-section-title" style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#555;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:10px;">01 · Dados Pessoais</div>
      <div class="print-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;">
        ${row('Nome Completo', f.nome, true)}
        ${row('Data de Nascimento', fmt(f.nasc))}
        ${row('Telefone / WhatsApp', f.tel)}
        ${row('Instagram', f.instagram)}
        ${row('Data do Atendimento', fmt(f.dataAtend))}
        ${row('Profissional', f.profissional)}
      </div>
    </section>

    <section class="print-section" style="margin-bottom:16px;">
      <div class="print-section-title" style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#555;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:10px;">02 · Alergias</div>
      <div class="print-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;">
        ${row('Alergia conhecida (látex, acrilatos…)', f.alergia)}
        ${row('Alergia a colas / patches', f.alergiaCola)}
        ${f.alergiaDesc ? row('Substância / Reação', f.alergiaDesc, true) : ''}
        ${row('Reação prévia a extensões de cílios', f.alergiaCil)}
        ${f.alergiaCilDesc ? row('Sintomas da reação', f.alergiaCilDesc, true) : ''}
      </div>
    </section>

    <section class="print-section" style="margin-bottom:16px;">
      <div class="print-section-title" style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#555;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:10px;">03 · Saúde Ocular</div>
      <div class="print-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;">
        ${row('Doença ocular crónica', f.doencaOcular)}
        ${f.doencaOcularDesc ? row('Qual doença', f.doencaOcularDesc) : ''}
        ${row('Uso de colírio medicamentoso', f.colirio)}
        ${row('Cirurgia ocular anterior', f.cirurgiaOcular)}
        ${f.cirurgiaOcularTempo ? row('Tempo desde a cirurgia', f.cirurgiaOcularTempo) : ''}
        ${row('Fotofobia', f.fotofobia)}
        ${row('Óculos / lentes de contato', f.oculos)}
        ${f.oculos === 'Sim' ? row('Compromete-se a retirar lentes', f.lentesComprom) : ''}
      </div>
    </section>

    <section class="print-section" style="margin-bottom:16px;">
      <div class="print-section-title" style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#555;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:10px;">04–05 · Saúde Geral & Hábitos</div>
      <div class="print-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;">
        ${row('Tratamento dermatológico ativo', f.derm)}
        ${row('Grávida / amamentando', f.gravida)}
        ${row('Maquiagem pesada nos olhos', f.maquiagem)}
        ${row('Esfrega os olhos com frequência', f.esfregar)}
        ${row('Pratica natação / atividades aquáticas', f.natacao)}
      </div>
    </section>

    <section class="print-section" style="margin-bottom:16px;">
      <div class="print-section-title" style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#555;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:10px;">06 · Histórico & Preferências</div>
      <div class="print-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;">
        ${row('Já fez extensão de cílios antes', f.historico)}
        ${f.duracao ? row('Duração anterior', f.duracao) : ''}
        ${row('Pestana desejada', f.pestana)}
      </div>
    </section>

    <section class="print-section" style="margin-bottom:16px;">
      <div class="print-section-title" style="font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#555;border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:10px;">07 · Consentimento</div>
      <div class="print-consent-box" style="background:#f8f8f8;border:1px solid #ddd;border-radius:6px;padding:12px;font-size:12px;color:#444;line-height:1.6;margin-bottom:12px;">
        A cliente declara que todas as informações são verdadeiras, compreende os cuidados pós-procedimento, está ciente dos riscos menores de irritação ocular e concorda com a realização do procedimento.<br>
        <em style="font-size:11px;color:#777;">Dados tratados ao abrigo do Art. 6.º, al. a) e Art. 9.º do RGPD.</em>
      </div>
      <div class="print-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;">
        ${row('Consentimento', f.consent)}
        ${row('Autorização de imagem', f.imgAuth)}
        ${row('Assinatura digital', f.assinatura, true)}
      </div>
    </section>

    <div class="print-sign" style="margin-top:28px;display:flex;justify-content:space-between;gap:30px;padding-top:16px;border-top:1px solid #ddd;">
      <div class="print-sign-field" style="flex:1;padding-top:6px;font-size:11px;color:#555;text-align:center;">
        <div style="border-top:1px solid #1a1a1a;padding-top:6px;margin-bottom:4px;"></div>
        Assinatura da Cliente
      </div>
      <div class="print-sign-field" style="flex:1;padding-top:6px;font-size:11px;color:#555;text-align:center;">
        <div style="border-top:1px solid #1a1a1a;padding-top:6px;margin-bottom:4px;"></div>
        Lash Designer · ${esc(f.profissional) || '___________________'}
      </div>
      <div class="print-sign-field" style="flex:1;padding-top:6px;font-size:11px;color:#555;text-align:center;">
        <div style="border-top:1px solid #1a1a1a;padding-top:6px;margin-bottom:4px;"></div>
        Data: ${fmt(f.dataAtend) || '___________________'}
      </div>
    </div>
  </div>`;
}

/* ── DEFINIÇÕES ──────────────────────────────────────────────────────────── */
function showDefinicoes() { renderUsersList(); showScreen('screen-definicoes'); }
function backFromDefinicoes() { showScreen('screen-select'); }

function renderUsersList() {
  const el = document.getElementById('users-list');
  if (!el) return;
  const users = getAllUsers();
  el.innerHTML = users.map(u => `
    <div class="user-row">
      <div class="user-row-info">
        <span class="user-row-name">👤 ${esc(u.username)}</span>
        <span class="user-row-role ${u.role}">${u.role === 'admin' ? '⭐ Admin' : '👁️ Utilizador'}</span>
      </div>
      <div class="user-row-actions">
        ${u.username !== currentUser() ? `
          <button class="btn-user-reset" onclick="promptResetPassword('${esc(u.username)}')">🔑 Senha</button>
          <button class="btn-user-del" onclick="confirmDeleteUser('${esc(u.username)}')">🗑️</button>
        ` : '<span style="font-size:12px;color:var(--text-muted)">(você)</span>'}
      </div>
    </div>
  `).join('');
}

async function addUser() {
  const user = document.getElementById('new-user-name')?.value.trim();
  const pass = document.getElementById('new-user-pass')?.value;
  const role = document.getElementById('new-user-role')?.value || 'user';
  const err  = document.getElementById('add-user-err');
  err.textContent = '';
  if (!user || !pass) { err.textContent = 'Preencha nome e senha.'; return; }
  if (pass.length < 8) { err.textContent = 'Senha mínima: 8 caracteres.'; return; }
  try {
    await createUser(user, pass, role);
    document.getElementById('new-user-name').value = '';
    document.getElementById('new-user-pass').value = '';
    renderUsersList();
    showToast('✅ Utilizador criado!');
  } catch(e) { err.textContent = e.message; }
}

async function promptResetPassword(username) {
  const newPass = prompt(`Nova senha para "${username}" (mínimo 8 caracteres):`);
  if (!newPass) return;
  if (newPass.length < 8) { alert('Senha muito curta.'); return; }
  await adminResetPassword(username, newPass);
  showToast('✅ Senha alterada!');
}

function confirmDeleteUser(username) {
  if (!confirm(`Eliminar utilizador "${username}"?`)) return;
  deleteUser(username);
  renderUsersList();
  showToast('🗑️ Utilizador eliminado.');
}

async function doChangeOwnPassword() {
  const old  = document.getElementById('chg-old-pass')?.value;
  const nw   = document.getElementById('chg-new-pass')?.value;
  const conf = document.getElementById('chg-conf-pass')?.value;
  const err  = document.getElementById('chg-pass-err');
  err.textContent = '';
  if (!old || !nw) { err.textContent = 'Preencha todos os campos.'; return; }
  if (nw.length < 8) { err.textContent = 'Senha mínima: 8 caracteres.'; return; }
  if (nw !== conf) { err.textContent = 'As senhas não coincidem.'; return; }
  try {
    await changePassword(currentUser(), old, nw);
    document.getElementById('chg-old-pass').value = '';
    document.getElementById('chg-new-pass').value = '';
    document.getElementById('chg-conf-pass').value = '';
    showToast('✅ Senha alterada com sucesso!');
  } catch(e) { err.textContent = e.message; }
}

/* ── BACKUP ──────────────────────────────────────────────────────────────── */
async function exportBackup() {
  const pass = document.getElementById('backup-pass')?.value;
  const conf = document.getElementById('backup-conf')?.value;
  const err  = document.getElementById('backup-err');
  err.textContent = '';
  if (!pass) { err.textContent = 'Defina uma senha para o backup.'; return; }
  if (pass.length < 8) { err.textContent = 'Senha mínima: 8 caracteres.'; return; }
  if (pass !== conf) { err.textContent = 'As senhas não coincidem.'; return; }
  try {
    const fichas = await dbGetAll();
    const payload = { version: 1, exportedAt: new Date().toISOString(), exportedBy: currentUser(), fichas };
    const encrypted = await encryptData(payload, pass);
    const blob = new Blob([JSON.stringify({ ls_backup: true, v: 1, data: encrypted })], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `lash-backup-${new Date().toISOString().slice(0,10)}.brb`;
    a.click();
    URL.revokeObjectURL(url);
    document.getElementById('backup-pass').value = '';
    document.getElementById('backup-conf').value = '';
    showToast('✅ Backup exportado!');
  } catch(e) { err.textContent = 'Erro: ' + e.message; }
}

async function importBackup() {
  const file = document.getElementById('restore-file')?.files[0];
  const pass = document.getElementById('restore-pass')?.value;
  const mode = document.querySelector('input[name="restore-mode"]:checked')?.value || 'merge';
  const err  = document.getElementById('restore-err');
  err.textContent = '';
  if (!file) { err.textContent = 'Selecione um ficheiro de backup.'; return; }
  if (!pass) { err.textContent = 'Introduza a senha do backup.'; return; }
  try {
    const text = await file.text();
    const raw  = JSON.parse(text);
    if (!raw.ls_backup) throw new Error('Ficheiro inválido.');
    const payload = await decryptData(raw.data, pass);
    if (mode === 'replace') {
      const db = await openDB();
      await new Promise((res, rej) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete = res;
        tx.onerror    = e => rej(e.target.error);
      });
    }
    let count = 0;
    for (const f of (payload.fichas || [])) {
      const copy = { ...f }; delete copy.id;
      await dbSave(copy); count++;
    }
    document.getElementById('restore-file').value = '';
    document.getElementById('restore-pass').value = '';
    showToast(`✅ Restaurado: ${count} fichas.`);
    err.style.color = 'green';
    err.textContent = `✅ ${count} fichas importadas com sucesso.`;
  } catch(e) {
    err.style.color = '';
    err.textContent = e.name === 'OperationError' ? '❌ Senha incorreta ou ficheiro corrompido.' : '❌ Erro: ' + e.message;
  }
}

/* ── RGPD ────────────────────────────────────────────────────────────────── */
async function exportRGPD() {
  const fichas = await dbGetAll();
  const studioName = localStorage.getItem('ls_studio_name') || 'Lash Studio';
  const now  = new Date();
  const report = {
    titulo: `Relatório de Dados Pessoais — ${studioName}`,
    geradoEm: now.toISOString(),
    geradoPor: currentUser(),
    totalFichas: fichas.length,
    notaLegal: 'Relatório gerado ao abrigo do Art. 30.º do RGPD. Os dados são tratados para fins de prestação de serviços estéticos com base no consentimento do titular (Art. 6.º, al. a) e Art. 9.º do RGPD).',
    fichas: fichas.map(f => ({
      id: f.id, nome: f.nome, nasc: f.nasc, tel: f.tel,
      dataAtend: f.dataAtend, profissional: f.profissional,
      pestana: f.pestana, consent: f.consent, imgAuth: f.imgAuth,
      dataRegisto: f.dataRegisto
    }))
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `RGPD-lash-${now.toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('✅ Relatório RGPD exportado!');
}
