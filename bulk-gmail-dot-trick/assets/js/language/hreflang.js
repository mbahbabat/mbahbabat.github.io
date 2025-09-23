(function() {
    // Cek jika sudah diinjeksi (menggunakan property window untuk state global)
    if (window.hreflangInjected) return;
    window.hreflangInjected = true;

    const alternateLinks = [
        { href: "https://mbahbabat.github.io/bulk-gmail-dot-trick", hreflang: "en" },
        { href: "https://mbahbabat.github.io/bulk-gmail-dot-trick/id", hreflang: "id" },
        { href: "https://mbahbabat.github.io/bulk-gmail-dot-trick/bn", hreflang: "bn" },
        { href: "https://mbahbabat.github.io/bulk-gmail-dot-trick/hi", hreflang: "hi" },
        { href: "https://mbahbabat.github.io/bulk-gmail-dot-trick", hreflang: "x-default" }
    ];

    function appendHreflang() {
        // Cek ulang untuk keamanan
        if (document.querySelector('link[hreflang="en"]')) return;
        
        alternateLinks.forEach(linkData => {
            const link = document.createElement('link');
            link.rel = 'alternate';
            link.href = linkData.href;
            link.hreflang = linkData.hreflang;
            document.head.appendChild(link);
        });
    }

    // Eksekusi langsung jika DOM sudah siap
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', appendHreflang);
    } else {
        appendHreflang();
    }
})();