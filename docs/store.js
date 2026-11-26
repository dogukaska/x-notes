const database = new Promise((resolve, reject) => {
  const request = indexedDB.open("x-notes", 1);
  request.onupgradeneeded = () => {
    for (const name of ["notes", "profiles", "settings"]) {
      request.result.createObjectStore(name, { keyPath: "id" });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
  request.onblocked = () => reject(new Error("Veritabanı başka bir sekmede açık."));
});

export async function readAll() {
  const db = await database;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["notes", "profiles", "settings"], "readonly");
    const notes = transaction.objectStore("notes").getAll();
    const profiles = transaction.objectStore("profiles").getAll();
    const settings = transaction.objectStore("settings").get("preferences");
    transaction.oncomplete = () => resolve({
      notes: notes.result, profiles: profiles.result, settings: settings.result,
    });
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function write(name, apply) {
  const db = await database;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(name, "readwrite");
    const store = transaction.objectStore(name);
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
    try {
      apply(store, transaction);
    } catch (error) {
      transaction.abort();
      reject(error);
    }
  });
}
