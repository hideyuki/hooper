/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.6.3/workbox-sw.js");

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "404.html",
    "revision": "be5628cc9ed1f300982093caff1e8b1f"
  },
  {
    "url": "api.html",
    "revision": "e0cee09790fbf0afcd5709dfc79d7103"
  },
  {
    "url": "assets/css/0.styles.523af7a8.css",
    "revision": "c6fab1f4b0bc96cb4843c25aa5a7d94e"
  },
  {
    "url": "assets/img/search.83621669.svg",
    "revision": "83621669651b9a3d4bf64d1a670ad856"
  },
  {
    "url": "assets/js/2.fced0b5e.js",
    "revision": "c3024384f813d143977d20c173cd51d8"
  },
  {
    "url": "assets/js/3.e1f92573.js",
    "revision": "e0ad457e32e176f00310247f3442a890"
  },
  {
    "url": "assets/js/4.6575db63.js",
    "revision": "0fb98eac91cb5d389cc0d63ef1605055"
  },
  {
    "url": "assets/js/5.bf747293.js",
    "revision": "8e27e9c755eab64278bba301632d2d05"
  },
  {
    "url": "assets/js/6.c4fb99af.js",
    "revision": "41a0c54869907aab9011cc9f7e4e2291"
  },
  {
    "url": "assets/js/7.1dd924c5.js",
    "revision": "9dc2fe70da7d4c4c93f2fdef1269eec7"
  },
  {
    "url": "assets/js/app.13bd2e81.js",
    "revision": "7dcbfe5906dbaf6b783105528860803a"
  },
  {
    "url": "examples.html",
    "revision": "d670c3022eaf17e025e735a5d7656379"
  },
  {
    "url": "getting-started.html",
    "revision": "cae067336a7a054c88917c937c7edba9"
  },
  {
    "url": "hooper.svg",
    "revision": "e138dfdb27cd6a48518049a5571ce28d"
  },
  {
    "url": "index.html",
    "revision": "7c90fc9656cc72d3f7e677287b90d934"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});
addEventListener('message', event => {
  const replyPort = event.ports[0]
  const message = event.data
  if (replyPort && message && message.type === 'skip-waiting') {
    event.waitUntil(
      self.skipWaiting().then(
        () => replyPort.postMessage({ error: null }),
        error => replyPort.postMessage({ error })
      )
    )
  }
})
