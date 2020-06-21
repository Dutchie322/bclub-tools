declare function TitleSet(NewTitle: any): any;
declare function TitleGet(C: any): any;
declare function TitleIsForced(Title: any): boolean;
declare function TitleRun(): void;
declare function TitleClick(): void;
declare function TitleExit(): void;
declare var TitleBackground: string;
declare var TitleList: ({
    Name: string;
    Requirement: () => boolean;
    Force?: undefined;
} | {
    Name: string;
    Requirement: () => boolean;
    Force: boolean;
})[];
