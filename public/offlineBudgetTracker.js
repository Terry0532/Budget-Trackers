let db;
const request = indexedDB.open("offlineBudgetDB", 1);

request.onupgradeneeded = function (event) {
    db = event.target.result;
    db.createObjectStore("cache", { autoIncrement: true });
};

request.onsuccess = function (event) {
    if (navigator.onLine) {
        offlineBudgetTracker();
    }
};

function saveRecord(record) {
    const db = request.result;
    const transaction = db.transaction(["cache"], "readwrite");
    const offlineBudgetStore = transaction.objectStore("cache");
    offlineBudgetStore.add(record);
}

function offlineBudgetTracker() {
    const db = request.result;
    const transaction = db.transaction(["cache"], "readwrite");
    const offlineBudgetStore = transaction.objectStore("cache");
    const getAll = offlineBudgetStore.getAll();
    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            });
            offlineBudgetStore.clear();
        }
    }
}

window.addEventListener("online", offlineBudgetTracker);