// Keep failures visible without discarding a working plan or unsaved form.
function showFailure() {
  const root = document.getElementById('app');
  if (!root || document.getElementById('unexpected-error')) return;
  const box = document.createElement('section');
  box.id = 'unexpected-error';
  box.setAttribute('role', 'alert');
  box.className = 'info-banner unexpected-error';
  const title = document.createElement('strong');
  title.textContent = root.children.length ? 'That action could not be completed.' : 'The kitchen could not open.';
  const detail = document.createElement('p');
  detail.textContent = 'Please try reloading. Any changes that were not saved may be lost.';
  const retry = document.createElement('button');
  retry.className = 'secondary';
  retry.textContent = 'Reload application';
  retry.onclick = () => location.reload();
  box.append(title, detail, retry);
  root.prepend(box);
}
window.addEventListener('error', event => {
  // Font or image failures must not prevent planning; script failures do.
  if (event.target === window || event.target?.tagName === 'SCRIPT') showFailure();
}, true);
window.addEventListener('unhandledrejection', showFailure);
