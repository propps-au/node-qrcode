const Utils = require("./utils");
const { html } = require("common-tags");

/**
 * @remarks unmodified from svg-tag.js
 *
 * @param {*} color : ;
 * @param {*} attrib
 * @returns
 */
function getColorAttrib(color, attrib) {
  const alpha = color.a / 255;
  const str = attrib + '="' + color.hex + '"';

  return alpha < 1
    ? str + " " + attrib + '-opacity="' + alpha.toFixed(2).slice(1) + '"'
    : str;
}

/**
 * @remarks unmodified from svg-tag.js
 *
 * @param {*} cmd
 * @param {*} x
 * @param {*} y
 * @returns
 */
function svgCmd(cmd, x, y) {
  let str = cmd + x;
  if (typeof y !== "undefined") str += " " + y;

  return str;
}

/**
 * @remarks unmodified from svg-tag.js
 *
 * @param {*} data
 * @param {*} size
 * @param {*} margin
 * @returns
 */
function qrToPath(data, size, margin) {
  let path = "";
  let moveBy = 0;
  let newRow = false;
  let lineLength = 0;

  for (let i = 0; i < data.length; i++) {
    const col = Math.floor(i % size);
    const row = Math.floor(i / size);

    if (!col && !newRow) newRow = true;

    if (data[i]) {
      lineLength++;

      if (!(i > 0 && col > 0 && data[i - 1])) {
        path += newRow
          ? svgCmd("M", col + margin, 0.5 + row + margin)
          : svgCmd("m", moveBy, 0);

        moveBy = 0;
        newRow = false;
      }

      if (!(col + 1 < size && data[i + 1])) {
        path += svgCmd("h", lineLength);
        lineLength = 0;
      }
    } else {
      moveBy++;
    }
  }

  return path;
}

/**
 * generates arbitrary bits for the branded header of the qr code
 *
 * @param {number} len
 * @param {string} [word]
 * @returns number[]
 */
function bits(len, word = "secret") {
  const filler = [...word]
    .map((char) =>
      Array.from((char.charCodeAt(0) ** 2 % 7).toString(2)).map((bit) =>
        parseInt(bit)
      )
    )
    .flat();

  let result = [];

  while (result.length < len) {
    result = result.concat(filler);
  }

  return result.slice(0, len);
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
  const x1a = Math.min(x1, x2);
  const y1a = Math.min(y1, y2);
  const x2a = Math.max(x1, x2);
  const y2a = Math.max(y1, y2);

  for (let y = y1a; y < y2a; y++) {
    for (let x = x1a; x < x2a; x++) {
      const i = y * size + x;
      if (i < data.length) {
        data[i] = 0;
      }
    }
  }
}

exports.render = function render(qrData, options, cb) {
  const opts = Utils.getOptions(options);
  const size = qrData.modules.size;
  const data = qrData.modules.data;
  const qrcodesize = size + opts.margin * 2;

  // modification: zero our square finders from qr code cells
  zero(data, size, 0, 0, 8, 8);
  zero(data, size, 0, size - 8, 8, size);
  zero(data, size, size - 8, 0, size, 8);

  const bg = !opts.color.light.a
    ? ""
    : "<path " +
      getColorAttrib(opts.color.light, "fill") +
      ' d="M0 0h' +
      qrcodesize +
      "v" +
      qrcodesize +
      'H0z"/>';

  const path =
    "<path " +
    getColorAttrib(opts.color.dark, "stroke") +
    ' d="' +
    qrToPath(data, size, opts.margin) +
    '"/>';

  // modification: add circular finders

  const finders = html`
    <path
      d="M7.5 27C8.32837 27 9 26.3281 9 25.5C9 24.6719 8.32837 24 7.5 24C6.67163 24 6 24.6719 6 25.5C6 26.3281 6.67163 27 7.5 27Z"
      fill="black"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M11 25.5C11 27.4336 9.43298 29 7.5 29C5.56702 29 4 27.4336 4 25.5C4 23.5664 5.56702 22 7.5 22C9.43298 22 11 23.5664 11 25.5ZM10 25.5C10 26.8809 8.88074 28 7.5 28C6.11926 28 5 26.8809 5 25.5C5 24.1191 6.11926 23 7.5 23C8.88074 23 10 24.1191 10 25.5Z"
      fill="black"
    />
    <path
      d="M7.5 9C8.32837 9 9 8.32812 9 7.5C9 6.67188 8.32837 6 7.5 6C6.67163 6 6 6.67188 6 7.5C6 8.32812 6.67163 9 7.5 9Z"
      fill="black"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M11 7.5C11 9.43359 9.43298 11 7.5 11C5.56702 11 4 9.43359 4 7.5C4 5.56641 5.56702 4 7.5 4C9.43298 4 11 5.56641 11 7.5ZM10 7.5C10 8.88086 8.88074 10 7.5 10C6.11926 10 5 8.88086 5 7.5C5 6.11914 6.11926 5 7.5 5C8.88074 5 10 6.11914 10 7.5Z"
      fill="black"
    />
    <path
      d="M25.5 9C26.3284 9 27 8.32812 27 7.5C27 6.67188 26.3284 6 25.5 6C24.6716 6 24 6.67188 24 7.5C24 8.32812 24.6716 9 25.5 9Z"
      fill="black"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M29 7.5C29 9.43359 27.433 11 25.5 11C23.567 11 22 9.43359 22 7.5C22 5.56641 23.567 4 25.5 4C27.433 4 29 5.56641 29 7.5ZM28 7.5C28 8.88086 26.8807 10 25.5 10C24.1193 10 23 8.88086 23 7.5C23 6.11914 24.1193 5 25.5 5C26.8807 5 28 6.11914 28 7.5Z"
      fill="black"
    />
  `;

  // modification: add branded header
  const headerdata = bits(size * 3);
  zero(headerdata, size, 0, 0, 8, 4);
  zero(headerdata, size, size - 7, 2, size, 3);

  const logo = html`
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M9.40909 1L11 2.59091L10.3636 3.22727L9.40909 2.27273L8.45454 3.22727L7.5 2.27273L6.54545 3.22727L5.59091 2.27273L4.63636 3.22727L4 2.59091L5.59091 1L6.54545 1.95455L7.5 1L8.45454 1.95455L9.40909 1Z"
      fill="black"
    />
  `;

  const header = html`
    <path
      d="M12 1.5H13M14 1.5H15M16 1.5H17M18 1.5H19M20 1.5H22M24 1.5H25M26 1.5H27M28 1.5H29M13 2.5H14M15 2.5H16M17 2.5H18M19 2.5H21M23 2.5H24M25 2.5H26M27 2.5H28M12 3.5H13M14 3.5H15M16 3.5H17M18 3.5H20"
      stroke="black"
    />
    ${logo}
  `;

  const viewBox = 'viewBox="' + "0 0 " + qrcodesize + " " + qrcodesize + '"';

  const width = !opts.width
    ? ""
    : 'width="' + opts.width + '" height="' + opts.width + '" ';

  const svgTag = html`
    <svg xmlns="http://www.w3.org/2000/svg" ${width} ${viewBox} shape-rendering="crispEdges">
      ${bg}
      ${
        // modification: center qr code over background
        '<g style="transform: translate(0, 1.5px)">'
      }
        ${path}
        ${finders}
        ${header}
      </g>
    </svg>
  `;

  if (typeof cb === "function") {
    cb(null, svgTag);
  }

  return svgTag;
};
