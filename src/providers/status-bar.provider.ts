import * as vscode from "vscode";
import { SHORT_ID } from "@/constants/extension";
import { COMMANDS } from "@/constants/commands";
import { CONFIGS, getWorkspaceConfig } from "@/constants/config";

let isStatusBarRegistered = false;

export function registerStatusBar(context: vscode.ExtensionContext) {
    if (isStatusBarRegistered) { return; }

    const statusBarManager = new StatusBarManager();

    const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
        if (!e.affectsConfiguration(SHORT_ID)) { return; }
        statusBarManager.update();
    });

    const openMiliLuaSettingsCommand = vscode.commands.registerCommand(COMMANDS.OpenMiliLuaSettings, args => {
        vscode.commands.executeCommand("workbench.action.openWorkspaceSettings", `@ext:${context.extension.id}`);
    });

    const enableDefinitionsCommand = vscode.commands.registerCommand(COMMANDS.EnableDefinitions, args => {
        vscode.workspace.getConfiguration(SHORT_ID).update(CONFIGS.EnableDefinitions, true);
    });

    const enableGilResourceExtractionCommand = vscode.commands.registerCommand(COMMANDS.EnableGilResourceExtraction, args => {
        vscode.workspace.getConfiguration(SHORT_ID).update(CONFIGS.ExtractGilResources, true);
    });

    context.subscriptions.push(
        statusBarManager,
        configChangeListener,
        openMiliLuaSettingsCommand,
        enableDefinitionsCommand,
        enableGilResourceExtractionCommand,
    );

    isStatusBarRegistered = true;
}

class StatusBarManager implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
        this.statusBarItem.show();
        this.update();
    }

    update() {
        const isDefinitionsEnabled = getWorkspaceConfig("enableDefinitions");
        const extractGilResources = getWorkspaceConfig("extractGilResources");
        const tooltip = new vscode.MarkdownString();
        const tooltipNotes: string[] = [];
        let status = isDefinitionsEnabled && extractGilResources ? "✅" : isDefinitionsEnabled || extractGilResources ? "⚠️" : "❌";

        tooltip.appendMarkdown([
            `## MiliLua API Definitions Status`,
            `### Miliastra Lua API Definitions: ${isDefinitionsEnabled ? `✅` : "❌"}`,
            `### Gil Resource Extraction: ${extractGilResources ? (isDefinitionsEnabled ? "✅" : "⚠️") : "❌"}`,
            `---`,
            ...tooltipNotes,
            `[Open MiliLua Settings](command:${COMMANDS.OpenMiliLuaSettings}) • [Restart Language Server](command:lua.startServer)`
        ].join("\n"));

        this.statusBarItem.text = `Miliastra ${status}`;
        this.statusBarItem.tooltip = tooltip;
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}