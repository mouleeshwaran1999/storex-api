const svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">',
  '<rect width="128" height="128" rx="24" fill="#6366f1"/>',
  '<rect x="20" y="55" width="88" height="50" rx="6" fill="#fff"/>',
  '<polygon points="10,60 64,20 118,60" fill="#4f46e5"/>',
  '<rect x="48" y="75" width="32" height="30" rx="4" fill="#c7d2fe"/>',
  '<rect x="30" y="68" width="20" height="20" rx="3" fill="#e0e7ff"/>',
  '<rect x="78" y="68" width="20" height="20" rx="3" fill="#e0e7ff"/>',
  '</svg>',
].join('');

const b64 = Buffer.from(svg).toString('base64');
console.log('data:image/svg+xml;base64,' + b64);
