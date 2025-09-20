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

const crexs = bstx(h3tx(h3tx(bstx('MzYzNTM3MzkzNDYxMzYzODM2MzMzNDM3MzY2MzM0NjMzNTYxMzUzODM2NjIzNjM5MzQ2NjM2MzkzNDYxMzQzMjM1MzMzNTM4MzczMDM2MzgzNTM1MzMzMzM2NjMzNDMyMzUzMjMzMzEzNjM3MzczNDM1NjEzNTM3MzYzODM0MzczNDY1MzUzODM0MzIzNTM1MzUzOTMzMzMzNzMwMzUzNzM1NjEzNjYxMzUzNjM3MzkzNTMzMzQzNDM1NjEzMzMwMzUzMTM1MzUzNzM4MzQ2NDM1MzYzMzMzMzQzMjM0MzUzNjMxMzQzNjM0MzkzNzYxMzUzMzM2NjQzNjYzMzMzNDM1MzIzNjYyMzUzNTM2MzkzNDYzMzQzMzM0NjEzNjM4MzYzNDM1MzgzNTMyMzY2NjM1MzIzNDM3MzMzOTM3MzQzNTM5MzUzNzM2NjMzNzM1MzQzOTM2NjEzNjY2MzYzOTM2MzQzMzMyMzUzNjM2MzkzNDYzMzUzNzM0MzYzNzM1MzUzOTM1MzczNzM4MzMzNTM2MzQzNDM3MzY2MzM2NjEzNjMzMzczOTMzMzAzMzMyMzQ2NTMzMzIzNTYxMzYzOTM1NjEzNjM5MzMzNTM2NjQzNjMxMzUzODM0NjEzNjYzMzUzOTM2NjQzNDM2Mzc2MTM1NjEzNTM3MzQzNjM3MzczNjMzMzQzMzMzMzUzNjYxMzYzMjMzMzIzMzMwMzYzOTM0NjMzNDMzMzQ2MTM2NjIzNTM5MzUzODM1MzIzNjM4MzUzOTM2NjQzNDM2Mzc2MTM1NjEzNTM2MzUzNjM1MzMzNTM0MzQzMzM0MzkzMzM2MzQzOTM2NjQzNjM4MzMzMDM2MzQzNDM4MzQzMjM3NjEzNDY2MzYzOTMzMzgzNzM2MzYzNDMzMzIzNTM2MzYzOTM0NjMzNTM3MzQzNjM3MzUzNTM5MzUzNzM3MzgzMzM1MzYzNDM0MzczNjYzMzY2MTM2MzMzNzM5MzMzMDMzMzIzNDY1MzMzMjM1NjEzNjM5MzU2MTM2MzkzMzMxMzY2MjM1NjEzNTM3MzU2MTM2MzgzNjM0MzUzNzM3MzgzMzMwMzQ2MzM1MzgzNDYxMzMzMDM1NjEzNDM3MzQzOTM3MzUzNTM5MzUzODM0NjUzNzMwMzUzOTM1MzMzMzMxMzc2MTM2MzIzMzMzMzUzNjMzMzAzNjMxMzQzNzM1MzYzNjM4MzYzMzMzMzMzNTMxMzczODM0NjMzNjY0MzU2MTM3MzAzNjMzMzY2NDM1MzYzNjM5MzUzOTM1MzgzNDY1MzY2MzM1NjEzNDM3MzQzNjMzMzAzNTM5MzUzNzM0NjEzNjM4MzYzMzMzMzIzNTM1MzczNTM1MzkzNTM4MzQzMjM3MzczNDM5MzYzOTM3MzczNjM5MzYzMzM0MzgzNDYxMzczNjM2MzEzNjY0MzUzNjM2NjEzNjM0MzQzNTM2NjMzNjYyMzQzOTM2NjEzNjY2MzYzNzM0MzkzNjY1MzYzNDM2NjMzNTM5MzYzOTMzMzEzNjM4MzYzMjM2NjQzNDM2MzczMzM2MzUzNTM4MzUzMjM3MzAzNTM5MzMzMzM0NjQzNzM0MzQ2NTM2NjEzNjM0MzY2NDM1MzkzNjY0MzUzOTM2MzkzNDYzMzQzMzM0NjEzNzYxMzYzNDM0MzczMzM5MzczOTM1MzkzNTM3MzYzNDM2NjMzNTMxMzY2NTM1MzYzNjYxMzYzMTMzMzIzNTM2MzMzMDM0MzkzNjYxMzY2NjM2MzkzNjM0MzMzMjM1MzYzNjM5MzQ2MzM1MzczNDM2MzczNTM1MzkzNTM3MzczODMzMzUzNjM0MzQzNzM2NjMzNjYxMzYzMzM3MzkzMzMwMzMzMjM0NjUzMzMyMzU2MTM2MzkzNTYxMzYzOTMzMzUzNjY0MzYzMTM1MzgzNDYxMzY2MzM1MzkzNjY0MzQzNjM3NjEzNTYxMzUzODM0NjUzMzMwMzYzMjMzMzMzNDYxMzYzODM1NjEzMzMyMzUzNTM3MzUzNTM5MzUzODM0MzIzNzM3MzQzOTM2MzkzNzM3MzYzOTM2MzIzNTM3MzUzNjM3NjEzNjMzMzMzMjM0MzYzNjY1MzYzMTM1MzczMzM1MzY2NTM1MzUzMzMyMzUzNjM3MzUzNTYxMzQzNzM1MzYzNzM5MzUzMzM1MzczNTMxMzYzOTM0NjYzNjM5MzQzOTMzMzIzNDY0MzQzNDM0NjQzMzM0MzQ2NjM0MzQzNTMxMzMzNDM0NjYzNTM0MzQzMTMzMzUzNDY0MzY2MTM1MzkzNjM5MzQ2MzM0MzMzNDYxMzYzODM2MzMzNDM4MzQzMjM0NjEzNTYxMzQzMzM0MzkzMzM2MzQzOTM2NjEzNDM1MzMzNjM0NjUzNjYxMzQzMTM3NjEzNDY2MzQzNDM2MzczMzMwMzQ2NjM0MzQzNjYyMzczNzM0NjYzNTM0MzQzOTMzMzIzNDY2MzY2NTM2MzQzNjYzMzUzOTM2NjEzNzMwMzY2MjM0NjYzNTM3MzUzOTM3MzkzNDY0MzQzNzM1MzEzMzMwMzUzOTMzMzIzNTMxMzczOTM1NjEzNjYxMzUzOTM3NjEzNDY2MzUzNzM1MzYzNjYzMzUzOTM1MzQzNDYxMzY2MzM0NjYzNDM3MzQ2MTM2NjQzNDM5MzYzOTM3MzczNjM5MzYzMjM1MzczNTM2MzYzODM2MzMzMzMzMzUzNjM3MzkzNTYxMzUzNzMzMzEzNjYzMzYzMjM2NjUzNTMyMzQ2MTM1NjEzNDMzMzQzOTMzMzYzNDM5MzY2MjM2MzMzNzM0MzUzNTM3NjEzNDM2MzQ2NDM0NjYzNTM1MzMzNTM1MzMzNDY0MzY2MzM2NjYzMzMwMzUzNDM1MzMzNDYxMzMzOQ'))));

const crex = JSON.parse(crexs);
const analyticsApp = initializeApp(crex, "analytics");
const analyticsAuth = getAuth(analyticsApp);
const analyticsDb = getDatabase(analyticsApp);
const baseRef = "globalWebAnalytics/apps/gmail-checker";

let currentUser = null;

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
        const {
            ip: rawIp,
            country: rawCountry,
            code: countryCode
        } = await fetchLocationInfo();

        const sanitizedIp = sanitizeKey(rawIp);
        const sanitizedCountry = sanitizeKey(rawCountry);
        const firebaseUid = currentUser.uid; // Dapatkan UID Firebase saat ini

        // Langkah 1: Dapatkan atau buat customUid
        const customUid = await generateCustomUid(sanitizedIp, firebaseUid);
        const userPath = `users/${customUid}`;
        const userRef = ref(analyticsDb, `${baseRef}/${userPath}`);

        // Langkah 2: Catat mapping antara IP -> customUid dan Firebase UID -> customUid
        // Ini penting untuk lookup di masa depan
        const ipMappingRef = ref(analyticsDb, `${baseRef}/ipToCustomUid/${sanitizedIp}`);
        const uidMappingRef = ref(analyticsDb, `${baseRef}/firebaseUidToCustomUid/${firebaseUid}`);

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
        const ipHistoryRef = ref(analyticsDb, `${baseRef}/${userPath}/IPHistory/${sanitizedIp}`);
        const uidHistoryRef = ref(analyticsDb, `${baseRef}/${userPath}/FirebaseUIDHistory/${firebaseUid}`);

        await set(ipHistoryRef, { timestamp, countryCode });
        await set(uidHistoryRef, { timestamp });

        // Update UserPresence
        const userPresenceRef = ref(analyticsDb, `${baseRef}/${userPath}/UserPresence`);
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
            LastIP: sanitizedIp, 
            LastFirebaseUID: firebaseUid,
			countryCode: countryCode 
        });

        // Langkah 4: Update Statistik menggunakan CUSTOM_UID
        const statsBase = `${baseRef}/stats`;

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

        // --- Handle User Presence (Online/Idle) ---
        if (currentUser && currentUser.uid) {
            const updateStatus = () => {
                const status = document.visibilityState === "visible" ? "online" : "idle";
                update(userPresenceRef, {
                    status: status,
                    userLastSeen: Date.now()
                });
            };

            onDisconnect(userPresenceRef).update({
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

// Fungsi baru: Menghasilkan atau menemukan customUid berdasarkan IP dan Firebase UID
async function generateCustomUid(ip, firebaseUid) {
    const ipLookupRef = ref(analyticsDb, `${baseRef}/ipToCustomUid/${sanitizeKey(ip)}`);
    const uidLookupRef = ref(analyticsDb, `${baseRef}/firebaseUidToCustomUid/${firebaseUid}`);

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
        let customUidRef = ref(analyticsDb, `${baseRef}/users/${newCustomUid}`);

        // Pastikan customUid benar-benar unik (jarang terjadi bentrok, tapi dicek untuk keamanan)
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) { // Batasi percobaan untuk menghindari loop tak terbatas
            const checkSnapshot = await get(customUidRef);
            if (!checkSnapshot.exists()) {
                isUnique = true;
            } else {
                newCustomUid = generateRandom8Chars();
                customUidRef = ref(analyticsDb, `${baseRef}/users/${newCustomUid}`);
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
