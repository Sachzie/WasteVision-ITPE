// auth.js — simple demo auth using localStorage
const auth = (function(){
  function initRegister(){
    document.getElementById('registerBtn').addEventListener('click', register);
  }
  function initLogin(){
    document.getElementById('loginBtn').addEventListener('click', login);
  }
  function register(){
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pw = document.getElementById('regPassword').value;
    if(!email || !pw){ alert('Please fill fields'); return; }
    const user = { name, email, createdAt: new Date().toISOString() };
    localStorage.setItem('wv_user', JSON.stringify(user));
    // for demo, also store password (NOT SECURE — replace with backend later)
    localStorage.setItem('wv_pwd_'+email, pw);
    location.href = 'dashboard.html';
  }
  function login(){
    const email = document.getElementById('loginEmail').value.trim();
    const pw = document.getElementById('loginPassword').value;
    if(!email||!pw){ alert('Enter credentials'); return; }
    const saved = localStorage.getItem('wv_pwd_'+email);
    if(saved === pw){
      const user = JSON.parse(localStorage.getItem('wv_user')||'{"email":"'+email+'"}');
      user.email = email;
      localStorage.setItem('wv_user', JSON.stringify(user));
      location.href = 'dashboard.html';
    } else {
      alert('Invalid login (demo). Register or use saved credentials.');
    }
  }
  function logout(){
    localStorage.removeItem('wv_user');
    location.href = 'index.html';
  }
  return { initRegister, initLogin, logout };
})();
