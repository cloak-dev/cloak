/** Content script to be injected in the page
 * This sets up action buttons for the user to initialize Cloak's
 * encryption layer.
 * Then, depending on the messaging app in use, the correct hook
 * will be dynamically loaded and executed by way of adding a
 * script tag dynamically into the DOM.
 */

// logo of cloak
const url = chrome.runtime.getURL("assets/logo.png");

const img = document.createElement("img");
img.id = "cloak-logo";
img.src = url;
img.style.transform = "scale(0.5)";
// it only appears after the first action button is clicked.
img.style.visibility = "hidden";

// the first action button
const button = document.createElement("button");
button.id = "cloak-button";
button.style.position = "fixed";
button.style.top = "10px";
button.style.right = "10px";
button.style.background = "none";
button.style.outline = "none";
button.style.fontSize = "1.2rem";
button.style.visibility = "hidden";
button.style.cursor = "pointer";
button.innerText = "Start Encrypting";

document.body.appendChild(button);
document.body.appendChild(img);

// depending on the current page, the correct hook will be loaded
const scripts = {
    localhost: { path: "scripts/basic.js" },
    "meet.google.com": { path: "scripts/google-meet.js" },
    "web.whatsapp.com": { path: "scripts/whatsapp.js" },
};

const s = document.createElement("script");

const hostname = new URL(window.location.href).hostname;

// load script into the DOM
s.src = chrome.runtime.getURL(scripts[hostname].path);
(document.head || document.documentElement).appendChild(s);
s.onload = () => s.parentNode.removeChild(s);
