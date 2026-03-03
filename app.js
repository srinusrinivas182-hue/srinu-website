const $ = (id) => document.getElementById(id);

// ---------- Storage helpers ----------
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ---------- Data ----------
let workOrders = load("cmms_workorders", []);
let assets = load("cmms_assets", []);
let pms = load("cmms_pms", []);
let parts = load("cmms_parts", []);

// ---------- Helpers ----------
function statusTag(s){ return `<span class="tag">${s}</span>`; }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function dueDate(lastISO, freqDays){
  const d = new Date(lastISO);
  d.setDate(d.getDate() + Number(freqDays));
  return d.toISOString().slice(0,10);
}

// ---------- Clock ----------
function refreshClock(){
  const c = $("clock");
  if (c) c.textContent = new Date().toLocaleString();
}
setInterval(refreshClock, 1000);
refreshClock();

// ---------- Navigation ----------
document.querySelectorAll(".nav").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const page = btn.dataset.page;
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    const target = $(page);
    if (target) target.classList.remove("hidden");

    refreshAll();
  });
});

// ============================================================
// EDIT MODAL (GUARANTEED CLOSE)
// ============================================================
let editingId = null;

function openEditModal(wo){
  editingId = wo.id;
  $("editId").textContent = `Editing: ${wo.id}`;
  $("editTitle").value = wo.title || "";
  $("editAsset").value = wo.asset || "";
  $("editPriority").value = wo.priority || "Medium";
  $("editStatus").value = wo.status || "Open";
  $("editDesc").value = wo.desc || "";
  $("editModal").classList.remove("hidden");
}

function closeModal(){
  const m = $("editModal");
  if (m) m.classList.add("hidden");
  editingId = null;
}

// X button
const closeBtn = $("closeModal");
if (closeBtn) {
  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
}

// Click outside closes
const modal = $("editModal");
if (modal) {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

// ESC closes
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ============================================================
// WORK ORDERS
// ============================================================
const addWOBtn = $("addWO");
if (addWOBtn) {
  addWOBtn.addEventListener("click", () => {
    const title = $("woTitle").value.trim();
    if(!title) return alert("Enter a title");

    const wo = {
      id: "WO-" + Math.random().toString(16).slice(2,8).toUpperCase(),
      title,
      asset: $("woAsset").value.trim(),
      priority: $("woPriority").value,
      status: $("woStatus").value,
      desc: $("woDesc").value.trim(),
      createdAt: new Date().toISOString()
    };

    workOrders.push(wo);
    save("cmms_workorders", workOrders);

    $("woTitle").value = "";
    $("woAsset").value = "";
    $("woDesc").value = "";
    $("woPriority").value = "Medium";
    $("woStatus").value = "Open";

    refreshAll();
  });
}

// Filters
if ($("filterStatus")) $("filterStatus").addEventListener("change", renderWOTable);
if ($("searchWO")) $("searchWO").addEventListener("input", renderWOTable);

if ($("clearFilter")) {
  $("clearFilter").addEventListener("click", () => {
    $("filterStatus").value = "All";
    $("searchWO").value = "";
    renderWOTable();
  });
}

// Save edit
if ($("saveEdit")) {
  $("saveEdit").addEventListener("click", () => {
    if(!editingId) return;
    const w = workOrders.find(x => x.id === editingId);
    if(!w) return;

    w.title = $("editTitle").value.trim();
    w.asset = $("editAsset").value.trim();
    w.priority = $("editPriority").value;
    w.status = $("editStatus").value;
    w.desc = $("editDesc").value.trim();

    save("cmms_workorders", workOrders);
    closeModal();
    refreshAll();
  });
}

// Render work order table
function renderWOTable(){
  const tbody = $("woTable");
  if(!tbody) return;

  const status = $("filterStatus") ? $("filterStatus").value : "All";
  const q = $("searchWO") ? $("searchWO").value.trim().toLowerCase() : "";

  let rows = workOrders.slice().reverse();
  if(status !== "All") rows = rows.filter(w => w.status === status);
  if(q) rows = rows.filter(w =>
    (w.title||"").toLowerCase().includes(q) ||
    (w.asset||"").toLowerCase().includes(q)
  );

  tbody.innerHTML = "";
  if(rows.length === 0){
    tbody.innerHTML = `<tr><td colspan="6" class="muted">No work orders found.</td></tr>`;
    return;
  }

  rows.forEach(w => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${w.id}</td>
      <td><b>${w.title}</b><div class="muted small">${w.desc || ""}</div></td>
      <td>${w.asset || "-"}</td>
      <td>${w.priority}</td>
      <td>${statusTag(w.status)}</td>
      <td>
        <button class="btn secondary" data-act="edit" data-id="${w.id}" type="button">Edit</button>
        <button class="btn secondary" data-act="next" data-id="${w.id}" type="button">Next</button>
        <button class="btn secondary" data-act="del" data-id="${w.id}" type="button">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      const id = b.dataset.id;
      const act = b.dataset.act;

      if(act === "del"){
        workOrders = workOrders.filter(x => x.id !== id);
        save("cmms_workorders", workOrders);
        refreshAll();
      }

      if(act === "next"){
        const w = workOrders.find(x => x.id === id);
        if(!w) return;
        w.status = (w.status === "Open") ? "In Progress" : (w.status === "In Progress") ? "Completed" : "Open";
        save("cmms_workorders", workOrders);
        refreshAll();
      }

      if(act === "edit"){
        const w = workOrders.find(x => x.id === id);
        if(!w) return;
        openEditModal(w);
      }
    });
  });
}

// Export CSV
if ($("exportWO")) {
  $("exportWO").addEventListener("click", ()=>{
    if(workOrders.length === 0) return alert("No work orders to export.");

    const headers = ["id","title","asset","priority","status","desc","createdAt"];
    const escapeCSV = (v) => `"${String(v ?? "").replaceAll('"','""')}"`;

    const lines = [
      headers.join(","),
      ...workOrders.map(w => headers.map(h => escapeCSV(w[h])).join(","))
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "workorders.csv";
    a.click();
    URL.revokeObjectURL(url);
  });
}

// ============================================================
// ASSETS
// ============================================================
if ($("addAsset")) {
  $("addAsset").addEventListener("click", () => {
    const name = $("assetName").value.trim();
    if(!name) return alert("Enter asset name");

    assets.push({
      id: "AS-" + Math.random().toString(16).slice(2,8).toUpperCase(),
      name,
      location: $("assetLoc").value.trim(),
      serial: $("assetSerial").value.trim()
    });

    save("cmms_assets", assets);

    $("assetName").value = "";
    $("assetLoc").value = "";
    $("assetSerial").value = "";

    refreshAll();
  });
}

function renderAssets(){
  const box = $("assetList");
  if(!box) return;

  if(assets.length === 0){
    box.className = "muted";
    box.textContent = "No assets yet.";
    return;
  }

  box.className = "";
  box.innerHTML = assets.slice().reverse().map(a => `
    <div style="padding:10px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:10px;background:#fff">
      <b>${a.name}</b>
      <div class="muted small">Location: ${a.location || "-"} • Serial: ${a.serial || "-"}</div>
      <button class="btn secondary" data-del="${a.id}" type="button" style="margin-top:8px;">Delete</button>
    </div>
  `).join("");

  box.querySelectorAll("button").forEach(b => {
    b.addEventListener("click", () => {
      const id = b.dataset.del;
      assets = assets.filter(x => x.id !== id);
      save("cmms_assets", assets);
      refreshAll();
    });
  });
}

// ============================================================
// PM
// ============================================================
if ($("pmLast")) $("pmLast").value = todayISO();

if ($("addPM")) {
  $("addPM").addEventListener("click", ()=>{
    const name = $("pmName").value.trim();
    const last = $("pmLast").value;
    if(!name || !last) return alert("Enter PM name and last done date.");

    pms.push({
      id: "PM-" + Math.random().toString(16).slice(2,8).toUpperCase(),
      name,
      asset: $("pmAsset").value.trim(),
      freqDays: $("pmFreq").value,
      lastDone: last
    });

    save("cmms_pms", pms);

    $("pmName").value = "";
    $("pmAsset").value = "";
    $("pmFreq").value = "30";
    $("pmLast").value = todayISO();

    refreshAll();
  });
}

function renderPM(){
  const box = $("pmList");
  if(!box) return;

  if(pms.length === 0){
    box.className = "muted";
    box.textContent = "No PM schedules yet.";
    return;
  }

  const now = todayISO();

  box.className = "";
  box.innerHTML = pms.slice().reverse().map(p=>{
    const due = dueDate(p.lastDone, p.freqDays);
    const overdue = due < now;
    return `
      <div style="padding:10px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:10px;background:#fff">
        <b>${p.name}</b>
        <span class="tag ${overdue ? "overdue" : "ok"}">${overdue ? "Overdue" : "Scheduled"}</span>
        <div class="muted small">Asset: ${p.asset || "-"} • Every ${p.freqDays} days</div>
        <div class="small">Last Done: ${p.lastDone} • Due: <b>${due}</b></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <button class="btn secondary" data-done="${p.id}" type="button">Mark Done Today</button>
          <button class="btn secondary" data-del="${p.id}" type="button">Delete</button>
        </div>
      </div>
    `;
  }).join("");

  box.querySelectorAll("button").forEach(b=>{
    b.addEventListener("click", ()=>{
      const done = b.dataset.done;
      const del = b.dataset.del;

      if(del){
        pms = pms.filter(x => x.id !== del);
        save("cmms_pms", pms);
        refreshAll();
      }
      if(done){
        const pm = pms.find(x => x.id === done);
        if(!pm) return;
        pm.lastDone = todayISO();
        save("cmms_pms", pms);
        refreshAll();
      }
    });
  });
}

// ============================================================
// INVENTORY
// ============================================================
if ($("addPart")) {
  $("addPart").addEventListener("click", ()=>{
    const name = $("partName").value.trim();
    const qty = $("partQty").value;
    const min = $("partMin").value;
    if(!name || qty === "" || min === "") return alert("Enter part name, quantity, and min level.");

    parts.push({
      id: "PT-" + Math.random().toString(16).slice(2,8).toUpperCase(),
      name,
      qty: Number(qty),
      min: Number(min)
    });

    save("cmms_parts", parts);

    $("partName").value = "";
    $("partQty").value = "";
    $("partMin").value = "";

    refreshAll();
  });
}

function renderParts(){
  const box = $("partList");
  if(!box) return;

  if(parts.length === 0){
    box.className = "muted";
    box.textContent = "No parts yet.";
    return;
  }

  box.className = "";
  box.innerHTML = parts.slice().reverse().map(p=>{
    const low = Number(p.qty) <= Number(p.min);
    return `
      <div style="padding:10px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:10px;background:#fff">
        <b>${p.name}</b>
        <span class="tag ${low ? "low" : "ok"}">${low ? "Low Stock" : "OK"}</span>
        <div class="muted small">Qty: <b>${p.qty}</b> • Min: ${p.min}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <button class="btn secondary" data-minus="${p.id}" type="button">-1</button>
          <button class="btn secondary" data-plus="${p.id}" type="button">+1</button>
          <button class="btn secondary" data-del="${p.id}" type="button">Delete</button>
        </div>
      </div>
    `;
  }).join("");

  box.querySelectorAll("button").forEach(b=>{
    b.addEventListener("click", ()=>{
      const minus = b.dataset.minus;
      const plus = b.dataset.plus;
      const del = b.dataset.del;

      if(del){
        parts = parts.filter(x => x.id !== del);
        save("cmms_parts", parts);
        refreshAll();
      }
      if(minus || plus){
        const id = minus || plus;
        const part = parts.find(x => x.id === id);
        if(!part) return;
        const n = Number(part.qty || 0) + (plus ? 1 : -1);
        part.qty = Math.max(0, n);
        save("cmms_parts", parts);
        refreshAll();
      }
    });
  });
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard(){
  if ($("kpiOpen")) $("kpiOpen").textContent = workOrders.filter(w => w.status === "Open").length;
  if ($("kpiProg")) $("kpiProg").textContent = workOrders.filter(w => w.status === "In Progress").length;
  if ($("kpiDone")) $("kpiDone").textContent = workOrders.filter(w => w.status === "Completed").length;
  if ($("kpiAssets")) $("kpiAssets").textContent = assets.length;

  const recentBox = $("recentList");
  if (recentBox) {
    const recent = workOrders.slice().reverse().slice(0,5);
    recentBox.innerHTML = recent.length
      ? recent.map(w => `
          <div style="padding:10px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:10px;background:#fff">
            <b>${w.title}</b> ${statusTag(w.status)}
            <div class="muted small">Asset: ${w.asset || "-"} • Priority: ${w.priority}</div>
          </div>
        `).join("")
      : `<div class="muted">No work orders yet.</div>`;
  }

  const nextPMBox = $("nextPM");
  if (nextPMBox) {
    const next = pms
      .map(p => ({...p, due: dueDate(p.lastDone, p.freqDays)}))
      .sort((a,b) => a.due.localeCompare(b.due))[0];

    nextPMBox.innerHTML = next
      ? `<div style="padding:10px;border:1px solid #e5e7eb;border-radius:12px;background:#fff">
           <b>${next.name}</b>
           <div class="muted small">Asset: ${next.asset || "-"} • Due: <b>${next.due}</b></div>
         </div>`
      : `<div class="muted">No PM schedules yet.</div>`;
  }
}

// ---------- Refresh all ----------
function refreshAll(){
  renderDashboard();
  renderWOTable();
  renderAssets();
  renderPM();
  renderParts();
}
refreshAll();
