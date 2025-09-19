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
    increment
} from "https://www.gstatic.com/firebasejs/11.3.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAGX-ehF5pTczVf5rH6tALLWpDhR3JixFE",
    authDomain: "web-analytics-67fbf.firebaseapp.com",
    databaseURL: "https://web-analytics-67fbf-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "web-analytics-67fbf",
    storageBucket: "web-analytics-67fbf.firebasestorage.app",
    messagingSenderId: "603884890926",
    appId: "1:603884890926:web:d9f20d4cd2f639eea2e8bf",
    measurementId: "G-S1L9NR2Z4M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
let currentUser = null;

// Fungsi untuk menghasilkan string acak 8 karakter
function generateRandom8Chars() {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Fungsi baru: Menghasilkan atau menemukan customUid berdasarkan IP dan Firebase UID
async function generateCustomUid(ip, firebaseUid) {
    const baseRef = "globalWebAnalytics/apps/gmail-dot-trick";
    const ipLookupRef = ref(db, `${baseRef}/ipToCustomUid/${sanitizeKey(ip)}`);
    const uidLookupRef = ref(db, `${baseRef}/firebaseUidToCustomUid/${firebaseUid}`);

    try {
        // Cek apakah IP ini sudah pernah digunakan, dan dapatkan customUid-nya
        const ipLookupSnapshot = await get(ipLookupRef);
        if (ipLookupSnapshot.exists()) {
            return ipLookupSnapshot.val();
        }

        // Cek apakah Firebase UID ini sudah pernah digunakan, dan dapatkan customUid-nya
        const uidLookupSnapshot = await get(uidLookupRef);
        if (uidLookupSnapshot.exists()) {
            return uidLookupSnapshot.val();
        }

        // Jika tidak ditemukan, generate customUid baru
        let newCustomUid = generateRandom8Chars();
        let customUidRef = ref(db, `${baseRef}/users/${newCustomUid}`);

        // Pastikan customUid benar-benar unik (jarang terjadi bentrok, tapi dicek untuk keamanan)
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) { // Batasi percobaan untuk menghindari loop tak terbatas
            const checkSnapshot = await get(customUidRef);
            if (!checkSnapshot.exists()) {
                isUnique = true;
            } else {
                newCustomUid = generateRandom8Chars();
                customUidRef = ref(db, `${baseRef}/users/${newCustomUid}`);
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

async function initApp() {
    try {
        await signInApp();
        await setupAuthListener();
    } catch (e) {
        console.error("Failed to initialize Firebase:", e);
    }
}

async function setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
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
        await signInAnonymously(auth);
    } catch (error) {
        if (attempts < 3) {
            attempts++;
            setTimeout(async () => {
                await signInAnonymously(auth);
            }, 1000);
        }
    }
}

async function updateUserPresence() {
    try {
        const {
            ip: rawIp,
            country: rawCountry,
            code: countryCode
        } = await fetchLocationInfo();

        const sanitizedIp = sanitizeKey(rawIp);
        const sanitizedCountry = sanitizeKey(rawCountry);
        const firebaseUid = currentUser.uid; // Dapatkan UID Firebase saat ini
        const baseRef = "globalWebAnalytics/apps/gmail-dot-trick";

        // Langkah 1: Dapatkan atau buat customUid
        const customUid = await generateCustomUid(sanitizedIp, firebaseUid);
        const userPath = `users/${customUid}`;
        const userRef = ref(db, `${baseRef}/${userPath}`);

        // Langkah 2: Catat mapping antara IP -> customUid dan Firebase UID -> customUid
        // Ini penting untuk lookup di masa depan
        const ipMappingRef = ref(db, `${baseRef}/ipToCustomUid/${sanitizedIp}`);
        const uidMappingRef = ref(db, `${baseRef}/firebaseUidToCustomUid/${firebaseUid}`);

        await set(ipMappingRef, customUid);
        await set(uidMappingRef, customUid);

        // Langkah 3: Update atau buat record user utama
        const userSnapshot = await get(userRef);
        const isFirstVisit = !userSnapshot.exists();

        const timestamp = Date.now();
        const formattedDate = sanitizeDate();
        const formattedWeek = sanitizeWeek();
        const formattedMonth = sanitizeMonth();

        // Catat IP dan Firebase UID ke dalam histori user
        const ipHistoryRef = ref(db, `${baseRef}/${userPath}/IPHistory/${sanitizedIp}`);
        const uidHistoryRef = ref(db, `${baseRef}/${userPath}/FirebaseUIDHistory/${firebaseUid}`);

        await set(ipHistoryRef, { timestamp, countryCode });
        await set(uidHistoryRef, { timestamp });

        // Update UserPresence
        const userPresenceRef = ref(db, `${baseRef}/${userPath}/UserPresence`);
        const lastSeenSnapshot = await get(userPresenceRef);

        let isReturningUser = false;
        if (lastSeenSnapshot.exists()) {
            const lastSeen = lastSeenSnapshot.val().userLastSeen || 0;
            const minutesSinceLastSeen = (timestamp - lastSeen) / 60000;

            if (minutesSinceLastSeen >= 15 && !isFirstVisit) {
                isReturningUser = true;
            }
        }

        await update(userPresenceRef, {
            status: "online",
            userLastSeen: timestamp,
            LastIP: sanitizedIp, // Simpan IP terakhir
            LastFirebaseUID: firebaseUid // Simpan Firebase UID terakhir
        });

        // Langkah 4: Update Statistik menggunakan CUSTOM_UID
        const statsBase = `${baseRef}/stats`;

        // --- Unique Users (berdasarkan customUid) ---
        const dailyUniqueRef = ref(db, `${statsBase}/uniqueUsers/daily/${formattedDate}/${customUid}`);
        const weeklyUniqueRef = ref(db, `${statsBase}/uniqueUsers/weekly/${formattedWeek}/${customUid}`);
        const monthlyUniqueRef = ref(db, `${statsBase}/uniqueUsers/monthly/${formattedMonth}/${customUid}`);
        const totalUniqueRef = ref(db, `${statsBase}/uniqueUsers/total/${customUid}`);

        const [dailySnap, weeklySnap, monthlySnap, totalSnap] = await Promise.all([
            get(dailyUniqueRef),
            get(weeklyUniqueRef),
            get(monthlyUniqueRef),
            get(totalUniqueRef)
        ]);

        if (!dailySnap.exists()) {
            await set(dailyUniqueRef, true);
            await update(ref(db, `${statsBase}/uniqueUsers/daily/${formattedDate}/total`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/uniqueUsers/daily/${formattedDate}/country/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!weeklySnap.exists()) {
            await set(weeklyUniqueRef, true);
            await update(ref(db, `${statsBase}/uniqueUsers/weekly/${formattedWeek}/total`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/uniqueUsers/weekly/${formattedWeek}/country/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!monthlySnap.exists()) {
            await set(monthlyUniqueRef, true);
            await update(ref(db, `${statsBase}/uniqueUsers/monthly/${formattedMonth}/total`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/uniqueUsers/monthly/${formattedMonth}/country/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!totalSnap.exists()) {
            await set(totalUniqueRef, true);
            await update(ref(db, `${statsBase}/uniqueUsers/total/total`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/uniqueUsers/total/country/${countryCode}`), {
                count: increment(1)
            });
        }

        // --- New Users ---
        if (isFirstVisit) {
            await update(ref(db, `${statsBase}/newUsers/daily/${formattedDate}/total`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/newUsers/daily/${formattedDate}/country/${countryCode}`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/newUsers/weekly/${formattedWeek}/total`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/newUsers/weekly/${formattedWeek}/country/${countryCode}`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/newUsers/monthly/${formattedMonth}/total`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/newUsers/monthly/${formattedMonth}/country/${countryCode}`), {
                count: increment(1)
            });
        }

        // --- Online Users ---
        const dailyOnlineRef = ref(db, `${statsBase}/onlineUsers/daily/${formattedDate}/${customUid}`);
        const weeklyOnlineRef = ref(db, `${statsBase}/onlineUsers/weekly/${formattedWeek}/${customUid}`);
        const monthlyOnlineRef = ref(db, `${statsBase}/onlineUsers/monthly/${formattedMonth}/${customUid}`);

        const [dailyOnlineSnap, weeklyOnlineSnap, monthlyOnlineSnap] = await Promise.all([
            get(dailyOnlineRef),
            get(weeklyOnlineRef),
            get(monthlyOnlineRef)
        ]);

        if (!dailyOnlineSnap.exists()) {
            await set(dailyOnlineRef, true);
            await update(ref(db, `${statsBase}/onlineUsers/daily/${formattedDate}/total`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/onlineUsers/daily/${formattedDate}/country/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!weeklyOnlineSnap.exists()) {
            await set(weeklyOnlineRef, true);
            await update(ref(db, `${statsBase}/onlineUsers/weekly/${formattedWeek}/total`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/onlineUsers/weekly/${formattedWeek}/country/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!monthlyOnlineSnap.exists()) {
            await set(monthlyOnlineRef, true);
            await update(ref(db, `${statsBase}/onlineUsers/monthly/${formattedMonth}/total`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/onlineUsers/monthly/${formattedMonth}/country/${countryCode}`), {
                count: increment(1)
            });
        }

        // --- Countries (Existing logic, independent of unique/new/online/returning user counts) ---
        // Negara diambil berdasarkan IP terakhir yang digunakan user ini.
        const dailyCountryRef = ref(db, `${statsBase}/countries/daily/${formattedDate}/${countryCode}/users/${customUid}`);
        const weeklyCountryRef = ref(db, `${statsBase}/countries/weekly/${formattedWeek}/${countryCode}/users/${customUid}`);
        const monthlyCountryRef = ref(db, `${statsBase}/countries/monthly/${formattedMonth}/${countryCode}/users/${customUid}`);
        const totalCountryRef = ref(db, `${statsBase}/countries/total/${countryCode}/users/${customUid}`);

        const [dailyCountrySnap, weeklyCountrySnap, monthlyCountrySnap, totalCountrySnap] = await Promise.all([
            get(dailyCountryRef),
            get(weeklyCountryRef),
            get(monthlyCountryRef),
            get(totalCountryRef)
        ]);

        if (!dailyCountrySnap.exists()) {
            await set(dailyCountryRef, true);
            await update(ref(db, `${statsBase}/countries/daily/${formattedDate}/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!weeklyCountrySnap.exists()) {
            await set(weeklyCountryRef, true);
            await update(ref(db, `${statsBase}/countries/weekly/${formattedWeek}/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!monthlyCountrySnap.exists()) {
            await set(monthlyCountryRef, true);
            await update(ref(db, `${statsBase}/countries/monthly/${formattedMonth}/${countryCode}`), {
                count: increment(1)
            });
        }
        if (!totalCountrySnap.exists()) {
            await set(totalCountryRef, true);
            await update(ref(db, `${statsBase}/countries/total/${countryCode}`), {
                count: increment(1)
            });
        }

        // --- Returning Users ---
        if (isReturningUser) {
            await update(ref(db, `${statsBase}/returningUsers/daily/${formattedDate}/total`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/returningUsers/daily/${formattedDate}/country/${countryCode}`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/returningUsers/weekly/${formattedWeek}/total`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/returningUsers/weekly/${formattedWeek}/country/${countryCode}`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/returningUsers/monthly/${formattedMonth}/total`), {
                count: increment(1)
            });
            await update(ref(db, `${statsBase}/returningUsers/monthly/${formattedMonth}/country/${countryCode}`), {
                count: increment(1)
            });
        }

        // --- Handle User Presence (Online/Idle) ---
        if (currentUser && currentUser.uid) {
            const updateStatus = () => {
                const status = document.visibilityState === "visible" ? "online" : "idle";
                update(userPresenceRef, {
                    status: status,
                    userLastSeen: Date.now()
                });
            };

            onDisconnect(userPresenceRef).set({
                status: "offline",
                userLastSeen: timestamp
            });

            document.addEventListener("visibilitychange", updateStatus);
            updateStatus(); // Set initial status
        }

    } catch (error) {
        console.error("presence failed:", error);
        throw error;
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