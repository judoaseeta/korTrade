//d3
import { InternMap } from 'd3-array'
import { HierarchyRectangularNode } from 'd3-hierarchy'
export type TimeRange = [string, string | null]

export interface AggregatedTradeData {
    name: string
    value: number
    parent: string
}
export type HierarchialTradeData = InternMap
export type SumTradeData = InternMap<'수출액 (천달러)' | '수입액 (천달러)', InternMap<string, number>>
export interface Size {
    width: number
    height: number
}

export interface ParsedCategoryQueryString {
    category1: string
    category2: string
    category3: string
}

export interface InteractingData {
    currentTree: HierarchyRectangularNode<HierarchialTradeData>
    interactTree: HierarchyRectangularNode<HierarchialTradeData>
}

export interface Vector {
    x: number
    y: number
    width: number
    height: number
}
