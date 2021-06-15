export const Tabs = {
  getTabs: function () {
    return new Promise((resolve, _) => {
      chrome.tabs.getCurrent((currentTab) => {
        chrome.tabs.query({}, (tabs) => {
          resolve(tabs.filter((tab) => tab.id != currentTab.id));
        });
      });
    });
  },
};
