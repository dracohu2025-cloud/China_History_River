//测试URL前缀匹配
const testUrls = [
  '/timeline-api/api/riverpins/',
  '/api/events',
  '/timeline-api/',
  '/api/',
  '/timeline-api/other',
  '/api/other/path'
];

const PROXY_RULES = [
  {
    name: 'Django Timeline API',
    prefix: '/timeline-api',
    target: 'http://localhost:8000'
  },
  {
    name: 'Express API',
    prefix: '/api',
    target: 'http://localhost:4000'
  }
];

function matches(url, prefix) {
  return url.startsWith(prefix) && (url.length === prefix.length || url[prefix.length] === '/');
}

console.log('Testing URL prefix matching:\n');
testUrls.forEach(url => {
  console.log(`URL: "${url}"`);
  PROXY_RULES.forEach(rule => {
    const match = matches(url, rule.prefix);
    console.log(`  ${rule.prefix}: ${match ? '✅ MATCH' : '❌ no match'}`);
  });
  console.log('');
});