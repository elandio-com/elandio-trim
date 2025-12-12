const API_BASE = window.location.origin;

// State
let links = [];
let adminToken = sessionStorage.getItem('admin_token');
let deleteSlugTarget = null;
let useRootPath = true; // Always true for dedicated domain mode // Will be detected from server response
let allLinks = []; // Store all links for client-side pagination/filtering
let filteredLinks = []; // Links after search filter
let currentPage = 1;
const itemsPerPage = 8; // Fits well on screen
let searchQuery = ''; // Current search term

// DOM Elements
const authModal = document.getElementById('auth-modal');
const dashboard = document.getElementById('dashboard');
const tokenInput = document.getElementById('admin-token');
const loginBtn = document.getElementById('login-btn');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');
const sidebarLogoutBtn = document.querySelector('aside #logout-btn');

const createForm = document.getElementById('create-form');
const createResult = document.getElementById('create-result');
const createError = document.getElementById('create-error');
const linksList = document.getElementById('links-list');
const refreshBtn = document.getElementById('refresh-btn');

// Pagination Elements
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const paginationInfo = document.getElementById('pagination-info');
const searchInput = document.getElementById('search-links');

// Stats Elements
const statsTotalLinks = document.getElementById('stats-total-links');
const statsTotalClicks = document.getElementById('stats-total-clicks');
const statsTopLink = document.getElementById('stats-top-link');
const statsTopClicks = document.getElementById('stats-top-clicks');

// Edit Modal
const editModal = document.getElementById('edit-modal');
const editSlugInput = document.getElementById('edit-slug');
const editUrlInput = document.getElementById('edit-url');
const saveEditBtn = document.getElementById('save-edit');
const cancelEditBtn = document.getElementById('cancel-edit');
const settingsForm = document.getElementById('settings-form');
const fallbackUrlInput = document.getElementById('fallback-url-input');
const customDomainInput = document.getElementById('custom-domain-input');

// Modals
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const pathWarningModal = document.getElementById('path-warning-modal');
const confirmPathChangeBtn = document.getElementById('confirm-path-change-btn');
const cancelPathChangeBtn = document.getElementById('cancel-path-change-btn');


// Init
// Init
function init() {
    // effective-load check
    if (!adminToken) {
        adminToken = sessionStorage.getItem('admin_token');
    }

    if (adminToken) {
        showDashboard();
        fetchLinks();
        loadSettings();
    } else {
        showAuth();
    }
}

function showAuth() {
    authModal.classList.remove('hidden');
    dashboard.classList.add('hidden');
    tokenInput.focus();
}

function showDashboard() {
    authModal.classList.add('hidden');
    dashboard.classList.remove('hidden');
}

// Tabs
window.switchTab = (tab) => {
    // Hide all sections
    ['overview', 'settings'].forEach(t => {
        document.getElementById(`section-${t}`).classList.add('hidden');
        document.getElementById(`nav-${t}`).classList.remove('bg-brand-50', 'text-brand-700');
        document.getElementById(`nav-${t}`).classList.add('text-slate-600', 'hover:bg-slate-50');
    });

    // Show selected
    document.getElementById(`section-${tab}`).classList.remove('hidden');
    document.getElementById(`nav-${tab}`).classList.add('bg-brand-50', 'text-brand-700');
    document.getElementById(`nav-${tab}`).classList.remove('text-slate-600', 'hover:bg-slate-50');

    // Load settings when switching to settings tab
    if (tab === 'settings') {
        loadSettings();
    }
}

// Auth Logic
// Auth Logic
async function validateLogin() {
    const token = tokenInput.value.trim();
    if (!token) {
        showToast('Please enter a token', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        if (res.ok) {
            adminToken = token;
            sessionStorage.setItem('admin_token', token);
            authError.classList.add('hidden');
            showDashboard();
            fetchLinks();
            loadSettings();
        } else {
            authError.classList.remove('hidden');
            tokenInput.value = '';
            tokenInput.focus();
        }
    } catch (e) {
        showToast('Login failed', 'error');
        authError.classList.remove('hidden');
    }
};
loginBtn.addEventListener('click', validateLogin);

tokenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        validateLogin();
    }
});

// Toggle Password Visibility
const togglePasswordBtn = document.getElementById('toggle-password');
const eyeIcon = document.getElementById('eye-icon');
const eyeOffIcon = document.getElementById('eye-off-icon');

togglePasswordBtn.addEventListener('click', () => {
    const isPassword = tokenInput.type === 'password';
    tokenInput.type = isPassword ? 'text' : 'password';

    if (isPassword) {
        eyeIcon.classList.add('hidden');
        eyeOffIcon.classList.remove('hidden');
    } else {
        eyeIcon.classList.remove('hidden');
        eyeOffIcon.classList.add('hidden');
    }
});

const handleLogout = () => {
    adminToken = '';
    sessionStorage.removeItem('admin_token');
    showAuth();
};
logoutBtn.addEventListener('click', handleLogout);
sidebarLogoutBtn.addEventListener('click', handleLogout);

// Loading State
function showLoading(show = true) {
    if (show) {
        linksList.innerHTML = `
            <tr class="bg-white">
                <td colspan="5" class="p-8 text-center text-slate-500">
                    <svg class="animate-spin h-8 w-8 mx-auto mb-2 text-brand-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading links...
                </td>
            </tr>`;
    }
}

// Toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg text-white font-medium transform transition-all duration-300 translate-y-10 opacity-0 ${type === 'error' ? 'bg-red-500' : 'bg-brand-600'} z-50`;
    toast.innerText = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
    });

    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Fetch Links
async function fetchLinks() {
    showLoading(true);
    try {
        const res = await fetch(`${API_BASE}/api/admin/list`, {
            headers: { 'Authorization': adminToken }
        });

        if (res.status === 401) throw new Error('Unauthorized');

        const links = await res.json();
        allLinks = links; // Store for pagination
        filteredLinks = links; // Initially show all

        updateStats();
        renderLinksPage(1); // Render first page
    } catch (e) {
        if (e.message === 'Unauthorized') {
            authError.classList.remove('hidden');
            showAuth();
        } else {
            console.error(e);
            linksList.innerHTML = `<tr class="bg-white"><td colspan="5" class="p-8 text-center text-red-500 bg-red-50">Error loading links: ${e.message}</td></tr>`;
        }
    }
}

// Settings
async function loadSettings() {
    try {
        const res = await fetch(`${API_BASE}/api/admin/settings`, {
            headers: { 'Authorization': adminToken }
        });

        if (res.status === 401) throw new Error('Unauthorized');

        if (res.ok) {
            const data = await res.json();

            // Handle Fallback
            if (data.fallback_url) {
                fallbackUrlInput.value = data.fallback_url;
            }
        }
    } catch (e) {
        if (e.message === 'Unauthorized') {
            showAuth();
        } else {
            console.error('Failed to load settings', e);
        }
    }
}

// Watch for mode changes to show warning or triggers
document.querySelectorAll('input[name="path_mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        // Did it actually change from saved state?
        const newValue = e.target.value === 'true';
        if (newValue !== useRootPath) {
            // Show warning
            pathWarningModal.classList.remove('hidden', 'opacity-0');
            setTimeout(() => {
                pathWarningModal.querySelector('div').classList.remove('scale-95');
                pathWarningModal.querySelector('div').classList.add('scale-100');
            }, 10);
        }
    });
});

cancelPathChangeBtn.addEventListener('click', () => {
    // Revert UI to match saved state
    const savedRadio = document.querySelector(`input[name="path_mode"][value="${useRootPath}"]`);
    if (savedRadio) savedRadio.checked = true;
    closePathModal();
});

confirmPathChangeBtn.addEventListener('click', () => {
    // Just close modal, let them save.
    // Maybe update the warning text to say "Pending Save"
    closePathModal();
});

function closePathModal() {
    pathWarningModal.classList.add('opacity-0');
    pathWarningModal.querySelector('div').classList.add('scale-95');
    pathWarningModal.querySelector('div').classList.remove('scale-100');
    setTimeout(() => pathWarningModal.classList.add('hidden'), 200);
}


function togglePathModeUI(isRoot) {
    if (isRoot) {
        pathModeOn.classList.remove('hidden');
        pathModeOff.classList.add('hidden');
    } else {
        pathModeOn.classList.add('hidden');
        pathModeOff.classList.remove('hidden');
    }
}

settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const settings = {
        fallback_url: fallbackUrlInput.value.trim()
    };

    try {
        const res = await fetch(`${API_BASE}/api/admin/settings`, {
            method: 'PUT',
            headers: {
                'Authorization': adminToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings)
        });

        if (res.ok) {
            showToast('Settings saved successfully!');
            fetchLinks(); // Reload to update link display formats
        } else {
            throw new Error('Failed to update');
        }
    } catch (e) {
        showToast(e.message, 'error');
    }
});

// Update Stats Cards
function updateStats() {
    statsTotalLinks.textContent = allLinks.length;
    const totalClicks = allLinks.reduce((sum, link) => sum + (link.clicks || 0), 0);
    statsTotalClicks.textContent = totalClicks;

    if (allLinks.length > 0) {
        const topLink = [...allLinks].sort((a, b) => b.clicks - a.clicks)[0];
        statsTopLink.textContent = topLink.slug;
        statsTopClicks.textContent = topLink.clicks;
    } else {
        statsTopLink.textContent = '-';
        statsTopClicks.textContent = '0';
    }
}

// Search/Filter Logic
function filterLinks(query) {
    searchQuery = query.toLowerCase().trim();

    if (!searchQuery) {
        filteredLinks = allLinks;
    } else {
        filteredLinks = allLinks.filter(link =>
            link.slug.toLowerCase().includes(searchQuery) ||
            link.target_url.toLowerCase().includes(searchQuery)
        );
    }

    renderLinksPage(1); // Reset to first page after search
}

// Search input handler
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        filteredLinks = allLinks.filter(link =>
            link.slug.toLowerCase().includes(searchQuery) ||
            link.target_url.toLowerCase().includes(searchQuery)
        );
        renderLinksPage(1);
    });
}



// Pagination Logic
function renderLinksPage(page) {
    currentPage = page;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const items = filteredLinks.slice(start, end);
    const totalPages = Math.ceil(filteredLinks.length / itemsPerPage) || 1;

    renderTableRows(items);

    // Update controls
    const showingStart = filteredLinks.length > 0 ? start + 1 : 0;
    const showingEnd = Math.min(end, filteredLinks.length);

    if (searchQuery) {
        paginationInfo.textContent = `Showing ${showingStart} to ${showingEnd} of ${filteredLinks.length} (filtered from ${allLinks.length})`;
    } else {
        paginationInfo.textContent = `Showing ${showingStart} to ${showingEnd} of ${filteredLinks.length}`;
    }

    prevPageBtn.disabled = page === 1;
    nextPageBtn.disabled = page >= totalPages;
    prevPageBtn.classList.toggle('opacity-50', page === 1);
    nextPageBtn.classList.toggle('opacity-50', page >= totalPages);
}

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) renderLinksPage(currentPage - 1);
});

nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredLinks.length / itemsPerPage);
    if (currentPage < totalPages) renderLinksPage(currentPage + 1);
});

function renderTableRows(links) {
    if (links.length === 0) {
        linksList.innerHTML = '<tr class="bg-white"><td colspan="5" class="p-8 text-center text-slate-400">No links found. Create one above!</td></tr>';
        return;
    }

    const pathPrefix = useRootPath ? '' : '/r';
    linksList.innerHTML = links.map(link => {
        // Clean double slashes just in case
        const shortPath = `/${link.slug}`.replace('//', '/');
        const shortUrl = `${window.location.host}/${link.slug}`;
        return `
        <tr class="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
            <td class="px-6 py-4 font-medium text-brand-600">
                <a href="/${link.slug}" target="_blank" class="flex items-center hover:underline">
                    /${link.slug}
                </a>
            </td>
            <td class="px-6 py-4">
                <div class="text-slate-500 truncate max-w-xs" title="${link.target_url}">${link.target_url}</div>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded-full">${link.clicks}</span>
            </td>
            <td class="px-6 py-4 text-slate-400 text-xs">
                ${new Date(link.created_at).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end space-x-2">
                    <button class="action-btn-copy p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Copy" data-url="${shortUrl}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                    <button class="action-btn-edit p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit" data-slug="${link.slug}" data-url="${link.target_url}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>
                    <button class="action-btn-delete p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete" data-slug="${link.slug}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
}

// Event Delegation for Action Buttons
linksList.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.classList.contains('action-btn-copy')) {
        const url = btn.dataset.url;
        window.copyLink(url);
    } else if (btn.classList.contains('action-btn-edit')) {
        const slug = btn.dataset.slug;
        const url = btn.dataset.url;
        window.openEdit(slug, url);
    } else if (btn.classList.contains('action-btn-delete')) {
        const slug = btn.dataset.slug;
        window.openDelete(slug);
    }
});

// Create Link
createForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    createResult.classList.add('hidden');
    createError.classList.add('hidden');

    const targetUrl = document.getElementById('target-url').value.trim();
    const customSlug = document.getElementById('custom-slug').value.trim();

    if (!targetUrl) {
        showToast('Please enter a URL', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/admin/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': adminToken
            },
            body: JSON.stringify({ url: targetUrl, slug: customSlug })
        });

        if (res.status === 401) throw new Error('Unauthorized');

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt);
        }

        const data = await res.json();
        // Success
        document.getElementById('target-url').value = '';
        document.getElementById('custom-slug').value = '';

        showToast('Link created successfully!');
        fetchLinks();
    } catch (e) {
        if (e.message === 'Unauthorized') {
            showAuth();
        } else {
            showToast(e.message, 'error');
        }
    }
});

// Delete Logic with Modal
window.openDelete = (slug) => {
    deleteSlugTarget = slug;
    document.getElementById('delete-link-slug').textContent = slug;
    deleteModal.classList.remove('hidden', 'opacity-0');
    setTimeout(() => {
        deleteModal.querySelector('div').classList.remove('scale-95');
        deleteModal.querySelector('div').classList.add('scale-100');
    }, 10);
};

cancelDeleteBtn.addEventListener('click', () => {
    closeDeleteModal();
});

confirmDeleteBtn.addEventListener('click', async () => {
    if (!deleteSlugTarget) return;

    // Optimistic UI update could go here, but let's wait for safety
    try {
        const res = await fetch(`${API_BASE}/api/admin/${deleteSlugTarget}`, {
            method: 'DELETE',
            headers: { 'Authorization': adminToken }
        });

        if (res.ok) {
            showToast('Link deleted');
            closeDeleteModal();
            // Refresh logic
            allLinks = allLinks.filter(l => l.slug !== deleteSlugTarget);
            filteredLinks = filteredLinks.filter(l => l.slug !== deleteSlugTarget);
            updateStats();
            renderLinksPage(currentPage);

            if (filteredLinks.length > 0 && currentPage > Math.ceil(filteredLinks.length / itemsPerPage)) {
                renderLinksPage(currentPage - 1);
            }
        } else {
            throw new Error('Failed to delete');
        }
    } catch (e) {
        showToast(e.message, 'error');
    }
});

function closeDeleteModal() {
    deleteModal.classList.add('opacity-0');
    deleteModal.querySelector('div').classList.add('scale-95');
    deleteModal.querySelector('div').classList.remove('scale-100');
    setTimeout(() => {
        deleteModal.classList.add('hidden');
        deleteSlugTarget = null;
    }, 200);
}

// Edit Logic
window.openEdit = (slug, url) => {
    editSlugInput.value = slug;
    editUrlInput.value = url;
    editModal.classList.remove('hidden', 'opacity-0');
    setTimeout(() => {
        editModal.querySelector('div').classList.remove('scale-95');
        editModal.querySelector('div').classList.add('scale-100');
    }, 10);
};

cancelEditBtn.addEventListener('click', () => {
    closeEditModal();
});

function closeEditModal() {
    editModal.classList.add('opacity-0');
    editModal.querySelector('div').classList.add('scale-95');
    editModal.querySelector('div').classList.remove('scale-100');
    setTimeout(() => editModal.classList.add('hidden'), 200);
}

saveEditBtn.addEventListener('click', async () => {
    const slug = editSlugInput.value;
    const url = editUrlInput.value;
    try {
        const res = await fetch(`${API_BASE}/api/admin/${slug}`, {
            method: 'PUT',
            headers: {
                'Authorization': adminToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        });
        if (res.ok) {
            closeEditModal();
            showToast('Link updated');

            // Update local state
            const idx = allLinks.findIndex(l => l.slug === slug);
            if (idx !== -1) {
                allLinks[idx].target_url = url;
                // Update filtered list too
                const filteredIdx = filteredLinks.findIndex(l => l.slug === slug);
                if (filteredIdx !== -1) filteredLinks[filteredIdx].target_url = url;
                renderLinksPage(currentPage);
            }
        } else {
            throw new Error('Failed to update');
        }
    } catch (e) {
        showToast(e.message, 'error');
    }
});

window.copyLink = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
};

refreshBtn.addEventListener('click', () => {
    const btn = document.getElementById('refresh-btn');
    btn.firstChild.classList.add('animate-spin'); // spin icon
    fetchLinks().finally(() => setTimeout(() => btn.firstChild.classList.remove('animate-spin'), 500));
});

// Mobile Menu Logic
const sidebar = document.getElementById('sidebar');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

function toggleSidebar() {
    if (!sidebar) return;
    const isClosed = sidebar.classList.contains('-translate-x-full');
    if (isClosed) {
        // Open
        sidebar.classList.remove('-translate-x-full');
        if (mobileMenuOverlay) {
            mobileMenuOverlay.classList.remove('hidden');
            setTimeout(() => mobileMenuOverlay.classList.remove('opacity-0'), 10);
        }
    } else {
        // Close
        sidebar.classList.add('-translate-x-full');
        if (mobileMenuOverlay) {
            mobileMenuOverlay.classList.add('opacity-0');
            setTimeout(() => mobileMenuOverlay.classList.add('hidden'), 300);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('mobile-menu-btn');
    if (btn) btn.addEventListener('click', toggleSidebar);

    const closeBtn = document.getElementById('close-sidebar-btn');
    if (closeBtn) closeBtn.addEventListener('click', toggleSidebar);

    const overlay = document.getElementById('mobile-menu-overlay');
    if (overlay) overlay.addEventListener('click', toggleSidebar);
});

// Init
init();
