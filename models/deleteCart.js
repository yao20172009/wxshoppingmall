function DeleteCart(input) {
  return {
    operationName:"deleteCartGroup",
    query: `mutation deleteCartGroup($input:DeleteCartGroupInput!){
      deleteCartGroup(input:$input){
        clientMutationId
        status
      }
    }`,
    variables: {
      input: input
    }
  }
}

module.exports = {
  DeleteCart
};