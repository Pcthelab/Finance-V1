"use strict";

const STORAGE_KEY = "finance_v1_transactions";

const el = {
  incomeTotal: document.getElementById("incomeTotal"),
  expenseTotal: document.getElementById("expenseTotal"),
  balanceTotal: document.getElementById("balanceTotal"),

  form: document.getElementById("txForm"),
  btnSubmit: document.getElementById("btnSubmit"),
  btnCancelEdit: document.getElementById("btnCancelEdit"),
  btnReset: document.getElementById("btnReset"),
  desc: document.getElementById("desc"),
  amount: document.getElementById("amount"),
  type: document.getElementById("type"),
  category: document.getElementById("category"),
  date: document.getElementById("date"),
  formMsg: document.getElementById("formMsg"),

  txList: document.getElementById("txList"),
  txCount: document.getElementById("txCount"),

  monthFilter: document.getElementById("monthFilter"),
  typeFilter: document.getElementById("typeFilter"),
  categoryFilter: document.getElementById("categoryFilter"),
  btnClearFilters: document.getElementById("btnClearFilters"),

  btnClear: document.getElementById("btnClear"),
  btnExport: document.getElementById("btnExport"),
  btnImport: document.getElementById("btnImport"),
  fileImport: document.getElementById("fileImport"),
};

let transactions = [];
let editingId = null;


function formatBRL(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function monthISO(dateISO) {
  return dateISO.slice(0, 7);
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function showMsg(msg, kind = "info") {
  el.formMsg.textContent = msg;
  el.formMsg.style.color =
    kind === "error" ? "rgba(180,35,24,.95)" :
    kind === "success" ? "rgba(15,123,92,.95)" :
    "rgba(0,0,0,.70)";
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDateBR(dateISO) {
  const [y, m, d] = dateISO.split("-");
  return `${d}/${m}/${y}`;
}


function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    transactions = Array.isArray(parsed) ? parsed : [];
  } catch {
    transactions = [];
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}


function getFilters() {
  return {
    month: el.monthFilter.value || "",
    type: el.typeFilter.value || "all",
    category: el.categoryFilter.value || "all",
  };
}

function applyFilters(list) {
  const f = getFilters();
  return list.filter((tx) => {
    if (f.month && monthISO(tx.date) !== f.month) return false;
    if (f.type !== "all" && tx.type !== f.type) return false;
    if (f.category !== "all" && tx.category !== f.category) return false;
    return true;
  });
}

function rebuildCategoryFilterOptions() {
  const current = el.categoryFilter.value || "all";
  const cats = new Set(transactions.map((t) => t.category));
  const options = ["all", ...Array.from(cats).sort((a, b) => a.localeCompare(b, "pt-BR"))];

  el.categoryFilter.innerHTML = "";
  for (const opt of options) {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt === "all" ? "Todas" : opt;
    el.categoryFilter.appendChild(o);
  }

  el.categoryFilter.value = options.includes(current) ? current : "all";
}


function computeTotals(list) {
  let income = 0;
  let expense = 0;

  for (const tx of list) {
    if (tx.type === "income") income += tx.amount;
    else expense += tx.amount;
  }

  return { income, expense, balance: income - expense };
}

function renderTotals() {
  const filtered = applyFilters(transactions);
  const { income, expense, balance } = computeTotals(filtered);

  el.incomeTotal.textContent = formatBRL(income);
  el.expenseTotal.textContent = formatBRL(expense);

  el.balanceTotal.textContent = formatBRL(balance);
  el.balanceTotal.classList.remove("chip__value--pos", "chip__value--neg");
  if (balance > 0) el.balanceTotal.classList.add("chip__value--pos");
  if (balance < 0) el.balanceTotal.classList.add("chip__value--neg");
}


function enterEditMode(id) {
  const tx = transactions.find((t) => t.id === id);
  if (!tx) return;

  editingId = id;

  el.desc.value = tx.desc;
  el.amount.value = String(tx.amount);
  el.type.value = tx.type;
  el.category.value = tx.category;
  el.date.value = tx.date;

  el.btnSubmit.textContent = "Salvar";
  el.btnCancelEdit.hidden = false;
  showMsg("Editando… faça as mudanças e clique em Salvar.", "info");

  
  el.desc.focus();
}

function exitEditMode(clearForm = false) {
  editingId = null;
  el.btnSubmit.textContent = "Adicionar";
  el.btnCancelEdit.hidden = true;
  showMsg("");

  if (clearForm) {
    el.form.reset();
    el.date.value = todayISO();
  }
}


function isValidISODate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function normalizeTx(input) {
 
  const desc = String(input.desc ?? input.description ?? "").trim();
  const type = String(input.type ?? "").trim();
  const category = String(input.category ?? "Outros").trim();
  const date = String(input.date ?? "").trim();
  const amount = Number(input.amount);

  if (!desc) return null;
  if (!(type === "income" || type === "expense")) return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!isValidISODate(date)) return null;

  return {
    id: String(input.id ?? uid()),
    desc,
    amount,
    type,
    category: category || "Outros",
    date,
    createdAt: Number.isFinite(Number(input.createdAt)) ? Number(input.createdAt) : Date.now(),
  };
}


function rowItem(tx) {
  const row = document.createElement("div");
  row.className = "rowItem";
  row.setAttribute("role", "listitem");

  const badgeText = tx.type === "income" ? "Receita" : "Despesa";
  const badgeClass = tx.type === "income" ? "badge--income" : "badge--expense";

  const sign = tx.type === "income" ? "+" : "-";
  const amountClass = tx.type === "income" ? "amount--pos" : "amount--neg";

  row.innerHTML = `
    <div>
      ${formatDateBR(tx.date)}
      <span class="badge ${badgeClass}">${badgeText}</span>
    </div>
    <div>${escapeHTML(tx.desc)}</div>
    <div>${escapeHTML(tx.category)}</div>
    <div class="right amount ${amountClass}">${sign} ${formatBRL(tx.amount)}</div>
    <div class="actionsCell">
      <button class="iconBtn iconBtn--edit" type="button" title="Editar" aria-label="Editar">✎</button>
      <button class="iconBtn iconBtn--del" type="button" title="Remover" aria-label="Remover">✕</button>
    </div>
  `;

  const [btnEdit, btnDel] = row.querySelectorAll("button");
  btnEdit.addEventListener("click", () => enterEditMode(tx.id));
  btnDel.addEventListener("click", () => removeTx(tx.id));

  return row;
}

function renderList() {
  const filtered = applyFilters(transactions);

  el.txList.innerHTML = "";
  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.style.padding = "12px";
    empty.className = "hint";
    empty.textContent = "Sem lançamentos ainda. Comece adicionando sua primeira receita ou despesa.";
    el.txList.appendChild(empty);
  } else {
    const ordered = [...filtered].sort((a, b) => {
      if (a.date === b.date) return b.createdAt - a.createdAt;
      return b.date.localeCompare(a.date);
    });

    for (const tx of ordered) el.txList.appendChild(rowItem(tx));
  }

  el.txCount.textContent = `${filtered.length} transaç${filtered.length === 1 ? "ão" : "ões"}`;
}


function addTx({ desc, amount, type, category, date }) {
  const tx = {
    id: uid(),
    desc: desc.trim(),
    amount: Number(amount),
    type,
    category,
    date,
    createdAt: Date.now(),
  };

  transactions.push(tx);
  save();
  rebuildCategoryFilterOptions();
  render();
}

function updateTx(id, patch) {
  const idx = transactions.findIndex((t) => t.id === id);
  if (idx === -1) return false;

  transactions[idx] = { ...transactions[idx], ...patch };
  save();
  rebuildCategoryFilterOptions();
  render();
  return true;
}

function removeTx(id) {
  const idx = transactions.findIndex((t) => t.id === id);
  if (idx === -1) return;

 
  if (editingId === id) exitEditMode(true);

  transactions.splice(idx, 1);
  save();
  rebuildCategoryFilterOptions();
  render();
}


function handleSubmit(e) {
  e.preventDefault();
  showMsg("");

  const desc = el.desc.value.trim();
  const amount = Number(el.amount.value);
  const type = el.type.value;
  const category = el.category.value;
  const date = el.date.value;

  if (!desc) return showMsg("Coloca uma descrição.", "error");
  if (!Number.isFinite(amount) || amount <= 0) return showMsg("Valor inválido.", "error");
  if (!date) return showMsg("Escolhe uma data.", "error");

  if (editingId) {
    const ok = updateTx(editingId, { desc, amount, type, category, date });
    if (!ok) return showMsg("Não encontrei essa transação pra editar.", "error");

    showMsg("Salvo ✅", "success");
    exitEditMode(true);
    return;
  }

  addTx({ desc, amount, type, category, date });

  el.form.reset();
  el.date.value = todayISO();
  el.type.value = type;
  showMsg("Anotado ✅", "success");
  setTimeout(() => showMsg(""), 900);
}

function resetForm() {
  el.form.reset();
  el.date.value = todayISO();
  showMsg("");
}

function cancelEdit() {
  exitEditMode(false);
  showMsg("Edição cancelada.", "info");
  setTimeout(() => showMsg(""), 900);
}

function clearAll() {
  const ok = confirm("Vai apagar tudo. Tem certeza?");
  if (!ok) return;

  exitEditMode(true);
  transactions = [];
  save();
  rebuildCategoryFilterOptions();
  render();
}

function clearFilters() {
  el.monthFilter.value = "";
  el.typeFilter.value = "all";
  el.categoryFilter.value = "all";
  render();
}


function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function exportJSON() {
  const payload = {
    meta: { app: "Finance V1", exportedAt: new Date().toISOString() },
    transactions,
  };

  const pretty = JSON.stringify(payload, null, 2);

  
  downloadText("finance-v1-backup.json", pretty);


  downloadText("finance-v1-backup.txt", pretty);
}


function askImportMode() {
  
  const merge = confirm("Importar como?\n\nOK = Mesclar com o que já existe\nCancelar = Substituir tudo");
  if (merge) return "merge";

  const sure = confirm("Substituir TUDO mesmo? Isso apaga seus dados atuais.");
  return sure ? "replace" : null;
}

function mergeById(existing, incoming) {
  const map = new Map(existing.map((t) => [t.id, t]));
  for (const tx of incoming) map.set(tx.id, tx);
  return Array.from(map.values());
}

function handleImportFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const raw = String(reader.result || "");
      const parsed = JSON.parse(raw);

      
      const arr = Array.isArray(parsed) ? parsed : parsed?.transactions;
      if (!Array.isArray(arr)) throw new Error("Formato inválido.");

      const normalized = arr.map(normalizeTx).filter(Boolean);

      if (normalized.length === 0) {
        showMsg("Arquivo lido, mas nenhuma transação válida foi encontrada.", "error");
        return;
      }

      const mode = askImportMode();
      if (!mode) {
        showMsg("Importação cancelada.", "info");
        setTimeout(() => showMsg(""), 900);
        return;
      }

      exitEditMode(true);

      if (mode === "replace") {
        transactions = normalized;
      } else {
        transactions = mergeById(transactions, normalized);
      }

      save();
      rebuildCategoryFilterOptions();
      render();

      showMsg(`Importado ✅ (${normalized.length} registro(s) lido(s))`, "success");
      setTimeout(() => showMsg(""), 1200);
    } catch (err) {
      showMsg("Não consegui importar. Confere se o JSON é válido.", "error");
    }
  };

  reader.readAsText(file);
}

function openImport() {
  el.fileImport.value = ""; 
  el.fileImport.click();
}


function render() {
  renderTotals();
  renderList();
}

function init() {
  load();
  el.date.value = todayISO();

  rebuildCategoryFilterOptions();
  render();

  el.form.addEventListener("submit", handleSubmit);
  el.btnReset.addEventListener("click", resetForm);
  el.btnCancelEdit.addEventListener("click", cancelEdit);

  el.btnClear.addEventListener("click", clearAll);
  el.btnClearFilters.addEventListener("click", clearFilters);

  el.btnExport.addEventListener("click", exportJSON);

  el.btnImport.addEventListener("click", openImport);
  el.fileImport.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) handleImportFile(file);
  });

  el.monthFilter.addEventListener("change", render);
  el.typeFilter.addEventListener("change", render);
  el.categoryFilter.addEventListener("change", render);
}

init();
