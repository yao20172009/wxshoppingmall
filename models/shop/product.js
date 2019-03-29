function Product(supplierId, first, after){
  return {
    query: `query supplierProducts($supplierId: String, $first: Int, $after: String){
      viewer {
        supplierProducts(supplierId: $supplierId, first: $first, after: $after) {
          edges {
            node {
              id
              name
              pkind
              kindName
              kindDesc
              promotionProduct {
                kind
                quantity
                amount
              }
              unit
              unitList {
                name
                price
              }
              price
            }
            cursor
          }
          pageInfo{
            hasNextPage
            startCursor
            endCursor
            hasPreviousPage
          }
          
        }
      }
    }`,
    variables: {
      supplierId: supplierId,
      first: first, //分页,每次取多少条
      after: after
    }
  }
}

module.exports = {
  Product
};