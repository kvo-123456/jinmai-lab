import SidebarLayout from '@/components/SidebarLayout'
import { useTheme } from '@/hooks/useTheme'

export default function Help() {
  const { isDark } = useTheme()
  const faqs: Array<{ q: string; a: string }> = [
    { q: '如何开始使用 AI 创作工具？', a: '登录后进入“AI 创作工具”页面，选择模型与参数，按照向导完成创作流程。' },
    { q: '生成的内容是否可以商用？', a: '请确保素材与品牌授权合规。平台不自动提供第三方授权，需由用户自行确认与取得。' },
    { q: '账号安全如何保障？', a: '请勿泄露登录信息，启用强密码，并避免在公共设备保存登录状态。' },
    { q: '遇到问题如何反馈？', a: '可在页面右上角的反馈入口提交问题，或通过邮件联系平台支持。' },
  ]
  return (
      <main className="container mx-auto px-4 py-8">
        {/* 中文注释：帮助中心首页结构 */}
        <h1 className="text-2xl font-bold mb-3">帮助中心</h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6 text-sm`}>
          常见问题与使用指南，帮助你快速上手并高效创作。
        </p>

        {/* 中文注释：FAQ 列表 */}
        <section className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}>
          <ul className="space-y-5">
            {faqs.map((item, idx) => (
              <li key={idx}>
                <h2 className="font-medium">{item.q}</h2>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm mt-1`}>{item.a}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 中文注释：联系方式与支持通道 */}
        <section className="mt-6">
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}>
            <h2 className="font-medium mb-2">联系支持</h2>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
              邮件：support@jinmaizhifang.com
            </p>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
              电话：400-123-4567（工作日 9:00-18:00）
            </p>
          </div>
        </section>
      </main>
  )
}
