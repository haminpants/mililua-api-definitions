import { BeyondStage, SignalParamType, UIComponentTypeIdentifier } from "@/generated/protobufs/beyond_stage";

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
        formatter: (gilData: BeyondStage) => {
            const scriptTextVariables = gilData.multiLanguageText?.mltWrapper?.stvWrapper?.scriptTextVariables ?? [];
            return [
                ...FILE_HEADER,
                "---@alias ScriptTextVariable",
                ...scriptTextVariables.map(stv => { return `---| "${stv.name}"` })
            ].join("\n");
        }
    },
    Signals: {
        fileName: "Signals.d.lua",
        formatter: (gilData: BeyondStage) => {
            const signals = gilData.unkStageData?.signalWrapper?.signals ?? [];

            const signalNames = [
                "---@alias SignalName"
            ];
            const signalClasses: string[] = [];

            signals.forEach(signal => {
                let i = 0;
                signalNames.push(`---| "${signal.name}"`);
                signalClasses.push(
                    `---@class ${signal.name}`,
                    ...signal.parameters.flatMap(p => {
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
        formatter: (gilData: BeyondStage) => {
            const uiComponents = gilData.uiAssetWrapper?.asset ?? [];

            const clientControlNames = new Set<string>();
            const templateIndexes = [
                "---@alias ClientControlTemplateIndex"
            ]

            uiComponents.forEach(component => {
                const name = component.meta[0]?.nameWrapper?.name;
                const typeIdentifier = component.meta[1]?.typeIdentifier;
                const identifierBytes = component.identifierMeta[2]?.identiferWrapper?.identifierBytes;

                if (name && typeIdentifier === UIComponentTypeIdentifier.UI_COMPONENT_TYPE_IDENTIFIER_CLIENT_CONTROL) {
                    clientControlNames.add(`---| "${name}"`);
                    if (identifierBytes) { templateIndexes.push(`---| ${component.index} # ${name}`); }
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