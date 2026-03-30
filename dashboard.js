/* ============================================================
   RAJGym — dashboard.js
   Handles: Workout CRUD, localStorage persistence, API sync,
            Stats calculation, Search/filter, Motivational quotes
   ============================================================ */

   const token = localStorage.getItem("rajgym_token");
const user = JSON.parse(localStorage.getItem("rajgym_user"));
const API_BASE = 'https://rajgym-11si.onrender.com';

// ── Motivational quotes ───────────────────────────────────────
const QUOTES = [
  '🏆 <strong>Consistency beats perfection.</strong> Show up every single day.',
  '💪 <strong>No pain, no gain.</strong> Push past your limits today.',
  '🔥 <strong>Champions aren\'t born.</strong> They\'re made in the gym.',
  '⚡ <strong>Your only competition</strong> is who you were yesterday.',
  '🎯 <strong>Set a goal. Make a plan. Get to work.</strong> Win the day.',
  '💥 <strong>The body achieves</strong> what the mind believes.',
];

document.addEventListener('DOMContentLoaded', () => {

  // ── User Info ─────────────────────────────────────────────────
  const userRaw  = localStorage.getItem('rajgym_user');
  const user     = userRaw ? JSON.parse(userRaw) : null;
  const nameEl   = document.getElementById('userName');
  if (nameEl && user?.name) {
    nameEl.textContent = user.name.split(' ')[0];
  }

  // ── Current Date display ──────────────────────────────────────
  const dateEl = document.getElementById('currentDate');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // ── Set default date to today ─────────────────────────────────
  const dateInput = document.getElementById('workoutDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // ── Random motivational quote ─────────────────────────────────
  const motoText = document.getElementById('motoText');
  if (motoText) {
    motoText.innerHTML = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }

  // ── Logout ────────────────────────────────────────────────────
  ['logoutBtn', 'logoutBtnMobile'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('rajgym_token');
        localStorage.removeItem('rajgym_user');
        showToast('Logged out. See you next session! 👋', 'success');
        setTimeout(() => window.location.href = 'login.html', 1200);
      });
    }
  });

  // ── Load workouts from localStorage ──────────────────────────
  let workouts = loadWorkouts();
  renderTable(workouts);
  updateStats(workouts);

  // ── Fetch from API if token exists ────────────────────────────
  const token  = localStorage.getItem('rajgym_token');
  const userId = user?._id || 'demo';
  if (token && userId !== 'demo') {
    fetchWorkoutsFromAPI(userId, token);
  }

  // ── Quick exercise chips ──────────────────────────────────────
  document.querySelectorAll('.ex-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const exInput = document.getElementById('exercise');
      if (exInput) {
        exInput.value = chip.getAttribute('data-ex');
        exInput.focus();
        exInput.classList.remove('input-error');
        document.getElementById('exerciseErr').classList.remove('show');
      }
    });
  });

  // ── Add Workout Form ──────────────────────────────────────────
  const workoutForm = document.getElementById('workoutForm');
  if (workoutForm) {
    workoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      let valid = true;

      const exercise = document.getElementById('exercise').value.trim();
      const sets     = parseInt(document.getElementById('sets').value);
      const reps     = parseInt(document.getElementById('reps').value);
      const weight   = parseFloat(document.getElementById('weight').value) || 0;
      const date     = document.getElementById('workoutDate').value;
      const notes    = document.getElementById('notes').value.trim();

      // Validate
      if (!exercise) {
        document.getElementById('exercise').classList.add('input-error');
        document.getElementById('exerciseErr').classList.add('show');
        valid = false;
      } else {
        document.getElementById('exercise').classList.remove('input-error');
        document.getElementById('exerciseErr').classList.remove('show');
      }

      if (!sets || sets < 1 || sets > 99) {
        document.getElementById('sets').classList.add('input-error');
        document.getElementById('setsErr').classList.add('show');
        valid = false;
      } else {
        document.getElementById('sets').classList.remove('input-error');
        document.getElementById('setsErr').classList.remove('show');
      }

      if (!reps || reps < 1 || reps > 999) {
        document.getElementById('reps').classList.add('input-error');
        document.getElementById('repsErr').classList.add('show');
        valid = false;
      } else {
        document.getElementById('reps').classList.remove('input-error');
        document.getElementById('repsErr').classList.remove('show');
      }

      if (!valid) return;

      const newWorkout = {
        id:       Date.now().toString(),
        userId:   userId,
        exercise, sets, reps, weight,
        date:     date || new Date().toISOString().split('T')[0],
        notes,
        createdAt: new Date().toISOString()
      };

      // Optimistically add locally
      workouts.unshift(newWorkout);
      saveWorkouts(workouts);
      renderTable(filterWorkouts(workouts));
      updateStats(workouts);

      // Reset form
      workoutForm.reset();
      dateInput.value = new Date().toISOString().split('T')[0];
      showToast(`${exercise} logged! 💪 Keep it up!`, 'success');

      // Sync to API
      if (token && userId !== 'demo') {
        try {
          await fetch(`${API_BASE}/workout`, {
            method:  'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newWorkout)
          });
        } catch (err) {
          console.warn('API sync failed, saved locally:', err.message);
        }
      }
    });
  }

  // ── Search input ──────────────────────────────────────────────
  document.getElementById('searchInput')?.addEventListener('input', () => {
    renderTable(filterWorkouts(workouts));
  });

  // ── Date filter ───────────────────────────────────────────────
  document.getElementById('filterDate')?.addEventListener('change', () => {
    renderTable(filterWorkouts(workouts));
  });

  // ── Clear all button ──────────────────────────────────────────
  document.getElementById('clearAllBtn')?.addEventListener('click', () => {
    if (!confirm('Clear all workout history? This cannot be undone.')) return;
    workouts = [];
    saveWorkouts(workouts);
    renderTable(workouts);
    updateStats(workouts);
    showToast('Workout history cleared.', 'success');
  });

});

// ── RENDER TABLE ──────────────────────────────────────────────
function renderTable(data) {
  const tbody      = document.getElementById('workoutTableBody');
  const emptyState = document.getElementById('emptyState');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  tbody.innerHTML = data.map((w, i) => `
    <tr>
      <td style="color:var(--text-muted);font-size:.8rem;">${i + 1}</td>
      <td><span class="exercise-pill">${escHtml(w.exercise)}</span></td>
      <td><strong>${w.sets}</strong></td>
      <td><strong>${w.reps}</strong></td>
      <td>${w.weight > 0 ? w.weight + ' kg' : '—'}</td>
      <td style="color:var(--text-muted);white-space:nowrap;font-size:.82rem;">${formatDate(w.date)}</td>
      <td style="color:var(--text-muted);font-size:.8rem;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escHtml(w.notes || '')}">
        ${w.notes ? escHtml(w.notes.substring(0, 30)) + (w.notes.length > 30 ? '…' : '') : '—'}
      </td>
      <td>
        <button class="btn-delete" onclick="deleteWorkout('${w.id}')" title="Delete">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// ── DELETE WORKOUT ────────────────────────────────────────────
window.deleteWorkout = function(id) {
  let workouts = loadWorkouts();
  workouts     = workouts.filter(w => w.id !== id);
  saveWorkouts(workouts);
  renderTable(filterWorkouts(workouts));
  updateStats(workouts);
  showToast('Workout entry removed.', 'success');
};

// ── FILTER WORKOUTS ───────────────────────────────────────────
function filterWorkouts(data) {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const period = document.getElementById('filterDate')?.value || 'all';
  const today  = new Date().toISOString().split('T')[0];

  return data.filter(w => {
    const matchSearch = !search || w.exercise.toLowerCase().includes(search);
    let   matchDate   = true;
    if (period === 'today') {
      matchDate = w.date === today;
    } else if (period === 'week') {
      const d    = new Date(w.date);
      const now  = new Date();
      const diff = (now - d) / (1000 * 60 * 60 * 24);
      matchDate  = diff <= 7;
    } else if (period === 'month') {
      const d    = new Date(w.date);
      const now  = new Date();
      matchDate  = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return matchSearch && matchDate;
  });
}

// ── UPDATE STATS ──────────────────────────────────────────────
function updateStats(data) {
  const today     = new Date().toISOString().split('T')[0];
  const todayData = data.filter(w => w.date === today);

  // Total stats
  const totalSets = data.reduce((acc, w) => acc + w.sets, 0);
  const totalReps = data.reduce((acc, w) => acc + (w.sets * w.reps), 0);

  setEl('totalWorkouts', data.length);
  setEl('totalSets',     totalSets);
  setEl('totalReps',     totalReps);

  // Today strip
  const todaySets = todayData.reduce((a, w) => a + w.sets, 0);
  const todayReps = todayData.reduce((a, w) => a + (w.sets * w.reps), 0);
  setEl('todayCount', todayData.length);
  setEl('todaySets',  todaySets);
  setEl('todayReps',  todayReps);

  // Streak (consecutive days)
  const streakDays = calculateStreak(data);
  setEl('streakDays', streakDays);
}

function calculateStreak(data) {
  if (!data.length) return 0;
  const dates = [...new Set(data.map(w => w.date))].sort().reverse();
  let streak  = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (const d of dates) {
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    const diff = (current - day) / (1000 * 60 * 60 * 24);
    if (diff <= 1) { streak++; current = day; }
    else break;
  }
  return streak;
}

// ── FETCH FROM API ────────────────────────────────────────────
async function fetchWorkoutsFromAPI(userId, token) {
  try {
    const res  = await fetch(`${API_BASE}/workout/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data.workouts) && data.workouts.length > 0) {
      // Merge with local, deduplicate by id
      let local     = loadWorkouts();
      const localIds = new Set(local.map(w => w.id));
      const apiNew  = data.workouts.filter(w => !localIds.has(w.id));
      const merged  = [...apiNew, ...local];
      saveWorkouts(merged);
      renderTable(filterWorkouts(merged));
      updateStats(merged);
    }
  } catch (err) {
    console.warn('Could not fetch workouts from API:', err.message);
  }
}

// ── LOCALSTORAGE HELPERS ──────────────────────────────────────
function loadWorkouts() {
  try {
    return JSON.parse(localStorage.getItem('rajgym_workouts') || '[]');
  } catch { return []; }
}
function saveWorkouts(data) {
  localStorage.setItem('rajgym_workouts', JSON.stringify(data));
}

// ── MISC HELPERS ──────────────────────────────────────────────
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}