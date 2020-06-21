declare function LogAdd(NewLogName: any, NewLogGroup: any, NewLogValue: any, Push: any): void;
declare function LogDelete(DelLogName: any, DelLogGroup: any, Push: any): void;
declare function LogQuery(QueryLogName: any, QueryLogGroup: any): boolean;
declare function LogValue(QueryLogName: any, QueryLogGroup: any): any;
declare function LogLoad(NewLog: any): void;
declare var Log: any[];
