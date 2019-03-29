function ExchangeableCards(supplierId, first, after) {
  return {
    query: `query($supplierId: String!,$first: Int,$after:String) {
      supplier(id:$supplierId){
        exchangeableCards(first:$first,after:$after) {
          edges {
            node {
              id
              exchangePoints
              kind
              name
              kindName
              leastCost
              reduceCost
              inventory
              wxCardId
              applyPromotion
              createdAt
            }
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    }`,
    variables: {
      clientMutationId: 0,
      supplierId: supplierId,
      first: first,
      after: after
    }
  }
}

module.exports = {
  ExchangeableCards
};