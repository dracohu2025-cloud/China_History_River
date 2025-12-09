// 快速修复脚本 - 在RiverCanvas中添加1949年事件
// 使用方法：在history_river目录下执行
// node ../add_1949_event.js

const fs = require('fs');
const path = './components/RiverCanvas.tsx';

// 读取文件
let content = fs.readFileSync(path, 'utf8');

// 查找插入位置（在{eventLayoutNodes.map之前）
const insertMarker = '        <g>\n          {eventLayoutNodes.map((node) => {';
const insertPos = content.indexOf(insertMarker);

if (insertPos === -1) {
  console.error('❌ 找不到插入位置');
  process.exit(1);
}

// 要插入的代码
const insertCode = `        <g>
          {(() => {
            // 紧急修复: 确保1949年事件被渲染
            const has1949 = eventLayoutNodes.some(n => n.event.year === 1949);
            const nodesToRender = [...eventLayoutNodes];
            
            if (!has1949) {
              const event1949 = KEY_EVENTS.find(e => e.year === 1949);
              if (event1949) {
                console.log('🚨 紧急修复: 手动添加1949年事件到渲染列表');
                const screenX_1949 = visibleXScale(1949);
                const centerY = (height / 2) * viewport.k + viewport.y;
                const specialNode = {
                  event: event1949,
                  x: screenX_1949,
                  yOffset: 0,
                  lane: 1,
                  width: 200,
                  isSpecial: true
                };
                nodesToRender.push(specialNode);
              }
            }
            
            return nodesToRender.map((node) => {
              const screenX = visibleXScale(node.event.year);
              const edgePad = 16;
              const isHighPriority = node.event.importance <= 2;
              const finalX = isHighPriority
                ? Math.max(edgePad, Math.min(width - edgePad, screenX))
                : screenX;
              if (!isHighPriority && (screenX < -200 || screenX > width + 200)) return null;

              const centerY = (height / 2) * viewport.k + viewport.y;
              const marginTop = 140;
              const marginBottom = 48;
              const deltaTop = (centerY - marginTop) / 5;
              const deltaBottom = (height - marginBottom - centerY) / 5;
              const band = Math.min(5, Math.max(1, Math.abs(node.lane)));
              const sideTop = node.lane > 0;
              let desiredY = sideTop ? centerY - deltaTop * band : centerY + deltaBottom * band;
              let clampedY = Math.max(marginTop, Math.min(height - marginBottom, desiredY));
              const bottomClamped = clampedY === height - marginBottom;
              const topClamped = clampedY === marginTop;
              let spread = (band * 8) + (12 - node.event.importance * 2);
              if (spread < 6) spread = 6;
              const bandSpacing = 22;
              const bandBase = node.event.importance <= 2 ? 2 : 0;
              const bandIndex = (Math.abs(node.lane) % 3) + bandBase;
              const jitter = ((Math.abs(node.lane) * 7 + Math.abs(node.event.year)) % 8) - 4;
              if (bottomClamped) clampedY = Math.max(marginTop, clampedY - spread - bandSpacing * bandIndex - jitter);
              if (topClamped) clampedY = Math.min(height - marginBottom, clampedY + spread + bandSpacing * bandIndex + jitter);
              if (!topClamped && desiredY < marginTop + 30) clampedY = Math.min(height - marginBottom, marginTop + 30 + spread + bandSpacing);
              const effectiveYOffset = clampedY - centerY;
              
              const color = getEventColor(node.event.type);
              const isHovered = hoverEvent === node.event;
              
              const baseScale = Math.min(1.2, Math.max(0.8, viewport.k));
              const renderScale = isHovered ? baseScale * 1.1 : baseScale;

              return (
                <g 
                  key={\`\${node.event.year}-\${node.event.title}\`} 
                  transform={\`translate(\${finalX}, \${centerY})\`}
                  className="cursor-pointer"
                  onClick={(e) => handleEventClick(e, node.event)}
                  style={{ zIndex: node.event.importance === 1 ? 50 : 10, pointerEvents: 'auto' }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEventClick(e as any, node.event) }}
                >
                  <circle 
                    r={3 * renderScale} 
                    fill="white" 
                    stroke={color} 
                    strokeWidth={2}
                  />
                  <line 
                    x1={0} 
                    y1={0} 
                    x2={0} 
                    y2={effectiveYOffset} 
                    stroke={color} 
                    strokeWidth={1.5} 
                    strokeDasharray="3,3"
                    opacity={0.7} 
                  />
                  <g transform={\`translate(0, \${effectiveYOffset}) scale(\${renderScale})\`}>
                    <rect 
                      x={-node.width / 2 / renderScale} 
                      y="-13" 
                      width={node.width / renderScale} 
                      height="26" 
                      rx="13" 
                      fill="white" 
                      stroke={color}
                      strokeWidth={1.5}
                      filter="url(#card-shadow)"
                    />
                    <text
                      x="0"
                      y="5"
                      fill="#44403c"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="select-none whitespace-nowrap font-sans"
                    >
                      <tspan fill={color} fontWeight="800">{node.event.year < 0 ? \`BC\${Math.abs(node.event.year)}\` : node.event.year}</tspan>
                      <tspan dx="6">{node.event.title}</tspan>
                    </text>
                  </g>
                </g>
              );
            });
          })()}
`;

// 执行替换
const newContent = content.substring(0, insertPos) + insertCode + content.substring(insertPos);

// 写入文件
fs.writeFileSync(path, newContent);

console.log('✅ 修复已应用');
console.log('📍 在eventLayoutNodes.map前添加了1949年事件检查');
console.log('🔧 重新运行: npm run build');
