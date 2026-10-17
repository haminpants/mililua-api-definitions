import stableStringify from "fast-json-stable-stringify";

export enum GilResourceCacheId {
    ScriptTextVariables
}

export class GilResourceHandler {
    private hashFn: ((input: string) => number) | null = null;
    private hashCache: Record<GilResourceCacheId, number> = {
        [GilResourceCacheId.ScriptTextVariables]: Infinity,
    };

    private async getHashFunction() {
        if (!this.hashFn) {
            const xxhash = (await import("xxhash-wasm")).default
            const { h32 } = await xxhash();
            this.hashFn = (input: string) => h32(input, 0);
        }
        return this.hashFn;
    }

    async checkIfResourceChanged(key: GilResourceCacheId, value: object, onChanged: () => void | Promise<void>) {
        const hash = await this.getHashFunction();
        const newHash = hash(stableStringify(value));

        if (newHash !== this.hashCache[key]) {
            this.hashCache[key] = newHash;
            await onChanged();
        }
    }
}