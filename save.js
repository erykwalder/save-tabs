import { Tabs } from "./tabs.js";
import { SessionStore, createSession } from "./sessions.js";

const tabList = document.getElementById("tab-list");
const sessionList = document.getElementById("session-list");
const form = document.getElementById("save-form");
const toggle = document.getElementById("toggle-all-tabs");
const saveButton = document.getElementById("save-button");
let lastBoxIndex = null;

async function displayTabs() {
  const tabs = await Tabs.getTabs();
  tabs.forEach((tab) => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = "tabs[]";
    checkbox.id = tab.id;
    checkbox.$tab = tab;
    checkbox.addEventListener("click", toggleSelection);
    checkbox.addEventListener("change", switchToggle);

    const label = document.createElement("label");
    label.setAttribute("for", tab.id);
    label.append(checkbox);

    if (tab.favIconUrl) {
      const img = document.createElement("img");
      img.setAttribute("src", tab.favIconUrl);
      img.setAttribute("height", "16px");
      img.setAttribute("width", "16px");
      label.append(img);
    }

    label.append(tab.title);

    const li = document.createElement("li");
    li.append(label);
    tabList.appendChild(li);
  });
}

async function displaySessions() {
  const sessions = await SessionStore.getSessions();
  sessions.forEach((session) => {
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "session_name";
    radio.value = session.name;
    radio.id = session.created;
    radio.$session = session;

    const meta = document.createElement("div");
    meta.setAttribute("class", "session-meta");
    meta.append(`[${session.tabs.length} Tabs]`);

    const label = document.createElement("label");
    label.setAttribute("for", session.created);
    label.append(radio);
    label.append(session.name);
    label.append(meta);

    const li = document.createElement("li");
    li.appendChild(label);
    sessionList.appendChild(li);
  });
}

function getSelectedTabs() {
  return Array.from(form.elements["tabs[]"])
    .filter((cb) => cb.checked)
    .map((cb) => cb.$tab);
}

function getSessionName() {
  let name = form.elements["session_name"].value;
  if (name == "new_session_name") {
    name = form.elements["new_session_name"].value;
  }
  return name;
}

function disableForm() {
  Array.from(form.elements).forEach((el) => {
    el.disabled = true;
  });
}

function enableForm() {
  Array.from(form.elements).forEach((el) => {
    el.disabled = false;
  });
}

function showError(error) {
  alert(error);
  enableForm();
}

function isOnlyWhitespace(text) {
  return /^\s+$/.test(text);
}

async function saveSession() {
  disableForm();

  const tabs = getSelectedTabs();
  if (tabs.length == 0) {
    return showError("No tabs are selected to save!");
  }

  const name = getSessionName();
  if (name == "") {
    return showError("Please enter a session name!");
  }
  if (isOnlyWhitespace(name)) {
    return showError("Names with only space characters are not allowed.");
  }

  console.log(tabs);

  const session = await createSession(name, tabs);

  await SessionStore.addSession(session);

  if (form.elements["close_tabs"].checked) {
    chrome.tabs.remove(tabs.map((tab) => tab.id));
  }

  alert("Saved!");

  chrome.tabs.getCurrent((tab) => chrome.tabs.remove(tab.id));
}

function toggleSelection(e) {
  const checkboxes = Array.from(form["tabs[]"]);
  const currentIndex = checkboxes.indexOf(this);

  console.log(e);
  console.log(this);

  if (lastBoxIndex !== null && e.shiftKey) {
    const start = Math.min(lastBoxIndex, currentIndex);
    const end = Math.max(lastBoxIndex, currentIndex);

    const toggleTo = this.checked;

    for (let i = start; i <= end; i++) {
      checkboxes[i].checked = toggleTo;
    }
  }
  lastBoxIndex = currentIndex;
}

function anyTabsChecked() {
  return Array.from(form["tabs[]"]).filter((cb) => cb.checked).length > 0;
}

function switchToggle() {
  if (anyTabsChecked()) {
    toggle.innerText = "select none";
  } else {
    toggle.innerText = "select all";
  }
}

function toggleTabs() {
  const toggleTo = !anyTabsChecked();
  form.elements["tabs[]"].forEach((cb) => {
    cb.checked = toggleTo;
    switchToggle();
  });
}

displayTabs();
displaySessions();

saveButton.addEventListener("click", (e) => {
  e.preventDefault();
  saveSession();
  return;
});

form.elements["new_session_name"].addEventListener("focus", (e) => {
  document.getElementById("new-session").checked = true;
});

toggle.addEventListener("click", (e) => {
  e.preventDefault();
  toggleTabs();
});
