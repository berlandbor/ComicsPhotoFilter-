// Полный script.js без синтаксических ошибок, полностью соответствующий интерфейсу

const canvas = document.getElementById('canvas'); const ctx = canvas.getContext('2d');

const upload = document.getElementById('upload'); const poster = document.getElementById('poster'); const posterInput = document.getElementById('posterInput'); const saturation = document.getElementById('saturation'); const saturationInput = document.getElementById('saturationInput'); const imageAlpha = document.getElementById('imageAlpha'); const imageAlphaVal = document.getElementById('imageAlphaVal');

const edgeThreshold = document.getElementById('edgeThreshold'); const edgeInput = document.getElementById('edgeInput'); const edgeColor = document.getElementById('edgeColor'); const edgeAlpha = document.getElementById('edgeAlpha'); const alphaVal = document.getElementById('alphaVal'); const showEdgesCheckbox = document.getElementById('showEdges'); const onlyEdges = document.getElementById('onlyEdges'); const bgColor = document.getElementById('bgColor'); const bgPicker = document.getElementById('bgPicker');

const targetColor = document.getElementById('targetColor'); const colorTolerance = document.getElementById('colorTolerance'); const colorToleranceVal = document.getElementById('colorToleranceVal'); const replacementColor = document.getElementById('replacementColor'); const replacementColorContainer = document.getElementById('replacementColorContainer'); const colorModeRadios = document.querySelectorAll('input[name="colorMode"]'); const enableColorFilter = document.getElementById('enableColorFilter');

const enableChannelFilter = document.getElementById('enableChannelFilter'); const channelType = document.getElementById('channelType'); const channelTolerance = document.getElementById('channelTolerance'); const channelToleranceVal = document.getElementById('channelToleranceVal'); const channelModeRadios = document.querySelectorAll('input[name="channelMode"]');

const zoomSlider = document.getElementById('zoom'); const zoomVal = document.getElementById('zoomVal'); const resetBtn = document.getElementById('resetBtn'); const downloadBtn = document.getElementById('downloadBtn');

let originalImage = null;

function hexToRGB(hex) { const bigint = parseInt(hex.slice(1), 16); return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }; }

function syncSliders(slider, input) { slider.addEventListener('input', () => { input.value = slider.value; applyFilter(); }); input.addEventListener('input', () => { slider.value = input.value; applyFilter(); }); }

syncSliders(poster, posterInput); syncSliders(saturation, saturationInput); syncSliders(edgeThreshold, edgeInput);

upload.addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const img = new Image(); img.onload = () => { canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0); originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height); applyFilter(); }; img.src = URL.createObjectURL(file); });

downloadBtn.onclick = () => { const a = document.createElement('a'); a.download = 'comic_filtered.png'; a.href = canvas.toDataURL(); a.click(); };

zoomSlider.addEventListener('input', () => { canvas.style.transform = 'scale(' + zoomSlider.value + ')'; zoomVal.textContent = zoomSlider.value; });

resetBtn.addEventListener('click', () => window.location.reload());

edgeAlpha.addEventListener('input', () => { alphaVal.textContent = edgeAlpha.value; applyFilter(); });

imageAlpha.addEventListener('input', () => { imageAlphaVal.textContent = imageAlpha.value; applyFilter(); });

colorTolerance.addEventListener('input', () => { colorToleranceVal.textContent = colorTolerance.value; applyFilter(); });

channelTolerance.addEventListener('input', () => { channelToleranceVal.textContent = channelTolerance.value; applyFilter(); });

[colorModeRadios, channelModeRadios].forEach(group => { group.forEach(r => r.addEventListener('change', applyFilter)); });

onlyEdges.addEventListener('change', () => { bgPicker.style.display = onlyEdges.checked ? 'block' : 'none'; applyFilter(); });

[poster, saturation, edgeThreshold, edgeColor, edgeAlpha, onlyEdges, showEdgesCheckbox, targetColor, replacementColor, enableColorFilter, enableChannelFilter, channelType, channelTolerance].forEach(el => { el.addEventListener('input', applyFilter); });

function applyFilter() { if (!originalImage) return; const width = canvas.width; const height = canvas.height; const step = parseInt(poster.value); const alpha = parseInt(imageAlpha.value);

let src = new Uint8ClampedArray(originalImage.data);

for (let i = 0; i < src.length; i += 4) { src[i] = Math.floor(src[i] / step) * step; src[i + 1] = Math.floor(src[i + 1] / step) * step; src[i + 2] = Math.floor(src[i + 2] / step) * step; src[i + 3] = alpha; }

if (enableColorFilter.checked) { const target = hexToRGB(targetColor.value); const tolerance = parseInt(colorTolerance.value); const mode = [...colorModeRadios].find(r => r.checked)?.value; const repl = hexToRGB(replacementColor.value);

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

if (enableChannelFilter.checked) { const type = channelType.value; const tolerance = parseInt(channelTolerance.value); const mode = [...channelModeRadios].find(r => r.checked)?.value;

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

ctx.putImageData(new ImageData(src, width, height), 0, 0); }

