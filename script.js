const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const upload = document.getElementById('upload');
const poster = document.getElementById('poster');
const posterInput = document.getElementById('posterInput');
const saturation = document.getElementById('saturation');
const saturationInput = document.getElementById('saturationInput');
const imageAlpha = document.getElementById('imageAlpha');
const imageAlphaVal = document.getElementById('imageAlphaVal');
const edgeThreshold = document.getElementById('edgeThreshold');
const edgeInput = document.getElementById('edgeInput');
const edgeColor = document.getElementById('edgeColor');
const edgeAlpha = document.getElementById('edgeAlpha');
const alphaVal = document.getElementById('alphaVal');
const showEdgesCheckbox = document.getElementById('showEdges');
const onlyEdges = document.getElementById('onlyEdges');
const bgColor = document.getElementById('bgColor');
const bgPicker = document.getElementById('bgPicker');

const targetColor = document.getElementById('targetColor');
const colorTolerance = document.getElementById('colorTolerance');
const colorToleranceVal = document.getElementById('colorToleranceVal');
const replacementColor = document.getElementById('replacementColor');
const replacementColorContainer = document.getElementById('replacementColorContainer');
const colorModeRadios = document.querySelectorAll('input[name="colorMode"]');
const enableColorFilter = document.getElementById('enableColorFilter');

const enableChannelFilter = document.getElementById('enableChannelFilter');
const channelType = document.getElementById('channelType');
const channelTolerance = document.getElementById('channelTolerance');
const channelToleranceVal = document.getElementById('channelToleranceVal');
const channelModeRadios = document.querySelectorAll('input[name="channelMode"]');

const zoomSlider = document.getElementById('zoom');
const zoomVal = document.getElementById('zoomVal');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');

let originalImage = null;

function hexToRGB(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function syncSliders(slider, input) {
  slider.addEventListener('input', () => {
    input.value = slider.value;
    applyFilter();
  });
  input.addEventListener('input', () => {
    slider.value = input.value;
    applyFilter();
  });
}

syncSliders(poster, posterInput);
syncSliders(saturation, saturationInput);
syncSliders(edgeThreshold, edgeInput);

upload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    applyFilter();
  };
  img.src = URL.createObjectURL(file);
});

downloadBtn.onclick = () => {
  const a = document.createElement('a');
  a.download = 'filtered_image.png';
  a.href = canvas.toDataURL();
  a.click();
};

zoomSlider.addEventListener('input', () => {
  canvas.style.transform = 'scale(' + zoomSlider.value + ')';
  zoomVal.textContent = zoomSlider.value;
});

resetBtn.addEventListener('click', () => window.location.reload());

[
  poster, saturation, edgeThreshold, edgeColor, edgeAlpha,
  onlyEdges, showEdgesCheckbox, bgColor, targetColor, replacementColor,
  enableColorFilter, enableChannelFilter, channelType, channelTolerance
].forEach(el => el.addEventListener('input', applyFilter));

edgeAlpha.addEventListener('input', () => {
  alphaVal.textContent = edgeAlpha.value;
  applyFilter();
});

imageAlpha.addEventListener('input', () => {
  imageAlphaVal.textContent = imageAlpha.value;
  applyFilter();
});

colorTolerance.addEventListener('input', () => {
  colorToleranceVal.textContent = colorTolerance.value;
  applyFilter();
});

channelTolerance.addEventListener('input', () => {
  channelToleranceVal.textContent = channelTolerance.value;
  applyFilter();
});

onlyEdges.addEventListener('change', () => {
  bgPicker.style.display = onlyEdges.checked ? 'block' : 'none';
  applyFilter();
});

colorModeRadios.forEach(r => r.addEventListener('change', applyFilter));
channelModeRadios.forEach(r => r.addEventListener('change', applyFilter));

function applyFilter() {
  if (!originalImage) return;

  const width = canvas.width;
  const height = canvas.height;
  const step = parseInt(poster.value);
  const alpha = parseInt(imageAlpha.value);
  const edgeThres = parseInt(edgeThreshold.value);
  const edgeRGBA = hexToRGB(edgeColor.value);
  const edgeAlphaVal = parseInt(edgeAlpha.value);
  const showEdgesOnly = onlyEdges.checked;

  let src = new Uint8ClampedArray(originalImage.data);
  const gray = new Float32Array(width * height);

  for (let i = 0; i < src.length; i += 4) {
    const r = src[i], g = src[i + 1], b = src[i + 2];
    gray[i / 4] = 0.3 * r + 0.59 * g + 0.11 * b;
  }

  const edge = new Uint8ClampedArray(src.length);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const gx = -gray[i - width - 1] - 2 * gray[i - 1] - gray[i + width - 1]
               + gray[i - width + 1] + 2 * gray[i + 1] + gray[i + width + 1];
      const gy = -gray[i - width - 1] - 2 * gray[i - width] - gray[i - width + 1]
               + gray[i + width - 1] + 2 * gray[i + width] + gray[i + width + 1];
      const mag = Math.sqrt(gx * gx + gy * gy);
      const val = mag > edgeThres ? 0 : 255;
      const j = i * 4;
      edge[j] = edge[j + 1] = edge[j + 2] = val;
      edge[j + 3] = 255;
    }
  }if (showEdgesOnly) {
  const edgeWithAlpha = new Uint8ClampedArray(edge.length);
  for (let i = 0; i < edge.length; i += 4) {
    if (edge[i] === 0) {
      edgeWithAlpha[i]     = edgeRGBA.r;
      edgeWithAlpha[i + 1] = edgeRGBA.g;
      edgeWithAlpha[i + 2] = edgeRGBA.b;
      edgeWithAlpha[i + 3] = edgeAlphaVal;
    } else {
      edgeWithAlpha[i + 3] = 0;
    }
  }

  // Создаём временный канвас с контуром
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(new ImageData(edgeWithAlpha, width, height), 0, 0);

  // Заливаем фон
  ctx.fillStyle = bgColor.value;
  ctx.fillRect(0, 0, width, height);

  // Накладываем изображение с контуром
  ctx.drawImage(tempCanvas, 0, 0);

  return;
}

  

  for (let i = 0; i < src.length; i += 4) {
    let r = src[i] / 255, g = src[i + 1] / 255, b = src[i + 2] / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    s = Math.min(1, Math.max(0, s * parseFloat(saturation.value)));
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
    src[i] = Math.round(r * 255);
    src[i + 1] = Math.round(g * 255);
    src[i + 2] = Math.round(b * 255);
  }

  for (let i = 0; i < src.length; i += 4) {
    src[i]     = Math.floor(src[i] / step) * step;
    src[i + 1] = Math.floor(src[i + 1] / step) * step;
    src[i + 2] = Math.floor(src[i + 2] / step) * step;
    src[i + 3] = alpha;
  }

  if (enableColorFilter.checked) {
    const target = hexToRGB(targetColor.value);
    const tolerance = parseInt(colorTolerance.value);
    const mode = [...colorModeRadios].find(r => r.checked)?.value;
    const repl = hexToRGB(replacementColor.value);
    for (let i = 0; i < src.length; i += 4) {
      const dr = Math.abs(src[i] - target.r);
      const dg = Math.abs(src[i + 1] - target.g);
      const db = Math.abs(src[i + 2] - target.b);
      const d = Math.sqrt(dr * dr + dg * dg + db * db);
      if (d > tolerance) {
        if (mode === 'bw') {
          const avg = (src[i] + src[i + 1] + src[i + 2]) / 3;
          src[i] = src[i + 1] = src[i + 2] = avg;
        } else if (mode === 'transparent') {
          src[i + 3] = 0;
        }
      } else if (mode === 'replace') {
        src[i] = repl.r;
        src[i + 1] = repl.g;
        src[i + 2] = repl.b;
      }
    }
  }

  if (enableChannelFilter.checked) {
    const type = channelType.value;
    const tolerance = parseInt(channelTolerance.value);
    const mode = [...channelModeRadios].find(r => r.checked)?.value;
    for (let i = 0; i < src.length; i += 4) {
      const r = src[i], g = src[i + 1], b = src[i + 2];
      let keep = false;
      if (type === 'red') keep = r - Math.max(g, b) > tolerance;
      else if (type === 'green') keep = g - Math.max(r, b) > tolerance;
      else if (type === 'blue') keep = b - Math.max(r, g) > tolerance;
      else if (type === 'yellow') keep = r > 180 && g > 180 && b < 130 && Math.abs(r - g) < 60;
      if (!keep) {
        if (mode === 'bw') {
          const avg = (r + g + b) / 3;
          src[i] = src[i + 1] = src[i + 2] = avg;
        } else if (mode === 'transparent' || mode === 'remove') {
          src[i + 3] = 0;
        }
      }
    }
  }

  if (showEdgesCheckbox.checked) {
    for (let i = 0; i < src.length; i += 4) {
      if (edge[i] === 0) {
        src[i] = edgeRGBA.r;
        src[i + 1] = edgeRGBA.g;
        src[i + 2] = edgeRGBA.b;
        src[i + 3] = edgeAlphaVal;
      }
    }
  }

  ctx.putImageData(new ImageData(src, width, height), 0, 0);
}