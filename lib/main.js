const { Ci, Cc, Cu } = require("chrome");

let active = false;

// make a panel
let tagPanel = require("panel").Panel({
  contentURL: "data:text/html,<input id='cmd' type='text'>",
  width: 300,
  height: 100
});

/*
var tweez = {
  // flag indicating the user closed the panel such that changes
  // should be thrown away.
  // This is not instant-apply. RETURN == save.
  _abort: false,

  get tagging() {
    delete this.tagging;
    return this.tagging = Cc["@mozilla.org/browser/tagging-service;1"].
                          getService(Ci.nsITaggingService);
  },

  get inputField() {
    delete this.inputField;
    return this.inputField = document.getElementById("tweezInput");
  },

  openPopup: function tweez_openPoup() {
    this.currentURI = getBrowser().selectedBrowser.currentURI;
    var w = document.defaultView;
    this.panel.width = 400;
    var x = screen.availLeft + (screen.availWidth - this.panel.width) / 2;
    var y = screen.availTop + (screen.availHeight - 200) / 2;
    this.panel.openPopupAtScreen(x, y, false);

    // focus and populate input
    var self = this;
    setTimeout(function() {
      var uri = getBrowser().selectedBrowser.currentURI;
      var tags = self.tagging.getTagsForURI(uri, {});
      if (tags.length > 0)
        self.inputField.value = tags.join(", ");
      //self._rebuildTagsSelectorList();
      setTimeout(function() self.inputField.focus(), 15);
      self._open = true;
    }, 0);
  },

  onLoad: function tweez_onLoad() {
    this.strings = document.getElementById("tweez-strings");
    gBrowser.tabContainer.addEventListener("TabSelect", this, false);

    // for 3.1 or greater, use the built-in tag ac component
    if (Cc["@mozilla.org/autocomplete/search;1?name=places-tag-autocomplete"])
      document.getElementById("tweezInput").setAttribute("autocompletesearch", "places-tag-autocomplete");
  },

  onUnload: function tweez_onUnload() {
    gBrowser.tabContainer.removeEventListener("TabSelect", this, false);
  },

  // nsIDOMEventListener
  handleEvent: function tweez_handleEvent(aEvent) {
    switch (aEvent.type) {
      case "popuphiding":
        this.onPopupHiding(aEvent);
        break;
      case "keypress":
        this.onKeyPress(aEvent);
        break;
      case "TabSelect":
        this.onTabSelect(aEvent);
        break; 
      case "CheckboxStateChange":
       this.onCheckboxStateChange(aEvent);
       break;
    }
  },

  onPopupHiding: function tweez_onPopupHiding(aEvent) {
    if (aEvent.target.id == 'tweezPanel') {
      if (!this._abort) 
        this.saveTags();
      else
        this._abort = false;
    }
  },

  onKeyPress: function tweez_onKeyPress(aEvent) {
    if (aEvent.keyCode == KeyEvent.DOM_VK_ESCAPE ||
        aEvent.keyCode == KeyEvent.DOM_VK_RETURN) {
      // set abort flag
      this._abort = aEvent.keyCode == KeyEvent.DOM_VK_ESCAPE;
      // focus the content area and hide the panel
      this.panel.hidePopup();
      window.content.focus();
    }
  },

  // when switching tabs, 
  onTabSelect: function tweez_onTabSelect(aEvent) {
    return;
    // XXX FIXME
    if (this.panel.hidden)
      return;
    //this.saveTags();
    //this.currentURI = getBrowser().selectedBrowser.currentURI;
    this.panel.hidePopup();
  },

  saveTags: function tweez_saveTags() {
    // get current URI
    var uri = this.currentURI;
    if (uri) {
      // clear existing tags
      this.tagging.untagURI(uri, null);

      var tagString = this.inputField.value;
      if (tagString.length > 0) {
        // split and trim input
        var tags = this.inputField.value.split(",");
        tags = tags.map(function(el) {
          return el.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        });
        // add the tags
        this.tagging.tagURI(uri, tags);
        // bookmark the page
        PlacesCommandHook.bookmarkCurrentPage(false);
      }
      else {
        // if the bookmark is unfiled, delete it
        var ids = PlacesUtils.bookmarks.getBookmarkIdsForURI(uri, {});
        if (ids.length == 1) {
          var parentId = PlacesUtils.bookmarks.getFolderIdForItem(ids[0]);
          if (parentId == PlacesUtils.unfiledBookmarksFolderId)
            PlacesUtils.bookmarks.removeItem(ids[0]);
        }
      }
    }
    // clean up UI
    this.inputField.value = "";
  },
};
*/

// add shortcut listener to all current and future windows
const wu = require("window-utils");
new wu.WindowTracker({
  onTrack: function (window) {
    window.document.addEventListener("keypress", onKeyPress, true);
  },
  onUntrack: function (window) {
    window.document.removeEventListener("keypress", onKeyPress, true);
  }
});
