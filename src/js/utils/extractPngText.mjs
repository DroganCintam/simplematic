export default function extractPngText(/** @type {string} */ base64Data) {
  const byteArray = new Uint8Array(
    atob(base64Data)
      .split('')
      .map((c) => c.charCodeAt(0))
  );
  const view = new DataView(byteArray.buffer);
  let offset = 8;
  while (offset < view.byteLength) {
    const length = view.getUint32(offset);
    offset += 4;
    const type = view.getUint32(offset);
    offset += 4;

    // 'tEXt'
    if (type === 0x74455874) {
      const text = new TextDecoder().decode(
        new Uint8Array(byteArray.slice(offset, offset + length))
      );
      const chunks = text.split('\0');
      for (let i = 0; i < chunks.length - 1; i += 2) {
        const key = chunks[i];
        if (key === 'parameters') {
          const infoText = chunks[i + 1];
          return infoText;
        }
      }
      break;
    }

    offset += length + 4;
  }

  return null;
}
