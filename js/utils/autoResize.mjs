export default function autoResize(/** @type {HTMLTextAreaElement} */ textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `calc(${textarea.scrollHeight}px + 0.25rem)`;
}
