import SidebarLayout from '@/components/SidebarLayout'
import { useTheme } from '@/hooks/useTheme'

export default function Terms() {
  const { isDark } = useTheme()
  return (
      <main className="container mx-auto px-4 py-8">
        {/* 中文注释：页面标题与说明 */}
        <h1 className="text-2xl font-bold mb-3">服务条款</h1>
        <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6 text-sm`}>
          为保障用户与平台权益，请在使用本平台前仔细阅读以下条款。
        </p>

        {/* 中文注释：条款列表结构化展示 */}
        <section className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-200'}`}>
          <ol className="list-decimal space-y-4 pl-5">
            <li>
              <h2 className="font-medium mb-1">账户与安全</h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                用户需妥善保管账户信息。因个人原因导致的账户泄露与损失由用户自行承担。
              </p>
            </li>
            <li>
              <h2 className="font-medium mb-1">内容与版权</h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                用户在平台发布的内容需遵守法律法规。涉及第三方素材与品牌时，请确保已取得授权。
              </p>
            </li>
            <li>
              <h2 className="font-medium mb-1">AI 生成内容使用</h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                平台提供的 AI 工具仅用于合法、合规的创作活动。对于生成内容的合规性，用户应自行评估与负责。
              </p>
            </li>
            <li>
              <h2 className="font-medium mb-1">数据与隐私</h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                我们重视隐私保护，遵循隐私政策处理您的个人数据。具体规则请参阅隐私政策页面。
              </p>
            </li>
            <li>
              <h2 className="font-medium mb-1">违规处理与终止服务</h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                对于违反平台规则的行为，平台有权采取限制、下架、封禁等措施，并保留追责权利。
              </p>
            </li>
          </ol>
          <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs mt-6`}>
            生效日期：2025-01-01
          </div>
        </section>
      </main>
  )
}
