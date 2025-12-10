import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import llmService from '../services/llmService';

// 点评结果类型定义
interface AID点评Result {
  overallScore: number;
  culturalFit: {
    score: number;
    details: string[];
  };
  creativity: {
    score: number;
    details: string[];
  };
  aesthetics: {
    score: number;
    details: string[];
  };
  suggestions: string[];
  similarWorks?: Array<{
    id: number;
    thumbnail: string;
    title: string;
  }>;
  commercialPotential?: {
    score: number;
    analysis: string[];
  };
}

interface AID点评Props {
  workId: string;
  onClose: () => void;
}

const AID点评: React.FC<AID点评Props> = ({ workId, onClose }) => {
  const { theme, isDark } = useTheme();
  const [点评Result, set点评Result] = useState<AID点评Result | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);
  const [currentTab, setCurrentTab] = useState<'overall' | 'detail' | 'commercial'>('overall');
  
  // 模拟点评数据 - 现在使用LLM服务生成更智能的点评
  useEffect(() => {
    setIsLoading(true);
    
    // 模拟API请求延迟
    setTimeout(async () => {
      try {
        // 使用LLM服务生成点评内容
        // 这里我们模拟调用，实际上可以传递作品内容给LLM服务
        const creationDescription = "这是一个融合传统云纹元素的设计作品，采用了红色调和现代布局";
        
        // 获取创作问题诊断
        const issues = llmService.diagnoseCreationIssues(creationDescription);
        
        // 生成点评结果
        set点评Result({
          overallScore: 85,
          culturalFit: {
            score: 90,
            details: [
              '成功融入了传统云纹元素',
              '色彩搭配符合中国传统审美',
              '纹样布局合理，保留了文化韵味'
            ]
          },
          creativity: {
            score: 82,
            details: [
              '传统元素与现代设计结合有创新',
              '构图新颖，视觉冲击力强',
              '可以尝试更多元化的文化元素融合'
            ]
          },
          aesthetics: {
            score: 88,
            details: [
              '整体视觉效果和谐统一',
              '色彩层次分明，过渡自然',
              '排版合理，重点突出'
            ]
          },
          suggestions: issues.length > 0 ? issues : [
            '建议增加更多样化的传统纹样组合',
            '可以考虑加入非物质文化遗产元素增强文化深度',
            '尝试不同的色彩搭配方案，进一步突出国潮风格',
            '增加互动性元素，提升用户参与感',
            '考虑商业应用场景，优化设计细节'
          ],
          commercialPotential: {
            score: 85,
            analysis: [
              '设计风格符合当前国潮趋势，具有较高商业价值',
              '适合应用于文创产品、包装设计等领域',
              '建议申请版权存证，保护原创权益',
              '可考虑参与平台举办的商业化对接活动'
            ]
          },
          similarWorks: [
            {
              id: 1,
              thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Similar%20traditional%20Chinese%20design%20work%201',
              title: '国潮新风尚'
            },
            {
              id: 2,
              thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Similar%20traditional%20Chinese%20design%20work%202',
              title: '传统纹样创新'
            },
            {
              id: 3,
              thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Similar%20traditional%20Chinese%20design%20work%203',
              title: '东方美学重构'
            }
          ]
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('生成点评失败:', error);
        setIsLoading(false);
      }
    }, 1500);
  }, [workId]);
  
  const handleApplySuggestion = (suggestion: string) => {
    toast.success('已应用建议到当前创作');
  };
  
  const handleApplyCommercialAdvice = () => {
    toast.success('已将商业化建议添加到您的创作任务列表');
  };
  
  const COLORS = ['#f87171', '#60a5fa', '#34d399'];
  
  // 根据分数获取评级
  const getRating = (score: number) => {
    if (score >= 90) return { text: '优秀', color: 'text-green-500' };
    if (score >= 80) return { text: '良好', color: 'text-blue-500' };
    if (score >= 70) return { text: '中等', color: 'text-yellow-500' };
    if (score >= 60) return { text: '及格', color: 'text-orange-500' };
    return { text: '需改进', color: 'text-red-500' };
  };
  
  if (isLoading) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <motion.div 
          className={`p-8 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-md w-full mx-4`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
            <p className="text-lg font-medium mb-2">AI智能点评中...</p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              正在分析您的作品，请稍候...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }
  
  if (!点评Result) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-gray-900 bg-opacity-80' : 'bg-gray-50 bg-opacity-80'} backdrop-blur-sm`}
    >
      <motion.div 
        className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto mx-4`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* 点评头部 */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
          <h3 className="text-xl font-bold">AI智能点评</h3>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="关闭"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* 点评标签页 */}
        <div className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex">
            {[
              { id: 'overall', name: '总体评分' },
              { id: 'detail', name: '详细点评' },
              { id: 'commercial', name: '商业化建议' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id as any)}
                className={`px-6 py-3 transition-colors font-medium text-sm ${
                  currentTab === tab.id 
                    ? 'text-red-600 border-b-2 border-red-600' 
                    : isDark 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-600 hover:text-black'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* 点评内容 */}
        <div className="p-6">
          {/* 总体评分标签页 */}
          {currentTab === 'overall' && (
            <div>
              <div className="flex flex-col md:flex-row items-center mb-8">
                <div className="flex-shrink-0 mb-6 md:mb-0 md:mr-8">
                  <div className="relative w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ value: 点评Result.overallScore }, { value: 100 - 点评Result.overallScore }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={0}
                          dataKey="value"
                        >
                          <Cell fill="#f87171" />
                          <Cell fill={isDark ? '#374151' : '#e5e7eb'} />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-bold">{点评Result.overallScore}</span>
                      <span className="text-sm opacity-70">总分</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { 
                        title: '文化契合度', 
                        score: 点评Result.culturalFit.score, 
                        color: 'text-green-500' 
                      },
                      { 
                        title: '创意性', 
                        score: 点评Result.creativity.score, 
                        color: 'text-blue-500' 
                      },
                      { 
                        title: '美学表现', 
                        score: 点评Result.aesthetics.score, 
                        color: 'text-purple-500' 
                      }
                    ].map((item, index) => {
                      const rating = getRating(item.score);
                      
                      return (
                        <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                          <p className="text-sm mb-1">{item.title}</p>
                          <div className="flex items-end">
                            <span className="text-2xl font-bold mr-2">{item.score}</span>
                            <span className={`text-sm ${rating.color}`}>{rating.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* 亮点总结 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-8`}>
                <h4 className="font-medium mb-3">作品亮点</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <i className="fas fa-star text-yellow-500 mt-1 mr-2 flex-shrink-0"></i>
                    <span className="text-sm">文化元素融入自然，展现了深厚的文化底蕴</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-star text-yellow-500 mt-1 mr-2 flex-shrink-0"></i>
                    <span className="text-sm">设计风格现代与传统完美结合，符合当下国潮趋势</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-star text-yellow-500 mt-1 mr-2 flex-shrink-0"></i>
                    <span className="text-sm">视觉层次分明，色彩搭配和谐统一</span>
                  </li>
                </ul>
              </div>
              
              {/* 推荐参考作品 */}
              {点评Result.similarWorks && 点评Result.similarWorks.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium mb-4">推荐参考作品</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {点评Result.similarWorks.map((work) => (
                      <motion.div
                        key={work.id}
                        className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md`}
                        whileHover={{ y: -5 }}
                      >
                        <img 
                          src={work.thumbnail} 
                          alt={work.title} 
                          className="w-full h-32 object-cover"
                        />
                        <div className="p-3">
                          <p className="text-sm font-medium text-center">{work.title}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 详细点评标签页 */}
          {currentTab === 'detail' && (
            <div className="space-y-6">
              {/* 文化契合度 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-medium">文化契合度</h5>
                  <div className={`text-sm ${getRating(点评Result.culturalFit.score).color}`}>
                    {getRating(点评Result.culturalFit.score).text}
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {点评Result.culturalFit.details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 创意性 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-medium">创意性</h5>
                  <div className={`text-sm ${getRating(点评Result.creativity.score).color}`}>
                    {getRating(点评Result.creativity.score).text}
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {点评Result.creativity.details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 美学表现 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center mb-3">
                  <h5 className="font-medium">美学表现</h5>
                  <div className={`text-sm ${getRating(点评Result.aesthetics.score).color}`}>
                    {getRating(点评Result.aesthetics.score).text}
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {点评Result.aesthetics.details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                      <span className="text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 改进建议 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h5 className="font-medium mb-3">改进建议</h5>
                <ul className="space-y-3">
                  {(showMoreSuggestions ? 点评Result.suggestions : 点评Result.suggestions.slice(0, 2)).map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-lightbulb text-yellow-500 mt-1 mr-2 flex-shrink-0"></i>
                      <div className="flex-1">
                        <span className="text-sm">{suggestion}</span>
                        <button 
                          onClick={() => handleApplySuggestion(suggestion)}
                          className="ml-2 text-xs text-red-600 hover:text-red-700"
                        >
                          应用此建议
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                
                {点评Result.suggestions.length > 2 && (
                  <button 
                    onClick={() => setShowMoreSuggestions(!showMoreSuggestions)}
                    className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center"
                  >
                    {showMoreSuggestions ? '收起' : '查看更多建议'}<i className={`fas fa-chevron-${showMoreSuggestions ? 'up' : 'down'} ml-1`}></i>
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* 商业化建议标签页 */}
          {currentTab === 'commercial' && 点评Result.commercialPotential && (
            <div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                  <i className="fas fa-chart-line text-2xl"></i>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1">商业化潜力评估</h4>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold mr-2">{点评Result.commercialPotential.score}</span>
                    <span className={`${getRating(点评Result.commercialPotential.score).color} text-sm`}>
                      {getRating(点评Result.commercialPotential.score).text}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 商业化分析 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-6`}>
                <h5 className="font-medium mb-3">商业化分析</h5>
                <ul className="space-y-2">
                  {点评Result.commercialPotential.analysis.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-bullseye text-blue-500 mt-1 mr-2 flex-shrink-0"></i>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 推荐的商业化路径 */}
              <div className={`p-5 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} mb-6`}>
                <h5 className="font-medium mb-3">推荐商业化路径</h5>
                <div className="space-y-3">
                  {[
                    { title: '文创产品开发', icon: 'gift', description: '适合开发成各类文创周边产品' },
                    { title: '品牌包装设计', icon: 'box', description: '可应用于老字号品牌包装升级' },
                    { title: '数字藏品', icon: 'gem', description: '具有转化为数字藏品的潜力' }
                  ].map((path, index) => (
                    <div key={index} className="flex items-start p-3 rounded-lg bg-white bg-opacity-10">
                      <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mr-3 flex-shrink-0">
                        <i className={`fas fa-${path.icon}`}></i>
                      </div>
                      <div>
                        <h6 className="font-medium">{path.title}</h6>
                        <p className="text-xs opacity-80">{path.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 相关活动推荐 */}
              <div className="mb-6">
                <h5 className="font-medium mb-3">相关活动推荐</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { 
                      title: '老字号品牌创新大赛', 
                      deadline: '2025-12-31', 
                      reward: '最高奖金¥50,000',
                      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Design%20competition%20poster%20traditional%20Chinese%20elements'
                    },
                    { 
                      title: '国潮文创设计营', 
                      deadline: '2025-11-30', 
                      reward: '专业导师指导+展示机会',
                      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Cultural%20creative%20design%20workshop'
                    }
                  ].map((activity, index) => (
                    <div key={index} className={`rounded-lg overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex">
                        <img 
                          src={activity.image} 
                          alt={activity.title} 
                          className="w-24 h-24 object-cover"
                        />
                        <div className="p-3 flex-1">
                          <h6 className="font-medium mb-1">{activity.title}</h6>
                          <div className="text-xs opacity-80 mb-1">
                            截止日期：{activity.deadline}
                          </div>
                          <div className="text-xs font-medium text-red-600">
                            {activity.reward}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 点评底部 */}
        <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
          {currentTab === 'commercial' && 点评Result.commercialPotential && (
            <button 
              onClick={handleApplyCommercialAdvice}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            >
              采纳商业化建议
            </button>
          )}
          
          {currentTab === 'detail' && (
            <button className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors">
              应用所有建议
            </button>
          )}
          
          <button 
            onClick={onClose}
            className={`px-4 py-2 rounded-lg ${
              isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            } transition-colors`}
          >
            关闭
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AID点评;
