import { ScriptTextVariable } from "@Root/protobufs/beyond_stage";
import path from "path";

export const RESOURCES_DIR = ".gil_resources";

export enum GilResource {
    ScriptTextVariables
}

interface ResourceHandlerConfig {
    targetPath: string;
    formatContent: (content: any) => string
}

const FILE_HEADER = [
    "---This file should not be mapped in the Client Script Resource Explorer.",
    "---@meta"
];

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
                        ...FILE_HEADER,
                        "---@alias ScriptTextVariable string",
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