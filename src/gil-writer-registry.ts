import { ScriptTextVariable, Signal, SignalParamType, UIComponent } from "@Root/protobufs/beyond_stage";
import path from "path";

export const RESOURCES_DIR = ".gil_resources";

const FILE_HEADER = [
    "---This file should not be mapped in the Client Script Resource Explorer.",
    "---@meta",
    "---@diagnostic disable: luadoc-miss-type-name",
    ""
];

const signalParamTypeAnnotationMapping: Record<SignalParamType, string> = {
    [SignalParamType.SIGNAL_PARAM_TYPE_UNSPECIFIED]: "nil",
    [SignalParamType.SIGNAL_PARAM_TYPE_ENTITY]: "integer",
    [SignalParamType.SIGNAL_PARAM_TYPE_GUID]: "integer",
    [SignalParamType.SIGNAL_PARAM_TYPE_INTEGER]: "integer",
    [SignalParamType.SIGNAL_PARAM_TYPE_BOOLEAN]: "boolean",
    [SignalParamType.SIGNAL_PARAM_TYPE_FLOATING_POINT_NUMBER]: "number",
    [SignalParamType.SIGNAL_PARAM_TYPE_STRING]: "string",
    [SignalParamType.SIGNAL_PARAM_TYPE_GUID_LIST]: "integer",
    [SignalParamType.SIGNAL_PARAM_TYPE_INTEGER_LIST]: "integer[]",
    [SignalParamType.SIGNAL_PARAM_TYPE_BOOLEAN_LIST]: "boolean[]",
    [SignalParamType.SIGNAL_PARAM_TYPE_FLOATING_POINT_LIST]: "number[]",
    [SignalParamType.SIGNAL_PARAM_TYPE_STRING_LIST]: "string[]",
    [SignalParamType.SIGNAL_PARAM_TYPE_3D_VECTOR]: "Vector3",
    [SignalParamType.SIGNAL_PARAM_TYPE_ENTITY_LIST]: "integer[]",
    [SignalParamType.SIGNAL_PARAM_TYPE_3D_VECTOR_LIST]: "Vector3[]",
    [SignalParamType.SIGNAL_PARAM_TYPE_CONFIG_ID]: "integer",
    [SignalParamType.SIGNAL_PARAM_TYPE_PREFAB_ID]: "integer",
    [SignalParamType.SIGNAL_PARAM_TYPE_CONFIG_ID_LIST]: "integer[]",
    [SignalParamType.SIGNAL_PARAM_TYPE_PREFAB_ID_LIST]: "integer[]",
    [SignalParamType.UNRECOGNIZED]: "nil"
}

export enum GilResource {
    ScriptTextVariables,
    Signals,
    ClientControlTemplateIndex
}

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
                        ...FILE_HEADER,
                        "---@alias ScriptTextVariable",
                        ...content.map(v => { return `---| "${v.name}"` })
                    ].join("\n");
                },
            },
            [GilResource.Signals]: {
                targetPath: path.join(this.writeDir, "Signals.d.lua"),
                formatContent(content: Signal[]) {
                    const signalNames = [
                        "---@alias SignalName"
                    ];
                    const signalClasses: string[] = [];

                    content.forEach(s => {
                        let i = 0;
                        signalNames.push(`---| "${s.name}"`);
                        signalClasses.push(
                            `---@class ${s.name}`,
                            ...s.parameters.flatMap(p => {
                                i++;
                                return `---@field [${i}] ${signalParamTypeAnnotationMapping[p.type]} # ${p.name}`;
                            })
                        )
                    })

                    return [
                        ...FILE_HEADER,
                        ...signalNames,
                        ...signalClasses
                    ].join("\n");
                },
            },
            [GilResource.ClientControlTemplateIndex]: {
                targetPath: path.join(this.writeDir, "ClientControlTemplateIndexes.d.lua"),
                formatContent(content: UIComponent[]) {
                    const templateIndexes = [
                        "---@alias ClientControlTemplateIndex"
                    ]

                    content.forEach(c => {
                        const name = c.meta[0]?.nameWrapper?.name;
                        const identifierBytes = c.identifierMeta[2]?.identiferWrapper?.identifierBytes;

                        if (!name) { return; }
                        if (!identifierBytes || !identifierBytes.match(`^\\[0-9]{3}\\200\\200\\200\\004$`)) { return; }

                        templateIndexes.push(`---| ${c.index} # ${name}`);
                    })

                    return [
                        ...FILE_HEADER,
                        ...templateIndexes
                    ].join("\n");
                },
            }
        }
    }

    getConfig(resource: GilResource): ResourceHandlerConfig {
        return this.configs[resource];
    }
}