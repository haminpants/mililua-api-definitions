# MiliLua API Definitions for VS Code
MiliLua API Definitions is a VS Code extension that provides IntelliSense and extended tooling for the Miliastra Wonderland Lua API based on definitions and documentation from the [miliastra-lua-api repo](https://github.com/haminpants/miliastra-lua-api).

See [Privacy and Additional Notes](#privacy-and-additional-notes) for info on how your data is handled by this extension.

## Features
- Complete definitions for all types, fields, functions, globals, and enums.
- Additional aliases and classes to provide additional typing and IntelliSense:
    - `TweenTarget`, containing all tweenable Client Control fields.
    - `Vector3`, to represent the 3D Vector data type.
    - `ApiType`, containing all known return values from the `typeof` function.
- Extended documentation verified through testing.
- [Miliastra Save Explorer](#save-explorer) for quickly opening workspaces for stage saves.
- [Resource Extraction](#resource-extraction) for enhanced autocomplete and typing.
- [Snippets](#snippets) for commonly used blocks of code.

## Installation
Get the extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=haminpants.mililua-api-definitions).

## Usage

### Save Explorer Instructions
1. Open the Miliastra Toolkit menu in the Activity Bar, then select the save that you want to open in the Save Explorer.

    ![A screenshot that highlights where the Miliastra Toolkit can be found in the Activity Bar.](/resources/readme/toolkit_save_explorer.png)
2. Select "Yes" when prompted to enable MiliLua for the current workspace.

    ![A screenshot of the popup asking to enable MiliLua API Definitions for the current workspace.](/resources/readme/enable_prompt.png)
3. Open the Miliastra editor for the corresponding project, then save the project in the Miliastra editor. A folder called `.gil_resources` should be generated.

### Manual Instructions
1. Open your project's save folder in VS Code.
    ```
    File > Open Folder > vvv Navigate to Save Path vvv
    C:\Users\YOUR_USER\AppData\LocalLow\miHoYo\Genshin Impact\BeyondLocal\YOUR_UID\Beyond_Local_Save_Level\YOUR_SAVE_ID
    ```
    **This folder should contain the `.gil` file and `external_lua_file` folder for your project.**
1. Select "Yes" when prompted whether to enable MiliLua for the current workspace.

    ![A screenshot of the popup asking to enable MiliLua API Definitions for the current workspace.](/resources/readme/enable_prompt.png)
3. Open the Miliastra editor for the corresponding project, then save the project in the Miliastra editor. A folder called `.gil_resources` should be generated.

## Troubleshooting

Hover over the "Miliastra" status bar entry to diagnose common issues. Click the suggested link to resolve issues.

![Example diagnostic provided by the status bar entry.](/resources/readme/example_troubleshooting.png)

## Settings
|Setting|Type|Description|
|-|-|-|
|`mililua.enableDefinitions`|`boolean`|(Workspace only) Whether to enable Miliastra Wonderland Lua API support for the current workspace.|
|`mililua.extractGilResources`|`boolean`|(Workspace only) Whether to attempt resource extraction from the `.gil` file matching the current workspace folder name.|

## Miliastra Toolkit
The Miliastra Toolkit is a view added to the activity, enabling quick access to saves on the local device.
### Save Explorer
The Save Explorer is the primary view displayed in the Miliastra Toolkit, allowing you to quickly open  saves on your device. Clicking a stage entry will automatically open that save in VS Code. Use the refresh button to update the listed stages.

![A screenshot showing an example of the Save Explorer.](/resources/readme/toolkit_save_explorer.png)

## Resource Extraction
When the "Extract Gil Resources" setting is enabled for your current workspace, the extension will automatically attempt to extract resources from the `.gil` file matching the workspace folder name whenever a save occurs in the Miliastra editor. Extracted resources are stored in the `.gil_resources` directory.

|Extracted Resource|Description|
|-|-|
|Client Controls|The index of all Client Control Templates will be extracted to provide autocomplete for the `game.InstantiateClientUIControl` function.<br><br>The name of all Client Controls in the hierarchy and saved Client Control Templates will be extracted to provide autocomplete for the `game.FindClientUIRoot` and `ClientUIBaseControl:GetChild` functions.|
|Script Text Variables|The Mapping ID of Script Text Variables will be extracted to provide autocomplete for the `game.GetText` function.|
|Script Variables|The name of Script Variables defined in your Script Mappings will be extracted to provide autocomplete for the `script:GetParam` function.|
|Signals|The name and typed parameters of all Signals will be extracted to provide Signal name autocomplete for all signal-related functions, as well as type-checking for Signal parameters.|

## Snippets
![GIF demonstrating the use of snippets to quickly generate code.](/resources/readme/example_snippets.gif)

|Prefix|Description|
|-|-|
|`mili-lifecycle`|Generates all lifecycle functions.|
|`function OnInit()`<br>`OnInit`|Generates the OnInit lifecycle function.|
|`function OnEnable()`<br>`OnEnable`|Generates the OnEnable lifecycle function.|
|`function OnStart()`<br>`OnStart`|Generates the OnStart lifecycle function.|
|`function OnUpdate()`<br>`OnUpdate`|Generates the OnUpdate lifecycle function.|
|`function OnLevelUpdate()`<br>`OnLevelUpdate`|Generates the OnLevelUpdate lifecycle function.|
|`function OnDisable()`<br>`OnDisable`|Generates the OnDisable lifecycle function.|
|`function OnDestroy()`<br>`OnDestroy`|Generates the OnDestroy lifecycle function.|
|`mili-tween`<br>`game.Tween`|Generates Tween starter code.|
|`mili-tween-one-shot`|Generates a Tween that calls Kill when completed.|
|`mili-tween-sequence-one-shot`|Generates a Tween Sequence that calls Kill when completed.|

## Lua API Limitations
- Functions that return `ClientUIBaseControl` do return the exact runtime type; however, LuaLS cannot infer the correct type, so an alias containing all Client Control types is returned instead.
- Functions that return data from the server, such as from signals or `game.GetGlobalCustomVariableValue`, will always return a type from the `ServerDataType` alias or `nil`; however, LuaLS cannot infer the correct type, so `any` is returned instead.
- `TweenTarget` exposes all tweenable fields from all Client Control types; however, attempting to tween fields for the wrong type may cause errors at runtime.

## Privacy and Additional Notes
- **Unless specified below, no data, files, or analytics are sent to any third-party service.**
- **This extension does not modify `.gil` files.**
- Genshin account names are fetched by querying the [Enka.Network](https://enka.network/) API using UIDs found in the `BeyondLocal` directory.
- Save names are fetched by only decoding the save name parameter in `.gil` files found in the `BeyondLocal` directory.
- Symlinks are ignored by the Save Explorer.
- Gil Resource Extraction can be disabled separately from Lua API support.
- Lua definition files in the `.gil_resources` folder **should not** be mapped in the Client Script Resource Explorer.
- The `.gil_resources` folder can be safely excluded from a Git repo through `.gitignore`.

## Planned Features
- Custom Variable name extraction.
- Compatibility with Shared Creation Mode saves.
- Built-in utility module management.
    - Community-driven utility function contributions.