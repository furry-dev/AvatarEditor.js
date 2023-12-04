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
var AvatarEditor = /** @class */ (function () {
    function AvatarEditor(canvas, settings) {
        if (settings === void 0) { settings = {}; }
        var _this = this;
        this.isDragging = false;
        this.startDragX = 0;
        this.startDragY = 0;
        this.imageX = 0;
        this.imageY = 0;
        this.imageScale = 1;
        var options = __assign({ scaleFactor: 1.1, maskW: 200, maskH: 200, maskStrokeWidth: 1, maskStrokeColor: '#ccc', maskOverflow: 'rgba(0, 0, 0, 0.6)', placeholder: "Выберите изображение двойным кликом", mask: '' }, settings);
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scaleFactor = options.scaleFactor;
        this.setupCanvas();
        this.setupEvents();
        if (options.mask) {
            var tempCanvas_1 = document.createElement('canvas');
            this.mask = {
                image: new Image(),
                w: options.maskW,
                h: options.maskH,
                overflow: options.maskOverflow,
                stroke: function () {
                    var dx = (_this.canvas.width - tempCanvas_1.width) / 2;
                    var dy = (_this.canvas.height - tempCanvas_1.height) / 2;
                    _this.ctx.drawImage(tempCanvas_1, dx, dy);
                }
            };
            this.mask.image.onload = function () {
                var tempCtx = tempCanvas_1.getContext('2d');
                var lineW = options.maskStrokeWidth;
                tempCanvas_1.width = _this.mask.w + lineW * 2;
                tempCanvas_1.height = _this.mask.h + lineW * 2;
                tempCtx.fillStyle = options.maskStrokeColor;
                tempCtx.drawImage(_this.mask.image, 0, 0, tempCanvas_1.width, tempCanvas_1.height);
                tempCtx.globalCompositeOperation = 'destination-out';
                tempCtx.drawImage(_this.mask.image, lineW, lineW, tempCanvas_1.width - lineW * 2, tempCanvas_1.height - lineW * 2);
                tempCtx.globalCompositeOperation = 'source-in';
                tempCtx.fillRect(0, 0, tempCanvas_1.width, tempCanvas_1.height);
                _this.mask.stroke();
            };
            this.mask.image.src = options.mask;
        }
        this.placeholder = options.placeholder;
        this.drawTextCentered(this.placeholder, { color: "white" });
    }
    AvatarEditor.prototype.setupCanvas = function () {
        var editorContainer = document.createElement('div');
        editorContainer.classList.add('avatar-editor');
        this.canvas.parentNode.replaceChild(editorContainer, this.canvas);
        editorContainer.appendChild(this.canvas);
        this.avatarInput = document.createElement('input');
        this.avatarInput.type = 'file';
    };
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
        // Конец перетаскивания
        document.addEventListener('mouseup', function () {
            _this.isDragging = false;
        });
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
    };
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
            var dx = (this.canvas.width - this.mask.w) / 2;
            var dy = (this.canvas.height - this.mask.h) / 2;
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
    AvatarEditor.prototype.exportImage = function () {
        if (!this.mask.image) {
            return this.canvas.toDataURL('image/png');
        }
        var exportCanvas = document.createElement('canvas');
        var exportCtx = exportCanvas.getContext('2d');
        exportCanvas.width = this.mask.w;
        exportCanvas.height = this.mask.h;
        var dx = (this.canvas.width - this.mask.w) / 2;
        var dy = (this.canvas.height - this.mask.h) / 2;
        exportCtx.drawImage(this.image, this.imageX - dx, this.imageY - dy, this.image.width * this.imageScale, this.image.height * this.imageScale);
        return exportCanvas.toDataURL('image/png');
    };
    AvatarEditor.prototype.drawTextCentered = function (text, options) {
        if (options === void 0) { options = {}; }
        var style = __assign({ font: '18px Open Sans', color: 'black', width: "mask", canvasPadding: 20 }, options);
        var maxWidth = ((style.width === "mask" && this.mask.image) ? this.mask.w : this.canvas.width) - 2 * style.canvasPadding;
        this.ctx.save();
        var centerX = this.canvas.width / 2;
        var centerY = this.canvas.height / 2;
        this.ctx.font = style.font;
        this.ctx.fillStyle = style.color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.wrapText(text, centerX, centerY, maxWidth);
        this.ctx.restore();
    };
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
    return AvatarEditor;
}());
//# sourceMappingURL=AvatarEditor.js.map