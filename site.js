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
        // Handle rss2json structure
        var posts = data.items || [];
        var html = posts.slice(0, 6).map(function(item) {
          return '<div class="essay-card">' +
                 '  <a href="' + item.link + '">' +
                 '    <h3>' + item.title + '</h3>' +
                 '    <p>' + (item.description || '') + '</p>' +
                 '  </a>' +
                 '</div>';
        }).join('');
        
        containers.forEach(function(c) { 
            c.innerHTML = html; 
            // Trigger your reveal animation if it exists
            if (c.hasAttribute('data-reveal')) {
                c.style.opacity = '1';
                c.style.transform = 'none';
            }
        });
      })
      .catch(function(err) { console.warn("Archive fetch failed:", err); });
  }

  /* ---------- Existing Functions --------------------------------- */
  function initFilter() { /* ... your existing code ... */ }
  function initSubscribe() { /* ... your existing code ... */ }
  function initProgress() { /* ... your existing code ... */ }
  function initPlaceholderLinks() { /* ... your existing code ... */ }
  function initTheme() { /* ... your existing code ... */ }
  function initReveal() { /* ... your existing code ... */ }
  function initParallax() { /* ... your existing code ... */ }
  function initCounters() { /* ... your existing code ... */ }
  function initPlateTilt() { /* ... your existing code ... */ }
  function initMagnetic() { /* ... your existing code ... */ }

  /* ---------- Initialization ------------------------------------- */
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
    
    // Call the new function
    updateArchive(); 
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
