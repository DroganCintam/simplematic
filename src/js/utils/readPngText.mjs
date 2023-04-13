import PngInfo from '../types/png-info.mjs';

/** @type {Array<{ key: string, func: (result: PngInfo, value: string) => void }>} */
const propertyReaders = [
  {
    key: 'Steps',
    func(result, value) {
      result.steps = parseInt(value);
    },
  },
  {
    key: 'Sampler',
    func(result, value) {
      result.sampler = value;
    },
  },
  {
    key: 'CFG scale',
    func(result, value) {
      result.cfg = parseFloat(value);
    },
  },
  {
    key: 'Seed',
    func(result, value) {
      result.seed = parseInt(value);
    },
  },
  {
    key: 'Size',
    func(result, value) {
      [result.width, result.height] = value.split('x').map((s) => parseInt(s));
    },
  },
  {
    key: 'Model hash',
    func(result, value) {
      result.modelHash = value;
    },
  },
  {
    key: 'Model',
    func(result, value) {
      result.modelName = value;
    },
  },
  {
    key: 'Face restoration',
    func(result, value) {
      result.faceRestoration = value;
    },
  },
  {
    key: 'Denoising strength',
    func(result, value) {
      result.denoisingStrength = parseFloat(value);
    },
  },
  {
    key: 'Hires upscale',
    func(result, value) {
      result.hiResScale = parseFloat(value);
    },
  },
  {
    key: 'Hires steps',
    func(result, value) {
      result.hiResSteps = parseInt(value);
    },
  },
];

/** @type {Object<string, (result: PngInfo, value: string) => void>} */
const propertyReaderDict = {};
propertyReaders.forEach((reader) => (propertyReaderDict[reader.key] = reader.func));

/**
 * Reads the info text and converts to an info object.
 * @param {String} text The info text extracted from a PNG file.
 * @returns {PngInfo}
 */
export default function readPngText(text) {
  const result = new PngInfo();

  const negativePromptKey = 'Negative prompt:';
  const indexOfNegativePrompt = text.indexOf(negativePromptKey);

  let propertyKeyIndices = new Array(propertyReaders.length);
  propertyReaders.forEach((reader, i) => {
    propertyKeyIndices[i] = text.lastIndexOf(reader.key + ':');
  });
  propertyKeyIndices.sort((a, b) => a - b);
  propertyKeyIndices = propertyKeyIndices.filter((i) => i >= 0);
  if (propertyKeyIndices.length == 0) return result;
  const indexOfFirstProperty = propertyKeyIndices[0];

  if (indexOfNegativePrompt >= 0) {
    result.prompt = text.substring(0, indexOfNegativePrompt).trim();
    result.negativePrompt = text
      .substring(indexOfNegativePrompt + negativePromptKey.length, indexOfFirstProperty)
      .trim();
  } else {
    result.prompt = text.substring(0, indexOfFirstProperty).trim();
    result.negativePrompt = '';
  }

  const propertiesLine = text.substring(indexOfFirstProperty).trim();
  const properties = propertiesLine.split(',').map((prop) => prop.trim());
  for (const property of properties) {
    const [key, value] = property.split(':').map((part) => part.trim());
    const func = propertyReaderDict[key];
    if (func) {
      func(result, value);
    }
  }

  return result;
}
