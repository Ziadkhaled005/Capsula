export async function getOrder(id: string): Promise<Order> {
  let order: Order;

  // First, load the order using the normal order endpoint.
  try {
    const { data } = await apiClient.get(`/api/admin/orders/${encodeURIComponent(id)}`);

    const raw = unwrapApiResponse<BackendOrder>(data);
    order = mapBackendOrder(raw);

    // The order endpoint may return itemCount without the actual products.
    // If products are already present, no fallback request is needed.
    if (order.products.length > 0 || order.itemCount <= 0) {
      return order;
    }
  } catch (orderError) {
    // If the order endpoint fails, try the bid-detail endpoint below.
    try {
      const { data } = await apiClient.get(`/api/admin/bids/${encodeURIComponent(id)}`);

      const bid = unwrapApiResponse<BackendBid>(data);

      if (!bid || typeof bid !== "object") {
        throw orderError;
      }

      return mapBid(bid);
    } catch {
      throw orderError;
    }
  }

  // The order exists, but its response has no product rows.
  // Try the bid-detail endpoint and merge its products into the order.
  try {
    const { data } = await apiClient.get(`/api/admin/bids/${encodeURIComponent(id)}`);

    const bid = unwrapApiResponse<BackendBid>(data);

    if (!bid || typeof bid !== "object") {
      return order;
    }

    const items = getOrderItems(bid);

    if (items.length === 0) {
      return order;
    }

    return {
      ...order,
      products: items.map(mapProduct),
      itemCount: Number(bid.itemCount ?? order.itemCount),
    };
  } catch {
    // Preserve the order and its real status if the fallback is unavailable.
    return order;
  }
}
