window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }

  var _c = localStorage.getItem('cookieConsentimiento');
  gtag('consent', 'default', {
    analytics_storage:  _c === 'aceptado' ? 'granted' : 'denied',
    ad_storage:         _c === 'aceptado' ? 'granted' : 'denied',
    ad_user_data:       _c === 'aceptado' ? 'granted' : 'denied',
    ad_personalization: _c === 'aceptado' ? 'granted' : 'denied',
    wait_for_update: 2000
  });
