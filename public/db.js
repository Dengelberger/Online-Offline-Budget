let db;
// NEW REQUEST FOR A "BUDGET" DATABASE, VERSION 1
const request = indexedDB.open("budget", 1);

//CREATE "PENDING" STORE, SET AUTOINCREMENT FOR TRANSACTION NUMBER
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

//CHECK IF APP IS ONLINE, READ FROM DB
request.onsuccess = function(event) {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};
//ERROR MESSAGE
request.onerror = function(event) {
  console.log("Woops! " + event.target.errorCode);
};

// CREATE AND SAVE A TRANSACTION AS PENDING WHEN OFFLINE.
function saveRecord(record) {
  // ALLOW READWRITE ACCESS
  const transaction = db.transaction(["pending"], "readwrite");

  //ACCESS PENDING
  const store = transaction.objectStore("pending");

  //ADD PENDING RECORD
  store.add(record);
}
//CHECK TO SEE IF THERE ARE PENDING TRANX IN INDEXEDDB, THEN POST THEM TO MONGO, THEN DELETE THE PENDING TRANX ALREADY PROCESSED.
function checkDatabase() {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  // SET TO VARIABLE TO WRITE IN SHORT LANGUAGE LATER
  const getAll = store.getAll();
//ACTUAL POSTING AND DELETING TO MONGO DB
  getAll.onsuccess = function() {
      //POST TO MONGO DB
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        //CLEAR PENDING TRANX ON INDEXEDDB
        const transaction = db.transaction(["pending"], "readwrite");
        const store = transaction.objectStore("pending");
        store.clear();
      });
    }
  };
}

// LISTEN FOR APP COMING ONLINE
window.addEventListener("online", checkDatabase);
