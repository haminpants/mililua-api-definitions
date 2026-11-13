export interface FunctionDocumentation {
    documentation: string[],
    functionDefinition: string
}

export interface FunctionEnumCompletion {
    paramIndex: number,
    enumName: string
}