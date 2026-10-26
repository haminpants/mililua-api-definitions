import * as vscode from "vscode";
import { stripGilHeader } from "@/utils/gil.utils";
import { CONFIGS, getWorkspaceConfig } from "@/constants/config";
import { BeyondStage } from "@/generated/protobufs/beyond_stage";
import { GilResourceHandler } from "@/services/gil-resource.service";

export class GilManager {
    private readonly gilWatcher: vscode.FileSystemWatcher;

    public readonly gilFileName: string;
    public readonly resourceHandler: GilResourceHandler;

    constructor(
        context: vscode.ExtensionContext,
        private readonly targetWorkspace: vscode.WorkspaceFolder,
    ) {
        this.gilFileName = `${targetWorkspace.name}.gil`;
        this.resourceHandler = new GilResourceHandler(targetWorkspace.uri);

        this.gilWatcher = vscode.workspace.createFileSystemWatcher(`**/${this.gilFileName}`, false, false, true);
        this.gilWatcher.onDidCreate(this.onGilChanged);
        this.gilWatcher.onDidChange(this.onGilChanged);

        context.subscriptions.push(this.gilWatcher);
    }

    private onGilChanged = async () => {
        if (!getWorkspaceConfig(CONFIGS.EnableDefinitions) || !getWorkspaceConfig(CONFIGS.ExtractGilResources)) { return; }
        const gilData = BeyondStage.decode(await stripGilHeader(this.getGilUri()));
        await this.resourceHandler.processAll(gilData);
    }

    getGilUri() {
        return vscode.Uri.joinPath(this.targetWorkspace.uri, this.gilFileName);
    }
}