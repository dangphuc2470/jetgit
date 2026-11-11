import { TaskItem } from '../shared/protocol';

export type TaskListener = (tasks: TaskItem[]) => void;

class TaskManager {
  private tasks: Map<string, TaskItem> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();
  private listeners: Set<TaskListener> = new Set();
  private nextId = 1;

  public subscribe(listener: TaskListener): () => void {
    this.listeners.add(listener);
    listener(this.getTasks());
    return () => this.listeners.delete(listener);
  }

  public getTasks(): TaskItem[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.startTime - a.startTime);
  }

  private notify() {
    const list = this.getTasks();
    for (const listener of this.listeners) {
      try {
        listener(list);
      } catch {}
    }
  }

  public async runTask<T>(
    title: string,
    action: (signal: AbortSignal, updateDetail: (detail: string) => void) => Promise<T>,
    options?: { cancellable?: boolean; initialDetail?: string }
  ): Promise<T> {
    const id = `task_${Date.now()}_${this.nextId++}`;
    const controller = new AbortController();
    this.abortControllers.set(id, controller);

    const task: TaskItem = {
      id,
      title,
      detail: options?.initialDetail || '',
      status: 'running',
      startTime: Date.now(),
      canCancel: options?.cancellable !== false,
    };
    this.tasks.set(id, task);
    this.notify();

    const updateDetail = (detail: string) => {
      const cur = this.tasks.get(id);
      if (cur && cur.status === 'running') {
        cur.detail = detail;
        this.notify();
      }
    };

    try {
      const result = await action(controller.signal, updateDetail);
      const cur = this.tasks.get(id);
      if (cur) {
        cur.status = 'completed';
        cur.endTime = Date.now();
        if (typeof result === 'string' && result) {
          cur.detail = result;
        }
        this.notify();
      }
      return result;
    } catch (err: any) {
      const cur = this.tasks.get(id);
      if (cur) {
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          cur.status = 'cancelled';
          cur.detail = 'Stopped by user';
        } else {
          cur.status = 'failed';
          cur.detail = err?.message || String(err);
        }
        cur.endTime = Date.now();
        this.notify();
      }
      throw err;
    } finally {
      this.abortControllers.delete(id);
    }
  }

  public cancelTask(id: string): boolean {
    const controller = this.abortControllers.get(id);
    if (controller) {
      controller.abort();
      const task = this.tasks.get(id);
      if (task && task.status === 'running') {
        task.status = 'cancelled';
        task.detail = 'Stopping...';
        this.notify();
      }
      return true;
    }
    return false;
  }

  public dismissTask(id: string): void {
    this.tasks.delete(id);
    this.abortControllers.delete(id);
    this.notify();
  }

  public clearFinishedTasks(): void {
    for (const [id, task] of this.tasks.entries()) {
      if (task.status !== 'running') {
        this.tasks.delete(id);
        this.abortControllers.delete(id);
      }
    }
    this.notify();
  }

  public notifyInfo(title: string, detail?: string): void {
    const id = `notify_${Date.now()}_${this.nextId++}`;
    const task: TaskItem = {
      id,
      title,
      detail: detail || '',
      status: 'completed',
      startTime: Date.now(),
      endTime: Date.now(),
      canCancel: false,
    };
    this.tasks.set(id, task);
    this.notify();
  }

  public notifyError(title: string, detail?: string): void {
    const id = `notify_${Date.now()}_${this.nextId++}`;
    const task: TaskItem = {
      id,
      title,
      detail: detail || '',
      status: 'failed',
      startTime: Date.now(),
      endTime: Date.now(),
      canCancel: false,
    };
    this.tasks.set(id, task);
    this.notify();
  }
}

export const taskManager = new TaskManager();
