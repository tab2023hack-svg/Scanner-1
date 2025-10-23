
export interface ExcelRow {
    [key: string]: string | number | undefined;
    F?: string; // لون الموديل
    G?: string; // المقاس
    H?: string; // اسم/كود الموديل
    I?: string; // الباركود
}

export interface ScannedItem {
    barcode: string;
    model: string;
    size: string;
    color: string;
    timestamp: Date;
}
