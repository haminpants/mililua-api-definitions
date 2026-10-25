import * as path from "path";
import { compilerOptions as tsconfig } from "@Root/tsconfig.json";
import { execSync } from "child_process";
import { cpSync, rmSync } from "fs";

const REPO_URL = "https://github.com/haminpants/miliastra-lua-api";

const resourcesPath = path.join(tsconfig.rootDir, "resources");
const tmpDir = path.join(resourcesPath, "tmp-lib");
const libDir = path.join(resourcesPath, "library");

console.log('Fetching latest Lua definitions...');

execSync(`git clone --depth 1 ${REPO_URL} ${tmpDir}`, { stdio: 'inherit' });
rmSync(`${libDir}`, { recursive: true, force: true });
cpSync(`${path.join(tmpDir, "library")}`, `${libDir}`, { recursive: true });
rmSync(`${path.join(libDir, "addons", "VSCodeAddons.d.lua")}`, { force: true });
rmSync(`${tmpDir}`, { recursive: true, force: true });

console.log(`Successfully retrieved latest API definitions.\nSaved to ${libDir}`);