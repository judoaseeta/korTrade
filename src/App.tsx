import React, { useEffect, useState, useMemo } from 'react'
import { Route, Routes } from 'react-router-dom'
import { rollup } from 'd3-array'
import { csvParse } from 'd3-dsv'
// components
import Nav from './Nav'
import Footer from './footer'
import Chart from './Chart'

// logics
import { createReducedData, filterUnnecessary, filterByDateRange, filterByType } from './logics'
// utils
import { convertRemToPixels } from './utils'
// types
import { ChartProps, FooterProps, NavProps } from './types/view'
import { TradeData, RawTradeData, TradeType, TradeTypeEnum } from './types/entity'
import { TimeRange } from './types/usecase'
import './index.css'
import './app.css'

const App = (): JSX.Element => {
    //loading status
    const [loading, setLoading] = useState(true)
    const chartWidth = window.innerWidth * 0.9
    const chartHeight = window.innerHeight - convertRemToPixels(11)
    const [timeRange, setTimeRange] = useState<TimeRange>(['2020.01', '2020.08'])
    const onUpdateTimeRange = (newTimeRange: TimeRange) => {
        setTimeRange(newTimeRange)
    }
    const [tradeType, setTradeType] = useState<TradeType>(TradeTypeEnum.import)
    const onChangeTradeType: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
        const type = e.target.value as TradeType
        setTradeType(type)
    }
    const [data, setData] = useState<TradeData[] | undefined>(undefined)

    const fetchCsv = async () => {
        const result = await fetch(
            'https://raw.githubusercontent.com/judoaseeta/csvs/main/korea_trade%20-%20korea_trade.csv',
        )
        const parsed = await result.text()
        return parsed
    }
    const getData = async () => {
        const result = await fetchCsv()
        const data = csvParse(result) as RawTradeData[]
        const mappedData = data.map((d) => ({
            categoryDepth1: d['품목별(1)'],
            categoryDepth2: d['품목별(2)'],
            categoryDepth3: d['품목별(3)'],
            tradeType: d.항목,
            data: parseFloat(d.데이터),
            time: d.시점.split(' ').join(''),
        }))
        setLoading(false)
        setData(filterUnnecessary(mappedData))
    }
    useEffect(() => {
        getData()
    }, [])
    const timelines: string[] | undefined = useMemo(() => {
        if (data) {
            const mappedDate: { [date: string]: boolean } = {}
            data.forEach((d) => {
                const dataDate = d.time
                if (!mappedDate[dataDate]) {
                    mappedDate[dataDate] = true
                }
            })
            return Object.keys(mappedDate)
        }
    }, [data])

    // props
    const footerProps: FooterProps = {
        timelines,
        timeRange,
        tradeType,
        data,
        onUpdateTimeRange,
    }

    const chartProps: ChartProps = {
        chartHeight,
        chartWidth,
        data,
        loading,
        timeRange,
        tradeType,
    }
    const navProps: NavProps = {
        timeRange,
        tradeType,
        onChangeTradeType,
    }
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <div className="w-screen h-screen flex flex-col">
                        <Nav {...navProps} />
                        <Chart {...chartProps} />
                        <Footer {...footerProps} />
                    </div>
                }
            />
        </Routes>
    )
}

export default App
