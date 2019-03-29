function ActiveList(areaId, first, order, after, platformPromotionId) {
  return {
    query: `query promotionProducts($areaId:String,$first: Int, $after: String, $ order:ProductOrderParams,$platformPromotionId:String) {
      promotionProducts(areaId:$areaId,first:$first,after:$after,order:$order,platformPromotionId:$platformPromotionId){
    edges {
      cursor
      node {
        cityOnly
        code
				specialPrice
        sales
        kind
        kindName
        kindDesc
        id
      	unit
        inventory
        coverImageUrl
        detailImageUrl
        promotionId
        boughtQuantity
        started
        ended
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
    currentTime
    currentPromotion(areaId:$areaId)  {
      id
      no
      name
      desc
      startTime
      endTime
      code
      imageUrl
      styles
    }
    nextPromotion(areaId:$areaId)  {
      id
      no
      name
      desc
      startTime
      endTime
      code
      imageUrl
      styles
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
        cityOnly
        specialPrice
        discountRate
        discountAmount
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
        started
        ended
        inventory
        startTime
        productionDate
        endTime
        supplier{
          name
          id
          shareReward {
            kind
            points
            percent
            both
          }
        }
        gift {
          name
          quantity
          unit
        }
        supplier {
          name
        }
        product {
          id
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
        customerLimit
        buyersCount
        boughtQuantity
        buyers{
          edges{
            node{
              id
              name
              phone
              avatar
            }
          }
        }
      }
      currentTime
      currentPromotion  {
        id
        no
        name
        desc
        startTime
        endTime
      }
      nextPromotion  {
        id
        no
        name
        desc
        startTime
        endTime
      }
    }`,
    variables: {
      id: id
    }
  }
}

module.exports = {
  ActiveList,
  ActiveDetaill
}