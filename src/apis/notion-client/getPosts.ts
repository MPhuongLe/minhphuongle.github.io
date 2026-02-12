import { CONFIG } from "site.config"
import { NotionAPI } from "notion-client"
import { idToUuid } from "notion-utils"

import getAllPageIds from "src/libs/utils/notion/getAllPageIds"
import getPageProperties from "src/libs/utils/notion/getPageProperties"
import { TPosts } from "src/types"

export const getPosts = async () => {
  let id = CONFIG.notionConfig.pageId as string
  const api = new NotionAPI()

  const response = await api.getPage(id)
  id = idToUuid(id)
  
  // FIX 1: Support nested collection value
  const collection = (Object.values(response.collection)[0] as any)?.value?.value 
    || Object.values(response.collection)[0]?.value
    
  const block = response.block
  const schema = collection?.schema

  // FIX 2: Support nested block value
  const rawMetadata = (block[id] as any)?.value?.value || block[id]?.value

  // Check Type
  if (
    rawMetadata?.type !== "collection_view_page" &&
    rawMetadata?.type !== "collection_view"
  ) {
    return []
  } else {
    const pageIds = getAllPageIds(response)
    const data = []
    for (let i = 0; i < pageIds.length; i++) {
      const id = pageIds[i]
      const properties = (await getPageProperties(id, block, schema)) || null
      
      // FIX 3: Support nested block value for individual pages
      const blockValue = (block[id] as any)?.value?.value || block[id]?.value

      properties.createdTime = new Date(
        blockValue?.created_time
      ).toString()
      properties.fullWidth =
        (blockValue?.format as any)?.page_full_width ?? false

      data.push(properties)
    }

    // Sort by date
    data.sort((a: any, b: any) => {
      const dateA: any = new Date(a?.date?.start_date || a.createdTime)
      const dateB: any = new Date(b?.date?.start_date || b.createdTime)
      return dateB - dateA
    })

    const posts = data as TPosts
    return posts
  }
}