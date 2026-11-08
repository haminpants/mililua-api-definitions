export type ExtensionConfig = typeof EXTENSION_CONFIG[keyof typeof EXTENSION_CONFIG];
export const EXTENSION_CONFIG = {
    ENABLE_DEFINITIONS: "enableDefinitions",
    EXTRACT_GIL_RESOURCES: "extractGilResources",
} as const;

export type LuaConfig = typeof LUA_CONFIG[keyof typeof LUA_CONFIG];
export const LUA_CONFIG = {
    WORKSPACE_LIBRARY: "workspace.library",
    RUNTIME_VERSION: "runtime.version",
    COMPLETION_SHOW_WORD: "completion.showWord",
    DIAGNOSTICS_DIABLE: "diagnostics.disable"
} as const;

export type LuaDiagnostic = typeof LUA_DIAGNOSTIC[keyof typeof LUA_DIAGNOSTIC];
export const LUA_DIAGNOSTIC = {
    NEED_CHECK_NIL: "need-check-nil",
} as const;