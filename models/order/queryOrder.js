function Order(id) {
  return {
    query: `query($id: String!) {
      viewer {
        id
        avatar
        order(id: $id) {
          paidAmount
          weixinpayParams
          supplier {
            id
            name
            industryName
          }
          rated
          rateSet{
            delivery
            service
            order{
              id
              value
              comment {
                id
                content
                images {
                  id
                  url
                  imageableId
                  imageableType
                  key
                }
                user{
                  id
                  name
                }
              }
            }
          }
          orderNotes{
            edges{
              node{
                id
                content
                user{
                  id
                  name
                  avatar
                }
              }
            }
          }
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
      clientMutationId: 0,
      id: id
    }
  }
}
module.exports = {
  Order
};