function ActiveData(first, active, after) {
  return {
    query: `query promotions($first: Int, $active: Boolean, $after: String){
      promotions(first: $first, active: $active, after: $after){
        edges {
          cursor
          node {
            name
            kindName
            kind
            doneTimes
            desc
            supplier
            id
            imageUrl
            items {
              id
              quantity
              unit
              specialPrice
              product {
                name
                price
                imageUrls
                inventory
                productUnits {
                  name
                  price
                  inventory
                }
              }
              amount
              gift {
                product {
                  name
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
          startCursor
        }
      }
}`,
    variables: {
      first: first, //分页,每次取多少条
      active: active,
      after: after,
    }
  }
}

module.exports = {
  ActiveData
}