import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react'
// d3
import { HierarchyRectangularNode, HierarchyCircularNode, HierarchyNode, pack } from 'd3-hierarchy'
// hooks
import { useCategories } from './hooks'
// utils
import {
    numberWithCommas,
    getHierarchyHeight,
    getHierarchyWidth,
    getTextSize,
    isTextFit,
    createColorScaleByNodeName,
    getInvertedColor,
    getNameFromInternMap,
} from './utils'
// logics
import {
    searchInQuadTree,
    isVectorIntersectWithNode,
    createReducedData,
    createHierarchialData,
    createTreeLayout,
    findNodeByCategory,
    getToolTipPosAndSize,
} from './logics'
// canvas
import { clearCanvas } from './canvas'
// types
import { ChartProps, ChildPackChartProps } from './types/view'
// entity
import { HierarchialTradeData, Vector } from './types/usecase'
// component
import ChildPackChart from './ChildPackChart'
import Loading from './Loading'
// styles
import './chart.css'

export default function Chart({
    chartWidth,
    chartHeight,
    data,
    loading,
    tradeType,
    timeRange,
}: ChartProps): JSX.Element {
    const { currentCategory: category, navigateCategory } = useCategories()
    const reducedData = useMemo(() => {
        if (data) {
            return createReducedData(tradeType, timeRange, data)
        }
    }, [data, tradeType, timeRange])
    const hierarchialData = useMemo(() => {
        if (reducedData) {
            return createHierarchialData(reducedData)
        }
    }, [reducedData])
    const treeLayout = useMemo(() => {
        return createTreeLayout({
            chartHeight,
            chartWidth,
        })
    }, [chartWidth, chartHeight])
    const packLayout = useMemo(() => {
        return pack<HierarchialTradeData>()
            .size([chartWidth * 0.3, chartHeight * 0.5])
            .padding(10)
    }, [chartWidth, chartHeight])
    const [currentNode, setCurrentNode] = useState<HierarchyRectangularNode<HierarchialTradeData> | null>(null)
    const currentTree = useMemo(() => {
        if (hierarchialData) {
            const dataByCategory: HierarchyNode<HierarchialTradeData> | undefined = findNodeByCategory(
                hierarchialData,
                category,
            )
            if (dataByCategory) {
                return treeLayout(dataByCategory)
            }
        }
    }, [category, currentNode, , treeLayout, hierarchialData])

    const chartRef = useRef<HTMLCanvasElement | null>(null)
    const intersectRef = useRef<HTMLCanvasElement | null>(null)
    const treeNameColorScale = useMemo(() => {
        if (currentTree && currentTree.children) {
            const colorScale = createColorScaleByNodeName(currentTree.children)
            return colorScale
        }
    }, [currentTree])

    useEffect(() => {
        const chart = chartRef.current
        if (chart) {
            const ctx = chart.getContext('2d')
            if (ctx) {
                ctx.clearRect(0, 0, chartWidth, chartHeight)
                if (currentTree) {
                    const children = currentTree.children
                    const total = currentTree.value || 0
                    if (!children) {
                        const rootNode = currentTree

                        const rectColor = '#1f77b4'

                        const currentWidth = getHierarchyWidth(rootNode)
                        const currentHeight = getHierarchyHeight(rootNode)
                        ctx.save()
                        ctx.beginPath()
                        ctx.rect(rootNode.x0, rootNode.y0, currentWidth, currentHeight)

                        ctx.fillStyle = rectColor
                        ctx.fill()
                        ctx.restore()
                        ctx.closePath()
                        const textPadding = 5

                        const text = getNameFromInternMap(rootNode.data)
                        const value = rootNode.value || 0
                        const commaedValue = `$ ${numberWithCommas(value)} (천달러)`
                        const percentage = ((value / total) * 100).toFixed(2) + '%'
                        const valueSize = getTextSize(commaedValue, '0.7rem')
                        const nameSize = getTextSize(text, '0.8rem')
                        const percentageSize = getTextSize(percentage, '0.7rem')
                        if (nameSize) {
                            const isTextFitInRect = isTextFit({
                                textSize: nameSize,
                                width: currentWidth,
                                height: currentHeight,
                                paddingLeft: textPadding,
                                paddingTop: textPadding,
                            })
                            if (isTextFitInRect) {
                                const text = getNameFromInternMap(rootNode.data)

                                const textColor = getInvertedColor(rectColor, true)

                                ctx.save()
                                ctx.beginPath()
                                ctx.font = `0.8rem Arial`
                                ctx.textBaseline = 'hanging'
                                ctx.fillStyle = textColor
                                ctx.fillText(text, rootNode.x0 + textPadding, rootNode.y0 + textPadding)

                                ctx.restore()
                                ctx.closePath()

                                if (valueSize) {
                                    const isValueFit = isTextFit({
                                        textSize: valueSize,
                                        width: currentWidth - 5,
                                        height: currentHeight - 5 - nameSize.height,
                                        paddingLeft: 3,
                                        paddingTop: 3,
                                    })
                                    if (isValueFit) {
                                        ctx.save()
                                        ctx.beginPath()
                                        ctx.font = `0.8rem Arial`
                                        ctx.textBaseline = 'hanging'
                                        ctx.fillStyle = textColor
                                        ctx.fillText(
                                            commaedValue,
                                            rootNode.x0 + textPadding,
                                            rootNode.y0 + textPadding + nameSize.height + 3,
                                        )
                                        ctx.restore()
                                        ctx.closePath()
                                        const isPercentageFit = isTextFit({
                                            textSize: percentageSize!,
                                            width: currentWidth - 5,
                                            height: currentHeight - 5 - nameSize.height - valueSize.height,
                                            paddingLeft: 3,
                                            paddingTop: 3,
                                        })
                                        if (isPercentageFit) {
                                            ctx.save()
                                            ctx.beginPath()
                                            ctx.font = `0.7rem Arial`
                                            ctx.textBaseline = 'hanging'
                                            ctx.fillText(
                                                percentage,
                                                rootNode.x0 + textPadding,
                                                rootNode.y0 + textPadding + nameSize.height + valueSize.height + 8,
                                            )

                                            ctx.fillStyle = 'black'
                                            ctx.fill()
                                            ctx.restore()
                                            ctx.closePath()
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (children && treeNameColorScale) {
                        children.forEach((childNode) => {
                            const name = getNameFromInternMap(childNode.data)
                            const color = treeNameColorScale(name)

                            const currentWidth = getHierarchyWidth(childNode)
                            const currentHeight = getHierarchyHeight(childNode)
                            ctx.save()
                            ctx.beginPath()
                            ctx.rect(childNode.x0, childNode.y0, currentWidth, currentHeight)

                            ctx.fillStyle = color
                            ctx.fill()
                            ctx.restore()
                            ctx.closePath()
                        })
                        children.forEach((childNode) => {
                            const name = getNameFromInternMap(childNode.data)
                            const color = treeNameColorScale(name)
                            const currentWidth = getHierarchyWidth(childNode)
                            const currentHeight = getHierarchyHeight(childNode)
                            const textPadding = 5

                            const text = getNameFromInternMap(childNode.data)
                            const value = childNode.value || 0
                            const commaedValue = `$ ${numberWithCommas(value)} (천달러)`

                            const valueSize = getTextSize(commaedValue, '0.7rem')
                            const percentage = ((value / total) * 100).toFixed(2) + '%'

                            const nameSize = getTextSize(text, '0.8rem')
                            const percentageSize = getTextSize(percentage, '0.7rem')
                            if (nameSize) {
                                const isTextFitInRect = isTextFit({
                                    textSize: nameSize,
                                    width: currentWidth,
                                    height: currentHeight,
                                    paddingLeft: textPadding,
                                    paddingTop: textPadding,
                                })
                                if (isTextFitInRect) {
                                    const text = getNameFromInternMap(childNode.data)

                                    const textColor = getInvertedColor(color, true)

                                    ctx.save()
                                    ctx.beginPath()
                                    ctx.font = `0.8rem Arial`
                                    ctx.textBaseline = 'hanging'
                                    ctx.fillStyle = textColor
                                    ctx.fillText(text, childNode.x0 + textPadding, childNode.y0 + textPadding)

                                    ctx.restore()
                                    ctx.closePath()

                                    if (valueSize) {
                                        const isValueFit = isTextFit({
                                            textSize: valueSize,
                                            width: currentWidth - 5,
                                            height: currentHeight - 5 - nameSize.height,
                                            paddingLeft: 3,
                                            paddingTop: 3,
                                        })
                                        if (isValueFit) {
                                            ctx.save()
                                            ctx.beginPath()
                                            ctx.font = `0.8rem Arial`
                                            ctx.textBaseline = 'hanging'
                                            ctx.fillStyle = textColor
                                            ctx.fillText(
                                                commaedValue,
                                                childNode.x0 + textPadding,
                                                childNode.y0 + textPadding + nameSize.height + 3,
                                            )
                                            ctx.restore()
                                            ctx.closePath()
                                            const isPercentageFit = isTextFit({
                                                textSize: percentageSize!,
                                                width: currentWidth - 5,
                                                height: currentHeight - 5 - nameSize.height - valueSize.height,
                                                paddingLeft: 3,
                                                paddingTop: 3,
                                            })
                                            if (isPercentageFit) {
                                                ctx.save()
                                                ctx.beginPath()
                                                ctx.font = `0.7rem Arial`
                                                ctx.textBaseline = 'hanging'
                                                ctx.fillText(
                                                    percentage,
                                                    childNode.x0 + textPadding,
                                                    childNode.y0 + textPadding + nameSize.height + valueSize.height + 8,
                                                )

                                                ctx.fillStyle = 'black'
                                                ctx.fill()
                                                ctx.restore()
                                                ctx.closePath()
                                            }
                                        }
                                    }
                                }
                            }
                        })
                    }
                }
            }
        }
    }, [chartRef, chartWidth, chartHeight, currentTree, treeNameColorScale])

    const [hoveredPackNodes, setHoveredPackNodes] = useState<HierarchyCircularNode<HierarchialTradeData> | null>(null)
    const [hoveredPackVector, setHoveredPackVector] = useState<Vector | null>(null)
    const onMouseHover: React.MouseEventHandler = useCallback(
        (e) => {
            if (currentTree && currentTree.children) {
                const target = e.target as HTMLDivElement
                const { top, left } = target.getBoundingClientRect()
                const x = e.clientX - left
                const y = e.clientY - top
                if (currentNode && isVectorIntersectWithNode(x, y, currentNode)) {
                    return
                } else {
                    const node = searchInQuadTree({ nodes: currentTree.children, x, y })
                    setCurrentNode(node)

                    if (node) {
                        const packed = packLayout(node.copy()).sort((a, b) => {
                            const bValue = b.value || 0
                            const aValue = a.value || 0
                            return bValue - aValue
                        })
                        setHoveredPackNodes(packed)
                        let vector: Vector
                        if (node.children) {
                            vector = getToolTipPosAndSize({
                                node,
                                contextHeight: chartHeight,
                                contextWidth: chartWidth,
                                maxToolTipWidth: chartWidth * 0.5,
                                maxToolTipHeight: chartHeight * 0.8,
                            })
                        } else {
                            vector = getToolTipPosAndSize({
                                node,
                                contextHeight: chartHeight,
                                contextWidth: chartWidth,
                                maxToolTipWidth: chartHeight * 0.3,
                                maxToolTipHeight: chartHeight * 0.4,
                            })
                        }

                        setHoveredPackVector(vector)
                    }
                }
            }
        },
        [currentTree, currentNode, packLayout],
    )
    useEffect(() => {
        const intersectCanvas = intersectRef.current
        if (currentNode && intersectCanvas && treeNameColorScale) {
            const ctx = intersectCanvas.getContext('2d')
            if (ctx) {
                clearCanvas(intersectCanvas)
                const rectColor = treeNameColorScale(currentNode.id || '')
                const textColor = getInvertedColor(rectColor, true)
                const { x0, y0 } = currentNode
                const currentNodeWidth = getHierarchyWidth(currentNode)
                const currentHeight = getHierarchyHeight(currentNode)
                ctx.save()
                ctx.beginPath()
                ctx.strokeStyle = textColor
                ctx.lineWidth = 3
                ctx.rect(x0 - 1.5, y0 - 1.5, currentNodeWidth + 1.5, currentHeight + 1.5)
                ctx.stroke()
                ctx.restore()
                ctx.closePath()
            }
        }
    }, [currentNode, treeNameColorScale])
    const onMouseLeave = useCallback(() => {
        const interactCanvas = intersectRef.current
        // initialize current node to null
        setCurrentNode(null)
        setHoveredPackNodes(null)
        setHoveredPackVector(null)
        // clear Interact canvas
        if (interactCanvas) {
            clearCanvas(interactCanvas)
        }
    }, [intersectRef])
    const onClick = useCallback(() => {
        const interactCanvas = intersectRef.current
        if (currentNode) {
            const selectedCategory = getNameFromInternMap(currentNode.data)
            if (selectedCategory !== category) {
                setCurrentNode(null)
                setHoveredPackNodes(null)
                setHoveredPackVector(null)
                navigateCategory(selectedCategory)
                if (interactCanvas) {
                    clearCanvas(interactCanvas)
                }
            }
        }
    }, [category, currentNode, navigateCategory, intersectRef])
    const childPackProps = useMemo<ChildPackChartProps | undefined>(() => {
        if (currentTree && hoveredPackNodes && hoveredPackVector && treeNameColorScale) {
            return {
                currentTree,
                nodes: hoveredPackNodes,
                vector: hoveredPackVector,
                colorScale: treeNameColorScale,
            }
        }
    }, [currentTree, hoveredPackNodes, hoveredPackVector, treeNameColorScale])
    return (
        <div className="container">
            <div className="chart">
                {loading && <Loading />}
                <canvas className="chart_canvas" ref={chartRef} width={chartWidth} height={chartHeight}></canvas>
                <canvas className="interact_canvas" width={chartWidth} height={chartHeight} ref={intersectRef}></canvas>
                {childPackProps && <ChildPackChart {...childPackProps} />}
                <div
                    className="interactor"
                    onClick={onClick}
                    onMouseMove={onMouseHover}
                    onMouseLeave={onMouseLeave}
                ></div>
            </div>
        </div>
    )
}
