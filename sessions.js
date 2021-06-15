import { encrypt, decrypt } from "./crypt.js";

const VERIFY_TEXT = "verification";

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

export async function createSession(name, tabs, password) {
  if (password && password.length > 0) {
    return await createEncryptedSession(name, tabs, password);
  }
  return {
    name: name,
    encrypted: false,
    tabs: tabs.map((tab) => tab.url),
    created: Date.now(),
  };
}

async function createEncryptedSession(name, tabs, password) {
  const verification = await encrypt(VERIFY_TEXT, password);
  const encryptedTabs = await Promise.all(
    tabs.map(async (tab) => {
      return await encrypt(tab.url, password);
    })
  );
  return {
    name: name,
    encrypted: true,
    verification: verification,
    tabs: encryptedTabs,
    created: Date.now(),
  };
}

export async function verifySessionPassword(session, password) {
  try {
    const verification = await decrypt(session.verification, password);
    return verification == VERIFY_TEXT;
  } catch (e) {
    return false;
  }
}

export async function getTabs(session, password) {
  if (!session.encrypted) {
    return session.tabs;
  }
  const passwordOk = await verifySessionPassword(session, password);
  if (!passwordOk) {
    throw new Error("invalid session password");
  }
  return await Promise.all(
    session.tabs.map(async (encryptedTab) => {
      return await decrypt(encryptedTab, password);
    })
  );
}
