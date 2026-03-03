const $ = (id) => document.getElementById(id);

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

let workOrders = load("cmms_workorders", []);
let assets = load("cmms_assets", []);

function statusTag(s){
  return `<span class="tag">${s}</span>`;
}

function refreshClock(){
  $("clock").textContent = new Date().toLocaleString();
}
setInterval(refreshClock, 1000);
refreshClock();

// Navigation
document.querySelectorAll(".nav").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const page = btn.dataset.page;
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    $(page).classList.remove("hidden");

    refreshAll();
  });
});

// Work orders
$("addWO").addEventListener("click", () => {
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

$("filterStatus").addEventListener("change", renderWOTable);
$("searchWO").addEventListener("input", renderWOTable);
$("clearFilter").addEventListener("click", () => {
  $("filterStatus").value = "All";
  $("searchWO").value = "";
  renderWOTable();
});

function renderWOTable(){
  const status = $("filterStatus").value;
  const q = $("searchWO").value.trim().toLowerCase();

  let rows = workOrders.slice().reverse();
  if(status !== "All") rows = rows.filter(w => w.status === status);
  if(q) rows = rows.filter(w =>
    (w.title||"").toLowerCase().includes(q) || (w.asset||"").toLowerCase().includes(q)
  );

  const tbody = $("woTable");
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
        <button class="btn secondary" data-act="next" data-id="${w.id}">Next</button>
        <button class="btn secondary" data-act="del" data-id="${w.id}">Delete</button>
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
    });
  });
}

// Assets
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

function renderAssets(){
  const box = $("assetList");
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
      <button class="btn secondary" data-del="${a.id}" style="margin-top:8px;">Delete</button>
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

// Dashboard
function renderDashboard(){
  const open = workOrders.filter(w => w.status === "Open").length;
  const prog = workOrders.filter(w => w.status === "In Progress").length;
  const done = workOrders.filter(w => w.status === "Completed").length;

  $("kpiOpen").textContent = open;
  $("kpiProg").textContent = prog;
  $("kpiDone").textContent = done;
  $("kpiAssets").textContent = assets.length;

  const recent = workOrders.slice().reverse().slice(0,5);
  $("recentList").innerHTML = recent.length
    ? recent.map(w => `
        <div style="padding:10px;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:10px;background:#fff">
          <b>${w.title}</b> ${statusTag(w.status)}
          <div class="muted small">Asset: ${w.asset || "-"} • Priority: ${w.priority}</div>
        </div>
      `).join("")
    : `<div class="muted">No work orders yet.</div>`;
}

function refreshAll(){
  renderDashboard();
  renderWOTable();
  renderAssets();
}
refreshAll();