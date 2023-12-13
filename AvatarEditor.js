var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
/**
 * @class AvatarEditor - Класс создающий редактор аватара.
 */
var AvatarEditor = /** @class */ (function () {
    function AvatarEditor(canvas, settings) {
        if (settings === void 0) { settings = {}; }
        this.mask = {};
        this.isDragging = false;
        this.startDragX = 0;
        this.startDragY = 0;
        this.isPinching = false;
        this.initialPinchDistance = 0;
        this.lastGestureTime = 0;
        this.gestureTimeout = 300;
        this.imageX = 0;
        this.imageY = 0;
        this.imageScale = 1;
        var options = __assign({ scaleFactor: 1.1, maskW: 200, maskH: 200, maskStrokeWidth: 1, maskStrokeColor: '#ccc', maskOverflow: 'rgba(0, 0, 0, 0.6)', placeholder: "Выберите изображение двойным кликом" }, settings);
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scaleFactor = options.scaleFactor;
        this.setupCanvas();
        this.setupEvents();
        if (options.mask) {
            this.setupMask(options.mask, options.maskW, options.maskH, options.maskStrokeWidth, options.maskStrokeColor, options.maskOverflow);
        }
        this.placeholder = options.placeholder;
        this.drawTextCentered(this.placeholder, { color: "white" });
    }
    /**
     * Настраивает элемент canvas и добавляет его в контейнер.
     * @private
     */
    AvatarEditor.prototype.setupCanvas = function () {
        var editorContainer = document.createElement('div');
        editorContainer.classList.add('avatar-editor');
        this.canvas.parentNode.replaceChild(editorContainer, this.canvas);
        editorContainer.appendChild(this.canvas);
        this.avatarInput = document.createElement('input');
        this.avatarInput.type = 'file';
        this.avatarInput.accept = "image/*";
    };
    /**
     * Настраивает обработчики событий.
     * @private
     */
    AvatarEditor.prototype.setupEvents = function () {
        var _this = this;
        this.canvas.addEventListener('dblclick', function () {
            _this.avatarInput.click();
        });
        this.avatarInput.addEventListener('change', function (e) {
            var file = e.target.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    _this.image = new Image();
                    _this.image.onload = function () {
                        _this.render();
                    };
                    _this.image.src = e.target.result;
                    _this.imageX = 0;
                    _this.imageY = 0;
                    _this.imageScale = 1;
                };
                reader.readAsDataURL(file);
            }
        });
        // Начало перетаскивания
        this.canvas.addEventListener('mousedown', function (e) {
            _this.isDragging = true;
            _this.startDragX = e.clientX;
            _this.startDragY = e.clientY;
        });
        var stopMoving = function () {
            _this.isDragging = false;
        };
        // Конец перетаскивания
        document.addEventListener('mouseup', stopMoving);
        document.addEventListener('mouseout', stopMoving);
        document.addEventListener('mouseleave', stopMoving);
        // Перетаскивание изображения
        this.canvas.addEventListener('mousemove', function (e) {
            if (_this.isDragging) {
                var dx = e.clientX - _this.startDragX;
                var dy = e.clientY - _this.startDragY;
                _this.imageX += dx;
                _this.imageY += dy;
                _this.startDragX = e.clientX;
                _this.startDragY = e.clientY;
                _this.render();
            }
        });
        // Масштабирование изображения
        this.canvas.addEventListener('wheel', function (e) {
            e.preventDefault();
            var scaleFactor = e.deltaY > 0 ? 1 / _this.scaleFactor : _this.scaleFactor; // Фактор масштабирования
            var rect = _this.canvas.getBoundingClientRect();
            // Получаем координаты курсора
            var cursorX = e.clientX - rect.left;
            var cursorY = e.clientY - rect.top;
            _this.imageScale *= scaleFactor;
            // Определяем новое положение изображения
            _this.imageX = cursorX - (cursorX - _this.imageX) * scaleFactor;
            _this.imageY = cursorY - (cursorY - _this.imageY) * scaleFactor;
            _this.render();
        });
        // Начало перетаскивания пальцами
        this.canvas.addEventListener('touchstart', function (e) {
            var touch = e.touches[0];
            var touchCount = e.touches.length;
            if (touchCount === 1) {
                _this.startDragX = touch.clientX;
                _this.startDragY = touch.clientY;
            }
            else if (touchCount === 2) {
                _this.isPinching = true;
                _this.initialPinchDistance = _this.calculatePinchDistance(e.touches[0], e.touches[1]);
            }
        });
        // Перетаскивание и масштабирование пальцами
        this.canvas.addEventListener('touchmove', function (e) {
            e.preventDefault();
            var touchCount = e.touches.length;
            if (touchCount === 1 && !_this.isPinching) {
                // Логика перемещения с одним пальцем
                var touch = e.touches[0];
                // Рассчитываем вектор перемещения
                var deltaX = touch.clientX - _this.startDragX;
                var deltaY = touch.clientY - _this.startDragY;
                // Обновляем положение изображения
                _this.imageX += deltaX;
                _this.imageY += deltaY;
                _this.render();
                // Сохраняем текущие координаты для следующего кадра
                _this.startDragX = touch.clientX;
                _this.startDragY = touch.clientY;
                // Сохраняем время последнего жеста
                _this.lastGestureTime = new Date().getTime();
            }
            else if (touchCount === 2 && _this.isPinching) {
                var currentPinchDistance = _this.calculatePinchDistance(e.touches[0], e.touches[1]);
                var scaleFactor = currentPinchDistance / _this.initialPinchDistance;
                var _a = _this.getTouchesCenter(e.touches[0], e.touches[1]), centerX = _a[0], centerY = _a[1];
                // Рассчитываем новый масштаб и положение
                _this.imageScale *= scaleFactor;
                // Определяем новое положение изображения
                _this.imageX = centerX - (centerX - _this.imageX) * scaleFactor;
                _this.imageY = centerY - (centerY - _this.imageY) * scaleFactor;
                _this.render();
                // Сохраните текущее расстояние для следующего кадра
                _this.initialPinchDistance = currentPinchDistance;
                // Сохраняем время последнего жеста
                _this.lastGestureTime = new Date().getTime();
            }
        });
        var stopTouchMoving = function (currentTime) {
            _this.isPinching = false;
            _this.lastTap = currentTime;
        };
        // Конец перетаскивания пальцами или определение двойного касания
        this.canvas.addEventListener('touchend', function (e) {
            var currentTime = new Date().getTime();
            var tapLength = currentTime - _this.lastTap;
            var gestureTimeout = currentTime - _this.lastGestureTime;
            if (tapLength < 500 && tapLength > 0) {
                e.preventDefault();
                if (!_this.isPinching && gestureTimeout > _this.gestureTimeout)
                    _this.avatarInput.click();
            }
            else {
                stopTouchMoving(currentTime);
            }
        });
        this.canvas.addEventListener('touchend', function () {
            stopTouchMoving(new Date().getTime());
        });
    };
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
    AvatarEditor.prototype.setupMask = function (maskPath, maskWidth, maskHeight, maskStrokeWidth, maskStrokeColor, maskOverflow) {
        var _this = this;
        this.mask.image = new Image();
        this.mask.w = maskWidth;
        this.mask.h = maskHeight;
        this.mask.overflow = maskOverflow;
        var tempCanvas = document.createElement('canvas');
        var tempCtx = tempCanvas.getContext('2d');
        var lineW = maskStrokeWidth;
        tempCanvas.width = this.mask.w + lineW * 2;
        tempCanvas.height = this.mask.h + lineW * 2;
        tempCtx.fillStyle = maskStrokeColor;
        this.mask.stroke = function () {
            var _a = _this.getDrawCenterCoords(_this.canvas.width, _this.canvas.height, tempCanvas.width, tempCanvas.height), dx = _a[0], dy = _a[1];
            _this.ctx.drawImage(tempCanvas, dx, dy);
        };
        this.mask.image.onload = function () {
            tempCtx.drawImage(_this.mask.image, 0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.globalCompositeOperation = 'destination-out';
            tempCtx.drawImage(_this.mask.image, lineW, lineW, tempCanvas.width - lineW * 2, tempCanvas.height - lineW * 2);
            tempCtx.globalCompositeOperation = 'source-in';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            _this.mask.stroke();
        };
        this.mask.image.src = maskPath;
    };
    /**
     * Обновляет изображение в редакторе.
     */
    AvatarEditor.prototype.render = function () {
        var _this = this;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (!this.image) {
            this.mask.stroke();
            this.drawTextCentered(this.placeholder, { color: "red" });
            return;
        }
        var drawImage = function () {
            _this.ctx.drawImage(_this.image, _this.imageX, _this.imageY, _this.image.width * _this.imageScale, _this.image.height * _this.imageScale);
        };
        drawImage();
        // Если есть маска
        if (this.mask.image) {
            this.ctx.save();
            // Обрезаем изображение с помощью маски
            this.ctx.globalCompositeOperation = 'destination-in';
            var _a = this.getDrawCenterCoords(this.canvas.width, this.canvas.height, this.mask.w, this.mask.h), dx = _a[0], dy = _a[1];
            this.ctx.drawImage(this.mask.image, dx, dy, this.mask.w, this.mask.h);
            // Рисуем затемнение и затемнённое изображение
            this.ctx.globalCompositeOperation = 'destination-over';
            this.ctx.fillStyle = this.mask.overflow;
            this.ctx.fillRect(this.imageX, this.imageY, this.image.width * this.imageScale, this.image.height * this.imageScale);
            drawImage();
            this.ctx.restore();
            this.mask.stroke();
        }
    };
    /**
     * Экспортирует текущее изображение из редактора в указанный формат.
     * @param {("png"|"jpeg"|"bmp"|"webp")} format - Формат экспорта: "png", "jpeg", "bmp" или "webp".
     * @param {number} [quality=1] - Качество изображения (для формата "jpeg" или "webp"). Должно быть в диапазоне от 0 до 1.
     * @returns {string|false} - Строка, представляющая изображение в указанном формате, или false, если изображение отсутствует.
     */
    AvatarEditor.prototype.exportImage = function (format, quality) {
        if (quality === void 0) { quality = 1.0; }
        if (!this.image)
            return false;
        if (!this.mask.image) {
            return this.canvas.toDataURL('image/png');
        }
        var exportCanvas = document.createElement('canvas');
        var exportCtx = exportCanvas.getContext('2d');
        exportCanvas.width = this.mask.w;
        exportCanvas.height = this.mask.h;
        var _a = this.getDrawCenterCoords(this.canvas.width, this.canvas.height, this.mask.w, this.mask.h), dx = _a[0], dy = _a[1];
        exportCtx.drawImage(this.image, this.imageX - dx, this.imageY - dy, this.image.width * this.imageScale, this.image.height * this.imageScale);
        return exportCanvas.toDataURL("image/".concat(format), quality);
    };
    /**
     * Отрисовывает текст в центре canvas.
     * @param {string} text - Текст для отрисовки.
     * @param {object} [options={}] - Дополнительные параметры для отрисовки текста.
     */
    AvatarEditor.prototype.drawTextCentered = function (text, options) {
        if (options === void 0) { options = {}; }
        var style = __assign({ font: '18px Open Sans', color: 'black', width: "mask", canvasPadding: 20 }, options);
        var maxWidth = ((style.width === "mask" && this.mask.image) ? this.mask.w : this.canvas.width) - 2 * style.canvasPadding;
        this.ctx.save();
        var _a = this.getCanvasCenter(this.canvas), centerX = _a[0], centerY = _a[1];
        this.ctx.font = style.font;
        this.ctx.fillStyle = style.color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.wrapText(text, centerX, centerY, maxWidth);
        this.ctx.restore();
    };
    /**
     * Рисует текст автоматически перенося его на новую строку, если он вылез за пределы maxWidth.
     * @param {string} text - Текст для отрисовки.
     * @param {number} x - Координата x.
     * @param {number} y - Координата y.
     * @param {number} maxWidth - Максимальная ширина текста.
     * @param {number} [lineHeight=1.2] - Межстрочный интервал.
     */
    AvatarEditor.prototype.wrapText = function (text, x, y, maxWidth, lineHeight) {
        var _this = this;
        if (lineHeight === void 0) { lineHeight = 1.2; }
        var words = text.split(' ');
        var line = '';
        var offsetY = 0;
        var fontHeight;
        var lines = [];
        for (var i = 0; i <= words.length; i++) {
            var testLine = line + words[i] + ' ';
            var metrics = this.ctx.measureText(testLine);
            var testWidth = metrics.width;
            fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
            if (testWidth > maxWidth && i > 0) {
                lines.push({
                    text: line,
                    y: y + offsetY
                });
                line = words[i] + ' ';
                offsetY += fontHeight * lineHeight;
            }
            else {
                line = testLine;
            }
        }
        lines.forEach(function (value) {
            if (_this.ctx.textBaseline === 'middle')
                value.y = value.y - (offsetY - fontHeight * lineHeight) / 2;
            _this.ctx.fillText(value.text, x, value.y);
        });
    };
    /**
     * Вычисляет расстояние между двумя касаниями.
     * @private
     * @param {Touch} touch1 - Первый палец.
     * @param {Touch} touch2 - Второй палец.
     * @returns {number} - Расстояние между двумя касаниями.
     */
    AvatarEditor.prototype.calculatePinchDistance = function (touch1, touch2) {
        var dx = touch2.clientX - touch1.clientX;
        var dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };
    /**
     * Вычисляет координаты средней точки между двумя касаниями.
     * @private
     * @param {Touch} touch1 - Первый палец.
     * @param {Touch} touch2 - Второй палец.
     * @returns {number[]} - Расстояние между двумя касаниями.
     */
    AvatarEditor.prototype.getTouchesCenter = function (touch1, touch2) {
        var centerX = (touch1.clientX + touch2.clientX) / 2;
        var centerY = (touch1.clientY + touch2.clientY) / 2;
        return [centerX, centerY];
    };
    /**
     * Вычисляет координаты для отрисоки элемента по центру.
     * @private
     * @param {number} canvasWidth - Ширина холста.
     * @param {number} canvasHeight - Высота холста.
     * @param {number} objectWidth - Ширина объекта.
     * @param {number} objectHeight - Высота объекта.
     * @returns {number[]} - Координаты для отрисовки элемента.
     */
    AvatarEditor.prototype.getDrawCenterCoords = function (canvasWidth, canvasHeight, objectWidth, objectHeight) {
        var dx = (canvasWidth - objectWidth) / 2;
        var dy = (canvasHeight - objectHeight) / 2;
        return [dx, dy];
    };
    /**
     * Возвращает координаты центра холста.
     * @private
     * @param {HTMLCanvasElement} canvas - Объект холста.
     * @returns {number[]} - Координаты центра canvas.
     */
    AvatarEditor.prototype.getCanvasCenter = function (canvas) {
        return [canvas.width / 2, canvas.height / 2];
    };
    return AvatarEditor;
}());
//# sourceMappingURL=AvatarEditor.js.map