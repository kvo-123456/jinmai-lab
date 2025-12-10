import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { TianjinImage } from '@/components/TianjinStyleComponents';
import ipService, { IPAsset, IPStage as ServiceIPStage, CommercialPartnership } from '@/services/ipService';

// 商业化机会类型定义
interface CommercialOpportunity {
  id: number;
  name: string;
  description: string;
  brand: string;
  reward: string;
  status: 'open' | 'matched' | 'closed';
  image: string;
}

// 版权资产类型定义
interface CopyrightAsset {
  id: number;
  name: string;
  thumbnail: string;
  type: string;
  createdAt: string;
  status: string;
  canLicense: boolean;
}

// 增强的IP孵化阶段类型定义
interface EnhancedIPStage extends ServiceIPStage {
  icon: string;
  active: boolean;
  index: number;
}

export default function IPIncubationCenter() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'incubation' | 'opportunities' | 'copyright' | 'assets' | 'analytics'>('incubation');
  const [selectedIPAsset, setSelectedIPAsset] = useState<IPAsset | null>(null);
  const [ipAssets, setIpAssets] = useState<IPAsset[]>([]);
  const [filteredIpAssets, setFilteredIpAssets] = useState<IPAsset[]>([]);
  const [commercialOpportunities, setCommercialOpportunities] = useState<CommercialOpportunity[]>([]);
  const [copyrightAssets, setCopyrightAssets] = useState<CopyrightAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ipStats, setIpStats] = useState<ReturnType<typeof ipService.getIPStats>>({
    totalAssets: 0,
    completedAssets: 0,
    inProgressAssets: 0,
    totalPartnerships: 0,
    activePartnerships: 0,
    totalEstimatedValue: 0
  });
  
  // 新增搜索和筛选功能
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<IPAsset['type'] | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'in-progress' | 'completed' | 'pending' | 'all'>('all');
  const [minValueFilter, setMinValueFilter] = useState<string>('');
  
  // IP价值趋势数据
  const [valueTrendData, setValueTrendData] = useState<ReturnType<typeof ipService.getIPValueTrend>>([]);
  
  // IP类型分布数据
  const [typeDistributionData, setTypeDistributionData] = useState<ReturnType<typeof ipService.getIPTypeDistribution>>([]);
  
  // 定义孵化阶段的图标映射
  const stageIcons: Record<string, string> = {
    '创意设计': 'palette',
    '版权存证': 'shield-alt',
    'IP孵化': 'gem',
    '商业合作': 'handshake',
    '收益分成': 'coins'
  };

  // 加载真实数据
  useEffect(() => {
    setIsLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      // 从IPService获取真实数据
      const ipAssets = ipService.getAllIPAssets();
      const stats = ipService.getIPStats();
      
      // 模拟商业化机会数据（保持不变）
      const opportunities: CommercialOpportunity[] = [
        {
          id: 1,
          name: '国潮包装设计',
          description: '为老字号食品品牌设计国潮风格包装',
          brand: '桂发祥',
          reward: '¥15,000',
          status: 'open',
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Traditional%20brand%20packaging%20design%20opportunity'
        },
        {
          id: 2,
          name: '文创产品开发',
          description: '设计传统文化元素文创产品系列',
          brand: '杨柳青画社',
          reward: '¥20,000',
          status: 'open',
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Cultural%20creative%20product%20development'
        },
        {
          id: 3,
          name: '数字藏品创作',
          description: '创作基于传统纹样的数字藏品系列',
          brand: '数字艺术馆',
          reward: '分成模式',
          status: 'matched',
          image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Digital%20collectibles%20creation%20opportunity'
        }
      ];

      // 模拟版权资产数据（保持不变）
      const assets = [
        {
          id: 1,
          name: '国潮插画系列',
          thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Copyrighted%20artwork%20example%201',
          type: '插画',
          createdAt: '2025-11-01',
          status: '已存证',
          canLicense: true
        },
        {
          id: 2,
          name: '传统纹样创新',
          thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Copyrighted%20artwork%20example%202',
          type: '纹样',
          createdAt: '2025-10-25',
          status: '已授权',
          canLicense: false
        },
        {
          id: 3,
          name: '老字号品牌视觉',
          thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Copyrighted%20artwork%20example%203',
          type: '品牌设计',
          createdAt: '2025-10-15',
          status: '已存证',
          canLicense: true
        }
      ];

      // 更新状态
      setIpAssets(ipAssets);
      setFilteredIpAssets(ipAssets);
      setIpStats(stats);
      setCommercialOpportunities(opportunities);
      setCopyrightAssets(assets);
      setValueTrendData(ipService.getIPValueTrend());
      setTypeDistributionData(ipService.getIPTypeDistribution());
      
      // 如果有IP资产，默认选择第一个
      if (ipAssets.length > 0) {
        setSelectedIPAsset(ipAssets[0]);
      }

      setIsLoading(false);
    }, 800);
  }, []);

  const handleApplyOpportunity = (opportunityId: number) => {
    toast.success('已申请商业机会，等待品牌方审核');
  };

  const handleLicenseAsset = (assetId: number) => {
    toast.success('版权授权申请已提交');
  };

  // 实现搜索和筛选功能
  useEffect(() => {
    let filtered = ipAssets;
    
    // 应用搜索
    if (searchQuery) {
      filtered = ipService.searchIPAssets(searchQuery);
    }
    
    // 应用筛选
    const filters: any = {};
    if (typeFilter !== 'all') {
      filters.type = typeFilter;
    }
    if (statusFilter !== 'all') {
      filters.status = statusFilter;
    }
    if (minValueFilter) {
      filters.minValue = parseInt(minValueFilter);
    }
    
    if (Object.keys(filters).length > 0) {
      filtered = ipService.filterIPAssets(filters);
    }
    
    setFilteredIpAssets(filtered);
  }, [searchQuery, typeFilter, statusFilter, minValueFilter, ipAssets]);
  
  // 更新IP孵化阶段状态
  const handleUpdateStage = (assetId: string, stageId: string, completed: boolean) => {
    const success = ipService.updateIPStage(assetId, stageId, completed);
    if (success) {
      // 更新本地状态
      setIpAssets(ipService.getAllIPAssets());
      if (selectedIPAsset?.id === assetId) {
        setSelectedIPAsset(ipService.getIPAssetById(assetId) || null);
      }
      toast.success('IP孵化阶段更新成功');
    } else {
      toast.error('IP孵化阶段更新失败');
    }
  };
  
  // 计算IP孵化进度
  const calculateIncubationProgress = (stages: ServiceIPStage[]): number => {
    const completedStages = stages.filter(stage => stage.completed).length;
    return Math.round((completedStages / stages.length) * 100);
  };
  
  // 获取当前活跃的孵化阶段
  const getActiveStage = (stages: ServiceIPStage[]): EnhancedIPStage | undefined => {
    const enhancedStages = stages.map((stage, index) => ({
      ...stage,
      icon: stageIcons[stage.name] || 'question-circle',
      active: false,
      index
    }));
    
    // 查找第一个未完成的阶段作为活跃阶段
    const activeStage = enhancedStages.find(stage => !stage.completed) || enhancedStages[enhancedStages.length - 1];
    if (activeStage) {
      activeStage.active = true;
    }
    
    return activeStage;
  };

  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="space-y-6">
          <div className={`h-8 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="flex space-x-3 overflow-x-auto pb-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`h-10 w-24 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            ))}
          </div>
          <div className={`h-40 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className={`h-4 w-1/3 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className={`h-32 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">IP孵化中心</h3>
        <button className={`px-4 py-2 rounded-lg text-sm ${
          isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
        } transition-colors`}>
          <i className="fas fa-plus mr-1"></i>
          提交作品
        </button>
      </div>

      {/* 标签页切换 */}
      <div className="flex space-x-3 mb-6 overflow-x-auto pb-4 scrollbar-hide">
        {
          [
            { id: 'incubation', name: 'IP孵化路径' },
            { id: 'assets', name: 'IP资产' },
            { id: 'opportunities', name: '商业机会' },
            { id: 'copyright', name: '版权资产' },
            { id: 'analytics', name: '数据分析' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'incubation' | 'assets' | 'opportunities' | 'copyright' | 'analytics')}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id 
                ? 'bg-red-600 text-white shadow-md' 
                : isDark 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'}`}
            >
              {tab.name}
            </button>
          ))
        }
      </div>

      {/* IP孵化路径 */}
      {activeTab === 'incubation' && (
        <div>
          {selectedIPAsset ? (
            <>
              {/* 孵化进度 */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">孵化进度</h4>
                  <span className="text-sm font-medium">
                    {calculateIncubationProgress(selectedIPAsset.stages)}%
                  </span>
                </div>
                
                {/* 孵化资产选择 */}
                <div className={`mb-4 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <TianjinImage 
                      src={selectedIPAsset.thumbnail} 
                      alt={selectedIPAsset.name} 
                      className="w-12 h-12 rounded-lg object-cover" 
                      ratio="square"
                    />
                    <div>
                      <h5 className="font-bold">{selectedIPAsset.name}</h5>
                      <p className="text-sm text-gray-500">{selectedIPAsset.type === 'illustration' ? '插画' : selectedIPAsset.type === 'pattern' ? '纹样' : '设计'}</p>
                    </div>
                    <select 
                      className={`ml-auto px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} border`}
                      value={selectedIPAsset.id}
                      onChange={(e) => setSelectedIPAsset(ipService.getIPAssetById(e.target.value) || null)}
                    >
                      {ipAssets.map(asset => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* 进度条 */}
                <div className={`h-3 mb-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <motion.div 
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-blue-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${calculateIncubationProgress(selectedIPAsset.stages)}%` }}
                    transition={{ duration: 0.5 }}
                  ></motion.div>
                </div>
                
                {/* 阶段进度节点 */}
                <div className="relative mt-8">
                  {/* 垂直进度线 */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
                  
                  {/* 阶段列表 */}
                  <div className="space-y-6">
                    {selectedIPAsset.stages.map((stage, index) => {
                      const enhancedStage = {
                        ...stage,
                        icon: stageIcons[stage.name] || 'question-circle',
                        active: !selectedIPAsset.stages.slice(0, index).some(s => !s.completed) && !stage.completed
                      };
                      
                      return (
                        <motion.div
                          key={stage.id}
                          className="flex gap-4"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          {/* 阶段图标 */}
                          <div className="relative z-10">
                            <div 
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${enhancedStage.completed
                                ? 'bg-green-500 text-white'
                                : enhancedStage.active
                                  ? 'bg-red-600 text-white ring-4 ring-red-200 ring-offset-2'
                                  : isDark
                                    ? 'bg-gray-700 text-gray-400'
                                    : 'bg-gray-200 text-gray-500'}`}
                            >
                              {enhancedStage.completed ? (
                                <i className="fas fa-check text-sm"></i>
                              ) : (
                                <i className={`fas fa-${enhancedStage.icon} text-sm`}></i>
                              )}
                            </div>
                          </div>
                          
                          {/* 阶段内容 */}
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <h5 className={`font-medium ${enhancedStage.active ? 'text-red-600' : ''}`}>
                                {stage.name}
                              </h5>
                              <div className="flex items-center gap-2">
                                {/* 阶段状态切换 */}
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="sr-only peer" 
                                    checked={stage.completed}
                                    onChange={(e) => handleUpdateStage(selectedIPAsset?.id || '', stage.id, e.target.checked)}
                                  />
                                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
                                </label>
                                <span className="text-xs font-medium">
                                  {stage.completed ? '已完成' : '未完成'}
                                </span>
                              </div>
                            </div>
                            <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {stage.description}
                            </p>
                            {stage.completedAt && (
                              <p className="text-xs text-gray-500">
                                完成于 {new Date(stage.completedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 活跃阶段详情 */}
              <div className={`p-6 rounded-xl mb-8 ${isDark ? 'bg-gray-700' : 'bg-yellow-50'}`}>
                {(() => {
                  const activeStage = getActiveStage(selectedIPAsset.stages);
                  if (!activeStage) return null;
                  
                  return (
                    <>
                      <h4 className="font-medium mb-4 flex items-center">
                        <i className="fas fa-play-circle text-yellow-500 mr-2"></i>
                        当前阶段：{activeStage.name}
                      </h4>
                      <p className="text-sm mb-4">
                        {activeStage.description}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                          <h6 className="text-xs text-gray-500 mb-1">完成条件</h6>
                          <p className="text-sm">完成该阶段的所有要求</p>
                        </div>
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                          <h6 className="text-xs text-gray-500 mb-1">预期收益</h6>
                          <p className="text-sm">提升IP商业价值</p>
                        </div>
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                          <h6 className="text-xs text-gray-500 mb-1">下一阶段</h6>
                          <p className="text-sm">
                            {activeStage.index < selectedIPAsset.stages.length - 1 
                              ? selectedIPAsset.stages[activeStage.index + 1].name 
                              : '收益分成'}
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* 孵化数据 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <motion.div
                  className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>已孵化IP</p>
                      <h3 className="text-xl font-bold">{ipStats.totalAssets}</h3>
                    </div>
                    <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                      <i className="fas fa-gem text-lg"></i>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>商业合作</p>
                      <h3 className="text-xl font-bold">{ipStats.totalPartnerships}</h3>
                    </div>
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                      <i className="fas fa-handshake text-lg"></i>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>预估价值</p>
                      <h3 className="text-xl font-bold">¥{ipStats.totalEstimatedValue.toLocaleString()}</h3>
                    </div>
                    <div className="p-2 rounded-full bg-green-100 text-green-600">
                      <i className="fas fa-coins text-lg"></i>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* IP孵化建议 */}
              <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-yellow-50'}`}>
                <h4 className="font-medium mb-4 flex items-center">
                  <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                  IP孵化建议
                </h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                    <p className="text-sm">您的作品"国潮插画系列"已完成版权存证，可以开始申请商业合作</p>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                    <p className="text-sm">建议将"传统纹样创新"设计转化为3D模型，提升商业价值</p>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check-circle text-green-500 mt-1 mr-2 flex-shrink-0"></i>
                    <p className="text-sm">参与当前开放的"桂发祥包装设计"项目，与您的风格高度匹配</p>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <div className={`p-8 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-white'} text-center`}>
              <i className="fas fa-gem text-6xl text-red-600 mb-4"></i>
              <h3 className="text-xl font-bold mb-2">还没有IP资产</h3>
              <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                提交作品并完成版权存证后，即可创建IP资产
              </p>
              <button className="px-6 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">
                提交作品
              </button>
            </div>
          )}
        </div>
      )}

      {/* IP资产 */}
      {activeTab === 'assets' && (
        <div>
          {/* 搜索和筛选 */}
          <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 搜索框 */}
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="搜索IP资产..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                />
              </div>
              
              {/* 类型筛选 */}
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as IPAsset['type'] | 'all')}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                >
                  <option value="all">所有类型</option>
                  <option value="illustration">插画</option>
                  <option value="pattern">纹样</option>
                  <option value="design">设计</option>
                  <option value="3d_model">3D模型</option>
                  <option value="digital_collectible">数字藏品</option>
                </select>
              </div>
              
              {/* 状态筛选 */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'in-progress' | 'completed' | 'pending' | 'all')}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                >
                  <option value="all">所有状态</option>
                  <option value="in-progress">进行中</option>
                  <option value="completed">已完成</option>
                  <option value="pending">待开始</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredIpAssets.map((asset) => (
              <motion.div
                key={asset.id}
                className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                whileHover={{ y: -5 }}
              >
                <div className="relative">
                  <TianjinImage 
                    src={asset.thumbnail} 
                    alt={asset.name} 
                    className="w-full h-48 object-cover"
                    ratio="landscape"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                      {asset.type === 'illustration' ? '插画' : asset.type === 'pattern' ? '纹样' : '设计'}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                      价值 ¥{asset.commercialValue.toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold">{asset.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                      {calculateIncubationProgress(asset.stages)}%
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {asset.description}
                  </p>
                  
                  {/* 孵化阶段进度 */}
                  <div className={`h-2 mb-3 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-blue-500" 
                      style={{ width: `${calculateIncubationProgress(asset.stages)}%` }}
                    ></div>
                  </div>
                  
                  {/* 孵化阶段列表 */}
                  <div className="flex gap-1 mb-4 flex-wrap">
                    {asset.stages.map((stage, index) => (
                      <span 
                        key={stage.id} 
                        className={`text-xs px-2 py-0.5 rounded-full ${stage.completed 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600'}`}
                      >
                        {stage.name}
                      </span>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => setSelectedIPAsset(asset)}
                    className={`w-full py-2 rounded-lg text-sm transition-colors ${isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    <i className="fas fa-arrow-right mr-1"></i>查看详情
                  </button>
                </div>
              </motion.div>
            ))}
            
            {filteredIpAssets.length === 0 && (
              <div className="col-span-full p-8 rounded-xl text-center" style={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` }}>
                <i className="fas fa-gem text-6xl text-red-600 mb-4"></i>
                <h3 className="text-xl font-bold mb-2">没有找到匹配的IP资产</h3>
                <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  尝试调整搜索条件或筛选选项
                </p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                    setStatusFilter('all');
                    setMinValueFilter('');
                  }}
                  className="px-6 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                >
                  重置筛选条件
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 商业机会 */}
      {activeTab === 'opportunities' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {commercialOpportunities.map((opportunity) => (
              <motion.div
                key={opportunity.id}
                className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                whileHover={{ y: -5 }}
              >
                <div className="relative">
                  <TianjinImage 
                    src={opportunity.image} 
                    alt={opportunity.name} 
                    className="w-full h-48 object-cover"
                    ratio="landscape"
                  />
                  <div className="absolute top-3 left-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${opportunity.status === 'open' ? 'bg-green-600 text-white' : opportunity.status === 'matched' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'}`}>
                      {opportunity.status === 'open' ? '开放申请' : opportunity.status === 'matched' ? '匹配中' : '已关闭'}
                    </span>
                  </div>
                </div>
                
                <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold">{opportunity.name}</h4>
                    <span className={`text-sm px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                      {opportunity.brand}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {opportunity.description}
                  </p>
                  
                  <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-50'} mb-4 flex justify-between items-center`}>
                    <span className="text-sm font-medium">奖励</span>
                    <span className="font-bold text-red-600">{opportunity.reward}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleApplyOpportunity(opportunity.id)}
                    disabled={opportunity.status !== 'open'}
                    className={`w-full py-2 rounded-lg text-sm transition-colors ${opportunity.status === 'open' ? 'bg-red-600 hover:bg-red-700 text-white' : isDark ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed'}`}
                  >
                    {opportunity.status === 'open' ? '立即申请' : opportunity.status === 'matched' ? '匹配中' : '已关闭'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 版权资产 */}
      {activeTab === 'copyright' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {copyrightAssets.map((asset) => (
              <motion.div
                key={asset.id}
                className={`rounded-xl overflow-hidden shadow-md border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                whileHover={{ y: -5 }}
              >
                <TianjinImage 
                    src={asset.thumbnail} 
                    alt={asset.name} 
                    className="w-full h-48 object-cover"
                    ratio="landscape"
                  />
                
                <div className={`p-4 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold">{asset.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                      {asset.type}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm mb-4">
                    <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      创建于 {asset.createdAt}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${asset.status === '已存证' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {asset.status}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => handleLicenseAsset(asset.id)}
                    disabled={!asset.canLicense}
                    className={`w-full py-2 rounded-lg text-sm transition-colors ${asset.canLicense ? 'bg-blue-600 hover:bg-blue-700 text-white' : isDark ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed'}`}
                  >
                    {asset.canLicense ? '版权授权' : '已授权'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* 版权数据分析 */}
          <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h4 className="font-medium mb-4">版权数据分析</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm mb-3">版权类型分布</h5>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: '插画', value: 4 },
                          { name: '纹样', value: 2 },
                          { name: '品牌设计', value: 2 },
                          { name: '其他', value: 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: '插画', value: 4 },
                          { name: '纹样', value: 2 },
                          { name: '品牌设计', value: 2 },
                          { name: '其他', value: 0 }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#f87171', '#60a5fa', '#34d399', '#a78bfa'][index % 4]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div>
                <h5 className="text-sm mb-3">版权收益预估</h5>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>已授权收益</span>
                      <span className="font-medium">¥3,500</span>
                    </div>
                    <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div className="h-full rounded-full bg-green-500" style={{ width: '35%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>待授权预估</span>
                      <span className="font-medium">¥6,500</span>
                    </div>
                    <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div className="h-full rounded-full bg-blue-500" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div className="text-center pt-4">
                    <p className="text-sm opacity-70 mb-1">总预估收益</p>
                    <p className="text-2xl font-bold">¥10,000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 数据分析 */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* 数据概览卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`rounded-xl p-4 ${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>总IP资产</p>
                  <h3 className="text-2xl font-bold">{ipStats.totalAssets}</h3>
                </div>
                <div className="p-2 rounded-full bg-red-100 text-red-600">
                  <i className="fas fa-gem text-lg"></i>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`rounded-xl p-4 ${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>活跃合作</p>
                  <h3 className="text-2xl font-bold">{ipStats.activePartnerships}</h3>
                </div>
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <i className="fas fa-handshake text-lg"></i>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`rounded-xl p-4 ${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>总预估价值</p>
                  <h3 className="text-2xl font-bold">¥{ipStats.totalEstimatedValue.toLocaleString()}</h3>
                </div>
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <i className="fas fa-coins text-lg"></i>
                </div>
              </div>
            </motion.div>
          </div>

          {/* IP价值趋势 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`rounded-xl p-6 ${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'}`}
          >
            <h4 className="font-medium mb-4">IP资产价值趋势</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={valueTrendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                  <XAxis dataKey="timestamp" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} tickFormatter={(value) => `¥${value}`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      borderColor: isDark ? '#374151' : '#e5e7eb',
                      color: isDark ? '#f3f4f6' : '#111827',
                    }}
                    formatter={(value: any) => [`¥${value}`, '预估价值']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* IP类型分布 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className={`rounded-xl p-6 ${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'}`}
            >
              <h4 className="font-medium mb-4">IP类型分布</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {typeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        color: isDark ? '#f3f4f6' : '#111827',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* IP孵化阶段分布 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className={`rounded-xl p-6 ${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'}`}
            >
              <h4 className="font-medium mb-4">IP孵化阶段分布</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: '创意设计', value: ipAssets.filter(asset => asset.stages[0].completed).length },
                    { name: '版权存证', value: ipAssets.filter(asset => asset.stages[1].completed).length },
                    { name: 'IP孵化', value: ipAssets.filter(asset => asset.stages[2].completed).length },
                    { name: '商业合作', value: ipAssets.filter(asset => asset.stages[3].completed).length },
                    { name: '收益分成', value: ipAssets.filter(asset => asset.stages[4].completed).length },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="name" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                    <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        color: isDark ? '#f3f4f6' : '#111827',
                      }}
                    />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
