import { ChromeTab } from "ChromeTab";
import { CHROME_WINDOWS } from "fixtures";
import { cleanUpEnzymeAfterEachTest } from "safeMount";

interface MockEvent<ListenerType> {
  addListener: (cb: ListenerType) => void;
  removeListener: (cb: ListenerType) => void;
}

type RuntimeExtensionMessageListener = Parameters<
  chrome.runtime.ExtensionMessageEvent["addListener"]
>[0];
type TabMovedListener = Parameters<chrome.tabs.TabMovedEvent["addListener"]>[0];
type TabRemovedListener = Parameters<
  chrome.tabs.TabRemovedEvent["addListener"]
>[0];
type TabCreatedListener = Parameters<
  chrome.tabs.TabCreatedEvent["addListener"]
>[0];
type TabUpdatedListener = Parameters<
  chrome.tabs.TabUpdatedEvent["addListener"]
>[0];
type TabActivatedListener = Parameters<
  chrome.tabs.TabActivatedEvent["addListener"]
>[0];
type TabDetachedListener = Parameters<
  chrome.tabs.TabDetachedEvent["addListener"]
>[0];
type TabAttachedListener = Parameters<
  chrome.tabs.TabAttachedEvent["addListener"]
>[0];
type TabReplacedListener = Parameters<
  chrome.tabs.TabReplacedEvent["addListener"]
>[0];
type WindowFocusChangedListener = Parameters<
  chrome.windows.WindowIdEvent["addListener"]
>[0];

export interface MockChromeApi {
  runtime: {
    sendMessage: typeof chrome.runtime.sendMessage;
    onMessage: MockEvent<RuntimeExtensionMessageListener>;
  };
  tabs: {
    query: typeof chrome.tabs.query;
    remove: typeof chrome.tabs.remove;
    move: typeof chrome.tabs.move;
    create: typeof chrome.tabs.create;
    onMoved: MockEvent<TabMovedListener>;
    onRemoved: MockEvent<TabRemovedListener>;
    onCreated: MockEvent<TabCreatedListener>;
    onUpdated: MockEvent<TabUpdatedListener>;
    onActivated: MockEvent<TabActivatedListener>;
    onDetached: MockEvent<TabDetachedListener>;
    onAttached: MockEvent<TabAttachedListener>;
    onReplaced: MockEvent<TabReplacedListener>;
  };
  windows: {
    getAll(callback: (windows: Array<chrome.windows.Window>) => void): void;
    onFocusChanged: MockEvent<WindowFocusChangedListener>;
  };
}

declare let global: NodeJS.Global & {
  chrome?: MockChromeApi;
};

export interface ChromeApiListeners {
  runtime: {
    onMessage: Array<RuntimeExtensionMessageListener>;
  };
  tabs: {
    onMoved: Array<TabMovedListener>;
    onRemoved: Array<TabRemovedListener>;
    onCreated: Array<TabCreatedListener>;
    onUpdated: Array<TabUpdatedListener>;
    onActivated: Array<TabActivatedListener>;
    onDetached: Array<TabDetachedListener>;
    onAttached: Array<TabAttachedListener>;
    onReplaced: Array<TabReplacedListener>;
  };
  windows: {
    onFocusChanged: Array<WindowFocusChangedListener>;
  };
}

export function mockChromeApi(tabs: Array<ChromeTab>): ChromeApiListeners {
  if (global.chrome != null) {
    throw new Error(
      "Expected global.chrome not to exist. Did you forget to tear down the mock in a previous test?"
    );
  }

  const listeners: ChromeApiListeners = {
    runtime: {
      onMessage: []
    },
    tabs: {
      onMoved: [],
      onRemoved: [],
      onCreated: [],
      onUpdated: [],
      onActivated: [],
      onDetached: [],
      onAttached: [],
      onReplaced: []
    },
    windows: {
      onFocusChanged: []
    }
  };

  global.chrome = {
    runtime: {
      sendMessage: jest.fn(),
      onMessage: {
        addListener: (cb: RuntimeExtensionMessageListener) => {
          listeners.runtime.onMessage.push(cb);
        },
        removeListener: (cb: RuntimeExtensionMessageListener) => {
          listeners.runtime.onMessage = listeners.runtime.onMessage.filter(
            listener => listener !== cb
          );
        }
      }
    },
    tabs: {
      query: (_options: never, cb: (tabs: Array<ChromeTab>) => void) => {
        cb(tabs);
      },
      remove: jest.fn(),
      move: jest.fn(),
      create: jest.fn(),
      onMoved: {
        addListener: (cb: TabMovedListener) => {
          listeners.tabs.onMoved.push(cb);
        },
        removeListener: (cb: TabMovedListener) => {
          listeners.tabs.onMoved = listeners.tabs.onMoved.filter(
            listener => listener !== cb
          );
        }
      },
      onRemoved: {
        addListener: (cb: TabRemovedListener) => {
          listeners.tabs.onRemoved.push(cb);
        },
        removeListener: (cb: TabRemovedListener) => {
          listeners.tabs.onRemoved = listeners.tabs.onRemoved.filter(
            listener => listener !== cb
          );
        }
      },
      onCreated: {
        addListener: (cb: TabCreatedListener) => {
          listeners.tabs.onCreated.push(cb);
        },
        removeListener: (cb: TabCreatedListener) => {
          listeners.tabs.onCreated = listeners.tabs.onCreated.filter(
            listener => listener !== cb
          );
        }
      },
      onUpdated: {
        addListener: (cb: TabUpdatedListener) => {
          listeners.tabs.onUpdated.push(cb);
        },
        removeListener: (cb: TabUpdatedListener) => {
          listeners.tabs.onUpdated = listeners.tabs.onUpdated.filter(
            listener => listener !== cb
          );
        }
      },
      onActivated: {
        addListener: (cb: TabActivatedListener) => {
          listeners.tabs.onActivated.push(cb);
        },
        removeListener: (cb: TabActivatedListener) => {
          listeners.tabs.onActivated = listeners.tabs.onActivated.filter(
            listener => listener !== cb
          );
        }
      },
      onDetached: {
        addListener: (cb: TabDetachedListener) => {
          listeners.tabs.onDetached.push(cb);
        },
        removeListener: (cb: TabDetachedListener) => {
          listeners.tabs.onDetached = listeners.tabs.onDetached.filter(
            listener => listener !== cb
          );
        }
      },
      onAttached: {
        addListener: (cb: TabAttachedListener) => {
          listeners.tabs.onAttached.push(cb);
        },
        removeListener: (cb: TabAttachedListener) => {
          listeners.tabs.onAttached = listeners.tabs.onAttached.filter(
            listener => listener !== cb
          );
        }
      },
      onReplaced: {
        addListener: (cb: TabReplacedListener) => {
          listeners.tabs.onReplaced.push(cb);
        },
        removeListener: (cb: TabReplacedListener) => {
          listeners.tabs.onReplaced = listeners.tabs.onReplaced.filter(
            listener => listener !== cb
          );
        }
      }
    },
    windows: {
      getAll(callback: (windows: Array<chrome.windows.Window>) => void): void {
        callback(CHROME_WINDOWS);
      },
      onFocusChanged: {
        addListener: (cb: WindowFocusChangedListener) => {
          listeners.windows.onFocusChanged.push(cb);
        },
        removeListener: (cb: WindowFocusChangedListener) => {
          listeners.windows.onFocusChanged = listeners.windows.onFocusChanged.filter(
            listener => listener !== cb
          );
        }
      }
    }
  };

  return listeners;
}

export function teardownChromeApiMock(): void {
  // global.chrome is needed to clean up Chrome event listeners,
  // so components need to be cleaned up before `chrome` is deleted
  cleanUpEnzymeAfterEachTest();

  delete global.chrome;
}
