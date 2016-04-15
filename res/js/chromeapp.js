/*global chrome */

/* BrainingWheels
 * kirk.zurell.name
 */

/* Chrome-app specific parts of Amy's Garden */

chrome.app.runtime.onLaunched.addListener(function () {
    chrome.app.window.create("index.html", {
    id: "app-window",
    frame: "none",
    state : "fullscreen",
      // Tiles: 720x540, 720*3=2160,540*3=1620
      // Actual tiles are different.
      // Promo page: 3600 width, 5400
    bounds: {
        width: 1280,
        height: 1024
    }
    });
});
