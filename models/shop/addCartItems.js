function AddCartItems(input) {
  return {
    operationName: "addCartItems",
    query: `mutation addCartItems($input: AddCartItemsInput!){
      addCartItems(input:$input){
        cartGroups{
          name
          items {
            id
            product{
              id
              name
            }
            quantity
            price
            unit
          }
          total
          originTotal
          supplier {
            name
            industryName
            id
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
  AddCartItems
};