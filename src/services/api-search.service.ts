import * as vscode from "vscode";
import { FunctionDocumentation } from "@/types";
import { getLuaLibraryUri } from "@/utils/uri.utils";
import { LuaApiNamespace } from "@/constants/lua-api-registry";

export class LuaApiSearch {
    private readonly luaLibraryUri: vscode.Uri;
    private readonly newlineRegex = new RegExp("\r?\n");
    private readonly functionDocumentationCache: Record<string, FunctionDocumentation> = {};

    constructor(
        context: vscode.ExtensionContext,
    ) {
        this.luaLibraryUri = getLuaLibraryUri(context);
    }

    async findFunctionDocumentation<T extends LuaApiNamespace>(namespace: T, functionName: T["FUNCTIONS"][keyof T["FUNCTIONS"]]): Promise<FunctionDocumentation> {
        const functionLookupKey = `${namespace.NAME}.${functionName}`;
        if (this.functionDocumentationCache[functionLookupKey]) { return this.functionDocumentationCache[functionLookupKey]; }

        const file = new TextDecoder().decode(await vscode.workspace.fs.readFile(vscode.Uri.joinPath(this.luaLibraryUri, `${namespace.NAME}.d.lua`)));
        const result = file.match(`((?:---.*\r?\n)*)(function ${namespace.NAME}[.:]${functionName}\\(.*\\) end)`);
        if (!result || result.length < 3) { throw new Error(`Failed to find function ${functionName} in ${namespace.NAME}.`); }

        const functionDocumentation = {
            documentation: result[1].split(this.newlineRegex).filter(line => line),
            functionDefinition: result[2].trim()
        }
        this.functionDocumentationCache[functionLookupKey] = functionDocumentation;
        return functionDocumentation;
    }
}