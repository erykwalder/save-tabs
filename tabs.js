export const Tabs = {
  getTabs: function () {
    return new Promise((resolve, _) => {
      chrome.tabs.query({}, (tabs) => {
        resolve(
          tabs.filter((tab) => !tab.url.includes(chrome.runtime.getURL("")))
        );
      });
    });
  },
};
