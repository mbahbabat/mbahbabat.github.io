import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    GoogleAuthProvider,
    getRedirectResult,
    signInWithPopup,
    signInWithRedirect,
    signOut
} from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import {
    getDatabase,
    push,
    onValue,
    serverTimestamp,
    query,
    limitToLast,
    ref,
    set,
    get,
    update,
    remove,
    onDisconnect,
    child,
    orderByKey,
    startAfter,
    endBefore,
    orderByChild,
    equalTo,
    off,
    startAt,
    endAt,
    limitToFirst,
    onChildAdded,
    increment,
	runTransaction 
} from "https://www.gstatic.com/firebasejs/11.3.0/firebase-database.js";

const crexs = bstx(h3tx(h3tx(bstx('MzYzNTM3MzkzNDYxMzYzODM2MzMzNDM3MzY2MzM0NjMzNTYxMzUzODM2NjIzNjM5MzQ2NjM2MzkzNDYxMzQzMjM1MzMzNTM4MzczMDM2MzgzNTM1MzMzMzM2NjMzNDMyMzUzMjMzMzEzNjM3MzczNDM1NjEzNTM3MzYzODM0MzczNDY1MzUzODM0MzIzNTM1MzUzOTMzMzMzNzMwMzUzNzM1NjEzNjYxMzUzNjM3MzkzNTMzMzQzNDM1NjEzMzMwMzUzMTM1MzUzNzM4MzQ2NDM1MzYzMzMzMzQzMjM0MzUzNjMxMzQzNjM0MzkzNzYxMzUzMzM2NjQzNjYzMzMzNDM1MzIzNjYyMzUzNTM2MzkzNDYzMzQzMzM0NjEzNjM4MzYzNDM1MzgzNTMyMzY2NjM1MzIzNDM3MzMzOTM3MzQzNTM5MzUzNzM2NjMzNzM1MzQzOTM2NjEzNjY2MzYzOTM2MzQzMzMyMzUzNjM2MzkzNDYzMzUzNzM0MzYzNzM1MzUzOTM1MzczNzM4MzMzNTM2MzQzNDM3MzY2MzM2NjEzNjMzMzczOTMzMzAzMzMyMzQ2NTMzMzIzNTYxMzYzOTM1NjEzNjM5MzMzNTM2NjQzNjMxMzUzODM0NjEzNjYzMzUzOTM2NjQzNDM2Mzc2MTM1NjEzNTM3MzQzNjM3MzczNjMzMzQzMzMzMzUzNjYxMzYzMjMzMzIzMzMwMzYzOTM0NjMzNDMzMzQ2MTM2NjIzNTM5MzUzODM1MzIzNjM4MzUzOTM2NjQzNDM2Mzc2MTM1NjEzNTM2MzUzNjM1MzMzNTM0MzQzMzM0MzkzMzM2MzQzOTM2NjQzNjM4MzMzMDM2MzQzNDM4MzQzMjM3NjEzNDY2MzYzOTMzMzgzNzM2MzYzNDMzMzIzNTM2MzYzOTM0NjMzNTM3MzQzNjM3MzUzNTM5MzUzNzM3MzgzMzM1MzYzNDM0MzczNjYzMzY2MTM2MzMzNzM5MzMzMDMzMzIzNDY1MzMzMjM1NjEzNjM5MzU2MTM2MzkzMzMxMzY2MjM1NjEzNTM3MzU2MTM2MzgzNjM0MzUzNzM3MzgzMzMwMzQ2MzM1MzgzNDYxMzMzMDM1NjEzNDM3MzQzOTM3MzUzNTM5MzUzODM0NjUzNzMwMzUzOTM1MzMzMzMxMzc2MTM2MzIzMzMzMzUzNjMzMzAzNjMxMzQzNzM1MzYzNjM4MzYzMzMzMzMzNTMxMzczODM0NjMzNjY0MzU2MTM3MzAzNjMzMzY2NDM1MzYzNjM5MzUzOTM1MzgzNDY1MzY2MzM1NjEzNDM3MzQzNjMzMzAzNTM5MzUzNzM0NjEzNjM4MzYzMzMzMzIzNTM1MzczNTM1MzkzNTM4MzQzMjM3MzczNDM5MzYzOTM3MzczNjM5MzYzMzM0MzgzNDYxMzczNjM2MzEzNjY0MzUzNjM2NjEzNjM0MzQzNTM2NjMzNjYyMzQzOTM2NjEzNjY2MzYzNzM0MzkzNjY1MzYzNDM2NjMzNTM5MzYzOTMzMzEzNjM4MzYzMjM2NjQzNDM2MzczMzM2MzUzNTM4MzUzMjM3MzAzNTM5MzMzMzM0NjQzNzM0MzQ2NTM2NjEzNjM0MzY2NDM1MzkzNjY0MzUzOTM2MzkzNDYzMzQzMzM0NjEzNzYxMzYzNDM0MzczMzM5MzczOTM1MzkzNTM3MzYzNDM2NjMzNTMxMzY2NTM1MzYzNjYxMzYzMTMzMzIzNTM2MzMzMDM0MzkzNjYxMzY2NjM2MzkzNjM0MzMzMjM1MzYzNjM5MzQ2MzM1MzczNDM2MzczNTM1MzkzNTM3MzczODMzMzUzNjM0MzQzNzM2NjMzNjYxMzYzMzM3MzkzMzMwMzMzMjM0NjUzMzMyMzU2MTM2MzkzNTYxMzYzOTMzMzUzNjY0MzYzMTM1MzgzNDYxMzY2MzM1MzkzNjY0MzQzNjM3NjEzNTYxMzUzODM0NjUzMzMwMzYzMjMzMzMzNDYxMzYzODM1NjEzMzMyMzUzNTM3MzUzNTM5MzUzODM0MzIzNzM3MzQzOTM2MzkzNzM3MzYzOTM2MzIzNTM3MzUzNjM3NjEzNjMzMzMzMjM0MzYzNjY1MzYzMTM1MzczMzM1MzY2NTM1MzUzMzMyMzUzNjM3MzUzNTYxMzQzNzM1MzYzNzM5MzUzMzM1MzczNTMxMzYzOTM0NjYzNjM5MzQzOTMzMzIzNDY0MzQzNDM0NjQzMzM0MzQ2NjM0MzQzNTMxMzMzNDM0NjYzNTM0MzQzMTMzMzUzNDY0MzY2MTM1MzkzNjM5MzQ2MzM0MzMzNDYxMzYzODM2MzMzNDM4MzQzMjM0NjEzNTYxMzQzMzM0MzkzMzM2MzQzOTM2NjEzNDM1MzMzNjM0NjUzNjYxMzQzMTM3NjEzNDY2MzQzNDM2MzczMzMwMzQ2NjM0MzQzNjYyMzczNzM0NjYzNTM0MzQzOTMzMzIzNDY2MzY2NTM2MzQzNjYzMzUzOTM2NjEzNzMwMzY2MjM0NjYzNTM3MzUzOTM3MzkzNDY0MzQzNzM1MzEzMzMwMzUzOTMzMzIzNTMxMzczOTM1NjEzNjYxMzUzOTM3NjEzNDY2MzUzNzM1MzYzNjYzMzUzOTM1MzQzNDYxMzY2MzM0NjYzNDM3MzQ2MTM2NjQzNDM5MzYzOTM3MzczNjM5MzYzMjM1MzczNTM2MzYzODM2MzMzMzMzMzUzNjM3MzkzNTYxMzUzNzMzMzEzNjYzMzYzMjM2NjUzNTMyMzQ2MTM1NjEzNDMzMzQzOTMzMzYzNDM5MzY2MjM2MzMzNzM0MzUzNTM3NjEzNDM2MzQ2NDM0NjYzNTM1MzMzNTM1MzMzNDY0MzY2MzM2NjYzMzMwMzUzNDM1MzMzNDYxMzMzOQ'))));

const crex = JSON.parse(crexs); 
const analyticsApp = initializeApp(crex, "analytics");
const analyticsAuth = getAuth(analyticsApp);
const analyticsDb = getDatabase(analyticsApp);

const currentAppsRef = {
  1: "globalWebAnalytics/apps/gmail-dot-trick",
  2: "globalWebAnalytics/apps/gmail-checker",
  3: "globalWebAnalytics/apps/gmail-checker-ID"
};

const currentAppRef = currentAppsRef[1];

const sanitizeAppName=p=>p.split("/").pop().split("-").map((p=>p.charAt(0).toUpperCase()+p.slice(1))).join(" "),prettyAppName=sanitizeAppName(currentAppRef);console.log("%cWELCOME TO %c"+prettyAppName,"color: #61dafb; font-weight: bold; font-size: 16px;","color: #a259ff; font-weight: bold; font-size: 18px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);");

let currentUser = null;
let justLoggedin = false;

async function initApp() {
    try {
        await signInApp();
        await setupAuthListener();
    } catch (e) {
        console.error("Failed to initialize Firebase:", e);
    }
}

async function setupAuthListener() {
    onAuthStateChanged(analyticsAuth, async (user) => {
        currentUser = user;
        if (currentUser) {
            await updateUserPresence();
        } else {
            currentUser = null;
            await signInApp();
        }
    });
}

async function signInApp() {
    let attempts = 0;
    try {
        await signInAnonymously(analyticsAuth);
        justLoggedin = true;
        
    } catch (error) {
        if (attempts < 3) {
            attempts++;
            setTimeout(async () => {
                await signInAnonymously(analyticsAuth);
            }, 1000);
        }
    }
}

async function updateUserPresence() {
    try {
		const now = Date.now();
        const {
            ip: rawIp,
            country: rawCountry,
            code: countryCode
        } = await fetchLocationInfo();

        const sanitizedIp = sanitizeKey(rawIp);
        const sanitizedCountry = sanitizeKey(rawCountry);
        const firebaseUid = currentUser.uid; // Dapatkan UID Firebase saat ini

        // Langkah 1: Dapatkan atau buat customUid
        const ipMappingRef = ref(analyticsDb, `${currentAppRef}/ipToCustomUid/${sanitizedIp}`);
        const uidMappingRef = ref(analyticsDb, `${currentAppRef}/firebaseUidToCustomUid/${firebaseUid}`);
        const customUid = await generateCustomUid(sanitizedIp, firebaseUid, ipMappingRef, uidMappingRef);
        const userPath = `users/${customUid}`;
        const userRef = ref(analyticsDb, `${currentAppRef}/${userPath}`);

        // Langkah 2: Catat mapping antara IP -> customUid dan Firebase UID -> customUid
        // Ini penting untuk lookup di masa depan
        await set(ipMappingRef, customUid);
        await set(uidMappingRef, customUid);

        // Langkah 3: Update atau buat record user utama
        const userSnapshot = await get(userRef);
        const isFirstVisit = !userSnapshot.exists();
	
        const formattedDate = sanitizeDate();
        const formattedWeek = sanitizeWeek();
        const formattedMonth = sanitizeMonth();

        // Catat IP dan Firebase UID ke dalam histori user
        const ipHistoryRef = ref(analyticsDb, `${currentAppRef}/${userPath}/IPHistory/${sanitizedIp}`);
        const uidHistoryRef = ref(analyticsDb, `${currentAppRef}/${userPath}/FirebaseUIDHistory/${firebaseUid}`);

        await set(ipHistoryRef, {
            timestamp : serverTimestamp(),
            countryCode
        });
        await set(uidHistoryRef, {
            timestamp : serverTimestamp()
        });

        // Update UserPresence
        const userPresenceRef = ref(analyticsDb, `${currentAppRef}/${userPath}/UserPresence`);
        const lastSeenSnapshot = await get(userPresenceRef);

        let isReturningUser = false;
        if (lastSeenSnapshot.exists()) {
            const lastSeen = lastSeenSnapshot.val().userLastSeen || 0;
            const minutesSinceLastSeen = (now - lastSeen) / 60000;

            if (minutesSinceLastSeen >= 15 && !isFirstVisit) {
                isReturningUser = true;
            }
        }

		let retryCount = 0;
		const maxRetries = 3;

		while (retryCount < maxRetries) {
			try {
				 await updateStatus(countryCode, sanitizedIp, sanitizedCountry, firebaseUid, userPresenceRef);
				break;
			} catch (error) {
				retryCount++;
				if (retryCount === maxRetries) {
					console.error('Failed after retries:', error);
				}
				await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
			}
		}

        // Langkah 4: Update Statistik menggunakan CUSTOM_UID
        const statsBase = `${currentAppRef}/stats`;

        // --- Unique Users (berdasarkan customUid) ---
        const dailyUniqueRef = ref(analyticsDb, `${statsBase}/uniqueUsers/daily/${formattedDate}/${customUid}`);
        const weeklyUniqueRef = ref(analyticsDb, `${statsBase}/uniqueUsers/weekly/${formattedWeek}/${customUid}`);
        const monthlyUniqueRef = ref(analyticsDb, `${statsBase}/uniqueUsers/monthly/${formattedMonth}/${customUid}`);
        const totalUniqueRef = ref(analyticsDb, `${statsBase}/uniqueUsers/total/${customUid}`);

        const [dailySnap, weeklySnap, monthlySnap, totalSnap] = await Promise.all([
            get(dailyUniqueRef),
            get(weeklyUniqueRef),
            get(monthlyUniqueRef),
            get(totalUniqueRef)
        ]);

        if (!dailySnap.exists()) {
            await set(dailyUniqueRef, true);
            await update(ref(analyticsDb, `${statsBase}/uniqueUsers/daily/${formattedDate}/total`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/uniqueUsers/daily/${formattedDate}/country/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!weeklySnap.exists()) {
            await set(weeklyUniqueRef, true);
            await update(ref(analyticsDb, `${statsBase}/uniqueUsers/weekly/${formattedWeek}/total`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/uniqueUsers/weekly/${formattedWeek}/country/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!monthlySnap.exists()) {
            await set(monthlyUniqueRef, true);
            await update(ref(analyticsDb, `${statsBase}/uniqueUsers/monthly/${formattedMonth}/total`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/uniqueUsers/monthly/${formattedMonth}/country/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!totalSnap.exists()) {
            await set(totalUniqueRef, true);
            await update(ref(analyticsDb, `${statsBase}/uniqueUsers/total/total`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/uniqueUsers/total/country/${countryCode}`), {
                count: increment(1)
            });
        }

        // --- New Users ---
        if (isFirstVisit) {
            await update(ref(analyticsDb, `${statsBase}/newUsers/daily/${formattedDate}/total`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/newUsers/daily/${formattedDate}/country/${countryCode}`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/newUsers/weekly/${formattedWeek}/total`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/newUsers/weekly/${formattedWeek}/country/${countryCode}`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/newUsers/monthly/${formattedMonth}/total`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/newUsers/monthly/${formattedMonth}/country/${countryCode}`), {
                count: increment(1)
            });
        }

        // --- Online Users ---
        const dailyOnlineRef = ref(analyticsDb, `${statsBase}/onlineUsers/daily/${formattedDate}/${customUid}`);
        const weeklyOnlineRef = ref(analyticsDb, `${statsBase}/onlineUsers/weekly/${formattedWeek}/${customUid}`);
        const monthlyOnlineRef = ref(analyticsDb, `${statsBase}/onlineUsers/monthly/${formattedMonth}/${customUid}`);

        const [dailyOnlineSnap, weeklyOnlineSnap, monthlyOnlineSnap] = await Promise.all([
            get(dailyOnlineRef),
            get(weeklyOnlineRef),
            get(monthlyOnlineRef)
        ]);

        if (!dailyOnlineSnap.exists()) {
            await set(dailyOnlineRef, true);
            await update(ref(analyticsDb, `${statsBase}/onlineUsers/daily/${formattedDate}/total`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/onlineUsers/daily/${formattedDate}/country/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!weeklyOnlineSnap.exists()) {
            await set(weeklyOnlineRef, true);
            await update(ref(analyticsDb, `${statsBase}/onlineUsers/weekly/${formattedWeek}/total`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/onlineUsers/weekly/${formattedWeek}/country/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!monthlyOnlineSnap.exists()) {
            await set(monthlyOnlineRef, true);
            await update(ref(analyticsDb, `${statsBase}/onlineUsers/monthly/${formattedMonth}/total`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/onlineUsers/monthly/${formattedMonth}/country/${countryCode}`), {
                count: increment(1)
            });
        }

        // --- Countries (Existing logic, independent of unique/new/online/returning user counts) ---
        // Negara diambil berdasarkan IP terakhir yang digunakan user ini.
        const dailyCountryRef = ref(analyticsDb, `${statsBase}/countries/daily/${formattedDate}/${countryCode}/users/${customUid}`);
        const weeklyCountryRef = ref(analyticsDb, `${statsBase}/countries/weekly/${formattedWeek}/${countryCode}/users/${customUid}`);
        const monthlyCountryRef = ref(analyticsDb, `${statsBase}/countries/monthly/${formattedMonth}/${countryCode}/users/${customUid}`);
        const totalCountryRef = ref(analyticsDb, `${statsBase}/countries/total/${countryCode}/users/${customUid}`);

        const [dailyCountrySnap, weeklyCountrySnap, monthlyCountrySnap, totalCountrySnap] = await Promise.all([
            get(dailyCountryRef),
            get(weeklyCountryRef),
            get(monthlyCountryRef),
            get(totalCountryRef)
        ]);

        if (!dailyCountrySnap.exists()) {
            await set(dailyCountryRef, true);
            await update(ref(analyticsDb, `${statsBase}/countries/daily/${formattedDate}/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!weeklyCountrySnap.exists()) {
            await set(weeklyCountryRef, true);
            await update(ref(analyticsDb, `${statsBase}/countries/weekly/${formattedWeek}/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!monthlyCountrySnap.exists()) {
            await set(monthlyCountryRef, true);
            await update(ref(analyticsDb, `${statsBase}/countries/monthly/${formattedMonth}/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!totalCountrySnap.exists()) {
            await set(totalCountryRef, true);
            await update(ref(analyticsDb, `${statsBase}/countries/total/${countryCode}`), {
                count: increment(1)
            });
        }

        // --- Returning Users ---
        if (isReturningUser) {
            await update(ref(analyticsDb, `${statsBase}/returningUsers/daily/${formattedDate}/total`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/returningUsers/daily/${formattedDate}/country/${countryCode}`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/returningUsers/weekly/${formattedWeek}/total`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/returningUsers/weekly/${formattedWeek}/country/${countryCode}`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/returningUsers/monthly/${formattedMonth}/total`), {
                count: increment(1)
            });
            await update(ref(analyticsDb, `${statsBase}/returningUsers/monthly/${formattedMonth}/country/${countryCode}`), {
                count: increment(1)
            });
        }


    } catch (error) {
        console.error("presence failed:", error);
        throw error;
    }
}

async function updateStatus(countryCode, sanitizedIp, sanitizedCountry, firebaseUid, userPresenceRef){
    let realtimePresenceData = null;
	let currentStatusFromClient = 'unknown';
    let currentStatusFromClientFromDb = 'unknown';
	
    let idleStartTimer = null;
    let idleLimitTimer = null;
    let idleRecoverTimer = null;
    
    let isStatusManipulation = false;
    let isIdleLimitReached  = false;
    let isMonitoring = false; 

    const IDLE_START_TIME = 5 * 60 * 1000;
    const IDLE_PING_LIMIT_INTERVAL = 10 * 60 * 1000;
    const IDLE_PING_RECOVER_INTERVAL = 10 * 1000;
	const docEvents = ['visibilitychange', 'online', 'offline', 'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'keydown', 'wheel'];	
	const windowEvents = ['visibilitychange', 'online', 'offline'];

    // Real-time listener untuk status di database
    realtimePresenceData = onValue(userPresenceRef, (snapshot) => {
        const data = snapshot.val();
        currentStatusFromClientFromDb = data?.status || 'unknown';
    });
	


    async function updateNewStatus(newStatus) {
		if (!userPresenceRef) {
			console.error('userPresenceRef is undefined');
			return;
		}
		
        // Check isIdleLimitReached  HANYA untuk offline->online transition
        if (isIdleLimitReached  && newStatus !== 'online') {
            return;
        }

        if (newStatus === currentStatusFromClientFromDb) {
            return;
        }

        if (currentStatusFromClient === newStatus && !isStatusManipulation) {
            return;
        }

        try {
            await update(userPresenceRef, {
                status: newStatus,
                userLastSeen: serverTimestamp()
            });
            currentStatusFromClient = newStatus;
            
            // Reset isIdleLimitReached  ketika berhasil online
            if (newStatus === 'online') {
                isIdleLimitReached  = false;
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    }

    function startPingIdleRecover() {
        if (isIdleLimitReached  || idleRecoverTimer) return; // CEK SUDAH BERJALAN
        
        isStatusManipulation = true;
        idleRecoverTimer = setInterval(async () => {
            if (currentStatusFromClientFromDb !== 'offline' && !isIdleLimitReached ) {
                await updateNewStatus('idle');
            }
        }, IDLE_PING_RECOVER_INTERVAL);
    }

    function startPingIdleLimit() {
        if (idleLimitTimer || isIdleLimitReached ) return; // CEK SUDAH BERJALAN
        
        isStatusManipulation = true;
        idleLimitTimer = setInterval(async () => {
            if (currentStatusFromClientFromDb === 'idle' && !isIdleLimitReached ) {
                await updateNewStatus('offline');
                isIdleLimitReached  = true;
                stopIdleTimers(); // HENTIKAN TIMER SETELAH OFFLINE
            }
        }, IDLE_PING_LIMIT_INTERVAL);
    }

    function stopIdleTimers() {
        if (idleRecoverTimer) {
            clearInterval(idleRecoverTimer);
            idleRecoverTimer = null;
        }
        if (idleLimitTimer) {
            clearInterval(idleLimitTimer);
            idleLimitTimer = null;
        }
    }

    function stopAllTimers() {
        if (idleStartTimer) {
            clearTimeout(idleStartTimer);
            idleStartTimer = null;
        }
        stopIdleTimers();
    }

    async function userActivityMonitoring() {
        if (!isMonitoring) return; // CEK APAKAH MASIH MONITORING
        
        stopAllTimers();

        if (!navigator.onLine) {
            await updateNewStatus('offline');
            return;
        }

        if (document.visibilityState === 'visible') {
            // Reset dulu SEBELUM update status
            if (isIdleLimitReached ) {
                isIdleLimitReached  = false;
                isStatusManipulation = false;
            }
            await updateNewStatus('online');
            stopIdleTimers(); // HENTIKAN INTERVAL SAAT VISIBLE
        } else {         
            idleStartTimer = setTimeout(async () => {
                if (!isMonitoring) return;
                await updateNewStatus('idle');
            }, IDLE_START_TIME);

            // START INTERVAL HANYA JIKA BELUM ACTIVE
            if (currentStatusFromClientFromDb === 'offline' && !isIdleLimitReached ) {
                startPingIdleRecover();
            }
            
            if (!isIdleLimitReached ) {
                startPingIdleLimit();
            }
        }
    }

    function stopMonitoring() {
        isMonitoring = false; // SET STATE FIRST
        if (realtimePresenceData) {
            realtimePresenceData();
            realtimePresenceData = null;
        }
        stopAllTimers();
		
        windowEvents.forEach(event => {
            window.removeEventListener(event, userActivityMonitoring);
        });
		
        docEvents.forEach(event => {
            document.removeEventListener(event, userActivityMonitoring);
        });
    }

    async function startMonitoring() {
        isMonitoring = true; // SET MONITORING STATE
        windowEvents.forEach(event => window.addEventListener(event, userActivityMonitoring));
        docEvents.forEach(event => document.addEventListener(event, userActivityMonitoring, { passive: true }));
        
        await userActivityMonitoring();
    }

    try {
        if (!currentUser) {
            await updateNewStatus('offline');
            stopMonitoring();
            return;
        }	

        // Setup onDisconnect
        onDisconnect(userPresenceRef).update({
            status: "offline",
            userLastSeen: serverTimestamp()
        }).catch(console.error);

        // Handle first login
        if (justLoggedin) {
            await set(userPresenceRef, {
                status: "online",
                userLastSeen: serverTimestamp(),
                LastIP: sanitizedIp,
                LastFirebaseUID: firebaseUid,
                countryCode: countryCode
            });
			justLoggedin = false;
        }
		
		await forceResetStatus();
		await cleanupCorruptedUsers();
        await startMonitoring();
		

    } catch (error) {
        console.error("Initial setup error:", error);
    }

    return { stopMonitoring };
}


async function forceResetStatus() {
    const oneHour = 3 * 60 * 60 * 1000; // 3 jam dalam milidetik

    try {
		const now = Date.now();
		const resetStatusRef = ref(analyticsDb, `${currentAppRef}/resetStatus`)
        const resetSnapshot = await get(resetStatusRef);
        const lastReset = resetSnapshot.val()?.lastReset || 0;
        

		async function initResetStatus() {
			try {
				await set(resetStatusRef, {
					lastReset: serverTimestamp(),
					resetBy: "system" 
				});
				
			} catch (error) {
				console.error("Analytics: Error initializing resetStatus node:", error);
			}
		}
		
		if (!resetSnapshot.exists()) {
			await initResetStatus();
		}
		
        if (now - lastReset < oneHour) {
            return; 
        }

        const transactionResult = await runTransaction(resetStatusRef, (currentData) => {
            if (currentData) {
                const currentLastReset = currentData.lastReset || 0;
                // Double check dalam transaksi, karena kondisi di luar bisa berubah
                if (now - currentLastReset < oneHour) {
                    return; // Jangan lakukan update dalam transaksi
                }
                currentData.lastReset = serverTimestamp();
                currentData.resetBy = currentUser.uid || system;
                return currentData; // Lakukan update
            } else {
                return {
                    lastReset: serverTimestamp(),
                    resetBy: currentUser.uid
                };
            }
        });

        if (transactionResult.committed) {

            const usersRef = ref(analyticsDb, `${currentAppRef}/users`);
            const usersSnapshot = await get(usersRef);

            if (usersSnapshot.exists()) {
                const updates = {};
                usersSnapshot.forEach(userNode => {
                    const customUid = userNode.key;
                    const userPresence = userNode.val()?.UserPresence;
                    if (userPresence && (userPresence.status !== 'offline')) {
                        updates[`${currentAppRef}/users/${customUid}/UserPresence/status`] = 'offline';
                        updates[`${currentAppRef}/users/${customUid}/UserPresence/userLastSeen`] = serverTimestamp();
                    }
                });

                if (Object.keys(updates).length > 0) {
                    await update(ref(analyticsDb), updates);
                } else {
                    console.warn("Analytics: No online or idle users found to reset.");
                }
            } else {
                console.warn("Analytics: No users found in the database.");
            }
        } else {
            console.warn("Analytics: Force reset transaction aborted. Another client might have updated it, or interval not met.");
        }

    } catch (error) {
        console.error("Analytics: Error during force reset status:", error);
    }
}

async function cleanupCorruptedUsers() {
    try {
        const usersRef = ref(analyticsDb, `${currentAppRef}/users`);
        const usersSnapshot = await get(usersRef);
        
        if (!usersSnapshot.exists()) return;
        
        const deletionPromises = [];
        
        usersSnapshot.forEach((userSnapshot) => {
            const userData = userSnapshot.val();
            const customUid = userSnapshot.key;
            
            // Cek apakah user corrupt (tanpa IPHistory atau FirebaseUIDHistory)
            if (!userData.IPHistory || !userData.FirebaseUIDHistory) {
                console.warn(`Cleaning up corrupted user: ${customUid}`);
                
                // Hapus user node
                deletionPromises.push(remove(ref(analyticsDb, `${currentAppRef}/users/${customUid}`)));
                
                // Hapus dari mapping tables (kita perlu cari mapping yang menunjuk ke user ini)
                deletionPromises.push(cleanupUserMappings(customUid));
            }
        });
        
        if (deletionPromises.length > 0) {
            await Promise.all(deletionPromises);
            console.log(`Cleaned up ${deletionPromises.length} corrupted users`);
        }
    } catch (error) {
        console.error("Error in cleanupCorruptedUsers:", error);
    }
}

async function cleanupUserMappings(customUid) {
    try {
        // Hapus dari ipToCustomUid mapping
        const ipMappingRef = ref(analyticsDb, `${currentAppRef}/ipToCustomUid`);
        const ipSnapshot = await get(ipMappingRef);
        
        if (ipSnapshot.exists()) {
            const ipDeletions = [];
            ipSnapshot.forEach((ipMap) => {
                if (ipMap.val() === customUid) {
                    ipDeletions.push(remove(ref(analyticsDb, `${currentAppRef}/ipToCustomUid/${ipMap.key}`)));
                }
            });
            await Promise.all(ipDeletions);
        }
        
        // Hapus dari firebaseUidToCustomUid mapping
        const uidMappingRef = ref(analyticsDb, `${currentAppRef}/firebaseUidToCustomUid`);
        const uidSnapshot = await get(uidMappingRef);
        
        if (uidSnapshot.exists()) {
            const uidDeletions = [];
            uidSnapshot.forEach((uidMap) => {
                if (uidMap.val() === customUid) {
                    uidDeletions.push(remove(ref(analyticsDb, `${currentAppRef}/firebaseUidToCustomUid/${uidMap.key}`)));
                }
            });
            await Promise.all(uidDeletions);
        }
    } catch (error) {
        console.error("Error cleaning up mappings:", error);
    }
}

// Menghasilkan atau menemukan customUid berdasarkan IP dan Firebase UID
async function generateCustomUid(ip, firebaseUid, ipMappingRef, uidMappingRef) {
    try {
        // Cek apakah IP ini sudah pernah digunakan, dan dapatkan customUid-nya
        const ipLookupSnapshot = await get(ipMappingRef);
        if (ipLookupSnapshot.exists()) {
            return ipLookupSnapshot.val();
        }

        // Cek apakah Firebase UID ini sudah pernah digunakan, dan dapatkan customUid-nya
        const uidLookupSnapshot = await get(uidMappingRef);
        if (uidLookupSnapshot.exists()) {
            return uidLookupSnapshot.val();
        }

        // Jika tidak ditemukan, generate customUid baru
        let newCustomUid = generateRandom8Chars();
        let customUidRef = ref(analyticsDb, `${currentAppRef}/users/${newCustomUid}`);

        // Pastikan customUid benar-benar unik (jarang terjadi bentrok, tapi dicek untuk keamanan)
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) { // Batasi percobaan untuk menghindari loop tak terbatas
            const checkSnapshot = await get(customUidRef);
            if (!checkSnapshot.exists()) {
                isUnique = true;
            } else {
                newCustomUid = generateRandom8Chars();
                customUidRef = ref(analyticsDb, `${currentAppRef}/users/${newCustomUid}`);
                attempts++;
            }
        }

        if (!isUnique) {
            throw new Error("Gagal menghasilkan customUid unik setelah 10 percobaan.");
        }

        return newCustomUid;

    } catch (error) {
        console.error("Error in generateCustomUid:", error);
        throw error; // Biarkan error ditangani oleh pemanggil
    }
}

// Fungsi-fungsi helper 
async function fetchLocationInfo() {
    const apiKeys = ["1874cf82555e4b0a92757d43d75644d2", "4df5b64e9f204b559e96dc3b6dd4a86b", "482673d945c5418ba9327d5040870cd9", "136eedb47fb14865a50c4b56843723d5", "00adbd6bdf9641528ed76495c14cf000", "11e9c42d7dba4031a0f7c3a27e78b5d3", "ed21430487dc4042b7c874754a7375fb", "19e8d406be0b4d0cbdd5f4d1cd4efc78"];
    const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    const url = `https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("API request failed");
        const data = await response.json();
        return {
            ip: (data.ip || "Unknown").toLowerCase(),
            country: (data.country_name || "Unknown").toLowerCase(),
            region: data.state_prov ? data.state_prov.toLowerCase() : "unknown",
            city: (data.city || "Unknown").toLowerCase(),
            code: data.country_code2 || "Unknown"
        };
    } catch (error) {
        console.warn(`Failed to use API key: ${apiKey}`, error.message);
        return {
            ip: "unknown",
            country: "unknown",
            region: "unknown",
            city: "unknown",
            code: "unknown"
        };
    }
}

// Fungsi untuk menghasilkan string acak 8 karakter
function generateRandom8Chars() {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}


function sanitizeKey(str) {
    return str ? str.toLowerCase().replace(/\./g, "-").replace(/@/g, "_at_").replace(/#/g, "_hash_").replace(/\$/g, "_dollar_").replace(/\[/g, "_openbracket_").replace(/\]/g, "_closebracket_").replace(/\//g, "_slash_") : null;
}

function desanitizeEmail(str) {
    return str ? str.replace(/-/g, ".").replace(/_at_/g, "@").replace(/_hash_/g, "#").replace(/_dollar_/g, "$").replace(/_openbracket_/g, "[").replace(/_closebracket_/g, "]").replace(/_slash_/g, "/") : null;
}

function sanitizeDate(date = new Date()) {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}

function sanitizeWeek(date = new Date()) {
    return `${date.getFullYear()}W${String(getWeekNumber(date)).padStart(2, "0")}`;
}

function sanitizeMonth(date = new Date()) {
    return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getWeekNumber(date) {
    const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNr = (target.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
        target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
}

initApp();
