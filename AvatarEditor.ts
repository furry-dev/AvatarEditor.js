/**
 * Строка представляющая цвет в формате RGB.
 */
type RGB = `rgb(${number}, ${number}, ${number})`
/**
 * Строка представляющая цвет в формате RGBA.
 */
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`
/**
 * Строка представляющая цвет в формате HEX.
 */
type HEX = `#${string}`

/**
 * Тип для представления цвета.
 */
type Color = RGB | RGBA | HEX


/**
 * @interface Mask - Интерфейс для маски аватара.
 * @property {HTMLImageElement} image - Элемент HTMLImageElement для маски.
 * @property {number} w - Ширина маски.
 * @property {number} h - Высота маски.
 * @property {Color} overflow - Цвет, представляющий затемнение изображения вне маски.
 * @property {Function} stroke - Метод для отображения обводки маски.
 */
interface Mask {
    image: HTMLImageElement,
    w: number,
    h: number,
    overflow: Color,
    stroke: () => void
}

/**
 * @interface Options - Интерфейс для параметров конфигурации AvatarEditor.
 * @property {number} scaleFactor - Множитель масштабирования.
 * @property {number} maskW - Ширина маски.
 * @property {number} maskH - Высота маски.
 * @property {number} maskStrokeWidth - Ширина обводки маски.
 * @property {string} maskStrokeColor - Цвет обводки маски.
 * @property {string} maskOverflow - Цвет затемнения маски.
 * @property {string} placeholder - Текст-заглушка.
 * @property {string} [mask] - Путь к изображению для использования в качестве маски.
 */
interface Options {
    scaleFactor: number,
    maskW: number,
    maskH: number,
    maskStrokeWidth: number,
    maskStrokeColor: Color,
    maskOverflow: Color,
    placeholder: string,
    mask?: string
}

interface FontStyle {
    font: string,
    color: string,
    width: string,
    canvasPadding: number
}

/**
 * @class AvatarEditor - Класс создающий редактор аватара.
 */
class AvatarEditor {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    avatarInput: HTMLInputElement

    mask: Partial<Mask> = {}
    image: HTMLImageElement

    placeholder: string
    scaleFactor: number

    isDragging = false
    private startDragX = 0
    private startDragY = 0
    isPinching = false
    private initialPinchDistance = 0

    private lastTap: number
    private lastGestureTime: number = 0
    gestureTimeout: number = 300

    imageX = 0
    imageY = 0
    imageScale = 1

    constructor(canvas: HTMLCanvasElement, settings: object = {}) {
        const options: Options = {
            scaleFactor: 1.1,
            maskW: 200,
            maskH: 200,
            maskStrokeWidth: 1,
            maskStrokeColor: '#ccc',
            maskOverflow: 'rgba(0, 0, 0, 0.6)',
            placeholder: "Выберите изображение двойным кликом",
            ...settings
        }

        this.canvas = canvas
        this.ctx = canvas.getContext('2d')

        this.scaleFactor = options.scaleFactor

        this.setupCanvas()
        this.setupEvents()

        if (options.mask) {
            this.setupMask(options.mask, options.maskW, options.maskH, options.maskStrokeWidth, options.maskStrokeColor, options.maskOverflow)
        }

        this.placeholder = options.placeholder
        this.drawTextCentered(this.placeholder, {color: "white"})
    }

    /**
     * Настраивает элемент canvas и добавляет его в контейнер.
     * @private
     */
    private setupCanvas() {
        const editorContainer = document.createElement('div')
        editorContainer.classList.add('avatar-editor')

        this.canvas.parentNode.replaceChild(editorContainer, this.canvas)

        editorContainer.appendChild(this.canvas)

        this.avatarInput = document.createElement('input')
        this.avatarInput.type = 'file'
        this.avatarInput.accept = "image/*"
    }

    /**
     * Настраивает обработчики событий.
     * @private
     */
    private setupEvents() {
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

        const stopMoving = () => {
          this.isDragging = false
        }

        // Конец перетаскивания
        document.addEventListener('mouseup', stopMoving)
        document.addEventListener('mouseout', stopMoving)
        document.addEventListener('mouseleave', stopMoving)

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
            e.preventDefault()

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

        // Начало перетаскивания пальцами
        this.canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0]
            const touchCount = e.touches.length
            if (touchCount === 1) {
                this.startDragX = touch.clientX
                this.startDragY = touch.clientY
            } else if (touchCount === 2) {
                this.isPinching = true
                this.initialPinchDistance = this.calculatePinchDistance(e.touches[0], e.touches[1])
            }
        })

        // Перетаскивание и масштабирование пальцами
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault()
            const touchCount = e.touches.length

            if (touchCount === 1 && !this.isPinching) {
                // Логика перемещения с одним пальцем
                const touch = e.touches[0]

                // Рассчитываем вектор перемещения
                const deltaX = touch.clientX - this.startDragX
                const deltaY = touch.clientY - this.startDragY

                // Обновляем положение изображения
                this.imageX += deltaX
                this.imageY += deltaY

                this.render()

                // Сохраняем текущие координаты для следующего кадра
                this.startDragX = touch.clientX
                this.startDragY = touch.clientY

                // Сохраняем время последнего жеста
                this.lastGestureTime = new Date().getTime()
            } else if (touchCount === 2 && this.isPinching) {
                const currentPinchDistance = this.calculatePinchDistance(e.touches[0], e.touches[1])
                const scaleFactor = currentPinchDistance / this.initialPinchDistance

                const [centerX, centerY] = this.getTouchesCenter(e.touches[0], e.touches[1])

                // Рассчитываем новый масштаб и положение
                this.imageScale *= scaleFactor

                // Определяем новое положение изображения
                this.imageX = centerX - (centerX - this.imageX) * scaleFactor
                this.imageY = centerY - (centerY - this.imageY) * scaleFactor

                this.render()

                // Сохраните текущее расстояние для следующего кадра
                this.initialPinchDistance = currentPinchDistance

                // Сохраняем время последнего жеста
                this.lastGestureTime = new Date().getTime()
            }
        })

        const stopTouchMoving = (currentTime: number) => {
            this.isPinching = false
            this.lastTap = currentTime
        }

        // Конец перетаскивания пальцами или определение двойного касания
        this.canvas.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime()
            const tapLength = currentTime - this.lastTap
            const gestureTimeout = currentTime - this.lastGestureTime

            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault()
                if (!this.isPinching && gestureTimeout > this.gestureTimeout) this.avatarInput.click()
            } else {
                stopTouchMoving(currentTime)
            }
        })

        this.canvas.addEventListener('touchend', () => {
            stopTouchMoving(new Date().getTime())
        })
    }

    /**
     * Настраивает маску для редактора аватара.
     * @param {string} maskPath - Путь к изображению маски.
     * @param {number} maskWidth - Ширина маски.
     * @param {number} maskHeight - Высота маски.
     * @param {number} maskStrokeWidth - Ширина обводки маски.
     * @param {Color} maskStrokeColor - Цвет обводки маски.
     * @param {Color} maskOverflow - Цвет затемнения маски.
     * @private
     */
    private setupMask(maskPath: string, maskWidth: number, maskHeight: number, maskStrokeWidth: number, maskStrokeColor: Color, maskOverflow: Color) {
        this.mask.image = new Image()
        this.mask.w = maskWidth
        this.mask.h = maskHeight
        this.mask.overflow = maskOverflow

        const tempCanvas: HTMLCanvasElement = document.createElement('canvas')
        const tempCtx: CanvasRenderingContext2D = tempCanvas.getContext('2d')

        const lineW = maskStrokeWidth

        tempCanvas.width = this.mask.w + lineW * 2
        tempCanvas.height = this.mask.h + lineW * 2

        tempCtx.fillStyle = maskStrokeColor

        this.mask.stroke = () => {
            const [dx, dy] = this.getDrawCenterCoords(
                this.canvas.width,
                this.canvas.height,
                tempCanvas.width,
                tempCanvas.height
            )

            this.ctx.drawImage(tempCanvas, dx, dy)
        };

        this.mask.image.onload = () => {
            tempCtx.drawImage(this.mask.image, 0, 0, tempCanvas.width, tempCanvas.height)
            tempCtx.globalCompositeOperation = 'destination-out'
            tempCtx.drawImage(
                this.mask.image,
                lineW,
                lineW,
                tempCanvas.width - lineW * 2,
                tempCanvas.height - lineW * 2,
            );
            tempCtx.globalCompositeOperation = 'source-in'
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height)

            this.mask.stroke()
        };

        this.mask.image.src = maskPath
    }

    /**
     * Обновляет изображение в редакторе.
     */
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

            const [dx, dy] = this.getDrawCenterCoords(this.canvas.width, this.canvas.height, this.mask.w, this.mask.h)

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

    /**
     * Экспортирует текущее изображение из редактора в указанный формат.
     * @param {("png"|"jpeg"|"bmp"|"webp")} format - Формат экспорта: "png", "jpeg", "bmp" или "webp".
     * @param {number} [quality=1] - Качество изображения (для формата "jpeg" или "webp"). Должно быть в диапазоне от 0 до 1.
     * @returns {string|false} - Строка, представляющая изображение в указанном формате, или false, если изображение отсутствует.
     */
    exportImage(format: "png" | "jpeg" | "bmp" | "webp", quality: number = 1.0): string | false {
        if (!this.image) return false

        if (!this.mask.image) {
            return this.canvas.toDataURL('image/png')
        }

        const exportCanvas = document.createElement('canvas')
        const exportCtx = exportCanvas.getContext('2d')
        exportCanvas.width = this.mask.w
        exportCanvas.height = this.mask.h

        const [dx, dy] = this.getDrawCenterCoords(this.canvas.width, this.canvas.height, this.mask.w, this.mask.h)

        exportCtx.drawImage(
            this.image,
            this.imageX - dx,
            this.imageY - dy,
            this.image.width * this.imageScale,
            this.image.height * this.imageScale
        )

        return exportCanvas.toDataURL(`image/${format}`, quality)
    }

    /**
     * Отрисовывает текст в центре canvas.
     * @param {string} text - Текст для отрисовки.
     * @param {object} [options={}] - Дополнительные параметры для отрисовки текста.
     */
    drawTextCentered(text: string, options: object = {}) {
        const style: FontStyle = {
            font: '18px Open Sans',
            color: 'black',
            width: "mask",
            canvasPadding: 20,
            ...options
        }

        let maxWidth = ((style.width === "mask" && this.mask.image) ? this.mask.w : this.canvas.width) - 2 * style.canvasPadding

        this.ctx.save()

        const [centerX, centerY] = this.getCanvasCenter(this.canvas)

        this.ctx.font = style.font
        this.ctx.fillStyle = style.color
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'

        this.wrapText(text, centerX, centerY, maxWidth)

        this.ctx.restore()
    }

    /**
     * Рисует текст автоматически перенося его на новую строку, если он вылез за пределы maxWidth.
     * @param {string} text - Текст для отрисовки.
     * @param {number} x - Координата x.
     * @param {number} y - Координата y.
     * @param {number} maxWidth - Максимальная ширина текста.
     * @param {number} [lineHeight=1.2] - Межстрочный интервал.
     */
    wrapText(text: string, x: number, y: number, maxWidth: number, lineHeight: number = 1.2) {
        let words = text.split(' ')
        let line = ''
        let offsetY = 0
        let fontHeight: number

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

    /**
     * Вычисляет расстояние между двумя касаниями.
     * @private
     * @param {Touch} touch1 - Первый палец.
     * @param {Touch} touch2 - Второй палец.
     * @returns {number} - Расстояние между двумя касаниями.
     */
    private calculatePinchDistance(touch1: Touch, touch2: Touch): number {
        const dx = touch2.clientX - touch1.clientX
        const dy = touch2.clientY - touch1.clientY
        return Math.sqrt(dx * dx + dy * dy)
    }

    /**
     * Вычисляет координаты средней точки между двумя касаниями.
     * @private
     * @param {Touch} touch1 - Первый палец.
     * @param {Touch} touch2 - Второй палец.
     * @returns {number[]} - Расстояние между двумя касаниями.
     */
    private getTouchesCenter(touch1: Touch, touch2: Touch): number[] {
        const centerX = (touch1.clientX + touch2.clientX) / 2
        const centerY = (touch1.clientY + touch2.clientY) / 2

        return [centerX, centerY]
    }

    /**
     * Вычисляет координаты для отрисоки элемента по центру.
     * @private
     * @param {number} canvasWidth - Ширина холста.
     * @param {number} canvasHeight - Высота холста.
     * @param {number} objectWidth - Ширина объекта.
     * @param {number} objectHeight - Высота объекта.
     * @returns {number[]} - Координаты для отрисовки элемента.
     */
    private getDrawCenterCoords(canvasWidth: number, canvasHeight: number, objectWidth: number, objectHeight: number): number[] {
        const dx = (canvasWidth - objectWidth) / 2
        const dy = (canvasHeight - objectHeight) / 2

        return [dx, dy]
    }

    /**
     * Возвращает координаты центра холста.
     * @private
     * @param {HTMLCanvasElement} canvas - Объект холста.
     * @returns {number[]} - Координаты центра canvas.
     */
    private getCanvasCenter(canvas: HTMLCanvasElement): number[] {
        return [canvas.width / 2, canvas.height / 2]
    }
}
