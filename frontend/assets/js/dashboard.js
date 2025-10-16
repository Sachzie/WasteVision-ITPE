// dashboard.js — handles upload, preview, showing result and history
const dashboard = (function(){
  const latestKey = 'wv_latest_detection';
  function init(){
    bindUI();
    showGreeting();
    loadRecentSnippet();
  }
  function bindUI(){
    document.getElementById('detectBtn').addEventListener('click', onDetect);
    document.getElementById('saveHistoryBtn').addEventListener('click', saveLatestToHistory);
    const fileInput = document.getElementById('wasteFile');
    fileInput.addEventListener('change', e => {
      const f = e.target.files[0];
      if(!f) return;
      const img = document.getElementById('previewImage');
      img.src = URL.createObjectURL(f);
      document.getElementById('previewWrap').style.display = 'block';
    });
  }
  async function onDetect(){
    const file = document.getElementById('wasteFile').files[0];
    if(!file) return alert('Please choose an image.');
    setResultLoading();
    try{
      const data = await api.identify(file);
      // normalize response — expecting either custom_model & default_model or detections
      const normalized = normalizeResponse(data);
      displayResult(normalized);
      localStorage.setItem(latestKey, JSON.stringify(normalized));
      loadRecentSnippet();
    }catch(err){
      displayError(err.message);
    }
  }
  function normalizeResponse(data){
    // Accept multiple formats. Try to map to { detections: [...], image: 'data:image/...' }
    if(data.custom_model && data.custom_model.detections){
      return { detections: data.custom_model.detections, image: data.custom_model.image || null, raw: data };
    }
    if(data.detections) return { detections: data.detections, image: data.image||null, raw:data };
    // fallback
    return { detections: [], image: data.image||null, raw: data };
  }
  function setResultLoading(){
    const container = document.getElementById('resultContent');
    container.innerHTML = '<p class="muted">Processing... please wait.</p>';
  }
  function displayResult(res){
    const c = document.getElementById('resultContent');
    c.innerHTML = '';
    if(res.image){
      const img = document.createElement('img'); img.src = res.image; img.className='preview-img';
      c.appendChild(img);
    }
    if(!res.detections || res.detections.length===0){
      const p = document.createElement('p'); p.className='muted'; p.innerText='No items detected.';
      c.appendChild(p); return;
    }
    res.detections.forEach(item=>{
      const d = document.createElement('div'); d.className='det-item';
      d.innerHTML = `<strong>${item.item||item.label||'Object'}</strong> — ${item.type||item.category||'Unknown'} • ${(item.confidence? (item.confidence*100).toFixed(1):'')}%`;
      c.appendChild(d);
    });
  }
  function displayError(msg){
    const c = document.getElementById('resultContent');
    c.innerHTML = `<p style="color:crimson">${msg}</p>`;
  }
  function saveLatestToHistory(){
    const latest = JSON.parse(localStorage.getItem(latestKey)||'null');
    if(!latest){ alert('No latest detection to save.'); return; }
    const user = JSON.parse(localStorage.getItem('wv_user')||'{}');
    const key = 'wv_history_' + (user.email || 'guest');
    const arr = JSON.parse(localStorage.getItem(key)||'[]');
    arr.unshift({ id: Date.now(), createdAt: new Date().toISOString(), data: latest });
    localStorage.setItem(key, JSON.stringify(arr));
    alert('Saved to history.');
    loadRecentSnippet();
  }
  function loadRecentSnippet(){
    const user = JSON.parse(localStorage.getItem('wv_user')||'{}');
    const key = 'wv_history_' + (user.email || 'guest');
    const arr = JSON.parse(localStorage.getItem(key)||'[]');
    const container = document.getElementById('recentList');
    if(!container) return;
    container.innerHTML = '';
    if(arr.length===0){ container.innerText = 'No recent uploads.'; return; }
    arr.slice(0,4).forEach(item=>{
      const el = document.createElement('div'); el.className='recent-item';
      const img = document.createElement('img'); img.src = item.data.image || ''; img.style.maxHeight='70px'; img.style.objectFit='cover';
      const label = document.createElement('div'); label.style.fontSize='12px'; label.innerText = item.data.detections && item.data.detections[0] ? item.data.detections[0].item : 'Detection';
      el.appendChild(img); el.appendChild(label);
      container.appendChild(el);
    });
  }
  // history page loader
  function loadHistoryPage(){
    const user = JSON.parse(localStorage.getItem('wv_user')||'{}');
    const key = 'wv_history_' + (user.email || 'guest');
    const arr = JSON.parse(localStorage.getItem(key)||'[]');
    const cont = document.getElementById('historyContainer');
    if(!cont) return;
    cont.innerHTML = '';
    if(arr.length===0){ cont.innerText = 'No saved detections yet.'; return; }
    arr.forEach(item=>{
      const card = document.createElement('div'); card.className='card';
      const img = document.createElement('img'); img.src = item.data.image||''; img.style.width='100%'; img.style.borderRadius='8px';
      const title = document.createElement('div'); title.innerHTML = `<strong>${item.data.detections && item.data.detections[0] ? item.data.detections[0].item : 'Detection'}</strong>`;
      const meta = document.createElement('small'); meta.className='muted'; meta.innerText = new Date(item.createdAt).toLocaleString();
      card.appendChild(img); card.appendChild(title); card.appendChild(meta);
      cont.appendChild(card);
    });
  }

  return { init, loadHistoryPage };
})();
