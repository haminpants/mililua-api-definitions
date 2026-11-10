import { GilFile } from "@/generated/protobufs/gil";
import { LuaApiSearch } from "@/services/api-search.service";

export type StructureConfigIdMap = Record<number, string>;

export interface GilResourceExtractFormat {
    readonly fileName: string;
    readonly format: (gilData: GilFile, luaApiSearch: LuaApiSearch) => Promise<string>;
}