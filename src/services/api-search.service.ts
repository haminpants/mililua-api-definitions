import * as vscode from "vscode";
import { readFile } from "fs/promises";
import { getLuaLibraryUri } from "@/utils/uri.utils";
import { LUA_API_REGISTRY, LuaApiNamespace } from "@/constants/lua-api-registry";

export class LuaApiSearch {
    private readonly luaLibraryUri: vscode.Uri;
    private readonly newlineRegex = new RegExp("\r?\n");

    constructor(
        context: vscode.ExtensionContext,
    ) {
        this.luaLibraryUri = getLuaLibraryUri(context);
    }

    async findFunctionDocumentation<T extends LuaApiNamespace>(namespace: T, functionName: T["FUNCTIONS"][keyof T["FUNCTIONS"]]) {
        const file = await readFile(vscode.Uri.joinPath(this.luaLibraryUri, `${namespace.NAME}.d.lua`).fsPath, "utf-8");
        const result = file.match(`((?:---.*\r?\n)*)(function ${namespace.NAME}[.:]${functionName}\\(.*\\) end)`);
        if (!result || result.length < 3) { throw new Error(`Failed to find function ${functionName} in ${namespace.NAME}.`); }
        return {
            documentation: result[1].split(this.newlineRegex).filter(line => line),
            functionDefinition: result[2]
        }
    }
}