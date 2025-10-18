

const lastUpdateMap = new Map();

/**
 * Melakukan sinkronisasi data pengguna dengan server melalui SATU panggilan API.
 * Fungsi ini sekarang UTAMANYA untuk membuat/memperbarui profil pengguna saat login
 * atau saat diperlukan pembaruan penuh. Status aktivitas real-time ditangani
 * secara otomatis oleh koneksi WebSocket.
 */
async function syncUser( workerUrl , user, options = { forceFullUpdate: false }) {

    // Logika throttling masih berguna untuk mencegah panggilan berlebihan yang tidak disengaja
    const now = Date.now();
    const lastUpdate = lastUpdateMap.get(user.uid) || 0;

    if (!options.forceFullUpdate && now - lastUpdate < 60000) { // Jeda bisa diperpanjang
        return lastUpdateMap.get(user.uid + '_userId');
    }

    try {
        const response = await fetch(`${workerUrl}/sync-user`, { 
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await user.getIdToken()}`
            },
            body: JSON.stringify({
                forceFullUpdate: options.forceFullUpdate,
                clientTimestamp: Date.now() 
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`User sync failed with status ${response.status}: ${errorData}`);
        }

        const result = await response.json();
        const userId = result.userId;

        if (!userId) {
            throw new Error("Server did not return valid userId");
        }

        lastUpdateMap.set(user.uid, now);
        lastUpdateMap.set(user.uid + '_userId', userId);
        
        return userId;

    } catch (error) {
        console.error("User sync failed:", error);
        const cachedUserId = lastUpdateMap.get(user.uid + '_userId');
        if (cachedUserId) {
            console.warn("Using cached userId due to sync error");
            return cachedUserId;
        }
        const cooldown = 5000;
        lastUpdateMap.set(user.uid, now - 30000 + cooldown);
        return null;
    }
}

export {
	syncUser
};


