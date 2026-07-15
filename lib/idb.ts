import type { AnswerStore } from "./types";

const DB_NAME = "libreprep";
const STORE_NAME = "answers";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAnswers(
  sessionKey: string,
  answers: AnswerStore,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(answers, sessionKey);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function loadAnswers(
  sessionKey: string,
): Promise<AnswerStore | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const request = tx.objectStore(STORE_NAME).get(sessionKey);
    tx.oncomplete = () => {
      db.close();
      resolve(request.result ?? null);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export function buildSessionKey(params: URLSearchParams): string {
  const entries = [
    params.get("subject"),
    params.get("classes"),
    params.get("skills"),
    params.get("difficulty"),
  ].join("|");
  let hash = 0;
  for (let i = 0; i < entries.length; i++) {
    hash = (hash * 31 + entries.charCodeAt(i)) | 0;
  }
  return `session_${hash}`;
}
