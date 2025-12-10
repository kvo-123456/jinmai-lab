import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { TianjinImage } from './TianjinStyleComponents';

// 资讯类型定义
interface NewsItem {
  id: number;
  title: string;
  description: string;
  image: string;
  date: string;
  category: string;
  source: string;
  views: number;
}

// 新闻卡片组件 - 使用React.memo优化
const NewsCard = memo(({ news, isDark, navigate }: { news: NewsItem; isDark: boolean; navigate: (path: string) => void }) => {
  return (
    <div
      key={news.id}
      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-2xl cursor-pointer group hover:-translate-y-1`}
      onClick={() => navigate(`/news/${news.id}`)}
    >
      <div className="relative overflow-hidden rounded-t-xl">
        <TianjinImage
          src={news.image}
          alt={news.title}
          ratio="landscape"
          fit="cover"
          className="w-full h-36 sm:h-40 transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex justify-between items-center mb-2 sm:mb-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {news.category}
          </span>
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
            {news.date}
          </span>
        </div>
        <h3 className="font-bold text-base sm:text-lg mb-2 sm:mb-3 line-clamp-2 transition-colors duration-300 group-hover:text-red-500">{news.title}</h3>
        <p className={`text-sm mb-3 sm:mb-4 line-clamp-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {news.description}
        </p>
        <div className="flex justify-between items-center text-xs sm:text-sm pt-2 sm:pt-3 border-t border-gray-700/30">
          <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
            {news.source}
          </span>
          <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} flex items-center font-medium`}>
            <i className="far fa-eye mr-1"></i>
            {news.views.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
});

export default function CulturalNews() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visibleItems, setVisibleItems] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // 移除人为加载延迟，直接设置为加载完成
  useEffect(() => {
    setIsLoading(false);
  }, []);
  
  // 资讯分类
  const categories = [
    { id: 'all', name: '全部' },
    { id: '政策动态', name: '政策动态' },
    { id: '赛事活动', name: '赛事活动' },
    { id: '展览展示', name: '展览展示' },
    { id: '技术应用', name: '技术应用' },
    { id: '品牌动态', name: '品牌动态' },
    { id: '市场动态', name: '市场动态' }
  ];
  
  // 模拟文化资讯数据
  const newsItems: NewsItem[] = [
    // 政策动态
    {
      id: 1,
      title: '全国非物质文化遗产保护工作会议在京召开',
      description: '会议总结了近年来非遗保护工作成果，部署了下一阶段重点任务，强调要加强非遗的活态传承和创新发展。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=National%20intangible%20cultural%20heritage%20protection%20work%20conference%20Beijing',
      date: '2025-12-03',
      category: '政策动态',
      source: '文化和旅游部',
      views: 12563
    },
    {
      id: 2,
      title: '《中国传统工艺振兴计划》实施成效显著',
      description: '五年来，该计划推动了1500余项传统工艺项目的保护和发展，带动了200多万从业人员就业增收。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=China%20traditional%20craft%20revitalization%20plan%20implementation%20achievements',
      date: '2025-11-28',
      category: '政策动态',
      source: '光明日报',
      views: 15678
    },
    {
      id: 3,
      title: '中国传统音乐保护与传承工程启动',
      description: '工程将通过录制、整理、研究等方式，对中国传统音乐进行系统保护和传承，预计历时五年完成。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=China%20traditional%20music%20protection%20and%20transmission%20project%20launch',
      date: '2025-11-15',
      category: '政策动态',
      source: '中国音乐家协会',
      views: 10345
    },
    {
      id: 4,
      title: '《文化产业数字化战略实施方案》正式发布',
      description: '方案提出到2035年，实现文化产业数字化转型全面完成，数字文化产业成为国民经济支柱性产业。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Cultural%20industry%20digitalization%20strategy%20implementation%20plan%20release',
      date: '2025-11-08',
      category: '政策动态',
      source: '新华社',
      views: 18923
    },
    {
      id: 5,
      title: '国家文物局发布《文物数字化保护导则》',
      description: '导则明确了文物数字化保护的技术标准和工作流程，为全国文物数字化工作提供了指导。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=National%20cultural%20heritage%20administration%20digital%20protection%20guidelines',
      date: '2025-10-25',
      category: '政策动态',
      source: '国家文物局',
      views: 14567
    },
    {
      id: 6,
      title: '首批国家级文化产业示范园区复核结果公布',
      description: '全国共有20个园区通过复核，10个园区被取消称号，进一步规范了文化产业示范园区建设。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=National%20level%20cultural%20industry%20demonstration%20park%20review%20results',
      date: '2025-10-18',
      category: '政策动态',
      source: '文化和旅游部',
      views: 11234
    },
    
    // 赛事活动
    {
      id: 7,
      title: '2025中国传统文化创意设计大赛启动',
      description: '本次大赛以"传统与现代融合"为主题，面向全球设计师征集优秀作品，推动传统文化的创造性转化和创新性发展。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=2025%20China%20traditional%20culture%20creative%20design%20competition%20launch',
      date: '2025-12-01',
      category: '赛事活动',
      source: '中国文化产业协会',
      views: 8921
    },
    {
      id: 8,
      title: '2025国际非遗博览会在济南开幕',
      description: '博览会吸引了来自全球40多个国家和地区的非遗项目参展，展示了丰富的人类非物质文化遗产。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=2025%20International%20intangible%20cultural%20heritage%20expo%20Jinan',
      date: '2025-11-20',
      category: '赛事活动',
      source: '中国非物质文化遗产保护中心',
      views: 12345
    },
    {
      id: 9,
      title: '全国青少年文化创意大赛总决赛在深圳举行',
      description: '来自全国30个省市自治区的1000名青少年参加了总决赛，展示了新一代对传统文化的创新理解。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=National%20youth%20cultural%20creative%20competition%20final%20Shenzhen',
      date: '2025-11-15',
      category: '赛事活动',
      source: '中国青少年发展基金会',
      views: 9876
    },
    {
      id: 10,
      title: '2025中国传统工艺技能大赛即将举行',
      description: '大赛将设置木雕、陶瓷、刺绣等10个传统工艺项目，来自全国各地的能工巧匠将展开技艺比拼。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=2025%20China%20traditional%20craft%20skills%20competition',
      date: '2025-12-10',
      category: '赛事活动',
      source: '中国工艺美术协会',
      views: 7654
    },
    {
      id: 11,
      title: '第一届"国潮之星"设计大赛启动报名',
      description: '大赛面向全球设计师征集具有中国传统文化元素的时尚设计作品，奖金总额达100万元。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=First%20Guochao%20Star%20design%20competition%20registration%20launch',
      date: '2025-11-30',
      category: '赛事活动',
      source: '中国时尚协会',
      views: 8921
    },
    {
      id: 12,
      title: '2025中国数字文化创意大赛结果揭晓',
      description: '大赛共收到来自全国的2万余件作品，最终评选出金奖10名、银奖20名、铜奖30名。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=2025%20China%20digital%20cultural%20creative%20competition%20results',
      date: '2025-11-25',
      category: '赛事活动',
      source: '中国数字文化产业协会',
      views: 10345
    },
    
    // 展览展示
    {
      id: 13,
      title: '首届中国传统色彩艺术展在上海开幕',
      description: '展览汇集了来自全国各地的传统色彩艺术作品，包括绘画、纺织、陶瓷等多个门类，展现了中国传统色彩的独特魅力。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=First%20China%20traditional%20color%20art%20exhibition%20Shanghai%20opening',
      date: '2025-11-25',
      category: '展览展示',
      source: '上海文化艺术报',
      views: 9876
    },
    {
      id: 14,
      title: '"丝路华章"古代丝绸艺术展在国家博物馆展出',
      description: '展览展示了从西汉到明清时期的丝绸文物，展现了丝绸之路的繁荣和中国古代丝绸工艺的高超水平。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Silk%20Road%20splendor%20ancient%20silk%20art%20exhibition%20National%20Museum',
      date: '2025-12-01',
      category: '展览展示',
      source: '中国国家博物馆',
      views: 14567
    },
    {
      id: 15,
      title: '中国传统家具艺术展在故宫博物院开展',
      description: '展览精选了故宫博物院藏的明清家具珍品，展示了中国传统家具的精湛工艺和独特魅力。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=China%20traditional%20furniture%20art%20exhibition%20Forbidden%20City',
      date: '2025-11-15',
      category: '展览展示',
      source: '故宫博物院',
      views: 16789
    },
    {
      id: 16,
      title: '"墨韵中华"当代书法艺术展在北京举行',
      description: '展览汇集了当代百位著名书法家的作品，展示了中国书法艺术的传承与创新。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Ink%20charm%20of%20China%20contemporary%20calligraphy%20art%20exhibition%20Beijing',
      date: '2025-11-10',
      category: '展览展示',
      source: '中国书法家协会',
      views: 8921
    },
    {
      id: 17,
      title: '中国传统陶瓷艺术展在景德镇开幕',
      description: '展览展示了从唐宋到明清时期的陶瓷珍品，以及当代陶瓷艺术家的创新作品。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=China%20traditional%20ceramic%20art%20exhibition%20Jingdezhen',
      date: '2025-10-28',
      category: '展览展示',
      source: '景德镇陶瓷大学',
      views: 11234
    },
    {
      id: 18,
      title: '"民间瑰宝"中国传统玩具展在广州开展',
      description: '展览展示了中国各地的传统玩具，包括泥人、风筝、皮影等，唤起了人们的童年记忆。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=China%20traditional%20toys%20exhibition%20Guangzhou',
      date: '2025-10-20',
      category: '展览展示',
      source: '广东省博物馆',
      views: 7654
    },
    
    // 技术应用
    {
      id: 19,
      title: '数字化技术助力非遗传承新发展',
      description: '通过VR、AR、AI等技术，非遗项目得以更生动地呈现给观众，同时也为非遗传承提供了新的手段和途径。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Digital%20technology%20aiding%20intangible%20cultural%20heritage%20transmission',
      date: '2025-11-20',
      category: '技术应用',
      source: '科技日报',
      views: 11234
    },
    {
      id: 20,
      title: 'AI技术赋能传统绘画创作',
      description: '通过AI技术，可以辅助艺术家进行传统绘画创作，提高创作效率和作品质量。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=AI%20technology%20empowering%20traditional%20painting%20creation',
      date: '2025-11-15',
      category: '技术应用',
      source: '中国艺术研究院',
      views: 9876
    },
    {
      id: 21,
      title: '区块链技术在文物保护中的应用',
      description: '区块链技术可以实现文物的数字化存证和溯源，有效防止文物造假和非法交易。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Blockchain%20technology%20application%20in%20cultural%20heritage%20protection',
      date: '2025-11-10',
      category: '技术应用',
      source: '中国文物保护技术协会',
      views: 13456
    },
    {
      id: 22,
      title: '5G+AR技术打造沉浸式文化体验',
      description: '通过5G+AR技术，可以为观众提供沉浸式的文化体验，让传统文化更加生动有趣。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=5G%20AR%20technology%20creating%20immersive%20cultural%20experience',
      date: '2025-10-28',
      category: '技术应用',
      source: '中国文化报',
      views: 15678
    },
    {
      id: 23,
      title: '数字孪生技术在古建筑保护中的应用',
      description: '通过数字孪生技术，可以创建古建筑的精确数字模型，为古建筑保护和修复提供科学依据。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Digital%20twin%20technology%20application%20in%20ancient%20architecture%20protection',
      date: '2025-10-20',
      category: '技术应用',
      source: '中国建筑学会',
      views: 10345
    },
    {
      id: 24,
      title: '大数据技术在文化产业中的应用',
      description: '通过大数据技术，可以分析文化消费趋势，为文化产业发展提供决策支持。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Big%20data%20technology%20application%20in%20cultural%20industry',
      date: '2025-10-15',
      category: '技术应用',
      source: '中国信息协会',
      views: 12345
    },
    
    // 品牌动态
    {
      id: 25,
      title: '老字号品牌创新发展论坛成功举办',
      description: '论坛聚焦老字号品牌的数字化转型和创新发展，来自全国各地的老字号企业代表分享了各自的经验和做法。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Time-honored%20brand%20innovation%20development%20forum%20successfully%20held',
      date: '2025-11-18',
      category: '品牌动态',
      source: '中国品牌网',
      views: 7654
    },
    {
      id: 26,
      title: '故宫文创推出"故宫猫"系列新品',
      description: '故宫文创推出了以故宫猫为主题的系列文创产品，包括文具、饰品、家居用品等，受到了年轻人的喜爱。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Forbidden%20City%20cultural%20and%20creative%20Cat%20series%20new%20products',
      date: '2025-12-01',
      category: '品牌动态',
      source: '故宫博物院',
      views: 14567
    },
    {
      id: 27,
      title: '"中国李宁"2026春夏系列发布',
      description: '系列设计融入了中国传统元素，包括青花瓷、中国结等，展现了国潮设计的新高度。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=China%20Li-Ning%202026%20spring%20summer%20collection%20release',
      date: '2025-11-25',
      category: '品牌动态',
      source: '李宁官方',
      views: 18923
    },
    {
      id: 28,
      title: '稻香村推出非遗技艺系列糕点',
      description: '糕点制作过程中运用了多种非遗技艺，包括传统发酵、手工成型等，让消费者品尝到正宗的传统味道。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Daoxiangcun%20intangible%20cultural%20heritage%20skill%20series%20pastries',
      date: '2025-11-20',
      category: '品牌动态',
      source: '稻香村官方',
      views: 9876
    },
    {
      id: 29,
      title: '茅台推出"文化茅台"系列酒品',
      description: '系列酒品包装设计融入了中国传统文化元素，包括书法、绘画等，展现了茅台的文化底蕴。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Moutai%20Cultural%20Moutai%20series%20alcohol%20products',
      date: '2025-11-15',
      category: '品牌动态',
      source: '茅台集团',
      views: 16789
    },
    {
      id: 30,
      title: '"张小泉"发布全新品牌形象',
      description: '新形象融合了传统与现代元素，展现了老字号品牌的创新活力。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Zhang%20Xiaoquan%20new%20brand%20image%20release',
      date: '2025-11-10',
      category: '品牌动态',
      source: '张小泉官方',
      views: 8921
    },
    
    // 市场动态
    {
      id: 31,
      title: '国潮设计成为年轻人消费新宠',
      description: '随着国潮文化的兴起，越来越多的年轻人开始关注和购买具有中国传统文化元素的设计产品。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Guochao%20design%20becoming%20new%20favorite%20among%20young%20consumers',
      date: '2025-11-10',
      category: '市场动态',
      source: '消费日报',
      views: 13456
    },
    {
      id: 32,
      title: '2025年前三季度文化产业增加值同比增长8.5%',
      description: '文化产业增加值占GDP的比重达到4.5%，继续保持较快增长态势。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=2025%20first%20three%20quarters%20cultural%20industry%20added%20value%20growth',
      date: '2025-10-28',
      category: '市场动态',
      source: '国家统计局',
      views: 15678
    },
    {
      id: 33,
      title: '数字文化产业规模突破5万亿元',
      description: '数字文化产业成为文化产业增长的主要动力，占文化产业总量的比重超过40%。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Digital%20cultural%20industry%20scale%20exceeds%205%20trillion%20yuan',
      date: '2025-10-20',
      category: '市场动态',
      source: '中国数字文化产业协会',
      views: 17892
    },
    {
      id: 34,
      title: '传统文化主题景区游客量同比增长20%',
      description: '越来越多的游客选择参观传统文化主题景区，体验传统文化的魅力。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Traditional%20culture%20theme%20scenic%20spots%20visitor%20volume%20growth',
      date: '2025-10-15',
      category: '市场动态',
      source: '中国旅游协会',
      views: 11234
    },
    {
      id: 35,
      title: '文创产品市场规模持续扩大',
      description: '2025年文创产品市场规模预计达到1.5万亿元，同比增长15%。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Cultural%20and%20creative%20products%20market%20scale%20continues%20to%20expand',
      date: '2025-10-10',
      category: '市场动态',
      source: '中国文化创意产业研究会',
      views: 9876
    },
    {
      id: 36,
      title: '传统文化类图书销售同比增长30%',
      description: '传统文化类图书受到读者青睐，销售同比增长30%，其中少儿类传统文化图书增长最为明显。',
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_4_3&prompt=Traditional%20culture%20books%20sales%20growth',
      date: '2025-09-28',
      category: '市场动态',
      source: '中国出版协会',
      views: 8921
    }
  ];
  
  // 过滤资讯 - 使用useMemo缓存
  const filteredNews = useMemo(() => {
    return activeCategory === 'all' 
      ? newsItems 
      : newsItems.filter(item => item.category === activeCategory);
  }, [activeCategory, newsItems]);
  
  // 当前显示的资讯 - 使用useMemo缓存
  const currentNews = useMemo(() => {
    return filteredNews.slice(0, visibleItems);
  }, [filteredNews, visibleItems]);
  
  // 是否还有更多数据
  const hasMore = visibleItems < filteredNews.length;
  
  // 加载更多数据 - 移除人为延迟
  const loadMore = () => {
    if (hasMore && !isLoadingMore) {
      setIsLoadingMore(true);
      // 直接更新，移除人为延迟
      setVisibleItems(prev => Math.min(prev + 8, filteredNews.length));
      setIsLoadingMore(false);
    }
  };
  
  // 监听滚动到底部
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, isLoadingMore, filteredNews.length]);
  
  // 当分类变化时，重置可见项数量
  useEffect(() => {
    setVisibleItems(12);
  }, [activeCategory]);
  
  return (
    <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-2xl p-4 sm:p-6 shadow-md`}>
      {/* 分类筛选 */}
      <div className="flex overflow-x-auto space-x-2 sm:space-x-3 mb-4 sm:mb-6 pb-2 scrollbar-hide">
        {isLoading ? (
          // 分类加载骨架屏
          <div className="flex space-x-2 sm:space-x-3">
            {[...Array(7)].map((_, index) => (
              <div 
                key={index}
                className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-gray-700 animate-pulse h-9 sm:h-10 min-w-[70px] sm:min-w-[80px]`}
              ></div>
            ))}
          </div>
        ) : (
          categories.map(category => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all touch-manipulation ${activeCategory === category.id
                  ? 'bg-red-600 text-white shadow-lg transform scale-105'
                  : isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:shadow-md'
                  : 'bg-white hover:bg-gray-200 text-gray-700 hover:shadow-md'}`}
            >
              {category.name}
            </button>
          ))
        )}
      </div>
      
      {/* 资讯列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, index) => (
            <div 
              key={index} 
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-md transition-all duration-300`}
            >
              <div className="w-full h-36 sm:h-40 bg-gray-700 rounded-t-xl animate-pulse"></div>
              <div className="p-4 sm:p-5">
                <div className="h-3 bg-gray-700 rounded w-24 mb-3 animate-pulse"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-700 rounded w-1/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/4 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {currentNews.map(news => (
              <NewsCard key={news.id} news={news} isDark={isDark} navigate={navigate} />
            ))}
          </div>
          
          {/* 加载更多指示器 */}
          {hasMore && (
            <div className="mt-8 text-center" ref={loadMoreRef}>
              {isLoadingMore ? (
                <div className="flex justify-center items-center space-x-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce"></div>
                  <span className="ml-2 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}">加载中...</span>
                </div>
              ) : (
                <button
                  onClick={loadMore}
                  className={`px-8 py-3.5 rounded-full text-sm font-medium transition-all ${isDark
                      ? 'bg-gray-800 hover:bg-gray-700 text-white'
                      : 'bg-white hover:bg-gray-200 text-gray-800'} shadow-md hover:shadow-xl`}
                >
                  加载更多资讯
                </button>
              )}
            </div>
          )}
          
          {/* 没有更多数据提示 */}
          {!hasMore && filteredNews.length > 0 && (
            <div className="mt-8 text-center">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                已显示全部资讯
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
