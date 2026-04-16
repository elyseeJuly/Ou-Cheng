import fs from 'fs';
import path from 'path';
import https from 'https';

const SOURCES = [
  { url: `https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/${encodeURI('全唐诗/poet.tang.0.json')}`, category: '唐诗', dynasty: '唐代', parse: (item) => ({ title: item.title, author: item.author, content: (item.paragraphs || []).join('\n') }) },
  { url: `https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/${encodeURI('宋词/ci.song.0.json')}`, category: '宋词', dynasty: '宋代', parse: (item) => ({ title: item.rhythmic, author: item.author, content: (item.paragraphs || []).join('\n') }) },
  { url: `https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/${encodeURI('诗经/shijing.json')}`, category: '诗经', dynasty: '先秦', parse: (item) => ({ title: `${item.chapter}·${item.title}`, author: '佚名', content: (item.content || []).join('\n') }) },
  { url: `https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/${encodeURI('楚辞/chuci.json')}`, category: '楚辞', dynasty: '先秦', parse: (item) => ({ title: item.title, author: item.author, content: (item.content || []).join('\n') }) },
  { url: `https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/${encodeURI('曹操诗集/caocao.json')}`, category: '曹操诗集', dynasty: '汉末三国', parse: (item) => ({ title: item.title, author: '曹操', content: (item.paragraphs || []).join('\n') }) },
  { url: `https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/${encodeURI('元曲/yuanqu.json')}`, category: '元曲', dynasty: '元代', parse: (item) => ({ title: item.title, author: item.author, content: (item.paragraphs || []).join('\n') }) },
  { url: `https://raw.githubusercontent.com/chinese-poetry/chinese-poetry/master/${encodeURI('五代诗词/nantang/poetrys.json')}`, category: '五代诗词', dynasty: '五代十国', parse: (item) => ({ title: item.title, author: item.author, content: (item.paragraphs || []).join('\n') }) }
];

const PUBLIC_DIR = path.resolve(process.cwd(), 'public/data');
const OUT_FILE = path.resolve(PUBLIC_DIR, 'poetry.json');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to fetch ${url}, status code: ${res.statusCode}`));
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    const formattedData = [];

    for (const source of SOURCES) {
      console.log(`Fetching ${source.category}...`);
      const data = await fetchJson(source.url);
      
      // Some datasets like Shijing/Chuci might be huge, we can slice if needed, but since it's one json we'll just parse
      const maxItems = source.category === '唐诗' || source.category === '宋词' ? 500 : 500; // Limit large sets
      let items = Array.isArray(data) ? data : (data.data || []);
      
      let count = 0;
      for (const item of items) {
        if (count >= maxItems) break;
        const parsed = source.parse(item);
        formattedData.push({
          title: parsed.title || '无题',
          author: parsed.author || '佚名',
          content: parsed.content || '',
          category: source.category,
          dynasty: source.dynasty
        });
        count++;
      }
      console.log(`Added ${count} items for ${source.category}.`);
    }

    if (!fs.existsSync(PUBLIC_DIR)) {
      fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    }

    fs.writeFileSync(OUT_FILE, JSON.stringify(formattedData, null, 2), 'utf-8');
    console.log(`Successfully generated ${OUT_FILE} with ${formattedData.length} total entries.`);
    
  } catch (error) {
    console.error('Error fetching poetry data:', error);
    process.exit(1);
  }
}

main();
