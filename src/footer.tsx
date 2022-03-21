import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
// d3
import { rollup } from 'd3-array'
import { scaleBand, scaleLinear, ScaleLinear } from 'd3-scale'
import { line } from 'd3-shape'
import { HierarchyNode } from 'd3-hierarchy'
// component
import FooterInteractChart from './footerInteractChart'
// style
import './index.css'
import './footer.css'
// constants
import { colorSet } from './constants'
// logics
import {
    createHierarchialData,
    createReducedData,
    createTreeLayout,
    filterByCategory,
    findNodeByCategory,
} from './logics'
// types
import { FooterProps } from './types/view'
// hooks
import { useCategories } from './hooks'
// utils
import { convertRemToPixels, isSameTimeRanges, size } from './utils'
import { TimeRange, HierarchialTradeData, InteractingData } from './types/usecase'

const Footer = ({ data, timelines, timeRange, tradeType, onUpdateTimeRange }: FooterProps): JSX.Element => {
    const [clonedTimeRange, setClonedTimeRange] = useState<TimeRange>()

    const [interactingData, setInteractingData] = useState<InteractingData | null>(null)
    const footerChartWidth = window.innerWidth * 0.9
    const timeLineScale = useMemo(() => {
        if (timelines) {
            return scaleBand().domain(timelines).range([0, footerChartWidth])
        }
    }, [footerChartWidth, timelines])
    const timelineIndexScale = useMemo(() => {
        if (timelines) {
            return scaleLinear().domain([0, timelines.length]).range([0, footerChartWidth])
        }
    }, [footerChartWidth, timelines])
    const getTimelineByPosX: (mousePosX: number) => string | undefined = useCallback(
        (mousePosX: number) => {
            if (timelineIndexScale && timelines) {
                const targetIndex = timelineIndexScale.invert(mousePosX)
                if (targetIndex) {
                    const roundedTargetIndex = Math.round(targetIndex)
                    const newTimeRange =
                        roundedTargetIndex > timelines.length - 1
                            ? timelines[timelines.length - 1]
                            : timelines[roundedTargetIndex]
                    return newTimeRange
                }
            }
        },
        [timelineIndexScale, timelines],
    )
    const { currentCategory: category } = useCategories()
    const [pointerDowned, setPointerDowned] = useState(-1)
    useEffect(() => {
        setClonedTimeRange(timeRange)
    }, [timeRange])
    // reduced data with current TimeRange
    const currentReducedData = useMemo(() => {
        if (data) {
            return createReducedData(tradeType, timeRange, data)
        }
    }, [data, timeRange, tradeType])
    const treeLayout = useMemo(() => {
        return createTreeLayout({
            chartHeight: 200,
            chartWidth: 300,
        })
    }, [])
    const currentHiearchialData = useMemo(() => {
        if (currentReducedData) {
            return createHierarchialData(currentReducedData)
        }
    }, [currentReducedData])
    const createHiearchyDataOnInteract = useCallback(() => {
        if (currentHiearchialData && clonedTimeRange && data) {
            // 인터랙션 중잉 clone된 timerange로 데이터를 만듬.
            const reducedDataWithClonedTimeRange = createReducedData(tradeType, clonedTimeRange, data)

            const interactingHiearchialData = createHierarchialData(reducedDataWithClonedTimeRange)
            const currentRangeNode: HierarchyNode<HierarchialTradeData> | undefined = findNodeByCategory(
                currentHiearchialData,
                category,
            )
            const interactRangeNode: HierarchyNode<HierarchialTradeData> | undefined = findNodeByCategory(
                interactingHiearchialData,
                category,
            )
            if (currentRangeNode && interactRangeNode) {
                const currentTree = treeLayout(currentRangeNode)
                const interactTree = treeLayout(interactRangeNode)
                setInteractingData({
                    currentTree,
                    interactTree,
                })
            }
        }
    }, [category, currentHiearchialData, clonedTimeRange, data, tradeType, treeLayout])
    // common event handler
    const onPointerDown: React.PointerEventHandler = useCallback((e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        const x = e.clientX
        setPointerDowned(x)
    }, [])
    const onPointerUp: React.PointerEventHandler = useCallback(
        (e) => {
            if (clonedTimeRange) {
                if (clonedTimeRange[0] === clonedTimeRange[1]) {
                    onUpdateTimeRange([clonedTimeRange[0], null])
                } else {
                    onUpdateTimeRange(clonedTimeRange)
                }
            }
            e.currentTarget.releasePointerCapture(e.pointerId)
            setPointerDowned(-1)
            setInteractingData(null)
        },
        [clonedTimeRange, onUpdateTimeRange],
    )
    // overlay pointer event handler
    const onOverlayPointerMove: React.PointerEventHandler = useCallback(
        (e) => {
            const downX = pointerDowned
            if (downX > -1 && timeLineScale && timeRange[1]) {
                const timelineDomain = timeLineScale.domain()
                const domains = timeLineScale.domain()
                const endTimeRangeIndex = domains.findIndex((domain) => domain === timeRange[1])
                const startTimeRangeIndex = domains.findIndex((domain) => domain === timeRange[0])
                const gap = endTimeRangeIndex - startTimeRangeIndex
                const lastTimeLine = timelineDomain[timelineDomain.length - 1]
                const currentX = e.clientX
                const moveX = currentX - downX
                const startTimeRangeX = timeLineScale(timeRange[0]) || 0

                const newStartTimeRange = getTimelineByPosX(startTimeRangeX + moveX)
                const newEndTimeRangeX = timeLineScale(timeRange[1])
                const newEndTimeRange = newEndTimeRangeX ? getTimelineByPosX(newEndTimeRangeX + moveX) : undefined

                if (newStartTimeRange && newEndTimeRange) {
                    if (lastTimeLine === newEndTimeRange) {
                        setClonedTimeRange((oldTimeRange) => {
                            if (oldTimeRange) {
                                const startTimeRangeIndex = timelineDomain.length - 1 - gap
                                return [timelineDomain[startTimeRangeIndex], newEndTimeRange]
                            }
                        })
                    } else {
                        setClonedTimeRange([newStartTimeRange, newEndTimeRange])
                    }
                    createHiearchyDataOnInteract()
                }
            }
        },
        [clonedTimeRange, , getTimelineByPosX, pointerDowned, timeRange, timeLineScale, createHiearchyDataOnInteract],
    )
    // left pointer event handler
    const onLeftPointerMove: React.PointerEventHandler = useCallback(
        (e) => {
            const downX = pointerDowned
            if (downX > -1 && timeLineScale) {
                const currentX = e.clientX
                const moveX = currentX - downX
                const startTimeRangeX = timeLineScale(timeRange[0]) || 0
                const newStartTimeRange = getTimelineByPosX(startTimeRangeX + moveX)
                console.log(newStartTimeRange)
                if (newStartTimeRange) {
                    setClonedTimeRange((oldTimeRange) => {
                        if (oldTimeRange) {
                            if (timeRange[1] && newStartTimeRange > timeRange[1]) {
                                return [timeRange[1], newStartTimeRange]
                            }
                            return [newStartTimeRange, oldTimeRange[1]]
                        }
                    })
                    createHiearchyDataOnInteract()
                }
            }
        },
        [clonedTimeRange, createHiearchyDataOnInteract, getTimelineByPosX, pointerDowned, timeRange, timeLineScale],
    )
    const onLeftTipPointerMove: React.PointerEventHandler = useCallback(
        (e) => {
            const downX = pointerDowned
            if (downX > -1 && timeLineScale) {
                const currentX = e.clientX
                const moveX = currentX - downX
                const startTimeRangeX = timeLineScale(timeRange[0]) || 0
                const newStartTimeRange = getTimelineByPosX(startTimeRangeX + moveX)

                if (newStartTimeRange) {
                    setClonedTimeRange((oldTimeRange) => {
                        if (oldTimeRange) {
                            if (newStartTimeRange > timeRange[0]) {
                                return [timeRange[0], newStartTimeRange]
                            }
                            return [newStartTimeRange, timeRange[0]]
                        }
                    })
                    createHiearchyDataOnInteract()
                }
            }
        },
        [clonedTimeRange, createHiearchyDataOnInteract, getTimelineByPosX, pointerDowned, timeRange, timeLineScale],
    )
    const onRightTipPointerMove: React.PointerEventHandler = useCallback(
        (e) => {
            const downX = pointerDowned
            if (downX > -1 && timeLineScale && clonedTimeRange) {
                const currentX = e.clientX
                const moveX = currentX - downX

                const endTimeRangeX = timeLineScale(timeRange[0]) || 0

                const newEndTimeRange = getTimelineByPosX(endTimeRangeX + moveX)

                if (newEndTimeRange) {
                    setClonedTimeRange((oldTimeRange) => {
                        if (oldTimeRange) {
                            if (newEndTimeRange < timeRange[0]) {
                                return [newEndTimeRange, timeRange[0]]
                            }
                            return [timeRange[0], newEndTimeRange]
                        }
                    })
                    createHiearchyDataOnInteract()
                }
            }
        },
        [createHiearchyDataOnInteract, timeRange, getTimelineByPosX, pointerDowned, timeLineScale],
    )
    // right pointer event handler
    const onRightPointerMove: React.PointerEventHandler = useCallback(
        (e) => {
            const downX = pointerDowned
            if (downX > -1 && timeLineScale && clonedTimeRange) {
                const currentX = e.clientX
                const moveX = currentX - downX
                const endTimeRange = timeRange[1]
                if (endTimeRange) {
                    const endTimeRangeX = timeLineScale(endTimeRange) || 0

                    const newEndTimeRange = getTimelineByPosX(endTimeRangeX + moveX)

                    if (newEndTimeRange) {
                        setClonedTimeRange((oldTimeRange) => {
                            if (oldTimeRange) {
                                if (newEndTimeRange < timeRange[0]) {
                                    return [newEndTimeRange, timeRange[0]]
                                }
                                return [timeRange[0], newEndTimeRange]
                            }
                        })
                        createHiearchyDataOnInteract()
                    }
                }
            }
        },
        [createHiearchyDataOnInteract, timeRange, getTimelineByPosX, pointerDowned, timeLineScale],
    )
    // raw data를 무역 유형별, 시간별로 재구성
    const sumData = useMemo(() => {
        if (data) {
            const filteredByCategory = filterByCategory(category, data)
            const grouped = rollup(
                filteredByCategory,
                (d) => d.reduce((acc, curr) => acc + curr.data, 0),
                (d) => d.tradeType,
                (d) => d.time,
            )

            return grouped
        }
    }, [data, category, timeRange])
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    // 각 무역 유형별 데이터와 스케일
    const exportDatas = useMemo(() => {
        if (sumData) {
            return sumData.get('수출액 (천달러)')
        }
    }, [category, sumData])
    const importDatas = useMemo(() => {
        if (sumData) {
            return sumData.get('수입액 (천달러)')
        }
    }, [category, sumData])
    const exportScale: ScaleLinear<number, number> | undefined = useMemo(() => {
        if (exportDatas) {
            const mappedData = [...exportDatas.values()]
            const min = Math.min(...mappedData)
            const max = Math.max(...mappedData)
            return scaleLinear().domain([min, max]).range([size.footerChartHeight(), 0])
        }
    }, [exportDatas])
    const importScale: ScaleLinear<number, number> | undefined = useMemo(() => {
        if (importDatas) {
            const mappedData = [...importDatas.values()]
            const min = Math.min(...mappedData)
            const max = Math.max(...mappedData)
            return scaleLinear().domain([min, max]).range([size.footerChartHeight(), 0])
        }
    }, [importDatas])
    useEffect(() => {
        const canvas = canvasRef.current
        if (canvas) {
            const ctx = canvas.getContext('2d')
            if (ctx && timeLineScale && timelines) {
                const canvasWidth = canvas.width
                const canvasHeight = canvas.height
                const bandWidth = timeLineScale.bandwidth()
                // init canvas
                ctx.clearRect(0, 0, canvasWidth, canvasHeight)
                // draw layouts
                ctx.save()
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.moveTo(bandWidth / 2, 0)
                ctx.lineTo(canvasWidth - bandWidth / 2, 0)
                ctx.stroke()
                ctx.closePath()
                ctx.restore()
                timelines.forEach((timeline) => {
                    const padding = bandWidth / 2
                    const xPos = timeLineScale(timeline) || 0
                    ctx.save()
                    ctx.beginPath()
                    ctx.strokeStyle = 'lightgrey'
                    ctx.moveTo(xPos + padding, 0)
                    ctx.lineTo(xPos + padding, canvasHeight)
                    ctx.stroke()
                    ctx.closePath()
                    ctx.restore()
                })
                // ready to draw exportDatas line chart
                if (exportDatas && exportScale) {
                    const exportLine = line<[string, number]>()
                        .x((d) => {
                            const key = Array.isArray(d) ? d[0] : ''
                            return timeLineScale(key) || 0
                        })
                        .y((d) => {
                            const value = Array.isArray(d) ? d[1] : 0
                            return exportScale(value) || 0
                        })
                        .context(ctx)
                    ctx.beginPath()
                    ctx.save()
                    ctx.translate(bandWidth / 2, canvasHeight * 0.1)
                    ctx.strokeStyle = colorSet.up
                    ctx.lineWidth = 2
                    exportLine(
                        [...exportDatas.entries()].sort((a, b) => {
                            const aDate = a[0]
                            const bDate = b[0]
                            return aDate.localeCompare(bDate)
                        }),
                    )
                    ctx.stroke()
                    ctx.restore()
                    ctx.closePath()
                }
                if (importDatas && importScale) {
                    const importLine = line<[string, number]>()
                        .x((d) => {
                            const key = Array.isArray(d) ? d[0] : ''
                            return timeLineScale(key) || 0
                        })
                        .y((d) => {
                            const value = Array.isArray(d) ? d[1] : 0
                            return importScale(value) || 0
                        })
                        .context(ctx)

                    ctx.beginPath()
                    ctx.save()
                    ctx.translate(bandWidth / 2, canvasHeight * 0.1)
                    ctx.strokeStyle = colorSet.down
                    ctx.lineWidth = 2
                    importLine(
                        [...importDatas.entries()].sort((a, b) => {
                            const aDate = a[0]
                            const bDate = b[0]
                            return aDate.localeCompare(bDate)
                        }),
                    )
                    ctx.stroke()
                    ctx.restore()
                    ctx.closePath()
                }
            }
        }
    }, [canvasRef, exportDatas, exportScale, importDatas, importScale, timelines, timeLineScale])
    // components
    const TimeFlag: JSX.Element | null = useMemo(() => {
        if (timeLineScale && clonedTimeRange) {
            const canvasHeight = convertRemToPixels(5)
            const bandwidth = timeLineScale.bandwidth()
            const width = bandwidth * 0.8
            const height = convertRemToPixels(2) * 0.8
            const startTimeRange = clonedTimeRange[0]
            const startTimelineText = startTimeRange.slice(2)
            const startTimeRangeXpos = timeLineScale(startTimeRange) || 0
            const startTimeRangeYPos = convertRemToPixels(2) * 0.1
            const endTimeRange = clonedTimeRange[1]
            const endTimelineText = endTimeRange ? endTimeRange.slice(2) : ''
            const endTimeRangeXpos = endTimeRange ? timeLineScale(endTimeRange) || 0 : 0
            const endTimeRangeYPos = convertRemToPixels(2) * 0.1
            // tip related
            const isLeftToolTipRenderable = !timeRange[1] && timeLineScale && timeLineScale.domain()[0] !== timeRange[0]
            const isRightToolTipRenderable =
                !timeRange[1] &&
                timeLineScale &&
                timeLineScale.domain()[timeLineScale.domain().length - 1] !== timeRange[0]
            return (
                <g transform={`translate(${window.innerWidth * 0.05 + bandwidth / 2},0)`}>
                    {endTimeRange && (
                        <rect
                            onPointerDown={onPointerDown}
                            onPointerMove={onOverlayPointerMove}
                            onPointerUp={onPointerUp}
                            className="timeline_overlay"
                            x={startTimeRangeXpos}
                            width={endTimeRangeXpos - startTimeRangeXpos}
                            y={convertRemToPixels(2)}
                            height={convertRemToPixels(5)}
                            fillOpacity={0.2}
                            fill="grey"
                        />
                    )}
                    <g>
                        {isLeftToolTipRenderable && (
                            <rect
                                x={startTimeRangeXpos - width / 2 - 5}
                                y={startTimeRangeYPos}
                                width={10}
                                height={10}
                                fill="red"
                                onPointerDown={onPointerDown}
                                onPointerMove={onLeftTipPointerMove}
                                onPointerUp={onPointerUp}
                                className="cursor-ew-resize"
                                fillOpacity={isSameTimeRanges(clonedTimeRange, timeRange) ? 1 : 0}
                            />
                        )}
                        {isRightToolTipRenderable && (
                            <rect
                                x={startTimeRangeXpos + width / 2 - 5}
                                y={startTimeRangeYPos}
                                width={10}
                                height={10}
                                fill="red"
                                onPointerDown={onPointerDown}
                                onPointerMove={onRightTipPointerMove}
                                onPointerUp={onPointerUp}
                                className="cursor-ew-resize"
                                fillOpacity={isSameTimeRanges(clonedTimeRange, timeRange) ? 1 : 0}
                            />
                        )}
                        <g
                            className="timeline_box"
                            onPointerDown={onPointerDown}
                            onPointerMove={onLeftPointerMove}
                            onPointerUp={onPointerUp}
                        >
                            <rect
                                x={startTimeRangeXpos - width / 2}
                                y={startTimeRangeYPos}
                                width={width}
                                height={height}
                                fill={colorSet.select}
                                rx={5}
                                ry={5}
                            />
                            <text
                                alignmentBaseline="middle"
                                textAnchor="middle"
                                x={startTimeRangeXpos}
                                y={startTimeRangeYPos + height / 2}
                                fill="white"
                                className="text-[0.8rem]"
                            >
                                {startTimelineText}
                            </text>
                            <rect
                                x={startTimeRangeXpos - 1}
                                y={height}
                                width={2}
                                height={canvasHeight + convertRemToPixels(2) * 0.2}
                                fill={colorSet.select}
                                onPointerDown={onPointerDown}
                                onPointerMove={onLeftPointerMove}
                                onPointerUp={onPointerUp}
                                className="cursor-ew-resize"
                            />
                        </g>
                    </g>
                    {endTimeRange && (
                        <g
                            className="timeline_box"
                            onPointerDown={onPointerDown}
                            onPointerMove={onRightPointerMove}
                            onPointerUp={onPointerUp}
                        >
                            <rect
                                x={endTimeRangeXpos - width / 2}
                                y={endTimeRangeYPos}
                                width={width}
                                height={height}
                                fill={colorSet.select}
                                rx={5}
                                ry={5}
                            />
                            <text
                                alignmentBaseline="middle"
                                textAnchor="middle"
                                x={endTimeRangeXpos}
                                y={endTimeRangeYPos + height / 2}
                                fill="white"
                                className="text-[0.8rem]"
                            >
                                {endTimelineText}
                            </text>
                            <rect
                                x={endTimeRangeXpos - 1}
                                y={height}
                                width={2}
                                height={canvasHeight + convertRemToPixels(2) * 0.2}
                                fill={colorSet.select}
                                onPointerDown={onPointerDown}
                                onPointerMove={onRightPointerMove}
                                onPointerUp={onPointerUp}
                                className="cursor-ew-resize"
                            />
                        </g>
                    )}
                </g>
            )
        }
        return null
    }, [
        timeLineScale,
        clonedTimeRange,
        onPointerDown,
        onLeftPointerMove,
        onRightPointerMove,
        onPointerUp,
        onOverlayPointerMove,
    ])

    return (
        <div className="bg-slate-100 w-screen h-28 flex flex-col items-center justify-center relative">
            {interactingData && (
                <FooterInteractChart
                    {...interactingData}
                    currentTimeRange={timeRange}
                    interactTimeRange={clonedTimeRange}
                    tradeType={tradeType}
                />
            )}
            <svg className="h-28 w-[5vw] z-10 absolute top-0 left-0">
                <line
                    x1={5}
                    x2={window.innerWidth * 0.035}
                    y1={convertRemToPixels(7) * 0.4}
                    y2={convertRemToPixels(7) * 0.4}
                    stroke={colorSet.up}
                    strokeWidth={4}
                />
                <text x={5} y={convertRemToPixels(7) * 0.4 + 5} alignmentBaseline="hanging">
                    수출액
                </text>
                <line
                    x1={5}
                    x2={window.innerWidth * 0.035}
                    y1={convertRemToPixels(7) * 0.7}
                    y2={convertRemToPixels(7) * 0.7}
                    stroke={colorSet.down}
                    strokeWidth={4}
                />
                <text x={5} y={convertRemToPixels(7) * 0.7 + 5} alignmentBaseline="hanging">
                    수입액
                </text>
            </svg>
            <svg className="absolute top-0 left-0 w-full h-full">{TimeFlag}</svg>
            <div className="h-8 w-full">
                <svg width={window.innerWidth} height={convertRemToPixels(2)}>
                    {timelines && timeLineScale && (
                        <g transform={`translate(${window.innerWidth * 0.05},0)`}>
                            {timelines.map((timeline) => {
                                const key = timeline
                                const bandWidth = timeLineScale.bandwidth()
                                const width = bandWidth * 0.8
                                const height = convertRemToPixels(2) * 0.8
                                const xPos = timeLineScale(timeline) || 0
                                const yPos = convertRemToPixels(2) * 0.1
                                const timelineText = timeline.slice(2)
                                return (
                                    <g key={key} transform={`translate(${xPos},${yPos})`}>
                                        <rect
                                            x={bandWidth * 0.1}
                                            y={0}
                                            width={width}
                                            height={height}
                                            fill="lightgrey"
                                            rx={5}
                                            ry={5}
                                        />
                                        <text
                                            alignmentBaseline="middle"
                                            textAnchor="middle"
                                            x={bandWidth / 2}
                                            y={height / 2}
                                            fill="white"
                                            className="text-[0.8rem]"
                                        >
                                            {timelineText}
                                        </text>
                                        <rect
                                            x={bandWidth / 2 - 1}
                                            y={height}
                                            width={2}
                                            height={convertRemToPixels(2) * 0.1}
                                            fill="black"
                                        />
                                        <rect
                                            className="timeline_box"
                                            x={bandWidth * 0.1}
                                            y={0}
                                            width={width}
                                            height={height}
                                            fill="transparent"
                                            rx={5}
                                            ry={5}
                                        />
                                    </g>
                                )
                            })}
                        </g>
                    )}
                </svg>
            </div>
            <canvas className="w-[90vw] h-20" width={window.innerWidth * 0.9} ref={canvasRef}></canvas>
        </div>
    )
}

export default Footer
