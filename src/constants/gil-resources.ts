import { GilFile, VariableType, UIComponentTypeIdentifier } from "@/generated/protobufs/gil";

export const GIL_RESOURCE_DIRECTORY = ".gil_resources" as const;

const FILE_HEADER = [
    "---This file should not be mapped in the Client Script Resource Explorer.",
    "---@meta",
    "---@diagnostic disable: luadoc-miss-type-name",
    ""
] as const;

const variableTypeAnnotations: Record<VariableType, string> = {
    [VariableType.VARIABLE_TYPE_UNSPECIFIED]: "nil",
    [VariableType.VARIABLE_TYPE_ENTITY]: "integer",
    [VariableType.VARIABLE_TYPE_GUID]: "integer",
    [VariableType.VARIABLE_TYPE_INTEGER]: "integer",
    [VariableType.VARIABLE_TYPE_BOOLEAN]: "boolean",
    [VariableType.VARIABLE_TYPE_FLOATING_POINT_NUMBER]: "number",
    [VariableType.VARIABLE_TYPE_STRING]: "string",
    [VariableType.VARIABLE_TYPE_GUID_LIST]: "integer[]",
    [VariableType.VARIABLE_TYPE_INTEGER_LIST]: "integer[]",
    [VariableType.VARIABLE_TYPE_BOOLEAN_LIST]: "boolean[]",
    [VariableType.VARIABLE_TYPE_FLOATING_POINT_LIST]: "number[]",
    [VariableType.VARIABLE_TYPE_STRING_LIST]: "string[]",
    [VariableType.VARIABLE_TYPE_3D_VECTOR]: "Vector3",
    [VariableType.VARIABLE_TYPE_ENTITY_LIST]: "integer[]",
    [VariableType.VARIABLE_TYPE_3D_VECTOR_LIST]: "Vector3[]",
    [VariableType.VARIABLE_TYPE_FACTION]: "integer",
    [VariableType.VARIABLE_TYPE_CONFIG_ID]: "integer",
    [VariableType.VARIABLE_TYPE_PREFAB_ID]: "integer",
    [VariableType.VARIABLE_TYPE_CONFIG_ID_LIST]: "integer[]",
    [VariableType.VARIABLE_TYPE_PREFAB_ID_LIST]: "integer[]",
    [VariableType.VARIABLE_TYPE_FACTION_LIST]: "integer[]",
    [VariableType.VARIABLE_TYPE_STRUCTURE]: "table",
    [VariableType.VARIABLE_TYPE_STRUCTURE_LIST]: "table[]",
    [VariableType.VARIABLE_TYPE_DICTIONARY]: "table",
    [VariableType.UNRECOGNIZED]: "nil",
} as const;

export type GilResource = keyof typeof GIL_RESOURCES;
export const GIL_RESOURCES = {
    ScriptTextVariables: {
        fileName: "ScriptTextVariables.d.lua",
        formatter: (gilData: GilFile) => {
            const scriptTextVariables = gilData.multiLanguageText?.multiLanguageTextWrapper?.scriptTextVariableContainer?.scriptTextVariables ?? [];
            return [
                ...FILE_HEADER,
                "---@alias ScriptTextVariable",
                ...scriptTextVariables.map(stv => { return `---| "${stv.name}"` })
            ].join("\n");
        }
    },
    Signals: {
        fileName: "Signals.d.lua",
        formatter: (gilData: GilFile) => {
            const signals = gilData.unkStageData?.signalContainer?.signals ?? [];

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
                        return `---@field [${++i}] ${variableTypeAnnotations[p.type]} # ${p.name}`;
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
        formatter: (gilData: GilFile) => {
            const uiComponents = gilData.uiComponentBlock?.uiComponents ?? [];

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
    },
    ScriptVariables: {
        fileName: "ScriptVariables.d.lua",
        formatter: (gilData: GilFile) => {
            const scriptVariableNames = [...new Set(
                gilData.scriptMappingBlock?.scriptMappings.flatMap(mapping => mapping.scriptVariables.map(variable => `---| "${variable.name}"`)) ?? []
            )];

            return [
                ...FILE_HEADER,
                `---@alias ScriptVariableName`,
                ...scriptVariableNames
            ].join("\n");
        }
    }
} as const;