import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { 
    getAuth, 
    signInAnonymously,
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    push, 
    onValue, 
    serverTimestamp,
    query,
    limitToLast,
    set,
    get,
    remove,
    onDisconnect,
    update,
    child,
	orderByKey,
    startAfter,
	endBefore,
	orderByChild,
	equalTo,
	off,
	startAt,
	endAt,
	limitToFirst
} from "https://www.gstatic.com/firebasejs/11.3.0/firebase-database.js";

const cosecs = bstx(h3tx(h3tx(bstx('MzYzNTM3MzkzNDYxMzYzODM2MzMzNDM3MzY2MzM0NjMzNTYxMzUzODM2NjIzNjM5MzQ2NjM2MzkzNDYxMzQzMjM1MzMzNTM4MzczMDM2MzgzNTM1MzMzMzM2NjMzNDMzMzUzMzM0MzczNDYxMzUzNzM1MzYzNjY0MzUzMjM3MzgzNTMyMzQzNzM2NjYzMzMyMzYzNTM0MzczNjM0MzMzMzM2MzQzNTM2MzUzMjM1MzkzNjMxMzc2MTM2NjMzNjM2MzYzMjM1MzczMzM5MzMzMzM1MzMzNjYzMzQzMjM1MzAzNTMxMzUzODM2NjIzNzM0MzYzNDM0MzQzNjM4MzUzNzM2MzIzNjYzMzY2MjM2MzkzNDYzMzQzMzM0NjEzNjM4MzYzNDM1MzgzNTMyMzY2NjM1MzIzNDM3MzMzOTM3MzQzNTM5MzUzNzM2NjMzNzM1MzQzOTM2NjEzNjY2MzYzOTM1MzkzMzMyMzYzODM2MzgzNjM0MzQzMzMzMzAzMzMxMzU2MTM2NjEzNDY1MzY2MTM0NjYzNTMzMzMzNTM2NjQzNjMxMzUzODM0NjEzNjYzMzUzOTM2NjQzNDM2Mzc2MTM1NjEzNTM3MzQzNjM3MzczNjMzMzQzMzMzMzUzNjYxMzYzMjMzMzIzMzMwMzYzOTM0NjMzNDMzMzQ2MTM2NjIzNTM5MzUzODM1MzIzNjM4MzUzOTM2NjQzNDM2Mzc2MTM1NjEzNTM2MzUzNjM1MzMzNTM0MzQzMzM0MzkzMzM2MzQzOTM2NjQzNjM4MzMzMDM2MzQzNDM4MzQzMjM3NjEzNDY2MzYzOTMzMzgzNzM2MzUzOTMzMzIzNjM4MzYzODM2MzQzNDMzMzMzMDMzMzEzNTYxMzY2MTM0NjUzNjYxMzQ2NjM1MzMzMzMxMzY2MjM1NjEzNTM3MzU2MTM2MzgzNjM0MzUzNzM3MzgzMzMwMzQ2MzM1MzgzNDYxMzMzMDM1NjEzNDM3MzQzOTM3MzUzNTM5MzUzODM0NjUzNzMwMzUzOTM1MzMzMzMxMzc2MTM2MzIzMzMzMzUzNjMzMzAzNjMxMzQzNzM1MzYzNjM4MzYzMzMzMzMzNTMxMzczODM0NjMzNjY0MzU2MTM3MzAzNjMzMzY2NDM1MzYzNjM5MzUzOTM1MzgzNDY1MzY2MzM1NjEzNDM3MzQzNjMzMzAzNTM5MzUzNzM0NjEzNjM4MzYzMzMzMzIzNTM1MzczNTM1MzkzNTM4MzQzMjM3MzczNDM5MzYzOTM3MzczNjM5MzYzMzM0MzgzNDYxMzczNjM2MzEzNjY0MzUzNjM2NjEzNjM0MzQzNTM2NjMzNjYyMzQzOTM2NjEzNjY2MzYzOTM1MzkzMzMyMzYzODM2MzgzNjM0MzQzMzMzMzAzMzMxMzU2MTM2NjEzNDY1MzY2MTM0NjYzNTMzMzQzOTM3MzMzNDM5MzY2NTM0NjUzMzMwMzYzMjMzMzMzNDYxMzYzODM1NjEzMzMyMzUzNjM0MzMzNjM0MzUzNzM0NjUzNzMyMzU2MTM1MzgzNTMxMzYzOTM0NjYzNjM5MzQ2MTM2NjEzNjMxMzQzNzM0MzYzMzMwMzQ2MzM1MzQzNTM2MzY2NDM0NjQzMzMyMzQ2NDMzMzUzNDYzMzY2NDM1NjEzNzMwMzYzMzM2NjQzNTM2MzYzOTM1MzkzNTM4MzQ2NTM2NjMzNjMzMzMzMzM1MzIzNzM2MzYzMzM2NjQzNDM2MzY2NTM1NjEzNTMzMzMzNTM2MzgzNjMzMzQzODM0MzEzNjM5MzQ2MzM0MzMzNDYxMzczNDM1NjEzNTM4MzQ2NTM3NjEzNTM5MzUzNzM2MzQzNzMwMzYzMjM2NjQzNjM0MzUzNDM1NjEzNTM3MzMzNTM2NjIzNTYxMzUzODM0NjEzNDYxMzU2MTM0MzMzNDM5MzMzNjM0MzkzNjYxMzUzMTMzMzEzNDY0MzQzNDM2MzczMzMzMzQ2NDM1MzQzNDM5MzMzMDM0NjUzNzYxMzYzNzM3MzczNDY2MzUzMzM0MzkzNzMzMzQzOTM2NjQzNDM2MzczNzM2MzMzNDM1MzY2MzM2NjIzNDM5MzY2MTM2NjYzNjM5MzQ2NDM1MzQzNjY2MzMzMDM0NjUzNTM0MzQzMTMzMzQzNDY1Mzc2MTM0MzUzNzM5MzQ2NTM0MzQzNjMzMzMzNDM0NjQzNDM0MzY2MjMzMzYzNjM0MzMzMjM1MzYzNjM5MzQ2NjM2NjEzNTMxMzMzMzM1NjEzNjY0MzUzNjM2NjEzNDY1MzY2NDM0MzUzNzYxMzQ2NDM3NjEzNDM1MzMzNDM0NjQzNTM0MzU2MTM2NjIzNDY0MzQzNDM0MzIzNjYxMzQ2NDM0MzQzNTM5MzMzMTM0NjUzNDM0MzQzMTM2MzkzNDYzMzQzMzM0NjEzNzM0MzU2MTM1MzczNDM2Mzc2MTM2MzQzNTM4MzQ2MTM2NjMzNjMyMzUzNzM1MzYzNzM1MzYzNDM0MzUzNjYzMzY2MjM0MzkzNjYxMzY2NjM2MzkzNTMyMzczOTMzMzEzNTMxMzUzNDM0MzQzNDMyMzQzNTM1MzQzNjYyMzMzMTM1MzkzNTM3MzY2MTM0NjEzNTM0MzQzOTM2NjUzMzMwMzM2NA'))));
const cosec = JSON.parse(cosecs);
const app = initializeApp(cosec);
const auth = getAuth(app);
const database = getDatabase(app);

export {
    auth,
    database,
    signInAnonymously,
    onAuthStateChanged,
    ref,
    push,
    onValue,
    serverTimestamp,
    query,
    limitToLast,
    set,
    get,
    remove,
    onDisconnect,
    update,
    child,
	orderByKey,
    startAfter,
	endBefore,
	orderByChild,
	equalTo,
	off,
	startAt,
	endAt,
	limitToFirst
};


