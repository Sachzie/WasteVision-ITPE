// profile.js
const profile = (function(){
  function init(){
    const user = JSON.parse(localStorage.getItem('wv_user')||'{"email":"","name":""}');
    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('saveProfileBtn').addEventListener('click', save);
    document.getElementById('deleteAccountBtn').addEventListener('click', del);
  }
  function save(){
    const name = document.getElementById('profileName').value.trim();
    const user = JSON.parse(localStorage.getItem('wv_user')||'{}');
    user.name = name;
    localStorage.setItem('wv_user', JSON.stringify(user));
    alert('Profile saved (demo).');
    location.reload();
  }
  function del(){
    if(!confirm('Delete account (demo)?')) return;
    const user = JSON.parse(localStorage.getItem('wv_user')||'{}');
    localStorage.removeItem('wv_user');
    if(user.email) localStorage.removeItem('wv_history_'+user.email);
    location.href = 'index.html';
  }
  return { init };
})();
