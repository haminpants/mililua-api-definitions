import { EXTENSION_ID } from "@/constants/extension";

export const COMMANDS = {
    RefreshSaveExplorer: `${EXTENSION_ID}.refreshSaveExplorer`,
    SelectSaveExplorerItem: `${EXTENSION_ID}.selectSaveExplorerItem`,
} as const;