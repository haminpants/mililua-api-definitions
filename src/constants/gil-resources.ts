import { ScriptTextVariable, Signal, SignalParamType, UIComponent, UIComponentTypeIdentifier } from "@/generated/protobufs/beyond_stage";

export const GIL_RESOURCE_DIRECTORY = ".gil_resources" as const;

const FILE_HEADER = [
    "---This file should not be mapped in the Client Script Resource Explorer.",
    "---@meta",
    "---@diagnostic disable: luadoc-miss-type-name",
    ""
] as const;

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
} as const;

export type GilResource = keyof typeof GIL_RESOURCES;
export const GIL_RESOURCES = {
    ScriptTextVariables: {
        fileName: "ScriptTextVariables.d.lua",
        formatter: (content: ScriptTextVariable[]) => {
            return [
                ...FILE_HEADER,
                "---@alias ScriptTextVariable",
                ...content.map(v => { return `---| "${v.name}"` })
            ].join("\n");
        }
    },
    Signals: {
        fileName: "Signals.d.lua",
        formatter: (content: Signal[]) => {
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
                        return `---@field [${++i}] ${signalParamTypeAnnotationMapping[p.type]} # ${p.name}`;
                    })
                );
            });

            return [
                ...FILE_HEADER,
                ...signalNames,
                ...signalClasses
            ].join("\n");
        }
    },
    ClientControls: {
        fileName: "ClientControls.d.lua",
        formatter: (content: UIComponent[]) => {
            const clientControlNames = new Set<string>();
            const templateIndexes = [
                "---@alias ClientControlTemplateIndex"
            ]

            content.forEach(c => {
                const name = c.meta[0]?.nameWrapper?.name;
                const typeIdentifier = c.meta[1]?.typeIdentifier;
                const identifierBytes = c.identifierMeta[2]?.identiferWrapper?.identifierBytes;

                if (name && typeIdentifier === UIComponentTypeIdentifier.UI_COMPONENT_TYPE_IDENTIFIER_CLIENT_CONTROL) {
                    clientControlNames.add(`---| "${name}"`);
                    if (identifierBytes) { templateIndexes.push(`---| ${c.index} # ${name}`); }
                }
            })

            return [
                ...FILE_HEADER,
                ...templateIndexes,
                `---@alias ClientControlName`,
                ...clientControlNames
            ].join("\n");
        }
    }
} as const;