/* =====================================================================
   THINKERS DILEMMA — site interactions
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Automated Archive Fetcher ------------ */
  function updateArchive() {
    var containers = document.querySelectorAll('[data-render="home-archive"]');
    if (containers.length === 0) return;

    fetch('articles.json')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        // rss2json returns data with an 'items' property
        var posts = data.items || [];
        var html = posts.slice(0, 6).map(function(item) {
          return '<div class="essay-card">' +
                 '  <a href="' + item.link + '">' +
                 '    <h3>' + item.title + '</h3>' +
                 '    <p>' + (item.description || '') + '</p>' +
                 '  </a>' +
                 '</div>';
        }).join('');
        
        containers.forEach(function(c) { c.innerHTML = html; });
      })
      .catch(function(err) { console.warn("Archive fetch failed:", err); });
  }

  /* ---------- Initialize everything ---------- */
  function init() {
    initFilter();
    initSubscribe();
    initProgress();
    initPlaceholderLinks();
    initTheme();
    initReveal();
    initParallax();
    initCounters();
    initPlateTilt();
    initMagnetic();
    
    // This is the line that was missing
    updateArchive();
  }

  /* ... (Keep your existing initFilter, initSubscribe, etc., functions below this line) ... */
})();
