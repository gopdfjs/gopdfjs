/**
 * Singleton Worker + postMessage protocol — no PDF logic (see crates/* + worker.ts).
 */

export type WorkerSuccess = { id: number; ok: true; result: Uint8Array };
export type WorkerProgress = { id: number; ok: true; progress: number };
export type WorkerFailure = { id: number; ok: false; error: string };
export type WorkerReply = WorkerSuccess | WorkerProgress | WorkerFailure;

type PendingCall = {
  resolve: (value: Uint8Array) => void;
  reject: (reason: Error) => void;
  onProgress?: (fraction: number) => void;
};

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, PendingCall>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (e: MessageEvent<WorkerReply>) => {
      const msg = e.data;
      const call = pending.get(msg.id);
      if (!call) return;

      if (msg.ok && "progress" in msg) {
        call.onProgress?.(msg.progress);
        return;
      }

      pending.delete(msg.id);
      if (msg.ok) {
        call.resolve(msg.result);
      } else {
        call.reject(new Error(msg.error));
      }
    };

    worker.onerror = (e) => {
      for (const [, call] of pending) {
        call.reject(new Error(`WASM Worker crashed: ${e.message}`));
      }
      pending.clear();
      worker = null;
    };
  }
  return worker;
}

/** Dispatch one WASM op; transfers `transfer` buffers to the Worker. */
export function dispatchWasmOp(
  op: string,
  payload: Record<string, unknown>,
  transfer: Transferable[],
  onProgress?: (fraction: number) => void,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject, onProgress });
    getWorker().postMessage({ id, op, payload }, transfer);
  });
}
