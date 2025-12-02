import { useTheme } from '@/hooks/useTheme'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TianjinDivider, TianjinImage } from '@/components/TianjinStyleComponents'
import SidebarLayout from '@/components/SidebarLayout'

export default function About() {
  const { isDark } = useTheme()

  const values = [
    { title: '文化传承', icon: 'landmark', desc: '以现代方式演绎传统文化' },
    { title: '创意共创', icon: 'hands-helping', desc: '连接创作者与品牌共同创新' },
    { title: '低门槛工具', icon: 'tools', desc: '人人都能用的 AI 创作工具' },
    { title: '商业转化', icon: 'chart-line', desc: '让好创意走向真实商业场景' },
  ]

  return (
    <>
      <main className={`relative container mx-auto px-6 md:px-8 py-12`}>
        <div className="pointer-events-none absolute -top-10 -left-10 w-64 h-64 bg-gradient-to-br from-blue-500/20 via-red-500/20 to-yellow-500/20 blur-3xl rounded-full"></div>
        <div className="pointer-events-none absolute -bottom-10 -right-10 w-72 h-72 bg-gradient-to-tr from-red-500/15 via-yellow-500/15 to-blue-500/15 blur-3xl rounded-full"></div>
        <div className="max-w-7xl mx-auto space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">关于津脉智坊</h1>
            <div className="w-20 h-1 rounded-full bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500 mx-auto lg:mx-0 mb-4"></div>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-xl mx-auto lg:mx-0`}>
              我们致力于用 AI 赋能天津传统文化创新，让津门老字号焕发新生，连接创意与品牌，实现文化与商业的双向奔赴。
            </p>
          </div>
          <div className="hidden lg:block">
            <TianjinImage
              src="https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=landscape_16_9&prompt=Warm%20modern%20studio%20illustration%20of%20Tianjin%20cultural%20fusion%20with%20designers%20collaborating"
              alt="津门文化与现代设计融合"
              ratio="landscape"
              rounded="2xl"
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 * i }}
              whileHover={{ y: -3, scale: 1.01 }}
            >
              <div className="rounded-2xl p-[1px] bg-gradient-to-br from-blue-500/25 via-red-500/25 to-yellow-500/25">
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm backdrop-blur-sm`}> 
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-gray-700 ring-1 ring-gray-600' : 'bg-gray-100 ring-1 ring-gray-200'}`}>
                    <i className={`fas fa-${v.icon} text-xl ${isDark ? 'text-gray-200' : 'text-gray-700'}`}></i>
                  </div>
                  <h3 className="font-bold mb-1">{v.title}</h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>{v.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-2xl p-[1px] bg-gradient-to-br from-blue-500/20 via-red-500/20 to-yellow-500/20">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-sm`}> 
              <h2 className="text-xl font-bold mb-4">我们的使命</h2>
              <ul className={`space-y-3 ${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                <li className="flex items-center"><i className="fas fa-check text-green-500 mr-2"></i> 推动传统与现代的融合表达</li>
                <li className="flex items-center"><i className="fas fa-check text-green-500 mr-2"></i> 赋能创作者与品牌的共创</li>
                <li className="flex items-center"><i className="fas fa-check text-green-500 mr-2"></i> 打造低门槛的 AI 创作工具</li>
                <li className="flex items-center"><i className="fas fa-check text-green-500 mr-2"></i> 促进优秀创意的商业落地</li>
              </ul>
            </div>
          </div>
          <div className="rounded-2xl p-[1px] bg-gradient-to-br from-blue-500/20 via-red-500/20 to-yellow-500/20">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-sm`}> 
              <h2 className="text-xl font-bold mb-4">联系方式</h2>
              <ul className="space-y-3">
                <li className="flex items-center"><i className="fas fa-envelope mr-2"></i> contact@aicreate.com</li>
                <li className="flex items-center"><i className="fas fa-phone mr-2"></i> 400-123-4567</li>
                <li className="flex items-center"><i className="fas fa-map-marker-alt mr-2"></i> 北京市海淀区中关村大街</li>
              </ul>
              <div className="mt-6">
                <button className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}>发送邮件</button>
              </div>
            </div>
          </div>
        </div>
        </div>
        <TianjinDivider />
     </main>
      <footer className={`border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} py-6 px-4`}>
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            © 2025 AI共创平台. 保留所有权利
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/about" className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>隐私政策</Link>
            <Link to="/terms" className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>服务条款</Link>
            <Link to="/help" className={`${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'} transition-colors`}>帮助中心</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
