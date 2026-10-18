import * as fs from "fs/promises";
import * as path from "path";
import stableStringify from "fast-json-stable-stringify";
import { GilResource, GilWriterRegistry } from "./gil-writer-registry";
import { WorkspaceFolder } from "vscode";

export class GilResourceHandler {
    private registry: GilWriterRegistry;
    private hashFn: ((input: string) => number) | null = null;
    private hashCache: Record<GilResource, number> = {
        [GilResource.ScriptTextVariables]: Infinity,
        [GilResource.Signals]: Infinity,
    };

    constructor(workspaceFolder: WorkspaceFolder) {
        this.registry = new GilWriterRegistry(workspaceFolder.uri.fsPath);
    }

    private async getHashFunction() {
        if (!this.hashFn) {
            const xxhash = (await import("xxhash-wasm")).default
            const { h32 } = await xxhash();
            this.hashFn = (input: string) => h32(input, 0);
        }
        return this.hashFn;
    }

    async processResource(key: GilResource, value: object): Promise<boolean> {
        const hash = await this.getHashFunction();
        const newHash = hash(stableStringify(value));

        if (newHash === this.hashCache[key]) { return false; }
        this.hashCache[key] = newHash;

        const resourceConfig = this.registry.getConfig(key)
        await fs.mkdir(path.dirname(resourceConfig.targetPath), { recursive: true })
        await fs.writeFile(resourceConfig.targetPath, resourceConfig.formatContent(value), "utf-8");
        return true;
    }
}