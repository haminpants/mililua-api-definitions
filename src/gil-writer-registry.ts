import { ScriptTextVariable } from "@Root/protobufs/beyond_stage";
import path from "path";

export enum GilResource {
    ScriptTextVariables
}

const RESOURCES_DIR = ".gil_resources";

interface ResourceHandlerConfig {
    targetPath: string;
    formatContent: (content: any) => string
}

export class GilWriterRegistry {
    readonly writeDir: string;
    private configs: Record<GilResource, ResourceHandlerConfig>;

    constructor(outputDirectory: string) {
        this.writeDir = path.join(outputDirectory, RESOURCES_DIR)
        this.configs = {
            [GilResource.ScriptTextVariables]: {
                targetPath: path.join(this.writeDir, "ScriptTextVariables.d.lua"),
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