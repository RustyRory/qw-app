// Puppeteer >= 24 is ESM-only and cannot be loaded by Jest (CommonJS).
// E2E tests don't generate real PDFs, so we stub it.
const page = {
  setContent: () => Promise.resolve(),
  pdf: () => Promise.resolve(Buffer.from('pdf')),
};

const browser = {
  newPage: () => Promise.resolve(page),
  close: () => Promise.resolve(),
};

export default {
  launch: () => Promise.resolve(browser),
};
