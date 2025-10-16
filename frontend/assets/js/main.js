// main.js — component loader & global helpers
const main = (function(){
  const COMPONENT_PATH = 'components/';
  async function loadComponents(){
    await Promise.all([
      loadInto('component-navbar','navbar.html'),
      loadInto('component-sidebar','sidebar.html'),
      loadInto('component-footer','footer.html')
    ]);
    // small init
    document.getElementById('year')?.innerText = new Date().getFullYear();
    const logout = document.getElementById('logoutLink');
    if(logout) logout.onclick = (e)=>{ e.preventDefault(); auth.logout(); };
    // set nav user name from localStorage (demo)
    const user = JSON.parse(localStorage.getItem('wv_user')||'null');
    if(user) document.getElementById('navUserName')?.innerText = user.name || user.email;
    return;
  }
  async function loadInto(id, filename){
    const el = document.getElementById(id);
    if(!el) return;
    const res = await fetch(COMPONENT_PATH + filename);
    const txt = await res.text();
    el.innerHTML = txt;
  }
  return { loadComponents };
})();
