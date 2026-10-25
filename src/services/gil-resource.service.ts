import * as vscode from "vscode";
import * as fs from "fs/promises";
import stableStringify from "fast-json-stable-stringify";
import { GIL_RESOURCES, GilResource } from "@/constants/gil-resources";


export class GilResourceHandler {
    private readonly uri: vscode.Uri;
    private hashFn: ((input: string) => number) | null = null;
    private hashCache: Record<GilResource, number> = {
        ScriptTextVariables: Infinity,
        Signals: Infinity,
        ClientControls: Infinity
    };

    constructor(rootUri: vscode.Uri) {
        this.uri = vscode.Uri.joinPath(rootUri, ".gil_resources");
        this.getHashFunction();
    }

    async processResource(key: GilResource, value: object, force: boolean = false): Promise<boolean> {
        const hash = await this.getHashFunction();
        const newHash = hash(stableStringify(value));

        let fileExists = true;
        try { await fs.access(vscode.Uri.joinPath(this.uri, key).fsPath); }
        catch { fileExists = false; }

        if (!force && newHash === this.hashCache[key] && fileExists) { return false; }

        this.hashCache[key] = newHash;

        const formatter = GIL_RESOURCES[key].formatter as (content: any) => string;

        await fs.mkdir(this.uri.fsPath, { recursive: true })
        await fs.writeFile(vscode.Uri.joinPath(this.uri, GIL_RESOURCES[key].fileName).fsPath, formatter(value), "utf-8");
        return true;
    }

    private async getHashFunction() {
        if (!this.hashFn) {
            const xxhash = (await import("xxhash-wasm")).default
            const { h32 } = await xxhash();
            this.hashFn = (input: string) => h32(input, 0);
        }
        return this.hashFn;
    }

    getFsPath() {
        return this.uri.fsPath;
    }
}