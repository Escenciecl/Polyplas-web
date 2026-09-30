(function () {
  window.POLYPLAS_CONFIG = window.POLYPLAS_CONFIG || {
    SUPABASE_URL:      'https://gdrkscedvkjtcvexnhzg.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_qT9WuJK5Wi6VghgMvcYIMw_IGBtn1Tc'
  };
  if (typeof (window.supabase || {}).createClient === 'function') return;
  var s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
  document.head.appendChild(s);
})();
