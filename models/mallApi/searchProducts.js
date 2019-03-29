function SearchProducts(first, after, q) {
  return {
    query: `query searchProducts($first: Int, $after: String,$q:String){
      searchProducts(first: $first,after: $after,q:$q){
        edges{
          node{     
            id
            name
            imageUrls
            price
            inventory
            lack
            supplier{
              id
              name
            }
            productUnits{
              id
              name
              price
              isDefault
              inventory
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
   }`,
    variables: {
      first: first, //分页,每次取多少条
      after: after,
      q: q,
    }
  }
}

module.exports = {
  SearchProducts
}