import * as vscode from "vscode";
import { COMMANDS } from "@/constants/commands";
import { SHORT_ID } from "@/constants/extension";
import { GilManager } from "@/services/gil-manager.service";
import { isInMiliLuaWorkspace } from "@/utils/extension.utils";
import { ConfigManager } from "@/services/config-manager.service";
import { EXTENSION_CONFIG, LUA_CONFIG, LUA_DIAGNOSTIC } from "@/constants/config";

let isStatusBarRegistered = false;

export function registerStatusBar(context: vscode.ExtensionContext, workspaceFolder: vscode.WorkspaceFolder, configManager: ConfigManager, gilManager: GilManager) {
    if (isStatusBarRegistered) { return; }

    const statusBarManager = new StatusBarManager(workspaceFolder, configManager, gilManager);

    const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
        if (!(e.affectsConfiguration(SHORT_ID) || e.affectsConfiguration("Lua"))) { return; }
        statusBarManager.update();
    });

    const openMiliLuaSettingsCommand = vscode.commands.registerCommand(COMMANDS.OPEN_MILILUA_SETTINGS, args => {
        vscode.commands.executeCommand("workbench.action.openWorkspaceSettings", `@ext:${context.extension.id}`);
    });

    const enableDefinitionsCommand = vscode.commands.registerCommand(COMMANDS.ENABLE_DEFINITIONS, args => {
        configManager.toggleExtensionConfig(EXTENSION_CONFIG.ENABLE_DEFINITIONS, true);
    });

    const enableGilResourceExtractionCommand = vscode.commands.registerCommand(COMMANDS.ENABLE_GIL_RESOURCE_EXTRACTION, args => {
        configManager.toggleExtensionConfig(EXTENSION_CONFIG.EXTRACT_GIL_RESOURCES, true);
    });

    const toggleLuaWordCompletionCommand = vscode.commands.registerCommand(COMMANDS.TOGGLE_LUA_WORD_COMPLETION, args => {
        configManager.toggleLuaConfig(LUA_CONFIG.COMPLETION_SHOW_WORD, undefined, "Enable", "Disable");
    });

    const toggleLuaDiagnosticNeedCheckNilCommand = vscode.commands.registerCommand(COMMANDS.TOGGLE_LUA_DIAGNOSTIC_NIL_CHECK, args => {
        configManager.toggleLuaDiagnostic(LUA_DIAGNOSTIC.NEED_CHECK_NIL);
    });

    context.subscriptions.push(
        statusBarManager,
        configChangeListener,
        openMiliLuaSettingsCommand,
        enableDefinitionsCommand,
        enableGilResourceExtractionCommand,
        toggleLuaWordCompletionCommand,
        toggleLuaDiagnosticNeedCheckNilCommand,
    );

    isStatusBarRegistered = true;
}

class StatusBarManager implements vscode.Disposable {
    private readonly statusBarItem: vscode.StatusBarItem;

    constructor(
        private readonly workspaceFolder: vscode.WorkspaceFolder,
        private readonly configManager: ConfigManager,
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

        const isDefinitionsEnabled = this.configManager.getExtensionConfig(EXTENSION_CONFIG.ENABLE_DEFINITIONS);
        const extractGilResources = this.configManager.getExtensionConfig(EXTENSION_CONFIG.EXTRACT_GIL_RESOURCES);
        const tooltip = new vscode.MarkdownString();
        const tooltipNotes: string[] = [];
        let status = isDefinitionsEnabled && extractGilResources ? "✅" : isDefinitionsEnabled || extractGilResources ? "⚠️" : "❌";

        if (isDefinitionsEnabled) {
            if (extractGilResources) {
                tooltipNotes.push(
                    `#### 📄 Listening for changes to \`${this.gilManager.gilFileName}\``,
                    `- Resources extraction will be attempted when a change is detected to \`${this.gilManager.gilFileName}\``,
                    `- [Force Refresh Gil Resources](command:${COMMANDS.FORCE_UPDATE_GIL_RESOURCES})\n`
                );
            }
            else {
                tooltipNotes.push(
                    `#### ⚠️ Gil Resource Extraction is disabled`,
                    `- [Enable Gil Resource Extraction](command:${COMMANDS.ENABLE_GIL_RESOURCE_EXTRACTION})\n`
                );
            }
        }
        else {
            if (extractGilResources) {
                tooltipNotes.push(
                    `#### ⚠️ Gil Resource Extraction will only work if Miliastra Lua API Definitions are enabled`,
                    `- [Enable Miliastra Lua API Definitions](command:${COMMANDS.ENABLE_DEFINITIONS})\n`
                );
            }
            else {
                tooltipNotes.push(
                    `#### ❌ Miliastra Lua API Definitions are disabled`,
                    `- [Enable Miliastra Lua API Definitions](command:${COMMANDS.ENABLE_DEFINITIONS})\n`
                );
            }
        }

        tooltip.isTrusted = true;
        tooltip.appendMarkdown([
            `## MiliLua API Definitions Status`,
            `### Miliastra Lua API Definitions: ${isDefinitionsEnabled ? "✅" : "❌"}`,
            isDefinitionsEnabled ? `- Disable Word Completions: ${this.configManager.getLuaConfig<string>(LUA_CONFIG.COMPLETION_SHOW_WORD) === "Disable" ? "✅" : "❌"} [(Toggle)](command:${COMMANDS.TOGGLE_LUA_WORD_COMPLETION})` : ``,
            isDefinitionsEnabled ? `- Disable Nil Check Warning: ${this.configManager.isLuaDiagnosticEnabled(LUA_DIAGNOSTIC.NEED_CHECK_NIL) ? "✅" : "❌"} [(Toggle)](command:${COMMANDS.TOGGLE_LUA_DIAGNOSTIC_NIL_CHECK})` : ``,
            `### Gil Resource Extraction: ${extractGilResources ? (isDefinitionsEnabled ? "✅" : "⚠️") : "❌"}`,
            `---`,
            ...tooltipNotes,
            `[Open MiliLua Settings](command:${COMMANDS.OPEN_MILILUA_SETTINGS}) • [Restart Language Server](command:lua.startServer)`
        ].join("\n"));

        this.statusBarItem.text = `Miliastra ${status}`;
        this.statusBarItem.tooltip = tooltip;
        this.statusBarItem.show();
    }

    dispose() {
        this.statusBarItem.dispose();
    }
}