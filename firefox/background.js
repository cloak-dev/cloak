/** The background script that runs as a service worker on the pages Cloak is activated on.
 * Adds a click listener to our extension button, that will execute the content script on the current tab
 *
 * @see https://developer.chrome.com/docs/extensions/mv3/service_workers/
 */

chrome.action.onClicked.addListener(function (tab) {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
    });
});
