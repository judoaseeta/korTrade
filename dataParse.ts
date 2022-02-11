import fs from 'fs'
import { csvParse } from 'd3-dsv'

interface DataType {
    '품목별(1)': string
    '품목별(2)': string
    '품목별(3)': string
    항목: '수출액 (천달러)' | '수입액 (천달러)'
    시점: string
    데이터: string
}
export interface ParsedDataType extends DataType {
    name: string
    parent: string
}
const data = fs.readFileSync('./kot.csv')
const stringifed = data.toString()
const parsed = csvParse(stringifed) as DataType[]

const mapped = parsed
    .map((d) => {
        if (d['품목별(2)'].includes('소계') && d['품목별(3)'].includes('소계')) {
            return {
                ...d,
                name: d['품목별(1)'],
                parent: '총액',
            }
        }
        if (d['품목별(3)'].includes('소계')) {
            return {
                ...d,
                name: d['품목별(2)'],
                parent: d['품목별(1)'],
            }
        }
        return {
            ...d,
            name: d['품목별(3)'],
            parent: d['품목별(2)'],
        }
    })
    .map((d) => ({
        ...d,
        시점: `${d.시점.split(' ').join('')}.01`,
    }))
console.log(mapped)
