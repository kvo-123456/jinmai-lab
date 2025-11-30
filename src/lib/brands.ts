export interface Brand {
  id: string
  name: string
  story: string
  image: string
}

const mkImg = (prompt: string, size: 'landscape_16_9' | 'square' = 'landscape_16_9') =>
  `https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`

export const BRANDS: Brand[] = [
  {
    id: 'guifaxiang',
    name: '桂发祥十八街麻花',
    story:
      '源自清末的天津风味代表，以多褶形态与香酥口感著称，沿袭手作工艺与津味记忆，承载城市味道与技艺传承，百年老字号与年轻创意不断融合。',
    image: mkImg('SDXL, Tianjin Guifaxiang Shibajie mahua, traditional Chinese snack photography, red and gold accents, studio lighting, high detail, cultural motif'),
  },
  {
    id: 'erduoyan',
    name: '耳朵眼炸糕',
    story:
      '以糯米与红豆为主料，外酥里糯、香甜不腻，街巷烟火与市井风味的象征，凝聚天津人情味与老字号精神，口碑与故事历久弥新。',
    image: mkImg('SDXL, Tianjin Erduoyan zha gao, traditional snack, street food vibe, warm tone, cultural atmosphere, high detail'),
  },
  {
    id: 'guorenzhang',
    name: '果仁张',
    story:
      '精选坚果与传统技法相结合，香酥适口、回味悠长，承载节令习俗与团圆记忆，老味道焕新表达，成为伴手礼与城市名片。',
    image: mkImg('SDXL, Tianjin Guoren Zhang nuts snack, product shot, festive red packaging, cultural pattern, studio lighting'),
  },
  {
    id: 'nirenzhang',
    name: '泥人张',
    story:
      '以细腻彩塑著称，人物生动传神，艺术与民俗交融的代表，见证天津手艺与美学传承，滋养城市文化与现代创意表达。',
    image: mkImg('SDXL, Tianjin Niren Zhang clay figurines, museum display, warm lighting, traditional art, cultural heritage'),
  },
  // 中文注释：以下为新增30个老字号，覆盖天津与全国知名品牌，便于联名创意
  { id: 'goubuli', name: '狗不理包子', story: '天津传统包子名店，褶形饱满、馅香协调，老字号美味与城市记忆的象征，适合与潮流文化联名焕新表达。', image: mkImg('SDXL, Tianjin Goubuli baozi, traditional steamed bun, bamboo steamer, warm restaurant ambiance, cultural motif') },
  { id: 'laomeihua', name: '老美华鞋店', story: '始创于天津的百年鞋履品牌，手工技艺与舒适体验并重，适合与国潮服饰进行联名合作。', image: mkImg('SDXL, Laomeihua traditional shoes, vintage store interior, warm tone, craftsmanship detail') },
  { id: 'seagullwatch', name: '海鸥表', story: '天津制造的经典机械表品牌，以机芯工艺著称，适合与城市主题与工业美学联名。', image: mkImg('SDXL, Tianjin Seagull mechanical watch, macro shot of movement, industrial aesthetic, high detail') },
  { id: 'qianxiangyi', name: '谦祥益布店', story: '天津老字号布店，传统面料与现代设计结合，适合与纺织纹样、服装联名打造文化系列。', image: mkImg('SDXL, Tianjin Qianxiangyi fabric store, traditional textile patterns, soft lighting, cultural motif') },
  { id: 'longshunyu', name: '隆顺榆酱园', story: '天津老字号酱园，酱香浓郁、风味地道，适合与餐饮品牌联名推出限定酱料与包装设计。', image: mkImg('SDXL, Tianjin Longshunyu sauce shop, traditional jars, rustic shelf, warm lighting') },
  { id: 'hongshunde', name: '鸿顺德酱菜', story: '以酱菜闻名的天津老字号，口感鲜爽，适合与家常餐饮、礼盒文化联名。', image: mkImg('SDXL, Tianjin Hongshunde pickles, glass jars, wooden table, homestyle vibe, high detail') },
  { id: 'tongrentang', name: '同仁堂', story: '中华老字号中药品牌，药食同源与养生理念深入人心，适合与健康生活方式联名。', image: mkImg('SDXL, Tongrentang traditional Chinese medicine, apothecary jars, wooden cabinet, warm lighting, cultural elements') },
  { id: 'daoxiangcun', name: '稻香村', story: '糕点名家，节令点心与礼盒文化代表，适合与节日主题、非遗纹样联名。', image: mkImg('SDXL, Daoxiangcun pastries, festive packaging, red and gold accents, studio lighting') },
  { id: 'quanjude', name: '全聚德', story: '烤鸭名店，京味美食文化符号，适合与城市美食地图及文旅联名。', image: mkImg('SDXL, Quanjude Peking duck, restaurant plating, warm tone, cultural atmosphere') },
  { id: 'liubiju', name: '六必居', story: '酱菜与调味品牌，古法酿造与现代口味结合，适合与家宴主题联名。', image: mkImg('SDXL, Liubiju sauce and pickles, traditional jars, heritage store, warm lighting') },
  { id: 'wangzhihe', name: '王致和', story: '以腐乳闻名的老字号，醇香浓郁，适合与家常料理与创意包装联名。', image: mkImg('SDXL, Wangzhihe fermented tofu, product shot, rustic wooden background, high detail') },
  { id: 'laofengxiang', name: '老凤祥', story: '百年珠宝品牌，经典工艺与现代设计融合，适合与文化符号与首饰联名。', image: mkImg('SDXL, Laofengxiang jewelry, close-up, gold and jade, elegant display, soft lighting') },
  { id: 'huqingyutang', name: '胡庆余堂', story: '杭州老字号中药品牌，讲究选材与炮制工艺，适合与养生文化联名。', image: mkImg('SDXL, Huqingyutang TCM pharmacy, wooden drawers, herb jars, warm tone') },
  { id: 'pangaoshou', name: '潘高寿', story: '岭南传统药业品牌，止咳润喉类产品知名，适合与健康生活联名。', image: mkImg('SDXL, Pangaoshou traditional medicine, product lineup, vintage packaging, cultural background') },
  { id: 'chenliji', name: '陈李济', story: '广府中药老字号，工艺严谨、经典方剂传承，适合与岭南文化联名。', image: mkImg('SDXL, Chenliji pharmacy, classic apothecary, wooden cabinets, cultural elements') },
  { id: 'guangzhoujiujia', name: '广州酒家', story: '广式餐饮老字号，经典点心与年味文化代表，适合与节庆礼盒联名。', image: mkImg('SDXL, Guangzhou Restaurant dim sum, festive atmosphere, red lanterns, high detail') },
  { id: 'lianxianglou', name: '莲香楼', story: '广府糕点老字号，传统饼食与礼盒美学结合，适合与节令联名。', image: mkImg('SDXL, Lianxianglou pastries, floral packaging, warm tone, studio lighting') },
  { id: 'zhangxiaoqian', name: '张小泉', story: '百年刀剪品牌，锋利耐用与工艺美学结合，适合与工艺设计联名。', image: mkImg('SDXL, Zhangxiaoquan knives and scissors, product shot, craftsmanship detail, industrial background') },
  { id: 'yingxiong', name: '英雄钢笔', story: '书写工具老品牌，经典外形与书写质感，适合与校园文化与文创联名。', image: mkImg('SDXL, Hero fountain pen, macro nib shot, vintage desk, warm lighting') },
  { id: 'zhonghuapencil', name: '中华铅笔', story: '经典书写品牌，课堂记忆与国民书写符号，适合与教育主题联名。', image: mkImg('SDXL, Zhonghua pencil, stationery flatlay, retro classroom vibe, soft light') },
  { id: 'huili', name: '回力', story: '国民运动鞋老品牌，简约复古与潮流回归，适合与街头文化联名。', image: mkImg('SDXL, Huili sneakers, streetwear style, urban background, dynamic composition') },
  { id: 'tsingtao', name: '青岛啤酒', story: '百年啤酒品牌，清爽口感与城市记忆结合，适合与音乐节与夏日主题联名。', image: mkImg('SDXL, Tsingtao beer, bottle and glass, summer vibe, condensation, high detail') },
  { id: 'dongaejiao', name: '东阿阿胶', story: '滋补养生品牌，传统工艺与现代健康理念结合，适合与养生生活方式联名。', image: mkImg('SDXL, Dong-e Ejiao product, premium packaging, warm tone, health concept') },
  { id: 'fenjiu', name: '汾酒', story: '清香型白酒代表，历史悠久，适合与文化典藏与庆典主题联名。', image: mkImg('SDXL, Fenjiu Chinese liquor, elegant bottle, calligraphy backdrop, cultural atmosphere') },
  { id: 'xifeng', name: '西凤酒', story: '凤香型白酒代表，历史传承与地域文化，适合与礼遇主题联名。', image: mkImg('SDXL, Xifeng liquor, phoenix motif, red and gold, ceremonial display') },
  { id: 'gujinggong', name: '古井贡酒', story: '名酒老字号，典雅包装与礼仪文化，适合与商务礼赠联名。', image: mkImg('SDXL, Gujinggong liquor, premium gift box, calligraphy, warm lighting') },
  { id: 'luzhoulaojiao', name: '泸州老窖', story: '浓香型白酒代表，酿造工艺与文化传承，适合与节庆主题联名。', image: mkImg('SDXL, Luzhou Laojiao liquor, cellar imagery, warm tone, cultural elements') },
  { id: 'langjiu', name: '郎酒', story: '浓香型与酱香型兼具的老品牌，包装设计与品牌叙事亮眼，适合与艺术跨界联名。', image: mkImg('SDXL, Langjiu liquor, red-blue bottle, modern art backdrop, high detail') },
  { id: 'dezhoupaji', name: '德州扒鸡', story: '传统卤味名品，口感鲜香，适合与城市美食文化联名。', image: mkImg('SDXL, Dezhou braised chicken, product shot, rustic table, warm lighting') },
]

export default BRANDS
