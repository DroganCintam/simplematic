function validateInputRange(e) {
  let value = e.value !== '' ? parseFloat(e.value) : null;
  let min = e.min !== '' ? parseFloat(e.min) : null;
  let max = e.max !== '' ? parseFloat(e.max) : null;
  if (typeof value === 'number') {
    if (typeof min === 'number' && value < min) {
      value = min;
    } else if (typeof max === 'number' && value > max) {
      value = max;
    }
    e.value = value;
  }
}
