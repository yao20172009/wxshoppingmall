function OrderStatus() {
  return {
    query: `query {
      orderStatus {
        key
        name
      }
    }`,
  }
}
module.exports = {
  OrderStatus
};