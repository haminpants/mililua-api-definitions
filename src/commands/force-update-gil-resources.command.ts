import * as vscode from "vscode";
import { COMMANDS } from "@/constants/commands";
import { GilManager } from "@/services/gil-manager.service";

export function registerForceUpdateGilResourcesCommand(context: vscode.ExtensionContext, gilManager: GilManager) {
    const cmd = vscode.commands.registerCommand(COMMANDS.ForceUpdateGilResources, async args => {
        gilManager.extractAllResources();
    });
    context.subscriptions.push(cmd);
}