let db;
//create a new db request for offline transations
const request = indexedDB.open("offlineBudgetDB", 1);

request.onupgradeneeded = function (event) {
    db = event.target.result;
    db.createObjectStore("cache", { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = request.result;
    //check if app is online before reading from db
    if (navigator.onLine) {
        offlineBudgetTracker();
    }
};

function saveRecord(record) {
    const db = request.result;
    //create a transaction on the cache db with readwrite access
    const transaction = db.transaction(["cache"], "readwrite");
    //access cache object store
    const offlineBudgetStore = transaction.objectStore("cache");
    //add record to cache object store
    offlineBudgetStore.add(record);
}

function offlineBudgetTracker() {
    const db = request.result;
    //open a transaction on cache db
    const transaction = db.transaction(["cache"], "readwrite");
    //access cache object store
    const offlineBudgetStore = transaction.objectStore("cache");
    //get all records from store and set to a variable
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
            //clear all items in store
            offlineBudgetStore.clear();
        }
    }
}

//listen for app coming back online
window.addEventListener("online", offlineBudgetTracker);