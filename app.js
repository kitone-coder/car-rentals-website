// ==========================
// SUPABASE CONFIG
// ==========================
const SUPABASE_URL = "https://tzygochlibduxubsblzd.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GVnQsJLt8IzlyOUAL48Kmg_kdLxPzxH";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================
// HELPER — show status message
// ==========================
function showStatus(message, type = 'success') {
    const box = document.getElementById('status-box');
    if (!box) return;
    box.style.display = 'block';
    box.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-error');
    box.innerHTML = message;
    // Scroll to top of page so user sees the message
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================
// CONTACT FORM — POST to Supabase
// ==========================
const enquiryForm = document.getElementById('enquiryForm');

if (enquiryForm) {
    enquiryForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const btn = enquiryForm.querySelector('button[type="submit"]');
        btn.textContent = 'Sending...';
        btn.disabled = true;

        // Collect checkbox values
        const checkboxes = enquiryForm.querySelectorAll('input[type="checkbox"]:checked');
        const heard_from = Array.from(checkboxes).map(cb => cb.value).join(', ');

        // Collect radio value
        const purposeRadio = enquiryForm.querySelector('input[name="purpose"]:checked');
        const purpose = purposeRadio ? purposeRadio.value : '';

        // Build the data object — matches your Supabase table columns
        const formData = {
            first_name:      document.getElementById('first_name').value.trim(),
            last_name:       document.getElementById('last_name').value.trim(),
            email:           document.getElementById('email').value.trim(),
            phone:           document.getElementById('phone').value.trim(),
            vehicle:         document.getElementById('vehicle').value,
            pickup_date:     document.getElementById('pickup_date').value || null,
            return_date:     document.getElementById('return_date').value || null,
            pickup_location: document.getElementById('pickup_location').value,
            purpose:         purpose,
            heard_from:      heard_from,
            message:         document.getElementById('message').value.trim(),
        };

        try {
            const { data, error } = await client
                .from('enquiries')   // your Supabase table name
                .insert([formData]);

            if (error) {
                console.error('Supabase error:', error);
                showStatus('❌ Error saving your enquiry: ' + error.message, 'error');
                btn.textContent = 'Send Enquiry →';
                btn.disabled = false;
                return;
            }

            // Success
            showStatus(`✅ Thank you, ${formData.first_name}! Your enquiry has been received. We will contact you within the hour.`, 'success');
            enquiryForm.reset();

        } catch (err) {
            console.error('JavaScript error:', err);
            showStatus('❌ Something went wrong: ' + err.message, 'error');
        }

        btn.textContent = 'Send Enquiry →';
        btn.disabled = false;
    });
}

// ==========================
// ADMIN PAGE — FETCH from Supabase
// ==========================
async function loadEnquiries() {
    const tbody     = document.getElementById('enquiries-tbody');
    const countBadge = document.getElementById('enquiries-count');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;color:var(--muted);padding:2rem;">Loading...</td></tr>';

    const { data, error } = await client
        .from('enquiries')
        .select('*')
        .order('submitted_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="12" style="color:#f87171;padding:1rem;">Error: ${error.message}</td></tr>`;
        return;
    }

    if (countBadge) countBadge.textContent = data.length + ' records';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;color:var(--muted);padding:2rem;">No enquiries yet.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(row => `
        <tr>
            <td>${row.id}</td>
            <td>${row.first_name} ${row.last_name}</td>
            <td><a href="mailto:${row.email}" style="color:#bfc5cc;text-decoration:none;">${row.email}</a></td>
            <td>${row.phone || '—'}</td>
            <td>${row.vehicle || '—'}</td>
            <td>${row.pickup_date ? formatDate(row.pickup_date) : '—'}</td>
            <td>${row.return_date ? formatDate(row.return_date) : '—'}</td>
            <td>${row.pickup_location || '—'}</td>
            <td>${row.purpose || '—'}</td>
            <td>${row.heard_from || '—'}</td>
            <td class="msg-cell" title="${row.message || ''}">${row.message || '—'}</td>
            <td style="white-space:nowrap;">${row.submitted_at ? formatDate(row.submitted_at) : '—'}</td>
        </tr>
    `).join('');
}

async function loadNewsletter() {
    const tbody      = document.getElementById('newsletter-tbody');
    const countBadge = document.getElementById('newsletter-count');
    if (!tbody) return;

    const { data, error } = await client
        .from('newsletter')
        .select('*')
        .order('signed_up_at', { ascending: false });

    if (error) {
        tbody.innerHTML = `<tr><td colspan="3" style="color:#f87171;padding:1rem;">Error: ${error.message}</td></tr>`;
        return;
    }

    if (countBadge) countBadge.textContent = data.length + ' records';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--muted);padding:2rem;">No subscribers yet.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(row => `
        <tr>
            <td>${row.id}</td>
            <td><a href="mailto:${row.email}" style="color:#bfc5cc;text-decoration:none;">${row.email}</a></td>
            <td>${row.signed_up_at ? formatDate(row.signed_up_at) : '—'}</td>
        </tr>
    `).join('');
}

// ==========================
// SEARCH filter on admin page
// ==========================
function filterTable() {
    const search = document.getElementById('search-input')?.value.toLowerCase() || '';
    const rows   = document.querySelectorAll('#enquiries-tbody tr');
    rows.forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(search) ? '' : 'none';
    });
}

// ==========================
// DATE FORMATTER
// ==========================
function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ==========================
// RUN on admin page load
// ==========================
if (document.getElementById('enquiries-tbody')) {
    loadEnquiries();
    loadNewsletter();

    // Search box live filter
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', filterTable);
    }
}
