import * as vscode from "vscode";
import * as extensionCommand from "@/commands/index";
import { GilManager } from "@/services/gil-manager.service";
import { registerStatusBar } from "./providers/status-bar.provider";
import { ConfigManager } from "@Root/src/services/config-manager.service";
import { registerSaveExplorerTreeView } from "@/providers/save-explorer.provider";

export async function activate(context: vscode.ExtensionContext) {
    console.log("Activating MiliLua API Definitions...");
    registerSaveExplorerTreeView(context);

    if (!vscode.workspace.workspaceFolders) { return; }
    const rootWorkspace = vscode.workspace.workspaceFolders[0];
    const configManager = new ConfigManager(context, rootWorkspace);
    const gilManager = new GilManager(context, rootWorkspace, configManager);
    registerStatusBar(context, rootWorkspace, configManager, gilManager);

    extensionCommand.registerForceUpdateGilResourcesCommand(context, gilManager);
}