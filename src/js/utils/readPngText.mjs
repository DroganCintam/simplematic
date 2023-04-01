import PngInfo from '../types/png-info.mjs';

/**
 * Reads the info text and converts to an info object.
 * @param {String} text The info text extracted from a PNG file.
 * @returns {PngInfo}
 */
export default function readPngText(text) {
  const result = new PngInfo();

  const negativePromptKey = 'Negative prompt:';
  const indexOfNegativePrompt = text.indexOf(negativePromptKey);
  const stepsKey = 'Steps:';
  const indexOfSteps = text.lastIndexOf(stepsKey);

  if (indexOfNegativePrompt >= 0) {
    result.prompt = text.substring(0, indexOfNegativePrompt).trim();
    result.negativePrompt = text
      .substring(indexOfNegativePrompt + negativePromptKey.length, indexOfSteps)
      .trim();
  } else {
    result.prompt = text.substring(0, indexOfSteps).trim();
    result.negativePrompt = '';
  }

  const propertiesLine = text.substring(indexOfSteps).trim();
  const properties = propertiesLine.split(',').map((prop) => prop.trim());
  for (const property of properties) {
    const [key, value] = property.split(':').map((part) => part.trim());
    switch (key) {
      case 'Steps':
        result.steps = parseInt(value);
        break;
      case 'Sampler':
        result.sampler = value;
        break;
      case 'CFG scale':
        result.cfg = parseFloat(value);
        break;
      case 'Seed':
        result.seed = parseInt(value);
        break;
      case 'Size':
        [result.width, result.height] = value.split('x').map((s) => parseInt(s));
        break;
      case 'Model hash':
        result.modelHash = value;
        break;
      case 'Model':
        result.modelName = value;
        break;
      case 'Face restoration':
        result.faceRestoration = value;
        break;
      case 'Denoising strength':
        result.denoisingStrength = parseFloat(value);
        break;
      case 'Hires upscale':
        result.hiResScale = parseFloat(value);
        break;
      case 'Hires steps':
        result.hiResSteps = parseInt(value);
        break;
    }
  }

  return result;
}
