import * as vscode from "vscode";
import * as fs from "fs/promises";
import { GilFile } from "@/generated/protobufs/gil";
import { LuaApiSearch } from "@/services/api-search.service";
import { GIL_RESOURCE_DIRECTORY, GIL_RESOURCES, GilResource } from "@/constants/gil-resources";
import stableStringify from "fast-json-stable-stringify";


export class GilResourceHandler {
    private readonly resourceDirectoryUri: vscode.Uri;
    private readonly luaApiSearch: LuaApiSearch;
    private hashFn: ((input: string) => number) | null = null;
    private readonly hashCache: Record<GilResource, number> = {
        ClientControls: Infinity,
        CustomVariables: Infinity,
        ScriptTextVariables: Infinity,
        ScriptVariables: Infinity,
        Signals: Infinity,
        Structures: Infinity,
    };

    constructor(
        context: vscode.ExtensionContext,
        rootUri: vscode.Uri
    ) {
        this.resourceDirectoryUri = vscode.Uri.joinPath(rootUri, GIL_RESOURCE_DIRECTORY);
        this.getHashFunction();
        this.luaApiSearch = new LuaApiSearch(context);
    }

    async extractResource(key: GilResource, gilData: GilFile, force: boolean = false): Promise<boolean> {
        const hashFn = await this.getHashFunction();
        const newHash = hashFn(stableStringify(gilData));
        const extractTargetUri = vscode.Uri.joinPath(this.resourceDirectoryUri, GIL_RESOURCES[key].fileName);

        let fileExists = true;
        try { await fs.access(extractTargetUri.fsPath); }
        catch { fileExists = false; }

        if (!force && newHash === this.hashCache[key] && fileExists) { return false; }

        try {
            await fs.mkdir(this.resourceDirectoryUri.fsPath, { recursive: true });
            await fs.writeFile(extractTargetUri.fsPath, await GIL_RESOURCES[key].format(gilData, this.luaApiSearch), "utf-8");
            this.hashCache[key] = newHash;
            return true;
        }
        catch (error) {
            console.error(`Failed to extract resource ${key}`, error);
            return false;
        }
    }

    private async getHashFunction() {
        if (!this.hashFn) {
            const xxhash = (await import("xxhash-wasm")).default
            const { h32 } = await xxhash();
            this.hashFn = (input: string) => h32(input, 0);
        }
        return this.hashFn;
    }
}