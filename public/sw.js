/**
 * Titan Finance — Minimal Service Worker
 * Handles: push events, background sync hints.
 * If the user grants notification permission, browser notifications
 * will work even when the tab is backgrounded or closed on supported OS.
 */

// @ts-nocheck
self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

// Placeholder for future Web Push — currently unused
self.addEventListener("push", function (event) {
  var payload = event.data ? event.data.json() : {};
  var title = payload.title || "Titan Finance";
  var options = {
    body: payload.body || "You have a new alert.",
    icon: payload.icon || "/favicon.ico",
    tag: payload.tag || "default",
    requireInteraction: payload.requireInteraction || false,
    data: payload.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/compliance"));
});
