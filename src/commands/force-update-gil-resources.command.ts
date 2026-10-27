import * as vscode from "vscode";
import { COMMANDS } from "@/constants/commands";
import { stripGilHeader } from "@/utils/gil.utils";
import { GilManager } from "@/services/gil-manager.service";
import { BeyondStage } from "@/generated/protobufs/beyond_stage";

export function registerForceUpdateGilResourcesCommand(context: vscode.ExtensionContext, gilManager: GilManager) {
    const cmd = vscode.commands.registerCommand(COMMANDS.ForceUpdateGilResources, async args => {
        const gilData = BeyondStage.decode(await stripGilHeader(gilManager.getGilUri()));
        gilManager.resourceHandler.processAll(gilData);
    });
    context.subscriptions.push(cmd);
}