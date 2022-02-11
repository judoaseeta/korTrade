// d3 quadtree
import { rollup } from 'd3-array'
import { HierarchyRectangularNode, treemap, treemapSquarify, hierarchy, HierarchyNode } from 'd3-hierarchy'
import { quadtree } from 'd3-quadtree'

// entity
import { TradeData, TradeType } from '../types/entity'
// usecase
import { TimeRange, HierarchialTradeData, Vector } from '../types/usecase'
import { getNameFromInternMap } from '../utils'

// 총액 소계만  필터링
export const filterSumOnly = (data: TradeData[]) =>
    data.filter((d) => d.categoryDepth1 === '총액' || d.categoryDepth2 === '소계' || d.categoryDepth3 === '소계')
// 총액 소계등 불필요한 정보 필터링
export const filterUnnecessary = (data: TradeData[]) =>
    data.filter((d) => !(d.categoryDepth1 === '총액' || d.categoryDepth2 === '소계' || d.categoryDepth3 === '소계'))
export const filterByCategory = (category: string, data: TradeData[]) =>
    data.filter((d) => {
        if (!category) {
            return true
        } else {
            return d.categoryDepth1 === category || d.categoryDepth2 === category || d.categoryDepth3 === category
        }
    })
// 수입 혹은 수출 인지에 따라 필터링
export const filterByType = (type: TradeType, data: TradeData[]) => data.filter((d) => d.tradeType === type)
// 시간 영역에 따라 필터링
export const filterByDateRange = (range: TimeRange, data: TradeData[]) =>
    data.filter((d) => {
        const startRange = range[0]
        const endRange = range[1]
        if (endRange) {
            const startRangeTimevalue = new Date(startRange).getTime()
            const endRangeTimeValue = new Date(endRange).getTime()
            const currentTime = new Date(d.time).getTime()
            return currentTime >= startRangeTimevalue && currentTime <= endRangeTimeValue
        }
        return d.time === startRange
    })

// quadtree logics
export const isVectorIntersectWithNode = (
    x: number,
    y: number,
    node: HierarchyRectangularNode<HierarchialTradeData>,
) => {
    const { x0, x1, y0, y1 } = node
    return y0 <= y && y <= y1 && x0 <= x && x <= x1
}
export const searchInQuadTree = ({
    nodes,
    x,
    y,
}: {
    nodes: HierarchyRectangularNode<HierarchialTradeData>[]
    x: number
    y: number
}): HierarchyRectangularNode<HierarchialTradeData> | null => {
    const tree = quadtree<HierarchyRectangularNode<HierarchialTradeData>>()
        .extent([
            [-1, -1],
            [0, 0],
        ])
        .x((d) => d.x0)
        .y((d) => d.y0)
        .addAll(nodes)
    let result: HierarchyRectangularNode<HierarchialTradeData> | null = null
    tree.visit((node, x0, y0, x1, y1) => {
        // on leaf node
        if (!node.length) {
            if (isVectorIntersectWithNode(x, y, node.data)) {
                result = node.data
            }
        }
        return result !== null
    })

    return result
}

interface CreateTreeLayOutProps {
    chartWidth: number
    chartHeight: number
    paddingOuter?: number
    paddingInner?: number
}
export const createTreeLayout = ({ chartHeight, chartWidth, paddingInner, paddingOuter }: CreateTreeLayOutProps) => {
    return treemap<HierarchialTradeData>()
        .size([chartWidth, chartHeight])
        .paddingOuter(paddingOuter || 5)
        .paddingInner(paddingInner || 2)
        .round(true)
        .tile(treemapSquarify.ratio(chartWidth / chartHeight))
}
export const createHierarchialData = (data: HierarchialTradeData) => {
    return hierarchy(data, (d) => (Array.isArray(d) ? d[1] : null))
        .sum((d) => (Array.isArray(d) ? d[1] : null))
        .sort((a, b) => {
            const aValue = a.value || 0
            const bValue = b.value || 0
            return bValue - aValue
        })
}

export const findNodeByCategory = (
    targetNode: HierarchyNode<HierarchialTradeData>,
    category: string,
): HierarchyNode<HierarchialTradeData> | undefined => {
    const result = targetNode.find((node) => {
        const parsedName = getNameFromInternMap(node.data)
        return parsedName === category
    })
    // copy: to change child node as root
    if (result) {
        return result.copy()
    }
}

interface GetToolTipPosAndSizeProps {
    node: HierarchyRectangularNode<HierarchialTradeData>
    contextWidth: number
    contextHeight: number
    maxToolTipWidth: number
    maxToolTipHeight: number
}
export const getToolTipPosAndSize = ({
    node,
    contextHeight,
    contextWidth,
    maxToolTipWidth,
    maxToolTipHeight,
}: GetToolTipPosAndSizeProps): Vector => {
    const halfWidth = contextWidth / 2
    const halfHeight = contextHeight / 2
    const { x0, x1, y0, y1 } = node
    let startX = 0
    let startY = 0
    if (contextWidth - maxToolTipWidth > x0) {
        startX = Math.min(x1, contextWidth - maxToolTipWidth)
    } else {
        startX = Math.max(x0 - maxToolTipWidth - 3, 0)
    }

    if (contextHeight - maxToolTipHeight > y0) {
        startY = Math.min(y1, contextHeight - maxToolTipHeight)
    } else {
        startY = Math.max(y0 - maxToolTipHeight - 3, 0)
    }
    return {
        x: startX,
        y: startY,
        width: maxToolTipWidth,
        height: maxToolTipHeight,
    }
}

export const createReducedData = (tradeType: TradeType, timeRange: TimeRange, data: TradeData[]) => {
    const filteredByType = filterByType(tradeType, data)
    const filteredByTimeRange = filterByDateRange(timeRange, filteredByType)

    return rollup(
        filteredByTimeRange,
        (d) => d.reduce((acc, curr) => (acc += curr.data), 0),
        (d) => d.categoryDepth1,
        (d) => d.categoryDepth2,
        (d) => d.categoryDepth3,
    )
}
