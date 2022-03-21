// d3
import { InternMap } from 'd3-array'
import { scaleOrdinal, ScaleOrdinal } from 'd3-scale'
import { schemeCategory10 } from 'd3-scale-chromatic'
import { HierarchyNode, HierarchyRectangularNode } from 'd3-hierarchy'
// usecase
import { Size, ParsedCategoryQueryString, TimeRange } from '../types/usecase'

export function getNameFromInternMap(intern: InternMap<string, InternMap<string, InternMap<string, number>>>): string {
    return Array.isArray(intern) ? (intern[0] ? intern[0] : '') : ''
}
export function getValueFromInternMap(intern: InternMap<string, InternMap<string, InternMap<string, number>>>): string {
    return Array.isArray(intern) ? (intern[0] ? intern[0] : '') : ''
}
export function convertRemToPixels(rem: number): number {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize)
}
export function getHierarchyWidth<T>(rectNode: HierarchyRectangularNode<T>) {
    return rectNode.x1 - rectNode.x0
}
export function getHierarchyHeight<T>(rectNode: HierarchyRectangularNode<T>) {
    return rectNode.y1 - rectNode.y0
}
export function getTextSize(text: string, fontSize: string, font = 'Arial'): Size | undefined {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (ctx) {
        ctx.font = `${fontSize} ${font}`
        const { fontBoundingBoxDescent, fontBoundingBoxAscent, actualBoundingBoxLeft, actualBoundingBoxRight } =
            ctx.measureText(text)
        return {
            width: Math.abs(actualBoundingBoxLeft) + Math.abs(actualBoundingBoxRight),
            height: Math.abs(fontBoundingBoxAscent) + Math.abs(fontBoundingBoxDescent),
        }
    }
}
export function isTextFit({
    textSize,
    width,
    height,
    paddingLeft,
    paddingTop,
}: {
    textSize: Size
    width: number
    height: number
    paddingLeft?: number
    paddingTop?: number
}) {
    const targetWidth = textSize.width + (paddingLeft || 0)
    const targetHeight = textSize.height + (paddingTop || 0)
    return targetWidth <= width && targetHeight <= height
}

export function createColorScaleByNodeName(
    nodes: HierarchyNode<InternMap<string, InternMap<string, InternMap<string, number>>>>[],
    colorRanges: readonly string[] = schemeCategory10,
) {
    const nodeNames = nodes.map((node) => getNameFromInternMap(node.data))
    const scale = scaleOrdinal<string>().domain(nodeNames).range(colorRanges)
    return scale
}
function padZero(str: string, len?: number) {
    len = len || 2
    var zeros = new Array(len).join('0')
    return (zeros + str).slice(-len)
}
const hexRegex = new RegExp(/\#(.{3,6})/)
export function getInvertedColor(hex: string, greyscale?: boolean) {
    console.log()
    if (hex.indexOf('#') === 0) {
        const regexed = hexRegex.exec(hex)
        hex = regexed ? regexed[1] : ''
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.')
    }
    let r: string | number = parseInt(hex.slice(0, 2), 16),
        g: string | number = parseInt(hex.slice(2, 4), 16),
        b: string | number = parseInt(hex.slice(4, 6), 16)
    if (greyscale) {
        return r * 0.299 + g * 0.587 + b * 0.114 > 186 ? '#000000' : '#FFFFFF'
    }
    // invert color components
    r = (255 - r).toString(16)
    g = (255 - g).toString(16)
    b = (255 - b).toString(16)
    // pad each with zeros and return
    return '#' + padZero(r) + padZero(g) + padZero(b)
}

export const parseCategoryQueryString = (queryString: string): ParsedCategoryQueryString => {
    if (!queryString)
        return {
            category1: '',
            category2: '',
            category3: '',
        }
    const parsed = new URLSearchParams(queryString)
    const category1 = parsed.get('category1') || ''
    const category2 = parsed.get('category2') || ''
    const category3 = parsed.get('category3') || ''
    return {
        category1,
        category2,
        category3,
    }
}
export function numberWithCommas(x: number) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')
}

export function isSameTimeRanges(range1: TimeRange, range2: TimeRange) {
    if (range1[1] === null && range2[1] === null) {
        return range1[0] === range2[0]
    } else if (range1[1] !== null && range2[1] !== null) {
        return range1[0] === range2[0] && range1[1] === range2[1]
    } else {
        return false
    }
}

type SizeTypes = 'chartWidth' | 'chartHeight' | 'chartNodeTitle' | 'footerChartHeight'
export const size: {
    [name in SizeTypes]: () => number
} = {
    chartWidth: () => window.innerWidth * 0.9,
    chartHeight: () => {
        const deviceHeight = window.innerHeight
        if (deviceHeight < 1200) {
            return deviceHeight - convertRemToPixels(15)
        } else {
            return deviceHeight - convertRemToPixels(13)
        }
    },
    chartNodeTitle: () => {
        const deviceWidth = window.innerWidth
        if (deviceWidth < 1200) {
            return convertRemToPixels(1.5)
        } else {
            return convertRemToPixels(0.8)
        }
    },
    footerChartHeight: () => convertRemToPixels(5) * 0.9,
}
