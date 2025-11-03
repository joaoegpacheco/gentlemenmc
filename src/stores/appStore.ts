import { observable } from "@legendapp/state";

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
});

