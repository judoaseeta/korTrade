export type TradeType = '수출액 (천달러)' | '수입액 (천달러)'
export type TradeTypeAlias = 'import' | 'export'
export const TradeTypeEnum: {
    [alias in TradeTypeAlias]: TradeType
} = {
    import: '수입액 (천달러)',
    export: '수출액 (천달러)',
} as const
export type CategoryDepth = 'categoryDepth1' | 'categoryDepth2' | 'categoryDepth3'
export interface RawTradeData {
    '품목별(1)': string
    '품목별(2)': string
    '품목별(3)': string
    항목: TradeType
    시점: string
    데이터: string
}

export interface TradeDataBase {
    categoryDepth1: string
    categoryDepth2: string
    categoryDepth3: string
    time: string
    data: number
}
export interface ExportData extends TradeDataBase {
    tradeType: '수출액 (천달러)'
}
export interface ImportData extends TradeDataBase {
    tradeType: '수입액 (천달러)'
}
export type TradeData = ExportData | ImportData
