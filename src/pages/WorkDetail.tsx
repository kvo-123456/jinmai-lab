import { useMemo, useState, useEffect } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { motion } from 'framer-motion'
import SidebarLayout from '@/components/SidebarLayout'
import { useNavigate, useParams } from 'react-router-dom'
import { mockWorks } from '@/pages/Explore'
import ARPreview, { ARPreviewConfig } from '@/components/ARPreview'
import postsApi from '@/services/postService'

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

  if (!work) {
    return (
      <SidebarLayout>
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <div className="text-5xl text-gray-400 mb-4"><i className="far fa-image" /></div>
            <h2 className="text-xl font-semibold mb-2">未找到作品</h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>请返回探索页选择其他作品</p>
            <button className="mt-6 px-4 py-2 rounded-lg bg-red-600 text-white" onClick={() => navigate('/explore')}>返回探索</button>
          </div>
        </main>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout>
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
        
        {/* AR预览组件 */}
        {isARPreviewOpen && (
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
        )}
      </main>
    </SidebarLayout>
  )
}
