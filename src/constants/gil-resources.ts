import { GilResourceExtractFormat, StructureConfigIdMap } from "@/types";
import { GilFile, VariableType, UIComponentTypeIdentifier, EntityComponentType, VariableDefinition, TemplateAssetType, TemplateComponentType } from "@/generated/protobufs/gil";

export const GIL_RESOURCE_DIRECTORY = ".gil_resources" as const;

export type GilResource = keyof typeof GIL_RESOURCES;
export const GIL_RESOURCES: Record<string, GilResourceExtractFormat> = {
    ClientControls: {
        fileName: "ClientControls.d.lua",
        format: (gilData: GilFile) => {
            const uiComponents = gilData.uiComponentBlock?.uiComponents ?? [];

            const clientControlNames = new Set<string>();
            const templateIndexes = [
                "---@alias ClientControlTemplateIndex"
            ];

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
        format: (gilData: GilFile) => {
            const structureConfigIdMap = getStructureConfigIdMappings(gilData);
            const customVariablesByType: Record<string, Set<string>> = {};
            const customVariableAliases = [... new Set([
                ...(gilData.prefabAssets?.assets ?? []).flatMap(asset => {
                    return asset.components.filter(component => {
                        return component.type === EntityComponentType.ENTITY_COMPONENT_TYPE_CUSTOM_VARIABLE;
                    }).flatMap(customVariableComponent => {
                        return customVariableComponent.customVariables?.entries.map(cv => {
                            const type = resolveVariableDefinition(cv.variableDefinitionWrapper?.variableDefinition, structureConfigIdMap);
                            (customVariablesByType[type] ??= new Set()).add(cv.name);
                            return `---| "${cv.name}"`
                        }) ?? [];
                    });
                }) ?? [],
                ...(gilData.stageAssets?.assets ?? []).flatMap(asset => {
                    return asset.components.filter(component => {
                        return component.type === EntityComponentType.ENTITY_COMPONENT_TYPE_CUSTOM_VARIABLE;
                    }).flatMap(customVariableComponent => {
                        return customVariableComponent.customVariables?.entries.map(cv => {
                            const type = resolveVariableDefinition(cv.variableDefinitionWrapper?.variableDefinition, structureConfigIdMap);
                            (customVariablesByType[type] ??= new Set()).add(cv.name);
                            return `---| "${cv.name}"`
                        }) ?? [];
                    });
                }) ?? [],
                ...(gilData.templateAssets?.assets.filter(asset => {
                    return asset.type === TemplateAssetType.TEMPLATE_ASSET_TYPE_CLASS
                }) ?? []).flatMap(assets => {
                    return assets.components.filter(templateComponent => {
                        return templateComponent.type === TemplateComponentType.TEMPLATE_COMPONENT_TYPE_PLAYER || templateComponent.type === TemplateComponentType.TEMPLATE_COMPONENT_TYPE_CHARACTER;
                    }).flatMap(templateComponent => {
                        return [templateComponent.characterClassTemplateComponentsContainer?.component, templateComponent.playerClassTemplateComponentsContainer?.component];
                    }).flatMap(classTemplateComponent => {
                        return classTemplateComponent?.flatMap(c => c.customVariables?.entries ?? []) ?? [];
                    }).filter(customVariableEntry => {
                        return customVariableEntry !== undefined;
                    }).map(customVariableEntry => {
                        const type = resolveVariableDefinition(customVariableEntry.variableDefinitionWrapper?.variableDefinition, structureConfigIdMap);
                        (customVariablesByType[type] ??= new Set()).add(customVariableEntry.name);
                        return `---| "${customVariableEntry.name}"`;
                    });
                })
            ])];

            return [
                ...FILE_HEADER,
                `---@alias CustomVariableName`,
                ...customVariableAliases,
                ``,
                `game = game or {}`,
                ``,
                ...Object.entries(customVariablesByType).map(typeEntry => `---@overload fun(entity: EnumItem.CustomVariableEntityType, varName: ${[...typeEntry[1]].map(varName => `"${varName}"`).join("|")}): ${typeEntry[0]}`),
                `function game.GetGlobalCustomVariableValue(entity, varName) end`
            ].join("\n");
        }
    },
    ScriptTextVariables: {
        fileName: "ScriptTextVariables.d.lua",
        format: (gilData: GilFile) => {
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
        format: (gilData: GilFile) => {
            const scriptVariablesByType: Record<string, Set<string>> = {};
            for (const mapping of gilData.scriptMappingBlock?.scriptMappings ?? []) {
                for (const variable of mapping.scriptVariables) {
                    (scriptVariablesByType[resolveTypeAnnotation({ base: variable.type })] ??= new Set()).add(variable.name);
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
        format: (gilData: GilFile) => {
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
                        return `---@field [${++i}] ${resolveTypeAnnotation({ base: p.type })} # ${p.name}`;
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
    Structures: {
        fileName: "Structures.d.lua",
        format: (gilData: GilFile) => {
            const structureIdMappings = getStructureConfigIdMappings(gilData);
            return [
                ...FILE_HEADER,
                ...(gilData.nodeGraphData?.structureBlocks ?? []).flatMap(block => {
                    if (!block.structure) { return [] };
                    return [
                        `---@class ${block.structure?.name}`,
                        ...block.structure.variables.map(variable => {
                            return `---@field ["${variable.name}"] ${resolveVariableDefinition(variable.typeDefinition, structureIdMappings)}`;
                        })
                    ];
                }) ?? []
            ].join("\n");
        }
    }
} as const;

const FILE_HEADER = [
    "---This file should not be mapped in the Client Script Resource Explorer.",
    "---@meta",
    "---@diagnostic disable: luadoc-miss-type-name",
    ""
] as const;

const VARIABLE_TYPE_ANNOTATIONS: Record<VariableType, string> = {
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

function getStructureConfigIdMappings(gilData: GilFile) {
    const structures: Record<number, string> = {}
    for (const block of gilData.nodeGraphData?.structureBlocks ?? []) {
        if (!block.structure) { continue; }
        structures[block.structure.id] = block.structure.name;
    }
    return structures;
}

function resolveVariableDefinition(variableDefinition?: VariableDefinition, structureConfigIdMap?: StructureConfigIdMap) {
    return resolveTypeAnnotation({
        base: variableDefinition?.type ?? VariableType.UNRECOGNIZED,
        baseStructureId: variableDefinition?.definition?.structureId,
        keyType: variableDefinition?.definition?.dictionaryKeyType,
        valueType: variableDefinition?.definition?.dictionaryValueType,
        valueStructureId: variableDefinition?.definition?.dictionaryValueStructureId
    }, structureConfigIdMap);
}

function resolveTypeAnnotation(type: {
    base: VariableType,
    baseStructureId?: number,
    keyType?: VariableType,
    valueType?: VariableType,
    valueStructureId?: number
}, structureConfigIdMap?: StructureConfigIdMap): string {
    switch (type.base) {
        case VariableType.VARIABLE_TYPE_STRUCTURE:
            return (structureConfigIdMap ?? {})[type.baseStructureId ?? -1] ?? "table";
        case VariableType.VARIABLE_TYPE_STRUCTURE_LIST:
            return `${(structureConfigIdMap ?? {})[type.baseStructureId ?? -1] ?? "table"}[]`;
        case VariableType.VARIABLE_TYPE_DICTIONARY:
            return `table<${VARIABLE_TYPE_ANNOTATIONS[type.keyType ?? VariableType.UNRECOGNIZED]}, ${resolveTypeAnnotation({ base: type.valueType ?? VariableType.UNRECOGNIZED, baseStructureId: type.valueStructureId }, structureConfigIdMap)}>`
        default:
            return VARIABLE_TYPE_ANNOTATIONS[type.base];
    }
}