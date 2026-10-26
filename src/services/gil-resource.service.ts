import * as vscode from "vscode";
import * as fs from "fs/promises";
import stableStringify from "fast-json-stable-stringify";
import { GIL_RESOURCES, GilResource } from "@/constants/gil-resources";
import { BeyondStage } from "@/generated/protobufs/beyond_stage";


export class GilResourceHandler {
    private hashFn: ((input: string) => number) | null = null;
    private hashCache: Record<GilResource, number> = {
        ScriptTextVariables: Infinity,
        Signals: Infinity,
        ClientControls: Infinity
    };

    constructor(
        public readonly uri: vscode.Uri,
    ) {
        this.getHashFunction();
    }

    async processResource(key: GilResource, gilData: BeyondStage, force: boolean = false): Promise<boolean> {
        const hashFn = await this.getHashFunction();
        const newHash = hashFn(stableStringify(gilData));

        let fileExists = true;
        try { await fs.access(vscode.Uri.joinPath(this.uri, key).fsPath); }
        catch { fileExists = false; }

        if (!force && newHash === this.hashCache[key] && fileExists) { return false; }

        this.hashCache[key] = newHash;
        await fs.mkdir(this.uri.fsPath, { recursive: true })
        await fs.writeFile(vscode.Uri.joinPath(this.uri, GIL_RESOURCES[key].fileName).fsPath, GIL_RESOURCES[key].formatter(gilData), "utf-8");
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
}