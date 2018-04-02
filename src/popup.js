(function () {

  // Short-hand time deltas.
  const s = 1000,     // secs
        m = s * 60,   // mins
        h = m * 60,   // hours
        d = h * 24;   // days

  function init_counter(items) {

    // Get iniial time delta from the stored date.
    const end = new Date(items.omgdpDate).getTime();
    var delta = end - (new Date().getTime());

    // display delta straight away so we dont get a pause before the first
    // tick.
    showDelta(delta);

    if (items.omgdpTarget !== "" && items.omgdpUnits !== "") {
      // If units and targets are set display units per day.
      let perDay = items.omgdpTarget / (delta / d);
      document.getElementById('target').textContent = (
        "Thats " + perDay.toFixed(2) + " " +
        items.omgdpUnits + " per day to finish it."
      );
    }

    // Init ticker to update the displayed timedelta every second.
    var ticker = setInterval(function() {
      delta = end - (new Date().getTime());
      if (delta < 0) {
        clearInterval(ticker);
        delta = 0;
        document.getElementById('counter').style.color = "#848484";
      }
      showDelta(delta);
    }, s);
  }

  // Updates the counter in the DOM with the new timedelta.
  function showDelta(delta) {
    document.getElementById('counter').textContent = (
      Math.floor(delta / d)     + " days " +
      Math.floor(delta % d / h) + " hours " +
      Math.floor(delta % h / m) + " mins " +
      Math.floor(delta % m / s) + " secs"
    );
  }

  // Restores input states from preferences stored in chrome.storage.
  chrome.storage.sync.get({
    omgdpTitle: '...',
    omgdpDate: Date.now(),
    omgdpTarget: "",
    omgdpUnits: "x",
    omgdpNotes: "## Hello User!\nSee options to set up the extension.",
    omgdpshowNotes: true,
  }, function(items) {
    init_counter(items);
    document.getElementById('title').textContent = items.omgdpTitle;
    if (items.omgdpshowNotes === true && items.omgdpNotes !== "") {
      miniMarkdown.make('md-notes', items.omgdpNotes);
    }
  });

  // Provide a link to the options page.
  document.getElementById('go-options').addEventListener('click', function() {
    if (chrome.runtime.openOptionsPage) {
      // New way to open options pages, if supported (Chrome 42+).
      chrome.runtime.openOptionsPage();
    } else {
      // Reasonable fallback.
      window.open(chrome.runtime.getURL('options.html'));
    }
  });
})();