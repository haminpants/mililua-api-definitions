export type Region = "ASIA" | "EU" | "NA" | "TW";

export interface EnkaResponse {
    playerInfo: PlayerInfo,
    region: Region
}

export interface PlayerInfo {
    nickname: string
}