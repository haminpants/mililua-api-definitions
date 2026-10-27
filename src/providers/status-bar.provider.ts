import * as vscode from "vscode";
import { COMMANDS } from "@/constants/commands";
import { SHORT_ID } from "@/constants/extension";
import { GilManager } from "@/services/gil-manager.service";
import { CONFIGS, getWorkspaceConfig } from "@/constants/config";
import { isInMiliLuaWorkspace } from "../utils/extension.utils";

let isStatusBarRegistered = false;

export function registerStatusBar(context: vscode.ExtensionContext, workspaceFolder: vscode.WorkspaceFolder, gilManager: GilManager) {
    if (isStatusBarRegistered) { return; }

    const statusBarManager = new StatusBarManager(workspaceFolder, gilManager);

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
    private readonly statusBarItem: vscode.StatusBarItem;

    constructor(
        private readonly workspaceFolder: vscode.WorkspaceFolder,
        private readonly gilManager: GilManager,
    ) {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
        this.update();
    }

    async update() {
        if (!await isInMiliLuaWorkspace(this.workspaceFolder)) {
            this.statusBarItem.hide();
            return;
        }

        const isDefinitionsEnabled = getWorkspaceConfig("enableDefinitions");
        const extractGilResources = getWorkspaceConfig("extractGilResources");
        const tooltip = new vscode.MarkdownString();
        const tooltipNotes: string[] = [];
        let status = isDefinitionsEnabled && extractGilResources ? "✅" : isDefinitionsEnabled || extractGilResources ? "⚠️" : "❌";

        if (isDefinitionsEnabled) {
            if (extractGilResources) {
                tooltipNotes.push(
                    `#### 📄 Listening for changes to \`${this.gilManager.gilFileName}\``,
                    `- Resources extraction will be attempted when a change is detected to \`${this.gilManager.gilFileName}\``,
                    `- [Force Refresh Gil Resources](command:${COMMANDS.ForceUpdateGilResources})\n`
                );
            }
            else {
                tooltipNotes.push(
                    `#### ⚠️ Gil Resource Extraction is disabled`,
                    `- [Enable Gil Resource Extraction](command:${COMMANDS.EnableGilResourceExtraction})\n`
                );
            }
        }
        else {
            if (extractGilResources) {
                tooltipNotes.push(
                    `#### ⚠️ Gil Resource Extraction will only work if Miliastra Lua API Definitions are enabled`,
                    `- [Enable Miliastra Lua API Definitions](command:${COMMANDS.EnableDefinitions})\n`
                );
            }
            else {
                tooltipNotes.push(
                    `#### ❌ Miliastra Lua API Definitions are disabled`,
                    `- [Enable Miliastra Lua API Definitions](command:${COMMANDS.EnableDefinitions})\n`
                );
            }
        }

        tooltip.isTrusted = true;
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
        this.statusBarItem.show();
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}