(function() {
  // Saves options to chrome.storage
  function save_options() {
    var title  = document.getElementById('title').value,
        date   = document.getElementById('date').value,
        target = document.getElementById('target').value,
        units  = document.getElementById('units').value,
        notes  = document.getElementById('text').value;
        mdOn   = document.getElementById('mdOn').checked;

    chrome.storage.sync.set({
      omgdpTitle:     title,
      omgdpDate:      date,
      omgdpTarget:    target,
      omgdpUnits:     units,
      omgdpNotes:     notes,
      omgdpshowNotes: mdOn,
    }, function() {
      // Update status to let user know options were saved.
      var status = document.getElementById('status');
      status.textContent = 'Options saved.';
      setTimeout(function() {
        status.textContent = '';
      }, 750);
    });
  }
  const initalNote = `# Hello!
Type your notes here. You can use a basic subset of
 [markdown](https://guides.github.com/pdfs/markdown-cheatsheet-online.pdf)
 to style them.

#### Supported syntax:
* Headers (h1-h4)
* Lists (unordered).
* Links.
`;

  // Restores input states from preferences stored in chrome.storage.
  function restore_options() {
    // Use default values if values not set.
    chrome.storage.sync.get({
      omgdpTitle:   '',
      omgdpDate:    Date.now(),
      omgdpTarget:  '',
      omgdpUnits:   '',
      omgdpNotes:   initalNote,
      omgdpshowNotes: true,
    }, function(items) {

      // Load all varibles from storage.
      document.getElementById('title').value  = items.omgdpTitle || "";
      document.getElementById('date').value   = items.omgdpDate;
      document.getElementById('target').value = items.omgdpTarget;
      document.getElementById('units').value  = items.omgdpUnits;
      document.getElementById('text').value   = items.omgdpNotes;
      document.getElementById('mdOn').checked = items.omgdpshowNotes;

      // Generate markdown from the loaded items.omgdpshowNotes value.
      miniMarkdown.make('md-notes', items.omgdpNotes);
    });

  }
  document.addEventListener('DOMContentLoaded', restore_options);
  document.getElementById('save').addEventListener('click', save_options);

  var inText = document.getElementById('text');

  // Regenerate markdown when `text` element is edited.
  inText.onkeyup = function() {
    document.getElementById('md-notes').innerHTML = "";
    miniMarkdown.make('md-notes', inText.value);
  };
})();