import { ScriptTextVariable } from "@Root/protobufs/beyond_stage";
import path from "path";

export enum GilResource {
    ScriptTextVariables
}

interface ResourceHandlerConfig {
    targetPath: string;
    formatContent: (content: any) => string
}

export class GilWriterRegistry {
    readonly outputDir: string;
    private configs: Record<GilResource, ResourceHandlerConfig>;

    constructor(outputDirectory: string) {
        this.outputDir = path.join(outputDirectory, "gil_resources")
        this.configs = {
            [GilResource.ScriptTextVariables]: {
                targetPath: path.join(this.outputDir, "ScriptTextVariables.d.lua"),
                formatContent(content: ScriptTextVariable[]) {
                    return [
                        "---@meta",
                        "---@alias ScriptTextVariable",
                        ...content.map(v => { return `---| "${v.name}"` })
                    ].join("\n")
                },
            }
        }
    }

    getConfig(resource: GilResource): ResourceHandlerConfig {
        return this.configs[resource];
    }
}