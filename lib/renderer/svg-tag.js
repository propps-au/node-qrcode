const Utils = require('./utils')

function getColorAttrib (color, attrib) {
  const alpha = color.a / 255
  const str = attrib + '="' + color.hex + '"'

  return alpha < 1
    ? str + ' ' + attrib + '-opacity="' + alpha.toFixed(2).slice(1) + '"'
    : str
}

function svgCmd (cmd, x, y) {
  let str = cmd + x
  if (typeof y !== 'undefined') str += ' ' + y

  return str
}

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

exports.render = function render (qrData, options, cb) {
  const opts = Utils.getOptions(options)
  const size = qrData.modules.size
  const data = qrData.modules.data
  const qrcodesize = size + opts.margin * 2

  const headerdata = bits(size * 3)
  for (let i = 0; i < headerdata.length; i++) {
    const col = Math.floor(i % size)
    const row = Math.floor(i / size)

    if (row === (headerdata.length / size) - 1) {
      if ((col < 8 || col > size - 8 - 1)) {
        headerdata[i] = 0
      }
    } else {
      if (col < 8) {
        headerdata[i] = 0
      }
    }
  }

  const finder = (id, x = 0, y = 0) => `
  <g style="transform: translate(${x}px, ${y}px)">
    <mask id="mask-circle-${id}">
      <circle
        cx="3.5" cy="3.5" r="3.5"
        fill="white"
        ></circle>
      <circle
        cx="3.5" cy="3.5" r="2.5"
        fill="black"></circle>
      <circle
        cx="3.5" cy="3.5" r="1.5"
        fill="white"
        ></circle>
    </mask>
    <rect
      mask="url(#mask-circle-${id})"
      width="7" height="7" ${getColorAttrib(opts.color.dark, 'fill')}></rect>
  </g>
  `

  const mask = `
    <mask id="mask1">
      <g style="transform: translate(${opts.margin}px, ${opts.margin}px)">
      <rect width="${size}" height="${qrData.modules.data.length / size}" fill="white"></rect>
      <rect width="7" height="7" fill="black"></rect>
      <rect x="${size - 7}" width="7" height="7" fill="black"></rect>
      <rect y="${size - 7}" width="7" height="7" fill="black"></rect>
      </g>
    </mask>
  `

  const bg = !opts.color.light.a
    ? ''
    : '<path ' + getColorAttrib(opts.color.light, 'fill') +
      ' d="M0 0h' + qrcodesize + 'v' + qrcodesize + 'H0z"/>'

  const path = `
    <g style="transform: translate(0, 1.5px)">
      <path ${getColorAttrib(opts.color.dark, 'stroke')}
        mask="url(#mask1)"
        d="${qrToPath(data, size, opts.margin)}"/>
      />
      <g style="transform: translate(${opts.margin}px, ${opts.margin}px)">
        ${finder('1')}
        ${finder('2', size - 7, 0)}
        ${finder('3', 0, size - 7)}
      </g>
    </g>
  `

  const path2 = `
    <g style="transform: translate(0px, ${(-headerdata.length / size) + 1.5}px)">
      <path ${getColorAttrib(opts.color.dark, 'stroke')}
        d="${qrToPath(headerdata, size, opts.margin)}" />
    </g>
  `

  const viewBox = 'viewBox="' + '0 0 ' + qrcodesize + ' ' + qrcodesize + '"'

  const width = !opts.width ? '' : 'width="' + opts.width + '" height="' + opts.width + '" '

  const logo = `
    <g style="transform: translate(${opts.margin}px, ${opts.margin - 1.5}px)">
      <path ${getColorAttrib(opts.color.dark, 'fill')} fill-rule="evenodd" clip-rule="evenodd" d="M5.40909 0L7 1.59091L6.36364 2.22727L5.40909 1.27273L4.45454 2.22727L3.5 1.27273L2.54545 2.22727L1.59091 1.27273L0.636364 2.22727L0 1.59091L1.59091 0L2.54545 0.954545L3.5 0L4.45454 0.954545L5.40909 0Z" />
    </g>
  `

  const svgTag = '<svg xmlns="http://www.w3.org/2000/svg" ' + width + viewBox + ' shape-rendering="crispEdges">' + mask + bg + path + path2 + logo + '</svg>\n'

  if (typeof cb === 'function') {
    cb(null, svgTag)
  }

  return svgTag
}

function bits (len, word = 'secret') {
  const filler = [...word].map(char => Array.from(((char.charCodeAt(0) ** 2) % 7).toString(2)).map(bit => parseInt(bit))).flat()

  let result = []

  while (result.length < len) {
    result = result.concat(filler)
  }

  return result.slice(0, len)
}
