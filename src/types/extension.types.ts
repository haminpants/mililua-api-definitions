import { Uri } from "vscode"

export interface UidInfo {
    readonly name: string,
    readonly lastUpdate: number
}

export interface StageSaveData {
    id: string,
    uri: Uri,
    name: string
}

export interface UidSaveData {
    uid: string,
    uri: Uri,
    nickname: string,
    saves: StageSaveData[]
}