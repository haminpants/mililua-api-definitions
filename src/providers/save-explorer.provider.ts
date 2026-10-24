import * as vscode from "vscode";
import * as fs from "fs/promises";
import { isUid } from "@/utils/string.utils";
import { stripGilHeader } from "@/utils/gil.utils";
import { GilNamePeek } from "@Root/protobufs/beyond_stage";
import { COMMANDS } from "@/constants/commands";
import { EXTENSION_ID } from "@/constants/extension";
import { GLOBAL_STATE_KEYS } from "@/constants/global-state-keys";
import { getBeyondLocalSaveUri, getBeyondLocalUri } from "@/utils/uri.utils";
import { EnkaResponse, UidInfo, UidSaveData } from "@/types";

export const LEVEL_SAVE_DIR = "Beyond_Local_Save_Level"

const uidInfoCacheLifetime = 60 * 60 * 1000;

export function registerSaveExplorerTreeView(context: vscode.ExtensionContext) {
    const saveExplorer = new SaveExplorerDataProvider(context);
    const saveExplorerTreeView = vscode.window.createTreeView(`${EXTENSION_ID}.save-explorer`, {
        treeDataProvider: saveExplorer,
        showCollapseAll: true,
        canSelectMany: false
    });

    const onSelectListener = saveExplorerTreeView.onDidChangeSelection(e => {
        const selection = e.selection[0];
        if (!selection || !selection.isSave) { return; }
        console.log(`${e.selection[0].label} was selected.`);
    });

    const refreshCommand = vscode.commands.registerCommand(COMMANDS.REFRESH_SAVE_EXPLORER, () => {
        saveExplorer.update();
    });

    context.subscriptions.push(
        saveExplorerTreeView,
        onSelectListener,
        refreshCommand
    );
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
        private readonly context: vscode.ExtensionContext
    ) {
        this.icon_save = vscode.Uri.joinPath(context.extensionUri, "assets", "miliastra_save_icon.svg");
        this.icon_uid = new vscode.ThemeIcon(`accounts-view-bar-icon`);
        this.update();
    }

    async update() {
        this.data = (await this.getUidSaves()).map(uidSaves => {
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
                    arguments: [this],
                }

                return saveEntry;
            });

            const uidEntry = new SaveExplorerItem(
                `${uidSaves.nickname} (${uidSaves.uid})`,
                uidSaves.uri,
                false,
                vscode.TreeItemCollapsibleState.Expanded,
                saveEntries
            );

            uidEntry.iconPath = this.icon_uid;

            return uidEntry;
        });
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

    private async getUidInfo(uids: string[]): Promise<Record<string, UidInfo>> {
        const uidInfoCache = this.context.globalState.get<Record<string, UidInfo>>(GLOBAL_STATE_KEYS.UidInfoCache, {});
        const results: Record<string, UidInfo> = {};
        const now = Date.now();
        let updateGlobalState = false;

        const validUids = uids.filter(uid => {
            if (!isUid(uid)) {
                results[uid] = { name: "Invalid UID", lastUpdate: now };
                return false;
            }
            return true;
        });

        const staleUids = validUids.filter(uid => {
            const cachedUid = uidInfoCache[uid];
            if (cachedUid && cachedUid.lastUpdate >= now - uidInfoCacheLifetime) {
                results[uid] = cachedUid;
                return false;
            }
            return true;
        });

        if (staleUids.length > 0) {
            console.log(`Querying enka.network for UIDs: ${staleUids.join(", ")}`);

            const enkaUidInfoPromises = staleUids.map(async uid => {
                const apiUrl = `https://enka.network/api/uid/${uid}/?info`;

                try {
                    const response = await fetch(apiUrl, {
                        headers: {
                            "User-Agent": "MiliLua-VSCode-Extension (Discord @haminpants)"
                        },
                        signal: AbortSignal.timeout(5000)
                    });

                    if (!response.ok) { throw new Error(`HTTP Error - Status: ${response.status} ${response.statusText}`) }
                    const data = await response.json() as EnkaResponse;
                    const nickname = data?.playerInfo?.nickname;

                    if (nickname) { return { uid, uidInfo: { name: data.playerInfo.nickname, lastUpdate: now }, success: true } }
                    throw new Error(`Response body missing playerInfo.nickname for UID ${uid}`);
                }
                catch (err) {
                    console.error(`Failed to fetch UID ${uid}`, err);
                    return { uid, uidInfo: uidInfoCache[uid] ?? { name: "Unknown", lastUpdate: now }, success: false }
                }
            });

            for (const { uid, uidInfo, success } of await Promise.all(enkaUidInfoPromises)) {
                results[uid] = uidInfo;
                if (success) {
                    uidInfoCache[uid] = uidInfo;
                    updateGlobalState = true;
                }
            }

            if (updateGlobalState) { await this.context.globalState.update(GLOBAL_STATE_KEYS.UidInfoCache, uidInfoCache); }
        }

        return results;
    }

    private async getUidSaves(): Promise<UidSaveData[]> {
        const beyondLocalUri = getBeyondLocalUri();
        const beyondLocalContents = await fs.readdir(beyondLocalUri.fsPath);

        const uidDirectoryPromises = beyondLocalContents.map(async uidDirectory => {
            const stats = await fs.lstat(vscode.Uri.joinPath(beyondLocalUri, uidDirectory).fsPath);
            return { uidDirectory, stats };
        });

        const uidDirectories = (await Promise.allSettled(uidDirectoryPromises))
            .filter((r): r is PromiseFulfilledResult<{ uidDirectory: string, stats: any }> => {
                return r.status === "fulfilled" && r.value.stats.isDirectory() && !r.value.stats.isSymbolicLink() && isUid(r.value.uidDirectory);
            }).map(r => { return { uid: r.value.uidDirectory, uri: vscode.Uri.joinPath(beyondLocalUri, r.value.uidDirectory) } });

        const uidInfoPromise = this.getUidInfo(uidDirectories.map(uidDir => uidDir.uid));

        const uidSaveDataPromises = uidDirectories.map(async uidDirectory => {
            const uidDirSavesUri = getBeyondLocalSaveUri(uidDirectory.uid);
            const saveDirectories = await fs.readdir(uidDirSavesUri.fsPath);

            const saveContentsPromises = saveDirectories.map(async saveDirectory => {
                const saveContents = await fs.readdir(vscode.Uri.joinPath(uidDirSavesUri, saveDirectory).fsPath);
                const isValidSave = saveContents.includes(`external_lua_file`) && saveContents.includes(`${saveDirectory}.gil`);
                return { saveId: saveDirectory, saveUri: vscode.Uri.joinPath(uidDirSavesUri, saveDirectory, `${saveDirectory}.gil`), isValidSave };
            });

            const validSaveNamesPromises = (await Promise.allSettled(saveContentsPromises))
                .filter((r): r is PromiseFulfilledResult<{ saveId: string, saveUri: vscode.Uri, isValidSave: boolean }> => {
                    return r.status === "fulfilled" && r.value.isValidSave;
                }).map(async r => {
                    const saveData = GilNamePeek.decode(await stripGilHeader(r.value.saveUri));
                    return { saveId: r.value.saveId, saveName: saveData.name }
                });

            const validSaves = (await Promise.allSettled(validSaveNamesPromises))
                .filter((r): r is PromiseFulfilledResult<{ saveId: string, saveName: string }> => {
                    return r.status === "fulfilled";
                }).map(r => { return { id: r.value.saveId, uri: vscode.Uri.joinPath(uidDirSavesUri, r.value.saveId), name: r.value.saveName } });

            return {
                uid: uidDirectory.uid,
                uri: uidDirectory.uri,
                nickname: (await uidInfoPromise)[uidDirectory.uid]?.name ?? "Unknown",
                saves: validSaves
            }
        });

        return Promise.all(uidSaveDataPromises);
    }
}