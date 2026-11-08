export type ExtensionConfig = typeof EXTENSION_CONFIG[keyof typeof EXTENSION_CONFIG];
export const EXTENSION_CONFIG = {
    EnableDefinitions: "enableDefinitions",
    ExtractGilResources: "extractGilResources",
} as const;

export type LuaConfig = typeof LUA_CONFIG[keyof typeof LUA_CONFIG];
export const LUA_CONFIG = {
    WorkspaceLibrary: "workspace.library",
    RuntimeVersion: "runtime.version",
    CompletionShowWord: "completion.showWord",
    DiagnosticsDisable: "diagnostics.disable"
} as const;

export type LuaDiagnostic = typeof LUA_DIAGNOSTIC[keyof typeof LUA_DIAGNOSTIC];
export const LUA_DIAGNOSTIC = {
    NeedCheckNil: "need-check-nil",
} as const;