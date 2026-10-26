import * as vscode from "vscode";
import { stripGilHeader } from "@/utils/gil.utils";
import { CONFIGS, getWorkspaceConfig } from "@/constants/config";
import { BeyondStage } from "@/generated/protobufs/beyond_stage";
import { GilResourceHandler } from "@/services/gil-resource.service";

class GilManager {
    private readonly watcher: vscode.FileSystemWatcher;

    public readonly gilFileName: string;
    public readonly resourceHandler: GilResourceHandler;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly targetWorkspace: vscode.WorkspaceFolder,
    ) {
        this.gilFileName = `${targetWorkspace.name}.gil`;
        this.resourceHandler = new GilResourceHandler(targetWorkspace.uri);

        this.watcher = vscode.workspace.createFileSystemWatcher(this.gilFileName, false, false, true);
        this.watcher.onDidCreate(this.onGilChanged);
        this.watcher.onDidChange(this.onGilChanged);

        this.context.subscriptions.push(this.watcher);
    }

    private async onGilChanged() {
        if (!getWorkspaceConfig(CONFIGS.EnableDefinitions) || !getWorkspaceConfig(CONFIGS.ExtractGilResources)) { return; }
        const gilData = BeyondStage.decode(await stripGilHeader(this.getGilUri()));
        await this.resourceHandler.processAll(gilData);
    }

    getGilUri() {
        return vscode.Uri.joinPath(this.targetWorkspace.uri, this.gilFileName);
    }
}