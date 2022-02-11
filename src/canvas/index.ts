export const clearCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
}
