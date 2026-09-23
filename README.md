# MiliLua API Definitions for VS Code
MiliLua API Definitions is a VS Code extension that provides Lua definitions and documentation for the Miliastra Wonderland Lua API.

To make contributions to the defintions, or to download definitions separately, see [the MiliLua repo](https://github.com/haminpants/mililua).

## Installation
Get the extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=haminpants.mililua-api-definitions).

## Usage
The extension will activate the first time you open a Lua script in a workspace; a prompt to enable MiliLua for your current workspace will appear at the botom-left corner of VS Code. Accepting the prompt will configure the bundled definitions as part of your workspace library.

## Features
- Definitions for functions, types, and enums.
- Documentation for properties, functions, and enums.

## Commands
> Execute commands with `CTRL` + `SHIFT` + `P`

|Command|Description|
|-|-|
|`mililua.openDocs`|Opens the built-in documentation in your browser.|

## Extension Settings
|Setting|Type|Description|
|-|-|-|
|`mililua.enableDefinitions`|`boolean`|(Workspace only) Whether to enable Miliastra Wonderland Lua API definitions for the current workspace.|

## Known Issues
