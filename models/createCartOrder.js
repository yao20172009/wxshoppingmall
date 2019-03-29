function CreateCartOrder(input){
  return {
    operationName: "createCartOrders",
    query: `mutation createCartOrders($input: CartOrdersInput!) {
      createCartOrders(input: $input){
        orders {
          weixinpayParams
          supplier {
            id
            name
            industryName
          }
          rated
          status
          statusName
          cancelApplication{
            reason
            status
            statusDesc
            id
          }
          id
          no
          note
          address
          receiver
          phone
          deliveryTime
          amount
          originAmount
          gainedPoints
          items {
            id
            productId
            productName
            orderAmount
            originPrice
            quantity
            price
            unit
            product{
              imageUrls
              id
            }
            promotionProduct {
              id
              specialPrice
              unit
              product{
                id
                name
              }
              substitutions{
                id
                sales
                unit
                inventory
                specialPrice
                product{
                  id
                  name
                  imageUrls
                }
              }
            }
            promotionProductSub {
              id
              productUnitId
              specialPrice
              productId
              product{
                id
                name
                imageUrls
              }
            }
          }
          gifts {
            productName
            quantity
            unit
          }
          createdAt
          card{
            id
            kind
            name
            kindName
            reduceCost
          }
          cardDiscountAmount
        }
      }
    }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  CreateCartOrder
};