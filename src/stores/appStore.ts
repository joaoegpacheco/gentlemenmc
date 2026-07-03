import { observable } from "@legendapp/state";
import { syncObservable } from "@legendapp/state/sync";
import { ObservablePersistSessionStorage } from "@legendapp/state/persist-plugins/local-storage";

const FESTA_PARTICULAR_STORAGE_KEY = "gentlemen-festaParticular";
const ACTIVE_TAB_STORAGE_KEY = "gentlemen-activeTab";

// Global application store
export const appStore$ = observable({
  // User authentication & permissions
  user: {
    id: "",
    email: "",
    admin: null as boolean | null,
    manager: null as boolean | null,
    isBarUser: false,
  },
  
  // UI state
  tabs: {
    activeTab: "1",
  },
  switches: {
    openHouse: false,
    festaParticular: false,
  },
});

if (typeof window !== "undefined") {
  syncObservable(appStore$.switches.festaParticular, {
    persist: {
      name: FESTA_PARTICULAR_STORAGE_KEY,
      plugin: ObservablePersistSessionStorage,
    },
  });

  syncObservable(appStore$.tabs.activeTab, {
    persist: {
      name: ACTIVE_TAB_STORAGE_KEY,
      plugin: ObservablePersistSessionStorage,
    },
  });
}

