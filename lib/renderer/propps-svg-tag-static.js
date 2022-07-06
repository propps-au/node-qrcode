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
      d="M7.5 29C8.32837 29 9 28.3281 9 27.5C9 26.6719 8.32837 26 7.5 26C6.67163 26 6 26.6719 6 27.5C6 28.3281 6.67163 29 7.5 29Z"
      fill="black"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M11 27.5C11 29.4336 9.43298 31 7.5 31C5.56702 31 4 29.4336 4 27.5C4 25.5664 5.56702 24 7.5 24C9.43298 24 11 25.5664 11 27.5ZM10 27.5C10 28.8809 8.88074 30 7.5 30C6.11926 30 5 28.8809 5 27.5C5 26.1191 6.11926 25 7.5 25C8.88074 25 10 26.1191 10 27.5Z"
      fill="black"
    />
    <path
      d="M7.5 11C8.32837 11 9 10.3281 9 9.5C9 8.67188 8.32837 8 7.5 8C6.67163 8 6 8.67188 6 9.5C6 10.3281 6.67163 11 7.5 11Z"
      fill="black"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M11 9.5C11 11.4336 9.43298 13 7.5 13C5.56702 13 4 11.4336 4 9.5C4 7.56641 5.56702 6 7.5 6C9.43298 6 11 7.56641 11 9.5ZM10 9.5C10 10.8809 8.88074 12 7.5 12C6.11926 12 5 10.8809 5 9.5C5 8.11914 6.11926 7 7.5 7C8.88074 7 10 8.11914 10 9.5Z"
      fill="black"
    />
    <path
      d="M25.5 11C26.3284 11 27 10.3281 27 9.5C27 8.67188 26.3284 8 25.5 8C24.6716 8 24 8.67188 24 9.5C24 10.3281 24.6716 11 25.5 11Z"
      fill="black"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M29 9.5C29 11.4336 27.433 13 25.5 13C23.567 13 22 11.4336 22 9.5C22 7.56641 23.567 6 25.5 6C27.433 6 29 7.56641 29 9.5ZM28 9.5C28 10.8809 26.8807 12 25.5 12C24.1193 12 23 10.8809 23 9.5C23 8.11914 24.1193 7 25.5 7C26.8807 7 28 8.11914 28 9.5Z"
      fill="black"
    />
    <path
      d="M12 3.5H13H12ZM14 3.5H15H14ZM16 3.5H17H16ZM18 3.5H19H18ZM20 3.5H22H20ZM24 3.5H25H24ZM26 3.5H27H26ZM28 3.5H29H28ZM13 4.5H14H13ZM15 4.5H16H15ZM17 4.5H18H17ZM19 4.5H21H19ZM23 4.5H24H23ZM25 4.5H26H25ZM27 4.5H28H27ZM12 5.5H13H12ZM14 5.5H15H14ZM16 5.5H17H16ZM18 5.5H20H18Z"
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
      d="M9.40909 3L11 4.59091L10.3636 5.22727L9.40909 4.27273L8.45454 5.22727L7.5 4.27273L6.54545 5.22727L5.59091 4.27273L4.63636 5.22727L4 4.59091L5.59091 3L6.54545 3.95455L7.5 3L8.45454 3.95455L9.40909 3Z"
      fill="black"
    />
  `;

  const header = html`
    <path
      d="M12 3.5H13M14 3.5H15M16 3.5H17M18 3.5H19M20 3.5H22M24 3.5H25M26 3.5H27M28 3.5H29M13 4.5H14M15 4.5H16M17 4.5H18M19 4.5H21M23 4.5H24M25 4.5H26M27 4.5H28M12 5.5H13M14 5.5H15M16 5.5H17M18 5.5H20"
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
