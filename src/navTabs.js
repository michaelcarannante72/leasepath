/** One list for the mobile dock and the desktop header nav. Ruby sits in the middle: three tabs before her, two after (the dock widens those two so she is centered). */
export const NAV_TABS = [
  { id: 'search', label: 'Search', icon: 'search' },
  { id: 'steps', label: 'Steps', icon: 'steps' },
  { id: 'resources', label: 'Resources', icon: 'heart' },
  { id: 'assistant', label: 'Ruby', icon: 'spark', center: true },
  { id: 'blog', label: 'Blog', icon: 'blog' },
  { id: 'plan', label: 'My voucher', icon: 'card' },
]

/** The phone dock holds five: two tabs, Ruby in the center, two tabs. Blog moves to the header menu on phones (still in the desktop header nav). */
export const DOCK_IDS = ['search', 'steps', 'assistant', 'resources', 'plan']
export const DOCK_TABS = DOCK_IDS.map((id) => NAV_TABS.find((tab) => tab.id === id))
