import{u as l}from"./pagos-CfuwYeG-.js";function t(){const i=l(),d=i.filter(e=>e.sev==="high").length,s=i.filter(e=>e.sev==="medium").length;document.getElementById("aleCards").innerHTML=`
    <div class="card"><div class="label">Alertas totales</div><div class="value">${i.length}</div></div>
    <div class="card"><div class="label">Urgentes</div><div class="value ${d?"neg":""}">${d}</div></div>
    <div class="card"><div class="label">A revisar</div><div class="value">${s}</div></div>
  `,document.getElementById("aleBody").innerHTML=i.length?i.map(e=>`<div class="alert-item sev-${e.sev}" role="listitem"><div class="ai-icon" aria-hidden="true">${e.icon}</div><div><div class="ai-title">${e.title}</div><div class="ai-detail">${e.detail}</div></div></div>`).join(""):'<div class="empty">Sin alertas activas este mes. Todo en orden.</div>'}export{t as render};
