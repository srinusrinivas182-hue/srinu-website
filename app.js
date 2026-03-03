const $ = id => document.getElementById(id);

let workOrders = JSON.parse(localStorage.getItem("workOrders")) || [];
let editingId = null;

// CLOCK
setInterval(() => {
  $("clock").textContent = new Date().toLocaleString();
}, 1000);

// NAVIGATION
document.querySelectorAll(".nav").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".nav").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
    $(btn.dataset.page).classList.remove("hidden");
  });
});

// ADD WORK ORDER
$("addWO").addEventListener("click",()=>{
  const wo = {
    id:"WO-"+Math.random().toString(16).slice(2,6),
    title:$("woTitle").value,
    asset:$("woAsset").value,
    priority:$("woPriority").value,
    status:$("woStatus").value,
    desc:$("woDesc").value
  };

  workOrders.push(wo);
  localStorage.setItem("workOrders",JSON.stringify(workOrders));
  render();
});

// RENDER TABLE
function render(){
  const tbody = $("woTable");
  tbody.innerHTML="";

  workOrders.forEach(w=>{
    const tr = document.createElement("tr");
    tr.innerHTML=`
      <td>${w.id}</td>
      <td>${w.title}</td>
      <td>${w.status}</td>
      <td>
        <button onclick="editWO('${w.id}')">Edit</button>
        <button onclick="deleteWO('${w.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  $("kpiOpen").textContent = workOrders.filter(w=>w.status==="Open").length;
  $("kpiProg").textContent = workOrders.filter(w=>w.status==="In Progress").length;
  $("kpiDone").textContent = workOrders.filter(w=>w.status==="Completed").length;
}

function deleteWO(id){
  workOrders = workOrders.filter(w=>w.id!==id);
  localStorage.setItem("workOrders",JSON.stringify(workOrders));
  render();
}

function editWO(id){
  const w = workOrders.find(x=>x.id===id);
  editingId=id;

  $("editTitle").value=w.title;
  $("editAsset").value=w.asset;
  $("editPriority").value=w.priority;
  $("editStatus").value=w.status;
  $("editDesc").value=w.desc;

  $("editModal").classList.remove("hidden");
}

// CLOSE MODAL
$("closeModal").addEventListener("click",()=>{
  $("editModal").classList.add("hidden");
});

document.addEventListener("keydown",(e)=>{
  if(e.key==="Escape"){
    $("editModal").classList.add("hidden");
  }
});

$("editModal").addEventListener("click",(e)=>{
  if(e.target.id==="editModal"){
    $("editModal").classList.add("hidden");
  }
});

// SAVE EDIT
$("saveEdit").addEventListener("click",()=>{
  const w = workOrders.find(x=>x.id===editingId);

  w.title=$("editTitle").value;
  w.asset=$("editAsset").value;
  w.priority=$("editPriority").value;
  w.status=$("editStatus").value;
  w.desc=$("editDesc").value;

  localStorage.setItem("workOrders",JSON.stringify(workOrders));
  $("editModal").classList.add("hidden");
  render();
});

render();
