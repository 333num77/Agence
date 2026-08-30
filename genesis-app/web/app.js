/* Genesis UI logic: SSE live feed, jobs, profile harness, prompt editor, STT mic */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const STAGES = ["intake", "research", "analysis", "critique", "verdict"];
let currentJob = null;
let es = null;

/* ?? boot ?? */
init();
async function init() {
  if (location.protocol === "file:") { showOffline(); return; }
  await loadMode();
  await loadHistory();
  wireEvents();
}

function showOffline() {
  document.getElementById("offline-banner").classList.remove("hidden");
  document.getElementById("run-btn").disabled = true;
  document.getElementById("mic-btn").disabled = true;
}

async function api(path, opts) {
  const r = await fetch("/api" + path, opts);
  if (!r.ok) {
    let msg = r.statusText;
    try { msg = (await r.json()).detail || msg; } catch {}
    throw new Error(msg);
  }
  return r.json();
}

async function loadMode() {
  try {
    const h = await api("/health");
    $("mode-badge").textContent = h.mode.toUpperCase() + " MODE";
    $("mode-badge").classList.toggle("live", h.mode === "live");
    const ok = Object.values(h).every(v => typeof v !== "object" || v.ok);
    $("health-dot").classList.toggle("ok", ok);
    $("health-dot").title = ok ? "All systems ok" : "Degraded - check /api/health";
    if (h.stt && h.stt.enabled === false) { $("mic-btn").style.display = "none"; }
    else { $("mic-btn").title = `Speak your idea (${(h.stt && h.stt.provider) || "STT"})`; }
  } catch { /* server unreachable - show offline banner */
    showOffline();
  }
}

/* ?? run validation ?? */
async function runValidation() {
  const idea = $("idea").value.trim();
  const hint = $("input-hint");
  hint.classList.add("hidden");
  if (idea.length < 12) {
    hint.textContent = "Idea thora detail mein likho (12+ characters).";
    hint.classList.remove("hidden");
    return;
  }
  $("run-btn").disabled = true;
  try {
    const { job_id } = await api("/validate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea }),
    });
    openJob(job_id);
  } catch (e) { toast(e.message); $("run-btn").disabled = false; }
}

function openJob(jobId) {
  currentJob = jobId;
  $("run-btn").disabled = false;
  $("empty-state").classList.add("hidden");
  $("feed-card").classList.remove("hidden");
  $("result").classList.add("hidden");
  $("result").innerHTML = "";
  $("feed").innerHTML = "";
  setStage(null);
  if (es) es.close();
  es = new EventSource("/api/stream/" + jobId);
  es.onmessage = (ev) => { try { addEvent(JSON.parse(ev.data)); } catch {} };
  es.addEventListener("done", async (ev) => {
    es.close(); es = null;
    const { status } = JSON.parse(ev.data);
    if (status === "completed") await showResult(jobId);
    else showFailed(jobId);
    loadHistory();
    $("run-btn").disabled = false;
  });
}

function setStage(stage) {
  const idx = stage ? STAGES.indexOf(stage) : -1;
  document.querySelectorAll(".stage").forEach((el, i) => {
    el.classList.toggle("active", i === idx);
    el.classList.toggle("done", idx === -1 ? false : i < idx);
  });
}

function addEvent(evt) {
  setStage(evt.stage);
  const feed = $("feed");
  const div = document.createElement("div");
  div.className = "evt " + (evt.level || "info");
  const t = (evt.ts || "").slice(11, 19);
  div.innerHTML = `<span class="ts">${esc(t)}</span><span class="agent">${esc(evt.agent)}</span><span class="msg">${esc(evt.message)}</span>`;
  feed.appendChild(div);
  feed.scrollTop = feed.scrollHeight;
}

/* ?? result rendering ?? */
async function showResult(jobId) {
  const r = await api("/result/" + jobId);
  const box = $("result");
  box.classList.remove("hidden");
  const bd = r.breakdown || {};
  box.innerHTML = `
    <div class="result-banner ${r.verdict}">
      <div><div class="muted small">VERDICT</div><div class="verdict-word">${r.verdict}</div></div>
      <div class="score">${r.score}<small>/100</small></div>
    </div>
    <div class="breakdown">
      ${Object.entries(bd).map(([k, v]) => `<div class="bk">${k.replace("_", " ")}: <b>${v}</b></div>`).join("")}
      <div class="bk">evidence items: <b>${(r.evidence_used || {}).count ?? 0}</b></div>
    </div>
    ${r.audience ? `<div class="sect"><h3>Audience</h3><div>${esc(r.audience)}</div></div>` : ""}
    ${r.monetization ? `<div class="sect"><h3>Monetization</h3><div>${esc(r.monetization)}</div></div>` : ""}
    ${(r.strengths || []).length ? `<div class="sect"><h3>Strengths</h3><ul>${r.strengths.map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>` : ""}
    ${(r.competition_players || []).length ? `<div class="sect"><h3>Competition</h3><ul>${r.competition_players.map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>` : ""}
    ${(r.risks || []).length ? `<div class="sect"><h3>Risks</h3><ul>${r.risks.map(x => `<li><b>[${esc(x.severity)}]</b> ${esc(x.risk)}</li>`).join("")}</ul></div>` : ""}
    ${(r.fatal_issues || []).length ? `<div class="sect"><h3>Fatal issues</h3><ul>${r.fatal_issues.map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>` : ""}
    ${r.rejection_reason ? `<div class="sect"><h3>Why rejected</h3><div>${esc(r.rejection_reason)}</div></div>` : ""}
    ${(r.change_suggestions || []).length ? `<div class="sect"><h3>Change suggestions</h3><ul>${r.change_suggestions.map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>` : ""}
    <div class="sect"><h3>Next steps</h3><ul>${(r.next_steps || []).map(s => `<li>${esc(s)}</li>`).join("")}</ul></div>
  `;
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function showFailed(jobId) {
  try {
    const job = await api("/jobs/" + jobId);
    $("feed-card").classList.remove("hidden");
    const div = document.createElement("div");
    div.className = "evt error";
    div.innerHTML = `<span class="agent">system</span><span class="msg">Job failed: ${esc(job.error || "unknown")} - <button class="btn ghost" onclick="resumeJob('${jobId}')">Resume from checkpoint</button></span>`;
    $("feed").appendChild(div);
  } catch (e) { toast(e.message); }
}

async function resumeJob(jobId) { try { await api(`/jobs/${jobId}/resume`, { method: "POST" }); openJob(jobId); } catch (e) { toast(e.message); } }

/* ?? history ?? */
async function loadHistory() {
  try {
    const jobs = await api("/jobs");
    const ul = $("history");
    ul.innerHTML = jobs.length ? "" : '<li class="muted">No runs yet</li>';
    jobs.forEach(j => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="idea" title="${esc(j.idea)}">${esc(j.idea.slice(0, 60))}</span><span class="tag ${j.status}">${j.status}</span>`;
      li.onclick = () => {
        if (j.status === "completed") { openJobView(j.id); }
        else if (j.status === "failed") { openJob(j.id); }
        else openJob(j.id);
      };
      ul.appendChild(li);
    });
  } catch {}
}

async function openJobView(jobId) {
  $("empty-state").classList.add("hidden");
  $("feed-card").classList.remove("hidden");
  $("result").classList.remove("hidden");
  $("feed").innerHTML = "";
  try {
    const job = await api("/jobs/" + jobId);
    (JSON.parse(job.events || "[]")).forEach(addEvent);
    await showResult(jobId);
  } catch (e) { toast(e.message); }
}

/* ?? profile harness ?? */
let profileOpen = false;
async function openProfile() {
  const p = await api("/profile");
  const form = $("profile-form");
  form.innerHTML = "";
  Object.entries(p).forEach(([k, v]) => {
    const val = Array.isArray(v) ? v.join(", ") : v;
    form.insertAdjacentHTML("beforeend",
      `<label>${esc(k)}</label><input data-key="${esc(k)}" value="${esc(val)}">`);
  });
  profileOpen = true;
  $("profile-drawer").classList.remove("hidden");
}

/* ?? prompt editor ?? */
let prompts = {}, activePrompt = null;
async function openPrompts() {
  prompts = await api("/prompts");
  const tabs = $("prompt-tabs");
  tabs.innerHTML = "";
  Object.keys(prompts).forEach(name => {
    const b = document.createElement("button");
    b.textContent = name;
    b.onclick = () => selectPrompt(name, b);
    tabs.appendChild(b);
  });
  if (Object.keys(prompts).length) selectPrompt(Object.keys(prompts)[0], tabs.firstChild);
  $("prompts-drawer").classList.remove("hidden");
}
function selectPrompt(name, btn) {
  activePrompt = name;
  $("prompt-editor").value = prompts[name];
  document.querySelectorAll("#prompt-tabs button").forEach(b => b.classList.toggle("on", b === btn));
}

/* ?? STT mic ?? */
let mediaRecorder = null, chunks = [];
async function toggleMic() {
  const btn = $("mic-btn");
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      btn.textContent = "MIC"; btn.classList.remove("rec");
      btn.disabled = true; btn.textContent = ".";
      try {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const fd = new FormData();
        fd.append("file", blob, "idea.webm");
        const r = await fetch("/api/stt", { method: "POST", body: fd });
        if (!r.ok) throw new Error((await r.json()).detail || "STT failed");
        const { text } = await r.json();
        $("idea").value = ($("idea").value ? $("idea").value + " " : "") + text;
        toast("Transcribed - review kar ke run karo");
      } catch (e) { toast(e.message); }
      btn.disabled = false; btn.textContent = "MIC";
    };
    mediaRecorder.start();
    btn.textContent = "STOP"; btn.classList.add("rec");
  } catch (e) { toast("Mic access failed: " + e.message); }
}

/* ?? utils ?? */
let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 4000);
}

function wireEvents() {
  $("run-btn").onclick = runValidation;
  $("mic-btn").onclick = toggleMic;
  $("profile-btn").onclick = openProfile;
  $("prompts-btn").onclick = openPrompts;
  $("save-profile").onclick = async () => {
    const profile = {};
    document.querySelectorAll("#profile-form input").forEach(inp => profile[inp.dataset.key] = inp.value);
    try { await api("/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile }) }); toast("Profile saved"); $("profile-drawer").classList.add("hidden"); }
    catch (e) { toast(e.message); }
  };
  $("save-prompt").onclick = async () => {
    try {
      await api(`/prompts/${activePrompt}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: $("prompt-editor").value }) });
      prompts[activePrompt] = $("prompt-editor").value;
      toast("Prompt saved - next run applies it");
    } catch (e) { toast(e.message); }
  };
  document.querySelectorAll(".drawer .close").forEach(b => b.onclick = (e) => e.target.closest(".drawer").classList.add("hidden"));
}
window.resumeJob = resumeJob;
