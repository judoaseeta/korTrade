import React, { useCallback, useMemo } from 'react'
// d3
import { scaleBand, scaleLinear } from 'd3-scale'
// types
import { FooterInteractChartProps } from './types/view'
// utils
import { createColorScaleByNodeName, numberWithCommas, getNameFromInternMap, getInvertedColor } from './utils'
// constants
import { colorSet } from './constants'
export default function FooterInteractChart({
    currentTree,
    interactTree,
    currentTimeRange,
    interactTimeRange,
    tradeType,
}: FooterInteractChartProps): JSX.Element {
    const currentTreeColorScale = useMemo(() => {
        if (currentTree && currentTree.children) {
            return createColorScaleByNodeName(currentTree.children)
        }
    }, [currentTree])
    const interactTreeColorScale = useMemo(() => {
        if (interactTree && interactTree.children) {
            return createColorScaleByNodeName(interactTree.children)
        }
    }, [interactTree])

    const currentTreeBandScale = useMemo(() => {
        if (currentTreeColorScale) {
            const domains = currentTreeColorScale.domain()
            return scaleBand()
                .domain(domains)
                .range([0, window.innerHeight * 0.4])
        }
    }, [currentTreeColorScale])

    const compareWithCurrentBandScale: (oldCategory: string) => number = useCallback(
        (category: string) => {
            if (currentTreeBandScale) {
                return currentTreeBandScale.domain().findIndex((domain) => domain === category)
            }
            return -1
        },
        [currentTreeBandScale],
    )
    const interactTreeBandScale = useMemo(() => {
        if (interactTreeColorScale) {
            const domains = interactTreeColorScale.domain()
            return scaleBand()
                .domain(domains)
                .range([0, window.innerHeight * 0.4])
        }
    }, [interactTreeColorScale])
    const currentTreeScale = useMemo(() => {
        if (currentTree) {
            if (currentTree.children) {
                const values = currentTree.children.map((child) => child.value || 0)
                const min = Math.min(...values)
                const max = Math.max(...values)
                return scaleLinear()
                    .domain([min - min * 0.2, max + max * 0.1])
                    .range([0, window.innerWidth * 0.4])
            }
        }
    }, [currentTree])
    const interactTreeScale = useMemo(() => {
        if (interactTree) {
            if (interactTree.children) {
                const values = interactTree.children.map((child) => child.value || 0)
                const min = Math.min(...values)
                const max = Math.max(...values)
                return scaleLinear()
                    .domain([min - min * 0.2, max + max * 0.1])
                    .range([0, window.innerWidth * 0.4])
            }
        }
    }, [interactTree])
    if (currentTree.children && interactTree.children) {
        return (
            <div className="flex flex-col fixed bottom-28 left-[5vw] w-[90vw] h-[50vh] shadow-md rounded bg-white/80 backdrop-opacity-10 z-50">
                <div className="flex flex-row w-full h-full">
                    <svg className="bg-pink-100" width={window.innerWidth * 0.5} height={window.innerHeight * 0.5}>
                        <text
                            x={window.innerWidth * 0.25}
                            y={window.innerHeight * 0.025}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                        >
                            {currentTimeRange[1]
                                ? `현재 선택된 ${currentTimeRange[0]} - ${currentTimeRange[1]} 구간의 ${tradeType}`
                                : `현재 선택된 ${currentTimeRange[0]} 구간의 ${tradeType}`}
                        </text>

                        <g transform={`translate(${window.innerWidth * 0.05},${window.innerHeight * 0.05})`}>
                            {currentTreeBandScale &&
                                currentTreeColorScale &&
                                currentTreeScale &&
                                currentTree &&
                                currentTree.children?.map((child) => {
                                    const value = child.value || 0
                                    const name = getNameFromInternMap(child.data)
                                    const key = `interacting_currentTreeChart_${name}`
                                    const bandWidth = currentTreeBandScale.bandwidth()
                                    const height = bandWidth * 0.8
                                    const half = window.innerWidth * 0.2
                                    const percentage = ((value / (currentTree.value || 0)) * 100).toFixed(2)
                                    const commaValue = `$ ${numberWithCommas(value)} (천달러)`
                                    const combinedText = `${name} - ${commaValue} - ${percentage}%`
                                    return (
                                        <g key={key} transform={`translate(0,${currentTreeBandScale(name) || 0})`}>
                                            <rect
                                                x={0}
                                                width={currentTreeScale(value)}
                                                y={bandWidth * 0.1}
                                                height={height}
                                                fill={currentTreeColorScale(name)}
                                            />
                                            <text
                                                className="text-[0.7rem]"
                                                alignmentBaseline="middle"
                                                textAnchor="middle"
                                                x={half}
                                                y={bandWidth / 2}
                                            >
                                                {combinedText}
                                            </text>
                                        </g>
                                    )
                                })}
                        </g>
                    </svg>
                    <svg className="bg-white" width={window.innerWidth * 0.5} height={window.innerHeight * 0.5}>
                        <g transform={`translate(10,${window.innerHeight * 0.047})`}>
                            <text x={0} y={0} alignmentBaseline="middle" className="text-[0.8rem]">
                                순위 변화
                            </text>
                        </g>
                        {interactTimeRange && (
                            <text
                                x={window.innerWidth * 0.25}
                                y={window.innerHeight * 0.025}
                                textAnchor="middle"
                                alignmentBaseline="middle"
                            >
                                {interactTimeRange[1]
                                    ? `호버중인 ${interactTimeRange[0]} - ${interactTimeRange[1]} 구간의 ${tradeType}`
                                    : `호버중인 ${interactTimeRange[0]} 구간의 ${tradeType}`}
                            </text>
                        )}
                        <g transform={`translate(0,${window.innerHeight * 0.05})`}>
                            {interactTreeBandScale &&
                                currentTreeColorScale &&
                                interactTreeColorScale &&
                                interactTree &&
                                interactTree.children?.map((child, childIndex) => {
                                    const textareaWidth = window.innerWidth * 0.05
                                    const bandwidth = interactTreeBandScale.bandwidth()
                                    const name = getNameFromInternMap(child.data)
                                    const key = `rank_label_${name}`
                                    const oldRank = compareWithCurrentBandScale(name)
                                    if (oldRank > -1) {
                                        const yPos = interactTreeBandScale(name) || 0
                                        const change = oldRank - childIndex
                                        const color = change === 0 ? 'black' : change > 0 ? colorSet.up : colorSet.down
                                        const oldCategoryColor = currentTreeColorScale(name)
                                        const newCategoryColor = interactTreeColorScale(name)

                                        return (
                                            <g key={key} transform={`translate(0,${yPos + bandwidth / 2})`}>
                                                <circle
                                                    cx={textareaWidth * 0.1}
                                                    cy={0}
                                                    r={textareaWidth * 0.1}
                                                    fill={oldCategoryColor}
                                                ></circle>
                                                <circle
                                                    cx={textareaWidth * 0.3}
                                                    cy={0}
                                                    r={textareaWidth * 0.1}
                                                    fill={newCategoryColor}
                                                ></circle>
                                                {change === 0 && (
                                                    <text
                                                        x={textareaWidth * 0.4}
                                                        y={0}
                                                        alignmentBaseline="middle"
                                                        fill={color}
                                                        className="text-[0.8rem]"
                                                    >
                                                        ({change})
                                                    </text>
                                                )}
                                                {change < 0 && (
                                                    <text
                                                        x={textareaWidth * 0.4 + 1}
                                                        y={0}
                                                        alignmentBaseline="middle"
                                                        fill={color}
                                                        className="text-[0.8rem]"
                                                    >
                                                        -{Math.abs(change)}
                                                    </text>
                                                )}
                                                {change > 0 && (
                                                    <text
                                                        x={textareaWidth * 0.4 + 1}
                                                        y={0}
                                                        alignmentBaseline="middle"
                                                        fill={color}
                                                        className="text-[0.8rem]"
                                                    >
                                                        +{change}
                                                    </text>
                                                )}
                                            </g>
                                        )
                                    } else {
                                        return null
                                    }
                                })}
                        </g>
                        <g transform={`translate(${window.innerWidth * 0.05},${window.innerHeight * 0.05})`}>
                            {interactTreeBandScale &&
                                interactTreeColorScale &&
                                interactTreeScale &&
                                interactTree &&
                                interactTree.children?.map((child) => {
                                    const value = child.value || 0
                                    const name = getNameFromInternMap(child.data)
                                    const key = `interacting_interactTreeChart_${name}`
                                    const bandWidth = interactTreeBandScale.bandwidth()
                                    const half = window.innerWidth * 0.2
                                    const height = bandWidth * 0.8
                                    const percentage = ((value / (interactTree.value || 0)) * 100).toFixed(2)

                                    const commaValue = `$ ${numberWithCommas(value)} (천달러)`

                                    const combinedText = `${name} - ${commaValue} - ${percentage}%`
                                    return (
                                        <g key={key} transform={`translate(0,${interactTreeBandScale(name) || 0})`}>
                                            <rect
                                                x={0}
                                                width={interactTreeScale(value)}
                                                y={bandWidth * 0.1}
                                                height={height}
                                                fill={interactTreeColorScale(name)}
                                            />
                                            <text
                                                className="text-[0.7rem]"
                                                alignmentBaseline="middle"
                                                textAnchor="middle"
                                                x={half}
                                                y={bandWidth / 2}
                                            >
                                                {combinedText}
                                            </text>
                                        </g>
                                    )
                                })}
                        </g>
                    </svg>
                </div>
            </div>
        )
    } else {
        const currentTreeName = getNameFromInternMap(currentTree.data)
        const interactTreeName = getNameFromInternMap(interactTree.data)
        const currentValue = currentTree.value || 0
        const interactValue = interactTree.value || 0
        const totalValue = currentValue + interactValue
        const rectWidth = window.innerWidth * 0.4

        const treeScale = scaleLinear().domain([0, totalValue]).range([0, rectWidth])
        return (
            <div className="flex fixed bottom-28 left-[5vw] w-[90vw] h-[10vh] shadow-md rounded bg-white z-50">
                <svg className="bg-pink-100" width={window.innerWidth * 0.45} height={window.innerHeight * 0.1}>
                    <rect
                        x={window.innerWidth * 0.025}
                        y={window.innerHeight * 0.025}
                        width={rectWidth}
                        fill="grey"
                        height={window.innerHeight * 0.05}
                    />
                    <rect
                        x={window.innerWidth * 0.025}
                        y={window.innerHeight * 0.025}
                        width={treeScale(currentValue)}
                        fill="#1f77b4"
                        height={window.innerHeight * 0.05}
                    />
                    <text
                        x={window.innerWidth * 0.225}
                        y={window.innerHeight * 0.015}
                        alignmentBaseline="middle"
                        textAnchor="middle"
                        className="text-[0.8rem]"
                    >
                        {currentTimeRange[0]} {currentTimeRange[1] ? `- ${currentTimeRange[1]}` : ''} {currentTreeName}
                    </text>
                    <text
                        className="text-[0.8rem] font-bold"
                        x={window.innerWidth * 0.225}
                        y={window.innerHeight * 0.05}
                        alignmentBaseline="middle"
                        textAnchor="middle"
                        fill="white"
                    >
                        $ {numberWithCommas(currentTree.value || 0)} (천달러)
                    </text>
                </svg>
                <svg width={window.innerWidth * 0.45} height={window.innerHeight * 0.1}>
                    <rect
                        x={window.innerWidth * 0.025}
                        y={window.innerHeight * 0.025}
                        width={rectWidth}
                        fill="grey"
                        height={window.innerHeight * 0.05}
                    />
                    <rect
                        x={window.innerWidth * 0.025}
                        y={window.innerHeight * 0.025}
                        width={treeScale(interactValue)}
                        fill="#1f77b4"
                        height={window.innerHeight * 0.05}
                    />
                    <text
                        x={window.innerWidth * 0.225}
                        y={window.innerHeight * 0.015}
                        alignmentBaseline="middle"
                        textAnchor="middle"
                        className="text-[0.8rem]"
                    >
                        {interactTimeRange && interactTimeRange[0]}{' '}
                        {interactTimeRange && interactTimeRange[1] ? `- ${interactTimeRange[1]}` : ''}{' '}
                        {interactTreeName}
                    </text>
                    <text
                        className="text-[0.8rem] font-bold"
                        x={window.innerWidth * 0.225}
                        y={window.innerHeight * 0.05}
                        alignmentBaseline="middle"
                        textAnchor="middle"
                        fill="white"
                    >
                        $ {numberWithCommas(interactTree.value || 0)} (천달러)
                    </text>
                </svg>
            </div>
        )
    }
}
