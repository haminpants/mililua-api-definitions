# MiliLua API Definitions for VS Code
MiliLua API Definitions is a VS Code extension that provides IntelliSense for the Miliastra Wonderland Lua API based on definitions and documentation from the [miliastra-lua-api repo](https://github.com/haminpants/miliastra-lua-api).

## Installation
Get the extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=haminpants.mililua-api-definitions).

## Usage
1. Open your project's `external_lua_file` folder in VS Code.
1. Open a file with the `.lua` extension.
1. Select "Yes" when prompted whether to enable MiliLua for the current workspace.

    ![Popup](https://wiki.miliastra.dev/guides/haminpants/lua-quickstart/setup_mililua_popup.png)

See the [IDE Setup](https://wiki.miliastra.dev/en/guides/haminpants/lua-quickstart#ide-setup) section of haminpants' Lua Quickstart Guide for more info.

## Features
- Complete definitions for all types, fields, functions, globals, and enums.
- Additional aliases and classes to provide additional typing and IntelliSense:
    - `TweenTarget`, containing all tweenable Client Control fields.
    - `Vector3`, to represent the 3D Vector data type.
    - `ApiType`, containing all known return values from the `typeof` function.
- Extended documentation verified through testing.
- [Snippets](#snippets) for commonly used blocks of code.

## Extension Settings
|Setting|Type|Description|
|-|-|-|
|`mililua.enableDefinitions`|`boolean`|(Workspace only) Whether to enable Miliastra Wonderland Lua API definitions for the current workspace.|

## Snippets
![GIF demonstrating the use of snippets to quickly generate code.](/images/readme/example_snippets.gif)
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

## Limitations
- Functions that return `ClientUIBaseControl` do return the exact runtime type; however, LuaLS cannot infer the correct type, so an alias containing all Client Control types is returned instead.
- Functions that return data from the server, such as from signals or `game.GetGlobalCustomVariableValue`, will always return a type from the `ServerDataType` alias or `nil`; however, LuaLS cannot infer the correct type, so `any` is returned instead.
- `TweenTarget` exposes all tweenable fields from all Client Control types; however, attempting to tween fields for the wrong type may cause errors at runtime.