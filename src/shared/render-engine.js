const colorString = require('color-string');

const images = {};

function bucketTool(canvas, startX, startY, color) {
  const colorEq = (data, color, b) => {
    return color[0] === data.data[b]
      && color[1] === data.data[b + 1]
      && color[2] === data.data[b + 2]
      && color[3] === data.data[b + 3]
  };

  const getIndex = (x, y, width) => y * (width * 4) + x * 4;

  const [r, g, b, _] = colorString.get.rgb(color);
  const a = 255;
  const ctx = canvas.getContext('2d');
  const fillData = ctx.createImageData(1, 1);
  fillData.data[0] = r;
  fillData.data[1] = g;
  fillData.data[2] = b;
  fillData.data[3] = a;
  const w = canvas.width;
  const h = canvas.height;
  const startIndex = getIndex(startX, startY, w);
  const data = ctx.getImageData(0, 0, w, h);
  const newData = ctx.getImageData(0, 0, w, h);
  const bg = [
    data.data[startIndex + 0],
    data.data[startIndex + 1],
    data.data[startIndex + 2],
    data.data[startIndex + 3]
  ];

  if (bg[0] == r && bg[1] == g && bg[2] == b) {
    return
  }

  const stack = [{ x: startX, y: startY }];

  while (stack.length) {
    let { x, y } = stack.pop();

    if (!colorEq(data, bg, getIndex(x, y, w))) {
      continue;
    }

    while (x > 0 && colorEq(data, bg, getIndex(x - 1, y, w))) {
      x -= 1
    }

    let up = true, down = true;
    while (x < w && colorEq(data, bg, getIndex(x, y, w))) {
      const i = getIndex(x, y, w);
      data.data[i] = r;
      data.data[i + 1] = g;
      data.data[i + 2] = b;
      data.data[i + 3] = a;
      newData.data[i] = r;
      newData.data[i + 1] = g;
      newData.data[i + 2] = b;
      newData.data[i + 3] = a;

      if (y + 1 < h) {
        if (up && colorEq(data, bg, getIndex(x, y + 1, w))) {
          stack.push({ x, y: y + 1 });
        }
        up = !colorEq(data, bg, getIndex(x, y + 1, w));
      }

      if (y > 0) {
        if (down && colorEq(data, bg, getIndex(x, y - 1, w))) {
          stack.push({ x, y: y - 1 });
        }
        down = !colorEq(data, bg, getIndex(x, y - 1, w));
      }

      x += 1;
    }
  }
  ctx.putImageData(newData, 0, 0);
}

function clearCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, w, h);
}

function isDrawContinuous(data) {
  if (!data) {
    return false;
  }
  const { x, y, prevX, prevY } = data;
  return !(typeof prevX !== 'number' || typeof prevY !== 'number' || (x === prevX && y === prevY));
}

function loadImage(name, image) {
  images[name] = image;
}

function processDrawMessage(canvas, data, drawHistory, addToHistory = true) {
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = data.color;
  let { tool, x, y, prevX, prevY, thickness } = data;
  ctx.lineWidth = thickness;
  const isContinuous = isDrawContinuous(data);
  switch (tool) {
    case 'brush':
      ctx.beginPath();
      if (isContinuous) {
        ctx.lineCap = 'round';
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(x, y);
      } else {
        ctx.ellipse(x - thickness, y, thickness, thickness, 0, 0, 0);
      }
      ctx.stroke();
      break;
    case 'bucket':
      bucketTool(canvas, x, y, data.color);
      break;
    case 'eraser':
      processDrawMessage(
        canvas,
        { x, y, prevX, prevY, thickness, tool, color: 'white', tool: 'brush' },
        drawHistory,
        false
      );
      break;
    case 'kai':
      ctx.drawImage(images['kai'], x - 128, y - 400);
      break;
    case 'clear':
      drawHistory.splice(0, drawHistory.length);
      clearCanvas(canvas);
      break;
    case 'undo':
      clearCanvas(canvas);
      let isLastContinuous;
      do {
        isLastContinuous = isDrawContinuous(drawHistory[drawHistory.length - 1]);
        drawHistory.pop();
      } while (isLastContinuous);
      drawHistory.forEach(data => processDrawMessage(canvas, data, drawHistory, false));
      addToHistory = false;
      break;
  }

  if (addToHistory) {
    drawHistory.push(data);
  }
}


module.exports = {
  bucketTool,
  clearCanvas,
  loadImage,
  processDrawMessage
};
