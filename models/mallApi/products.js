function CategorypProduct(first, after, systemCategoryId,areaId,) {
  return {
    query: `query products($first: Int, $after: String,$systemCategoryId:String,$areaId:String){
      products(first: $first,after: $after,systemCategoryId:$systemCategoryId,areaId:$areaId){
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
      systemCategoryId: systemCategoryId,
      areaId: areaId,
    }
  }
}

function AllProducts(first, after, areaId) {
  return {
    query: `query products($first: Int, $after: String,$areaId:String){
      products(first: $first,after: $after,areaId: $areaId){
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
      areaId: areaId,
    }
  }
}

module.exports = {
  CategorypProduct,
  AllProducts
}