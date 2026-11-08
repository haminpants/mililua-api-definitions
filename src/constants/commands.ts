import { SHORT_ID } from "./extension";

export const COMMANDS = {
    REFRESH_SAVE_EXPLORER: `${SHORT_ID}.refreshSaveExplorer`,
    SELECT_SAVE_EXPLORER_ITEM: `${SHORT_ID}.selectSaveExplorerItem`,
    OPEN_MILILUA_SETTINGS: `${SHORT_ID}.openMiliLuaSettings`,
    ENABLE_DEFINITIONS: `${SHORT_ID}.enableDefinitions`,
    ENABLE_GIL_RESOURCE_EXTRACTION: `${SHORT_ID}.enableGilResourceExtraction`,
    FORCE_UPDATE_GIL_RESOURCES: `${SHORT_ID}.updateGilResources`,
    TOGGLE_LUA_WORD_COMPLETION: `${SHORT_ID}.toggleLuaWordCompletion`,
    TOGGLE_LUA_DIAGNOSTIC_NIL_CHECK: `${SHORT_ID}.toggleLuaDiagnosticNeedCheckNil`,
} as const;