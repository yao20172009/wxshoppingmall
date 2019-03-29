function Notifications(first, after) {
  return {
    query: `query promotions($first: Int, $after: String){
      notifications(first:$first,after:$after){
        edges{
          node{
            action
            content
            createdAt
            coverImage
            data
            id
            modelId
            modelType
            read
            title
          }
        }
        pageInfo{
          hasNextPage
          endCursor
        }
      }
    }`,
    variables: {
      first: first, //分页,每次取多少条
      // read: read,
      after: after,
    }
  }
}

module.exports = {
  Notifications
}