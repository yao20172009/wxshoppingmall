const CartGroups = {
  query: `query {
    viewer {
      cartGroups {
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
          originPrice
          unit
          discount {
            discountAmount
            kindName
            product
          }
          gift {
            id
            kindName
            name
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
          paymentAuthorized
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
  }`
}

function CartGroup(id) {
  return {
    query: `query($id: String!) {
      viewer {
        cartGroup(id:$id){
          id
          items{
            id
            product {
              id
              name
            }
            quantity
            price
            originPrice
            unit
          }
        }
      }
    }`,
    variables: {
      clientMutationId: 0,
      id: id,
    }
  }
}

function DeleteCartItem(input) {
  return {
    query: `mutation deleteCartItem($input:DeleteCartItemInput!){
      deleteCartItem(input:$input){
        clientMutationId
        cartGroup{
          items{
            id
            product {
              id
              name
            }
            quantity
            price
            originPrice
            unit
          }
        }
      }
    }`,
    variables: {
      input: input
    }
  }
}

function AvailableCards(cartGroupId,) {
  return {
    query: `query($cartGroupId: String) {
      availableCards(cartGroupId: $cartGroupId) {
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
    }`,
    variables: {
      clientMutationId: 0,
      cartGroupId: cartGroupId,
    }
  }
}

function AvailableCardsItems(items) {
  return {
    query: `query($items: [SupplierOrderItem]) {
      availableCards(items:$items) {
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
    }`,
    variables: {
      clientMutationId: 0,
      items: items,
    }
  }
}
module.exports = {
  CartGroups,
  CartGroup,
  DeleteCartItem,
  AvailableCards,
  AvailableCardsItems
};