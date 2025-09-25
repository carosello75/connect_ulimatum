async function main() {
  const statusEl = document.getElementById('status');
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Bad response');
    const data = await res.json();
    const dt = new Date(data.time).toLocaleString();
    statusEl.textContent = `API ${data.status} at ${dt}`;
  } catch (err) {
    console.error(err);
    statusEl.textContent = 'Failed to reach API';
  }
}

document.addEventListener('DOMContentLoaded', main);





