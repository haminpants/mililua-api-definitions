export type LuaApiNamespace = typeof LUA_API_REGISTRY[keyof typeof LUA_API_REGISTRY];
export const LUA_API_REGISTRY = {
    GAME: {
        NAME: "game",
        FUNCTIONS: {
            GET_GLOBAL_CUSTOM_VARIABLE_VALUE: "GetGlobalCustomVariableValue",
        }
    },
    SCRIPT: {
        NAME: "Script",
        FUNCTIONS: {
            GET_PARAM: "GetParam",
        }
    },
} as const;