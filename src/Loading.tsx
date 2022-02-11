import React, { useEffect, useState, useMemo } from 'react'

//d3
import { arc } from 'd3-shape'

export default function Loading() {
    const arcGenerator = arc()
    const [startAngle, setStartAngle] = useState(0)
    useEffect(() => {
        const interv = setInterval(() => {
            setStartAngle((angle) => {
                if (angle === Math.PI * 2) {
                    return 0
                } else {
                    return angle + Math.PI / 8
                }
            })
        }, 100)
        return () => clearInterval(interv)
    }, [])
    return (
        <div className="w-full h-full absolute top-0 left-0 bg-slate-200 flex flex-col justify-center items-center z-50">
            <svg width={150} height={150} className="mb-4">
                <g transform="translate(75,75)">
                    <path
                        d={
                            arcGenerator({
                                startAngle: 0,
                                endAngle: Math.PI * 2,
                                innerRadius: 50,
                                outerRadius: 70,
                            }) || ''
                        }
                        className="fill-slate-400"
                    />
                    <path
                        d={
                            arcGenerator({
                                startAngle: startAngle,
                                endAngle: startAngle + Math.PI / 4,
                                innerRadius: 50,
                                outerRadius: 70,
                            }) || ''
                        }
                        className="fill-pink-700 "
                    />
                </g>
            </svg>
            <h3>CSV 파일을 불러오고 있습니다...</h3>
        </div>
    )
}
