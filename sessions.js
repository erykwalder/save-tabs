export const SessionStore = {
  getSessions: function () {
    return new Promise(async (resolve, _) => {
      chrome.storage.sync.get(["savedSessions"], (result) => {
        if (!result.savedSessions) {
          return resolve([]);
        }
        return resolve(result.savedSessions);
      });
    });
  },

  getSession: async function (name) {
    const sessions = await SessionStore.getSessions();
    return sessions.find((session) => session.name == name);
  },

  setSessions: function (sessions) {
    return new Promise(async (resolve, _) => {
      chrome.storage.sync.set({ savedSessions: sessions }, () => {
        resolve(true);
      });
    });
  },

  addSession: async function (session) {
    let sessions = await SessionStore.getSessions();
    sessions = sessions.filter((existing) => existing.name != session.name);
    sessions.push(session);
    return SessionStore.setSessions(sessions);
  },

  removeSession: async function (name) {
    let sessions = await SessionStore.getSessions();
    sessions = sessions.filter((session) => session.name != name);
    return SessionStore.setSessions(sessions);
  },
};

export async function createSession(name, tabs) {
  return {
    name: name,
    tabs: tabs.map((tab) => tab.url),
    created: Date.now(),
  };
}

export async function getTabs(session) {
  return await Promise.all(session.tabs);
}
