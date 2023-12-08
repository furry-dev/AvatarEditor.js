[Go back( Назад )](README.md)

# Avatar Editor

`AvatarEditor` is a JavaScript class for creating an interactive avatar editor with support for image scaling, dragging, and masking.

## Installation

Include the `AvatarEditor` class in your project.

## Usage

### Initialization

```javascript
const canvas = document.getElementById('avatarCanvas')
const editor = new AvatarEditor(canvas, {
  scaleFactor: 1.1,
  maskW: 200,
  maskH: 200,
  maskStrokeWidth: 1,
  maskStrokeColor: '#ccc',
  maskOverflow: 'rgba(0, 0, 0, 0.6)',
  placeholder: "Choose an image by double-clicking",
  mask: "path/to/mask.png"
})
```

Settings (Optional)

When initializing the AvatarEditor, you can provide an optional settings object with the following properties:

* `scaleFactor` (default: `1.1`): The multiplier for image scaling when zooming in or out.
* `maskW` (default: `200`): The width of the mask.
* `maskH` (default: `200`): The height of the mask.
* `maskStrokeWidth` (default: `1`): The width of the stroke (border) around the mask.
* `maskStrokeColor` (default: `'#ccc'`): The color of the stroke around the mask. Accepts `RGB`, `RGBA` or `HEX`.
* `maskOverflow` (default: `'rgba(0, 0, 0, 0.6)'`): The color representing the darkened area outside the mask. Accepts `RGB`, `RGBA` or `HEX`.
* `placeholder` (default: `"Выберите изображение двойным кликом"`): The text displayed as a placeholder when no image is present.
* `mask` (default: `undefined`): The path to the image used as the mask. (If not specified, the mask will not be used)

## Methods
`exportImage(format, quality)`

Exports the current image in the editor to the specified format. If a mask is used, the image inside the mask is exported; if the mask is not selected, the entire image inside the canvas is exported.

* Parameters:
    * `format`: One of `"png"`, `"jpeg"`, `"bmp"` or `"webp"`.
    * `quality`: (optional): Quality of the image (for `"jpeg"` or `"webp"`). Should be in the range of `0` to `1`.

* Returns:
    * A data URL string representing the image in the specified format, or false if no image is present.

## Events

The editor supports the following events:

* `dblclick`: Double-click to trigger file input for selecting an image.
* `mousedown`, `mouseup`, `mousemove`: Used for dragging the image within the canvas.
* `wheel`: Used for zooming in and out.
* `touchstart`, `touchmove`, `touchend`: Supports touch gestures for dragging and zooming.

## License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.
