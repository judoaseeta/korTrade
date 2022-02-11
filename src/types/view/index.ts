// entity
import { HierarchyCircularNode, HierarchyRectangularNode } from 'd3-hierarchy'
import { ScaleOrdinal } from 'd3-scale'
import { TradeType, TradeData } from '../entity'
// usecase
import { HierarchialTradeData, InteractingData, TimeRange, Vector } from '../usecase'
export interface FooterProps {
    timelines?: string[]
    data?: TradeData[]
    timeRange: TimeRange
    tradeType: TradeType
    onUpdateTimeRange: (newTimeRange: TimeRange) => void
}
export interface ChartProps {
    chartWidth: number
    chartHeight: number
    data?: TradeData[]
    loading: boolean
    tradeType: TradeType
    timeRange: TimeRange
}
export interface NavProps {
    tradeType: TradeType
    timeRange: TimeRange
    onChangeTradeType: React.ChangeEventHandler<HTMLSelectElement>
}
export interface FooterInteractChartProps extends InteractingData {
    interactTimeRange?: TimeRange
    currentTimeRange: TimeRange
}

export interface ChildPackChartProps {
    currentTree: HierarchyRectangularNode<HierarchialTradeData>
    vector: Vector
    nodes: HierarchyCircularNode<HierarchialTradeData>
    colorScale: ScaleOrdinal<string, string, never>
}
