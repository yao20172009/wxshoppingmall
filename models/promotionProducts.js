function ActiveList(areaId, first, order, after, platformPromotionId) {
  return {
    query: `query promotionProducts($areaId:String,$first: Int, $after: String, $ order:ProductOrderParams,$platformPromotionId:String) {
      promotionProducts(areaId:$areaId,first:$first,after:$after,order:$order,platformPromotionId:$platformPromotionId){
    edges {
      cursor
      node {
				specialPrice
        sales
        quantity
        kind
        kindName
        kindDesc
        id
      	unit
        amount
        productId
        promotionId
        gift{
          name
          quantity
        }
        supplier{
          name
        }
        product{
					name
          price
          imageUrls
          inventory
          productUnits{
            name
            price
            inventory
          }
        }
      }
    }
    pageInfo{
      hasNextPage
      endCursor
      startCursor
    }
    }
  }`,
    variables: {
      first: first, //分页,每次取多少条
      after: after,
      order: order,
      areaId: areaId,
      platformPromotionId: platformPromotionId,
    }
  }
}

function ActiveDetaill(id) {
  return {
    query: `query promotionProduct($id: String!) {
      promotionProduct(id: $id) {
        specialPrice
        sales
        quantity
        kind
        kindName
        kindDesc
        id
        productId
        promotionId
        unit
        amount
        gift {
          name
          quantity
        }
        supplier {
          name
        }
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
      }
    }`,
    variables: {
      id:id
    }
  }
}

module.exports = {
  ActiveList,
  ActiveDetaill
}