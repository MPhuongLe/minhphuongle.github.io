// ... (imports remain the same)

export const getPosts = async (): Promise<TPosts> => {
  try {
    // ... (fetchWithThrottle and id logic remain the same)

    let response;
    try {
      response = await fetchWithThrottle(() => api.getPage(id), "getPage");
    } catch (error) {
      console.error("❌ Notion 페이지 데이터를 가져오는 데 실패했습니다.", error);
      return [];
    }

    id = idToUuid(id);

    // --- FIX START: Unwrap nested collection ---
    const collectionObj = Object.values(response.collection || {})[0] as any;
    if (!collectionObj) {
      console.warn("⚠️ Notion 컬렉션 데이터가 없습니다.");
      return [];
    }
    // If collectionObj.value exists, use it; otherwise use collectionObj itself
    const collection = collectionObj.value ?? collectionObj;
    const block = response.block;
    const schema = collection?.schema;
    // --- FIX END ---

    if (!block[id]) {
      console.warn("⚠️ 페이지 블록 데이터가 존재하지 않습니다.");
      return [];
    }

    // --- FIX START: Unwrap nested block metadata ---
    const rawMetadata = block[id]?.value ?? block[id];
    
    // Check type on the unwrapped metadata
    if (!rawMetadata || !["collection_view_page", "collection_view"].includes(rawMetadata?.type)) {
      console.warn("⚠️ 올바르지 않은 Notion 페이지 타입입니다.");
      return [];
    }
    // --- FIX END ---

    let pageIds = getAllPageIds(response);
    // ... (batch fetching logic remains the same)

    const blocks = await fetchBlocksInBatches(pageIds);
    const data: TPosts = [];

    for (const pageId of pageIds) {
      if (!blocks[pageId]) continue;

      const properties = (await getPageProperties(pageId, blocks, schema)) || null;
      if (!properties) continue;

      // --- FIX START: Unwrap block for createdTime and fullWidth ---
      const blockValue = blocks[pageId]?.value ?? blocks[pageId];
      properties.createdTime = new Date(blockValue?.created_time || 0).toISOString();
      properties.fullWidth = (blockValue?.format as any)?.page_full_width ?? false;
      // --- FIX END ---

      data.push(properties);
    }

    data.sort((a, b) =>
        new Date(b.date?.start_date || b.createdTime).getTime() -
        new Date(a.date?.start_date || a.createdTime).getTime()
    );

    return data;
  } catch (error) {
    console.error("❌ getPosts() 전체 오류 발생:", error);
    return [];
  }
};