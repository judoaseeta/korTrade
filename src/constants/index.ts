import { convertRemToPixels } from '../utils'
type ColorKeys = 'up' | 'down' | 'select'
export const colorSet: {
    [color in ColorKeys]: string
} = {
    up: 'red',
    down: 'blue',
    select: '#d35400',
}
