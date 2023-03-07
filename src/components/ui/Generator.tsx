import type { ChatMessage } from '@/types'
import { createSignal, Index, onMount } from 'solid-js'
import IconClear from './icons/Clear'
import MessageItem from './MessageItem'
import SystemRoleSettings from './SystemRoleSettings'

export default () => {
  let inputRef: HTMLTextAreaElement
  const [currentSystemRoleSettings, setCurrentSystemRoleSettings] = createSignal('')
  const [systemRoleEditing, setSystemRoleEditing] = createSignal(false)
  const [messageList, setMessageList] = createSignal<ChatMessage[]>([])
  const [currentAssistantMessage, setCurrentAssistantMessage] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [controller, setController] = createSignal<AbortController>(null)

  onMount(() => {
    window.document.addEventListener('keydown', function(ev) {
      if (ev.key === 'Enter') {
        if (document.activeElement !== inputRef) {
          ev.stopPropagation()
          ev.preventDefault()
          inputRef.focus()
        }
      }
    })
  })

  const handleButtonClick = async () => {
    const inputValue = inputRef.value
    if (!inputValue) {
      return
    }
    // @ts-ignore
    if (window?.umami) umami.trackEvent('chat_generate')
    inputRef.value = ''
    setMessageList([
      ...messageList(),
      {
        role: 'user',
        content: inputValue,
      },
    ])
    requestWithLatestMessage()
  }

  const requestWithLatestMessage = async () => {
    setLoading(true)
    setCurrentAssistantMessage('')
    try {
      const controller = new AbortController()
      setController(controller)
      const requestMessageList = [...messageList()]
      if (currentSystemRoleSettings()) {
        requestMessageList.unshift({
          role: 'system',
          content: currentSystemRoleSettings(),
        })
      }
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          messages: requestMessageList,
        }),
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(response.statusText)
      }
      const data = response.body
      if (!data) {
        throw new Error('No data')
      }
      const reader = data.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        if (value) {
          let char = decoder.decode(value)
          if (char === '\n' && currentAssistantMessage().endsWith('\n')) {
            continue
          }
          if (char) {
            setCurrentAssistantMessage(currentAssistantMessage() + char)
          }
          window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'})
        }
        done = readerDone
      }
    } catch (e) {
      console.error(e)
      setLoading(false)
      setController(null)
      return
    }
    archiveCurrentMessage()
  }

  const archiveCurrentMessage = () => {
    if (currentAssistantMessage()) {
      setMessageList([
        ...messageList(),
        {
          role: 'assistant',
          content: currentAssistantMessage(),
        },
      ])
      setCurrentAssistantMessage('')
      setLoading(false)
      setController(null)
      inputRef.focus()
    }
  }

  const clear = () => {
    // inputRef.value = ''
    // inputRef.style.height = 'auto';
    setMessageList([])
    setCurrentAssistantMessage('')
    setCurrentSystemRoleSettings('')
  }

  const stopStreamFetch = () => {
    if (controller()) {
      controller().abort()
      archiveCurrentMessage()
    }
  }

  const retryLastFetch = () => {
    if (messageList().length > 0) {
      const lastMessage = messageList()[messageList().length - 1]
      // console.log(lastMessage)
      if (lastMessage.role === 'assistant') {
        setMessageList(messageList().slice(0, -1))
        requestWithLatestMessage()
      }
    }
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.isComposing || e.shiftKey) {
      return
    }
    if (e.key === 'Enter') {
      handleButtonClick()
    }
  }

  return (
    <main>
      <div class="relative w-full md:w-800px md:max-w-screen mx-auto">
        <div class="md:py-10">
          {/* <SystemRoleSettings
            canEdit={() => messageList().length === 0}
            systemRoleEditing={systemRoleEditing}
            setSystemRoleEditing={setSystemRoleEditing}
            currentSystemRoleSettings={currentSystemRoleSettings}
            setCurrentSystemRoleSettings={setCurrentSystemRoleSettings}
          /> */}
          <Index each={messageList()}>
            {(message, index) => (
              <MessageItem
                role={message().role}
                message={message().content}
              />
            )}
          </Index>
          {currentAssistantMessage() && (
            <MessageItem
              role="assistant"
              message={currentAssistantMessage}
            />
          )}
        </div>

        <div class="sticky z-10 left-0 right-0 bottom-0 pb-2 md:pb-4 pt-25 px-3 md:px-15 after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-20 after:bg-#010004">
          <div
          class="absolute z-10 left-0 right-0 top-0 min-h-50"
          style={{
            background: 'linear-gradient(0, #010004 0%, rgb(1 0 5 / 80%) 60%, transparent 100%)'
          }} />

          <div
            class="relative z-10 flex items-center rounded-lg md:rounded-xl text-slate-500 outline-slate/20 outline focus-within:shadow-[0_0_25px_0px_rgba(100_116_139_/_0.6)] bg-#0c1013 overflow-hidden transition-all"
            class:op-50={systemRoleEditing()}
          >
            {loading()
              ? (
                <div class="relative w-full h-63.98px flex items-center">
                  <span class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10">
                    <svg version="1.1" id="L5" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
                      viewBox="0 0 100 100" enable-background="new 0 0 0 0">
                      <circle fill="currentcolor" stroke="none" cx="6" cy="50" r="6">
                        <animateTransform 
                          attributeName="transform" 
                          dur="1s" 
                          type="translate" 
                          values="0 15 ; 0 -15; 0 15" 
                          repeatCount="indefinite" 
                          begin="0.1"/>
                      </circle>
                      <circle fill="currentcolor" stroke="none" cx="30" cy="50" r="6">
                        <animateTransform 
                          attributeName="transform" 
                          dur="1s" 
                          type="translate" 
                          values="0 10 ; 0 -10; 0 10" 
                          repeatCount="indefinite" 
                          begin="0.2"/>
                      </circle>
                      <circle fill="currentcolor" stroke="none" cx="54" cy="50" r="6">
                        <animateTransform 
                          attributeName="transform" 
                          dur="1s" 
                          type="translate" 
                          values="0 5 ; 0 -5; 0 5" 
                          repeatCount="indefinite" 
                          begin="0.3"/>
                      </circle>
                    </svg>
                  </span>
                </div>
                )
              : (<>
              <textarea
                ref={inputRef!}
                disabled={loading() || systemRoleEditing()}
                onKeyDown={handleKeydown}
                placeholder="Write your question here..."
                autocomplete="off"
                autofocus
                onInput={() => {
                  inputRef.style.height = 'auto';
                  inputRef.style.height = inputRef.scrollHeight + 'px';
                }}
                rows="1"
                class="w-full min-h-12 max-h-60 py-5 px-4 bg-transparent resize-none focus:outline-none text-slate-400 placeholder:text-slate-500"
              />
              <button onClick={handleButtonClick} disabled={loading() || systemRoleEditing()} class="absolute right-0 bottom-2.8 flex items-center pl-2 pr-5 py-3 bg-#0c1013 transition-colors duration-200 hover:text-#ccf5cf text-sm text-current">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 10 20 15 15 20"></polyline><path d="M4 4v7a4 4 0 0 0 4 4h12"></path></svg>
                <span class="ml-2">ENTER</span>
                </button>
              </>)
            }
          </div>

          <div class="relative z-10 flex items-center py-2 justify-end">
            {messageList().length > 0 && (
              <button
                onClick={clear}
                disabled={loading() || systemRoleEditing()}
                class="px-2 py-1 bg-op-15 rounded-sm hover:text-#ccf5cf text-xs text-slate-500 transition-colors">
                Clear All
              </button>
            )
            }
            {loading()
            ? (
            <button
              class="px-2 py-1 bg-op-15 rounded-sm hover:text-#ccf5cf text-sm text-slate-500 transition-colors"
              onClick={stopStreamFetch}
            >Stop</button>
            )
            : messageList().at(-1)?.role === 'assistant'
            ? (
            <button
              class="px-2 py-1 bg-op-15 rounded-sm hover:text-#ccf5cf text-sm text-slate-500 transition-colors"
              onClick={retryLastFetch}
            >Regernate</button>
            )
            : null
            }
          </div>
        </div>
      </div>
    </main>
  )
}
