// 为1949年创建专属轨道的patch脚本

const fs = require('fs');
const path = './components/RiverCanvas.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. 在常量部分添加轨道参数（在DATA_START_YEAR定义后）
const constantsMarker = 'const DATA_STEP = 2;';
const constantsPos = content.indexOf(constantsMarker);

if (constantsPos !== -1) {
  const insertPos = constantsPos + constantsMarker.length;
  
  const trackConstants = `
  
  // 1949年专属轨道参数 (置顶显示)
  const TOP_TRACK_Y = 60;              // 轨道顶部Y位置 (距离屏幕顶部60px)
  const TOP_TRACK_HEIGHT = 56;         // 轨道高度
  const TOP_TRACK_MARGIN = 8;          // 轨道间距`;
  
  content = content.substring(0, insertPos) + trackConstants + content.substring(insertPos);
}

// 2. 在事件渲染前插入1949年轨道代码
// 查找 {eventLayoutNodes.map 的位置
const renderMarker = '          {eventLayoutNodes.map((node) => {';
const renderPos = content.indexOf(renderMarker);

if (renderPos !== -1) {
  const trackCode = `          {/* 1949年专属轨道 (最上层) */}
          <g>
            {/* 轨道背景 */}
            <rect 
              x={0} 
              y={TOP_TRACK_Y} 
              width={width} 
              height={TOP_TRACK_HEIGHT} 
              fill="#fee2e2" 
              stroke="#fecaca" 
              opacity={0.8}
            />
            
            {/* 轨道标签 */}
            <g transform={{\`translate(20, TOP_TRACK_Y + TOP_TRACK_HEIGHT / 2)\`}}>
              <text 
                fill="#b91c1c" 
                fontSize={{14}} 
                fontWeight={{700}}
                textAnchor="start"
              >
                1949年·新中国成立
              </text>
              <line 
                x1={0} 
                y1={8} 
                x2={150} 
                y2={8} 
                stroke="#b91c1c" 
                strokeWidth={1.5}
              />
            </g>
            
            {/* 1949年事件标记 */}
            {(() => {
              const screenX_1949 = visibleXScale(1949);
              const y = TOP_TRACK_Y + TOP_TRACK_HEIGHT / 2;
              
              return (
                <g transform={{\`translate(${{screenX_1949}}, ${{y}})\`}}>
                  {/* 红旗图标 */}
                  <g transform="translate(0, -15)">
                    <rect x={-15} y={0} width={30} height={20} fill="#e11d48" rx={2} />
                    <text x={0} y={14} fill="white" fontSize={{12}} fontWeight="bold" textAnchor="middle">★</text>
                  </g>
                  
                  {/* 年份文字 */}
                  <text y={20} fill="#b91c1c" fontSize={{16}} fontWeight={{700}} textAnchor="middle">1949</text>
                  
                  {/* 事件标题 */}
                  <text y={38} fill="#1f2937" fontSize={{14}} fontWeight={{600}} textAnchor="middle">新中国成立</text>
                </g>
              );
            })()}
          </g>

`;
  
  content = content.substring(0, renderPos) + trackCode + content.substring(renderPos);
}

// 3. 写入文件
fs.writeFileSync(path, content);

console.log('✅ 1949年专属轨道已添加');
console.log('📍 修改位置:', path);
console.log('📝 修改内容:');
console.log('   1. 添加轨道常量 (TOP_TRACK_Y, TOP_TRACK_HEIGHT, TOP_TRACK_MARGIN)');
console.log('   2. 添加1949年专属轨道渲染代码');
console.log('🔧 下一步: npm run build');
