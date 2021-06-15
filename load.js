import { SessionStore, verifySessionPassword, getTabs } from "./sessions.js";

const sessionList = document.getElementById("session-list");
const newWindow = document.getElementById("new-window");
const deleteAll = document.getElementById("delete-all-button");

deleteAll.addEventListener("click", async (e) => {
  e.preventDefault();
  const response = prompt('Please type "delete" to confirm.');
  if (response == null || response.toLowerCase() != "delete") {
    return;
  }
  await SessionStore.setSessions([]);
  window.location.reload();
});

async function displaySessions() {
  const sessions = await SessionStore.getSessions();

  if (sessions.length == 0) {
    const li = document.createElement("li");
    li.append("There are no saved sessions.");
    sessionList.append(li);

    deleteAll.remove();
  }

  sessions.forEach((session) => {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.setAttribute("href", "#");
    link.append(session.name);
    link.addEventListener("click", async (e) => {
      e.preventDefault();

      let password;
      if (session.encrypted) {
        password = prompt("Session Password");
        const passwordOk = await verifySessionPassword(session, password);
        if (!passwordOk) {
          return alert("Incorrect password!");
        }
      }

      const urls = await getTabs(session, password);

      if (newWindow.checked) {
        chrome.windows.create({ url: urls });
      } else {
        urls.forEach((url) => {
          chrome.tabs.create({ url: url });
        });
      }
    });

    const meta = document.createElement("span");
    meta.setAttribute("class", "session-meta");
    if (session.encrypted) {
      const lock = document.createElement("div");
      lock.setAttribute("class", "lock");
      meta.append(lock);
    }
    meta.append(`[${session.tabs.length} Tabs]`);
    const trash = document.createElement("trash");
    trash.setAttribute("class", "trash");
    trash.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm("Are you sure?")) {
        await SessionStore.removeSession(session.name);
        window.location.reload();
      }
    });
    meta.append(trash);
    link.append(meta);

    li.appendChild(link);
    sessionList.appendChild(li);
  });
}

displaySessions();
