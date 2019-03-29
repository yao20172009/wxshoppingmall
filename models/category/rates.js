function QueryRates(ratableId,first, after) {
  return {
    query: `query rates($ratableId: String!,$first: Int,$after:String){
      ratesCount(ratableId:$ratableId)
      rates(ratableId:$ratableId,first:$first,after:$after){
          edges{
            node{
              id
              value
              comment{
                id
                createdAt
                updatedAt
                content
                liked
                likersCount
                images{
                  id
                  imageableId
                  imageableType
                  key
                  url
                }
                replies{
                  edges{
                    node{
                      id
                      createdAt
                      content
                      fromSupplier
                      user{
                        id
                        name
                        avatar
                      }
                    }
                  }
                }
              }
              user{
                id
                avatar
                name
              }
            }
          }
          pageInfo{
            endCursor
            startCursor
            hasNextPage
          }
        }
    }`,
    variables: {
      ratableId: ratableId,
      first: first,
      after: after,
    }
  }
}

module.exports = {
  QueryRates
};