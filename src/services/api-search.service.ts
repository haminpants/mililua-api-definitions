import * as vscode from "vscode";
import { readFile } from "fs/promises";
import { getLuaLibraryUri } from "@/utils/uri.utils";
import { LuaApiNamespace } from "@/constants/lua-api-registry";

export class LuaApiSearch {
    private readonly luaLibraryUri: vscode.Uri;

    constructor(
        context: vscode.ExtensionContext,
    ) {
        this.luaLibraryUri = getLuaLibraryUri(context);
    }

    async findFunctionDocumentation<T extends LuaApiNamespace>(namespace: T, functionName: T["FUNCTIONS"][keyof T["FUNCTIONS"]]) {
        const file = await readFile(vscode.Uri.joinPath(this.luaLibraryUri, `${namespace.NAME}.d.lua`).fsPath, "utf-8");
        const result = file.match(`(?:---.*\n)*(function ${namespace.NAME}[.:]${functionName}\(.*\) end)`);
        if (!result) { throw new Error(`Failed to find function ${functionName} in ${namespace.NAME}.`); }
        console.log(result);
    }
}