type RGB = `rgb(${number}, ${number}, ${number})`
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`
type HEX = `#${string}`

type Color = RGB | RGBA | HEX

interface Mask {
    image: HTMLImageElement,
    w: number,
    h: number,
    overflow: Color,
    stroke: () => void
}


class AvatarEditor {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    avatarInput: HTMLInputElement

    mask: Mask
    image: HTMLImageElement

    l: string
    placeholder: string
    scaleFactor: number

    isDragging = false
    startDragX = 0
    startDragY = 0

    imageX = 0
    imageY = 0
    imageScale = 1

    constructor(canvas: HTMLCanvasElement, settings = {}) {
        const options = {
            scaleFactor: 1.1,
            maskW: 200,
            maskH: 200,
            maskStrokeWidth: 1,
            maskStrokeColor: '#ccc',
            maskOverflow: 'rgba(0, 0, 0, 0.6)',
            placeholder: "Выберите изображение двойным кликом",
            mask: '',
            ...settings
        }

        this.canvas = canvas
        this.ctx = canvas.getContext('2d')

        this.scaleFactor = options.scaleFactor

        this.setupCanvas()
        this.setupEvents()

        if (options.mask) {
            const tempCanvas = document.createElement('canvas')

            this.mask = {
                image: new Image(),
                w: options.maskW,
                h: options.maskH,
                overflow: options.maskOverflow as Color,
                stroke: () => {
                    const dx = (this.canvas.width - tempCanvas.width) / 2
                    const dy = (this.canvas.height - tempCanvas.height) / 2

                    this.ctx.drawImage(tempCanvas, dx, dy)
                }
            }

            this.mask.image.onload = () => {
                const tempCtx = tempCanvas.getContext('2d')

                const lineW = options.maskStrokeWidth

                tempCanvas.width = this.mask.w + lineW * 2
                tempCanvas.height = this.mask.h + lineW * 2

                tempCtx.fillStyle = options.maskStrokeColor

                tempCtx.drawImage(this.mask.image, 0, 0, tempCanvas.width, tempCanvas.height)
                tempCtx.globalCompositeOperation = 'destination-out'
                tempCtx.drawImage(
                    this.mask.image,
                    lineW,
                    lineW,
                    tempCanvas.width - lineW * 2,
                    tempCanvas.height - lineW * 2)
                tempCtx.globalCompositeOperation = 'source-in'
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

                this.mask.stroke()
            }

            this.mask.image.src = options.mask
        }

        this.placeholder = options.placeholder
        this.drawTextCentered(this.placeholder, {color: "white"})
    }

    setupCanvas() {
        const editorContainer = document.createElement('div')
        editorContainer.classList.add('avatar-editor')

        this.canvas.parentNode.replaceChild(editorContainer, this.canvas)

        editorContainer.appendChild(this.canvas)

        this.avatarInput = document.createElement('input')
        this.avatarInput.type = 'file'
    }

    setupEvents() {
        this.canvas.addEventListener('dblclick', () => {
            this.avatarInput.click()
        })

        this.avatarInput.addEventListener('change', (e) => {
            const file = (<HTMLInputElement>e.target).files[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    this.image = new Image()
                    this.image.onload = () => {
                        this.render()
                    }

                    this.image.src = e.target.result as string

                    this.imageX = 0
                    this.imageY = 0
                    this.imageScale = 1
                }
                reader.readAsDataURL(file)
            }
        })

        // Начало перетаскивания
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true
            this.startDragX = e.clientX
            this.startDragY = e.clientY
        })

        // Конец перетаскивания
        document.addEventListener('mouseup', () => {
            this.isDragging = false
        })

        // Перетаскивание изображения
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.startDragX
                const dy = e.clientY - this.startDragY

                this.imageX += dx
                this.imageY += dy

                this.startDragX = e.clientX
                this.startDragY = e.clientY

                this.render()
            }
        })

        // Масштабирование изображения
        this.canvas.addEventListener('wheel', (e) => {

            const scaleFactor = e.deltaY > 0 ? 1 / this.scaleFactor : this.scaleFactor // Фактор масштабирования

            const rect = this.canvas.getBoundingClientRect()

            // Получаем координаты курсора
            const cursorX = e.clientX - rect.left
            const cursorY = e.clientY - rect.top

            this.imageScale *= scaleFactor

            // Определяем новое положение изображения
            this.imageX = cursorX - (cursorX - this.imageX) * scaleFactor
            this.imageY = cursorY - (cursorY - this.imageY) * scaleFactor

            this.render()
        })
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        if (!this.image) {
            this.mask.stroke()
            this.drawTextCentered(this.placeholder, {color: "red"})
            return
        }

        const drawImage = () => {
            this.ctx.drawImage(
                this.image,
                this.imageX,
                this.imageY,
                this.image.width * this.imageScale,
                this.image.height * this.imageScale
            )
        }

        drawImage()

        // Если есть маска
        if (this.mask.image) {
            this.ctx.save()

            // Обрезаем изображение с помощью маски
            this.ctx.globalCompositeOperation = 'destination-in'

            const dx = (this.canvas.width - this.mask.w) / 2
            const dy = (this.canvas.height - this.mask.h) / 2

            this.ctx.drawImage(this.mask.image, dx, dy, this.mask.w, this.mask.h)

            // Рисуем затемнение и затемнённое изображение
            this.ctx.globalCompositeOperation = 'destination-over'

            this.ctx.fillStyle = this.mask.overflow
            this.ctx.fillRect(
                this.imageX,
                this.imageY,
                this.image.width * this.imageScale,
                this.image.height * this.imageScale
            )


            drawImage()

            this.ctx.restore()

            this.mask.stroke()
        }
    }

    exportImage() {
        if (!this.mask.image) {
            return this.canvas.toDataURL('image/png')
        }

        const exportCanvas = document.createElement('canvas')
        const exportCtx = exportCanvas.getContext('2d')
        exportCanvas.width = this.mask.w
        exportCanvas.height = this.mask.h

        const dx = (this.canvas.width - this.mask.w) / 2
        const dy = (this.canvas.height - this.mask.h) / 2

        exportCtx.drawImage(
            this.image,
            this.imageX - dx,
            this.imageY - dy,
            this.image.width * this.imageScale,
            this.image.height * this.imageScale
        )

        return exportCanvas.toDataURL('image/png')
    }

    drawTextCentered(text, options = {}) {
        const style = {
            font: '18px Open Sans',
            color: 'black',
            width: "mask",
            canvasPadding: 20,
            ...options
        }

        let maxWidth = ((style.width === "mask" && this.mask.image) ? this.mask.w : this.canvas.width) - 2 * style.canvasPadding

        this.ctx.save()

        const centerX = this.canvas.width / 2
        const centerY = this.canvas.height / 2

        this.ctx.font = style.font
        this.ctx.fillStyle = style.color
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'

        this.wrapText(text, centerX, centerY, maxWidth)

        this.ctx.restore()
    }

    wrapText(text, x, y, maxWidth, lineHeight = 1.2) {
        let words = text.split(' ')
        let line = ''
        let offsetY = 0
        let fontHeight

        const lines = []

        for (let i = 0; i <= words.length; i++) {
            let testLine = line + words[i] + ' '
            let metrics = this.ctx.measureText(testLine)
            let testWidth = metrics.width
            fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent

            if (testWidth > maxWidth && i > 0) {
                lines.push({
                    text: line,
                    y: y + offsetY
                })
                line = words[i] + ' '
                offsetY += fontHeight * lineHeight
            } else {
                line = testLine
            }
        }

        lines.forEach((value) => {
            if (this.ctx.textBaseline === 'middle') value.y = value.y - (offsetY - fontHeight * lineHeight) / 2
            this.ctx.fillText(value.text, x, value.y)
        })
    }
}
