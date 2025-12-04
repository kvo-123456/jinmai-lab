import { useMemo, useState, useEffect, lazy, Suspense } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { mockWorks } from '@/pages/Explore'
// 使用React.lazy实现ARPreview组件的延迟加载
const ARPreview = lazy(() => import('@/components/ARPreview'))
import postsApi from '@/services/postService'
import exportService, { ExportOptions, ExportFormat } from '@/services/exportService'

// 定义ARPreviewConfig类型
interface ARPreviewConfig {
  modelUrl?: string;
  imageUrl?: string;
  scale?: number;
  rotation?: { x: number; y: number; z: number };
  position?: { x: number; y: number; z: number };
  type: '3d' | '2d';
  animations?: boolean;
}

export default function WorkDetail() {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const { id } = useParams()
  const workId = Number(id)
  const work = useMemo(() => mockWorks.find(w => w.id === workId), [workId])
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(work ? work.likes : 0)
  const [bookmarked, setBookmarked] = useState(false)
  const [isARPreviewOpen, setIsARPreviewOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'png',
    resolution: 'medium',
    quality: 0.8,
    includeMetadata: true,
    includeComments: false,
    includeCulturalElements: false,
    includeColorScheme: false,
    includeToolsUsed: false
  })

  const related = useMemo(() => {
    if (!work) return []
    return mockWorks.filter(w => w.category === work.category && w.id !== work.id).slice(0, 6)
  }, [work])

  // 初始化作品的点赞和收藏状态
  useEffect(() => {
    if (work) {
      // 这里应该从postService获取作品的实际状态
      // 由于当前使用的是mock数据，我们暂时使用本地状态
      // 实际项目中应该调用API获取作品详情
      setLikes(work.likes)
      setLiked(false)
      setBookmarked(false)
    }
  }, [work])

  const handleLike = () => {
    if (work) {
      const stringId = work.id.toString()
      if (!liked) {
        postsApi.likePost(stringId)
        setLikes(likes + 1)
      } else {
        postsApi.unlikePost(stringId)
        setLikes(Math.max(0, likes - 1))
      }
      setLiked(!liked)
    }
  }

  const handleBookmark = () => {
    if (work) {
      const stringId = work.id.toString()
      if (!bookmarked) {
        postsApi.bookmarkPost(stringId)
      } else {
        postsApi.unbookmarkPost(stringId)
      }
      setBookmarked(!bookmarked)
    }
  }

  // 处理导出功能
  const handleExport = () => {
    if (!work) return

    // 将Work转换为ExportableWork类型
    const exportableWork = {
      id: work.id.toString(),
      title: work.title,
      description: work.title,
      images: [work.thumbnail],
      category: work.category,
      tags: work.tags,
      culturalElements: work.tags.filter(tag => ['国潮', '传统', '非遗', '民俗', '文化'].some(keyword => tag.includes(keyword))),
      colorScheme: [],
      toolsUsed: [],
      date: new Date().toISOString(),
      author: work.creator,
      likes: work.likes,
      views: work.views,
      comments: []
    }

    exportService.exportWork(exportableWork, exportOptions)
    setIsExportDialogOpen(false)
  }

  // 处理导出选项变更
  const handleExportOptionChange = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }))
  }

  if (!work) {
    return (
  
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="text-5xl text-gray-400 mb-4"><i className="far fa-image" /></div>
            <h2 className="text-xl font-semibold mb-2">未找到作品</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>请返回探索页选择其他作品</p>
            <button className="mt-6 px-4 py-2 rounded-lg bg-red-600 text-white" onClick={() => navigate('/explore')}>返回探索</button>
          </div>
        </main>
    )
  }

  return (
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center text-sm">
          <a href="/explore" className="hover:text-red-600 transition-colors">探索作品</a>
          <i className="fas fa-chevron-right text-xs mx-2 opacity-50" />
          <span className="opacity-70">{work.title}</span>
        </div>

        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className={`rounded-2xl shadow-md overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-6 order-2 lg:order-1">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-2xl font-bold">{work.title}</h1>
                <span className={`text-sm px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{work.category}</span>
              </div>
              <div className="flex items-center mb-4">
                <img src={work.creatorAvatar} alt="avatar" className="w-10 h-10 rounded-full mr-3 object-cover" />
                <div>
                  <div className="font-medium">{work.creator}</div>
                  <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>创作者</div>
                </div>
              </div>
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center"><i className={`far fa-heart mr-2 ${liked ? 'text-red-500' : ''}`} /><span>{likes}</span></div>
                <div className="flex items-center"><i className="far fa-comment mr-2" /><span>{work.comments}</span></div>
                <div className="flex items-center"><i className="far fa-eye mr-2" /><span>{work.views}</span></div>
              </div>
              <div className="mb-6">
                <div className="font-semibold mb-2">标签</div>
                <div className="flex flex-wrap gap-2">
                  {work.tags.map((t, i) => (
                    <span key={i} className={`text-sm px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={handleLike} className="px-4 py-2 rounded-lg bg-red-600 text-white">
                  {liked ? '取消点赞' : '点赞'}
                </button>
                <button onClick={handleBookmark} className={`px-4 py-2 rounded-lg ${bookmarked ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}`}>{bookmarked ? '已收藏' : '收藏'}</button>
                <button 
                  onClick={() => setIsARPreviewOpen(true)}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white flex items-center gap-2"
                >
                  <i className="fas fa-camera"></i>
                  AR预览
                </button>
                <button 
                  onClick={() => setIsExportDialogOpen(true)}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white flex items-center gap-2"
                >
                  <i className="fas fa-download"></i>
                  导出作品
                </button>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              {/* 中文注释：如果存在视频地址，展示视频播放器；否则展示图片 */}
              {work.videoUrl ? (
                <video
                  src={work.videoUrl}
                  poster={work.thumbnail}
                  controls
                  className="w-full h-full object-cover max-h-[520px]"
                />
              ) : (
                <img src={work.thumbnail} alt={work.title} className="w-full h-full object-cover max-h-[520px]" />
              )}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }} className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">相关作品</h2>
            <button className={`px-3 py-1.5 rounded-lg text-sm ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`} onClick={() => navigate('/explore')}>返回探索</button>
          </div>
          {related.length ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {related.map((w) => (
                <motion.div key={w.id} whileHover={{ scale: 1.02 }} className={`rounded-xl overflow-hidden cursor-pointer ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-200'}`} onClick={() => navigate(`/explore/${w.id}`)}>
                  <img src={w.thumbnail} alt={w.title} className="w-full h-28 object-cover" />
                  <div className="p-3">
                    <div className="text-sm font-medium truncate mb-1">{w.title}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate`}>{w.creator}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow`}>暂无同类作品</div>
          )}
        </motion.div>
        
        {/* AR预览组件 - 使用Suspense支持延迟加载 */}
        {isARPreviewOpen && (
          <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-white text-xl">加载AR预览中...</div>
          </div>}>
            <ARPreview
              config={{
                imageUrl: work?.thumbnail || '',
                type: '2d',
                scale: 1.0,
                rotation: { x: 0, y: 0, z: 0 },
                position: { x: 0, y: 0, z: 0 }
              }}
              onClose={() => setIsARPreviewOpen(false)}
            />
          </Suspense>
        )}

        {/* 导出选项对话框 */}
        {isExportDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
            <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-xl p-6 w-full max-w-md`}>
              <h2 className="text-xl font-bold mb-4">导出作品</h2>
              
              <div className="space-y-4">
                {/* 导出格式选择 */}
                <div>
                  <label className="block text-sm font-medium mb-2">导出格式</label>
                  <select 
                    value={exportOptions.format} 
                    onChange={(e) => handleExportOptionChange('format', e.target.value as ExportFormat)}
                    className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
                  >
                    <option value="png">PNG</option>
                    <option value="jpg">JPG</option>
                    <option value="svg">SVG</option>
                    <option value="pdf">PDF</option>
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                    <option value="text">纯文本</option>
                  </select>
                </div>

                {/* 分辨率选择 */}
                <div>
                  <label className="block text-sm font-medium mb-2">分辨率</label>
                  <select 
                    value={exportOptions.resolution}
                    onChange={(e) => handleExportOptionChange('resolution', e.target.value as 'low' | 'medium' | 'high')}
                    className={`w-full p-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>

                {/* 质量选择 */}
                {(exportOptions.format === 'jpg' || exportOptions.format === 'png') && (
                  <div>
                    <label className="block text-sm font-medium mb-2">质量: {Math.round((exportOptions.quality || 0.8) * 100)}%</label>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1" 
                      step="0.1"
                      value={exportOptions.quality}
                      onChange={(e) => handleExportOptionChange('quality', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {/* 包含元数据 */}
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="includeMetadata"
                    checked={exportOptions.includeMetadata}
                    onChange={(e) => handleExportOptionChange('includeMetadata', e.target.checked)}
                    className={`mr-2 ${isDark ? 'text-purple-500' : 'text-purple-600'}`}
                  />
                  <label htmlFor="includeMetadata" className="text-sm">包含元数据</label>
                </div>

                {/* 包含文化元素 */}
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="includeCulturalElements"
                    checked={exportOptions.includeCulturalElements}
                    onChange={(e) => handleExportOptionChange('includeCulturalElements', e.target.checked)}
                    className={`mr-2 ${isDark ? 'text-purple-500' : 'text-purple-600'}`}
                  />
                  <label htmlFor="includeCulturalElements" className="text-sm">包含文化元素</label>
                </div>
              </div>

              {/* 按钮组 */}
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setIsExportDialogOpen(false)}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                >
                  取消
                </button>
                <button 
                  onClick={handleExport}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                >
                  导出
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
  )
}
