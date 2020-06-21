declare function CommonIsNumeric(n: any): boolean;
declare function CommonGetFormatDate(): string;
declare function CommonDetectMobile(): boolean;
declare function CommonGetBrowser(): {
    Name: string;
    Version: string;
};
declare function CommonParseCSV(str: any): any[];
declare function CommonReadCSV(Array: any, Path: any, Screen: any, File: any): void;
declare function CommonGet(Path: any, Callback: any): void;
declare function CommonClick(): void;
declare function CommonIsClickAt(Left: any, Top: any, Width: any, Height: any): boolean;
declare function CommonKeyDown(): void;
declare function CommonDynamicFunction(FunctionName: any): void;
declare function CommonDynamicFunctionParams(FunctionName: any): boolean;
/**
 *  Calls a named global function with the passed in arguments, if the named function exists. Differs from
 *  CommonDynamicFunctionParams in that arguments are not parsed from the passed in FunctionName string, but
 *  passed directly into the function call, allowing for more complex JS objects to be passed in. This
 *  function will not log to console if the provided function name does not exist as a global function.
 *
 * @param {string} FunctionName - The name of the global function to call
 * @param {...*} [args] - zero or more arguments to be passed to the function (optional)
 */
declare function CommonCallFunctionByName(FunctionName: string, ...args: any[]): any;
declare function CommonSetScreen(NewModule: any, NewScreen: any): void;
declare function CommonTime(): number;
declare function CommonIsColor(Value: any): boolean;
declare function CommonRandomItemFromList(ItemPrevious: any, ItemList: any): any;
declare function CommonConvertStringToArray(s: any): any;
declare function CommonConvertArrayToString(Arr: any): string;
declare function CommonWait(MS: any): void;
declare var Player: any;
declare var MouseX: number;
declare var MouseY: number;
declare var KeyPress: string;
declare var CurrentModule: any;
declare var CurrentScreen: any;
declare var CurrentCharacter: any;
declare var CurrentOnlinePlayers: number;
declare var CommonIsMobile: boolean;
declare var CommonCSVCache: {};
declare var CutsceneStage: number;
declare var CommonBackgroundList: string[];
