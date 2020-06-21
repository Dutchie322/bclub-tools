declare function InventoryItemArmsWebLoad(): void;
declare function InventoryItemArmsWebDraw(): void;
declare function InventoryItemArmsWebClick(): void;
declare function InventoryItemArmsWebValidate(Option: any): boolean;
declare function InventoryItemArmsWebPublishAction(C: any, Option: any, PreviousOption: any): void;
declare function InventoryItemArmsWebNpcDialog(C: any, Option: any): void;
declare var InventoryItemArmsWebOptions: ({
    Name: string;
    Property: {
        Type: any;
        Difficulty: number;
        Prerequisite?: undefined;
        AllowPose?: undefined;
        SetPose?: undefined;
        Effect?: undefined;
        Block?: undefined;
        Hide?: undefined;
    };
    BondageLevel?: undefined;
    SelfBondageLevel?: undefined;
    Prerequisite?: undefined;
} | {
    Name: string;
    BondageLevel: number;
    SelfBondageLevel: number;
    Prerequisite: string[];
    Property: {
        Type: string;
        Difficulty: number;
        Prerequisite: string[];
        AllowPose: string[];
        SetPose: string[];
        Effect: string[];
        Block: string[];
        Hide?: undefined;
    };
} | {
    Name: string;
    BondageLevel: number;
    SelfBondageLevel: number;
    Prerequisite: string[];
    Property: {
        Type: string;
        Difficulty: number;
        SetPose: string[];
        Effect: string[];
        Hide: string[];
        Block: string[];
        Prerequisite?: undefined;
        AllowPose?: undefined;
    };
} | {
    Name: string;
    BondageLevel: number;
    SelfBondageLevel: number;
    Prerequisite: string[];
    Property: {
        Type: string;
        Difficulty: number;
        SetPose: string[];
        Effect: string[];
        Block: string[];
        Prerequisite?: undefined;
        AllowPose?: undefined;
        Hide?: undefined;
    };
})[];
