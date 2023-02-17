import { Context, h, Logger, Schema } from 'koishi'
import { GetResponse } from './types'

export const name = 'bingchat'

const logger = new Logger(name)

export const usage = `
## 插件说明

本插件参考openchat插件编写，需要自行搭建后端才能运行。

[自建后端转发服务](https://github.com/D-Jy-lab/koishi-bingchat-server)，目前尚未存在手把手教程，有基本的 python 使用经验一般可以较为轻松的搭建。

因官方接口更新频繁导致经常失效所以单独分离出后端转发服务。
`

export interface Config {
  alias: string[],
  watingMsg?: boolean,
  endPoint: string
}

export const Config: Schema<Config> = Schema.object({
  alias: Schema.array(String).default(['bing', 'edgechat']).description('触发命令;别名'),
  watingMsg: Schema.boolean().description('等待响应前是否提示。').default(false),
  endPoint: Schema.string().description('服务器地址').default('http://127.0.0.1:8006/bing')
})

export function apply(ctx: Context, config: Config) {
  ctx.i18n.define('zh', require('./locales/zh'))

  const getRes = async (input: string): Promise<string> => {
    let res: GetResponse = await ctx.http.axios(config.endPoint, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 300000,
      data: {
        prompt: input
      }
    })
    if (res) return res.data['message']
    throw new Error()
  }

  const cmd = ctx.command(`${name} <提问内容:text>`)
    .alias(config.alias[0], config.alias[1])
    .action(async ({ session }, input) => {
      if (!input?.trim()) return session.execute(`help ${name}`)
      if (config.watingMsg) session.send(session.text('.wating'))
      try {
        await session.send(
          h('quote', { id: session.messageId }) + await getRes(input)
        )
      }
      catch { return session.text('.network-error') }
    })
}
