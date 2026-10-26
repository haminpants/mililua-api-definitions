import * as vscode from "vscode";
import { CONFIGS, getWorkspaceConfig } from "@/constants/config";
import { GilResourceHandler } from "@/services/gil-resource.service";
import { GIL_RESOURCES, GilResource } from "../constants/gil-resources";
import { BeyondStage } from "../generated/protobufs/beyond_stage";
import { stripGilHeader } from "../utils/gil.utils";

class GilManager {
    private readonly watcher: vscode.FileSystemWatcher;

    public readonly gilFileName: string;
    public readonly gilUri: vscode.Uri;
    public readonly resourceHandler: GilResourceHandler;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly targetWorkspace: vscode.WorkspaceFolder,
    ) {
        this.gilFileName = `${targetWorkspace.name}.gil`;
        this.gilUri = vscode.Uri.joinPath(targetWorkspace.uri, this.gilFileName);

        this.watcher = vscode.workspace.createFileSystemWatcher(this.gilFileName, false, false, true);
        this.watcher.onDidCreate(this.onGilChanged);
        this.watcher.onDidChange(this.onGilChanged);

        this.resourceHandler = new GilResourceHandler(this.gilUri);

        context.subscriptions.push(this.watcher);
    }

    private async onGilChanged() {
        if (!getWorkspaceConfig(CONFIGS.EnableDefinitions) || !getWorkspaceConfig(CONFIGS.ExtractGilResources)) { return; }
        const gilData = BeyondStage.decode(await stripGilHeader(this.gilUri));
        (Object.keys(GIL_RESOURCES) as GilResource[]).map(async resource => this.resourceHandler.processResource(resource, gilData));
    }
}