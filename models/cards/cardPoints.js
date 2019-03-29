function CardPoints(supplierId,first,after) {
  return {
    query: `query($supplierId: String!,$first: Int,$after:String) {
      cardPoints(supplierId:$supplierId,first:$first,after:$after){
        edges{
          node{
            id
            points
            card{
              id
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
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }`,
    variables: {
      clientMutationId: 0,
      supplierId: supplierId,
      first: first,
      after:after
    }
  }
}

function WithdrawableCards(supplierId, first, after) {
  return {
    query: `query($supplierId: String!,$first: Int,$after:String) {
      withdrawableCards(supplierId:$supplierId,first:$first,after:$after){
        edges{
          node{
            id
            issueAt
            code
            isSupplierFollow
            addCardParams {
              cardExt
              cardId
            }
            card{
              id
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
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
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
  CardPoints,
  WithdrawableCards
};