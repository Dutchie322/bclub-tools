declare function InventoryItemHeadWebBlindfoldLoad(): void;
declare function InventoryItemHeadWebBlindfoldDraw(): void;
declare function InventoryItemHeadWebBlindfoldClick(): void;
declare function InventoryItemHeadWebBlindfoldPublishAction(Option: any): void;
declare function InventoryItemHeadWebBlindfoldNpcDialog(C: any, Option: any): void;
declare var InventoryItemHeadWebBlindfoldOptions: ({
    Name: string;
    Property: {
        Type: any;
        Difficulty: number;
        Hide?: undefined;
        Block?: undefined;
        Effect?: undefined;
    };
} | {
    Name: string;
    Property: {
        Type: string;
        Difficulty: number;
        Hide: string[];
        Block: string[];
        Effect: string[];
    };
})[];
