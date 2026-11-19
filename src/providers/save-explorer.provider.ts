import * as vscode from "vscode";
import * as fs from "fs/promises";
import { SERVER } from "@/constants/servers";
import { COMMANDS } from "@/constants/commands";
import { stripGilHeader } from "@/utils/gil.utils";
import { GilFileHeader } from "@/generated/protobufs/gil";
import { getBeyondLocalSaveUri } from "@/utils/uri.utils";
import { getServerTypeFromUid } from "@/utils/string.utils";
import { ServerType, StageSaveData, UidSaveData } from "@/types";

const serverSaveExplorers: Record<ServerType, SaveExplorerDataProvider | undefined> = {
    GLOBAL: undefined,
    CN: undefined
}

export function getSaveExplorer(serverType: ServerType) {
    return serverSaveExplorers[serverType];
}

export function getAllSaveExplorers() {
    return Object.values(serverSaveExplorers).filter(e => e !== undefined);
}

export function registerSaveExplorerTreeView(context: vscode.ExtensionContext, serverType: ServerType) {
    if (serverSaveExplorers[serverType]) { throw new Error(`A save explorer view has already been registered for server type: ${serverType}`); }

    const saveExplorer = new SaveExplorerDataProvider(context, serverType);
    const saveExplorerTreeView = vscode.window.createTreeView(SERVER[serverType].treeViewId, {
        treeDataProvider: saveExplorer,
        showCollapseAll: true,
        canSelectMany: false
    });

    context.subscriptions.push(saveExplorerTreeView);
    serverSaveExplorers[serverType] = saveExplorer;
}

export class SaveExplorerItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly uri: vscode.Uri,
        public readonly isSave: boolean,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly children?: SaveExplorerItem[],
    ) {
        super(label, collapsibleState);
    }
}

export class SaveExplorerDataProvider implements vscode.TreeDataProvider<SaveExplorerItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SaveExplorerItem | undefined | null | void> = new vscode.EventEmitter<SaveExplorerItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SaveExplorerItem[] | SaveExplorerItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private readonly icon_save: vscode.Uri;
    private readonly icon_uid: vscode.ThemeIcon;

    private data: SaveExplorerItem[] = [];

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly serverType: ServerType
    ) {
        this.icon_save = vscode.Uri.joinPath(context.extensionUri, "resources", "miliastra_save_icon.svg");
        this.icon_uid = new vscode.ThemeIcon(`accounts-view-bar-icon`);
        this.update();
    }

    async update() {
        this.data = (await this.getUidSaves(this.serverType)).map(uidSaves => {
            const saveEntries = uidSaves.saves.map(save => {
                const saveEntry = new SaveExplorerItem(
                    `${save.name} (${save.id})`,
                    save.uri,
                    true,
                    vscode.TreeItemCollapsibleState.None
                );

                saveEntry.iconPath = this.icon_save;
                saveEntry.command = {
                    command: COMMANDS.SELECT_SAVE_EXPLORER_ITEM,
                    title: "Open Save",
                    arguments: [saveEntry],
                }

                return saveEntry;
            });

            const uidEntry = new SaveExplorerItem(
                uidSaves.nickname ? `${uidSaves.nickname} (${uidSaves.uid})` : uidSaves.uid,
                uidSaves.uri,
                false,
                vscode.TreeItemCollapsibleState.Expanded,
                saveEntries
            );

            uidEntry.iconPath = this.icon_uid;

            return uidEntry;
        });
        if (this.data.length === 0) {
            this.data.push(new SaveExplorerItem(
                "No saves found.",
                this.context.extensionUri,
                false,
                vscode.TreeItemCollapsibleState.None,
            ))
        }
        this.updateView();
    }

    getTreeItem(element: SaveExplorerItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: SaveExplorerItem | undefined): vscode.ProviderResult<SaveExplorerItem[]> {
        if (!element) { return this.data; }
        return element.children;
    }

    updateView() {
        this._onDidChangeTreeData.fire();
    }

    private async getUidSaves(serverType: ServerType): Promise<UidSaveData[]> {
        const server = SERVER[serverType];
        const beyondLocalUri = server.getBeyondLocalUri();
        try {
            const dirents = await fs.readdir(beyondLocalUri.fsPath, { withFileTypes: true });
            const validUids = dirents
                .filter(d => d.isDirectory() && !d.isSymbolicLink() && getServerTypeFromUid(d.name) === serverType)
                .map(d => ({ uid: d.name, uri: vscode.Uri.joinPath(beyondLocalUri, d.name) }))
            if (validUids.length === 0) { return []; }

            return await Promise.all(validUids.map<Promise<UidSaveData>>(async entry => {
                const saves = await this.getSavesForUid(serverType, entry.uid);
                return {
                    uid: entry.uid,
                    uri: entry.uri,
                    saves,
                    nickname: (await server.getUidInfo(this.context, entry.uid)).name
                }
            }));

        }
        catch (error: any) {
            if (error?.code !== `ENOENT`) {
                console.error(`Could not load saves for server: ${serverType}`, error);
            }
            return [];
        }
    }

    private async getSavesForUid(serverType: ServerType, uid: string): Promise<StageSaveData[]> {
        if (getServerTypeFromUid(uid) !== serverType) {
            console.error(`Server type mismatch for UID: ${uid} given server type: ${serverType}`);
            return [];
        }

        const uidSaveDirUri = getBeyondLocalSaveUri(serverType, uid);
        try {
            const saveDirents = await fs.readdir(uidSaveDirUri.fsPath, { withFileTypes: true });
            const savePromise = saveDirents.filter(d => d.isDirectory()).map(async dirent => {
                const saveId = dirent.name;
                const saveDirUri = vscode.Uri.joinPath(uidSaveDirUri, saveId);

                const saveFiles = await fs.readdir(saveDirUri.fsPath);
                const isValid = saveFiles.includes("external_lua_file") && saveFiles.includes(`${saveId}.gil`);
                if (!isValid) { return null; }

                const saveUri = vscode.Uri.joinPath(saveDirUri, `${saveId}.gil`);
                const saveData = GilFileHeader.decode(await stripGilHeader(saveUri));

                return {
                    id: saveId,
                    uri: saveUri,
                    name: saveData.name
                }
            });

            const results = await Promise.all(savePromise);
            return results.filter(save => save !== null);
        }
        catch {
            return [];
        }
    }
}