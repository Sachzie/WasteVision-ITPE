// dashboard.js — handles upload, preview, showing result and history
const dashboard = (function(){
  const latestKey = 'wv_latest_detection';
  
  function init(){
    bindUI();
    showGreeting();
    loadRecentSnippet();
  }

  function showGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Hello';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 18) greeting = 'Good afternoon';
    else greeting = 'Good evening';
    
    const greetingEl = document.getElementById('greeting');
    if (greetingEl) greetingEl.textContent = greeting;
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
      // Show loading state on button
      const detectBtn = document.getElementById('detectBtn');
      detectBtn.textContent = 'Detecting...';
      detectBtn.disabled = true;

      // Send request to your microservice
      const data = await sendToMicroservice(file);
      
      // Store the uploaded image for display
      const imageUrl = URL.createObjectURL(file);
      
      // Create normalized response with image and detections
      const normalized = {
        detections: data.default_model?.detections || [],
        image: imageUrl,
        raw: data
      };
      
      displayResult(normalized);
      localStorage.setItem(latestKey, JSON.stringify(normalized));
      loadRecentSnippet();
    }catch(err){
      console.error('Detection error:', err);
      displayError(err.message || 'Failed to detect waste. Please try again.');
    } finally {
      // Reset button state
      const detectBtn = document.getElementById('detectBtn');
      detectBtn.textContent = 'Detect Waste';
      detectBtn.disabled = false;
    }
  }

  async function sendToMicroservice(file) {
    const formData = new FormData();
    formData.append('file', file);

    console.log('Sending file to microservice:', file.name, file.type, file.size);

    try {
      const response = await fetch('http://localhost:5000/identify', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary
        headers: {
          'Accept': 'application/json',
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        // Try to get more detailed error message from response
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Detection result:', result);
      return result;

    } catch (error) {
      console.error('Fetch error:', error);
      
      // Handle specific error cases
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to detection service. Please make sure the microservice is running on localhost:5000');
      }
      
      throw error;
    }
  }

  function setResultLoading(){
    const container = document.getElementById('resultContent');
    container.innerHTML = '<p class="muted">Processing image... please wait.</p>';
  }

  function displayResult(res){
    const c = document.getElementById('resultContent');
    c.innerHTML = '';
    
    // Show uploaded image
    if(res.image){
      const img = document.createElement('img'); 
      img.src = res.image; 
      img.className='preview-img';
      img.style.maxHeight = '200px';
      img.style.marginBottom = '16px';
      img.style.borderRadius = '8px';
      c.appendChild(img);
    }
    
    // Show detection results
    if(!res.detections || res.detections.length===0){
      const p = document.createElement('p'); 
      p.className='muted'; 
      p.innerText='No waste items detected in this image.';
      c.appendChild(p); 
      return;
    }
    
    // Create results container
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'detection-results';
    
    res.detections.forEach(item => {
      const d = document.createElement('div'); 
      d.className = `det-item ${getTypeClass(item.type)}`;
      
      const confidencePercent = item.confidence ? (item.confidence * 100).toFixed(1) : 'N/A';
      
      d.innerHTML = `
        <div class="det-item-header">
          <strong class="item-name">${item.item || 'Unknown Item'}</strong>
          <span class="confidence">${confidencePercent}%</span>
        </div>
        <div class="det-item-type">${item.type || 'Unknown Type'}</div>
      `;
      
      resultsContainer.appendChild(d);
    });
    
    c.appendChild(resultsContainer);
  }

  function getTypeClass(type) {
    if (!type) return '';
    
    const typeMap = {
      'recyclable': 'type-recyclable',
      'biodegradable': 'type-biodegradable',
      'hazardous': 'type-hazardous',
      'general': 'type-general'
    };
    
    return typeMap[type.toLowerCase()] || 'type-general';
  }

  function displayError(msg){
    const c = document.getElementById('resultContent');
    c.innerHTML = `
      <div style="color: #dc3545; background: #f8d7da; padding: 12px; border-radius: 6px; border: 1px solid #f5c6cb;">
        <strong>Error:</strong> ${msg}
      </div>
    `;
  }

  function saveLatestToHistory(){
    const latest = JSON.parse(localStorage.getItem(latestKey) || 'null');
    if(!latest){ 
      alert('No latest detection to save. Please detect waste first.'); 
      return; 
    }
    
    const user = JSON.parse(localStorage.getItem('wv_user') || '{}');
    const key = 'wv_history_' + (user.email || 'guest');
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    
    arr.unshift({ 
      id: Date.now(), 
      createdAt: new Date().toISOString(), 
      data: latest 
    });
    
    localStorage.setItem(key, JSON.stringify(arr));
    alert('Saved to history.');
    loadRecentSnippet();
  }

  function loadRecentSnippet(){
    const user = JSON.parse(localStorage.getItem('wv_user') || '{}');
    const key = 'wv_history_' + (user.email || 'guest');
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    const container = document.getElementById('recentList');
    
    if(!container) return;
    
    container.innerHTML = '';
    
    if(arr.length===0){ 
      container.innerText = 'No recent uploads.'; 
      return; 
    }
    
    arr.slice(0, 4).forEach(item => {
      const el = document.createElement('div'); 
      el.className = 'recent-item';
      
      const img = document.createElement('img'); 
      img.src = item.data.image || ''; 
      img.style.maxHeight = '70px'; 
      img.style.width = '70px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '4px';
      
      const label = document.createElement('div'); 
      label.style.fontSize = '12px'; 
      label.style.marginTop = '8px';
      label.style.textAlign = 'center';
      
      const detectionCount = item.data.detections ? item.data.detections.length : 0;
      label.innerText = detectionCount > 0 ? 
        `${detectionCount} item${detectionCount !== 1 ? 's' : ''}` : 
        'No items';
      
      el.appendChild(img); 
      el.appendChild(label);
      container.appendChild(el);
    });
  }

  // history page loader
  function loadHistoryPage(){
    const user = JSON.parse(localStorage.getItem('wv_user') || '{}');
    const key = 'wv_history_' + (user.email || 'guest');
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    const cont = document.getElementById('historyContainer');
    
    if(!cont) return;
    
    cont.innerHTML = '';
    
    if(arr.length===0){ 
      cont.innerText = 'No saved detections yet.'; 
      return; 
    }
    
    arr.forEach(item => {
      const card = document.createElement('div'); 
      card.className = 'history-card';
      
      const img = document.createElement('img'); 
      img.src = item.data.image || ''; 
      img.style.width = '100%'; 
      img.style.height = '150px';
      img.style.objectFit = 'cover';
      img.style.borderRadius = '8px';
      
      const content = document.createElement('div');
      content.style.padding = '12px';
      
      const title = document.createElement('div'); 
      title.innerHTML = `<strong>Detection Results</strong>`;
      
      const meta = document.createElement('small'); 
      meta.className = 'muted'; 
      meta.innerText = new Date(item.createdAt).toLocaleString();
      meta.style.display = 'block';
      meta.style.marginBottom = '8px';
      
      const detectionsList = document.createElement('div');
      detectionsList.style.fontSize = '14px';
      
      if (item.data.detections && item.data.detections.length > 0) {
        item.data.detections.slice(0, 3).forEach(detection => {
          const detEl = document.createElement('div');
          detEl.innerHTML = `• ${detection.item} (${detection.type})`;
          detectionsList.appendChild(detEl);
        });
        
        if (item.data.detections.length > 3) {
          const moreEl = document.createElement('div');
          moreEl.innerHTML = `... and ${item.data.detections.length - 3} more`;
          moreEl.style.color = '#666';
          detectionsList.appendChild(moreEl);
        }
      } else {
        detectionsList.innerHTML = '<div>No items detected</div>';
      }
      
      content.appendChild(title);
      content.appendChild(meta);
      content.appendChild(detectionsList);
      
      card.appendChild(img);
      card.appendChild(content);
      cont.appendChild(card);
    });
  }

  return { init, loadHistoryPage };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  dashboard.init();
});