import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";
import { TreeItemCollapsibleState } from "vscode";
import { homedir } from "os";
import { GlobalStateEntry } from "@/extension";
import { EnkaResponse, UidInfo } from "@/types";
import { isUid } from "@/utils/string.utils";

export const LEVEL_SAVE_DIR = "Beyond_Local_Save_Level"

const isUid = new RegExp(`^1?[1,2,3,5,6,7,8,9][0-9]{8}$`);
const isStage = new RegExp(`^[0-9]{10}$`);

class PlayerDirectory {
    constructor(
        public readonly uid: string,
    ) { }
}

export class SaveExplorerItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly children?: SaveExplorerItem[],
    ) {
        super(label, collapsibleState);
    }
}

export class SaveExplorerTreeDataProvider implements vscode.TreeDataProvider<SaveExplorerItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SaveExplorerItem | undefined | null | void> = new vscode.EventEmitter<SaveExplorerItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SaveExplorerItem[] | SaveExplorerItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private readonly beyondLocalPath = path.join(homedir(), "AppData", "LocalLow", "miHoYo", "Genshin Impact", "BeyondLocal");
    private data: SaveExplorerItem[] = [];

    constructor() {
        this.update();
    }

    async update() {
        const playerDirectories = await this.getPlayerDirectories();

        const results = await Promise.allSettled(playerDirectories.map(async p => {
            const stageDirs = await fs.readdir(path.join(this.beyondLocalPath, p.uid, LEVEL_SAVE_DIR));

            const stageCheckResults = await Promise.allSettled(
                stageDirs.map(async stageDir => {
                    const stageFiles = await fs.readdir(path.join(this.beyondLocalPath, p.uid, LEVEL_SAVE_DIR, stageDir));

                    const isValid = stageFiles.includes(`${stageDir}.gil`) && stageFiles.includes("external_lua_file");

                    return { stageDir, isValid };
                })
            );

            const validStages = stageCheckResults
                .filter((s): s is PromiseFulfilledResult<{ stageDir: string; isValid: boolean }> => {
                    return s.status === "fulfilled" && s.value.isValid === true;
                })
                .map(s => {
                    return new SaveExplorerItem(s.value.stageDir, TreeItemCollapsibleState.None);
                });

            return new SaveExplorerItem(p.uid, TreeItemCollapsibleState.Expanded, validStages);
        }))

        this.data = results.filter(r => { return r.status === "fulfilled" }).map(r => r.value);

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
        console.log("Updating view...")
        this._onDidChangeTreeData.fire();
    }

    private async getPlayerDirectories(): Promise<PlayerDirectory[]> {
        const files = await fs.readdir(this.beyondLocalPath);

        const results = await Promise.allSettled(files.map(async file => {
            const filePath = path.join(this.beyondLocalPath, file);
            const stats = await fs.lstat(filePath);
            return { file, stats }
        }));

        return results.filter((r): r is PromiseFulfilledResult<{ file: string, stats: any }> => {
            return r.status === "fulfilled"
                && r.value.stats.isDirectory()
                && !r.value.stats.isSymbolicLink()
                && isUid.test(r.value.file);
        }).map(r => { return new PlayerDirectory(r.value.file) })
    private async getUidInfo(uids: string[]): Promise<Record<string, UidInfo>> {
        const uidInfoCache = this.context.globalState.get<Record<string, UidInfo>>(GlobalStateEntry.UidInfo, {});
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

            if (updateGlobalState) { await this.context.globalState.update(GlobalStateEntry.UidInfo, uidInfoCache); }
        }

        return results;
    }

    private async getUidSaves(): Promise<any> {
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
                return { saveId: saveDirectory, saveUri: vscode.Uri.joinPath(uidDirSavesUri, saveDirectory), isValidSave };
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
                    return r.status === "fulfilled"
                }).map(r => { return { id: r.value.saveId, name: r.value.saveName } })

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