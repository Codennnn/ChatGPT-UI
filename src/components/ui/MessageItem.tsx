import type { Accessor } from 'solid-js'
import type { ChatMessage } from '@/types'
import MarkdownIt from 'markdown-it'
// @ts-ignore
import mdKatex from 'markdown-it-katex'
import mdHighlight from 'markdown-it-highlightjs'
import IconRefresh from './icons/Refresh'
import {Logo} from './Logo'

interface Props {
  role: ChatMessage['role']
  message: Accessor<string> | string
  showRetry?: Accessor<boolean>
  onRetry?: () => void
}

export default ({ role, message, showRetry, onRetry }: Props) => {
  const htmlString = () => {
    const md = MarkdownIt().use(mdKatex).use(mdHighlight)

    if (typeof message === 'function') {
      return md.render(message())
    } else if (typeof message === 'string') {
      return md.render(message)
    }
    return ''
  }

  return (
    <div class="">
      {role!=='user' && <div class="h-1px opacity-20" style={{
        background: 'linear-gradient(90deg, #010004 0%, #fff 50%, #010004 100%)'
      }} />}

      <div class="flex gap-6 py-10 rounded-lg">
        <div class={`shrink-0 flex items-center justify-center w-10 h-10 mt-3 select-none rounded-lg text-xs ${role === 'user' ? 'bg-#1b2429' : 'bg-#ccf5cf text-#010004 p-2'}`}>
          {role === 'user' 
          ? 'YOU'
          : <Logo/>
          }
        </div>
        <div class="message prose text-slate break-words overflow-hidden" innerHTML={htmlString()} />
      </div>

      {role!=='user' && <div class="h-1px opacity-20" style={{
        background: 'linear-gradient(90deg, #010004 0%, #fff 50%, #010004 100%)'
      }} />}

      { showRetry?.() && onRetry && (
        <div class="flex items-center justify-end px-3 mb-2">
          <div onClick={onRetry} class="flex items-center gap-1 px-2 py-0.5 op-70 border border-slate text-slate rounded-md text-sm cursor-pointer hover:bg-slate/10">
            <IconRefresh />
            <span>Regenerate</span>
          </div>
        </div>
      )}
    </div>
  )
}
