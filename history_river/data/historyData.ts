import { Dynasty, HistoricalEvent } from '../types';

// Major Dynasties and Periods - Colors optimized for Light Background
export const DYNASTIES: Dynasty[] = [
    { id: 'xia', name: 'Xia', chineseName: '夏', startYear: -2070, endYear: -1600, color: '#57534e', description: '中国史书中记载的第一个世袭制朝代。' },
    { id: 'shang', name: 'Shang', chineseName: '商', startYear: -1600, endYear: -1046, color: '#b45309', description: '青铜器与甲骨文的鼎盛时期。' },
    { id: 'zhou_west', name: 'Western Zhou', chineseName: '西周', startYear: -1046, endYear: -771, color: '#4d7c0f', description: '礼乐制度奠定，宗法分封。' },
    { id: 'zhou_east', name: 'Eastern Zhou', chineseName: '东周', startYear: -770, endYear: -256, color: '#84cc16', description: '王室东迁，诸侯争霸，思想繁荣。' },
    { id: 'spring_autumn', name: 'Spring and Autumn', chineseName: '春秋', startYear: -770, endYear: -403, color: '#22c55e', description: '诸侯争霸，礼崩乐坏，百家争鸣肇始。' },
    { id: 'ws_qi', name: 'Qi', chineseName: '齐', startYear: -403, endYear: -221, color: '#10b981', description: '战国七雄之一，临淄繁盛。' },
    { id: 'ws_chu', name: 'Chu', chineseName: '楚', startYear: -403, endYear: -223, color: '#9333ea', description: '战国七雄之一，荆楚文化。' },
    { id: 'ws_yan', name: 'Yan', chineseName: '燕', startYear: -403, endYear: -222, color: '#3b82f6', description: '战国七雄之一，幽燕之地。' },
    { id: 'ws_han', name: 'HanState', chineseName: '韩', startYear: -403, endYear: -230, color: '#f59e0b', description: '战国七雄之一，三晋之一。' },
    { id: 'ws_zhao', name: 'Zhao', chineseName: '赵', startYear: -403, endYear: -228, color: '#14b8a6', description: '战国七雄之一，胡服骑射。' },
    { id: 'ws_wei', name: 'WeiState', chineseName: '魏', startYear: -403, endYear: -225, color: '#f97316', description: '战国七雄之一，三晋之一。' },
    { id: 'ws_qin', name: 'QinState', chineseName: '秦（战国）', startYear: -403, endYear: -221, color: '#ef4444', description: '战国七雄之一，终统一六国。' },
    { id: 'qin', name: 'Qin', chineseName: '秦', startYear: -221, endYear: -206, color: '#1c1917', description: '第一个大一统帝国，修筑长城，统一度量衡。' },
    { id: 'han_west', name: 'Western Han', chineseName: '西汉', startYear: -202, endYear: 9, color: '#ef4444', description: '汉初至王莽新朝之前，中国古代文明高峰之一。' },
    { id: 'xin', name: 'Xin', chineseName: '新', startYear: 9, endYear: 25, color: '#f43f5e', description: '王莽建立的新朝，短暂改制与动荡。' },
    { id: 'han_east', name: 'Eastern Han', chineseName: '东汉', startYear: 25, endYear: 220, color: '#dc2626', description: '光武中兴至汉末，科技与文化继续发展。' },
    { id: 'threekingdoms_wei', name: 'Wei', chineseName: '魏', startYear: 220, endYear: 265, color: '#2563eb', description: '三国时期：曹魏政权。' }, // Blue 600
    { id: 'threekingdoms_shu', name: 'Shu', chineseName: '蜀', startYear: 221, endYear: 263, color: '#16a34a', description: '三国时期：蜀汉政权。' }, // Green 600
    { id: 'threekingdoms_wu', name: 'Wu', chineseName: '吴', startYear: 222, endYear: 280, color: '#d97706', description: '三国时期：东吴政权。' }, // Amber 600
    { id: 'jin', name: 'Jin', chineseName: '晋', startYear: 266, endYear: 420, color: '#9333ea', description: '短暂统一后陷入长期分裂与战乱。' }, // Purple 600
    { id: 'liu_song', name: 'LiuSong', chineseName: '刘宋', startYear: 420, endYear: 479, color: '#10b981', description: '南朝刘宋。' }, // Emerald 500
    { id: 'southern_qi', name: 'SouthernQi', chineseName: '南齐', startYear: 479, endYear: 502, color: '#22c55e', description: '南朝南齐。' }, // Green 500
    { id: 'liang', name: 'Liang', chineseName: '梁', startYear: 502, endYear: 557, color: '#a855f7', description: '南朝梁。' }, // Purple 500
    { id: 'chen', name: 'Chen', chineseName: '陈', startYear: 557, endYear: 589, color: '#f59e0b', description: '南朝陈。' }, // Amber 500
    { id: 'northern_wei', name: 'NorthernWei', chineseName: '北魏', startYear: 386, endYear: 535, color: '#14b8a6', description: '北朝北魏。' }, // Teal 500
    { id: 'eastern_wei', name: 'EasternWei', chineseName: '东魏', startYear: 534, endYear: 550, color: '#06b6d4', description: '北朝东魏。' }, // Cyan 500
    { id: 'western_wei', name: 'WesternWei', chineseName: '西魏', startYear: 535, endYear: 557, color: '#0ea5e9', description: '北朝西魏。' }, // Sky 500
    { id: 'northern_qi', name: 'NorthernQi', chineseName: '北齐', startYear: 550, endYear: 577, color: '#f97316', description: '北朝北齐。' }, // Orange 500
    { id: 'northern_zhou', name: 'NorthernZhou', chineseName: '北周', startYear: 557, endYear: 581, color: '#3b82f6', description: '北朝北周。' }, // Blue 500
    { id: 'sui', name: 'Sui', chineseName: '隋', startYear: 581, endYear: 618, color: '#0891b2', description: '结束分裂，开凿大运河，开创科举。' }, // Cyan 600
    { id: 'tang', name: 'Tang', chineseName: '唐', startYear: 618, endYear: 907, color: '#ea580c', description: '万国来朝，诗歌与艺术的巅峰。' },
    { id: 'five_later_liang', name: 'Later Liang', chineseName: '后梁', startYear: 907, endYear: 923, color: '#f87171', description: '朱温建国，五代开端。' },
    { id: 'five_later_tang', name: 'Later Tang', chineseName: '后唐', startYear: 923, endYear: 936, color: '#fb7185', description: '沙陀政权，短期中原统一。' },
    { id: 'five_later_jin', name: 'Later Jin', chineseName: '后晋', startYear: 936, endYear: 947, color: '#f59e0b', description: '石敬瑭称帝，割燕云十六州于契丹。' },
    { id: 'five_later_han', name: 'Later Han', chineseName: '后汉', startYear: 947, endYear: 951, color: '#10b981', description: '刘知远建立，国祚短促。' },
    { id: 'five_later_zhou', name: 'Later Zhou', chineseName: '后周', startYear: 951, endYear: 960, color: '#3b82f6', description: '郭威建立，周世宗改革强兵。' },
    { id: 'ten_wu', name: 'Wu', chineseName: '吴', startYear: 902, endYear: 937, color: '#84cc16', description: '江淮地区割据政权，后为南唐所取代。' },
    { id: 'ten_southern_tang', name: 'SouthernTang', chineseName: '南唐', startYear: 937, endYear: 975, color: '#f97316', description: '李昪建国，承接吴，后为宋所灭。' },
    { id: 'ten_former_shu', name: 'FormerShu', chineseName: '前蜀', startYear: 907, endYear: 925, color: '#a855f7', description: '王建建国，后为后唐所灭。' },
    { id: 'ten_later_shu', name: 'LaterShu', chineseName: '后蜀', startYear: 934, endYear: 965, color: '#8b5cf6', description: '孟知祥建国，宋初收复巴蜀。' },
    { id: 'ten_min', name: 'Min', chineseName: '闽', startYear: 909, endYear: 945, color: '#06b6d4', description: '福建割据政权，后内乱亡。' },
    { id: 'ten_chu', name: 'Chu', chineseName: '楚', startYear: 907, endYear: 951, color: '#14b8a6', description: '湘地割据，后并入南唐或周。' },
    { id: 'ten_southern_han', name: 'SouthernHan', chineseName: '南汉', startYear: 917, endYear: 971, color: '#1d4ed8', description: '岭南割据，后为宋所平。' },
    { id: 'ten_wuyue', name: 'Wuyue', chineseName: '吴越', startYear: 907, endYear: 978, color: '#22c55e', description: '钱氏据江浙，宋初纳土归朝。' },
    { id: 'ten_jingnan', name: 'Jingnan', chineseName: '荆南', startYear: 924, endYear: 963, color: '#f43f5e', description: '江陵小国，后并入宋。' },
    { id: 'ten_northern_han', name: 'NorthernHan', chineseName: '北汉', startYear: 951, endYear: 979, color: '#64748b', description: '并州割据，宋太宗并之。' },
    { id: 'northern_song', name: 'Northern Song', chineseName: '北宋', startYear: 960, endYear: 1127, color: '#059669', description: '经济繁荣，科技井喷（火药、指南针、活字印刷）。' },
    { id: 'southern_song', name: 'Southern Song', chineseName: '南宋', startYear: 1127, endYear: 1279, color: '#10b981', description: '南渡偏安，经济重心南移，海上丝绸之路繁荣。' },
    { id: 'yuan', name: 'Yuan', chineseName: '元', startYear: 1271, endYear: 1368, color: '#4f46e5', description: '蒙古统治，疆域辽阔，东西方交流频繁。' }, // Indigo 600
    { id: 'ming', name: 'Ming', chineseName: '明', startYear: 1368, endYear: 1644, color: '#b91c1c', description: '汉族光复，修故宫，郑和下西洋。' }, // Red 700
    { id: 'qing', name: 'Qing', chineseName: '清', startYear: 1636, endYear: 1912, color: '#1e40af', description: '最后的封建王朝，奠定现代中国版图。' },
    { id: 'shun', name: 'Shun', chineseName: '大顺', startYear: 1644, endYear: 1645, color: '#be123c', description: '李自成建立的短暂政权。' }, // Rose 700
    { id: 'roc', name: 'Republic', chineseName: '中华民国', startYear: 1912, endYear: 1949, color: '#0284c7', description: '帝制结束，共和开启。' }, // Sky 600
    { id: 'prc', name: 'PRC', chineseName: '中华人民共和国', startYear: 1949, endYear: 2025, color: '#e11d48', description: '中华人民共和国，走向复兴。' }, // Rose 600
];

// Key historical markers
// Importance: 1 (Critical), 2 (Major), 3 (Significant), 4 (Cultural/Detail), 5 (Minor/Specific)
export const KEY_EVENTS: HistoricalEvent[] = [
    // --- 上古/夏商周 ---
    { year: -2070, title: '夏朝建立', titleEn: 'Xia Dynasty Established', type: 'politics', importance: 1 },
    { year: -1600, title: '鸣条之战 (商汤灭夏)', titleEn: 'Battle of Mingtiao', type: 'war', importance: 2 },
    { year: -1300, title: '盘庚迁殷', titleEn: 'Pan Geng Moves to Yin', type: 'politics', importance: 3 },
    { year: -1250, title: '武丁中兴', titleEn: 'Wu Ding\'s Prosperity', type: 'politics', importance: 4 },
    { year: -1046, title: '牧野之战 (武王伐纣)', titleEn: 'Battle of Muye', type: 'war', importance: 1 },
    { year: -1042, title: '周公摄政', titleEn: 'Duke of Zhou Regency', type: 'politics', importance: 4 },
    { year: -841, title: '国人暴动 (共和元年)', titleEn: 'Gonghe Regency', type: 'politics', importance: 2 },
    { year: -771, title: '犬戎攻破镐京', titleEn: 'Quanrong Sacks Haojing', type: 'war', importance: 2 },
    { year: -770, title: '平王东迁（东周始）', titleEn: 'King Ping Moves East', type: 'politics', importance: 2 },
    { year: -685, title: '齐桓公称霸', titleEn: 'Duke Huan Hegemony', type: 'politics', importance: 4 },
    { year: -632, title: '城濮之战', titleEn: 'Battle of Chengpu', type: 'war', importance: 4 },
    { year: -551, title: '孔子诞生', titleEn: 'Birth of Confucius', type: 'culture', importance: 1 },
    { year: -512, title: '孙武著《孙子兵法》', titleEn: 'Sun Tzu writes Art of War', type: 'culture', importance: 3 },
    { year: -486, title: '夫差开凿邗沟', titleEn: 'Fuchai Digs Han Canal', type: 'science', importance: 5 },
    { year: -403, title: '三家分晋', titleEn: 'Partition of Jin', type: 'politics', importance: 2 },
    { year: -356, title: '商鞅变法', titleEn: 'Shang Yang Reform', type: 'politics', importance: 2 },
    { year: -307, title: '赵武灵王胡服骑射', titleEn: 'Zhao Wuling King Reform', type: 'war', importance: 4 },
    { year: -278, title: '屈原投江', titleEn: 'Qu Yuan Drowns', type: 'culture', importance: 3 },
    { year: -260, title: '长平之战', titleEn: 'Battle of Changping', type: 'war', importance: 2 },
    { year: -256, title: '李冰修筑都江堰', titleEn: 'Construction of Dujiangyan', type: 'science', importance: 3 },
    { year: -256, title: '东周灭亡（周赧王亡周）', titleEn: 'Fall of Eastern Zhou', type: 'politics', importance: 2 },
    { year: -227, title: '荆轲刺秦王', titleEn: 'Jing Ke Assassinates Qin King', type: 'politics', importance: 4 },
    { year: -230, title: '秦灭韩', titleEn: 'Qin Conquers Han', type: 'war', importance: 2 },
    { year: -228, title: '秦灭赵', titleEn: 'Qin Conquers Zhao', type: 'war', importance: 2 },
    { year: -225, title: '秦灭魏', titleEn: 'Qin Conquers Wei', type: 'war', importance: 2 },
    { year: -223, title: '秦攻楚（郢陷）', titleEn: 'Qin Conquers Chu', type: 'war', importance: 2 },
    { year: -222, title: '秦灭燕', titleEn: 'Qin Conquers Yan', type: 'war', importance: 2 },
    { year: -221, title: '秦灭齐 • 统一六国', titleEn: 'Unification of China', type: 'war', importance: 1 },

    // --- 秦汉 ---
    { year: -221, title: '秦始皇统一六国', titleEn: 'Qin Shi Huang Unifies China', type: 'politics', importance: 1 },
    { year: -214, title: '修筑灵渠', titleEn: 'Construction of Lingqu Canal', type: 'science', importance: 5 },
    { year: -213, title: '焚书坑儒', titleEn: 'Burning of Books', type: 'culture', importance: 3 },
    { year: -210, title: '秦始皇驾崩', titleEn: 'Death of Qin Shi Huang', type: 'politics', importance: 2 },
    { year: -209, title: '陈胜吴广起义', titleEn: 'Dazexiang Uprising', type: 'war', importance: 3 },
    { year: -202, title: '汉朝建立', titleEn: 'Han Dynasty Established', type: 'politics', importance: 1 },
    { year: -154, title: '七国之乱', titleEn: 'Rebellion of the Seven States', type: 'war', importance: 4 },
    { year: -138, title: '张骞出使西域', titleEn: 'Zhang Qian\'s Mission to West', type: 'politics', importance: 2 },
    { year: -119, title: '漠北之战', titleEn: 'Battle of Mobei', type: 'war', importance: 3 },
    { year: -104, title: '太初历颁布', titleEn: 'Taichu Calendar', type: 'science', importance: 5 },
    { year: -91, title: '司马迁完成《史记》', titleEn: 'Sima Qian Completes Shiji', type: 'culture', importance: 2 },
    { year: -60, title: '西域都护府设立', titleEn: 'Protectorate of the Western Regions', type: 'politics', importance: 3 },
    { year: 9, title: '王莽篡汉', titleEn: 'Wang Mang Usurps Han', type: 'politics', importance: 3 },
    { year: 25, title: '光武中兴', titleEn: 'Restoration of Han', type: 'politics', importance: 2 },
    { year: 68, title: '白马寺建立(佛教传入)', titleEn: 'White Horse Temple Founded', type: 'culture', importance: 4 },
    { year: 91, title: '勒石燕然', titleEn: 'Inscription at Yanran', type: 'war', importance: 4 },
    { year: 100, title: '许慎《说文解字》', titleEn: 'Xu Shen writes Shuowen Jiezi', type: 'culture', importance: 5 },
    { year: 105, title: '蔡伦改进造纸术', titleEn: 'Cai Lun Improves Papermaking', type: 'science', importance: 1 },
    { year: 132, title: '张衡发明地动仪', titleEn: 'Zhang Heng Seismoscope', type: 'science', importance: 3 },
    { year: 184, title: '黄巾起义', titleEn: 'Yellow Turban Rebellion', type: 'war', importance: 2 },
    { year: 189, title: '董卓进京', titleEn: 'Dong Zhuo Enters Capital', type: 'politics', importance: 4 },

    // --- 三国两晋南北朝 ---
    { year: 200, title: '官渡之战', titleEn: 'Battle of Guandu', type: 'war', importance: 3 },
    { year: 208, title: '赤壁之战', titleEn: 'Battle of Red Cliffs', type: 'war', importance: 1 },
    { year: 220, title: '曹丕称帝', titleEn: 'Cao Pi Proclaims Emperor', type: 'politics', importance: 2 },
    { year: 222, title: '夷陵之战', titleEn: 'Battle of Yiling', type: 'war', importance: 3 },
    { year: 227, title: '诸葛亮出师表', titleEn: 'Zhuge Liang\'s Chu Shi Biao', type: 'politics', importance: 5 },
    { year: 263, title: '魏灭蜀', titleEn: 'Wei Conquers Shu', type: 'war', importance: 3 },
    { year: 266, title: '司马炎建晋', titleEn: 'Sima Yan Establishes Jin', type: 'politics', importance: 2 },
    { year: 291, title: '八王之乱', titleEn: 'War of the Eight Princes', type: 'war', importance: 3 },
    { year: 316, title: '五胡乱华', titleEn: 'Uprising of the Five Barbarians', type: 'war', importance: 2 },
    { year: 353, title: '王羲之《兰亭集序》', titleEn: 'Wang Xizhi\'s Lantingji Xu', type: 'culture', importance: 3 },
    { year: 366, title: '莫高窟开凿', titleEn: 'Construction of Mogao Caves', type: 'culture', importance: 4 },
    { year: 383, title: '淝水之战', titleEn: 'Battle of Feishui', type: 'war', importance: 2 },
    { year: 420, title: '刘裕代晋', titleEn: 'Liu Yu Replaces Jin', type: 'politics', importance: 3 },
    { year: 446, title: '太武帝灭佛', titleEn: 'Emperor Taiwu Persecutes Buddhism', type: 'politics', importance: 5 },
    { year: 462, title: '祖冲之计算圆周率', titleEn: 'Zu Chongzhi Calculates Pi', type: 'science', importance: 3 },
    { year: 493, title: '北魏孝文帝迁都', titleEn: 'Emperor Xiaowen Moves Capital', type: 'politics', importance: 3 },
    { year: 554, title: '西魏攻江陵', titleEn: 'Western Wei Attacks Jiangling', type: 'war', importance: 5 },

    // --- 隋唐五代 ---
    { year: 589, title: '隋灭陈/统一全国', titleEn: 'Sui Unifies China', type: 'war', importance: 1 },
    { year: 604, title: '隋炀帝登基', titleEn: 'Emperor Yang of Sui Enthronement', type: 'politics', importance: 2 },
    { year: 605, title: '开凿大运河', titleEn: 'Construction of Grand Canal', type: 'science', importance: 2 },
    { year: 605, title: '赵州桥建成', titleEn: 'Zhaozhou Bridge Built', type: 'science', importance: 4 },
    { year: 618, title: '江都兵变', titleEn: 'Jiangdu Mutiny', type: 'war', importance: 2 },
    { year: 618, title: '唐朝建立', titleEn: 'Tang Dynasty Established', type: 'politics', importance: 1 },
    { year: 626, title: '玄武门之变', titleEn: 'Xuanwu Gate Incident', type: 'politics', importance: 2 },
    { year: 629, title: '玄奘西行', titleEn: 'Xuanzang\'s Journey to West', type: 'culture', importance: 2 },
    { year: 641, title: '文成公主入藏', titleEn: 'Princess Wencheng to Tibet', type: 'politics', importance: 3 },
    { year: 690, title: '武则天称帝', titleEn: 'Wu Zetian Proclaims Emperor', type: 'politics', importance: 1 },
    { year: 701, title: '李白出生', titleEn: 'Birth of Li Bai', type: 'culture', importance: 4 },
    { year: 712, title: '杜甫出生', titleEn: 'Birth of Du Fu', type: 'culture', importance: 4 },
    { year: 713, title: '开元盛世', titleEn: 'Kaiyuan Era', type: 'politics', importance: 3 },
    { year: 755, title: '安史之乱', titleEn: 'An Lushan Rebellion', type: 'war', importance: 1 },
    { year: 780, title: '两税法实施', titleEn: 'Two-Tax Law Implemented', type: 'politics', importance: 4 },
    { year: 868, title: '《金刚经》雕版印刷', titleEn: 'Diamond Sutra Printed', type: 'culture', importance: 3 },
    { year: 878, title: '黄巢起义', titleEn: 'Huang Chao Rebellion', type: 'war', importance: 3 },
    { year: 907, title: '唐亡', titleEn: 'Fall of Tang', type: 'politics', importance: 2 },
    { year: 907, title: '五代十国开始', titleEn: 'Start of Five Dynasties', type: 'politics', importance: 2 },
    { year: 923, title: '后唐建立', titleEn: 'Later Tang Established', type: 'politics', importance: 3 },
    { year: 936, title: '后晋建立', titleEn: 'Later Jin Established', type: 'politics', importance: 3 },
    { year: 938, title: '燕云十六州割让契丹', titleEn: '16 Prefectures Ceded to Khitan', type: 'politics', importance: 2 },
    { year: 947, title: '后晋亡/辽入中原', titleEn: 'Fall of Later Jin', type: 'war', importance: 4 },
    { year: 951, title: '后周建立', titleEn: 'Later Zhou Established', type: 'politics', importance: 3 },
    { year: 902, title: '杨吴形成', titleEn: 'Wu Established', type: 'politics', importance: 4 },
    { year: 937, title: '南唐取代吴', titleEn: 'Southern Tang Replaces Wu', type: 'politics', importance: 4 },
    { year: 907, title: '前蜀建国', titleEn: 'Former Shu Established', type: 'politics', importance: 4 },
    { year: 925, title: '后唐灭前蜀', titleEn: 'Later Tang Conquers Former Shu', type: 'war', importance: 4 },
    { year: 934, title: '后蜀建国', titleEn: 'Later Shu Established', type: 'politics', importance: 4 },
    { year: 965, title: '宋平定后蜀', titleEn: 'Song Conquers Later Shu', type: 'war', importance: 3 },
    { year: 909, title: '闽国建立', titleEn: 'Min Established', type: 'politics', importance: 5 },
    { year: 945, title: '闽国灭亡', titleEn: 'Fall of Min', type: 'war', importance: 5 },
    { year: 917, title: '南汉建立', titleEn: 'Southern Han Established', type: 'politics', importance: 4 },
    { year: 971, title: '宋平定南汉', titleEn: 'Song Conquers Southern Han', type: 'war', importance: 3 },
    { year: 907, title: '吴越建立', titleEn: 'Wuyue Established', type: 'politics', importance: 4 },
    { year: 978, title: '吴越纳土归宋', titleEn: 'Wuyue Submits to Song', type: 'politics', importance: 3 },
    { year: 924, title: '荆南建立', titleEn: 'Jingnan Established', type: 'politics', importance: 5 },
    { year: 963, title: '荆南并入宋', titleEn: 'Jingnan Merged into Song', type: 'politics', importance: 5 },
    { year: 951, title: '北汉建立', titleEn: 'Northern Han Established', type: 'politics', importance: 4 },
    { year: 979, title: '宋灭北汉（五代十国终结）', titleEn: 'Song Conquers Northern Han', type: 'war', importance: 2 },
    // 唐历代帝王登基
    { year: 618, title: '唐高祖登基', titleEn: 'Emperor Gaozu of Tang', type: 'politics', importance: 2 },
    { year: 626, title: '唐太宗登基', titleEn: 'Emperor Taizong of Tang', type: 'politics', importance: 2 },
    { year: 649, title: '唐高宗登基', titleEn: 'Emperor Gaozong of Tang', type: 'politics', importance: 3 },
    { year: 684, title: '唐中宗首次即位', titleEn: 'Emperor Zhongzong 1st Reign', type: 'politics', importance: 3 },
    { year: 684, title: '唐睿宗首次即位', titleEn: 'Emperor Ruizong 1st Reign', type: 'politics', importance: 3 },
    { year: 705, title: '唐中宗复位', titleEn: 'Emperor Zhongzong Restored', type: 'politics', importance: 3 },
    { year: 710, title: '唐睿宗复位', titleEn: 'Emperor Ruizong Restored', type: 'politics', importance: 3 },
    { year: 712, title: '唐玄宗登基', titleEn: 'Emperor Xuanzong of Tang', type: 'politics', importance: 2 },
    { year: 756, title: '唐肃宗登基', titleEn: 'Emperor Suzong of Tang', type: 'politics', importance: 3 },
    { year: 762, title: '唐代宗登基', titleEn: 'Emperor Daizong of Tang', type: 'politics', importance: 3 },
    { year: 779, title: '唐德宗登基', titleEn: 'Emperor Dezong of Tang', type: 'politics', importance: 3 },
    { year: 805, title: '唐顺宗登基', titleEn: 'Emperor Shunzong of Tang', type: 'politics', importance: 4 },
    { year: 805, title: '唐宪宗登基', titleEn: 'Emperor Xianzong of Tang', type: 'politics', importance: 3 },
    { year: 820, title: '唐穆宗登基', titleEn: 'Emperor Muzong of Tang', type: 'politics', importance: 4 },
    { year: 824, title: '唐敬宗登基', titleEn: 'Emperor Jingzong of Tang', type: 'politics', importance: 4 },
    { year: 827, title: '唐文宗登基', titleEn: 'Emperor Wenzong of Tang', type: 'politics', importance: 4 },
    { year: 840, title: '唐武宗登基', titleEn: 'Emperor Wuzong of Tang', type: 'politics', importance: 4 },
    { year: 846, title: '唐宣宗登基', titleEn: 'Emperor Xuanzong II of Tang', type: 'politics', importance: 4 },
    { year: 859, title: '唐懿宗登基', titleEn: 'Emperor Yizong of Tang', type: 'politics', importance: 4 },
    { year: 873, title: '唐僖宗登基', titleEn: 'Emperor Xizong of Tang', type: 'politics', importance: 4 },
    { year: 888, title: '唐昭宗登基', titleEn: 'Emperor Zhaozong of Tang', type: 'politics', importance: 3 },
    { year: 904, title: '唐哀帝登基', titleEn: 'Emperor Ai of Tang', type: 'politics', importance: 3 },

    // --- 宋元 ---
    { year: 960, title: '宋朝建立', titleEn: 'Song Dynasty Established', type: 'politics', importance: 1 },
    { year: 960, title: '陈桥兵变（赵匡胤即位）', titleEn: 'Chenqiao Mutiny', type: 'politics', importance: 2 },
    { year: 1004, title: '澶渊之盟', titleEn: 'Treaty of Chanyuan', type: 'politics', importance: 3 },
    { year: 1023, title: '交子(纸币)出现', titleEn: 'Jiaozi (Paper Money) Appears', type: 'science', importance: 3 },
    { year: 1041, title: '毕昇发明活字印刷', titleEn: 'Bi Sheng invents Moveable Type', type: 'science', importance: 1 },
    { year: 1044, title: '《武经总要》火药配方', titleEn: 'Wujing Zongyao Gunpowder', type: 'science', importance: 4 },
    { year: 1069, title: '王安石变法', titleEn: 'Wang Anshi Reforms', type: 'politics', importance: 3 },
    { year: 1084, title: '《资治通鉴》成书', titleEn: 'Zizhi Tongjian Completed', type: 'culture', importance: 4 },
    { year: 1101, title: '苏轼逝世', titleEn: 'Death of Su Shi', type: 'culture', importance: 5 },
    { year: 1115, title: '金国建立', titleEn: 'Jin Dynasty Established', type: 'politics', importance: 4 },
    { year: 1127, title: '靖康之变', titleEn: 'Jingkang Incident', type: 'war', importance: 1 },
    { year: 1140, title: '岳飞北伐', titleEn: 'Yue Fei\'s Northern Expeditions', type: 'war', importance: 2 },
    { year: 1206, title: '成吉思汗统一蒙古', titleEn: 'Genghis Khan Unifies Mongols', type: 'politics', importance: 1 },
    { year: 1271, title: '忽必烈改国号为元', titleEn: 'Kublai Khan Establishes Yuan', type: 'politics', importance: 2 },
    { year: 1274, title: '元军东征日本', titleEn: 'Mongol Invasions of Japan', type: 'war', importance: 5 },
    { year: 1279, title: '崖山海战', titleEn: 'Battle of Yamen', type: 'war', importance: 2 },
    { year: 1292, title: '马可波罗离开中国', titleEn: 'Marco Polo Leaves China', type: 'culture', importance: 3 },
    { year: 1300, title: '元曲兴盛', titleEn: 'Yuan Drama Flourishes', type: 'culture', importance: 4 },
    // 宋历代帝王登基（北宋/南宋）
    { year: 960, title: '宋太祖登基', titleEn: 'Emperor Taizu of Song', type: 'politics', importance: 2 },
    { year: 976, title: '宋太宗登基', titleEn: 'Emperor Taizong of Song', type: 'politics', importance: 2 },
    { year: 997, title: '宋真宗登基', titleEn: 'Emperor Zhenzong of Song', type: 'politics', importance: 3 },
    { year: 1022, title: '宋仁宗登基', titleEn: 'Emperor Renzong of Song', type: 'politics', importance: 2 },
    { year: 1063, title: '宋英宗登基', titleEn: 'Emperor Yingzong of Song', type: 'politics', importance: 4 },
    { year: 1067, title: '宋神宗登基', titleEn: 'Emperor Shenzong of Song', type: 'politics', importance: 3 },
    { year: 1085, title: '宋哲宗登基', titleEn: 'Emperor Zhezong of Song', type: 'politics', importance: 3 },
    { year: 1100, title: '宋徽宗登基', titleEn: 'Emperor Huizong of Song', type: 'politics', importance: 3 },
    { year: 1126, title: '宋钦宗登基', titleEn: 'Emperor Qinzong of Song', type: 'politics', importance: 3 },
    { year: 1127, title: '宋高宗登基', titleEn: 'Emperor Gaozong of Song', type: 'politics', importance: 2 },
    { year: 1162, title: '宋孝宗登基', titleEn: 'Emperor Xiaozong of Song', type: 'politics', importance: 3 },
    { year: 1189, title: '宋光宗登基', titleEn: 'Emperor Guangzong of Song', type: 'politics', importance: 4 },
    { year: 1194, title: '宋宁宗登基', titleEn: 'Emperor Ningzong of Song', type: 'politics', importance: 3 },
    { year: 1224, title: '宋理宗登基', titleEn: 'Emperor Lizong of Song', type: 'politics', importance: 3 },
    { year: 1264, title: '宋度宗登基', titleEn: 'Emperor Duzong of Song', type: 'politics', importance: 3 },
    { year: 1274, title: '宋恭宗登基', titleEn: 'Emperor Gong of Song', type: 'politics', importance: 4 },
    { year: 1276, title: '宋端宗登基', titleEn: 'Emperor Duanzong of Song', type: 'politics', importance: 4 },
    { year: 1278, title: '宋祥兴帝登基', titleEn: 'Emperor Bing of Song', type: 'politics', importance: 3 },
    // 元历代帝王登基
    { year: 1260, title: '元世祖忽必烈即位', titleEn: 'Kublai Khan (Shizu)', type: 'politics', importance: 2 },
    { year: 1294, title: '元成宗即位', titleEn: 'Temür Khan (Chengzong)', type: 'politics', importance: 3 },
    { year: 1307, title: '元武宗即位', titleEn: 'Külüg Khan (Wuzong)', type: 'politics', importance: 4 },
    { year: 1311, title: '元仁宗即位', titleEn: 'Ayurbarwada Buyantu Khan (Renzong)', type: 'politics', importance: 4 },
    { year: 1320, title: '元英宗即位', titleEn: 'Gegeen Khan (Yingzong)', type: 'politics', importance: 4 },
    { year: 1323, title: '元泰定帝即位', titleEn: 'Yesün Temür (Taiding)', type: 'politics', importance: 4 },
    { year: 1328, title: '元文宗即位', titleEn: 'Jayaatu Khan (Wenzong)', type: 'politics', importance: 4 },
    { year: 1329, title: '元明宗即位', titleEn: 'Khutughtu Khan (Mingzong)', type: 'politics', importance: 4 },
    { year: 1332, title: '元宁宗即位', titleEn: 'Rinchinbal Khan (Ningzong)', type: 'politics', importance: 4 },
    { year: 1333, title: '元顺帝即位', titleEn: 'Toghon Temür (Shundi)', type: 'politics', importance: 3 },

    // --- 明清 ---
    { year: 1368, title: '明朝建立', titleEn: 'Ming Dynasty Established', type: 'war', importance: 1 },
    { year: 1403, title: '永乐大典编撰', titleEn: 'Yongle Encyclopedia', type: 'culture', importance: 3 },
    { year: 1405, title: '郑和下西洋', titleEn: 'Zheng He\'s Voyages', type: 'culture', importance: 2 },
    { year: 1420, title: '紫禁城建成', titleEn: 'Forbidden City Completed', type: 'culture', importance: 2 },
    { year: 1449, title: '土木堡之变', titleEn: 'Tumu Crisis', type: 'war', importance: 3 },
    { year: 1517, title: '王阳明心学兴起', titleEn: 'Wang Yangming\'s School of Mind', type: 'culture', importance: 4 },
    { year: 1561, title: '戚继光抗倭', titleEn: 'Qi Jiguang fights Wokou', type: 'war', importance: 3 },
    { year: 1578, title: '李时珍完成《本草纲目》', titleEn: 'Li Shizhen completes Bencao Gangmu', type: 'science', importance: 2 },
    { year: 1587, title: '海瑞逝世', titleEn: 'Death of Hai Rui', type: 'politics', importance: 5 },
    { year: 1592, title: '万历朝鲜之役', titleEn: 'Imjin War', type: 'war', importance: 4 },
    { year: 1598, title: '《牡丹亭》问世', titleEn: 'Peony Pavilion Published', type: 'culture', importance: 5 },
    { year: 1616, title: '努尔哈赤建后金', titleEn: 'Nurhaci establishes Later Jin', type: 'politics', importance: 3 },
    { year: 1637, title: '《天工开物》刊行', titleEn: 'Tiangong Kaiwu Published', type: 'science', importance: 4 },
    { year: 1644, title: '清军入关', titleEn: 'Qing Enters Pass', type: 'war', importance: 1 },
    { year: 1661, title: '郑成功收复台湾', titleEn: 'Koxinga Recovers Taiwan', type: 'war', importance: 2 },
    { year: 1683, title: '清朝统一台湾', titleEn: 'Qing Annexes Taiwan', type: 'politics', importance: 3 },
    { year: 1723, title: '雍正登基', titleEn: 'Yongzheng Reign', type: 'politics', importance: 4 },
    { year: 1750, title: '京剧雏形诞生', titleEn: 'Peking Opera Origins', type: 'culture', importance: 5 },
    { year: 1784, title: '乾隆南巡', titleEn: 'Qianlong\'s Southern Tour', type: 'culture', importance: 3 },
    { year: 1790, title: '徽班进京', titleEn: 'Huiban Enters Beijing', type: 'culture', importance: 3 },
    { year: 1792, title: '《红楼梦》刊行', titleEn: 'Dream of the Red Chamber', type: 'culture', importance: 4 },
    { year: 1839, title: '虎门销烟', titleEn: 'Destruction of Opium at Humen', type: 'politics', importance: 2 },
    { year: 1840, title: '第一次鸦片战争', titleEn: 'First Opium War', type: 'war', importance: 1 },
    { year: 1851, title: '太平天国运动', titleEn: 'Taiping Rebellion', type: 'war', importance: 2 },
    { year: 1860, title: '火烧圆明园', titleEn: 'Burning of Old Summer Palace', type: 'war', importance: 2 },
    { year: 1861, title: '洋务运动开始', titleEn: 'Self-Strengthening Movement', type: 'politics', importance: 3 },
    { year: 1872, title: '《申报》创刊', titleEn: 'Shen Bao Founded', type: 'culture', importance: 4 },
    { year: 1888, title: '北洋水师成立', titleEn: 'Beiyang Fleet Established', type: 'war', importance: 4 },
    { year: 1894, title: '甲午海战', titleEn: 'First Sino-Japanese War', type: 'war', importance: 2 },
    { year: 1895, title: '公车上书', titleEn: 'Gongche Shangshu Movement', type: 'politics', importance: 4 },
    { year: 1898, title: '戊戌变法', titleEn: 'Hundred Days\' Reform', type: 'politics', importance: 3 },
    { year: 1900, title: '八国联军侵华', titleEn: 'Boxer Rebellion', type: 'war', importance: 1 },
    { year: 1905, title: '废除科举', titleEn: 'Abolition of Imperial Exams', type: 'politics', importance: 3 },
    // 明历代帝王登基
    { year: 1368, title: '明太祖洪武登基', titleEn: 'Hongwu Emperor', type: 'politics', importance: 2 },
    { year: 1398, title: '明惠帝建文登基', titleEn: 'Jianwen Emperor', type: 'politics', importance: 3 },
    { year: 1402, title: '明成祖永乐登基', titleEn: 'Yongle Emperor', type: 'politics', importance: 2 },
    { year: 1424, title: '明仁宗洪熙登基', titleEn: 'Hongxi Emperor', type: 'politics', importance: 3 },
    { year: 1425, title: '明宣宗宣德登基', titleEn: 'Xuande Emperor', type: 'politics', importance: 2 },
    { year: 1435, title: '明英宗正统登基', titleEn: 'Zhengtong Emperor', type: 'politics', importance: 3 },
    { year: 1450, title: '明景帝景泰登基', titleEn: 'Jingtai Emperor', type: 'politics', importance: 4 },
    { year: 1457, title: '明英宗天顺复位', titleEn: 'Tianshun Emperor', type: 'politics', importance: 3 },
    { year: 1464, title: '明宪宗成化登基', titleEn: 'Chenghua Emperor', type: 'politics', importance: 3 },
    { year: 1487, title: '明孝宗弘治登基', titleEn: 'Hongzhi Emperor', type: 'politics', importance: 3 },
    { year: 1505, title: '明武宗正德登基', titleEn: 'Zhengde Emperor', type: 'politics', importance: 3 },
    { year: 1521, title: '明世宗嘉靖登基', titleEn: 'Jiajing Emperor', type: 'politics', importance: 2 },
    { year: 1567, title: '明穆宗隆庆登基', titleEn: 'Longqing Emperor', type: 'politics', importance: 3 },
    { year: 1572, title: '明神宗万历登基', titleEn: 'Wanli Emperor', type: 'politics', importance: 2 },
    { year: 1620, title: '明光宗泰昌登基', titleEn: 'Taichang Emperor', type: 'politics', importance: 4 },
    { year: 1620, title: '明熹宗天启登基', titleEn: 'Tianqi Emperor', type: 'politics', importance: 3 },
    { year: 1627, title: '明思宗崇祯登基', titleEn: 'Chongzhen Emperor', type: 'politics', importance: 2 },
    // 清历代帝王登基
    { year: 1644, title: '清世祖顺治登基', titleEn: 'Shunzhi Emperor', type: 'politics', importance: 2 },
    { year: 1661, title: '清圣祖康熙登基', titleEn: 'Kangxi Emperor', type: 'politics', importance: 2 },
    { year: 1722, title: '清世宗雍正登基', titleEn: 'Yongzheng Emperor', type: 'politics', importance: 2 },
    { year: 1735, title: '清高宗乾隆登基', titleEn: 'Qianlong Emperor', type: 'politics', importance: 2 },
    { year: 1796, title: '清仁宗嘉庆登基', titleEn: 'Jiaqing Emperor', type: 'politics', importance: 3 },
    { year: 1820, title: '清宣宗道光登基', titleEn: 'Daoguang Emperor', type: 'politics', importance: 3 },
    { year: 1850, title: '清文宗咸丰登基', titleEn: 'Xianfeng Emperor', type: 'politics', importance: 3 },
    { year: 1861, title: '清穆宗同治登基', titleEn: 'Tongzhi Emperor', type: 'politics', importance: 3 },
    { year: 1875, title: '清德宗光绪登基', titleEn: 'Guangxu Emperor', type: 'politics', importance: 3 },
    { year: 1908, title: '清宣统帝溥仪登基', titleEn: 'Xuantong Emperor (Puyi)', type: 'politics', importance: 2 },

    // --- 近现代 ---
    { year: 1911, title: '辛亥革命', titleEn: 'Xinhai Revolution', type: 'politics', importance: 1 },
    { year: 1912, title: '民国建立', titleEn: 'Republic of China Established', type: 'politics', importance: 2 },
    { year: 1915, title: '新文化运动', titleEn: 'New Culture Movement', type: 'politics', importance: 2 },
    { year: 1919, title: '五四运动', titleEn: 'May Fourth Movement', type: 'culture', importance: 1 },
    { year: 1921, title: '中国共产党成立', titleEn: 'CCP Founded', type: 'politics', importance: 1 },
    { year: 1924, title: '黄埔军校成立', titleEn: 'Whampoa Military Academy', type: 'war', importance: 3 },
    { year: 1927, title: '南昌起义', titleEn: 'Nanchang Uprising', type: 'war', importance: 3 },
    { year: 1931, title: '九一八事变', titleEn: 'Mukden Incident', type: 'war', importance: 2 },
    { year: 1935, title: '遵义会议', titleEn: 'Zunyi Conference', type: 'politics', importance: 3 },
    { year: 1937, title: '卢沟桥事变', titleEn: 'Marco Polo Bridge Incident', type: 'war', importance: 1 },
    { year: 1945, title: '抗日战争胜利', titleEn: 'Victory in War of Resistance', type: 'war', importance: 1 },
    { year: 1949, title: '新中国成立', titleEn: 'PRC Founded', type: 'politics', importance: 1 },
    { year: 1950, title: '抗美援朝', titleEn: 'Korean War', type: 'war', importance: 2 },
    { year: 1953, title: '第一个五年计划', titleEn: 'First Five-Year Plan', type: 'politics', importance: 4 },
    { year: 1964, title: '第一颗原子弹爆炸', titleEn: 'First Atomic Bomb Test', type: 'science', importance: 1 },
    { year: 1966, title: '文化大革命开始', titleEn: 'Cultural Revolution Begins', type: 'politics', importance: 2 },
    { year: 1970, title: '东方红一号卫星', titleEn: 'Dongfanghong-1 Satellite', type: 'science', importance: 2 },
    { year: 1971, title: '恢复联合国席位', titleEn: 'PRC Restores UN Seat', type: 'politics', importance: 1 },
    { year: 1972, title: '尼克松访华', titleEn: 'Nixon Visits China', type: 'politics', importance: 3 },
    { year: 1976, title: '唐山大地震', titleEn: 'Tangshan Earthquake', type: 'science', importance: 4 },
    { year: 1978, title: '改革开放', titleEn: 'Reform and Opening Up', type: 'politics', importance: 1 },
    { year: 1980, title: '深圳特区成立', titleEn: 'Shenzhen SEZ Established', type: 'politics', importance: 3 },
    { year: 1990, title: '上海证券交易所', titleEn: 'Shanghai Stock Exchange', type: 'politics', importance: 4 },
    { year: 1997, title: '香港回归', titleEn: 'Return of Hong Kong', type: 'politics', importance: 2 },
    { year: 1999, title: '澳门回归', titleEn: 'Return of Macau', type: 'politics', importance: 2 },
    { year: 2001, title: '加入WTO', titleEn: 'China Joins WTO', type: 'politics', importance: 2 },
    { year: 2003, title: '神舟五号', titleEn: 'Shenzhou 5', type: 'science', importance: 2 },
    { year: 2008, title: '北京奥运会', titleEn: 'Beijing Olympics', type: 'culture', importance: 2 },
    { year: 2010, title: '上海世博会', titleEn: 'Shanghai Expo', type: 'culture', importance: 3 },
    { year: 2012, title: '莫言获诺贝尔奖', titleEn: 'Mo Yan wins Nobel Prize', type: 'culture', importance: 4 },
    { year: 2013, title: '一带一路倡议', titleEn: 'Belt and Road Initiative', type: 'politics', importance: 3 },
    { year: 2022, title: '北京冬奥会', titleEn: 'Beijing Winter Olympics', type: 'culture', importance: 3 },
];

export const getDynastyPower = (d: Dynasty, year: number): number => {
    if (!d || !d.id) return 0;
    // Use a slight overlap to prevent zero-width gaps at transition years
    const overlap = 5;
    const extendedStart = d.startYear - overlap;
    const extendedEnd = d.endYear + overlap;

    if (year < extendedStart || year > extendedEnd) return 0;

    const span = extendedEnd - extendedStart;
    const progress = (year - extendedStart) / span;

    let power = 0;

    // Power shaping
    if (span < 20) {
        power = 1;
    } else {
        if (d.id === 'prc') {
            power = Math.pow(progress, 0.55);
            if (year >= d.startYear && year <= d.endYear) {
                power = Math.max(power, 0.45);
            }
        } else {
            power = Math.sin(progress * Math.PI);
            if (power > 0.5) {
                power = 0.5 + Math.pow((power - 0.5) * 2, 0.2) * 0.5;
            }
            if (year >= d.startYear && year <= d.endYear) {
                power = Math.max(power, 0.4);
            }
        }
    }

    let weight = 50;
    if (['tang', 'han_west', 'han_east', 'qing', 'yuan', 'prc', 'ming'].includes(d.id)) weight = 90;
    if (['song', 'sui'].includes(d.id)) weight = 70;
    if (['qin', 'shang', 'zhou_west', 'zhou_east'].includes(d.id)) weight = 60;
    if (['spring_autumn'].includes(d.id)) weight = 55;
    if (d.id.startsWith('ws_')) weight = 55;
    if (d.id.startsWith('five_')) weight = 60;
    if (d.id.startsWith('ten_')) weight = 55;
    if (d.id.startsWith('threekingdoms')) weight = 30;

    const result = power * weight;
    return isNaN(result) ? 0 : result;
};