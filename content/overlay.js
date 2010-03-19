/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is tweez.
 *
 * The Initial Developer of the Original Code is
 * Dietrich Ayala <autonome@gmail.com>
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * 
 * ***** END LICENSE BLOCK ***** */

function LOG(aStr) {
  Cc["@mozilla.org/consoleservice;1"].getService(Ci.nsIConsoleService).
    logStringMessage("tweez: " + aStr);
}

var tweez = {
  // flag indicating the user closed the panel such that changes
  // should be thrown away.
  // This is not instant-apply. RETURN == save.
  _abort: false,

  QueryInterface: function tweez_QueryInterface(aIID) {
    if (aIID.equals(Ci.nsIDOMEventListener) ||
        aIID.equals(Ci.nsISupports))
      return this;

    throw Cr.NS_NOINTERFACE;
  },

  get tagging() {
    delete this.tagging;
    return this.tagging = Cc["@mozilla.org/browser/tagging-service;1"].
                          getService(Ci.nsITaggingService);
  },

  get inputField() {
    delete this.inputField;
    return this.inputField = document.getElementById("tweezInput");
  },

  get panel() {
    delete this.panel;
    var element = document.getElementById("tweezPanel");
    // initially the panel is hidden
    // to avoid impacting startup / new window performance
    element.hidden = false;
    element.addEventListener("popuphiding", this, false);
    element.addEventListener("keypress", this, false);
    return this.panel = element;
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
      /*
      if (!this._element("tagsSelector").collapsed)
        this.toggleTagsSelector();
      */
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

  /**
   * when switching tabs, 
   */
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

  
  /*
  //from http://lxr.mozilla.org/seamonkey/source/browser/components/places/content/editBookmarkOverlay.js
  onCheckboxStateChange: function tweez_onCheckboxStateChange(aEvent) {
    // Update the tags field when items are checked/unchecked in the listbox
    var tags = this._getTagsArrayFromTagField();

    if (aEvent.target.checked)
      tags.push(aEvent.target.label);
    else {
      var indexOfItem = tags.indexOf(aEvent.target.label);
      if (indexOfItem != -1)
        tags.splice(indexOfItem, 1);
    }
    this._element("Input").value = tags.join(", ");
  },
 
  _element: function EIO__element(aID) {
    return document.getElementById("tweez" + aID);
  },

  _rebuildTagsSelectorListX: function EIO__rebuildTagsSelectorList() {
    var tagsSelector = this._element("tagsSelector");
    if (tagsSelector.collapsed)
      return;

    while (tagsSelector.hasChildNodes())
      tagsSelector.removeChild(tagsSelector.lastChild);

    var tagsInField = this._getTagsArrayFromTagField();
    var allTags = PlacesUtils.tagging.allTags;
    for each (var tag in allTags) {
      var elt = document.createElement("listitem");
      elt.setAttribute("type", "checkbox");
      elt.setAttribute("label", tag);
      if (tagsInField.indexOf(tag) != -1)
        elt.setAttribute("checked", "true");

      tagsSelector.appendChild(elt);
    }
  },

  _rebuildTagsSelectorList: function EIO__rebuildTagsSelectorListX() {
    var tagsSelector = this._element("tagsSelector");
    if (tagsSelector.collapsed)
      return;

    var tagsSelectorRows = this._element('tagsSelectorRows');
    while (tagsSelectorRows.hasChildNodes())
      tagsSelectorRows.removeChild(tagsSelectorRows.lastChild);

    var tagsInField = this._getTagsArrayFromTagField();
    var allTags = PlacesUtils.tagging.allTags;
    var colsize = allTags.length/3;

    var it = Iterator(allTags);
    try {
      while (true) {
          for (var i=0; i<colsize;i++){ 
            var row = document.createElement("row");
            for (var j=0; j<3;j++) {//3 columns
                var tag = it.next()[1];
                var elt = document.createElement("checkbox");
                elt.setAttribute("label", tag);
                if (tagsInField.indexOf(tag) != -1)
                    elt.setAttribute("checked", "true");
                row.appendChild(elt);
            }
            tagsSelectorRows.appendChild(row);
          }    
      }
    } catch (err if err instanceof StopIteration) {
      tagsSelectorRows.appendChild(row);
    }
  },

  toggleTagsSelector: function EIO_toggleTagsSelector() {
    var tagsSelector = this._element("tagsSelector");
    var expander = this._element("tagsSelectorExpander");
    if (tagsSelector.collapsed) {
      expander.className = "expander-up";
      expander.setAttribute("tooltiptext",
                            expander.getAttribute("tooltiptextup"));
      tagsSelector.collapsed = false;
      this._rebuildTagsSelectorList();

      // This is a no-op if we've added the listener.
      tagsSelector.addEventListener("CheckboxStateChange", this, false);
    }
    else {
      expander.className = "expander-down";
      expander.setAttribute("tooltiptext",
                            expander.getAttribute("tooltiptextdown"));
      tagsSelector.collapsed = true;
    }
  },

  _getTagsArrayFromTagField: function EIO__getTagsArrayFromTagField() {
    // we don't require the leading space (after each comma)
    var tags = this._element("Input").value.split(",");
    for (var i=0; i < tags.length; i++) {
      // remove trailing and leading spaces
      tags[i] = tags[i].replace(/^\s+/, "").replace(/\s+$/, "");

      // remove empty entries from the array.
      if (tags[i] == "") {
        tags.splice(i, 1);
        i--;
      }
    }
    return tags;
  }
  */
};
window.addEventListener("load", function(e) { tweez.onLoad(e); }, false);
window.addEventListener("unload", function(e) { tweez.onUnload(e); }, false);
