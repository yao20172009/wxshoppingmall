function UpdateCartItem(input){
  return {
    operationName: "updateCartItem",
    query: `mutation updateCartItem($input: UpdateCartItemInput!) {
      updateCartItem(input: $input) {
        cartGroup {
          id
          name
          items {
            id
            product {
              id
              name
            }
            quantity
            price
            unit
            discount {
              discountAmount
              kindName
              product
            }
            gift {
              id
              kindName
              product{
                id
                name
              }
              quantity
              unit
            }
          }
          total
          discountTotal
          originTotal
          supplier {
            name
            industryName
            id
          }
          availableCards {
            edges{
              node{
                id
                cardId
                card{
                  kind
                  kindName
                  name
                  leastCost
                  reduceCost
                  applyPromotion
                }
                code
                expireAt
              }
            }
          }
        }
      }
    }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  UpdateCartItem
};