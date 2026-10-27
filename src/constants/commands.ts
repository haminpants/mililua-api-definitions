import { SHORT_ID } from "./extension";

export const COMMANDS = {
    RefreshSaveExplorer: `${SHORT_ID}.refreshSaveExplorer`,
    SelectSaveExplorerItem: `${SHORT_ID}.selectSaveExplorerItem`,
    OpenMiliLuaSettings: `${SHORT_ID}.openMiliLuaSettings`,
    EnableDefinitions: `${SHORT_ID}.enableDefinitions`,
    EnableGilResourceExtraction: `${SHORT_ID}.enableGilResourceExtraction`,
    ForceUpdateGilResources: `${SHORT_ID}.updateGilResources`
} as const;