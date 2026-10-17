import { compilerOptions as tsconfig } from "@Root/tsconfig.json";
import { execSync } from "child_process";
import { mkdirSync, cpSync, rmSync } from "fs";

const REPO_URL = "https://github.com/haminpants/miliastra-lua-api";
const LIB_DIR = "library";
const TMP_DIR = "tmp_lua_api";

console.log('Fetching latest Lua definitions...');

execSync(`git clone --depth 1 ${REPO_URL} ${tsconfig.outDir}/${TMP_DIR}`, { stdio: 'inherit' });
mkdirSync(`${tsconfig.outDir}`, { recursive: true });
rmSync(`${tsconfig.outDir}/${LIB_DIR}`, { recursive: true, force: true });
cpSync(`${tsconfig.outDir}/${TMP_DIR}/${LIB_DIR}`, `${tsconfig.outDir}/${LIB_DIR}`, { recursive: true });
rmSync(`${tsconfig.outDir}/${LIB_DIR}/addons/VSCodeAddons.d.lua`, { force: true });
rmSync(`${tsconfig.outDir}/${TMP_DIR}`, { recursive: true, force: true });

console.log(`Successfully retrieved latest API definitions.\nSaved to ${tsconfig.outDir}/${LIB_DIR}`);