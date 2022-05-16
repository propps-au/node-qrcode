const Utils = require('./utils')
const { html } = require('common-tags')

/**
 * @remarks unmodified from svg-tag.js
 * 
 * @param {*} color : ;
 * @param {*} attrib 
 * @returns 
 */
function getColorAttrib (color, attrib) {
  const alpha = color.a / 255
  const str = attrib + '="' + color.hex + '"'

  return alpha < 1
    ? str + ' ' + attrib + '-opacity="' + alpha.toFixed(2).slice(1) + '"'
    : str
}

/**
 * @remarks unmodified from svg-tag.js
 * 
 * @param {*} cmd 
 * @param {*} x 
 * @param {*} y 
 * @returns 
 */
function svgCmd (cmd, x, y) {
  let str = cmd + x
  if (typeof y !== 'undefined') str += ' ' + y

  return str
}

/**
 * @remarks unmodified from svg-tag.js
 * 
 * @param {*} data 
 * @param {*} size 
 * @param {*} margin 
 * @returns 
 */
function qrToPath (data, size, margin) {
  let path = ''
  let moveBy = 0
  let newRow = false
  let lineLength = 0

  for (let i = 0; i < data.length; i++) {
    const col = Math.floor(i % size)
    const row = Math.floor(i / size)

    if (!col && !newRow) newRow = true

    if (data[i]) {
      lineLength++

      if (!(i > 0 && col > 0 && data[i - 1])) {
        path += newRow
          ? svgCmd('M', col + margin, 0.5 + row + margin)
          : svgCmd('m', moveBy, 0)

        moveBy = 0
        newRow = false
      }

      if (!(col + 1 < size && data[i + 1])) {
        path += svgCmd('h', lineLength)
        lineLength = 0
      }
    } else {
      moveBy++
    }
  }

  return path
}

/**
 * generates arbitrary bits for the branded header of the qr code
 * 
 * @param {number} len 
 * @param {string} [word] 
 * @returns number[]
 */
function bits(len, word = 'secret') {
  const filler = [...word].map(char => Array.from(((char.charCodeAt(0) ** 2) % 7).toString(2)).map(bit => parseInt(bit))).flat()

  let result = []

  while (result.length < len) {
    result = result.concat(filler)
  }

  return result.slice(0, len)
}

/**
 * zeroes out a square portion of the qr code
 * 
 * @param {number[]} data 
 * @param {number} size 
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 */
function zero(data, size, x1, y1, x2, y2) {
  const x1a = Math.min(x1, x2)
  const y1a = Math.min(y1, y2)
  const x2a = Math.max(x1, x2)
  const y2a = Math.max(y1, y2)

  for (let y = y1a; y < y2a; y++ ) {
    for (let x = x1a; x < x2a; x++) {
      const i = y * size + x
      if (i < data.length) {
        data[i] = 0
      }
    }
  }
}


exports.render = function render (qrData, options, cb) {
  const opts = Utils.getOptions(options)
  const size = qrData.modules.size
  const data = qrData.modules.data
  const qrcodesize = size + opts.margin * 2

  // modification: zero our square finders from qr code cells
  zero(data, size, 0, 0, 8, 8)
  zero(data, size, 0, size - 8, 8, size)
  zero(data, size, size - 8, 0, size, 8)


  const bg = !opts.color.light.a
    ? ''
    : '<path ' + getColorAttrib(opts.color.light, 'fill') +
      ' d="M0 0h' + qrcodesize + 'v' + qrcodesize + 'H0z"/>'

  const path =
    '<path ' + getColorAttrib(opts.color.dark, 'stroke') +
    ' d="' + qrToPath(data, size, opts.margin) + '"/>'


  // modification: add circular finders
  const finder = html`
    <path d="M3.5 5C4.32837 5 5 4.32812 5 3.5C5 2.67188 4.32837 2 3.5 2C2.67163 2 2 2.67188 2 3.5C2 4.32812 2.67163 5 3.5 5Z" ${getColorAttrib(opts.color.dark, 'fill')} />
    <path fill-rule="evenodd" clip-rule="evenodd" d="M7 3.5C7 5.43359 5.43298 7 3.5 7C1.56702 7 0 5.43359 0 3.5C0 1.56641 1.56702 0 3.5 0C5.43298 0 7 1.56641 7 3.5ZM6 3.5C6 4.88086 4.88074 6 3.5 6C2.11926 6 1 4.88086 1 3.5C1 2.11914 2.11926 1 3.5 1C4.88074 1 6 2.11914 6 3.5Z" ${getColorAttrib(opts.color.dark, 'fill')} />
  `

  const finders = html`
    <g style="transform: translate(${opts.margin}px, ${opts.margin}px)" shape-rendering="geometricPrecision">
      <g style="transform: translate(0px, 0px)">${finder}</g>
      <g style="transform: translate(${size - 7}px, 0px)">${finder}</g>
      <g style="transform: translate(0px, ${size - 7}px)">${finder}</g>
    </g>
  `

  // modification: add branded header
  const headerdata = bits(size * 3)
  zero(headerdata, size, 0, 0, 8, 4)
  zero(headerdata, size, size - 7, 2, size, 3)

  const logo = html`
    <g style="transform: translate(${opts.margin}px, ${opts.margin - (headerdata.length / size)}px)">
      <path ${getColorAttrib(opts.color.dark, 'fill')} fill-rule="evenodd" clip-rule="evenodd" d="M5.40909 0L7 1.59091L6.36364 2.22727L5.40909 1.27273L4.45454 2.22727L3.5 1.27273L2.54545 2.22727L1.59091 1.27273L0.636364 2.22727L0 1.59091L1.59091 0L2.54545 0.954545L3.5 0L4.45454 0.954545L5.40909 0Z" />
    </g>
  `

  const header = html`
    <g style="transform: translate(0px, ${(-headerdata.length / size)}px)">
      <path ${getColorAttrib(opts.color.dark, 'stroke')}
        d="${qrToPath(headerdata, size, opts.margin)}" />
    </g>
    ${logo}
  `

  const viewBox = 'viewBox="' + '0 0 ' + qrcodesize + ' ' + qrcodesize + '"'

  const width = !opts.width ? '' : 'width="' + opts.width + '" height="' + opts.width + '" '

  const svgTag = html`
    <svg xmlns="http://www.w3.org/2000/svg" ${width} ${viewBox} shape-rendering="crispEdges">
      ${bg}
      ${// modification: center qr code over background
      '<g style="transform: translate(0, 1.5px)">'}
        ${path}
        ${finders}
        ${header}
      </g>
    </svg>
  `

  if (typeof cb === 'function') {
    cb(null, svgTag)
  }

  return svgTag
}
