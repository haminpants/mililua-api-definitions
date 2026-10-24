import { EXTENSION_ID } from "@/constants/extension";

export const COMMANDS = {
    REFRESH_SAVE_EXPLORER: `${EXTENSION_ID}.refreshSaveExplorer`,
    SELECT_SAVE_EXPLORER_ITEM: `${EXTENSION_ID}.selectSaveExplorerItem`,
} as const;