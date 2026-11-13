import * as vscode from "vscode";
import { FunctionDocumentation, FunctionEnumCompletion } from "@/types";
import { getLuaLibraryUri } from "@/utils/uri.utils";
import { LuaApiNamespace } from "@/constants/lua-api-registry";

const functionRegex = /((?:---.*\r?\n)*)\s*(?:function\s+\w+([.:]\w+)\(([^)]*)\))/g;
const paramAnnotationRegex = /---@param\s+(\w+)\s+EnumItem.(\w+)/g;

export class LuaApiSearch {
    private isInitialized = false;
    private initializationPromise: Promise<void> | null = null;
    private readonly luaLibraryUri: vscode.Uri;

    private readonly functionDocumentationCache: Record<string, FunctionDocumentation> = {};
    private readonly functionEnumCompletionCache: Record<string, FunctionEnumCompletion[]> = {}

    constructor(
        context: vscode.ExtensionContext,
    ) {
        this.luaLibraryUri = getLuaLibraryUri(context);
    }

    private async ensureFunctionEnumsInitialized(): Promise<void> {
        if (this.isInitialized) { return; }
        if (this.initializationPromise) { return this.initializationPromise; }

        this.initializationPromise = (async () => {
            const luaDefinitionFilePattern = new vscode.RelativePattern(this.luaLibraryUri, "**/*.d.lua");
            const files = await vscode.workspace.findFiles(luaDefinitionFilePattern);

            for (const file of files) {
                try {
                    const content = new TextDecoder().decode(await vscode.workspace.fs.readFile(file));
                    this.parseFunctionEnumCompletions(content);
                }
                catch (error) {
                    console.error(`Failed to parse definition file: ${file.fsPath}`, error);
                }
            }

            this.isInitialized = true;
            this.initializationPromise = null;
        })();

        return this.initializationPromise;
    }

    private parseFunctionEnumCompletions(content: string) {
        let match;
        while ((match = functionRegex.exec(content)) !== null) {
            const [, documentation, functionSignature, paramsString] = match;
            if (!documentation) { continue; }

            const params = paramsString.split(",").map(p => p.trim()).filter(p => p);
            let paramMatch;
            while ((paramMatch = paramAnnotationRegex.exec(documentation)) !== null) {
                const [, paramName, enumName] = paramMatch;
                const paramIndex = params.indexOf(paramName);
                if (paramIndex === -1) { continue; }
                (this.functionEnumCompletionCache[functionSignature] ??= []).push({ enumName, paramIndex });
            }
        }
    }

    async findFunctionDocumentation<T extends LuaApiNamespace>(namespace: T, functionName: T["FUNCTIONS"][keyof T["FUNCTIONS"]]): Promise<FunctionDocumentation> {
        const functionLookupKey = `${namespace.NAME}.${functionName}`;
        if (this.functionDocumentationCache[functionLookupKey]) { return this.functionDocumentationCache[functionLookupKey]; }

        const file = new TextDecoder().decode(await vscode.workspace.fs.readFile(vscode.Uri.joinPath(this.luaLibraryUri, `${namespace.NAME}.d.lua`)));
        const result = file.match(`((?:---.*\r?\n)*)(function ${namespace.NAME}[.:]${functionName}\\(.*\\) end)`);
        if (!result || result.length < 3) { throw new Error(`Failed to find function ${functionName} in ${namespace.NAME}.`); }

        const functionDocumentation = {
            documentation: result[1].split(/\r?\n/).filter(line => line),
            functionDefinition: result[2].trim()
        }
        this.functionDocumentationCache[functionLookupKey] = functionDocumentation;
        return functionDocumentation;
    }

    async findFunctionEnumCompletions(functionSignature: string) {
        await this.ensureFunctionEnumsInitialized();
        return this.functionEnumCompletionCache[functionSignature];
    }
}