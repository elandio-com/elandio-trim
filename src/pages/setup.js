/* Setup wizard. Extracted from an inline <script> so that the
   Content-Security-Policy can drop 'unsafe-inline' from script-src. */

async function runSetup() {
    try {
        const res = await fetch('/api/setup', { method: 'POST' });
        const data = await res.json();

        if (data.success) {
            document.getElementById('setup-card').classList.add('hidden');
            document.getElementById('success-card').classList.remove('hidden');

            // Auto-redirect after 2 seconds
            setTimeout(() => {
                window.location.href = data.redirect || '/dashboard.html';
            }, 2000);
        } else {
            throw new Error(data.error || 'Setup failed');
        }
    } catch (e) {
        document.getElementById('setup-card').classList.add('hidden');
        document.getElementById('error-card').classList.remove('hidden');
        document.getElementById('error-message').textContent = e.message;
    }
}

document.getElementById('retry-btn')?.addEventListener('click', () => location.reload());

// Run setup on page load
runSetup();
