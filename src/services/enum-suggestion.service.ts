import * as vscode from "vscode";
import { LuaApiSearch } from "@/services/api-search.service";

export class FunctionEnumSuggestor {
    constructor(
        context: vscode.ExtensionContext,
        luaApiSearch: LuaApiSearch
    ) {
        const completionItemProvider: vscode.CompletionItemProvider = {
            async provideCompletionItems(document, position, token, context) {
                const currentLine = document.lineAt(position.line).text.substring(0, position.character);

                const precedingText = findPrecedingFunctionName(currentLine);
                if (!precedingText) { return; }

                const functionMatch = precedingText.functionName.match(/[.:]\w+$/);
                if (!functionMatch) { return; }

                const paramIndex = findFunctionParameterIndex(currentLine.substring(precedingText.openParenthesisIndex + 1));
                if (paramIndex.activeParamText.includes(".")) { return; }

                const suggestions = await luaApiSearch.findFunctionEnumCompletions(functionMatch[0]);
                return suggestions.filter(s => s.paramIndex === paramIndex.index).map(s => {
                    const completionItem = new vscode.CompletionItem(`Enum.${s.enumName} (Expected)`, vscode.CompletionItemKind.Enum);
                    completionItem.insertText = new vscode.SnippetString(`Enum.${s.enumName}.$0`);
                    completionItem.detail = `Argument at index ${paramIndex} must be an EnumItem from Enum.${s.enumName}.`;
                    completionItem.sortText = `!000`;
                    completionItem.command = {
                        command: "editor.action.triggerSuggest",
                        title: "Open Suggestions",
                        arguments: [{ auto: true }]
                    };

                    return completionItem;
                });
            },
        }

        context.subscriptions.push(vscode.languages.registerCompletionItemProvider(
            { language: "lua", scheme: "file" }, completionItemProvider, "(", ","
        ));
    }


}

function findPrecedingFunctionName(text: string) {
    let depth = 0;
    let openParenthesisIndex = -1;

    for (let i = text.length - 1; i >= 0; i--) {
        const char = text[i];
        if (char === ")") { depth++; }
        else if (char === "(") {
            if (depth > 0) { depth--; }
            else {
                openParenthesisIndex = i;
                break;
            }
        }
    }

    if (openParenthesisIndex === -1) { return null; }
    return {
        functionName: text.substring(0, openParenthesisIndex).trim(),
        openParenthesisIndex
    };
}

function findFunctionParameterIndex(text: string) {
    let depth = 0;
    let paramIndex = 0;
    let lastCommaIndex = -1;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === "(") { depth++; }
        else if (char === ")") { depth--; }
        else if (char === "," && depth === 0) {
            paramIndex++;
            lastCommaIndex = i;
        }
    }

    const activeParamText = text.substring(lastCommaIndex + 1).trim();
    return {
        index: paramIndex,
        activeParamText
    };
}