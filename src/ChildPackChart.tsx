import React, { useMemo } from 'react'
// d3
import { arc, pie, PieArcDatum } from 'd3-shape'
import { HierarchyRectangularNode } from 'd3-hierarchy'
// types
import { HierarchialTradeData } from './types/usecase'
import { ChildPackChartProps } from './types/view'
// utils
import { getNameFromInternMap, numberWithCommas, createColorScaleByNodeName } from './utils'
export default function ChildPackChart({ currentTree, vector, nodes, colorScale }: ChildPackChartProps): JSX.Element {
    const arcGenerator = arc<PieArcDatum<HierarchyRectangularNode<HierarchialTradeData>>>()
        .innerRadius(vector.width * 0.1)
        .outerRadius(vector.width * 0.3)
    const pieData = useMemo(() => {
        if (!nodes.children && currentTree.children) {
            const pieGenerator = pie<HierarchyRectangularNode<HierarchialTradeData>>().value((d) => d.value || 0)(
                currentTree.children,
            )
            return pieGenerator
        }
    }, [nodes])
    const currentPie = useMemo(() => {
        if (pieData) {
            return pieData.find((d) => getNameFromInternMap(d.data.data) === getNameFromInternMap(nodes.data))
        }
    }, [pieData, nodes])
    return (
        <div
            className=" absolute shadow-md rounded bg-white/90 backdrop-opacity-90 flex justify-center items-center"
            style={{
                top: vector.y,
                left: vector.x,
            }}
        >
            <svg width={vector.width} height={vector.height}>
                {!nodes.children && (
                    <g transform={`translate(${vector.width / 2}, ${vector.height * 0.4})`}>
                        <circle cx={0} cy={0} r={vector.width * 0.3} fill="lightgrey"></circle>
                    </g>
                )}
                {!nodes.children && currentPie && (
                    <g transform={`translate(${vector.width / 2}, ${vector.height * 0.4})`}>
                        <path
                            d={arcGenerator(currentPie) || ''}
                            fill={colorScale(getNameFromInternMap(nodes.data))}
                            stroke="black"
                        />
                    </g>
                )}
                {!nodes.children && (
                    <g>
                        <text
                            className="text-[0.8rem] font-bold fill-slate-800"
                            x={vector.width / 2}
                            y={vector.height * 0.4}
                            alignmentBaseline="middle"
                            textAnchor="middle"
                        >
                            {(((nodes.value || 0) / (currentTree.value || 0)) * 100).toFixed(3)}%
                        </text>
                        <text
                            className="text-[0.8rem] font-bold fill-slate-800"
                            x={vector.width / 2}
                            y={vector.height * 0.8}
                            alignmentBaseline="middle"
                            textAnchor="middle"
                        >
                            {getNameFromInternMap(nodes.data)}
                        </text>
                        <text
                            className="text-[0.8rem]"
                            x={vector.width / 2}
                            y={vector.height * 0.9}
                            alignmentBaseline="middle"
                            textAnchor="middle"
                        >
                            ${numberWithCommas(nodes.value || 0)} (천달러)
                        </text>
                    </g>
                )}
                {nodes.children?.map((children, index) => {
                    const tempColorScale = createColorScaleByNodeName(nodes.children!)
                    const tempBand = (vector.height * 0.85) / (nodes.children?.length || 0)
                    const name = getNameFromInternMap(children.data)
                    const color = tempColorScale(name)
                    const key = `children_label_nodes_${name}`
                    const posY = tempBand * index + tempBand / 2
                    return (
                        <g key={key}>
                            <circle cx={10} cy={posY} r={5} fill={color} />
                            <text className="text-[0.8rem]" x={20} y={posY} alignmentBaseline="middle">
                                {name}
                            </text>
                        </g>
                    )
                })}
                <g transform={`translate(${vector.width * 0.4},${vector.height * 0.1})`}>
                    {nodes.children && (
                        <circle
                            cx={nodes.x}
                            cy={nodes.y}
                            r={nodes.r}
                            fill="#0c2461"
                            stroke="black"
                            strokeOpacity={0.4}
                        ></circle>
                    )}
                    {nodes.children?.map((node) => {
                        const tempColorScale = createColorScaleByNodeName(nodes.children!)

                        const name = getNameFromInternMap(node.data)
                        const color = tempColorScale(name)
                        const total = nodes.value || 0
                        const value = node.value || 0
                        const percentage = ((value / total) * 100).toFixed(3)
                        const key = `hovered_pack_node_${name}`

                        return (
                            <g key={key}>
                                <circle cx={node.x} cy={node.y} r={node.r} stroke="black" fill={color} />

                                <text
                                    className="text-[0.8rem]"
                                    alignmentBaseline="middle"
                                    textAnchor="middle"
                                    fill="white"
                                    transform={`translate(${node.x}, ${node.y})`}
                                >
                                    {percentage}%
                                </text>
                            </g>
                        )
                    })}
                </g>
                {nodes.children && (
                    <rect
                        x={0}
                        y={vector.height * 0.85}
                        width={vector.width}
                        height={5}
                        fill={colorScale(getNameFromInternMap(nodes.data))}
                    />
                )}
                {nodes.children && (
                    <g>
                        <text
                            className="text-[1rem]"
                            x={vector.width / 2}
                            y={vector.height * 0.9}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                        >
                            {getNameFromInternMap(nodes.data)}
                        </text>
                        <text
                            className="text-[1rem]"
                            x={vector.width / 2}
                            y={vector.height * 0.95}
                            textAnchor="middle"
                            alignmentBaseline="middle"
                        >
                            {`$${numberWithCommas(nodes.value || 0)} (천달러)`}
                        </text>
                    </g>
                )}
            </svg>
        </div>
    )
}
