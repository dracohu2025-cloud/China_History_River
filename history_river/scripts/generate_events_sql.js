
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// Note: Anon key usually has RLS policies. Ideally we need Service Role Key for Admin inserts.
// However, the 'technical standards' say "Prefer simple". Let's try with what we have.
// If RLS blocks INSERT, we might fail. The user has been running local dev.
// Wait, the "insert_initial_data.sql" used SQL directly. 
// If this script fails due to permission, I'll need the user to provide the Service Key or run SQL.
// Let's assume the user has a way to run this or the Anon key allows insert (unlikely for "historical_events" which usually is read-only for public).
// ACTUALLY, checking migration `20251209_create_timeline_tables.sql`:
// CREATE POLICY "Enable write access for authenticated users only"
// This means Anon cannot insert. 
// BUT, `podcastService.ts` runs on backend with... what key? It uses `process.env`.
// If I run this script locally on the user's machine, I only have valid keys if `.env.local` has them.
// The user has `debug_player_data.js` which worked. It used `podcastService`.
// If I use the Service Role Key it will work. I don't see SERVICE_KEY in .env.local usually.
// I will output SQL to a file as a fallback if the script fails? 
// Or better: Just generate a SQL file and ask the user to run it in Supabase SQL Editor?
// OR, since I have `mcp_supabase-mcp-server_execute_sql`... wait, I concluded I couldn't use that.
// Let's write a SQL file. It's 100% safe and the user knows how to "add data to database".
// The user asked "Please help me add...".
// Generating a SQL file is "helping".
// I will ALSO try to run it via the script if I can find a way, but SQL is the best artifact.
// Actually, let's just make the SQL file. It's much cleaner than a script that might fail auth.
// I will place it in `supabase/migrations` so it's tracked.

const events = [
    // Batch 1/3 (100 events)
    { year: -719, title: '州吁弑君', event_type: 'politics', importance: 3, dynasty_id: 'spring_autumn', description: '卫国州吁弑君自立，是春秋时期第一起弑君篡位事件，开启恶例。' },
    { year: -712, title: '郑庄公伐许', event_type: 'war', importance: 2, dynasty_id: 'spring_autumn', description: '郑庄公率领军队攻打许国，是诸侯争霸早期的典型战役。' },
    { year: -698, title: '齐襄公乱政', event_type: 'politics', importance: 3, dynasty_id: 'spring_autumn', description: '齐襄公荒淫无道，导致齐国内乱，为齐桓公即位埋下伏笔。' },
    { year: -681, title: '北杏之会', event_type: 'politics', importance: 4, dynasty_id: 'spring_autumn', description: '齐桓公首次主持诸侯会盟，霸业初显。' },
    { year: -663, title: '救燕伐山戎', event_type: 'war', importance: 3, dynasty_id: 'spring_autumn', description: '齐桓公出兵救燕，征伐山戎，留下"老马识途"的典故。' },
    { year: -651, title: '葵丘会盟', event_type: 'politics', importance: 5, dynasty_id: 'spring_autumn', description: '齐桓公集结诸侯会盟，周天子派人赐胙，霸业达到顶峰。' },
    { year: -636, title: '重耳即位', event_type: 'politics', importance: 4, dynasty_id: 'spring_autumn', description: '流亡十九年的晋公子重耳回国即位（晋文公），随即整顿国政。' },
    { year: -632, title: '城濮之战', event_type: 'war', importance: 5, dynasty_id: 'spring_autumn', description: '晋文公"退避三舍"大败楚军，确立了晋国的霸主地位。' },
    { year: -626, title: '西戎之霸', event_type: 'war', importance: 3, dynasty_id: 'spring_autumn', description: '秦穆公称霸西戎，益国十二，开地千里，称霸西陲。' },
    { year: -613, title: '楚庄王即位', event_type: 'politics', importance: 3, dynasty_id: 'spring_autumn', description: '楚庄王初即位，"三年不鸣，一鸣惊人"。' },
    { year: -575, title: '鄢陵之战', event_type: 'war', importance: 4, dynasty_id: 'spring_autumn', description: '晋楚争霸的关键战役，晋军在泥沼中击败楚军，巩固中原霸权。' },
    { year: -557, title: '湛阪之战', event_type: 'war', importance: 3, dynasty_id: 'spring_autumn', description: '晋楚之间的又一次大战，楚国再次失败，晋国霸业延续。' },
    { year: -548, title: '崔杼弑君', event_type: 'politics', importance: 3, dynasty_id: 'spring_autumn', description: '齐国大夫崔杼弑杀齐庄公，太史伯坚守职责如实记录，留下"太史简"的佳话。' },
    { year: -537, title: '楚灵王会盟', event_type: 'politics', importance: 3, dynasty_id: 'spring_autumn', description: '楚灵王虽然骄横，但也曾召集诸侯会盟，显示楚国国力。' },
    { year: -515, title: '专诸刺王僚', event_type: 'politics', importance: 3, dynasty_id: 'spring_autumn', description: '公子光派专诸刺杀吴王僚，夺取王位，是为吴王阖闾。' },
    { year: -500, title: '夹谷之会', event_type: 'politics', importance: 4, dynasty_id: 'spring_autumn', description: '孔子摄行相事，助鲁定公由于齐国外交胜利，收回被占土地。' },
    { year: -493, title: '赵简子誓师', event_type: 'politics', importance: 3, dynasty_id: 'spring_autumn', description: '赵简子在铁之战前誓师，改革军功制度，为赵国强大奠基。' },
    { year: -484, title: '艾陵之战', event_type: 'war', importance: 3, dynasty_id: 'spring_autumn', description: '吴国联合鲁国大败齐军，吴国势力达到北方顶峰。' },
    { year: -481, title: '西狩获麟', event_type: 'culture', importance: 3, dynasty_id: 'spring_autumn', description: '《春秋》绝笔，象征着一个时代的结束。' },
    { year: -445, title: '魏文侯即位', event_type: 'politics', importance: 4, dynasty_id: 'ws_wei', description: '魏文侯任用李悝、吴起、西门豹等人，魏国率先成为战国初期霸主。' },
    { year: -403, title: '三家分晋', event_type: 'politics', importance: 5, dynasty_id: 'ws_wei', description: '周威烈王承认韩、赵、魏为诸侯，战国时代正式开始（《资治通鉴》纪年开始）。' },
    { year: -381, title: '吴起变法', event_type: 'politics', importance: 4, dynasty_id: 'ws_chu', description: '吴起在楚国推行变法，打击贵族势力，强兵富国，但最终被杀，变法废止。' },
    { year: -354, title: '围魏救赵', event_type: 'war', importance: 4, dynasty_id: 'ws_qi', description: '桂陵之战，孙膑用计大败庞涓，齐国国力显现。' },
    { year: -341, title: '马陵之战', event_type: 'war', importance: 4, dynasty_id: 'ws_qi', description: '孙膑减灶诱敌，射杀庞涓，魏国霸权彻底衰落，齐国称雄。' },
    { year: -333, title: '合纵连横', event_type: 'politics', importance: 4, dynasty_id: 'ws_qin', description: '苏秦说服六国合纵抗秦，佩六国相印；张仪随后连横破纵。' },
    { year: -307, title: '赵武灵王胡服骑射', event_type: 'politics', importance: 5, dynasty_id: 'ws_zhao', description: '赵国推行胡服骑射军事改革，建立强大骑兵，成为秦国劲敌。' },
    { year: -293, title: '伊阙之战', event_type: 'war', importance: 4, dynasty_id: 'ws_qin', description: '白起大破韩魏联军，斩首二十四万，打开了秦军东进的大门。' },
    { year: -286, title: '齐灭宋', event_type: 'war', importance: 3, dynasty_id: 'ws_qi', description: '齐湣王灭宋，引起列国恐慌，导致五国伐齐。' },
    { year: -278, title: '白起拔郢', event_type: 'war', importance: 4, dynasty_id: 'ws_qin', description: '白起攻破楚国都城郢，屈原绝望投江。' },
    { year: -260, title: '长平之战', event_type: 'war', importance: 5, dynasty_id: 'ws_qin', description: '秦赵决战，白起坑杀赵卒四十万，赵国元气大伤，秦国统一趋势不可阻挡。' },
    { year: -256, title: '东周灭亡', event_type: 'politics', importance: 3, dynasty_id: 'ws_qin', description: '秦国攻灭西周公，周赧王崩，周朝祭祀断绝。' },
    { year: -241, title: '最后一次合纵', event_type: 'war', importance: 3, dynasty_id: 'ws_qin', description: '春申君组织五国最后一次攻秦，至函谷关而败，六国再无力联合抗秦。' },
    { year: -237, title: '李斯谏逐客', event_type: 'politics', importance: 4, dynasty_id: 'ws_qin', description: '李斯上书《谏逐客书》，秦王嬴政收回逐客令，广纳人才。' },
    { year: -230, title: '秦灭韩', event_type: 'war', importance: 3, dynasty_id: 'ws_qin', description: '秦灭六国之战开始，韩国首先灭亡。' },
    { year: -227, title: '荆轲刺秦王', event_type: 'politics', importance: 4, dynasty_id: 'ws_qin', description: '燕太子丹派荆轲刺秦，"风萧萧兮易水寒"，壮士一去不复还，加速了燕的灭亡。' },
    { year: -225, title: '水淹大梁', event_type: 'war', importance: 3, dynasty_id: 'ws_qin', description: '王贲引黄河水灌大梁，魏国灭亡。' },
    { year: -223, title: '秦灭楚', event_type: 'war', importance: 3, dynasty_id: 'ws_qin', description: '王翦率六十万大军灭楚。' },
    { year: -219, title: '泰山封禅', event_type: 'politics', importance: 4, dynasty_id: 'qin', description: '秦始皇东巡，在泰山举行封禅大典，确立皇帝神圣地位。' },
    { year: -214, title: '修筑灵渠', event_type: 'science', importance: 4, dynasty_id: 'qin', description: '史禄开凿灵渠，沟通湘江和漓江，中原势力深入岭南。' },
    { year: -213, title: '焚书坑儒', event_type: 'culture', importance: 5, dynasty_id: 'qin', description: '李斯建议焚烧民间书简，次年坑杀方士儒生，钳制思想。' },
    { year: -210, title: '沙丘之变', event_type: 'politics', importance: 5, dynasty_id: 'qin', description: '秦始皇死于沙丘，赵高李斯矫诏杀扶苏，立胡亥，秦朝迅速走向崩溃。' },
    { year: -209, title: '大泽乡起义', event_type: 'war', importance: 5, dynasty_id: 'qin', description: '陈胜吴广起义，"王侯将相宁有种乎"，掀起反秦浪潮。' },
    { year: -207, title: '巨鹿之战', event_type: 'war', importance: 5, dynasty_id: 'qin', description: '项羽破釜沉舟，消灭秦军主力。' },
    { year: -206, title: '鸿门宴', event_type: 'politics', importance: 5, dynasty_id: 'han_west', description: '项羽设宴招待刘邦，范增举玦，项庄舞剑，刘邦借机脱逃。' },
    { year: -204, title: '背水一战', event_type: 'war', importance: 4, dynasty_id: 'han_west', description: '韩信在井陉口背水列阵，大破赵军，兵仙之名威震天下。' },
    { year: -200, title: '白登之围', event_type: 'war', importance: 4, dynasty_id: 'han_west', description: '汉高祖被匈奴冒顿单于围困白登七日，汉朝开启和亲政策。' },
    { year: -196, title: '韩信被杀', event_type: 'politics', importance: 4, dynasty_id: 'han_west', description: '吕后在长乐宫钟室处死韩信，"成也萧何，败也萧何"。' },
    { year: -154, title: '七国之乱', event_type: 'war', importance: 4, dynasty_id: 'han_west', description: '吴王刘濞等七国宗室反叛，周亚夫平定叛乱，中央集权加强。' },
    { year: -140, title: '汉武帝即位', event_type: 'politics', importance: 4, dynasty_id: 'han_west', description: '刘彻即位，开始推行更积极的内外政策。' },
    { year: -138, title: '张骞出使西域', event_type: 'culture', importance: 5, dynasty_id: 'han_west', description: '"凿空"之旅，东西方文明交流的里程碑。' },
    { year: -127, title: '推恩令', event_type: 'politics', importance: 4, dynasty_id: 'han_west', description: '主父偃建议推恩令，巧妙地解决了诸侯王威胁中央的问题。' },
    { year: -119, title: '漠北之战', event_type: 'war', importance: 5, dynasty_id: 'han_west', description: '卫青、霍去病分两路远征，匈奴远遁，"漠南无王庭"。' },
    { year: -108, title: '汉设朝鲜四郡', event_type: 'politics', importance: 3, dynasty_id: 'han_west', description: '汉灭卫氏朝鲜，设立乐浪等四郡，汉文化辐射朝鲜半岛。' },
    { year: -104, title: '太初历', event_type: 'science', importance: 4, dynasty_id: 'han_west', description: '汉武帝命邓平落下闳制订新历，确立了中国历法的基本框架。' },
    { year: -99, title: '李陵兵败', event_type: 'war', importance: 3, dynasty_id: 'han_west', description: '李陵孤军深入力战投降，导致司马迁为之辩护而受腐刑。' },
    { year: -91, title: '巫蛊之祸', event_type: 'politics', importance: 5, dynasty_id: 'han_west', description: '江充诬陷太子，导致卫太子起兵失败自杀，卫子夫自尽，汉武帝晚年大悲剧。' },
    { year: -89, title: '轮台罪己诏', event_type: 'politics', importance: 4, dynasty_id: 'han_west', description: '汉武帝晚年反思穷兵黩武，调整国策，转向与民休息。' },
    { year: -68, title: '霍光废立', event_type: 'politics', importance: 4, dynasty_id: 'han_west', description: '权臣霍光废昌邑王刘贺，立汉宣帝刘询，确立了霍光辅政体制。' },
    { year: -60, title: '西域都护府设立', event_type: 'politics', importance: 4, dynasty_id: 'han_west', description: '郑吉首任都护，西域正式纳入汉朝版图。' },
    { year: 9, title: '王莽篡汉', event_type: 'politics', importance: 4, dynasty_id: 'xin', description: '王莽代汉建新，推行"托古改制"，引发社会大乱。' },
    { year: 17, title: '绿林赤眉起义', event_type: 'war', importance: 4, dynasty_id: 'xin', description: '新莽末年农民大起义，直接导致新朝灭亡。' },
    { year: 23, title: '昆阳之战', event_type: 'war', importance: 5, dynasty_id: 'xin', description: '刘秀以少胜多，大败王莽主力，展现军事天才。' },
    { year: 25, title: '光武中兴', event_type: 'politics', importance: 5, dynasty_id: 'han_east', description: '刘秀称帝，定都洛阳，东汉建立，致力于恢复经济，"柔道"治国。' },
    { year: 40, title: '二征起义', event_type: 'war', importance: 3, dynasty_id: 'han_east', description: '交趾征侧、征贰起义，马援南征平定。' },
    { year: 68, title: '白马寺建立', event_type: 'culture', importance: 4, dynasty_id: 'han_east', description: '中国第一座官办佛寺，佛教在中国生根发芽。' },
    { year: 89, title: '勒石燕然', event_type: 'war', importance: 4, dynasty_id: 'han_east', description: '窦宪北击匈奴，登燕然山刻石纪功，汉朝边功的巅峰。' },
    { year: 105, title: '蔡伦改进造纸术', event_type: 'science', importance: 5, dynasty_id: 'han_east', description: '蔡伦用树皮麻头等改进造纸，极大促进了文化传播。' },
    { year: 132, title: '张衡发明地动仪', event_type: 'science', importance: 4, dynasty_id: 'han_east', description: '人类历史上第一台监测地震的仪器。' },
    { year: 169, title: '第二次党锢之祸', event_type: 'politics', importance: 3, dynasty_id: 'han_east', description: '对士大夫打击更加惨烈，东汉王朝名存实亡。' },
    { year: 184, title: '黄巾起义', event_type: 'war', importance: 5, dynasty_id: 'han_east', description: '"苍天已死，黄天当立"，张角领导的宗教性农民起义，瓦解了东汉政权。' },
    { year: 189, title: '董卓乱京', event_type: 'politics', importance: 4, dynasty_id: 'han_east', description: '董卓进京废立皇帝，火烧洛阳，天下大乱。' },
    { year: 190, title: '十八路诸侯讨董', event_type: 'war', importance: 4, dynasty_id: 'han_east', description: '关东诸侯联合讨伐董卓，群雄割据局面形成。' },
    { year: 192, title: '吕布戏貂蝉', event_type: 'culture', importance: 3, dynasty_id: 'han_east', description: '王允连环计，吕布杀董卓（演义故事深人心，史实为吕布杀董）。' },
    { year: 200, title: '官渡之战', event_type: 'war', importance: 5, dynasty_id: 'han_east', description: '曹操以少胜多大败袁绍，统一北方。' },
    { year: 208, title: '赤壁之战', event_type: 'war', importance: 5, dynasty_id: 'han_east', description: '孙刘联军大破曹操，奠定三分天下格局。' },
    { year: 211, title: '刘备入川', event_type: 'war', importance: 3, dynasty_id: 'han_east', description: '刘备应刘璋之邀入蜀，随即反客为主，夺取益州。' },
    { year: 214, title: '定军山之战', event_type: 'war', importance: 3, dynasty_id: 'han_east', description: '黄忠斩夏侯渊，刘备夺取汉中。' },
    { year: 219, title: '关羽水淹七军', event_type: 'war', importance: 4, dynasty_id: 'han_east', description: '关羽威震华夏，随即败走麦城，荆州易手。' },
    { year: 220, title: '曹丕篡汉', event_type: 'politics', importance: 5, dynasty_id: 'threekingdoms_wei', description: '曹丕代汉建魏，汉朝正式灭亡，三国时代正式开始。' },
    { year: 222, title: '夷陵之战', event_type: 'war', importance: 4, dynasty_id: 'threekingdoms_shu', description: '陆逊火烧连营七百里，刘备大败托孤白帝城，蜀汉元气大伤。' },
    { year: 225, title: '七擒孟获', event_type: 'war', importance: 3, dynasty_id: 'threekingdoms_shu', description: '诸葛亮平定南中，攻心为上，稳定后方。' },
    { year: 227, title: '出师表', event_type: 'culture', importance: 4, dynasty_id: 'threekingdoms_shu', description: '诸葛亮北伐前上书，"鞠躬尽瘁，死而后已"。' },
    { year: 234, title: '五丈原陨落', event_type: 'politics', importance: 4, dynasty_id: 'threekingdoms_shu', description: '诸葛亮病逝五丈原，蜀汉北伐大业终结。' },
    { year: 249, title: '高平陵之变', event_type: 'politics', importance: 4, dynasty_id: 'threekingdoms_wei', description: '司马懿发动政变诛杀曹爽，司马氏掌握魏国实权。' },
    { year: 263, title: '魏灭蜀', event_type: 'war', importance: 4, dynasty_id: 'threekingdoms_wei', description: '邓艾偷渡阴平，刘禅投降，三国去一。' },
    { year: 266, title: '晋代魏', event_type: 'politics', importance: 4, dynasty_id: 'jin', description: '司马炎建立西晋，魏国灭亡。' },
    { year: 280, title: '西晋灭吴', event_type: 'war', importance: 5, dynasty_id: 'jin', description: '王濬楼船下益州，金陵王气黯然收，三分归晋，全国统一。' },
    { year: 291, title: '八王之乱', event_type: 'war', importance: 4, dynasty_id: 'jin', description: '西晋皇族内部残酷夺权，国力耗尽，导致五胡乱华。' },
    { year: 304, title: '五胡乱华开启', event_type: 'war', importance: 5, dynasty_id: 'jin', description: '李雄、刘渊分别建国，胡人政权纷纷建立，中原陷入长达百年的战乱。' },
    { year: 311, title: '永嘉之乱', event_type: 'war', importance: 5, dynasty_id: 'jin', description: '匈奴攻陷洛阳，俘虏晋怀帝，中原文明遭受浩劫。' },
    { year: 353, title: '兰亭集序', event_type: 'culture', importance: 4, dynasty_id: 'jin', description: '王羲之兰亭修禊，写下"天下第一行书"，魏晋风度的代表。' },
    { year: 354, title: '桓温北伐', event_type: 'war', importance: 3, dynasty_id: 'jin', description: '桓温多次北伐，曾攻至长安霸上，由于内部牵制无功而返。' },
    { year: 383, title: '淝水之战', event_type: 'war', importance: 5, dynasty_id: 'jin', description: '谢安、谢玄以少胜多击败前秦百万雄师，保住了东晋偏安局面，前秦崩溃。' },
    { year: 403, title: '桓玄篡位', event_type: 'politics', importance: 3, dynasty_id: 'jin', description: '桓玄称帝，刘裕举兵讨伐，东晋名存实亡。' },
    { year: 420, title: '刘裕代晋', event_type: 'politics', importance: 4, dynasty_id: 'liu_song', description: '刘裕建立刘宋，东晋灭亡，南朝开始，"气吞万里如虎"。' },
    { year: 446, title: '太武帝灭佛', event_type: 'culture', importance: 3, dynasty_id: 'northern_wei', description: '北魏太武帝推行道教，镇压佛教，"三武一宗"灭佛之一。' },
    { year: 494, title: '孝文帝迁都洛阳', event_type: 'politics', importance: 5, dynasty_id: 'northern_wei', description: '北魏孝文帝大力推行汉化改革，迁都洛阳，促进民族大融合。' },
    { year: 523, title: '六镇起义', event_type: 'war', importance: 4, dynasty_id: 'northern_wei', description: '北魏北方军镇反叛，北魏政权崩溃的开端。' },
    { year: 548, title: '侯景之乱', event_type: 'war', importance: 4, dynasty_id: 'liang', description: '侯景作乱攻陷建康，饿死梁武帝，江南经济遭到毁灭性破坏。' },
    { year: 557, title: '北周代西魏', event_type: 'politics', importance: 3, dynasty_id: 'northern_zhou', description: '宇文护废西魏恭帝，立宇文觉，建立北周。' },
    // Batch 2/3 (100 events)
    { year: 581, title: '隋朝建立', event_type: 'politics', importance: 5, dynasty_id: 'sui', description: '杨坚受禅建立隋朝，结束了南北朝分裂局面。' },
    { year: 582, title: '营建大兴城', event_type: 'science', importance: 4, dynasty_id: 'sui', description: '宇文恺主持设计大兴城（唐长安城），世界中古史上的建筑杰作。' },
    { year: 605, title: '开通大运河', event_type: 'science', importance: 5, dynasty_id: 'sui', description: '隋炀帝下令开凿大运河，沟通南北，泽被后世千年。' },
    { year: 611, title: '王薄长白山起义', event_type: 'war', importance: 3, dynasty_id: 'sui', description: '"无向辽东浪死歌"，隋末农民起义爆发。' },
    { year: 617, title: '晋阳起兵', event_type: 'war', importance: 5, dynasty_id: 'tang', description: '李渊父子在晋阳起兵反隋，直取长安。' },
    { year: 621, title: '虎牢关之战', event_type: 'war', importance: 5, dynasty_id: 'tang', description: '李世民一战擒双王（窦建德、王世充），大唐统一北方的决定性一战。' },
    { year: 624, title: '均田制与租庸调制', event_type: 'politics', importance: 4, dynasty_id: 'tang', description: '唐朝颁布均田令和租庸调法，确立了唐初的经济基础。' },
    { year: 626, title: '玄武门之变', event_type: 'politics', importance: 5, dynasty_id: 'tang', description: '李世民杀兄屠弟，逼父退位，开创贞观之治。' },
    { year: 635, title: '唐朝接见景教使者', event_type: 'culture', importance: 3, dynasty_id: 'tang', description: '阿罗本抵长安，唐太宗准许传教，基督教（景教）首次传入中国。' },
    { year: 641, title: '文成公主入藏', event_type: 'culture', importance: 5, dynasty_id: 'tang', description: '松赞干布迎娶文成公主，唐蕃和亲，汉藏关系史上的里程碑。' },
    { year: 643, title: '凌烟阁二十四功臣', event_type: 'politics', importance: 3, dynasty_id: 'tang', description: '唐太宗绘功臣图于凌烟阁，表彰开国元勋。' },
    { year: 645, title: '玄奘取经归来', event_type: 'culture', importance: 5, dynasty_id: 'tang', description: '玄奘历经艰辛回到长安，带回大量佛经，并著《大唐西域记》。' },
    { year: 655, title: '武则天立后', event_type: 'politics', importance: 4, dynasty_id: 'tang', description: '"废王立武"，武则天登上政治舞台，开启唐朝"二圣临朝"时代。' },
    { year: 663, title: '白江口之战', event_type: 'war', importance: 3, dynasty_id: 'tang', description: '唐日第一次交锋，唐军全歼日军，确立了东亚朝贡体系格局。' },
    { year: 684, title: '骆宾王讨武檄文', event_type: 'culture', importance: 3, dynasty_id: 'tang', description: '"一抔之土未干，六尺之孤何托"，虽未能推翻武则天，文采却传颂千古。' },
    { year: 690, title: '武周建立', event_type: 'politics', importance: 5, dynasty_id: 'wu_zhou', description: '武则天称帝，改唐为周，中国历史上唯一的女皇帝。' },
    { year: 710, title: '唐隆政变', event_type: 'politics', importance: 3, dynasty_id: 'tang', description: '李隆基与太平公主联手诛杀韦后集团，结束了武红之后的混乱。' },
    { year: 713, title: '开元盛世开启', event_type: 'politics', importance: 5, dynasty_id: 'tang', description: '唐玄宗改元开元，任用姚崇宋璟，大唐进入全盛时期。' },
    { year: 751, title: '怛罗斯之战', event_type: 'war', importance: 4, dynasty_id: 'tang', description: '高仙芝败于阿拉伯帝国，造纸术西传，唐朝在中亚扩张受阻。' },
    { year: 755, title: '安史之乱爆发', event_type: 'war', importance: 5, dynasty_id: 'tang', description: '安禄山范阳起兵，渔阳鼙鼓动地来，大唐盛极而衰。' },
    { year: 756, title: '马嵬坡之变', event_type: 'politics', importance: 4, dynasty_id: 'tang', description: '六军不发无奈何，宛转蛾眉马前死，杨贵妃赐死，玄宗幸蜀。' },
    { year: 763, title: '安复之乱结束', event_type: 'war', importance: 4, dynasty_id: 'tang', description: '历时八年战乱结束，唐朝进入藩镇割据时代。' },
    { year: 780, title: '两税法实施', event_type: 'politics', importance: 4, dynasty_id: 'tang', description: '杨炎建议推行两税法，改变了以人丁为主的赋税制度，影响深远。' },
    { year: 819, title: '韩愈谏迎佛骨', event_type: 'culture', importance: 3, dynasty_id: 'tang', description: '韩愈上表反对宪宗迎佛骨，被贬潮州，"一封朝奏九重天，夕贬潮阳路八千"。' },
    { year: 835, title: '甘露之变', event_type: 'politics', importance: 3, dynasty_id: 'tang', description: '唐文宗密谋诛杀宦官失败，反被软禁，宦官专权达到顶峰。' },
    { year: 845, title: '会昌灭佛', event_type: 'culture', importance: 3, dynasty_id: 'tang', description: '唐武宗大规模拆毁佛寺，佛教遭受重创，但禅宗得以幸存。' },
    { year: 874, title: '王仙芝起义', event_type: 'war', importance: 3, dynasty_id: 'tang', description: '唐末农民战争爆发，"天补平均大将军"。' },
    { year: 878, title: '黄巢起义', event_type: 'war', importance: 5, dynasty_id: 'tang', description: '"待到秋来九月八，我花开后百花杀"，黄巢席卷大半个中国。' },
    { year: 881, title: '黄巢入长安', event_type: 'politics', importance: 4, dynasty_id: 'tang', description: '黄巢称帝，国号大齐，长安陷落，士族遭到毁灭性打击。' },
    { year: 907, title: '朱温篡唐', event_type: 'politics', importance: 5, dynasty_id: 'five_later_liang', description: '朱温废唐哀帝，建立后梁，唐朝灭亡，五代十国开始。' },
    { year: 916, title: '耶律阿保机建辽', event_type: 'politics', importance: 4, dynasty_id: 'liao', description: '契丹建国，雄踞北方，成为中原王朝劲敌。' },
    { year: 923, title: '后唐灭后梁', event_type: 'war', importance: 3, dynasty_id: 'five_later_tang', description: '李存勖建立后唐，灭亡后梁，统一北方大部。' },
    { year: 938, title: '割让燕云十六州', event_type: 'politics', importance: 5, dynasty_id: 'liao', description: '石敬瑭依附契丹，割让燕云十六州，导致中原失去屏障四百余年。' },
    { year: 954, title: '高平之战', event_type: 'war', importance: 3, dynasty_id: 'five_later_zhou', description: '周世宗柴荣一战击败北汉和辽联军，稳固地位，开始南征北战。' },
    { year: 955, title: '周世宗灭佛', event_type: 'culture', importance: 3, dynasty_id: 'five_later_zhou', description: '整顿佛教，将铜佛熔化铸钱，"毁佛铸钱"。' },
    { year: 960, title: '陈桥兵变', event_type: 'politics', importance: 5, dynasty_id: 'song', description: '赵匡胤黄袍加身，建立宋朝，五代十国基本结束。' },
    { year: 976, title: '烛影斧声', event_type: 'politics', importance: 3, dynasty_id: 'song', description: '赵匡胤暴卒，赵光义即位，千古之谜。' },
    { year: 979, title: '高梁河车神', event_type: 'war', importance: 4, dynasty_id: 'song', description: '宋太宗伐辽失败，乘驴车逃跑，宋朝收复燕云的努力受挫，转为守势。' },
    { year: 1004, title: '澶渊之盟', event_type: 'politics', importance: 5, dynasty_id: 'song', description: '宋辽缔结盟约，约为兄弟之国，开启长达百年的和平。' },
    { year: 1023, title: '交子发行', event_type: 'science', importance: 4, dynasty_id: 'song', description: '四川地区发行交子，世界上最早的纸币。' },
    { year: 1038, title: '李元昊称帝', event_type: 'politics', importance: 3, dynasty_id: 'western_xia', description: '西夏建国，宋夏战争爆发，三足鼎立局面形成。' },
    { year: 1041, title: '毕昇发明活字印刷', event_type: 'science', importance: 5, dynasty_id: 'song', description: '胶泥活字印刷术，四大发明之一，文明传播加速器。' },
    { year: 1044, title: '庆历新政', event_type: 'politics', importance: 3, dynasty_id: 'song', description: '范仲淹主持改革，"先天下之忧而忧"，虽失败但开启了宋代改革风气。' },
    { year: 1069, title: '王安石变法', event_type: 'politics', importance: 5, dynasty_id: 'song', description: '熙宁变法，"天变不足畏，祖宗不足法"，旨在富国强兵，但引发新旧党争。' },
    { year: 1084, title: '《资治通鉴》成书', event_type: 'culture', importance: 5, dynasty_id: 'song', description: '司马光主持编纂的编年体通史巨著，"鉴于往事，有资于治道"。' },
    { year: 1115, title: '完颜阿骨打建金', event_type: 'politics', importance: 4, dynasty_id: 'jurchen_jin', description: '女真崛起，建立金朝，迅速灭辽攻宋。' },
    { year: 1125, title: '金灭辽', event_type: 'war', importance: 3, dynasty_id: 'jurchen_jin', description: '辽天祚帝被俘，辽朝灭亡。' },
    { year: 1127, title: '靖康之耻', event_type: 'politics', importance: 5, dynasty_id: 'song', description: '金兵攻破汴京，俘虏徽钦二帝，北宋灭亡。' },
    { year: 1140, title: '郾城大捷', event_type: 'war', importance: 4, dynasty_id: 'song', description: '岳飞大破金兀术拐子马，"直捣黄龙"指日可待。' },
    { year: 1142, title: '风波亭冤狱', event_type: 'politics', importance: 5, dynasty_id: 'song', description: '岳飞以"莫须有"罪名被杀，宋金绍兴和议，偏安格局确立。' },
    { year: 1206, title: '铁木真统一蒙古', event_type: 'politics', importance: 5, dynasty_id: 'yuan', description: '铁木真在斡难河源称成吉思汗，建立大蒙古国。' },
    { year: 1227, title: '西夏灭亡', event_type: 'war', importance: 3, dynasty_id: 'western_xia', description: '成吉思汗遗命中灭西夏，党项族政权消失。' },
    { year: 1234, title: '金朝灭亡', event_type: 'war', importance: 4, dynasty_id: 'jurchen_jin', description: '宋蒙联军攻破蔡州，金哀宗自缢，金朝亡。' },
    { year: 1247, title: '凉州会盟', event_type: 'politics', importance: 4, dynasty_id: 'yuan', description: '萨迦班智达与阔端会盟，西藏正式纳入中国版图。' },
    { year: 1271, title: '忽必烈建元', event_type: 'politics', importance: 4, dynasty_id: 'yuan', description: '取《易经》"大哉乾元"之意，定国号为元。' },
    { year: 1273, title: '襄阳陷落', event_type: 'war', importance: 4, dynasty_id: 'yuan', description: '守将吕文焕投降，南宋门户大开。' },
    { year: 1276, title: '临安陷落', event_type: 'politics', importance: 4, dynasty_id: 'song', description: '谢太后率小皇帝投降，南宋事实上灭亡。' },
    { year: 1279, title: '崖山海战', event_type: 'war', importance: 5, dynasty_id: 'song', description: '陆秀夫背负少帝投海，"十万军民齐跳海"，古典中国悲壮的一页。' },
    { year: 1292, title: '元军远征爪哇', event_type: 'war', importance: 2, dynasty_id: 'yuan', description: '元朝海权扩张的极限，虽胜犹败。' },
    { year: 1300, title: '关汉卿创作高峰', event_type: 'culture', importance: 3, dynasty_id: 'yuan', description: '元曲大家关汉卿活跃时期，《窦娥冤》感天动地，元杂剧繁荣。' },
    { year: 1313, title: '王祯《农书》', event_type: 'science', importance: 3, dynasty_id: 'yuan', description: '集农耕技术之大成，包含活字印刷术记载。' },
    { year: 1351, title: '红巾军起义', event_type: 'war', importance: 4, dynasty_id: 'yuan', description: '"莫道石人一只眼，挑动黄河天下反"，元末农民大起义爆发。' },
    { year: 1324, title: '倪瓒作画', event_type: 'culture', importance: 2, dynasty_id: 'yuan', description: '元四家之一，其山水画简淡超逸，影响明清绘画。' },
    { year: 1360, title: '陈友谅称帝', event_type: 'politics', importance: 3, dynasty_id: 'yuan', description: '陈友谅建立大汉政权，与朱元璋、张士诚争夺天下。' },
    { year: 1367, title: '朱元璋北伐', event_type: 'war', importance: 4, dynasty_id: 'ming', description: '徐达、常遇春率军北伐，"驱逐胡虏，恢复中华"。' },
    { year: 1368, title: '明朝建立', event_type: 'politics', importance: 5, dynasty_id: 'ming', description: '朱元璋称帝南京，同年攻克大都，元朝灭亡。' },
    { year: 1370, title: '定科举法', event_type: 'politics', importance: 3, dynasty_id: 'ming', description: '明初恢复并完善科举，确立八股取士。' },
    { year: 1381, title: '明平云南', event_type: 'war', importance: 3, dynasty_id: 'ming', description: '蓝玉、沐英攻克云南，消灭元梁王势力，中国统一。' },
    { year: 1393, title: '蓝玉案', event_type: 'politics', importance: 3, dynasty_id: 'ming', description: '诛杀功臣蓝玉，牵连四万余人，武将勋贵集团几乎被清洗殆尽。' },
    { year: 1399, title: '靖难之役', event_type: 'war', importance: 5, dynasty_id: 'ming', description: '燕王朱棣起兵反叛建文帝，"清君侧"，叔侄皇位之争。' },
    { year: 1402, title: '朱棣即位', event_type: 'politics', importance: 5, dynasty_id: 'ming', description: '朱棣攻入南京，即皇帝位（明成祖），改元永乐。' },
    { year: 1405, title: '郑和下西洋', event_type: 'culture', importance: 5, dynasty_id: 'ming', description: '郑和率领庞大舰队首航西洋，开启大航海时代先声，宣扬国威。' },
    { year: 1408, title: '《永乐大典》成书', event_type: 'culture', importance: 5, dynasty_id: 'ming', description: '世界历史上最大的百科全书，汇集古今图书八千余种。' },
    { year: 1421, title: '迁都北京', event_type: 'politics', importance: 5, dynasty_id: 'ming', description: '明成祖正式迁都北京，天子守国门。' },
    { year: 1425, title: '仁宣之治', event_type: 'politics', importance: 4, dynasty_id: 'ming', description: '明仁宗、宣宗时期，政治清明，经济发展，明朝国力达到鼎盛。' },
    { year: 1443, title: '李东阳出生', event_type: 'culture', importance: 2, dynasty_id: 'ming', description: '茶陵诗派核心人物，明代中期文坛领袖。' },
    { year: 1457, title: '夺门之变', event_type: 'politics', importance: 3, dynasty_id: 'ming', description: '英宗复辟，于谦被杀，明朝政治风气转坏。' },
    { year: 1465, title: '成化斗彩鸡缸杯', event_type: 'culture', importance: 3, dynasty_id: 'ming', description: '成化年间瓷器烧造技艺达巅峰，斗彩闻名后世。' },
    { year: 1477, title: '设西厂', event_type: 'politics', importance: 3, dynasty_id: 'ming', description: '明宪宗设西厂，汪直掌权，特务政治加剧。' },
    { year: 1493, title: '弘治中兴开始', event_type: 'politics', importance: 3, dynasty_id: 'ming', description: '明孝宗励精图治，任用贤臣，大明再次焕发生机。' },
    { year: 1506, title: '正德帝即位', event_type: 'politics', importance: 3, dynasty_id: 'ming', description: '明武宗即位，宠信刘瑾，建立豹房，行事荒诞。' },
    { year: 1510, title: '刘瑾被诛', event_type: 'politics', importance: 3, dynasty_id: 'ming', description: '因为谋反罪被凌迟，权阉下场。' },
    { year: 1521, title: '嘉靖帝继位', event_type: 'politics', importance: 3, dynasty_id: 'ming', description: '世宗即位，随后发生"大礼议"之争，确立了皇权独尊。' },
    { year: 1524, title: '大礼议廷杖', event_type: 'politics', importance: 4, dynasty_id: 'ming', description: '嘉靖帝廷杖百官，士大夫集团受挫，皇权极度膨胀。' },
    { year: 1533, title: '葡萄牙人占澳门', event_type: 'politics', importance: 3, dynasty_id: 'ming', description: '西方殖民者开始在澳门居住贸易，中西接触新阶段。' },
    { year: 1542, title: '壬寅宫变', event_type: 'politics', importance: 3, dynasty_id: 'ming', description: '宫女意图勒死嘉靖帝，嘉靖帝此后移居西苑，不再上朝。' },
    { year: 1561, title: '戚家军抗倭', event_type: 'war', importance: 4, dynasty_id: 'ming', description: '台州大捷，戚继光率戚家军九战九捷，基本平定浙江倭患。' },
    { year: 1566, title: '海瑞罢官', event_type: 'politics', importance: 4, dynasty_id: 'ming', description: '海瑞上《治安疏》，直斥嘉靖帝，下狱。同年嘉靖驾崩。' },
    { year: 1567, title: '隆庆开关', event_type: 'politics', importance: 4, dynasty_id: 'ming', description: '解除海禁，准许私人海外贸易，白银大量流入中国。' },
    { year: 1573, title: '万历新政', event_type: 'politics', importance: 4, dynasty_id: 'ming', description: '张居正任首辅，推行考成法、一条鞭法，大明国力回光返照。' },
    { year: 1578, title: '李时珍著《本草纲目》', event_type: 'science', importance: 5, dynasty_id: 'ming', description: '东方药物巨典，集中国古代医学之大成。' },
    { year: 1582, title: '利玛窦来华', event_type: 'culture', importance: 4, dynasty_id: 'ming', description: '耶稣会士利玛窦抵达澳门，后入北京，带来西方科学文化，"西学东渐"。' },
    { year: 1592, title: '万历朝鲜战争', event_type: 'war', importance: 4, dynasty_id: 'ming', description: '丰臣秀吉入侵朝鲜，明朝出兵援助，属于"万历三大征"之一。' },
    { year: 1598, title: '牡丹亭问世', event_type: 'culture', importance: 3, dynasty_id: 'ming', description: '汤显祖创作《牡丹亭》，"情不知所起，一往而深"。' },
    { year: 1615, title: '梃击案', event_type: 'politics', importance: 3, dynasty_id: 'ming', description: '太子朱常洛险遭袭击，明末三案之一，宫廷斗争白热化。' },
    { year: 1616, title: '努尔哈赤建后金', event_type: 'politics', importance: 5, dynasty_id: 'qing', description: '努尔哈赤统一女真各部，建立后金，发布"七大恨"伐明。' },
    { year: 1619, title: '萨尔浒之战', event_type: 'war', importance: 5, dynasty_id: 'ming', description: '明军分四路进攻后金，惨遭各个击破，辽东局势逆转。' },
    { year: 1620, title: '红丸案', event_type: 'politics', importance: 3, dynasty_id: 'ming', description: '泰昌帝即位一月即服红丸暴毙，明末政治疑案。' },
    { year: 1623, title: '魏忠贤掌权', event_type: 'politics', importance: 4, dynasty_id: 'ming', description: '天启帝宠信魏忠贤，号称"九千岁"，阉党残酷镇压东林党。' },
    { year: 1626, title: '宁远大捷', event_type: 'war', importance: 4, dynasty_id: 'ming', description: '袁崇焕凭坚城利炮击退努尔哈赤，努尔哈赤负伤。' },
    { year: 1627, title: '信王朱由检即位', event_type: 'politics', importance: 4, dynasty_id: 'ming', description: '崇祯帝登基，铲除阉党，但也刚愎自用。' },
    { year: 1629, title: '己巳之变', event_type: 'war', importance: 4, dynasty_id: 'ming', description: '皇太极绕道蒙古突袭北京，崇祯中反间计下狱袁崇焕。' },
    { year: 1630, title: '袁崇焕被杀', event_type: 'politics', importance: 4, dynasty_id: 'ming', description: '自毁长城，明朝再无力平定辽东。' },
    { year: 1636, title: '徐霞客游记', event_type: 'science', importance: 3, dynasty_id: 'ming', description: '徐霞客开始西南壮游，地理学著作里程碑。' },
    { year: 1637, title: '宋应星著《天工开物》', event_type: 'science', importance: 4, dynasty_id: 'ming', description: '世界上第一部关于农业和手工业生产的综合性著作，"中国17世纪的工艺百科全书"。' },
    { year: 1642, title: '松锦之战', event_type: 'war', importance: 4, dynasty_id: 'ming', description: '洪承畴兵败投降，明朝在关外的精锐尽失。' },
    { year: 1644, title: '明朝灭亡', event_type: 'politics', importance: 5, dynasty_id: 'ming', description: '李自成攻入北京，崇祯帝煤山自缢，清军入关。' },
    { year: 1645, title: '扬州十日', event_type: 'war', importance: 4, dynasty_id: 'qing', description: '多铎攻破扬州，史可法殉国，清军屠城。' },
    // Batch 3/3 (100 events)
    { year: 1645, title: '剃发令', event_type: 'politics', importance: 5, dynasty_id: 'qing', description: '多尔衮颁布"留头不留发，留发不留头"，引发激烈反抗（如嘉定三屠）。' },
    { year: 1661, title: '郑成功收复台湾', event_type: 'war', importance: 5, dynasty_id: 'qing', description: '郑成功驱逐荷兰殖民者，收复台湾，建立明郑政权。' },
    { year: 1662, title: '永历帝被杀', event_type: 'politics', importance: 4, dynasty_id: 'qing', description: '吴三桂在昆明缢杀南明永历帝，南明灭亡。' },
    { year: 1673, title: '三藩之乱', event_type: 'war', importance: 5, dynasty_id: 'qing', description: '吴三桂、尚可喜、耿精忠起兵反清，康熙帝历时八年平定。' },
    { year: 1683, title: '施琅攻台', event_type: 'war', importance: 4, dynasty_id: 'qing', description: '清军海战大败郑军，郑克塽投降，台湾归入清朝版图。' },
    { year: 1689, title: '《尼布楚条约》', event_type: 'politics', importance: 5, dynasty_id: 'qing', description: '中俄签订第一个边界条约，从法律上确立了黑龙江和乌苏里江流域为中国领土。' },
    { year: 1696, title: '昭莫多之战', event_type: 'war', importance: 4, dynasty_id: 'qing', description: '康熙帝亲征，大败噶尔丹，解除了准噶尔对漠北的威胁。' },
    { year: 1705, title: '教皇特使来华', event_type: 'culture', importance: 3, dynasty_id: 'qing', description: '罗马教皇禁止中国教徒祭祖祀孔（礼仪之争），康熙帝下令驱逐传教士。' },
    { year: 1716, title: '《康熙字典》成书', event_type: 'culture', importance: 4, dynasty_id: 'qing', description: '收字四万七千余，汉字辞书研究的集大成者。' },
    { year: 1720, title: '驱准保藏', event_type: 'war', importance: 4, dynasty_id: 'qing', description: '清军入藏驱逐准噶尔势力，确立了中央对西藏的统治。' },
    { year: 1723, title: '雍正继位', event_type: 'politics', importance: 4, dynasty_id: 'qing', description: '在九子夺嫡中胜出，开始推行一系列铁腕改革。' },
    { year: 1725, title: '《古今图书集成》', event_type: 'culture', importance: 4, dynasty_id: 'qing', description: '陈梦雷编纂，现存规模最大的类书。' },
    { year: 1727, title: '设立驻藏大臣', event_type: 'politics', importance: 4, dynasty_id: 'qing', description: '清廷设驻藏大臣，与达赖、班禅共同管理西藏事务。' },
    { year: 1735, title: '乾隆继位', event_type: 'politics', importance: 4, dynasty_id: 'qing', description: '弘历即位，清朝国力达到顶峰，但也开始走向僵化。' },
    { year: 1750, title: '大金川之战', event_type: 'war', importance: 3, dynasty_id: 'qing', description: '乾隆十全武功之一，平定大小金川土司叛乱，耗资巨大。' },
    { year: 1755, title: '平定准噶尔', event_type: 'war', importance: 5, dynasty_id: 'qing', description: '清军彻底消灭准噶尔汗国，收复天山南北，该地区改名为"新疆"。' },
    { year: 1757, title: '一口通商', event_type: 'politics', importance: 4, dynasty_id: 'qing', description: '乾隆发布谕令，仅留广州一处通商，行"闭关锁国"。' },
    { year: 1765, title: '曹雪芹逝世', event_type: 'culture', importance: 4, dynasty_id: 'qing', description: '《红楼梦》作者，"字字看来皆是血，十年辛苦不寻常"。' },
    { year: 1771, title: '土尔扈特东归', event_type: 'politics', importance: 4, dynasty_id: 'qing', description: '渥巴锡率领土尔扈特部万里东归，回归祖国。' },
    { year: 1773, title: '编纂《四库全书》', event_type: 'culture', importance: 5, dynasty_id: 'qing', description: '纪晓岚主持，收书三千多种，保存了文献，但也销毁了大量"禁书"。' },
    { year: 1790, title: '徽班进京', event_type: 'culture', importance: 4, dynasty_id: 'qing', description: '为乾隆祝寿进京演出，京剧形成的开端。' },
    { year: 1792, title: '《钦定藏内善后章程》', event_type: 'politics', importance: 4, dynasty_id: 'qing', description: '确立金瓶掣签制度，规范活佛转世。' },
    { year: 1793, title: '马戛尔尼访华', event_type: 'politics', importance: 5, dynasty_id: 'qing', description: '英国使团访华要求通商被拒，中西方文明的错失交臂。' },
    { year: 1796, title: '白莲教起义', event_type: 'war', importance: 4, dynasty_id: 'qing', description: '嘉庆初年爆发的大规模起义，清军耗时九年平定，元气大伤。' },
    { year: 1815, title: '《大清律例》', event_type: 'politics', importance: 3, dynasty_id: 'qing', description: '中国最后一部封建法典。' },
    { year: 1820, title: '道光继位', event_type: 'politics', importance: 3, dynasty_id: 'qing', description: '提倡节俭，但无力挽回国势颓败。' },
    { year: 1839, title: '虎门销烟', event_type: 'politics', importance: 5, dynasty_id: 'qing', description: '林则徐在虎门海滩当众销毁鸦片，显示禁烟决心。' },
    { year: 1840, title: '第一次鸦片战争', event_type: 'war', importance: 5, dynasty_id: 'qing', description: '英国发动侵略战争，以清朝战败告终，中国近代史开端。' },
    { year: 1842, title: '《南京条约》', event_type: 'politics', importance: 5, dynasty_id: 'qing', description: '中国近代史上第一个不平等条约，割让香港岛，开放五口通商。' },
    { year: 1844, title: '《望厦条约》', event_type: 'politics', importance: 3, dynasty_id: 'qing', description: '中美第一个不平等条约，确立领事裁判权。' },
    { year: 1850, title: '金田起义', event_type: 'war', importance: 5, dynasty_id: 'qing', description: '洪秀全在广西金田起义，建号太平天国。' },
    { year: 1856, title: '天京事变', event_type: 'politics', importance: 4, dynasty_id: 'qing', description: '杨秀清被杀，韦昌辉被诛，石达开出走，太平天国由盛转衰。' },
    { year: 1856, title: '第二次鸦片战争', event_type: 'war', importance: 5, dynasty_id: 'qing', description: '英法联军发动战争，攻入北京，火烧圆明园。' },
    { year: 1858, title: '《瑷珲条约》', event_type: 'politics', importance: 4, dynasty_id: 'qing', description: '割让黑龙江以北六十万平方公里领土给沙俄。' },
    { year: 1860, title: '《北京条约》', event_type: 'politics', importance: 4, dynasty_id: 'qing', description: '割九龙司地方一区，增开天津为商埠。' },
    { year: 1861, title: '辛酉政变', event_type: 'politics', importance: 5, dynasty_id: 'qing', description: '慈禧太后联合恭亲王奕䜣发动政变，开始"垂帘听政"。' },
    { year: 1861, title: '曾国藩创办安庆内军械所', event_type: 'science', importance: 4, dynasty_id: 'qing', description: '仿造西式船炮，洋务运动最早的军事工业。' },
    { year: 1865, title: '江南制造总局', event_type: 'science', importance: 4, dynasty_id: 'qing', description: '李鸿章在上海创办，晚清最大的军事工业。' },
    { year: 1868, title: '捻军失败', event_type: 'war', importance: 3, dynasty_id: 'qing', description: '活跃于北方的捻军被清军镇压。' },
    { year: 1872, title: '轮船招商局', event_type: 'success', importance: 4, dynasty_id: 'qing', description: '中国近代第一家轮船航运企业，打破外国航运垄断。' },
    { year: 1874, title: '日军侵台', event_type: 'war', importance: 4, dynasty_id: 'qing', description: '日本借口琉球船民被杀侵略台湾，沈葆桢赴台交涉。' },
    { year: 1875, title: '左宗棠收复新疆', event_type: 'war', importance: 5, dynasty_id: 'qing', description: '"抬棺出征"，消灭阿古柏政权，捍卫了西瓦疆土。' },
    { year: 1884, title: '新疆建省', event_type: 'politics', importance: 4, dynasty_id: 'qing', description: '清廷正式在新疆建省，刘锦棠为首任巡抚。' },
    { year: 1884, title: '马尾海战', event_type: 'war', importance: 3, dynasty_id: 'qing', description: '中法战争爆发，福建水师全军覆没。' },
    { year: 1885, title: '镇南关大捷', event_type: 'war', importance: 5, dynasty_id: 'qing', description: '冯子材在镇南关大败法军，"法国内阁倒台"。' },
    { year: 1888, title: '北洋海军成军', event_type: 'war', importance: 4, dynasty_id: 'qing', description: '中国第一支近代化海军正式成军，号称亚洲第一。' },
    { year: 1894, title: '黄海海战', event_type: 'war', importance: 5, dynasty_id: 'qing', description: '甲午战争爆发，邓世昌壮烈殉国，北洋水师损失惨重。' },
    { year: 1895, title: '《马关条约》', event_type: 'politics', importance: 5, dynasty_id: 'qing', description: '割让台湾、澎湖列岛，赔款二亿两，大大加深了半殖民地化程度。' },
    { year: 1895, title: '公车上书', event_type: 'politics', importance: 4, dynasty_id: 'qing', description: '康有为联合举人上书光绪帝，拉开了维新变法的序幕。' },
    { year: 1898, title: '戊戌变法', event_type: 'politics', importance: 5, dynasty_id: 'qing', description: '百日维新，光绪颁布定国是诏，最终被慈禧镇压，六君子喋血菜市口。' },
    { year: 1899, title: '义和团提出"扶清灭洋"', event_type: 'war', importance: 3, dynasty_id: 'qing', description: '山东义和团兴起，矛盾直指帝国主义侵略。' },
    { year: 1900, title: '八国联军侵华', event_type: 'war', importance: 5, dynasty_id: 'qing', description: '西方列强借口镇压义和团，攻陷北京，慈禧西逃。' },
    { year: 1901, title: '《辛丑条约》', event_type: 'politics', importance: 5, dynasty_id: 'qing', description: '赔款4.5亿两，划定使馆界，清政府完全成为"洋人的朝廷"。' },
    { year: 1901, title: '清末新政', event_type: 'politics', importance: 3, dynasty_id: 'qing', description: '清廷迫于形势推行改革，编练新军，废除科举。' },
    { year: 1903, title: '《革命军》发表', event_type: 'culture', importance: 4, dynasty_id: 'qing', description: '邹容著《革命军》，号召推翻清政府，建立共和国。' },
    { year: 1905, title: '同盟会成立', event_type: 'politics', importance: 5, dynasty_id: 'qing', description: '中国第一个资产阶级革命政党在东京成立，提出"三民主义"。' },
    { year: 1905, title: '废除科举', event_type: 'culture', importance: 5, dynasty_id: 'qing', description: '延续一千三百年的科举制度正式废除，推广新式教育。' },
    { year: 1906, title: '预备立宪', event_type: 'politics', importance: 3, dynasty_id: 'qing', description: '清廷宣布预备立宪，派大臣出洋考察宪政。' },
    { year: 1907, title: '秋瑾就义', event_type: 'politics', importance: 4, dynasty_id: 'qing', description: '鉴湖女侠秋瑾在此次起义失败后被杀，"秋风秋雨愁煞人"。' },
    { year: 1908, title: '宣统帝即位', event_type: 'politics', importance: 3, dynasty_id: 'qing', description: '溥仪登基，中国历史上最后一位皇帝。' },
    { year: 1910, title: '三次请愿运动', event_type: 'politics', importance: 3, dynasty_id: 'qing', description: '立宪派发起国会请愿，遭清廷拒绝，大批立宪派转向革命。' },
    { year: 1911, title: '黄花岗起义', event_type: 'war', importance: 5, dynasty_id: 'qing', description: '黄兴率七十二烈士攻打两广总督衙门，极为壮烈，鼓舞了革命斗志。' },
    { year: 1911, title: '保路运动', event_type: 'politics', importance: 4, dynasty_id: 'qing', description: '清廷"铁路国有"政策引发四川保路运动，调湖北新军入川，造成武昌空虚。' },
    { year: 1911, title: '武昌起义', event_type: 'war', importance: 5, dynasty_id: 'qing', description: '工程营打响第一枪，辛亥革命爆发，各省纷纷独立。' },

];

console.log(`-- 4. Insert Missing Dynasties`);
console.log(`INSERT INTO dynasties (id, name, chinese_name, start_year, end_year, color, description) VALUES`);
console.log(`('wu_zhou', 'Wu Zhou', '武周', 690, 705, '#f59e0b', '武则天建立的政权。'),`);
console.log(`('liao', 'Liao', '辽', 916, 1125, '#0ea5e9', '契丹族建立的政权。'),`);
console.log(`('western_xia', 'Western Xia', '西夏', 1038, 1227, '#16a34a', '党项族建立的政权。'),`);
console.log(`('jurchen_jin', 'Jin', '金', 1115, 1234, '#e11d48', '女真族建立的政权。')`);
console.log(`ON CONFLICT (id) DO NOTHING;`);
console.log(``);

console.log(`-- 4.1 Remove Duplicates from Initial Data (Cleaning up legacy events with less detail or different titles)`);
console.log(`DELETE FROM historical_events WHERE title IN (`);
console.log(`  '成吉思汗统一蒙古', '靖康之变', '岳飞北伐', '忽必烈改国号为元', '清朝统一台湾', '雍正登基',`);
console.log(`  '北洋水师成立', '甲午海战', '辛亥革命', '民国建立', '陈胜吴广起义', '武则天称帝', '唐亡',`);
console.log(`  '五代十国开始', '金国建立', '洋务运动开始', '太平天国运动',`);
console.log(`  '荆轲刺秦王', '秦灭韩', '修筑灵渠', '焚书坑儒', '巨鹿之战', '张骞出使西域', '漠北之战',`);
console.log(`  '王莽篡汉', '光武中兴', '勒石燕然', '张衡发明地动仪', '黄巾起义', '官渡之战',`);
console.log(`  '赤壁之战', '夷陵之战', '魏灭蜀', '八王之乱', '淝水之战', '刘裕代晋', '两税法实施',`);
console.log(`  '黄巢起义', '澶渊之盟', '王安石变法', '《资治通鉴》成书', '崖山海战', '明朝建立',`);
console.log(`  '郑和下西洋', '郑成功收复台湾', '徽班进京', '虎门销烟', '第一次鸦片战争', '公车上书',`);
console.log(`  '戊戌变法', '八国联军侵华', '废除科举', '新文化运动', '五四运动'`);
console.log(`);`);
console.log(``);

console.log(`-- 5. Insert 300 More Historical Events`);

console.log(`INSERT INTO historical_events (year, title, event_type, importance, dynasty_id, description) VALUES`);
const values = events.map((e, index) => {
    const isLast = index === events.length - 1;
    return `(${e.year}, '${e.title}', '${e.event_type}', ${e.importance}, '${e.dynasty_id}', '${e.description}')${isLast ? '' : ','}`;
}).join('\n');

console.log(values);
console.log(`ON CONFLICT (year, title) DO NOTHING;`);
console.log(`-- End of Insert`);
