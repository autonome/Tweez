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
 *  dietrich ayala <autonome@gmail.com>
 * Portions created by the Initial Developer are Copyright (C) 2008
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

var tweezLibrary = {
  strings: null,

  onLoad: function() {
    this.initialized = true;
    var bundleSvc = Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService);
    this.strings = bundleSvc.createBundle("chrome://tweez/locale/tweez.properties");
  },
  onMenuItemCommand: function(e) {
    var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                  .getService(Components.interfaces.nsIPromptService);
    var check = {value: false};
    var ok = promptService.confirmCheck(
      window,
      this.strings.GetStringFromName("extensions.tweez.promptTitle"),
      this.strings.GetStringFromName("extensions.tweez.promptQuestion"),
      this.strings.GetStringFromName("extensions.tweez.promptCheckQuestion"),
      check);

    if (ok) {
      var useHierarchy = check.value;
      var result = PlacesUtils.getFolderContents(PlacesUtils.toolbarFolderId, false, false);
      tagFolderNode(result.root, true, useHierarchy);
      result = PlacesUtils.getFolderContents(PlacesUtils.bookmarksMenuFolderId, false, false);
      tagFolderNode(result.root, true, useHierarchy);
      result = PlacesUtils.getFolderContents(PlacesUtils.unfiledBookmarksFolderId, false, false);
      tagFolderNode(result.root, true, useHierarchy);
    }
  }
};
window.addEventListener("load", function(e) { tweezLibrary.onLoad(e); }, false);

function tagFolderNode(aFolderNode, aDoRecurse, aDoUseHierarchy) {
  if (!aFolderNode.containerOpen)
    asContainer(aFolderNode).containerOpen = true;
  for (var i = 0; i < aFolderNode.childCount; i++) {
    var childNode = aFolderNode.getChild(i);
    if (PlacesUtils.nodeIsBookmark(childNode) && childNode.uri) {
      var uri = PlacesUtils._uri(childNode.uri);
      var tags = [];
      if (aDoUseHierarchy) {
        var folderNode = aFolderNode;
        while (folderNode) {
          tags.push(folderNode.title);
          folderNode = folderNode.parent;
        }
      }
      else
        tags.push(aFolderNode.title);
      tags = tags.concat(PlacesUtils.tagging.getTagsForURI(uri, {}));
      PlacesUtils.tagging.tagURI(uri, tags);
    }
    else if (aDoRecurse && PlacesUtils.nodeIsFolder(childNode) &&
             !PlacesUtils.nodeIsLivemarkContainer(childNode))
      tagFolderNode(childNode, true, aDoUseHierarchy);
  }
}