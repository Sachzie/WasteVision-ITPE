// api.js — thin wrapper for API calls
const API_BASE = 'http://localhost:5000'; // change later to '/api' if proxying via Node

const api = {
  identify: async function(file){
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(API_BASE + '/identify', {
      method:'POST', body: fd
    });
    if(!res.ok) throw new Error('Server error: ' + res.status);
    return res.json();
  }
};
