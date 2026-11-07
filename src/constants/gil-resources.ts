import { GilFile, VariableType, UIComponentTypeIdentifier, EntityComponentType } from "@/generated/protobufs/gil";

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
    CustomVariables: {
        fileName: "CustomVariables.d.lua",
        formatter: (gilData: GilFile) => {
            const customVariableAliases = [... new Set([
                ...gilData.prefabAssets?.assets.flatMap(asset => {
                    return asset.components.filter(component => {
                        return component.type === EntityComponentType.ENTITY_COMPONENT_TYPE_CUSTOM_VARIABLE;
                    }).flatMap(customVariableComponent => {
                        return customVariableComponent.customVariables?.entries.map(cv => `---| "${cv.name}"`) ?? []
                    });
                }) ?? [],
                ...gilData.stageAssets?.assets.flatMap(asset => {
                    return asset.components.filter(component => {
                        return component.type === EntityComponentType.ENTITY_COMPONENT_TYPE_CUSTOM_VARIABLE;
                    }).flatMap(customVariableComponent => {
                        return customVariableComponent.customVariables?.entries.map(cv => `---| "${cv.name}"`) ?? [];
                    })
                }) ?? []
            ])];

            return [
                ...FILE_HEADER,
                `---@alias CustomVariableName`,
                ...customVariableAliases
            ].join("\n");
        }
    },
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
    ScriptVariables: {
        fileName: "ScriptVariables.d.lua",
        formatter: (gilData: GilFile) => {
            const scriptVariablesByType: Record<string, Set<string>> = {};
            for (const mapping of gilData.scriptMappingBlock?.scriptMappings ?? []) {
                for (const variable of mapping.scriptVariables) {
                    (scriptVariablesByType[variableTypeAnnotations[variable.type]] ??= new Set()).add(variable.name);
                }
            }

            return [
                ...FILE_HEADER,
                `---@alias ScriptVariableName`,
                ...Object.values(scriptVariablesByType).flatMap(varNames => [...varNames].map(varName => `---| "${varName}"`)),
                ``,
                `---@class Script`,
                `local Script = {}`,
                ``,
                ...Object.entries(scriptVariablesByType).map(typeEntry => `---@overload fun(self: Script, varName: ${[...typeEntry[1]].map(varName => `"${varName}"`).join("|")}): ${typeEntry[0]}`),
                `function Script:GetParam(varName) end`
            ].join("\n");
        }
    },
    Signals: {
        fileName: "Signals.d.lua",
        formatter: (gilData: GilFile) => {
            const signals = gilData.nodeGraphData?.signalContainer?.signals ?? [];

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
} as const;