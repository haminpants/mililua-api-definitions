const { execSync } = require("child_process");
const { mkdirSync, cpSync, rmSync } = require("fs");

const REPO_URL = "https://github.com/haminpants/mililua";

console.log('Fetching latest Lua definitions...');

execSync(`git clone --depth 1 ${REPO_URL} tmp_def_clone`, { stdio: 'inherit' });
mkdirSync('out', { recursive: true });
rmSync('out/library', { recursive: true, force: true });
cpSync('tmp_def_clone/library', 'out/library', { recursive: true });
rmSync('tmp_def_clone', { recursive: true, force: true });

console.log('Successfully copied library to out/library!');