export const empty = { tasks: [], selected: null };
export function read(raw) {
  if (raw === null) return empty;
  const state = JSON.parse(raw);
  if (!Array.isArray(state.tasks)) throw new Error("任务列表无效");
  const ids = new Set();
  for (const task of state.tasks) {
    if (typeof task.id !== "string" || ids.has(task.id) ||
        typeof task.name !== "string" || !task.name.trim() ||
        !Array.isArray(task.steps) || ![3, 4, 5].includes(task.steps.length) ||
        !task.steps.every(step => typeof step === "string" && step.trim()) ||
        !Number.isInteger(task.done) || task.done < 0 || task.done > task.steps.length ||
        typeof task.undo !== "boolean" || (task.undo && !task.done)) {
      throw new Error("任务数据无效");
    }
    ids.add(task.id);
  }
  if (state.tasks.length ? !ids.has(state.selected) : state.selected !== null) {
    throw new Error("当前任务无效");
  }
  return state;
}

export function changeProgress(task, action) {
  if (action === "complete" && task.done < task.steps.length) {
    return { ...task, done: task.done + 1, undo: true };
  }
  if (action === "undo" && task.undo) {
    return { ...task, done: task.done - 1, undo: false };
  }
  if (action === "reset" && task.done) {
    return { ...task, done: 0, undo: false };
  }
  return task;
}

