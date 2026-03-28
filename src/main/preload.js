const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Knowledge Base
  kb: {
    getAll: () => ipcRenderer.invoke("kb:getAll"),
    getById: (id) => ipcRenderer.invoke("kb:getById", id),
  },

  // Nudges
  nudge: {
    getHistory: (limit) => ipcRenderer.invoke("nudge:getHistory", limit),
    save: (id) => ipcRenderer.invoke("nudge:save", id),
    triggerManual: () => ipcRenderer.invoke("nudge:triggerManual"),
  },

  // Stats
  stats: {
    weekly: () => ipcRenderer.invoke("stats:weekly"),
  },

  // Settings
  settings: {
    getAll: () => ipcRenderer.invoke("settings:getAll"),
    get: (key) => ipcRenderer.invoke("settings:get", key),
    set: (key, value) => ipcRenderer.invoke("settings:set", key, value),
  },

  // Engine
  engine: {
    start: () => ipcRenderer.invoke("engine:start"),
    stop: () => ipcRenderer.invoke("engine:stop"),
  },

  // Events from main process
  on: (channel, callback) => {
    const validChannels = ["nudge-delivered", "show-learn-more"];
    if (validChannels.includes(channel)) {
      const subscription = (_event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
  },
});
