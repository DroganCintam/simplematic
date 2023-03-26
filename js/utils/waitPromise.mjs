export default function waitPromise(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
