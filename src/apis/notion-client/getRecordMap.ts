import { NotionAPI } from "notion-client"

export const getRecordMap = async (pageId: string) => {
  if (!pageId || typeof pageId !== "string" || pageId.trim() === "") {
    throw new Error(`Invalid notion pageId: "${pageId}"`)
  }

  const api = new NotionAPI()
  const recordMap = await api.getPage(pageId)
  
  // Validate response structure matches expected Notion API format
  if (!recordMap || typeof recordMap !== "object") {
    throw new Error(`Invalid Notion API response for pageId: "${pageId}"`)
  }

  return recordMap
}
