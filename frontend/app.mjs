import { empty, read, changeProgress } from "./state.mjs";

const $ = id => document.getElementById(id);
const storageKey = "progress-desk.v1";
const presets = ["制定计划", "资料搜集", "阅读整理", "梳理提纲", "撰写初稿", "修改完善", "复习巩固", "提交检查"];
let state = empty;
let storageReadable = true;
let editingId = null;
let drafts = [];
let lastAdvance = -Infinity;

function showError(id, message) {
  $(id).textContent = message;
  $(id).hidden = !message;
}

try {
  state = read(localStorage.getItem(storageKey));
} catch {
  storageReadable = false;
  showError("storage-error", "无法读取本地任务。已有数据已保留，请关闭软件后重试。");
}

const current = () => state.tasks.find(task => task.id === state.selected);

function save(next) {
  if (!storageReadable) return false;
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
  } catch {
    showError("storage-error", "保存失败，请检查磁盘空间或重开软件后重试。");
    return false;
  }
  state = next;
  showError("storage-error", "");
  render();
  return true;
}

function replaceTask(task) {
  return save({
    ...state,
    selected: task.id,
    tasks: state.tasks.some(item => item.id === task.id)
      ? state.tasks.map(item => item.id === task.id ? task : item)
      : [...state.tasks, task]
  });
}

function render() {
  const colors = ["blue", "red", "yellow"];
  const color = colors.includes(state.color) ? state.color : "blue";
  document.body.dataset.progressColor = color;
  $("progress-color").value = color;
  $("progress-color").disabled = !storageReadable;
  const task = current();
  $("new").disabled = !storageReadable;
  $("empty").hidden = !!task || !storageReadable;
  $("task").hidden = !task;
  if (!task) return;
  $("tasks").replaceChildren(...state.tasks.map(item => new Option(item.name, item.id)));
  $("tasks").value = task.id;
  $("title").textContent = task.name;
  const { done, steps } = task;
  const percent = Math.round(done / steps.length * 100);
  $("count").textContent = `已完成 ${done} / ${steps.length} 节`;
  $("percent").textContent = percent + "%";
  $("fill").style.width = `${done / steps.length * 100}%`;
  $("track").setAttribute("aria-valuemax", steps.length);
  $("track").setAttribute("aria-valuenow", done);
  $("track").setAttribute("aria-valuetext", $("count").textContent);
  $("steps").style.setProperty("--size", steps.length);
  $("steps").replaceChildren(...steps.map((keyword, index) => {
    const item = document.createElement("li");
    const marker = document.createElement("span");
    marker.className = "node";
    marker.textContent = index < done ? "✓" : index + 1;
    marker.setAttribute("aria-label", `第 ${index + 1} 节${index < done ? "，已完成" : ""}`);
    const label = document.createElement("span");
    label.textContent = keyword;
    label.title = keyword;
    item.append(marker, label);
    if (index < done) item.className = "done";
    if (index === done) {
      item.className = "current";
      item.setAttribute("aria-current", "step");
    }
    return item;
  }));
  $("status").textContent = done === steps.length ? "任务已全部完成。" : `当前第 ${done + 1} 节 · ${steps[done]}`;
  $("status").title = $("status").textContent;
  $("complete").disabled = done === steps.length;
  $("undo").disabled = !task.undo;
  $("reset").disabled = !done;
}

function renderKeywords() {
  $("keywords").replaceChildren();
  for (let index = 0; index < Number($("size").value); index++) {
    const label = document.createElement("label");
    label.htmlFor = "step-" + index;
    label.textContent = `第 ${index + 1} 节关键词`;
    const row = document.createElement("div");
    row.className = "keyword-row";
    const input = document.createElement("input");
    input.id = label.htmlFor;
    input.maxLength = 40;
    input.required = true;
    input.placeholder = "输入关键词";
    input.value = drafts[index] ?? "";
    input.addEventListener("input", () => { drafts[index] = input.value; });
    const select = document.createElement("select");
    select.setAttribute("aria-label", `第 ${index + 1} 节预设关键词`);
    select.append(new Option("选择预设", ""), ...presets.map(word => new Option(word, word)));
    select.addEventListener("change", () => {
      if (select.value) input.value = drafts[index] = select.value;
      select.value = "";
    });
    row.append(input, select);
    $("keywords").append(label, row);
  }
}

function openEditor(task) {
  editingId = task?.id ?? null;
  drafts = task ? [...task.steps] : [];
  $("editor-title").textContent = task ? "编辑任务" : "新建任务";
  $("task-name").value = task?.name ?? "";
  $("size").value = task?.steps.length ?? 3;
  $("size-row").hidden = !!task;
  $("size").disabled = !!task;
  showError("form-error", "");
  renderKeywords();
  $("editor").showModal();
  $("task-name").focus();
}

async function setExpanded(expanded) {
  const button = $("mode");
  button.disabled = true;
  try {
    await window.__TAURI__?.core.invoke("set_expanded", { expanded });
    document.body.classList.toggle("compact", !expanded);
    button.setAttribute("aria-expanded", String(expanded));
    button.textContent = expanded ? "收起小窗" : "展开管理";
    showError("window-error", "");
    return true;
  } catch {
    showError("window-error", "窗口大小调整失败，请重试。");
    return false;
  } finally {
    button.disabled = false;
  }
}

$("progress-color").onchange = () => {
  if (!save({ ...state, color: $("progress-color").value })) render();
};

$("mode").onclick = () => setExpanded(document.body.classList.contains("compact"));
$("new").onclick = async () => {
  if (!document.body.classList.contains("compact") || await setExpanded(true)) openEditor();
};
$("edit").onclick = () => openEditor(current());
$("size").onchange = renderKeywords;
$("tasks").onchange = () => save({ ...state, selected: $("tasks").value }) || render();
document.querySelectorAll("[data-close]").forEach(button => {
  button.onclick = () => $(button.dataset.close).close();
});

$("task-form").onsubmit = event => {
  event.preventDefault();
  const name = $("task-name").value.trim();
  const steps = [...$("keywords").querySelectorAll("input")].map(input => input.value.trim());
  if (!name || steps.some(word => !word)) {
    showError("form-error", "请填写任务名称和每一节的关键词，空格不算内容。");
    return;
  }
  const task = state.tasks.find(item => item.id === editingId);
  if (replaceTask({ ...(task ?? { id: crypto.randomUUID(), done: 0, undo: false }), name, steps })) {
    $("editor").close();
  } else {
    showError("form-error", "保存失败，请检查磁盘空间后重试。");
  }
};

function updateProgress(action) {
  const task = current();
  if (!task) return false;
  const updated = changeProgress(task, action);
  return updated !== task && replaceTask(updated);
}

$("complete").onclick = () => {
  if (performance.now() - lastAdvance < 500) return;
  if (updateProgress("complete")) lastAdvance = performance.now();
};
$("complete").addEventListener("keydown", event => {
  if (event.repeat && ["Enter", " "].includes(event.key)) event.preventDefault();
});
$("undo").onclick = () => updateProgress("undo");
$("reset").onclick = () => $("confirm").showModal();
$("confirm-reset").onclick = () => {
  if (updateProgress("reset")) $("confirm").close();
  else {
    $("confirm").close();
    $("storage-error").focus();
  }
};

render();



