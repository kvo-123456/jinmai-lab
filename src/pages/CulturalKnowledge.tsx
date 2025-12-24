import { useState, useEffect, useRef, useMemo, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import TianjinCreativeActivities from '@/components/TianjinCreativeActivities';
import CulturalNews from '@/components/CulturalNews';
import TianjinCulturalAssets from '@/components/TianjinCulturalAssets';
 

import GradientHero from '@/components/GradientHero'
import { isPrefetched } from '@/services/prefetch'

// 模拟文化知识数据
const historicalStories = [
  {
    id: 1,
    title: '北京同仁堂：350年的中药传奇',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Beijing%20Tongrentang%20traditional%20Chinese%20medicine%20store%20historical%20photo',
    excerpt: '创立于1669年的同仁堂，历经八代皇帝，见证了中国中医药文化的传承与发展...',
    content: `北京同仁堂是中国最负盛名的中药老字号，创建于清康熙八年（1669年），
    创始人乐显扬。三百多年来，同仁堂始终坚守"炮制虽繁必不敢省人工，品味虽贵必不敢减物力"的古训，
    其产品以"配方独特、选料上乘、工艺精湛、疗效显著"而享誉海内外。
    
    同仁堂的发展史与中国近现代史紧密相连，从清朝宫廷御药房到现代上市公司，
    同仁堂不仅是一家企业，更是中国中医药文化的重要象征和传承者。
    
    如今，同仁堂已发展成为拥有药品、保健品、食品等多个产业的现代化中医药集团，
    产品远销世界多个国家和地区，为弘扬中华优秀传统文化做出了重要贡献。`,
    tags: ['中药', '清朝', '老字号', '文化传承']
  },
  {
    id: 2,
    title: '景德镇瓷器：白如玉、明如镜、薄如纸、声如磬',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Jingdezhen%20porcelain%20traditional%20workshop%20and%20artworks',
    excerpt: '景德镇制瓷历史可追溯至汉代，宋元时期逐渐发展，明清时期达到鼎盛...',
    content: `景德镇被誉为"世界瓷都"，制瓷历史悠久，技艺精湛。早在汉代，
    这里就开始了陶瓷生产；唐代，景德镇白瓷已享有盛名；宋代，景德镇陶瓷进入快速发展期，
    以青白瓷（影青瓷）著称于世；元代，景德镇成功烧制出青花、釉里红等新品种；
    明代，景德镇成为全国制瓷中心，设立了御窑厂；清代，景德镇制瓷工艺达到历史高峰，
    创烧了粉彩、珐琅彩等名贵品种。
    
    景德镇瓷器以"白如玉、明如镜、薄如纸、声如磬"的独特品质闻名天下，
    其制瓷技艺包括拉坯、利坯、施釉、彩绘、烧制等72道工序，
    每一件精品都凝聚着匠人的心血和智慧。
    
    2006年，景德镇陶瓷烧制技艺被列入第一批国家级非物质文化遗产名录，
    成为中华民族优秀传统文化的重要组成部分。`,
    tags: ['陶瓷', '手工艺', '非遗', '艺术']
  },
  {
    id: 3,
    title: '茅台酒：中国白酒的典范',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Moutai%20liquor%20traditional%20brewing%20process',
    excerpt: '茅台酒以其独特的酱香风格和卓越的品质，被誉为"国酒"，其酿造技艺堪称中华酿酒文化的瑰宝...',
    content: `茅台酒产于贵州省仁怀市茅台镇，是中国酱香型白酒的代表。
    茅台镇独特的地理环境、气候条件和水质，为茅台酒的酿造提供了得天独厚的自然条件。
    茅台酒的酿造工艺复杂，需要经过制曲、制酒、陈酿、勾兑、包装等多个环节，
    整个生产周期长达一年，还要经过五年以上的陈酿才能出厂。
    
    茅台酒以"酱香突出、幽雅细腻、酒体醇厚、回味悠长、空杯留香持久"的特点著称，
    其独特的风味和品质使其成为中国白酒的典范，被誉为"国酒"。
    
    茅台酒的酿造技艺不仅是一门技术，更是一种文化传承。
    2006年，茅台酒酿制技艺被列入第一批国家级非物质文化遗产名录，
    成为中华民族优秀传统文化的重要组成部分。`,
    tags: ['白酒', '酿造', '非遗', '饮食文化']
  }
  ,
  {
    id: 4,
    title: '桂发祥十八街麻花：百年津味的酥与脆',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Guifaxiang%20mahua%20traditional%20workshop%20photo',
    excerpt: '创建于1927年的桂发祥，以十八街麻花闻名，形成独特的传统工艺与口感标准。',
    content: `桂发祥十八街麻花以多褶形态与香酥口感著称，传统工艺讲究和面、擀条、拧花、油炸的每一步火候与比例。
    其“条条分明、不含水分”的标准来自长期的工艺经验积累，成为津门特色小吃的代表。`,
    tags: ['天津', '老字号', '食品', '传统工艺']
  },
  {
    id: 5,
    title: '狗不理包子：皮薄馅大的城市名片',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Goubuli%20steamed%20buns%20traditional%20shop',
    excerpt: '始于清代光绪年间的狗不理，以皮薄馅大、鲜香味美闻名，成为天津餐饮文化符号。',
    content: `狗不理包子强调醒发与包制的手法，讲究“十八个褶”，汤汁鲜而不腻。
    其品牌发展见证了天津餐饮业与城市商业的现代化进程。`,
    tags: ['天津', '美食', '非遗', '餐饮文化']
  },
  {
    id: 6,
    title: '耳朵眼炸糕：外酥里糯的甜香记忆',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Erduoyan%20fried%20cake%20street%20scene',
    excerpt: '创建于清光绪年间的耳朵眼炸糕，以糯米与红豆的比例与火候著称，香甜不腻。',
    content: `耳朵眼炸糕的制作工艺重在选材与油温控制，外皮酥脆、内里细糯，甜香层次分明。
    它承载着天津街巷里的生活味道，是城市小吃文化的典型代表。`,
    tags: ['天津', '小吃', '老字号']
  },
  {
    id: 7,
    title: '果仁张：糖炒栗子的火候之道',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=SDXL%2C%20Guorenzhang%20candied%20chestnut%20street%20shop%2C%20golden%20hour%20warm%20lighting%2C%20shallow%20depth%20of%20field%2C%20nostalgic%20vibe%2C%20high%20detail',
    excerpt: '百年坚果品牌果仁张以糖炒栗子闻名，强调选料与火候，粒粒饱满香甜。',
    content: `果仁张的糖炒栗子以精选原料与多次翻炒控温工艺形成独特口感，香甜而不粘牙。
    其品牌形象与城市季节性消费场景密切相关，成为津味记忆的重要组成。`,
    tags: ['天津', '坚果', '食品']
  },
  {
    id: 8,
    title: '茶汤李：一碗温润的城市温度',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chatangli%20sweet%20soup%20stall',
    excerpt: '源自清末的茶汤李，以细腻柔滑、甘香回甜的口感，成为老天津的温暖记忆。',
    content: `茶汤李的茶汤以米粉与红糖的比例与熬煮火候见长，入口细腻，回甜绵长。
    它折射出天津城市生活的节奏与人情味，承载代际记忆。`,
    tags: ['天津', '甜品', '城市记忆']
  },
  {
    id: 9,
    title: '老美华：手工鞋履的温度',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Laomeihua%20traditional%20shoe%20store',
    excerpt: '始于民国的老美华，以手工缝制技艺与舒适耐穿著称，延续匠作精神。',
    content: `老美华鞋履的工艺强调楦型与针脚，讲究脚感与耐用性，体现传统与现代生活的结合。
    品牌在城市更新中通过联名与设计焕新，重塑老字号的当代价值。`,
    tags: ['天津', '手工', '品牌焕新']
  }
  ,
  {
    id: 10,
    title: '利顺德饭店：近代史的见证者',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Lishunde%20Hotel%20historic%20building%20photo',
    excerpt: '始建于1863年的利顺德饭店，是近代中国对外交流与现代文明传播的重要窗口。',
    content: `利顺德饭店作为天津近代化的重要地标，承载着城市与国际交流的历史记忆。
    它见证了从租界到现代城市的变迁，成为研究近代史与城市文化的关键节点。`,
    tags: ['天津', '近代史', '建筑']
  },
  {
    id: 11,
    title: '相声：津门笑声的源与流',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Tianjin%20crosstalk%20performance%20historic%20photo',
    excerpt: '晚清以来在天津形成的曲艺形式，强调说学逗唱与语言节奏。',
    content: `相声在天津形成成熟的表演体系，影响至全国。其文本与表演的结合，成为研究民俗语言与城市文化的重要范式。`,
    tags: ['曲艺', '民俗', '相声', '天津']
  },
  {
    id: 12,
    title: '海河：城市记忆的水脉',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Haihe%20river%20historical%20photo%20bridge%20view',
    excerpt: '海河串联了天津的工业、商业与生活空间，记录了城市发展之路。',
    content: `海河两岸的工业遗产与公共空间更新，反映出城市从生产转向生活与文化的空间叙事。`,
    tags: ['海河', '城市更新', '工业遗产', '天津']
  },
  {
    id: 13,
    title: '耳朵眼炸糕：街巷里的甜香',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Erduoyan%20fried%20cake%20old%20shop%20historic%20photo',
    excerpt: '一口酥脆一口糯，承载着城市的往常与记忆。',
    content: `耳朵眼炸糕的技艺与口味，映照出城市饮食文化的多样性与延续性。`,
    tags: ['美食', '老字号', '街巷文化', '天津']
  },
  {
    id: 14,
    title: '桂发祥十八街麻花：脆香的标准',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Guifaxiang%20mahua%20historic%20workshop%20photo',
    excerpt: '条条分明与火候控制，构成了津味的独特记忆。',
    content: `通过包装、联名与设计升级，桂发祥在新时代展现老字号的新活力。`,
    tags: ['传统工艺', '品牌升级', '食品', '天津']
  },
  {
    id: 15,
    title: '泥人张：形神兼备的民间艺术',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Nirenzhang%20studio%20historic%20photo',
    excerpt: '以彩塑语言传达人物神韵，形成了津派美术的独特风格。',
    content: `泥人张彩塑在造型与色彩上形成规范体系，成为非遗传承与当代设计创新的重要来源。`,
    tags: ['非遗', '美术', '彩塑', '天津']
  },
  {
    id: 16,
    title: '荣宝斋木版水印：文人美学的传承',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Rongbaozhai%20woodblock%20printing%20workshop%20historic%20photo',
    excerpt: '以木版拓印复刻书画精品，凝结传统工艺与文人趣味。',
    content: `荣宝斋木版水印以分版分色的工艺复刻书画作品，讲究墨色层次与宣纸肌理的还原。
    它承载了近现代书画传播与大众审美普及的历史价值。`,
    tags: ['书画', '印刷', '非遗']
  },
  {
    id: 17,
    title: '全聚德烤鸭：京味烟火与匠心火候',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Quanjude%20Peking%20duck%20roasting%20historic%20restaurant%20photo',
    excerpt: '挂炉烤制成就酥脆鸭皮与香嫩鸭肉，成为京城餐饮名片。',
    content: `全聚德烤鸭以挂炉火候与刀工见长，皮酥肉嫩、肥而不腻。
    它折射近代城市餐饮业的标准化与品牌化进程。`,
    tags: ['美食', '北京', '餐饮文化']
  },
  {
    id: 18,
    title: '剪纸：红色的民间记忆',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20paper%20cutting%20folk%20art%20red%20patterns',
    excerpt: '以一刀一剪呈现民间审美与生活祝愿的图像艺术。',
    content: `剪纸重在构图的虚实与刀法的节奏，广泛用于节庆与礼俗。
    它是理解民间图像语言与社会情感表达的重要窗口。`,
    tags: ['民俗', '手工', '非遗']
  },
  {
    id: 19,
    title: '扬州漆器：光泽与时间的工艺',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Yangzhou%20lacquerware%20traditional%20craft%20studio',
    excerpt: '以髹饰工艺显现温润光泽，体现江南工艺的细腻美学。',
    content: `扬州漆器以髹、磨、描的工序见长，漆膜细致而耐久。
    在现代设计中通过纹样与配色焕新传统。`,
    tags: ['工艺', '漆器', '江苏']
  },
  {
    id: 20,
    title: '周村烧饼：薄脆之间的历史温度',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Zhoucun%20sesame%20biscuit%20traditional%20bakery%20photo',
    excerpt: '以薄、香、脆著称的老字号点心，见证商贾繁华与市井生活。',
    content: `周村烧饼讲究醒面、擀薄与火候控制，香酥不腻。
    它是齐鲁地区饮食文化与市镇经济记忆的载体。`,
    tags: ['美食', '山东', '老字号']
  },
  {
    id: 21,
    title: '景泰蓝：铜与火的色彩艺术',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Cloisonne%20enamel%20Beijing%20workshop%20historic%20photo',
    excerpt: '掐丝、烧蓝、镶嵌的综合工艺，呈现金属与釉彩的和鸣。',
    content: `景泰蓝以铜胎为骨、掐丝成线、填釉着色，历经多次烧制与打磨成型。
    其色彩语言与纹样体系体现宫廷美学的秩序与华彩。`,
    tags: ['工艺', '金属', '非遗']
  },
  {
    id: 22,
    title: '旗袍：东方曲线与近代都市美学',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Qipao%20cheongsam%20Shanghai%20fashion%20historic%20photo',
    excerpt: '在上海近代都市文化中形成风格，融合传统与现代的服饰语言。',
    content: `旗袍以立领、盘扣与收腰线条体现东方审美与身体叙事。
    它连接了女性身份、都市生活与时尚产业的多重维度。`,
    tags: ['服饰', '上海', '近代史']
  }
  ,
  // 中文注释：新增更多“老字号故事”作品项，补充图片与文本内容
  {
    id: 23,
    title: '徽墨：文房雅器的黑与光',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Hui%20inkstick%20carving%20workshop%20tools%20and%20patterns',
    excerpt: '以油烟与胶为材，经制、雕、磨等工序，呈现细腻墨性与雕刻美学。',
    content: `徽墨讲究原料比例与炼制火候，雕刻图案体现文人意趣与吉祥寓意。\n其与宣纸、毛笔、砚台共同构成书写系统的工艺基座。`,
    tags: ['文房', '工艺', '书写系统']
  },
  {
    id: 24,
    title: '蜀锦：经纬之间的繁复之美',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Shu%20brocade%20loom%20weaving%20workshop%20colorful%20patterns',
    excerpt: '以彩纬显花的织造工艺，呈现华美纹样与层次结构。',
    content: `蜀锦在组织结构与纹样布局上高度复杂，形成东方织造的代表体系。\n现代设计中常以其色彩与图形语言进行跨界再设计。`,
    tags: ['织造', '纹样', '非遗']
  },
  {
    id: 25,
    title: '潍坊风筝：骨与纸的空气造型',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Weifang%20kite%20making%20bamboo%20frame%20and%20painting',
    excerpt: '以竹骨为骨、宣纸为肤，结合彩绘形成可飞行的造型艺术。',
    content: `风筝结构讲究受力与配重，绘饰体现地域风格。\n在公共艺术与品牌活动中常见文化视觉化的应用。`,
    tags: ['民俗', '造型', '公共文化']
  },
  {
    id: 26,
    title: '宣纸：纤维网络的书写载体',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Xuan%20paper%20making%20workshop%20fiber%20pulp%20drying%20racks',
    excerpt: '以青檀与稻草为核心原料，形成强韧而吸墨的书写媒介。',
    content: `宣纸的吸墨与抗老化性能使其成为书画的经典载体。\n现代应用包括艺术复制、装帧设计与材质实验。`,
    tags: ['材料', '书画', '工艺']
  },
  {
    id: 27,
    title: '京味小吃体系：口味与技法的城市谱系',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Beijing%20street%20snacks%20assortment%20historic%20stall%20photo',
    excerpt: '以炒、炸、蒸多种技法构成风味结构，形成市井美食的文化谱系。',
    content: `通过技法、器具与配方的标准化，形成可复制的城市味觉记忆。\n品牌焕新案例中常以包装与故事化表达连接年轻消费。`,
    tags: ['美食', '城市文化', '品牌']
  },
  {
    id: 28,
    title: '景德镇青花：蓝与白的视觉秩序',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Jingdezhen%20blue%20and%20white%20porcelain%20museum%20display',
    excerpt: '以钴料呈色与釉下发色形成典型的青花视觉体系。',
    content: `青花瓷的色阶与笔触影响纹样表达的层次。\n当代衍生产品多以抽象化纹样实现现代场景适配。`,
    tags: ['陶瓷', '配色', '纹样']
  },
  {
    id: 29,
    title: '皮影戏：光与影的叙事装置',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20shadow%20puppet%20stage%20performance%20lamp%20and%20screen',
    excerpt: '以灯、幕、人、偶构成的叙事体系，表现动作与情感。',
    content: `皮影的造型语汇可迁移到品牌角色与动画设计中。\n其关节运动的平面化方法适合简洁叙事与节奏控制。`,
    tags: ['戏曲', '叙事', '设计借鉴']
  },
  {
    id: 30,
    title: '苏帮菜：火候与刀工的雅致风味',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Suzhou%20cuisine%20kitchen%20knife%20skills%20and%20plating',
    excerpt: '以清鲜平和的风味与精细刀工著称，呈现江南饮食美学。',
    content: `苏帮菜重在食材本味与火候控制，器皿与摆盘体现审美追求。\n在品牌传播中常以视觉化呈现“清雅平衡”的风格。`,
    tags: ['饮食文化', '江南', '美学']
  }
  ,
  // 中文注释：继续扩充“老字号故事”内容，保证类别覆盖与地域平衡
  {
    id: 31,
    title: '德化白瓷：温润如玉的器物语言',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Dehua%20blanc%20de%20chine%20porcelain%20museum%20display',
    excerpt: '以白釉细腻与造型圆融著称，呈现“玉质”般的光泽与肌理。',
    content: `德化白瓷强调胎釉匹配与温控曲线，人物与器物均体现柔和气质。
现代设计中以其“白”的审美延展到空间与品牌视觉。`,
    tags: ['陶瓷', '福建', '器物美学']
  },
  {
    id: 32,
    title: '张小泉：刀工与钢性的一体化标准',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20forging%20knife%20workshop%20Hangzhou',
    excerpt: '以锻造与热处理形成稳定钢性，建立现代刀剪标准。',
    content: `从材质到工艺流程的标准化，提升刀剪的使用寿命与安全性。
品牌更新以工艺叙事与生活方式拍摄强化信任。`,
    tags: ['金工', '品牌', '生活方式']
  },
  {
    id: 33,
    title: '潮绣：潮汕地域的立体绣艺',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chaozhou%20embroidery%20gold%20thread%20three-dimensional%20work',
    excerpt: '以金线与立体效果见长，呈现华美庄重的视觉表达。',
    content: `潮绣常用金银线与垫绣技术形成起伏层次，适合礼仪与陈设场景。
现代应用可转化为高端服饰与饰品的工艺亮点。`,
    tags: ['刺绣', '广东', '礼仪']
  },
  {
    id: 34,
    title: '宜兴紫砂：泥与火的壶学体系',
    thumbnail: 'https://picsum.photos/1920/1080?random=1',
    excerpt: '以泥料配比与成型技法构筑茶壶功能与美学的统一。',
    content: `紫砂壶讲究泥性、气孔与壁厚的平衡，成型与烧成决定出汤与保温。
传播中以“工与用”的叙事连接专业与大众。`,
    tags: ['陶瓷', '茶文化', '功能美学']
  },
  {
    id: 35,
    title: '雕版印刷：文字与木版的知识生产',
    thumbnail: 'https://picsum.photos/1920/1080?random=2',
    excerpt: '以手工刻版与印刷传递知识与审美，形成出版史的重要阶段。',
    content: `雕版印刷强调排版与刻工配合，墨色与纸材影响阅读体验。
现代延展包括艺术版画与手工出版的复兴。`,
    tags: ['出版', '木工', '版画']
  },
  {
    id: 36,
    title: '苗族银饰：锻敲与纹样的身体叙事',
    thumbnail: 'https://picsum.photos/1920/1080?random=3',
    excerpt: '以锻打、錾刻与焊接形成复杂纹样，承载族群身份与审美。',
    content: `银饰的构件组合体现工艺体系，纹样语言传递文化记忆。
在时尚与博物馆叙事中具有强烈的视觉辨识度。`,
    tags: ['金工', '民族文化', '饰品']
  },

];
// 中文注释：继续扩充“老字号故事”内容，增强类别与地域平衡
historicalStories.push(
  {
    id: 37,
    title: '汴绣：工笔绣法的精雅',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Kaifeng%20embroidery%20studio%20delicate%20stitches',
    excerpt: '以工笔式线描与设色形成精致画面，强调细节控制。',
    content: `汴绣借鉴工笔绘画的线与色方法，针法细密、层次丰富。
现代跨界多见于文创与礼盒的高雅表达。`,
    tags: ['刺绣', '河南', '工笔']
  },
  {
    id: 38,
    title: '剪纸：正负形的民间叙事',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20paper%20cutting%20traditional%20workshop%20red%20paper',
    excerpt: '以剪映与留白塑造叙事节奏，适合节庆与装饰。',
    content: `剪纸的构图强调正负形的平衡，图案常带吉祥寓意。
媒介转化容易，适合教育与轻量化设计。`,
    tags: ['民俗', '构图', '节庆']
  },
  {
    id: 39,
    title: '雕漆：髹饰之上的浮雕工艺',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20carved%20lacquer%20red%20carving%20workshop',
    excerpt: '以多层漆堆积后雕刻成形，呈现厚重与精致的统一。',
    content: `雕漆需要耐心与材料控制，适合器物与陈设的高端表达。
纹样语言常见缠枝与团花体系。`,
    tags: ['漆艺', '器物', '团花']
  },
  {
    id: 40,
    title: '绍兴黄酒：时间与陶的风味载体',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Shaoxing%20yellow%20wine%20traditional%20brewery%20jars',
    excerpt: '以陶坛贮存与发酵周期形成独有的香气与层次。',
    content: `黄酒的酿造强调时间与温度控制，陶坛微孔影响风味演化。
品牌叙事多以家族与地域记忆深化情感连接。`,
    tags: ['饮食文化', '酿造', '浙江']
  },
  {
    id: 41,
    title: '黎族织锦：经纬之间的身份纹样',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Li%20ethnic%20brocade%20loom%20patterns%20Hainan',
    excerpt: '以经纬显花形成部落纹样，承载族群记忆与美学。',
    content: `纹样语汇强调身份与故事，织造技法体现地域性。
适合服饰与空间软装的文化化应用。`,
    tags: ['织造', '民族文化', '纹样']
  },
  {
    id: 42,
    title: '匠作窗棂：几何秩序与光影',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20wooden%20lattice%20window%20craft%20workshop',
    excerpt: '以木构几何形成秩序美感，塑造空间的光影语言。',
    content: `窗棂的比例与榫卯影响整体视觉与耐久。
在品牌与界面设计中可转化为栅格系统的灵感。`,
    tags: ['建筑', '木作', '栅格']
  }
);

const tutorialVideos = [
  {
    id: 1,
    title: '苏绣基本针法教学',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Suzhou%20embroidery%20master%20teaching%20basic%20stitches',
    duration: '12:30',
    level: '入门',
    views: '12,458',
    description: '学习苏绣的基本针法，包括平针、齐针、套针等，掌握传统刺绣的基础技巧。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  },
  {
    id: 2,
    title: '宣纸制作工艺详解',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Xuan%20paper%20traditional%20making%20process',
    duration: '18:45',
    level: '进阶',
    views: '8,723',
    description: '详细了解中国传统宣纸的制作工艺，从原料采集到成品包装的全过程。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    id: 3,
    title: '景泰蓝掐丝技巧高级班',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Master%20teaching%20cloisonne%20wire%20inlay%20techniques',
    duration: '25:15',
    level: '高级',
    views: '6,342',
    description: '学习景泰蓝的高级掐丝技巧，掌握复杂图案的设计与制作方法。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  }
  ,
  {
    id: 4,
    title: '杨柳青年画配色与构图',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Yangliuqing%20New%20Year%20Painting%20color%20and%20composition%20class',
    duration: '14:20',
    level: '入门',
    views: '9,812',
    description: '从传统年画的色彩语言与构图方法入手，快速掌握入门技巧。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },
  {
    id: 5,
    title: '泥人张彩塑上色要点',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Nirenzhang%20coloring%20techniques%20master%20class',
    duration: '16:05',
    level: '进阶',
    views: '7,206',
    description: '讲解彩塑的调色、层次与光影表现，提升作品的生动性。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  },
  {
    id: 6,
    title: '传统色彩系统快速应用',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chinese%20traditional%20colors%20system%20tutorial%20palette%20demo',
    duration: '11:42',
    level: '入门',
    views: '10,134',
    description: '学习中国传统色的命名、搭配与在现代设计中的应用。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
  },
  {
    id: 7,
    title: '非遗IP形象设计流程',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Intangible%20heritage%20IP%20design%20process%20workflow%20diagram',
    duration: '19:30',
    level: '高级',
    views: '5,987',
    description: '结合案例讲解从调研、定位到风格落地的完整IP设计流程。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
  },
  {
    id: 8,
    title: '木版年画套色实操',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chinese%20woodblock%20New%20Year%20print%20multi%20color%20registration%20class',
    duration: '13:40',
    level: '入门',
    views: '8,105',
    description: '学习分版分色、对位套印等关键步骤，完成一幅多色年画。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4'
  },
  {
    id: 9,
    title: '榫卯结构入门',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chinese%20mortise%20and%20tenon%20joinery%20tutorial%20workbench',
    duration: '17:20',
    level: '进阶',
    views: '6,911',
    description: '介绍常见榫卯类型与制作要点，体验传统木作的精度与韧性。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4'
  },
  {
    id: 10,
    title: '皮影戏造型与制作基础',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chinese%20shadow%20puppet%20making%20tutorial%20cutting%20and%20coloring',
    duration: '15:05',
    level: '入门',
    views: '7,452',
    description: '从图样设计到皮革镂空与着色，完成一个可操演的皮影角色。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
  },
  {
    id: 11,
    title: '烙画技法初学',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chinese%20pyrography%20woodburning%20art%20beginner%20class',
    duration: '10:30',
    level: '入门',
    views: '9,001',
    description: '掌握温度控制与线面表现，完成一幅传统题材的烙画作品。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4'
  },
  {
    id: 12,
    title: '景德镇拉坯训练',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Jingdezhen%20porcelain%20wheel%20throwing%20class%20studio',
    duration: '18:10',
    level: '进阶',
    views: '5,604',
    description: '系统训练拉坯手法与成型要点，提升陶瓷器物的规格与稳定性。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/PopeyeSpecialEpisode.mp4'
  }
  ,
  // 中文注释：新增更多“非遗教程”视频项，补充缩略图与示例视频
  {
    id: 13,
    title: '篆刻入门：起刀与章法',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chinese%20seal%20carving%20tutorial%20tools%20and%20stone',
    duration: '12:20',
    level: '入门',
    views: '9,324',
    description: '讲解印刀起落与章法排布，完成一枚基础篆刻作品。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
  },
  {
    id: 14,
    title: '髹漆基础：打磨与髹涂',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chinese%20lacquerware%20polishing%20and%20coating%20tutorial',
    duration: '14:05',
    level: '入门',
    views: '8,112',
    description: '从基底处理到髹涂节奏，掌握漆面均匀与光泽控制。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
  },
  {
    id: 15,
    title: '织锦图案拆解与配色',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Brocade%20pattern%20analysis%20and%20color%20palette%20tutorial',
    duration: '16:10',
    level: '进阶',
    views: '7,546',
    description: '以经典纹样为例拆解组织结构，并给出现代配色建议。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
  },
  {
    id: 16,
    title: '青花瓷纹样临摹与再设计',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Blue%20and%20white%20porcelain%20pattern%20redesign%20class',
    duration: '13:55',
    level: '进阶',
    views: '6,987',
    description: '从临摹入手，给出现代场景应用的图形化方法。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  },
  {
    id: 17,
    title: '皮影人物关节设计与操演',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Shadow%20puppet%20joint%20design%20and%20performance%20tutorial',
    duration: '15:20',
    level: '入门',
    views: '8,401',
    description: '讲解关节设计与连线控制，完成一个可操演的角色。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4'
  },
  {
    id: 18,
    title: '木作：榫卯结构实操演练',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Mortise%20and%20tenon%20joint%20practice%20bench%20tutorial',
    duration: '20:00',
    level: '高级',
    views: '5,203',
    description: '以常见榫型为例进行实操训练，强调精度与耐久。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4'
  },
  {
    id: 19,
    title: '传统色体系：情绪板到视觉落地',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chinese%20traditional%20colors%20moodboard%20and%20design%20application%20tutorial',
    duration: '12:48',
    level: '入门',
    views: '9,774',
    description: '建立情绪板并进行版式与海报应用，形成风格闭环。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },
  {
    id: 20,
    title: '非遗IP创作：角色到周边套系',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Heritage%20IP%20character%20design%20and%20merch%20set%20tutorial',
    duration: '22:35',
    level: '高级',
    views: '6,115',
    description: '从角色设定到周边开发，梳理完整创作与落地流程。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  }
  ,
  // 中文注释：继续扩充“非遗教程”，覆盖材料、造型、数字化等方向
  {
    id: 21,
    title: '紫砂壶成型：泥性与壁厚控制',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Yixing%20zisha%20teapot%20making%20wheel%20throwing%20tutorial',
    duration: '17:35',
    level: '进阶',
    views: '6,502',
    description: '讲解泥料与厚薄控制，保障器物功能与手感的统一。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  },
  {
    id: 22,
    title: '银饰錾刻入门：纹样与工具',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chinese%20silver%20chasing%20tools%20and%20patterns%20tutorial',
    duration: '12:58',
    level: '入门',
    views: '8,024',
    description: '认识錾刻工具与基础纹样，完成一个小型饰件。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
  },
  {
    id: 23,
    title: '德化白瓷修坯与釉面处理',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Dehua%20porcelain%20trimming%20and%20glazing%20tutorial',
    duration: '14:12',
    level: '入门',
    views: '7,313',
    description: '掌握修坯与上釉流程，获得温润均匀的釉面效果。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },
  {
    id: 24,
    title: '潮绣金线立体效果实现',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chaozhou%20embroidery%20gold%20thread%20technique%20tutorial',
    duration: '16:22',
    level: '进阶',
    views: '6,941',
    description: '通过垫绣与线材控制实现立体层次与光泽表达。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  },
  {
    id: 25,
    title: '雕版印刷：套色与对位',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chinese%20woodblock%20printing%20registration%20tutorial',
    duration: '13:05',
    level: '入门',
    views: '9,106',
    description: '学习套色版的对位与墨色控制，完成多色印刷。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4'
  },
  {
    id: 26,
    title: '非遗数字化：纹样矢量化方法',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chinese%20patterns%20vectorization%20digital%20design%20tutorial',
    duration: '18:40',
    level: '高级',
    views: '5,804',
    description: '以经典纹样为例，讲解从扫描到矢量的清理与规范。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  }
];
// 中文注释：继续扩充“非遗教程”，覆盖雕漆、剪纸、黎锦、界面栅格、品牌与AI
tutorialVideos.push(
  {
    id: 27,
    title: '雕漆基础：堆漆与浅雕',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chinese%20carved%20lacquer%20tutorial%20tools%20and%20layers',
    duration: '12:20',
    level: '入门',
    views: '8,412',
    description: '认识堆漆层与浅雕方法，完成小型器物表面练习。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
  },
  {
    id: 28,
    title: '剪纸构图：正负形与留白',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chinese%20paper%20cutting%20composition%20tutorial',
    duration: '13:10',
    level: '入门',
    views: '9,031',
    description: '以经典题材练习正负形平衡与叙事节奏控制。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
  },
  {
    id: 29,
    title: '黎锦纹样拆解与重构',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Li%20ethnic%20brocade%20pattern%20analysis%20tutorial',
    duration: '15:40',
    level: '进阶',
    views: '6,772',
    description: '拆解组织结构并进行现代场景的图形化重构。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
  },
  {
    id: 30,
    title: '窗棂几何到界面栅格',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Chinese%20lattice%20geometry%20to%20UI%20grid%20tutorial',
    duration: '16:00',
    level: '进阶',
    views: '6,205',
    description: '将传统几何比例转化为UI栅格规则与版式实践。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
  },
  {
    id: 31,
    title: '黄酒品牌叙事与视觉',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Shaoxing%20yellow%20wine%20brand%20story%20visual%20tutorial',
    duration: '12:45',
    level: '入门',
    views: '8,509',
    description: '构建时间与地域记忆的品牌视觉线索，完成海报练习。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  },
  {
    id: 32,
    title: '非遗纹样的AI辅助生成流程',
    thumbnail: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=AI%20assisted%20Chinese%20pattern%20generation%20workflow%20tutorial',
    duration: '18:25',
    level: '高级',
    views: '5,402',
    description: '从参考采集到提示词设计与清理规范的完整流程。',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
  }
);

const culturalElements = [
  {
    id: 1,
    name: '龙纹',
    category: '纹样',
    description: '中国传统文化中最具代表性的纹样之一，象征权力、尊贵与吉祥。',
    history: '龙纹的出现可追溯至新石器时代，经过历代演变，成为中国传统文化的重要象征。',
    usage: '常用于皇家服饰、建筑装饰、工艺品等，代表至高无上的权力和地位。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20dragon%20pattern'
  },
  {
    id: 2,
    name: '青花瓷',
    category: '陶瓷',
    description: '中国传统陶瓷工艺的珍品，以白地青花为主要特征。',
    history: '青花瓷始于唐代，成熟于元代，明清时期达到鼎盛，是中国陶瓷的重要品种。',
    usage: '主要用于日用器皿、陈设艺术品等，是中国陶瓷文化的重要代表。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Blue%20and%20white%20porcelain%20vase'
  },
  {
    id: 3,
    name: '中国红',
    category: '色彩',
    description: '中国传统文化中最具代表性的色彩，象征喜庆、吉祥与热情。',
    history: '红色在中国传统文化中有着特殊的意义，早在原始社会就被视为生命的象征。',
    usage: '常用于节日庆典、婚礼、传统服饰等场合，是中国文化的重要符号。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20Chinese%20red%20color%20elements%20collage'
  },
  {
    id: 4,
    name: '杨柳青年画',
    category: '非遗',
    description: '天津传统木版年画，构图生动、色彩鲜明，与苏州桃花坞并称。',
    history: '始于明代，清代成熟，形成“南桃北柳”的艺术格局，成为北方年画代表。',
    usage: '节庆装饰、文创商品、视觉主题，适合融入海报与包装设计。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Yangliuqing%20New%20Year%20Painting%20elements'
  },
  {
    id: 5,
    name: '泥人张彩塑',
    category: '非遗',
    description: '以形神兼备著称的民间彩塑艺术，人物生动传神。',
    history: '道光年间兴起，传承至今，形成独特的造型与彩绘语言体系。',
    usage: '展陈装饰、IP形象设计、联名文创，增强地域文化辨识度。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Nirenzhang%20clay%20sculpture%20elements'
  }
  ,
  {
    id: 6,
    name: '回纹',
    category: '纹样',
    description: '由连续折线构成的几何纹样，寓意连绵不断与吉祥。',
    history: '汉代兴起，唐宋成熟，广泛用于织物、器物与建筑装饰。',
    usage: '适合用于边框、版式装饰与现代图形语言的延展。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Hui%20pattern%20geometric%20Chinese%20motif'
  },
  {
    id: 7,
    name: '海河蓝',
    category: '色彩',
    description: '以天津海河为灵感的蓝色系，清澈沉稳，具有地域辨识度。',
    history: '源于城市水系的视觉记忆，成为地区品牌色彩的研究方向。',
    usage: '用于品牌视觉与海报背景，搭配金色或白色形成高级感。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Haihe%20blue%20color%20swatch%20palette'
  },
  {
    id: 8,
    name: '京剧脸谱',
    category: '戏曲',
    description: '以色彩与图形传达人物性格的面部绘饰系统。',
    history: '清中叶形成体系，不同颜色与纹样代表各类角色与性格。',
    usage: '用于IP化设计、教育科普与跨界联名视觉元素。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Peking%20opera%20masks%20collection'
  },
  {
    id: 9,
    name: '如意纹',
    category: '纹样',
    description: '由云头形演变而来的装饰纹样，寓意吉祥如意。',
    history: '明清时期广泛流行，常见于家具、器物与服饰。',
    usage: '适合用于高端包装与传统美学主题的图形语言。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Ruyi%20cloud%20pattern%20Chinese%20motif'
  },
  {
    id: 10,
    name: '相声段子结构',
    category: '民俗',
    description: '以起承转合的段子结构塑造节奏与笑点的语言艺术。',
    history: '晚清至民国在天津兴起，形成说学逗唱的表演体系。',
    usage: '用于内容创作方法论梳理与文化产品的故事化表达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Crosstalk%20performance%20elements%20diagram'
  },
  {
    id: 11,
    name: '祥云纹',
    category: '纹样',
    description: '由连绵云头构成的吉祥纹样，寓意瑞气与福泽。',
    history: '汉唐以来流行，广泛应用于织物与器物装饰。',
    usage: '适合用于版式边饰、礼盒包装与节庆视觉主题。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20auspicious%20cloud%20pattern%20motif'
  },
  {
    id: 12,
    name: '冰裂纹',
    category: '陶瓷',
    description: '釉面自然开片形成裂纹肌理，具有独特美感。',
    history: '宋代官窑常见，后世沿用并发展出多种裂纹类型。',
    usage: '用于陶瓷表面肌理表现与现代材质仿制设计。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20crackle%20glaze%20ceramic%20texture'
  },
  {
    id: 13,
    name: '团寿纹',
    category: '纹样',
    description: '以篆书“寿”字为核心的几何纹样，寓意长寿吉祥。',
    history: '明清家具与织锦中常见，成为祝寿主题的标准图式。',
    usage: '适合用于礼仪用品与传统主题的品牌化视觉。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20longevity%20character%20pattern%20motif'
  },
  {
    id: 14,
    name: '缠枝莲',
    category: '纹样',
    description: '枝蔓环绕的连续花卉纹样，结构优雅、层次丰富。',
    history: '盛行于唐宋，明清器物与建筑装饰中尤为常见。',
    usage: '用于高端包装、织物花纹与传统美学类产品。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20arabesque%20lotus%20scroll%20pattern'
  },
  {
    id: 15,
    name: '榫卯结构',
    category: '工艺',
    description: '以凹凸相咬的木作连接方式实现稳固与可拆。',
    history: '源于先秦，至明清成熟，成为传统家具与建筑的核心技法。',
    usage: '面向产品结构设计与教育科普，体现“无钉无胶”的生态理念。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20mortise%20and%20tenon%20joinery%20diagram'
  },
  {
    id: 16,
    name: '宋人美学色系',
    category: '色彩',
    description: '以雅致、克制为特点的配色体系，强调低饱和与质感。',
    history: '源于宋代器物与绘画的色彩取向，影响后世审美。',
    usage: '用于品牌视觉降噪与文化主题的高级质感塑造。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Song%20dynasty%20aesthetic%20color%20palette'
  },
  {
    id: 17,
    name: '篆书印章',
    category: '书法',
    description: '以小篆为主要字形的印刻艺术，讲究结体与刀法。',
    history: '秦汉以来形成章法，明清文人雅集中尤受推崇。',
    usage: '用于IP签名、文创标识与传统文书系统的视觉符号。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20seal%20carving%20zhuanshu%20script%20collection'
  },
  {
    id: 18,
    name: '皮影造型语言',
    category: '民俗',
    description: '以镂空剪刻与平面关节表现人物神态与动作。',
    history: '起源于汉唐，明清成熟，形成多地域流派与风格。',
    usage: '用于角色IP化设计与叙事动画的民间造型借鉴。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20shadow%20puppet%20design%20language%20elements'
  }
  ,
  // 中文注释：新增更多“文化元素”项，补充图片与应用建议
  {
    id: 19,
    name: '缠枝牡丹',
    category: '纹样',
    description: '以牡丹为主题的连续纹样，华美丰盛、层次丰富。',
    history: '明清器物与织物中常见，寓意富贵与繁荣。',
    usage: '适合礼品包装与节庆主题的图形化应用。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20peony%20arabesque%20pattern%20motif'
  },
  {
    id: 20,
    name: '青花缠枝纹',
    category: '陶瓷',
    description: '以青花钴料绘制的缠枝纹样，具有典型的蓝白秩序。',
    history: '元明清时期成熟，成为经典青花装饰。',
    usage: '用于器物再设计与现代平面图形抽象化。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Blue%20and%20white%20porcelain%20arabesque%20pattern'
  },
  {
    id: 21,
    name: '云雷纹',
    category: '纹样',
    description: '由云与雷形组合的规整几何纹样，寓意天地运行。',
    history: '商周青铜器常见，后世延展成多种组合样式。',
    usage: '用于版式边框与品牌图形语言的秩序化表达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20cloud%20and%20thunder%20pattern%20motif'
  },
  {
    id: 22,
    name: '海水江崖纹',
    category: '纹样',
    description: '以海浪与岩崖组合的纹样，常用于吉服与宫廷装饰。',
    history: '清代吉服常用，呈现尊贵场景的视觉符号。',
    usage: '适合礼仪主题与高端视觉的图形化表达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20seawave%20and%20rock%20pattern%20motif'
  },
  {
    id: 23,
    name: '仿宋配色',
    category: '色彩',
    description: '低饱和、低对比的克制色系，强调雅致质感。',
    history: '源于宋代器物与绘画的审美取向。',
    usage: '用于品牌视觉降噪与产品质感塑造。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Song%20style%20muted%20color%20palette%20swatches'
  },
  {
    id: 24,
    name: '剪纸构图语言',
    category: '民俗',
    description: '以剪映的正负形与留白形成视觉节奏与叙事。',
    history: '汉唐以来广泛流行，节庆与礼俗场景常见。',
    usage: '适合海报构图与图形叙事的轻量化表达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20paper%20cutting%20composition%20language%20elements'
  },
  {
    id: 25,
    name: '缂丝肌理',
    category: '织造',
    description: '以经纬断续显花的织造方式形成独特肌理与边界。',
    history: '宋元成熟，常用于高端织物与陈设。',
    usage: '用于材质仿真与纹理设计的灵感来源。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Kesi%20silk%20weaving%20texture%20macro'
  },
  {
    id: 26,
    name: '团花纹',
    category: '纹样',
    description: '以圆形组合的花卉纹样，强调中心化与对称秩序。',
    history: '明清织锦与器物装饰常见。',
    usage: '适合品牌徽章与礼盒主题的图形延展。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20roundel%20floral%20pattern%20motif'
  }
  ,
  // 中文注释：继续扩充“文化元素”，覆盖纹样、色彩、材质与民俗
  {
    id: 27,
    name: '夔龙纹',
    category: '纹样',
    description: '源于青铜器的龙形纹样，结构抽象而有力量感。',
    history: '商周青铜器中常见，后世在织物与器物装饰中延续。',
    usage: '用于品牌纹章与科技风格的东方化表达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Kui%20dragon%20pattern%20Chinese%20bronze%20motif'
  },
  {
    id: 28,
    name: '缂丝色阶',
    category: '织造',
    description: '通过断续显花形成的细腻色阶过渡，强调质感。',
    history: '宋元时期成熟，常见于高端陈设与服饰。',
    usage: '适合材质仿真与高端产品的视觉语言。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Kesi%20silk%20color%20gradations%20macro'
  },
  {
    id: 29,
    name: '工笔设色',
    category: '绘画',
    description: '以细致线描与层层设色形成精雅画面。',
    history: '宋元以来成熟，后世在花鸟与人物画中广泛应用。',
    usage: '用于插画风格转化与产品包装的细腻表达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Gongbi%20painting%20coloring%20technique%20elements'
  },
  {
    id: 30,
    name: '缎纹织物光泽',
    category: '材质',
    description: '以组织结构形成的镜面光泽，体现高档与典雅质感。',
    history: '丝织品中常见，成为礼仪服饰与陈设的重要材质。',
    usage: '用于高端视觉与产品材质的仿真设计。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Satin%20weave%20fabric%20gloss%20macro'
  },
  {
    id: 31,
    name: '鱼鳞纹',
    category: '纹样',
    description: '由重复的鳞片形构成的秩序纹样，象征繁衍与祥瑞。',
    history: '汉唐以来常见，器物与建筑装饰中频繁使用。',
    usage: '适合模块化图形与界面背景的秩序化表现。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Fish%20scale%20pattern%20Chinese%20motif'
  },
  {
    id: 32,
    name: '窗棂几何',
    category: '建筑',
    description: '以木构窗棂的几何组合形成光影与秩序美感。',
    history: '明清民居与园林建筑中常见，体现匠作的细节美。',
    usage: '用于界面栅格与品牌几何语言的东方化灵感。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20lattice%20window%20geometry%20patterns'
  }
];
// 中文注释：继续扩充“文化元素”，加入纹样、材质、构图、织造、光影与配色
culturalElements.push(
  {
    id: 33,
    name: '夔龙纹抽象化',
    category: '纹样',
    description: '以夔龙纹的线性骨架抽象出现代图形元素。',
    history: '源于青铜器纹样的线性抽象。',
    usage: '用于高科技感的东方化品牌元素。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Abstract%20Kui%20dragon%20pattern%20graphic'
  },
  {
    id: 34,
    name: '雕漆层理',
    category: '材质',
    description: '多层漆面形成的层理肌理与截面纹路。',
    history: '在髹饰基础上发展出的雕刻工艺表现。',
    usage: '用于材质仿真与产品表面设计。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Carved%20lacquer%20layers%20texture%20macro'
  },
  {
    id: 35,
    name: '剪纸正负形',
    category: '构图',
    description: '以留白与剪映构成的节奏化图形语言。',
    history: '民间剪纸的构图规律在现代设计中延展。',
    usage: '用于轻量化海报与图形叙事。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20paper%20cutting%20positive%20negative%20space%20design'
  },
  {
    id: 36,
    name: '黎锦色阶',
    category: '织造',
    description: '经纬显花形成的色阶过渡与边界。',
    history: '黎族织造体系中的色彩语言。',
    usage: '用于材质仿真与图形渐变设计。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Li%20brocade%20color%20gradations%20macro'
  },
  {
    id: 37,
    name: '窗棂阴影',
    category: '光影',
    description: '几何窗棂在光照下形成的秩序阴影。',
    history: '建筑细部带来的空间光影语言。',
    usage: '用于界面背景与摄影布景。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Lattice%20window%20shadows%20geometric%20pattern'
  },
  {
    id: 38,
    name: '黄酒色系',
    category: '色彩',
    description: '以酒液与陶坛为灵感的暖色系。',
    history: '酿造文化的视觉化提炼。',
    usage: '用于品牌与美食主题的配色参考。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Shaoxing%20yellow%20wine%20color%20palette'
  }
);

// 中文注释：工艺百科数据（图片+详情）
const encyclopediaEntries = [
  {
    id: 1,
    title: '榫卯结构',
    category: '工艺',
    description: '以凹凸咬合实现稳固与可拆的传统木作连接方式。',
    content: '常见榫型包括燕尾榫、穿插榫、抱肩榫等，强调精度与木性理解，适用于家具与建筑构件。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Mortise%20and%20tenon%20joinery%20close-up%20workbench%20tools'
  },
  {
    id: 2,
    title: '髹漆工艺',
    category: '工艺',
    description: '以多次打磨与髹涂形成温润光泽与耐久表面的东方涂饰。',
    content: '流程包括基底处理、灰胎制作、髹涂与打磨，呈现漆膜的厚度与光泽层次，适合器物与家具。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20lacquerware%20workshop%20polishing%20and%20coating'
  },
  {
    id: 3,
    title: '苏绣针法',
    category: '刺绣',
    description: '以细腻针法呈现绣面光泽与层次，强调色线过渡与针脚密度。',
    content: '常用平针、齐针、掺针等，图像表现重在色阶与质感控制，适合花鸟与器物题材。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Suzhou%20embroidery%20needles%20and%20silk%20threads%20macro'
  },
  {
    id: 4,
    title: '青瓷烧制',
    category: '陶瓷',
    description: '以釉色温润与胎体细密著称，代表东方审美中的“青”。',
    content: '青瓷强调釉层与胎体匹配，烧成气氛与温度控制影响绿色层次，适用于器皿与陈设。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Celadon%20ceramics%20kiln%20firing%20studio'
  },
  {
    id: 5,
    title: '皮影刻制',
    category: '民俗',
    description: '以镂空剪刻与平面关节实现操演的角色造型语言。',
    content: '刻制流程包含画样、刻镂、染色与组装，关节以线连接实现动作，适合叙事表演与教育。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20shadow%20puppet%20carving%20tools%20and%20leather'
  },
  {
    id: 6,
    title: '篆刻章法',
    category: '书法',
    description: '以印面布局与线质表现为核心，讲究虚实与边款。',
    content: '章法重视字形与刀路节奏，边款与印石选择影响整体审美，常用于名章与作品落款。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20seal%20carving%20stone%20and%20tools%20close-up'
  }
];
// 中文注释：继续扩充“工艺百科”，补充漆艺、民俗、织造、建筑、酿造与数字化
// 将扩充条目放在数组声明之后，避免声明前调用

// 中文注释：继续扩充“工艺百科”条目，覆盖材料、织造与绘画
const encyclopediaEntriesExtra = [
  {
    id: 7,
    title: '德化白瓷',
    category: '陶瓷',
    description: '以温润白釉与圆融造型著称，呈现“玉质”美感。',
    content: '强调胎釉匹配与烧成温控，适合器物与人物题材的细腻表达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Dehua%20blanc%20de%20chine%20porcelain%20studio'
  },
  {
    id: 8,
    title: '潮绣金线技法',
    category: '刺绣',
    description: '以金线与垫绣形成立体层次与光泽效果。',
    content: '通过材料与针法的组合控制起伏，适合礼仪与陈设场景。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chaozhou%20embroidery%20gold%20thread%20technique'
  },
  {
    id: 9,
    title: '雕版套色',
    category: '版画',
    description: '以多版套印实现层次与色彩秩序的传统印刷方法。',
    content: '关键在对位与墨色控制，适合海报与艺术复制。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20woodblock%20printing%20registration'
  },
  {
    id: 10,
    title: '缂丝组织',
    category: '织造',
    description: '以断续显花形成边界清晰的图案与肌理。',
    content: '可用于材质仿真与图形设计的纹理来源。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Kesi%20silk%20weaving%20structure%20macro'
  },
  {
    id: 11,
    title: '工笔设色',
    category: '绘画',
    description: '细致线描与层层设色，形成精雅细腻的画面。',
    content: '适合插画与产品包装的细节表达，便于现代转化。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Gongbi%20painting%20coloring%20technique'
  },
  {
    id: 12,
    title: '紫砂成型要点',
    category: '陶瓷',
    description: '围绕泥性与壁厚控制，保障器物功能与手感。',
    content: '通过成型与修坯形成稳定结构，适合功能器物设计。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Yixing%20zisha%20teapot%20making%20bench'
  }
];
// 中文注释：继续扩充“工艺百科”条目，新增 50 项以丰富主列表
const encyclopediaEntriesMore = [
  {
    id: 13,
    title: '木版年画',
    category: '版画',
    description: '以手工刻版与套色印制呈现民间审美与节庆文化。',
    content: '强调分版分色与套印对位，墨色与纸张肌理共同构成独特质感，适用于文化产品与装饰。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20woodblock%20New%20Year%20prints%20carving%20and%20printing'
  },
  {
    id: 14,
    title: '景泰蓝掐丝珐琅',
    category: '金工',
    description: '以金属掐丝与珐琅填色烧制形成华美器饰。',
    content: '工艺包括制胎、掐丝、点蓝与烧制，呈现金属线与釉色的层次光泽，适合器物与珠宝装饰。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Cloisonne%20enamel%20workshop%20wire%20and%20enamel'
  },
  {
    id: 15,
    title: '失蜡铸造',
    category: '金工',
    description: '以蜡模熔失形成空腔，再浇注金属获得复杂形态。',
    content: '工艺流程含制蜡模、包壳、烧蜡与浇注，适合复杂立体构件与雕塑的制作。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Lost%20wax%20casting%20process%20metal%20foundry'
  },
  {
    id: 16,
    title: '蓝染扎染',
    category: '染织',
    description: '以植物靛蓝为染料，结合扎缚与浸染形成独特纹样。',
    content: '强调扎缚结构与染液氧化过程控制，适用于服饰、家居与视觉设计的纹样来源。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Indigo%20dyeing%20shibori%20technique%20fabric%20workshop'
  },
  {
    id: 17,
    title: '蜀锦织造',
    category: '织造',
    description: '以多纬提花形成华丽纹样，呈现丝绸的光泽与层次。',
    content: '强调组织结构与图案设计的配合，适合高端织物与文化衍生品。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Sichuan%20shu%20brocade%20loom%20weaving'
  },
  {
    id: 18,
    title: '云锦织造',
    category: '织造',
    description: '以通经断纬技术显花，形成立体纹样与金线光泽。',
    content: '工艺强调纹样设定与经纬转换，适用于礼服、装饰与文创设计。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Nanjing%20yun%20brocade%20traditional%20loom'
  },
  {
    id: 19,
    title: '唐卡绘制',
    category: '绘画',
    description: '以矿物颜料与严谨章法绘制宗教题材的细腻画作。',
    content: '强调底料、勾线与设色层次控制，适用于精细视觉与文化传达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Thangka%20painting%20workshop%20mineral%20pigments'
  },
  {
    id: 20,
    title: '斗拱结构',
    category: '建筑',
    description: '以木构层层出跳承重与传力，体现东方结构美学。',
    content: '强调榫卯配合与荷载传递路径，适用于文化空间与结构设计灵感。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20dougong%20bracket%20wooden%20architecture'
  },
  {
    id: 21,
    title: '石雕阴刻',
    category: '雕刻',
    description: '以阴线刻入石材呈现线性与体量的结合。',
    content: '强调刀路与材质肌理的关系，适合碑刻与装饰构件。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Stone%20carving%20engraving%20chisel%20work'
  },
  {
    id: 22,
    title: '木雕浮雕',
    category: '雕刻',
    description: '以浮雕层次表现立体感与光影。',
    content: '强调起伏层次与纹理走向，适合器物装饰与建筑细部。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Wood%20relief%20carving%20workbench'
  },
  {
    id: 23,
    title: '青花分水',
    category: '陶瓷',
    description: '以水分控制实现青花色阶过渡与层次。',
    content: '强调颜料浓稀与笔触控制，适合器皿图案绘制与再设计。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Blue%20and%20white%20porcelain%20painting%20technique'
  },
  {
    id: 24,
    title: '磁州窑黑白釉',
    category: '陶瓷',
    description: '以黑白对比呈现强烈图像语言，具朴拙美感。',
    content: '强调胎釉匹配与烧成气氛控制，适合图案化器物设计与视觉传达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Cizhou%20ware%20black%20and%20white%20glaze%20ceramics'
  },
  {
    id: 25,
    title: '汝瓷调釉',
    category: '陶瓷',
    description: '以温润釉色与开片美形成东方审美的代表。',
    content: '强调原料与窑温的精准控制，适合高端器物与陈设的制作与研究。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Ru%20ware%20celadon%20glaze%20studio'
  },
  {
    id: 26,
    title: '竹编技法',
    category: '编织',
    description: '以经纬交错与结构编织形成器形与纹理。',
    content: '强调材料韧性与结构稳定性，适用于器物与装置艺术的构造。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Bamboo%20weaving%20craft%20techniques%20workshop'
  },
  {
    id: 27,
    title: '草编技法',
    category: '编织',
    description: '以植物纤维编织形成轻质器物与纹样。',
    content: '强调编织结构与造型比例，适合生活器物与可持续材料研究。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Straw%20weaving%20craft%20traditional%20workshop'
  },
  {
    id: 28,
    title: '螺钿嵌饰',
    category: '漆艺',
    description: '以贝壳切片嵌入漆面形成光泽纹样。',
    content: '强调切片厚度与嵌饰位置的精度控制，适合器物装饰与家具表面设计。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Mother%20of%20pearl%20inlay%20lacquer%20art'
  },
  {
    id: 29,
    title: '金属錾刻',
    category: '金工',
    description: '以錾刻锤击在金属表面形成纹样与起伏。',
    content: '强调工具控制与节奏，适合器物表面装饰与徽章制作。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Metal%20chasing%20and%20repousse%20workshop'
  },
  {
    id: 30,
    title: '锔瓷修复',
    category: '修复',
    description: '以金属钉或胶合修复破损器物，呈现时间痕迹之美。',
    content: '强调结构稳定与美学平衡，适合文物修复与生活器物再生设计。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Kintsugi%20style%20ceramic%20repair%20workshop'
  },
  {
    id: 31,
    title: '碑帖临摹',
    category: '书法',
    description: '以拓本与法帖为范本进行书写训练，理解笔意与结体。',
    content: '强调线质与结构学习，适合传统书法的体系化研究与应用。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20calligraphy%20copying%20stele%20rubbings'
  },
  {
    id: 32,
    title: '篆书章法',
    category: '书法',
    description: '以篆书结体和章法布局形成庄重的文字美。',
    content: '强调笔画节奏与结构均衡，适用于印章设计与古典美学表达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Seal%20script%20calligraphy%20composition%20practice'
  },
  {
    id: 33,
    title: '斗方装裱',
    category: '装裱',
    description: '以宣纸与绫绢等材料进行装裱，保证画心稳定与观感。',
    content: '强调托裱与压平技法，适合书画的保存与展示。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20mounting%20and%20framing%20studio'
  },
  {
    id: 34,
    title: '宣纸洇墨控制',
    category: '绘画',
    description: '以纸性与水墨浓稀关系控制洇化与层次。',
    content: '强调水墨比例与用笔速度，适用于水墨画与书法效果研究。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Xuan%20paper%20ink%20bleeding%20study'
  },
  {
    id: 35,
    title: '破墨法',
    category: '绘画',
    description: '在湿墨未干时以色或墨破之，形成丰富肌理。',
    content: '强调时机与媒介关系，适用于山水画的气韵表达与材质研究。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Traditional%20ink%20painting%20po%20mo%20technique'
  },
  {
    id: 36,
    title: '木作打磨与刷漆',
    category: '木作',
    description: '以打磨与刷漆形成平整与光泽的表面品质。',
    content: '强调砂纸粒度与漆膜厚度控制，适用于家具与器物的表面工艺。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Woodworking%20sanding%20and%20varnishing%20workbench'
  },
  {
    id: 37,
    title: '手工烫金',
    category: '印刷',
    description: '以热压与金属箔转移形成金属光泽图文。',
    content: '强调温度与压力控制，适用于包装、书籍与证件的视觉提升。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Hot%20foil%20stamping%20handcraft%20press'
  },
  {
    id: 38,
    title: '实木拼板',
    category: '木作',
    description: '以拼接板材获得稳定结构与纹理统一。',
    content: '强调木性与胶合强度控制，适合家具板面与器物构造。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Solid%20wood%20panel%20glue%20up%20workshop'
  },
  {
    id: 39,
    title: '泥塑造型',
    category: '雕塑',
    description: '以黏土塑形构建体量与神采，便于后续翻制或烧制。',
    content: '强调结构比例与体块关系，适用于模型制作与雕塑创作。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Clay%20sculpting%20studio%20handbuilding'
  },
  {
    id: 40,
    title: '釉下彩绘',
    category: '陶瓷',
    description: '在施釉前绘制图案，经高温烧成与釉层融合。',
    content: '强调颜料与胎釉匹配，适合耐久图案与器物装饰。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Underglaze%20decoration%20ceramic%20painting'
  },
  {
    id: 41,
    title: '釉上粉彩',
    category: '陶瓷',
    description: '在低温釉面上以彩料绘制柔和色调，再次烧成固定。',
    content: '强调色料层次与低温烧成控制，适合器物的细腻彩饰。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Overglaze%20famille%20rose%20porcelain%20painting'
  },
  {
    id: 42,
    title: '珐琅彩工艺',
    category: '陶瓷',
    description: '以玻璃质彩料在瓷胎上低温烧制呈现华美色彩。',
    content: '强调彩料细腻与图案布局，适用于高端器物与艺术品。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Falangcai%20enamel%20on%20porcelain%20studio'
  },
  {
    id: 43,
    title: '琉璃烧制',
    category: '玻艺',
    description: '以高温熔融形成玻璃材质的器物与装饰。',
    content: '强调配料与温度曲线，适用于艺术器物与建筑装饰。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Glass%20kiln%20casting%20liuli%20studio'
  },
  {
    id: 44,
    title: '皮革雕刻',
    category: '皮艺',
    description: '以压刻与染色在皮面形成立体纹样与层次。',
    content: '强调湿润度与刀具控制，适合皮具个性化与工坊制作。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Leather%20carving%20tooling%20workbench'
  },
  {
    id: 45,
    title: '盘金绣',
    category: '刺绣',
    description: '以金线盘绕固定形成金属光泽与立体效果。',
    content: '强调材料选择与固定针法节奏，适合礼服与陈设的华美表达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Goldwork%20embroidery%20couching%20technique'
  },
  {
    id: 46,
    title: '苗绣折线针',
    category: '刺绣',
    description: '以折线结构形成几何纹样，呈现族群审美。',
    content: '强调针法与图案之间的逻辑，适用于服饰与配件的图形语言。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Miao%20embroidery%20geometric%20stitches'
  },
  {
    id: 47,
    title: '苏扇制扇',
    category: '工艺',
    description: '以骨架、面料与绘饰综合呈现文人气质的团扇。',
    content: '强调结构稳定与画心美学统一，适用于文化礼品与收藏。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20hand%20fan%20making%20studio'
  },
  {
    id: 48,
    title: '剪纸镂空',
    category: '民俗',
    description: '以刀剪在纸面形成镂空与正负形构图。',
    content: '强调构图逻辑与纸张韧性，适用于节庆装饰与视觉符号。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20paper%20cutting%20craft%20studio'
  },
  {
    id: 49,
    title: '石版画制版',
    category: '版画',
    description: '以油水相斥原理在石版上制版印刷，层次细腻。',
    content: '强调绘制与制版的精准控制，适用于艺术复制与海报印制研究。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Lithography%20printmaking%20studio'
  },
  {
    id: 50,
    title: '拓印技法',
    category: '印刷',
    description: '以纸墨覆盖并摩擦获取纹理与文字的印迹。',
    content: '强调覆纸与摩擦力度控制，适合文物纹理采集与文化教育。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Rubbing%20technique%20Chinese%20ink%20and%20paper'
  },
  {
    id: 51,
    title: '黑陶烧制',
    category: '陶艺',
    description: '以还原气氛烧成形成黑色陶器，纹理质朴。',
    content: '强调泥料与窑气控制，适用于器物的古拙美学表达与材料研究。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Black%20pottery%20kiln%20reduction%20firing'
  },
  {
    id: 52,
    title: '紫檀木打磨',
    category: '木作',
    description: '以细致磨抛呈现木材油性与光泽，提升触感。',
    content: '强调砂纸序列与油蜡处理，适合高端家具与器物表面。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Rosewood%20sanding%20and%20polishing%20workbench'
  },
  {
    id: 53,
    title: '铜器铸造',
    category: '金工',
    description: '以砂型或金属模进行浇注，获得稳定器形与纹饰。',
    content: '强调合金与浇注工艺控制，适用于器物、铃铛与装饰品。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Bronze%20casting%20foundry%20workshop'
  },
  {
    id: 54,
    title: '铠甲编结',
    category: '编织',
    description: '以金属片或皮革单元以结绳连接形成柔性护具。',
    content: '强调连接结构与受力分布，适用于服饰装置与文化复原。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Lamellar%20armor%20lacing%20technique'
  },
  {
    id: 55,
    title: '结绳图案',
    category: '编织',
    description: '以绳结结构形成装饰性与功能性的图形语言。',
    content: '强调结法与节奏，适用于饰品、器物与交互装置设计。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20knot%20patterns%20craft%20studio'
  },
  {
    id: 56,
    title: '鱼皮衣制作',
    category: '服饰',
    description: '以鱼皮加工与缝制形成独特材质服饰。',
    content: '强调去鳞与软化处理及缝制结构，适用于文化服饰与材料实验。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Fish%20skin%20clothing%20traditional%20craft'
  },
  {
    id: 57,
    title: '牙雕微刻',
    category: '雕刻',
    description: '以微小刀具在牙材或替代材上细刻纹样与文字。',
    content: '强调放大观察与稳定手势，适用于微观雕刻与首饰细节。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Miniature%20engraving%20ivory%20substitute%20material'
  },
  {
    id: 58,
    title: '玉雕抛光',
    category: '雕刻',
    description: '以磨抛与抛光展现玉材光泽与细腻触感。',
    content: '强调磨料与水介质控制，适用于玉器收尾与表面提升。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Jade%20carving%20polishing%20workshop'
  },
  {
    id: 59,
    title: '银丝镶嵌',
    category: '金工',
    description: '以细银丝镶嵌木器或器物表面形成图案。',
    content: '强调沟槽预制与银丝压入的细节控制，适用于器物装饰与高端工艺。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Silver%20wire%20inlay%20craft%20on%20wood'
  },
  {
    id: 60,
    title: '宜兴泥片成型',
    category: '陶瓷',
    description: '以泥片拍合成型，形成壶体等复杂器形。',
    content: '强调泥性与接口压实控制，适用于功能器物的稳定构造与美学表达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Yixing%20teapot%20slab%20building%20technique'
  },
  {
    id: 61,
    title: '石雕阳刻',
    category: '雕刻',
    description: '以阳刻方式保留线外体量，形成突出纹样。',
    content: '强调层次与光影关系，适用于碑刻与装饰构件的立体表达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Stone%20relief%20carving%20technique'
  },
  {
    id: 62,
    title: '金箔贴饰',
    category: '装饰',
    description: '以金箔贴覆在器物或建筑细部形成尊贵光泽。',
    content: '强调底材平整与黏着介质控制，适用于佛像、家具与建筑细部的装饰。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Gold%20leaf%20gilding%20application%20craft'
  },
  {
    id: 63,
    title: '宣纸制作',
    category: '纸艺',
    description: '以植物纤维与水道漂洗制成适宜书画的纸张。',
    content: '包含制浆、捞纸、压榨与晾晒，具吸水性与柔韧度。',
    image: 'https://picsum.photos/1920/1080?random=5'
  },
  {
    id: 64,
    title: '竹编结构',
    category: '编织',
    description: '以竹篾编织形成立体与纹理，结构轻而韧。',
    content: '分细割、篾片处理与编织，常用于器具、灯具与装饰。',
    image: 'https://picsum.photos/1920/1080?random=6'
  },
  {
    id: 65,
    title: '蜡染技法',
    category: '染织',
    description: '以蜡防染形成分割与纹理，呈现柔和的色阶效果。',
    content: '画蜡、染色、退蜡的流程，适合纺织与纸艺的图案表现。',
    image: 'https://picsum.photos/1920/1080?random=8'
  },
  {
    id: 66,
    title: '香云纱染整',
    category: '染织',
    description: '以植物染与泥染叠加获得独特铜褐光泽与手感。',
    content: '榄仁叶染与河泥捣染结合，日晒与抛光形成细腻质感。',
    image: 'https://picsum.photos/1920/1080?random=9'
  },
  {
    id: 67,
    title: '金银错工艺',
    category: '金工',
    description: '以金银嵌条在铁器表面形成纹样，对比强烈。',
    content: '锻打、嵌条与打磨流程，常用于器物装饰与陈设件。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Gold%20silver%20inlay%20Chinese%20metal%20craft%20close-up'
  },
  {
    id: 68,
    title: '砖雕工艺',
    category: '建筑装饰',
    description: '以泥坯雕刻与烧成形成立体纹样，适用于门楼壁面。',
    content: '模制与雕刻结合，强调层次与光影，常见于传统建筑。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Chinese%20brick%20carving%20temple%20ornament%20workshop'
  }
];
// 中文注释：继续扩充“传承人物”，增强地域与工艺多样性（将扩充放在数组声明之后）

// 中文注释：传承人物数据（图片+详情）
const heritageFigures = [
  {
    id: 1,
    name: '王师傅',
    field: '木作榫卯',
    bio: '从事传统木作三十余年，擅长复杂榫卯结构与家具修复。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20master%20carpenter%20portrait%20workshop',
    achievements: ['国家级非遗项目传承人', '传统家具修复工作室创办']
  },
  {
    id: 2,
    name: '李老师',
    field: '髹漆工艺',
    bio: '专注器物髹漆与现代材料融合，探索漆艺当代表达。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20lacquer%20artist%20portrait%20studio',
    achievements: ['省级非遗代表性传承人', '漆艺跨界联名项目主理']
  },
  {
    id: 3,
    name: '张老师',
    field: '织造与纹样',
    bio: '研究织造组织结构与纹样体系，推进传统织锦的现代转化。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20weaving%20artisan%20portrait%20loom',
    achievements: ['传统织锦研究课题负责人', '高校·工坊联合实践导师']
  },
  {
    id: 4,
    name: '陈先生',
    field: '篆刻与书法',
    bio: '兼修书法与篆刻，重视印面章法与线质表现的统一性。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20seal%20carving%20artist%20portrait%20studio',
    achievements: ['书法篆刻作品展获奖', '出版传统章法教程']
  }
];

// 中文注释：继续扩充“传承人物”，覆盖陶瓷、刺绣、金工与木作
const heritageFiguresExtra = [
  {
    id: 5,
    name: '周大师',
    field: '德化白瓷',
    bio: '专注白瓷人物与器物创作，追求温润与光的统一。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Dehua%20porcelain%20artist%20portrait%20studio',
    achievements: ['省级工艺美术大师', '白瓷艺术展策展人']
  },
  {
    id: 6,
    name: '黄老师',
    field: '潮绣',
    bio: '致力于金线与立体绣的当代表达，推动潮绣走进生活。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chaozhou%20embroidery%20artist%20portrait%20studio',
    achievements: ['非遗传承工作坊主理', '潮绣生活美学项目']
  },
  {
    id: 7,
    name: '阿依',
    field: '苗族银饰',
    bio: '系统整理族群纹样并实践首饰现代化转化。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Miao%20silver%20ornaments%20artist%20portrait',
    achievements: ['民族文化推广大使', '银饰课程导师']
  },
  {
    id: 8,
    name: '李师傅',
    field: '雕版印刷',
    bio: '专注雕版套色与古籍修复，让传统印艺焕新。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20woodblock%20printing%20artist%20portrait',
    achievements: ['古籍修复项目负责人', '艺术版画联名']
  },
  {
    id: 9,
    name: '顾师',
    field: '宜兴紫砂',
    bio: '以泥性研究与壶学体系见长，强调功能与美学统一。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Yixing%20zisha%20teapot%20artist%20portrait',
    achievements: ['紫砂壶学讲座主讲', '作品获评功能美学奖']
  },
  {
    id: 10,
    name: '白先生',
    field: '工笔绘画',
    bio: '以工笔设色见长，探索传统绘画在设计中的应用。',
    image: '/api/proxy/trae-api/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Chinese%20gongbi%20painter%20portrait%20studio',
    achievements: ['工笔画展获奖', '插画与产品联名']
  }
];

type TabType = 'stories' | 'tutorials' | 'elements' | 'encyclopedia' | 'figures' | 'activities' | 'assets';

export default function CulturalKnowledge() {
  const { isDark = false } = useTheme() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const { id, type } = useParams();
  
  const [activeTab, setActiveTab] = useState<TabType>('stories');
  
  // 从location.state中获取activeTab参数，用于左侧导航直接切换到文化资讯
  useEffect(() => {
    const state = location.state as { activeTab?: string };
    if (state && state.activeTab) {
      setActiveTab(state.activeTab as TabType);
    }
  }, [location.state]);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [selectedFigure, setSelectedFigure] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [favoriteTutorials, setFavoriteTutorials] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [viewIncrements, setViewIncrements] = useState<Record<number, number>>({});
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, 'loading' | 'loaded' | 'error'>>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoOverrides, setVideoOverrides] = useState<Record<number, string>>({});
  const isSafeForProxy = (url: string) => {
    const u = String(url || '')
    return u.startsWith('https://') && (u.includes('volces.com') || u.includes('tos-cn-beijing'))
  }
  
  // 图片加载处理
  const handleImageLoad = (imageUrl: string) => {
    setImageLoadStates(prev => ({ ...prev, [imageUrl]: 'loaded' }));
  };
  
  // 图片加载错误处理
  const handleImageError = (imageUrl: string) => {
    setImageLoadStates(prev => ({ ...prev, [imageUrl]: 'error' }));
  };
  
  // 获取相关推荐内容
  const getRelatedContent = (currentId: number, contentType: string) => {
    let allContent: any[] = [];
    let relatedContent: any[] = [];
    
    switch (contentType) {
      case 'stories':
        allContent = historicalStories;
        break;
      case 'tutorials':
        allContent = tutorialVideos;
        break;
      case 'elements':
        allContent = culturalElements;
        break;
      case 'encyclopedia':
        allContent = [...encyclopediaEntries, ...encyclopediaEntriesExtra, ...encyclopediaEntriesMore];
        break;
      case 'figures':
        allContent = [...heritageFigures, ...heritageFiguresExtra];
        break;
      default:
        allContent = historicalStories;
    }
    
    // 随机选择3个不重复的相关内容
    const shuffled = [...allContent].filter(item => item.id !== currentId).sort(() => 0.5 - Math.random());
    relatedContent = shuffled.slice(0, 3);
    
    return relatedContent;
  };
  
  // 模拟加载数据
  useEffect(() => {
    if (isPrefetched('knowledge')) {
      setIsLoading(false);
      return;
    }
    const t = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, []);
  
  // 根据URL参数设置选中项
  useEffect(() => {
    if (id && type) {
      setShowDetail(true);
      const numericId = parseInt(id);
      
      if (type === 'stories') {
        const story = historicalStories.find(s => s.id === numericId);
        if (story) {
          setSelectedStory(story);
          setActiveTab('stories');
        }
      } else if (type === 'tutorials') {
        const video = tutorialVideos.find(v => v.id === numericId);
        if (video) {
          setSelectedVideo(video);
          setActiveTab('tutorials');
        }
      } else if (type === 'elements') {
        const element = culturalElements.find(e => e.id === numericId);
        if (element) {
          setSelectedElement(element);
          setActiveTab('elements');
        }
      } else if (type === 'encyclopedia') {
        const entry = [...encyclopediaEntries, ...encyclopediaEntriesExtra, ...encyclopediaEntriesMore].find(e => e.id === numericId);
        if (entry) {
          setSelectedEntry(entry);
          setActiveTab('encyclopedia');
        }
      } else if (type === 'figures') {
        const fig = [...heritageFigures, ...heritageFiguresExtra].find(f => f.id === numericId);
        if (fig) {
          setSelectedFigure(fig);
          setActiveTab('figures');
        }
      }
    }
  }, [id, type]);

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search)
      const ap = params.get('autoplay')
      if (ap && type === 'tutorials' && selectedVideo && selectedVideo.videoUrl) {
        setIsPlaying(true)
      }
    } catch {}
  }, [location.search, type, selectedVideo])
  
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const r = await fetch('/api/favorites/tutorials', {
          headers
        })
        if (r.ok) {
          const j = await r.json()
          if (Array.isArray(j?.ids)) { setFavoriteTutorials(j.ids as number[]); return }
        }
      } catch (error) {
        console.error('获取收藏列表失败:', error);
      }
      try {
        const saved = localStorage.getItem('FAVORITE_TUTORIALS');
        if (saved) {
          const arr = JSON.parse(saved);
          if (Array.isArray(arr)) setFavoriteTutorials(arr.filter((x) => typeof x === 'number'));
        }
      } catch {}
    })()
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      try {
        localStorage.setItem('FAVORITE_TUTORIALS', JSON.stringify(favoriteTutorials));
      } catch {}
    }
  }, [favoriteTutorials, isAuthenticated]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('TUTORIAL_VIEWS_INC')
      if (raw) {
        const obj = JSON.parse(raw)
        if (obj && typeof obj === 'object') setViewIncrements(obj)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('TUTORIAL_VIDEO_OVERRIDES')
      const obj = raw ? JSON.parse(raw) : {}
      if (obj && typeof obj === 'object') setVideoOverrides(obj)
    } catch {}
  }, [])

  const handleStoryClick = (story: any) => {
    setError(null);
    setIsDetailLoading(true);
    setTimeout(() => {
      try {
        setSelectedStory(story);
        setSelectedVideo(null);
        setSelectedElement(null);
        setSelectedEntry(null);
        setSelectedFigure(null);
        setShowDetail(true);
      } catch (err) {
        setError('加载故事详情失败，请稍后重试');
        toast.error('加载故事详情失败');
      } finally {
        setIsDetailLoading(false);
      }
    }, 300);
  };
  
  const handleVideoClick = (video: any) => {
    setError(null);
    setIsDetailLoading(true);
    setTimeout(() => {
      try {
        setSelectedVideo(video);
        setSelectedStory(null);
        setSelectedElement(null);
        setSelectedEntry(null);
        setSelectedFigure(null);
        setShowDetail(true);
        setIsPlaying(false);
      } catch (err) {
        setError('加载视频详情失败，请稍后重试');
        toast.error('加载视频详情失败');
      } finally {
        setIsDetailLoading(false);
      }
    }, 300);
  };
  
  const handleElementClick = (element: any) => {
    setError(null);
    setIsDetailLoading(true);
    setTimeout(() => {
      try {
        setSelectedElement(element);
        setSelectedStory(null);
        setSelectedVideo(null);
        setSelectedEntry(null);
        setSelectedFigure(null);
        setShowDetail(true);
      } catch (err) {
        setError('加载文化元素详情失败，请稍后重试');
        toast.error('加载文化元素详情失败');
      } finally {
        setIsDetailLoading(false);
      }
    }, 300);
  };
  
  const handleEntryClick = (entry: any) => {
    setError(null);
    setIsDetailLoading(true);
    setTimeout(() => {
      try {
        setSelectedEntry(entry);
        setSelectedStory(null);
        setSelectedVideo(null);
        setSelectedElement(null);
        setSelectedFigure(null);
        setShowDetail(true);
      } catch (err) {
        setError('加载工艺百科详情失败，请稍后重试');
        toast.error('加载工艺百科详情失败');
      } finally {
        setIsDetailLoading(false);
      }
    }, 300);
  };
  
  const handleFigureClick = (fig: any) => {
    setError(null);
    setIsDetailLoading(true);
    setTimeout(() => {
      try {
        setSelectedFigure(fig);
        setSelectedStory(null);
        setSelectedVideo(null);
        setSelectedElement(null);
        setSelectedEntry(null);
        setShowDetail(true);
      } catch (err) {
        setError('加载传承人物详情失败，请稍后重试');
        toast.error('加载传承人物详情失败');
      } finally {
        setIsDetailLoading(false);
      }
    }, 300);
  };
  
  const handleBackToList = () => {
    setShowDetail(false);
    setSelectedStory(null);
    setSelectedVideo(null);
    setSelectedElement(null);
    setSelectedEntry(null);
    setSelectedFigure(null);
    // 根据当前路径返回正确的列表页面
    const currentPath = location.pathname;
    navigate(currentPath.startsWith('/tianjin') ? '/tianjin' : '/knowledge');
  };

  const toggleFavoriteSelectedVideo = () => {
    if (!selectedVideo) return;
    const idNum = selectedVideo.id as number;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const r = await fetch('/api/favorites/tutorials/toggle', {
          method: 'POST',
          headers,
          body: JSON.stringify({ id: idNum })
        })
        if (r.ok) {
          const j = await r.json()
          if (Array.isArray(j?.ids)) { setFavoriteTutorials(j.ids as number[]); return }
        }
      } catch (error) {
        console.error('切换收藏状态失败:', error);
      }
      // 本地备份逻辑，仅在非登录状态或API调用失败时使用
      if (!isAuthenticated) {
        setFavoriteTutorials((prev) => (prev.includes(idNum) ? prev.filter((x) => x !== idNum) : [...prev, idNum]));
      }
    })()
  };

  const shareSelectedVideo = async () => {
    if (!selectedVideo) return;
    const url = `${window.location.origin}/knowledge/tutorials/${selectedVideo.id}?autoplay=1`;
    try {
      if (navigator.share && window.isSecureContext) {
        await navigator.share({ title: selectedVideo.title, text: selectedVideo.description, url })
        toast.success('已调用系统分享');
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('链接已复制，可去微信/小红书分享');
      }
    } catch {
      toast.error('复制失败，请手动复制');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!videoRef.current) return
      if (e.key === ' ') {
        e.preventDefault()
        if (videoRef.current.paused) videoRef.current.play(); else videoRef.current.pause()
      } else if (e.key.toLowerCase() === 'f') {
        if (document.fullscreenElement) document.exitFullscreen(); else videoRef.current.requestFullscreen?.()
      } else if (e.key.toLowerCase() === 'm') {
        videoRef.current.muted = !videoRef.current.muted
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isPlaying, selectedVideo])

  const startLearning = () => {
    if (!selectedVideo) return;
    const idNum = Number(selectedVideo.id)
    const url = (videoOverrides[idNum] || selectedVideo.videoUrl)
    if (url) {
      setIsPlaying(true);
      try {
        setViewIncrements(prev => {
          const next = { ...prev, [idNum]: (prev[idNum] || 0) + 1 }
          try { localStorage.setItem('TUTORIAL_VIEWS_INC', JSON.stringify(next)) } catch {}
          return next
        })
      } catch {}
      toast.info('开始学习');
    } else {
      toast.info('暂无视频资源，后续将补充示范视频');
    }
  };

  const continueFromProgress = () => {
    if (!selectedVideo) return
    const id = Number(selectedVideo.id)
    try {
      const raw = localStorage.getItem('TUTORIAL_PROGRESS')
      const obj = raw ? JSON.parse(raw) : {}
      const pos = Number(obj?.[id] || 0)
      if (pos > 0 && videoRef.current) {
        videoRef.current.currentTime = pos
      }
    } catch {}
  }

  const changeVideoSource = () => {
    if (!selectedVideo) return
    const current = videoOverrides[Number(selectedVideo.id)] || selectedVideo.videoUrl || ''
    const next = window.prompt('输入视频URL（https）', current || '')
    if (!next) return
    if (!/^https?:\/\//.test(next)) { toast.error('请输入以http/https开头的地址'); return }
    const idNum = Number(selectedVideo.id)
    setVideoOverrides(prev => {
      const updated = { ...prev, [idNum]: next }
      try { localStorage.setItem('TUTORIAL_VIDEO_OVERRIDES', JSON.stringify(updated)) } catch {}
      return updated
    })
    setIsPlaying(true)
    toast.success('视频源已更新并开始播放')
  }
  
  // 骨架屏加载状态
  if (isLoading) {
    return (
  
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} h-8 w-1/3 rounded animate-pulse`}></div>
            <div className="flex space-x-3 overflow-x-auto pb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`${isDark ? 'bg-gray-800' : 'bg-white'} h-12 px-6 rounded-full animate-pulse`}></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-3">
                  <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} h-48 rounded-xl animate-pulse`}></div>
                  <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} h-4 w-3/4 rounded animate-pulse`}></div>
                  <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} h-3 w-1/2 rounded animate-pulse`}></div>
                </div>
                
                {/* 相关推荐 */}
                <div className="pt-8 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                    <i className="fas fa-thumbs-up mr-2 text-indigo-600"></i>
                    相关推荐
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getRelatedContent(selectedVideo.id, 'tutorials').map((item) => (
                      <motion.div
                        key={item.id}
                        className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-300`}
                        whileHover={{ y: -5 }}
                        onClick={() => handleVideoClick(item)}
                      >
                        <div className="relative mb-3">
                          <img
                            src={item.thumbnail.includes('/api/proxy/trae-api') ? 'https://picsum.photos/400/250?random=' + item.id : item.thumbnail}
                            alt={item.title}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                            {item.duration}
                          </div>
                        </div>
                        <h4 className="font-semibold mb-2 line-clamp-2">{item.title}</h4>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${item.level === '入门' ? 'bg-green-100 text-green-600' : item.level === '进阶' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {item.level}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.views} 次观看
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
    );
  }
  
  // 检测是否为天津特色专区
  const isTianjin = location.pathname.startsWith('/tianjin');

  return (
    <>
      {/* 主内容 */}
      <main className="flex-1 container mx-auto px-4 py-8">
        
        {/* 中文注释：新增统一的渐变英雄区 */}
        <GradientHero
          title={isTianjin ? "天津特色专区" : "文化知识库"}
          subtitle={isTianjin ? "探索天津特色文化、老字号与非遗传承" : "系统化了解老字号、非遗与城市文化的故事与资产"}
          badgeText="Beta"
          theme={isTianjin ? "red" : "indigo"}
          size="lg"
          pattern
          stats={isTianjin ? [
            { label: '津门老字号', value: '精选' },
            { label: '天津元素', value: '资产' },
            { label: '非遗传承', value: '导览' },
            { label: '津味应用', value: '共创' },
          ] : [
            { label: '专题', value: '精选' },
            { label: '元素', value: '资产' },
            { label: '学习', value: '导览' },
            { label: '应用', value: '共创' },
          ]}
        />
        {/* 面包屑导航 */}
        <div className="mb-6">
          <div className="flex items-center text-sm">
            <a href="/dashboard" className="hover:text-red-600 transition-colors">首页</a>
            <i className="fas fa-chevron-right text-xs mx-2 opacity-50"></i>
            <span className="opacity-70">{isTianjin ? "天津特色专区" : "文化知识库"}</span>
          </div>
        </div>
        
        {/* 标题 */}
        <motion.h1 
          className="text-3xl font-bold mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {isTianjin ? "天津特色专区" : "文化知识库"}
        </motion.h1>
        
        {/* 搜索框 */}
        <motion.div 
          className={`mb-8 p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索文化知识、历史故事、非遗技艺..."
              className={`w-full pl-12 pr-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 border' 
                  : 'bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-400 border'
              }`}
            />
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
        </motion.div>
        
        {/* 内容展示区域 */}
        {!showDetail ? (
          <>
            {/* 标签页切换 */}
            <motion.div 
              className="mb-8 overflow-x-auto pb-4 scrollbar-hide"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex space-x-3 min-w-max">
                {/* 中文注释：新增更多标签页按钮，提升浏览维度 */}
                {[
                  { id: 'stories', name: '老字号故事' },
                  { id: 'tutorials', name: '非遗教程' },
                  { id: 'elements', name: '文化元素' },
                  { id: 'encyclopedia', name: '工艺百科' },
                  { id: 'figures', name: '传承人物' },
                  { id: 'assets', name: '文化资产' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                      activeTab === tab.id 
                        ? 'bg-red-600 text-white shadow-md' 
                        : isDark 
                          ? 'bg-gray-800 hover:bg-gray-700' 
                          : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {tab.name}
                  </button>
                ))}
              </div>
            </motion.div>
            
            {/* 内容列表 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {/* 老字号故事 */}
              {activeTab === 'stories' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* 过滤天津相关内容和搜索词 */}
                  {(isTianjin ? historicalStories.filter(story => story.tags?.includes('天津')) : historicalStories)
                    .filter(story => 
                      !searchTerm || 
                      story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      story.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      story.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (story.tags && story.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
                    )
                    .sort((a, b) => a.id - b.id)
                    .map((story) => (
                    <motion.div
                      key={story.id}
                      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl overflow-hidden shadow-md transition-all hover:shadow-xl`}
                      whileHover={{ y: -5 }}
                      onClick={() => handleStoryClick(story)}
                    >
                      <img 
                        src={story.thumbnail} 
                        alt={story.title} 
                        className="w-full h-48 object-cover"
                        loading="lazy" decoding="async"
                      />
                      
                      <div className="p-5">
                        <h3 className="font-bold text-lg mb-3">{story.title}</h3>
                        <p className={`text-sm mb-4 line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {story.excerpt}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {(story.tags || []).map((tag, index) => (
                            <span 
                              key={index} 
                              className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors flex items-center">
                          阅读更多
                          <i className="fas fa-arrow-right ml-1 text-xs"></i>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {/* 非遗教程 */}
              {activeTab === 'tutorials' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* 过滤天津相关内容和搜索词 */}
                  {(isTianjin ? tutorialVideos.filter(video => 
                    video.title.includes('天津') || 
                    video.title.includes('杨柳青') || 
                    video.title.includes('泥人张') || 
                    video.title.includes('相声') || 
                    video.description.includes('天津') || 
                    video.description.includes('杨柳青') || 
                    video.description.includes('泥人张') || 
                    video.description.includes('相声')
                  ) : tutorialVideos)
                    .filter(video => 
                      !searchTerm || 
                      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      video.description.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((video) => (
                    <motion.div
                      key={video.id}
                      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl overflow-hidden shadow-md transition-all hover:shadow-xl`}
                      whileHover={{ y: -5 }}
                      onClick={() => handleVideoClick(video)}
                    >
                      <div className="relative">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title} 
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-red-600 bg-opacity-80 flex items-center justify-center">
                            <i className="fas fa-play text-white text-xl"></i>
                          </div>
                        </div>
                        <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                          {video.duration}
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-lg">{video.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            video.level === '入门' 
                              ? 'bg-green-100 text-green-600' 
                              : video.level === '进阶'
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-purple-100 text-purple-600'
                          }`}>
                            {video.level}
                          </span>
                        </div>
                        
                        <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {video.description}
                        </p>
                        
                        <div className="flex justify-between items-center text-sm">
                          <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} flex items-center`}>
                            <i className="far fa-eye mr-1"></i>
                            {(() => { try { const base = parseInt(String(video.views).replace(/,/g,'')) || 0; const inc = viewIncrements[Number(video.id)] || 0; return `${(base + inc).toLocaleString('zh-CN')} 次观看` } catch { return `${video.views} 次观看` } })()}
                          </span>
                          
                          <button onClick={() => handleVideoClick(video)} className="text-red-600 hover:text-red-700 font-medium transition-colors flex items-center">
                            观看教程
                            <i className="fas fa-arrow-right ml-1 text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              
              {/* 文化元素 */}
              {activeTab === 'elements' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* 过滤天津相关内容和搜索词 */}
                  {(isTianjin ? culturalElements.filter(element => 
                    element.name.includes('杨柳青') || 
                    element.name.includes('泥人张') || 
                    element.name.includes('天津') ||
                    element.name.includes('相声') ||
                    element.name.includes('海河') ||
                    element.description.includes('天津') ||
                    element.description.includes('相声') ||
                    element.description.includes('海河')
                  ) : culturalElements)
                    .filter(element => 
                      !searchTerm || 
                      element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      element.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      element.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (element.history && element.history.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (element.usage && element.usage.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((element) => (
                    <motion.div
                      key={element.id}
                      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl overflow-hidden shadow-md transition-all hover:shadow-xl`}
                      whileHover={{ y: -5 }}
                      onClick={() => handleElementClick(element)}
                    >
                      <img 
                        src={element.image} 
                        alt={element.name} 
                        className="w-full h-48 object-cover"
                      />
                      
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-lg">{element.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isDark ? 'bg-gray-700' : 'bg-gray-100'
                          }`}>
                            {element.category}
                          </span>
                        </div>
                        
                        <p className={`text-sm mb-4 line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {element.description}
                        </p>
                        
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors flex items-center">
                          了解详情
                          <i className="fas fa-arrow-right ml-1 text-xs"></i>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* 工艺百科 */}
              {activeTab === 'encyclopedia' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...encyclopediaEntries, ...encyclopediaEntriesExtra, ...encyclopediaEntriesMore].filter(entry => 
                    !isTianjin || 
                    entry.title.includes('天津') || 
                    entry.title.includes('杨柳青') || 
                    entry.title.includes('泥人张') || 
                    entry.title.includes('相声') || 
                    entry.title.includes('木版年画') || 
                    entry.description.includes('天津') || 
                    entry.description.includes('杨柳青') || 
                    entry.description.includes('泥人张') || 
                    entry.description.includes('相声')
                  ).filter(entry => 
                    !searchTerm || 
                    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    entry.category.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((entry) => (
                    <motion.div
                      key={entry.id}
                      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl overflow-hidden shadow-md transition-all hover:shadow-xl`}
                      whileHover={{ y: -5 }}
                      onClick={() => handleEntryClick(entry)}
                    >
                      <img 
                        src={entry.image} 
                        alt={entry.title} 
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-lg">{entry.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{entry.category}</span>
                        </div>
                        <p className={`text-sm mb-4 line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{entry.description}</p>
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors flex items-center">
                          了解条目
                          <i className="fas fa-arrow-right ml-1 text-xs"></i>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* 传承人物 */}
              {activeTab === 'figures' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...heritageFigures, ...heritageFiguresExtra].filter(fig => 
                    !isTianjin || 
                    fig.field.includes('天津') || 
                    fig.field.includes('杨柳青') || 
                    fig.field.includes('泥人张') || 
                    fig.field.includes('相声') || 
                    fig.bio.includes('天津') || 
                    fig.bio.includes('杨柳青') || 
                    fig.bio.includes('泥人张') || 
                    fig.bio.includes('相声')
                  ).filter(fig => 
                    !searchTerm || 
                    fig.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    fig.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    fig.bio.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((fig) => (
                    <motion.div
                      key={fig.id}
                      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl overflow-hidden shadow-md transition-all hover:shadow-xl`}
                      whileHover={{ y: -5 }}
                      onClick={() => handleFigureClick(fig)}
                    >
                      <img 
                        src={fig.image} 
                        alt={fig.name} 
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-bold text-lg">{fig.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{fig.field}</span>
                        </div>
                        <p className={`text-sm mb-4 line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{fig.bio}</p>
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors flex items-center">
                          查看人物
                          <i className="fas fa-arrow-right ml-1 text-xs"></i>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* 文化资产 */}
              {activeTab === 'assets' && (
                <div className="mt-8">
                  <TianjinCulturalAssets searchQuery={searchTerm} />
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-xl`}
          >
            {/* 返回按钮 */}
            <button 
              onClick={handleBackToList}
              className={`mb-6 flex items-center text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'} transition-all duration-300 hover:translate-x-[-2px]`}
            >
              <i className="fas fa-arrow-left mr-2"></i>
              返回列表
            </button>
            
            {/* 加载状态 */}
            {isDetailLoading && (
              <div className="space-y-8">
                <div className="h-64 sm:h-72 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
                <div className="space-y-4">
                  <div className="h-8 sm:h-10 w-full sm:w-3/4 rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
                  <div className="h-6 sm:h-8 w-full sm:w-1/2 rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
                  <div className="space-y-2 sm:space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-3 sm:h-4 w-full rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse"></div>
                    ))}
                  </div>
                </div>
                
                {/* 相关推荐 */}
                <div className="pt-8 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                    <i className="fas fa-thumbs-up mr-2 text-indigo-600"></i>
                    相关推荐
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getRelatedContent(selectedVideo.id, 'tutorials').map((item) => (
                      <motion.div
                        key={item.id}
                        className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-300`}
                        whileHover={{ y: -5 }}
                        onClick={() => handleVideoClick(item)}
                      >
                        <div className="relative mb-3">
                          <img
                            src={item.thumbnail.includes('/api/proxy/trae-api') ? 'https://picsum.photos/400/250?random=' + item.id : item.thumbnail}
                            alt={item.title}
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                            {item.duration}
                          </div>
                        </div>
                        <h4 className="font-semibold mb-2 line-clamp-2">{item.title}</h4>
                        <div className="flex justify-between items-center mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${item.level === '入门' ? 'bg-green-100 text-green-600' : item.level === '进阶' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {item.level}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.views} 次观看
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* 错误状态 */}
            {error && (
              <div className="space-y-6 text-center py-8 sm:py-12">
                <div className="text-red-500 text-3xl sm:text-4xl mb-3 sm:mb-4">
                  <i className="fas fa-exclamation-circle"></i>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">加载失败</h3>
                <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 px-4">{error}</p>
                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 px-4">
                  <button 
                    onClick={() => {
                      if (selectedStory) handleStoryClick(selectedStory);
                      else if (selectedVideo) handleVideoClick(selectedVideo);
                      else if (selectedElement) handleElementClick(selectedElement);
                      else if (selectedEntry) handleEntryClick(selectedEntry);
                      else if (selectedFigure) handleFigureClick(selectedFigure);
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-colors text-sm sm:text-base flex-1 sm:flex-none min-w-[120px]"
                  >
                    重试
                  </button>
                  <button 
                    onClick={handleBackToList}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-colors text-sm sm:text-base flex-1 sm:flex-none min-w-[120px]"
                  >
                    返回列表
                  </button>
                </div>
              </div>
            )}
            
            {/* 老字号故事详情 */}
            {!isDetailLoading && !error && selectedStory && (
              <div className="space-y-8">
                {/* 图片区域 - 添加悬停缩放效果 */}
                <motion.div 
                  className="relative overflow-hidden rounded-xl shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  {imageLoadStates[selectedStory.thumbnail] !== 'loaded' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse z-0 flex items-center justify-center">
                      <i className="fas fa-image text-3xl sm:text-4xl text-gray-400"></i>
                    </div>
                  )}
                  <img 
                    src={selectedStory.thumbnail.includes('/api/proxy/trae-api') ? 'https://picsum.photos/800/600?random=' + selectedStory.id : selectedStory.thumbnail} 
                    alt={selectedStory.title} 
                    className="w-full h-64 sm:h-72 object-cover transition-transform duration-500 ease-in-out"
                    onLoad={() => handleImageLoad(selectedStory.thumbnail)}
                    onError={() => handleImageError(selectedStory.thumbnail)}
                  />
                </motion.div>
                
                {/* 标题和标签 */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600">{selectedStory.title}</h2>
                  
                  <div className="flex flex-wrap gap-2">
                    {selectedStory.tags.map((tag: string, index: number) => (
                      <motion.span 
                        key={index} 
                        className={`text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-all duration-300 hover:scale-105`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </div>
                
                {/* 内容区域 */}
                <div className={`prose max-w-none ${isDark ? 'prose-invert' : ''} prose-lg`}>
                  <p className="leading-relaxed whitespace-pre-line">{selectedStory.content}</p>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-between items-center pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                  <div className="flex flex-wrap space-x-2 sm:space-x-3 w-full sm:w-auto">
                    <motion.button 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                      className={`p-2.5 sm:p-3 rounded-full ${
                        isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors flex items-center shadow-sm`}
                    >
                      <i className="far fa-bookmark mr-1.5 sm:mr-2"></i>
                      <span className="text-xs sm:text-sm">收藏</span>
                    </motion.button>
                    
                    <motion.button 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                      className={`p-2.5 sm:p-3 rounded-full ${
                        isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors flex items-center shadow-sm`}
                    >
                      <i className="far fa-share-square mr-1.5 sm:mr-2"></i>
                      <span className="text-xs sm:text-sm">分享</span>
                    </motion.button>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (!selectedStory) return;
                      const base = `${selectedStory.title} ${Array.isArray(selectedStory.tags) ? selectedStory.tags.join(' ') : ''}`.trim();
                      const text = base || selectedStory.excerpt || '';
                      const url = `/create?from=knowledge&prompt=${encodeURIComponent(text)}`;
                      navigate(url);
                    }}
                    className="ml-auto bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all duration-300 flex items-center shadow-lg whitespace-nowrap"
                  >
                    <i className="fas fa-magic mr-1.5 sm:mr-2"></i>
                    <span className="text-sm">应用到创作</span>
                  </motion.button>
                </div>
                
                {/* 相关推荐 */}
                <div className="pt-8 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                  <h3 className="text-xl font-bold mb-6 flex items-center">
                    <i className="fas fa-thumbs-up mr-2 text-indigo-600"></i>
                    相关推荐
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getRelatedContent(selectedStory.id, 'stories').map((item) => (
                      <motion.div
                        key={item.id}
                        className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-300`}
                        whileHover={{ y: -5 }}
                        onClick={() => handleStoryClick(item)}
                      >
                        <img
                          src={item.thumbnail.includes('/api/proxy/trae-api') ? 'https://picsum.photos/400/250?random=' + item.id : item.thumbnail}
                          alt={item.title}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                        <h4 className="font-semibold mb-2 line-clamp-2">{item.title}</h4>
                        <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.excerpt}</p>
                        <div className="flex flex-wrap gap-2">
                          {item.tags.slice(0, 2).map((tag: string, idx: number) => (
                            <span key={idx} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>{tag}</span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* 非遗教程详情 */}
            {!isDetailLoading && !error && selectedVideo && (
              <div className="space-y-8">
                {/* 视频播放区域 */}
                <div className="relative w-full rounded-xl overflow-hidden shadow-lg bg-black aspect-video">
                  {isPlaying && (videoOverrides[Number(selectedVideo.id)] || selectedVideo.videoUrl) ? (
                    <video
                      ref={videoRef}
                      controls
                      autoPlay
                      onLoadedMetadata={continueFromProgress}
                      onTimeUpdate={() => {
                        try {
                          const id = Number(selectedVideo.id)
                          const pos = videoRef.current?.currentTime || 0
                          const raw = localStorage.getItem('TUTORIAL_PROGRESS')
                          const obj = raw ? JSON.parse(raw) : {}
                          obj[id] = pos
                          localStorage.setItem('TUTORIAL_PROGRESS', JSON.stringify(obj))
                        } catch {}
                      }}
                      onEnded={() => {
                        try {
                          const id = Number(selectedVideo.id)
                          const raw = localStorage.getItem('TUTORIAL_PROGRESS')
                          const obj = raw ? JSON.parse(raw) : {}
                          delete obj[id]
                          localStorage.setItem('TUTORIAL_PROGRESS', JSON.stringify(obj))
                        } catch {}
                      }}
                      src={(u => isSafeForProxy(u) ? `/api/proxy/video?url=${encodeURIComponent(u)}` : u)(videoOverrides[Number(selectedVideo.id)] || selectedVideo.videoUrl)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      {imageLoadStates[selectedVideo.thumbnail] !== 'loaded' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse z-0 flex items-center justify-center">
                          <i className="fas fa-image text-4xl text-gray-400"></i>
                        </div>
                      )}
                      <img 
                        src={selectedVideo.thumbnail.includes('/api/proxy/trae-api') ? 'https://picsum.photos/800/600?random=' + selectedVideo.id : selectedVideo.thumbnail} 
                        alt={selectedVideo.title} 
                        className="w-full h-full object-cover opacity-70"
                        onLoad={() => handleImageLoad(selectedVideo.thumbnail)}
                        onError={() => handleImageError(selectedVideo.thumbnail)}
                      />
                      <motion.button
                        onClick={startLearning}
                        className="absolute inset-0 flex items-center justify-center"
                        aria-label="播放教程"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-red-600 to-pink-600 bg-opacity-90 flex items-center justify-center shadow-lg">
                          <i className="fas fa-play text-white text-2xl"></i>
                        </div>
                      </motion.button>
                    </>
                  )}
                </div>
                
                {/* 标题和描述 */}
                <div>
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600">{selectedVideo.title}</h2>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      selectedVideo.level === '入门' 
                        ? 'bg-green-100 text-green-600' 
                        : selectedVideo.level === '进阶'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-purple-100 text-purple-600'
                    }`}>
                      {selectedVideo.level}
                    </span>
                  </div>
                  
                  <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                    {selectedVideo.description}
                  </p>
                </div>
                
                {/* 视频信息卡片 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div 
                    className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-50 to-indigo-50'} shadow-md`}
                    whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  >
                    <h3 className="text-sm font-medium mb-2 text-gray-600">视频时长</h3>
                    <p className="text-2xl font-bold">{selectedVideo.duration}</p>
                  </motion.div>
                  
                  <motion.div 
                    className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-green-50 to-emerald-50'} shadow-md`}
                    whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  >
                    <h3 className="text-sm font-medium mb-2 text-gray-600">难度级别</h3>
                    <p className="text-2xl font-bold">{selectedVideo.level}</p>
                  </motion.div>
                  
                  <motion.div 
                    className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-purple-50 to-violet-50'} shadow-md`}
                    whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  >
                    <h3 className="text-sm font-medium mb-2 text-gray-600">观看次数</h3>
                    <p className="text-2xl font-bold">{(() => { try { const base = parseInt(String(selectedVideo.views).replace(/,/g,'')) || 0; const inc = viewIncrements[Number(selectedVideo.id)] || 0; return (base + inc).toLocaleString('zh-CN') } catch { return selectedVideo.views } })()}</p>
                  </motion.div>
                </div>
                
                {/* 操作按钮 */}
                <div className="flex flex-wrap gap-4 justify-between items-center pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                  <div className="flex flex-wrap gap-3">
                    <motion.button 
                      onClick={toggleFavoriteSelectedVideo} 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                      className={`p-3 rounded-full ${
                        isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors flex items-center shadow-sm`}
                    >
                      <i className={`far ${favoriteTutorials.includes(selectedVideo.id) ? 'fa-bookmark' : 'fa-bookmark'} mr-2`}></i>
                      <span className="text-sm">{favoriteTutorials.includes(selectedVideo.id) ? '已收藏' : '收藏'}</span>
                    </motion.button>
                    
                    <motion.button 
                      onClick={shareSelectedVideo} 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                      className={`p-3 rounded-full ${
                        isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors flex items-center shadow-sm`}
                    >
                      <i className="far fa-share-square mr-2"></i>
                      <span className="text-sm">分享</span>
                    </motion.button>
                    
                    <motion.button 
                      onClick={changeVideoSource} 
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                      className={`p-3 rounded-full ${
                        isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors flex items-center shadow-sm`}
                    >
                      <i className="fas fa-film mr-2"></i>
                      <span className="text-sm">更换视频源</span>
                    </motion.button>
                  </div>
                  
                    <div className="flex items-center gap-3">
                      <button onClick={startLearning} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full transition-colors flex items-center">
                        <i className="fas fa-play mr-2"></i>
                        {(() => { try { const raw = localStorage.getItem('TUTORIAL_PROGRESS'); const obj = raw ? JSON.parse(raw) : {}; return Number(obj?.[Number(selectedVideo.id)] || 0) > 0 ? '继续学习' : '开始学习' } catch { return '开始学习' } })()}
                      </button>
                      <button onClick={() => { const base = `${selectedVideo.title} ${selectedVideo.level}`.trim(); const text = `${base} ${selectedVideo.description}`.trim(); const url = `/create?from=knowledge&prompt=${encodeURIComponent(text)}`; navigate(url); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors flex items-center">
                        <i className="fas fa-magic mr-2"></i>
                        应用到创作
                      </button>
                      <button onClick={() => { const p = `${selectedVideo.title} ${selectedVideo.level} ${selectedVideo.description}`.trim(); const url = `/generate?prompt=${encodeURIComponent(p)}&image=${encodeURIComponent(selectedVideo.thumbnail)}&autostart=1`; navigate(url); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full transition-colors flex items-center">
                        <i className="fas fa-film mr-2"></i>
                        生成视频
                      </button>
                      <button onClick={() => { const p = `${selectedVideo.title} ${selectedVideo.level} ${selectedVideo.description}`.trim(); const url = `/generate?prompt=${encodeURIComponent(p)}&image=${encodeURIComponent(selectedVideo.thumbnail)}&autostart=1&saveToTutorialId=${encodeURIComponent(String(selectedVideo.id))}`; navigate(url); }} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full transition-colors flex items-center">
                        <i className="fas fa-floppy-disk mr-2"></i>
                        生成并替换
                      </button>
                    </div>
                </div>
              </div>
            )}
            
            {/* 文化元素详情 */}
            {!isDetailLoading && !error && selectedElement && (
              <div className="space-y-8">
                {/* 图片和基本信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <motion.div 
                    className="relative overflow-hidden rounded-xl shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    {imageLoadStates[selectedElement.image] !== 'loaded' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse z-0 flex items-center justify-center">
                        <i className="fas fa-image text-4xl text-gray-400"></i>
                      </div>
                    )}
                    <img 
                      src={selectedElement.image.includes('/api/proxy/trae-api') ? 'https://picsum.photos/800/600?random=' + selectedElement.id : selectedElement.image} 
                      alt={selectedElement.name} 
                      className="w-full h-72 object-cover transition-transform duration-500 ease-in-out"
                      onLoad={() => handleImageLoad(selectedElement.image)}
                      onError={() => handleImageError(selectedElement.image)}
                    />
                  </motion.div>
                  
                  <div>
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600">{selectedElement.name}</h2>
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        isDark ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        {selectedElement.category}
                      </span>
                    </div>
                    
                    <p className={`text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                      {selectedElement.description}
                    </p>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (!selectedElement) return;
                        const base = `${selectedElement.name} ${selectedElement.category}`.trim();
                        const usage = selectedElement.usage || '';
                        const text = `${base} ${usage}`.trim();
                        const url = `/create?from=knowledge&prompt=${encodeURIComponent(text)}`;
                        navigate(url);
                      }}
                      className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white px-6 py-3 rounded-full transition-all duration-300 flex items-center shadow-lg"
                    >
                      <i className="fas fa-magic mr-2"></i>
                      应用到创作
                    </motion.button>
                  </div>
                </div>
                
                {/* 详细信息 - 使用卡片式布局 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div 
                    className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100'} transition-all duration-300`}
                    whileHover={{ y: -5 }}
                  >
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                      <i className="fas fa-history mr-2 text-indigo-600"></i>
                      历史渊源
                    </h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                      {selectedElement.history}
                    </p>
                  </motion.div>
                  
                  <motion.div 
                    className={`p-6 rounded-xl shadow-lg ${isDark ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gradient-to-br from-purple-50 to-fuchsia-50 hover:from-purple-100 hover:to-fuchsia-100'} transition-all duration-300`}
                    whileHover={{ y: -5 }}
                  >
                    <h3 className="text-xl font-bold mb-4 flex items-center">
                      <i className="fas fa-lightbulb mr-2 text-fuchsia-600"></i>
                      应用场景
                    </h3>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                      {selectedElement.usage}
                    </p>
                  </motion.div>
                </div>
              </div>
            )}

            {/* 工艺百科详情 */}
            {!isDetailLoading && !error && selectedEntry && (
              <div className="space-y-8">
                {/* 图片和基本信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <motion.div 
                    className="relative overflow-hidden rounded-xl shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    {imageLoadStates[selectedEntry.image] !== 'loaded' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse z-0 flex items-center justify-center">
                        <i className="fas fa-image text-4xl text-gray-400"></i>
                      </div>
                    )}
                    <img 
                      src={selectedEntry.image} 
                      alt={selectedEntry.title} 
                      className="w-full h-72 object-cover transition-transform duration-500 ease-in-out"
                      onLoad={() => handleImageLoad(selectedEntry.image)}
                      onError={() => handleImageError(selectedEntry.image)}
                    />
                  </motion.div>
                  
                  <div>
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600">{selectedEntry.title}</h2>
                      <span className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{selectedEntry.category}</span>
                    </div>
                    <p className={`text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>{selectedEntry.description}</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const base = `${selectedEntry.title} ${selectedEntry.category}`.trim();
                        const text = `${base} ${selectedEntry.description}`.trim();
                        const url = `/create?from=knowledge&prompt=${encodeURIComponent(text)}`;
                        navigate(url);
                      }}
                      className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white px-6 py-3 rounded-full transition-all duration-300 flex items-center shadow-lg"
                    >
                      <i className="fas fa-magic mr-2"></i>
                      应用到创作
                    </motion.button>
                  </div>
                </div>
                
                {/* 工艺详解 - 使用卡片式布局 */}
                <motion.div 
                  className={`p-8 rounded-xl shadow-lg ${isDark ? 'bg-gray-700' : 'bg-gradient-to-br from-green-50 to-emerald-50'} transition-all duration-300`}
                  whileHover={{ y: -5 }}
                >
                  <h3 className="text-2xl font-bold mb-6 flex items-center">
                    <i className="fas fa-tools mr-3 text-emerald-600"></i>
                    工艺详解
                  </h3>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-lg leading-relaxed`}>{selectedEntry.content}</p>
                </motion.div>
              </div>
            )}

            {/* 传承人物详情 */}
            {!isDetailLoading && !error && selectedFigure && (
              <div className="space-y-8">
                {/* 图片和基本信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <motion.div 
                    className="relative overflow-hidden rounded-xl shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    {imageLoadStates[selectedFigure.image] !== 'loaded' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse z-0 flex items-center justify-center">
                        <i className="fas fa-image text-4xl text-gray-400"></i>
                      </div>
                    )}
                    <img 
                      src={selectedFigure.image} 
                      alt={selectedFigure.name} 
                      className="w-full h-72 object-cover transition-transform duration-500 ease-in-out"
                      onLoad={() => handleImageLoad(selectedFigure.image)}
                      onError={() => handleImageError(selectedFigure.image)}
                    />
                  </motion.div>
                  
                  <div>
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-600">{selectedFigure.name}</h2>
                      <span className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{selectedFigure.field}</span>
                    </div>
                    <p className={`text-lg mb-6 ${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>{selectedFigure.bio}</p>
                    
                    {/* 成就标签 */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {(selectedFigure.achievements || []).map((a: string, i: number) => (
                        <motion.span 
                          key={i} 
                          className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-all duration-300`}
                          whileHover={{ scale: 1.05 }}
                        >{a}</motion.span>
                      ))}
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }} 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const base = `${selectedFigure.name} ${selectedFigure.field}`.trim();
                        const text = `${base} ${selectedFigure.bio}`.trim();
                        const url = `/create?from=knowledge&prompt=${encodeURIComponent(text)}`;
                        navigate(url);
                      }}
                      className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white px-6 py-3 rounded-full transition-all duration-300 flex items-center shadow-lg"
                    >
                      <i className="fas fa-magic mr-2"></i>
                      应用到创作
                    </motion.button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
      
      {/* 页脚 */}
      <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-6 px-4 z-10 relative`}>
        <div className="container mx-auto flex flex-col md:flex-row justify_between items-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            © 2025 AI共创平台. 保留所有权利
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>隐私政策</a>
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>服务条款</a>
            <a href="#" className={`text-sm ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>帮助中心</a>
          </div>
        </div>
      </footer>
    </>
  );
}
